// solver.js - Saf, metre tabanlı kiriş çözücüsü
//
// Bu dosya DOM'a, tuvale ya da global uygulama durumuna dokunmaz. Girdi,
// model.js'teki dosya biçimiyle (sürüm 2) aynı yapıdaki metre cinsinden
// modeldir; çıktı tüm sonuçları (statik belirlilik, tepkiler, kesit tesirleri,
// kritik noktalar, bölge ifadeleri, denge denklemleri, elastik eğri) içeren
// tek bir nesnedir. Tarayıcıda global BeamSolver olarak, Node.js'te
// module.exports ile kullanılır (tests/, tools/).
//
// İşaret kuralları (veri biçimi ile uyumlu):
//   - Tekil yük: { magnitude, angle } — yön vektörü (cos, sin), y ekranda aşağı.
//     Düşey bileşen fy = -magnitude·sin(angle) (+ yukarı), yatay fx = magnitude·cos(angle) (+ sağa).
//   - Yayılı/trapez yük şiddeti: + yukarı, − aşağı (kN/m).
//   - Tekil moment (kuvvet çifti): + saat yönü.
//   - Tepkiler: Fy + yukarı, Fx + sağa, Mz + saat yönünün tersi.
//   - Kesit tesirleri (sol parçanın sağ yüzüne göre): N + çekme, V + (sol parçada
//     yukarı tepki → pozitif), M + alt lif çekme (sehim momenti), T + dış normal yönünde vektör.
//   - Sehim: + yukarı (mm).
//
// Mesnet tepkileri, ΣFy = 0, ΣM_p = 0 ve her mafsal için "mafsalın solundaki
// kuvvetlerin mafsala göre momenti = 0" denklemlerinden oluşan doğrusal
// sistemden bulunur. Böylece tek ya da çok mafsallı tüm izostatik kirişler
// aynı yöntemle çözülür; geometrik olarak labil sistemler tekil matrisle ayırt edilir.

const BeamSolver = (function () {
    const TOL = 1e-9;          // konum karşılaştırma toleransı (m)
    const NAME_TOL = 1e-6;     // aynı noktayı adlandırma toleransı (m)

    // ---------- Yardımcılar ----------

    function solveLinear(A, b) {
        const n = b.length;
        if (n === 0) return [];
        const M = A.map((row, i) => [...row, b[i]]);
        let scale = 0;
        A.forEach(r => r.forEach(v => { scale = Math.max(scale, Math.abs(v)); }));
        const tol = 1e-10 * Math.max(1, scale);
        for (let c = 0; c < n; c++) {
            let p = c;
            for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
            if (Math.abs(M[p][c]) < tol) return null;
            [M[c], M[p]] = [M[p], M[c]];
            for (let r = 0; r < n; r++) {
                if (r === c) continue;
                const f = M[r][c] / M[c][c];
                if (f === 0) continue;
                for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
            }
        }
        return M.map((row, i) => row[n] / row[i]);
    }

    const clean = (v) => (Math.abs(v) < 1e-10 ? 0 : v);
    const includes = (xp, x, side) => xp < x - TOL || (side > 0 && Math.abs(xp - x) <= TOL);

    function pointNameFromIndex(i) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return i < 26 ? letters[i] : letters[Math.floor(i / 26) - 1] + letters[i % 26];
    }

    // Polinom uydurma (yerel u = x - x0 koordinatında), n = derece + 1 nokta
    function fitPolynomial(f, x0, x1, degree) {
        const h = x1 - x0;
        const us = [];
        for (let i = 0; i <= degree; i++) us.push(h * (i + 1) / (degree + 2));
        const A = us.map(u => Array.from({ length: degree + 1 }, (_, k) => Math.pow(u, k)));
        const b = us.map(u => f(x0 + u));
        const c = solveLinear(A, b) || new Array(degree + 1).fill(0);
        const mag = Math.max(1, ...b.map(Math.abs));
        return c.map((v, k) => (Math.abs(v) * Math.pow(Math.max(h, 1), k) < 1e-9 * mag ? 0 : v));
    }

    // Yerel katsayıları (u = x - x0) küresel x katsayılarına çevirir
    function localToGlobal(c, x0) {
        const out = new Array(c.length).fill(0);
        const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
        for (let k = 0; k < c.length; k++) {
            for (let j = 0; j <= k; j++) out[j] += c[k] * binom(k, j) * Math.pow(-x0, k - j);
        }
        return out.map(clean);
    }

    function quadraticRoots(c, lo, hi) {
        // c0 + c1 u + c2 u² = 0, u ∈ (lo, hi)
        const [c0, c1, c2] = [c[0] || 0, c[1] || 0, c[2] || 0];
        const roots = [];
        if (Math.abs(c2) < 1e-12) {
            if (Math.abs(c1) > 1e-12) roots.push(-c0 / c1);
        } else {
            const d = c1 * c1 - 4 * c2 * c0;
            if (d >= 0) { const s = Math.sqrt(d); roots.push((-c1 + s) / (2 * c2), (-c1 - s) / (2 * c2)); }
        }
        return roots.filter(u => u > lo + 1e-7 && u < hi - 1e-7);
    }

    // ---------- Model normalizasyonu ----------

    function normalize(model) {
        const L = Number(model && model.beam && model.beam.length) || 0;
        const list = (k) => (Array.isArray(model[k]) ? model[k] : []);
        const supports = list('supports').map((s, i) => ({ type: s.type, x: Number(s.x), index: i })).sort((a, b) => a.x - b.x);
        const hinges = list('hinges').map((h, i) => ({ x: Number(h.x), index: i })).sort((a, b) => a.x - b.x);
        const points = list('concentratedLoads').map((l, i) => {
            const mag = Number(l.magnitude), ang = Number(l.angle);
            // Açıdaki kayan nokta artıkları (ör. 90° ≈ 1.5707963) sahte bileşen üretmesin
            const tiny = 1e-7 * Math.max(1, Math.abs(mag));
            let fy = -mag * Math.sin(ang), fx = mag * Math.cos(ang);
            if (Math.abs(fy) < tiny) fy = 0;
            if (Math.abs(fx) < tiny) fx = 0;
            return { x: Number(l.x), fy, fx, magnitude: mag, angle: ang, index: i };
        });
        const couples = list('concentratedMoments').map((m, i) => ({ x: Number(m.x), m: Number(m.magnitude), index: i }));
        const dists = [];
        list('distributedLoads').forEach((l, i) => {
            const s = Math.min(l.startX, l.endX), e = Math.max(l.startX, l.endX);
            if (e - s > TOL) dists.push({ s, e, w1: Number(l.magnitude), w2: Number(l.magnitude), kind: 'uniform', index: i });
        });
        list('trapezoidalLoads').forEach((l, i) => {
            const asc = l.startX <= l.endX;
            const s = Math.min(l.startX, l.endX), e = Math.max(l.startX, l.endX);
            if (e - s > TOL) dists.push({ s, e, w1: Number(asc ? l.startMagnitude : l.endMagnitude), w2: Number(asc ? l.endMagnitude : l.startMagnitude), kind: 'trapezoidal', index: i });
        });
        const torsions = list('torsionMoments').map((t, i) => ({ x: Number(t.x), t: Number(t.magnitude), index: i }));
        return { L, supports, hinges, points, couples, dists, torsions };
    }

    const wAt = (d, x) => d.w1 + (d.w2 - d.w1) * (x - d.s) / (d.e - d.s);

    // [d.s, b] aralığındaki kısmın bileşkesi ve orijine göre birinci momenti
    function distPortion(d, b) {
        const e = Math.min(b, d.e);
        if (e <= d.s) return { force: 0, firstMoment: 0, s: d.s, e: d.s };
        const len = e - d.s, ws = d.w1, we = wAt(d, e);
        return { force: (ws + we) / 2 * len, firstMoment: len * (ws * (2 * d.s + e) + we * (d.s + 2 * e)) / 6, s: d.s, e };
    }

    // Yüklerin (tepkiler hariç) kesme ve moment katkısı (sol parça, x kesitinde)
    function loadShear(n, x, side) {
        let v = 0;
        n.points.forEach(p => { if (includes(p.x, x, side)) v += p.fy; });
        n.dists.forEach(d => { if (x > d.s) v += distPortion(d, x).force; });
        return v;
    }

    function loadMoment(n, x, side) {
        let m = 0;
        n.points.forEach(p => { if (includes(p.x, x, side)) m += p.fy * (x - p.x); });
        n.couples.forEach(c => { if (includes(c.x, x, side)) m += c.m; });
        n.dists.forEach(d => { if (x > d.s) { const q = distPortion(d, x); m += q.force * x - q.firstMoment; } });
        return m;
    }

    function qAt(n, x) {
        let q = 0;
        n.dists.forEach(d => { if (x >= d.s - TOL && x <= d.e + TOL) q += wAt(d, Math.min(Math.max(x, d.s), d.e)); });
        return q;
    }

    // ---------- Statik belirlilik ----------

    function classify(n) {
        const st = { kind: 'isostatic', solvable: true, reason: null, params: {}, degree: 0 };
        const pins = n.supports.filter(s => s.type === 'pin-support').length;
        const rollers = n.supports.filter(s => s.type === 'roller-support').length;
        const fixed = n.supports.filter(s => s.type === 'fixed-support').length;
        const nh = n.hinges.length;
        const nV = pins + rollers + 2 * fixed, eV = 2 + nh;
        const nH = pins + fixed;
        const r = nV + nH, e = 3 + nh;
        const hasAxial = n.points.some(p => Math.abs(p.fx) > 1e-9);
        Object.assign(st.params, { r, e, nh, degree: r - e });
        const fail = (kind, reason, extra = {}) => Object.assign(st, { kind, reason, solvable: false }, { params: { ...st.params, ...extra } });

        if (!(n.L > 0)) return fail('empty', 'statusNoBeam');
        if (n.supports.length === 0) return fail('unstable', 'statusNoSupports');
        if (n.supports.some(s => s.x < -TOL || s.x > n.L + TOL)) return fail('unstable', 'statusSupportOutside');
        if (n.hinges.some(h => h.x <= TOL || h.x >= n.L - TOL)) return fail('unstable', 'statusHingeAtEnd');
        for (let i = 1; i < n.supports.length; i++) if (n.supports[i].x - n.supports[i - 1].x < TOL * 10) return fail('unstable', 'statusCoincidentSupports', { x: n.supports[i].x });
        for (let i = 1; i < n.hinges.length; i++) if (n.hinges[i].x - n.hinges[i - 1].x < TOL * 10) return fail('unstable', 'statusCoincidentHinges', { x: n.hinges[i].x });
        if (nV < eV) return fail('unstable', 'statusMechanism');
        if (nH === 0) return fail('unstable', 'statusNoHorizontal');
        if (!hasAxial) {
            // Yatay yük yoksa ΣFx = 0 özdeş olarak sağlanır ve yatay tepkiler sıfırdır.
            // Ders kitabı (Gerber) yaklaşımı: yalnızca düşey tepkiler ve ankastre momentleri
            // bilinmeyen sayılır; denklemler ΣFy, ΣM ve mafsal koşullarıdır. Böylece ör. iki
            // ankastreli, iki mafsallı kiriş (asılı orta parça + iki konsol) izostatiktir.
            Object.assign(st.params, { r: nV, e: eV, degree: nV - eV, vertical: true });
            if (nV > eV) { st.degree = nV - eV; return fail('hyperstatic', 'statusHyperstatic', { degree: nV - eV }); }
            return st;   // tekil matris → geometrik labil (hesap sırasında)
        }
        if (nV > eV) { st.degree = r - e; return fail('hyperstatic', 'statusHyperstatic', { degree: r - e }); }
        // Yatay yük varken birden fazla yatay tutucu: eksenel tepkiler belirlenemez
        if (nH > 1) { st.degree = nH - 1; return fail('hyperstatic', 'statusHorizontalHyperstatic', { degree: nH - 1 }); }
        return st;
    }

    // ---------- Noktalar (adlandırma) ----------

    function buildNamedPoints(n) {
        const xs = [0, n.L];
        n.supports.forEach(s => xs.push(s.x));
        n.hinges.forEach(h => xs.push(h.x));
        n.points.forEach(p => xs.push(p.x));
        n.couples.forEach(c => xs.push(c.x));
        n.torsions.forEach(t => xs.push(t.x));
        n.dists.forEach(d => xs.push(d.s, d.e));
        const sorted = xs.filter(x => x >= -TOL && x <= n.L + TOL).sort((a, b) => a - b);
        const uniq = [];
        sorted.forEach(x => { if (!uniq.length || x - uniq[uniq.length - 1] > NAME_TOL) uniq.push(Math.min(Math.max(x, 0), n.L)); });
        return uniq.map((x, i) => ({ x, name: pointNameFromIndex(i) }));
    }

    // ---------- Denge denklemleri ----------

    // Bilinmeyenler: her mesnet için Fy, ankastre için ayrıca Mz.
    function buildUnknowns(n, nameOf) {
        const unknowns = [];
        n.supports.forEach((s, si) => {
            const nm = nameOf(s.x);
            unknowns.push({ key: `Fy${si}`, support: si, comp: 'Fy', name: `${nm}_y`, x: s.x });
            if (s.type === 'fixed-support') unknowns.push({ key: `Mz${si}`, support: si, comp: 'Mz', name: `M_${nm}`, x: s.x });
        });
        return unknowns;
    }

    function loadTermsVertical(n) {
        const terms = [];
        n.points.forEach(p => { if (Math.abs(p.fy) > 1e-12) terms.push({ kind: 'point', index: p.index, x: p.x, force: p.fy, value: p.fy }); });
        n.dists.forEach(d => {
            const q = distPortion(d, d.e);
            if (Math.abs(q.force) > 1e-12) terms.push({ kind: d.kind, index: d.index, s: d.s, e: d.e, w1: d.w1, w2: d.w2, force: q.force, xc: q.firstMoment / q.force, value: q.force });
        });
        return terms;
    }

    // Noktaya (p) göre saat yönünün tersi pozitif moment terimleri; limit: yalnızca x < limit (mafsal denklemi)
    function loadTermsMoment(n, p, limit) {
        const terms = [];
        const inRange = (x) => limit === undefined || x < limit - TOL;
        n.points.forEach(q => {
            if (Math.abs(q.fy) > 1e-12 && inRange(q.x) && Math.abs(q.x - p) > TOL) terms.push({ kind: 'point', index: q.index, x: q.x, force: q.fy, arm: q.x - p, value: q.fy * (q.x - p) });
        });
        n.couples.forEach(c => { if (inRange(c.x)) terms.push({ kind: 'couple', index: c.index, x: c.x, moment: c.m, value: -c.m }); });
        n.dists.forEach(d => {
            const b = limit === undefined ? d.e : Math.min(d.e, limit);
            if (b <= d.s + TOL) return;
            const q = distPortion(d, b);
            const value = q.firstMoment - q.force * p;
            if (Math.abs(q.force) < 1e-12 && Math.abs(value) < 1e-12) return;
            const xc = Math.abs(q.force) > 1e-12 ? q.firstMoment / q.force : null;
            terms.push({ kind: d.kind, index: d.index, s: d.s, e: b, partial: b < d.e - TOL, w1: d.w1, w2: wAt(d, b), force: q.force, xc, arm: xc === null ? null : xc - p, value });
        });
        return terms;
    }

    function buildEquations(n, unknowns, nameOf) {
        const eqs = [];
        // ΣFy = 0
        eqs.push({
            kind: 'sumFy',
            unknownTerms: unknowns.map(u => ({ key: u.key, name: u.name, coef: u.comp === 'Fy' ? 1 : 0 })).filter(t => t.coef !== 0),
            loadTerms: loadTermsVertical(n)
        });
        // ΣM_p = 0 (p: ilk mesnet)
        const p = n.supports.length ? n.supports[0].x : 0;
        eqs.push({
            kind: 'sumM', about: { x: p, name: nameOf(p) },
            unknownTerms: unknowns.map(u => ({ key: u.key, name: u.name, coef: u.comp === 'Fy' ? u.x - p : 1, arm: u.comp === 'Fy' ? u.x - p : null })).filter(t => Math.abs(t.coef) > TOL),
            loadTerms: loadTermsMoment(n, p)
        });
        // Mafsallar: ΣM_h(sol) = 0
        n.hinges.forEach(h => {
            eqs.push({
                kind: 'hinge', about: { x: h.x, name: nameOf(h.x) },
                unknownTerms: unknowns.filter(u => u.x < h.x - TOL).map(u => ({ key: u.key, name: u.name, coef: u.comp === 'Fy' ? u.x - h.x : 1, arm: u.comp === 'Fy' ? u.x - h.x : null })).filter(t => Math.abs(t.coef) > TOL),
                loadTerms: loadTermsMoment(n, h.x, h.x)
            });
        });
        return eqs;
    }

    // ---------- Elastik eğri ----------

    const GAUSS = [[-Math.sqrt(3 / 5), 5 / 9], [0, 8 / 9], [Math.sqrt(3 / 5), 5 / 9]];

    function elasticCurve(n, Mfun, xs, EI) {
        // F(x) = ∫∫M, G(x) = ∫M (x = 0'dan); her parça için y = (F + a_k x + b_k)/EI
        const G = [0], F = [0];
        for (let i = 1; i < xs.length; i++) {
            const x0 = xs[i - 1], x1 = xs[i], h = x1 - x0;
            let gi = 0, fi = 0;
            if (h > 0) GAUSS.forEach(([t, w]) => {
                const x = x0 + h * (1 + t) / 2, m = Mfun(x);
                gi += w * m * h / 2; fi += w * (x1 - x) * m * h / 2;
            });
            G.push(G[i - 1] + gi);
            F.push(F[i - 1] + G[i - 1] * h + fi);
        }
        const idxOf = (x) => { let best = 0; xs.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(xs[best] - x)) best = i; }); return best; };
        const hingeXs = n.hinges.map(h => h.x);
        const segOf = (x) => hingeXs.filter(h => h < x - TOL).length;
        const nSeg = hingeXs.length + 1, nu = 2 * nSeg;
        const rows = [], rhs = [];
        const row = () => new Array(nu).fill(0);
        n.supports.forEach(s => {
            const i = idxOf(s.x), k = segOf(s.x), r = row();
            r[2 * k] = s.x; r[2 * k + 1] = 1; rows.push(r); rhs.push(-F[i]);
            if (s.type === 'fixed-support') { const r2 = row(); r2[2 * k] = 1; rows.push(r2); rhs.push(-G[i]); }
        });
        hingeXs.forEach((h, j) => {
            const r = row(); r[2 * j] = h; r[2 * j + 1] = 1; r[2 * (j + 1)] = -h; r[2 * (j + 1) + 1] = -1; rows.push(r); rhs.push(0);
        });
        if (rows.length !== nu) return null;
        const c = solveLinear(rows, rhs);
        if (!c) return null;
        const toMM = 1000 / EI;
        return xs.map((x, i) => {
            const k = segOf(x);
            return { x, y: (F[i] + c[2 * k] * x + c[2 * k + 1]) * toMM, slope: (G[i] + c[2 * k]) / EI };
        });
    }

    // ---------- Ana çözüm ----------

    /**
     * @param {object} model - metre cinsinden model (model.js sürüm 2 yapısı)
     * @param {{ E?: number, I?: number, samples?: number }} [options] E: GPa, I: cm⁴
     */
    function analyze(model, options = {}) {
        const n = normalize(model);
        const E = options.E > 0 ? options.E : 200, I = options.I > 0 ? options.I : 100000;
        const samples = options.samples || 50;
        const EI = E * I * 0.01; // kNm²
        const status = classify(n);
        const named = buildNamedPoints(n);
        const nameOf = (x) => { const p = named.find(q => Math.abs(q.x - x) <= NAME_TOL * 10); return p ? p.name : `x=${x.toFixed(2)}`; };
        const result = { L: n.L, status, points: named, nameOf, EI, E, I, normalized: n, solved: false };
        if (!status.solvable) return result;

        // Düşey tepkiler
        const unknowns = buildUnknowns(n, nameOf);
        const equations = buildEquations(n, unknowns, nameOf);
        const A = equations.map(eq => unknowns.map(u => { const t = eq.unknownTerms.find(q => q.key === u.key); return t ? t.coef : 0; }));
        const b = equations.map(eq => -eq.loadTerms.reduce((s, t) => s + t.value, 0));
        const sol = solveLinear(A, b);
        if (!sol) {
            Object.assign(status, { kind: 'unstable', solvable: false, reason: 'statusGeometric' });
            return result;
        }
        unknowns.forEach((u, i) => { u.value = clean(sol[i]); });

        // Yatay tepki
        const hasAxial = n.points.some(p => Math.abs(p.fx) > 1e-9);
        const horizontalSupports = n.supports.filter(s => s.type !== 'roller-support');
        const sumFx = n.points.reduce((s, p) => s + p.fx, 0);
        const reactions = n.supports.map((s, si) => {
            const fy = unknowns.find(u => u.key === `Fy${si}`);
            const mz = unknowns.find(u => u.key === `Mz${si}`);
            const nm = nameOf(s.x);
            const isAxialSupport = horizontalSupports.length === 1 && s === horizontalSupports[0];
            return { x: s.x, type: s.type, name: nm, index: s.index, Fy: fy ? fy.value : 0, Mz: mz ? mz.value : 0, Fx: isAxialSupport ? clean(-sumFx) : 0 };
        });
        if (hasAxial) {
            equations.unshift({
                kind: 'sumFx',
                unknownTerms: reactions.filter(r => r.type !== 'roller-support').map(r => ({ key: `Fx_${r.name}`, name: `${r.name}_x`, coef: 1 })),
                loadTerms: n.points.filter(p => Math.abs(p.fx) > 1e-12).map(p => ({ kind: 'point', index: p.index, x: p.x, force: p.fx, value: p.fx }))
            });
        }

        // Kesit tesiri fonksiyonları (side: -1 sol limit, +1 sağ limit)
        const V = (x, side = 1) => { let v = loadShear(n, x, side); reactions.forEach(r => { if (includes(r.x, x, side)) v += r.Fy; }); return clean(v); };
        const M = (x, side = 1) => {
            let m = loadMoment(n, x, side);
            reactions.forEach(r => { if (includes(r.x, x, side)) m += r.Fy * (x - r.x) - r.Mz; });
            return clean(m);
        };
        const N = (x, side = 1) => {
            let s = 0;
            n.points.forEach(p => { if (includes(p.x, x, side)) s += p.fx; });
            reactions.forEach(r => { if (includes(r.x, x, side)) s += r.Fx; });
            return clean(-s);
        };
        const q = (x) => qAt(n, x);

        // Burulma
        let torsion = null, torsionReaction = null, T = null;
        if (n.torsions.length) {
            const fixed = n.supports.filter(s => s.type === 'fixed-support');
            if (fixed.length === 0) torsion = { warning: 'warnTorsionNeedsFixed' };
            else if (fixed.length > 1) torsion = { warning: 'warnTorsionHyperstatic' };
            else {
                torsionReaction = { x: fixed[0].x, name: nameOf(fixed[0].x), Mx: clean(-n.torsions.reduce((s, t) => s + t.t, 0)) };
                T = (x, side = 1) => {
                    let s = 0;
                    n.torsions.forEach(t => { if (includes(t.x, x, side)) s += t.t; });
                    if (includes(torsionReaction.x, x, side)) s += torsionReaction.Mx;
                    return clean(-s);
                };
            }
        }

        // Olay noktaları ve bölgeler
        const eventXs = named.map(p => p.x);
        const segments = [];
        const zeroShear = [];
        for (let i = 1; i < eventXs.length; i++) {
            const x0 = eventXs[i - 1], x1 = eventXs[i], h = x1 - x0;
            if (h <= NAME_TOL) continue;
            const Vl = fitPolynomial(x => V(x), x0, x1, 2);
            const Ml = fitPolynomial(x => M(x), x0, x1, 3);
            const ql = fitPolynomial(x => q(x), x0, x1, 1);
            const seg = {
                x0, x1, from: nameOf(x0), to: nameOf(x1),
                V: { local: Vl, global: localToGlobal(Vl, x0) },
                M: { local: Ml, global: localToGlobal(Ml, x0) },
                q: { local: ql, global: localToGlobal(ql, x0) },
                N: hasAxial && horizontalSupports.length === 1 ? N((x0 + x1) / 2) : 0
            };
            segments.push(seg);
            quadraticRoots(Vl, 0, h).forEach(u => zeroShear.push(x0 + u));
        }

        // Kritik noktalar
        const critical = named.map(p => ({ x: p.x, name: p.name, kind: 'event', Vl: V(p.x, -1), Vr: V(p.x, 1), Ml: M(p.x, -1), Mr: M(p.x, 1) }));
        zeroShear.forEach(x => critical.push({ x, name: null, kind: 'zeroShear', Vl: 0, Vr: 0, Ml: M(x), Mr: M(x) }));
        critical.sort((a, b) => a.x - b.x);
        // Kiriş uçlarının dışı (x<0 sol limit, x>L sağ limit) her zaman sıfırdır
        if (critical.length) { critical[0].Vl = 0; critical[0].Ml = 0; const last = critical[critical.length - 1]; last.Vr = 0; last.Mr = 0; }

        // Örnek noktalar
        const xsSet = [...eventXs, ...zeroShear];
        if (n.L > 0) for (let i = 0; i <= samples; i++) xsSet.push(i * n.L / samples);
        const xs = [...new Set(xsSet.map(x => Math.round(x * 1e9) / 1e9))].filter(x => x >= 0 && x <= n.L).sort((a, b) => a - b);

        const pairPoints = (f, fallbackZeroEnds = true) => {
            const pts = [];
            xs.forEach((x, i) => {
                let l = f(x, -1), r = f(x, 1);
                if (fallbackZeroEnds && i === 0) l = 0;
                if (fallbackZeroEnds && i === xs.length - 1) r = 0;
                pts.push({ x, y: l });
                if (Math.abs(r - l) > 1e-9) pts.push({ x, y: r });
            });
            return pts;
        };
        const shearPoints = pairPoints(V);
        const momentPoints = pairPoints(M);
        const curve = elasticCurve(n, (x) => M(x), xs, EI);
        const elasticCurvePoints = curve ? curve.map(p => ({ x: p.x, y: clean(p.y) })) : xs.map(x => ({ x, y: 0 }));

        let axial = null;
        if (hasAxial && horizontalSupports.length === 1) axial = { L: n.L, points: pairPoints(N) };
        let torsionDiagram = torsion;
        if (T) torsionDiagram = { L: n.L, points: pairPoints(T) };

        // Ekstremumlar
        const ext = (pts, pick) => pts.reduce((best, p) => (best === null || pick(p.y, best.value) ? { x: p.x, value: p.y } : best), null);
        const critVals = (key) => critical.flatMap(c => [{ x: c.x, y: c[key + 'l'] }, { x: c.x, y: c[key + 'r'] }]);
        const extremes = {
            Vmax: ext(critVals('V'), (a, b) => a > b + 1e-12), Vmin: ext(critVals('V'), (a, b) => a < b - 1e-12),
            Mmax: ext(critVals('M'), (a, b) => a > b + 1e-12), Mmin: ext(critVals('M'), (a, b) => a < b - 1e-12),
            dmax: curve ? ext(elasticCurvePoints, (a, b) => Math.abs(a) > Math.abs(b) + 1e-15) : null
        };

        const hingeForces = n.hinges.map(h => ({ x: h.x, name: nameOf(h.x), V: V(h.x, -1), N: N(h.x, -1) }));

        return Object.assign(result, {
            solved: true, hasAxial, reactions, torsionReaction, hingeForces, equations, unknowns,
            V, M, N, T, q, segments, critical, extremes,
            diagrams: { L: n.L, shearPoints, momentPoints, elasticCurvePoints },
            axial, torsion: torsionDiagram,
            deflectionAt: curve ? (x) => {
                for (let i = 1; i < curve.length; i++) if (x <= curve[i].x) { const a = curve[i - 1], c = curve[i]; const t = c.x > a.x ? (x - a.x) / (c.x - a.x) : 0; return a.y + (c.y - a.y) * t; }
                return curve[curve.length - 1].y;
            } : null
        });
    }

    /**
     * Kesim yöntemi: x kesitinde sol (side='left') ya da sağ parçanın dengesi.
     * Döndürür: parçadaki dış kuvvet/tepki terimleri ve iç kuvvetler (N, V, M; burulma
     * çözülmüşse T). Burulma terimleri mx alanındadır (+ vektör +x yönünde).
     */
    function section(res, x, part = 'left') {
        const n = res.normalized;
        const isLeft = part === 'left';
        const inPart = (xp) => (isLeft ? xp < x - TOL : xp > x + TOL);
        const forces = [];
        res.reactions.forEach(r => {
            if (!inPart(r.x)) return;
            if (Math.abs(r.Fy) > 1e-12) forces.push({ kind: 'reactionFy', name: `${r.name}_y`, x: r.x, fy: r.Fy });
            if (Math.abs(r.Fx) > 1e-12) forces.push({ kind: 'reactionFx', name: `${r.name}_x`, x: r.x, fx: r.Fx });
            if (Math.abs(r.Mz) > 1e-12) forces.push({ kind: 'reactionMz', name: `M_${r.name}`, x: r.x, mz: r.Mz });
        });
        n.points.forEach(p => { if (inPart(p.x)) forces.push({ kind: 'point', index: p.index, x: p.x, fy: p.fy, fx: p.fx }); });
        n.couples.forEach(c => { if (inPart(c.x)) forces.push({ kind: 'couple', index: c.index, x: c.x, mz: -c.m }); });
        const hasTorsion = !!res.T && n.torsions.length > 0;
        if (hasTorsion) {
            n.torsions.forEach(t => { if (inPart(t.x) && Math.abs(t.t) > 1e-12) forces.push({ kind: 'torsion', index: t.index, x: t.x, mx: t.t }); });
            const tr = res.torsionReaction;
            if (tr && inPart(tr.x) && Math.abs(tr.Mx) > 1e-12) forces.push({ kind: 'reactionMx', name: `T_${tr.name}`, x: tr.x, mx: tr.Mx });
        }
        n.dists.forEach(d => {
            const a = isLeft ? d.s : Math.max(d.s, x), b = isLeft ? Math.min(d.e, x) : d.e;
            if (b <= a + TOL) return;
            const full = distPortion(d, b), pre = distPortion(d, a);
            const force = full.force - pre.force, fm = full.firstMoment - pre.firstMoment;
            if (Math.abs(force) < 1e-12 && Math.abs(fm) < 1e-12) return;
            forces.push({ kind: d.kind, index: d.index, s: a, e: b, w1: wAt(d, a), w2: wAt(d, b), fy: force, xc: Math.abs(force) > 1e-12 ? fm / force : null, firstMoment: fm });
        });
        // Kesitteki iç kuvvetler: sol parça için (sağ yüz) N, V, M; sağ parça için aynı büyüklükler
        // (etki–tepki) — işaret kuralı her iki parçada aynı kalır.
        const side = isLeft ? -1 : 1;
        const Vx = res.V(x, side), Mx = res.M(x, side), Nx = res.N(x, side);
        // Denklem terimleri (sayısal)
        const sumFy = forces.reduce((s, f) => s + (f.fy || 0), 0);
        const sumFx = forces.reduce((s, f) => s + (f.fx || 0), 0);
        const sumMx = forces.reduce((s, f) => s + (f.mx || 0), 0);
        // Burulma: T > 0, vektörü kesit yüzünden dışarı (sol parçada +x, sağ parçada −x)
        const Tx = hasTorsion ? res.T(x, side) : null;
        let sumM = 0; // kesit noktasına göre, saat yönünün tersi +
        forces.forEach(f => {
            if (f.fy !== undefined && f.xc !== undefined && f.kind !== 'point' && f.kind !== 'reactionFy') sumM += f.firstMoment - f.fy * x;
            else if (f.fy !== undefined) sumM += f.fy * (f.x - x);
            if (f.mz !== undefined) sumM += f.mz;
        });
        return { x, part, forces, N: Nx, V: Vx, M: Mx, T: Tx, hasTorsion, sumFx: clean(sumFx), sumFy: clean(sumFy), sumM: clean(sumM), sumMx: clean(sumMx) };
    }

    /**
     * Gerber kirişinin ders kitabı yöntemiyle parça parça çözümü (yalnızca gösterim için;
     * tepkiler analyze() ile zaten bulunur). Kiriş ara mafsallardan parçalara ayrılır.
     * Bilinmeyen sayısı 2 olan (kendi mesnet tepkileri + henüz bilinmeyen mafsal kuvvetleri)
     * parça önce çözülür: mafsallara oturan "asılı" parça basit kiriş gibi çözülür; bulunan
     * mafsal kuvveti etki–tepki ilkesiyle komşu "taşıyıcı" parçaya ters yönde yük olarak
     * aktarılır ve sıra ona gelir.
     * Mesnet, tekil yük ya da kuvvet çifti tam mafsal üzerindeyse (yorum belirsizliği) null döner.
     * @returns {{ parts: object[], hingeForces: number[] }|null}
     *   hingeForces[i]: i. mafsalda SOL parçaya etkiyen düşey kuvvet (+ yukarı); sağ parçaya −'si etkir
     */
    function gerberParts(res) {
        if (!res || !res.solved) return null;
        const n = res.normalized;
        if (!n.hinges.length) return null;
        const hx = n.hinges.map(h => h.x);
        const atHinge = (x) => hx.some(h => Math.abs(h - x) < 1e-7);
        if (n.supports.some(s => atHinge(s.x)) || n.points.some(q => atHinge(q.x) && Math.abs(q.fy) > 1e-12) || n.couples.some(c => atHinge(c.x))) return null;

        const bounds = [0, ...hx, n.L];
        const parts = bounds.slice(0, -1).map((a, i) => ({ a, b: bounds[i + 1], index: i, from: res.nameOf(a), to: res.nameOf(bounds[i + 1]) }));
        const inPart = (x, prt) => (x > prt.a + TOL && x < prt.b - TOL) || (prt.a === 0 && Math.abs(x) <= TOL) || (prt.b === n.L && Math.abs(x - n.L) <= TOL);
        parts.forEach(prt => {
            prt.supports = n.supports.filter(sp => inPart(sp.x, prt));
            prt.own = prt.supports.reduce((k, sp) => k + (sp.type === 'fixed-support' ? 2 : 1), 0);
        });
        const hingeF = hx.map(() => null);

        // Parçadaki yük terimleri: p noktasına göre moment (↺ +) ve düşey kuvvet
        const partLoads = (prt, pivot) => {
            const mTerms = [], fTerms = [];
            n.points.forEach(q => {
                if (!inPart(q.x, prt) || Math.abs(q.fy) < 1e-12) return;
                fTerms.push({ kind: 'point', index: q.index, x: q.x, force: q.fy, value: q.fy });
                if (Math.abs(q.x - pivot) > TOL) mTerms.push({ kind: 'point', index: q.index, x: q.x, force: q.fy, arm: q.x - pivot, value: q.fy * (q.x - pivot) });
            });
            n.couples.forEach(c => { if (inPart(c.x, prt)) mTerms.push({ kind: 'couple', index: c.index, x: c.x, moment: c.m, value: -c.m }); });
            n.dists.forEach(d => {
                const a = Math.max(d.s, prt.a), b = Math.min(d.e, prt.b);
                if (b <= a + TOL) return;
                const full = distPortion(d, b), pre = distPortion(d, a);
                const force = full.force - pre.force, fm = full.firstMoment - pre.firstMoment;
                if (Math.abs(force) < 1e-12 && Math.abs(fm) < 1e-12) return;
                const xc = Math.abs(force) > 1e-12 ? fm / force : null;
                const base = { kind: d.kind, index: d.index, s: a, e: b, partial: a > d.s + TOL || b < d.e - TOL, w1: wAt(d, a), w2: wAt(d, b), force, xc };
                fTerms.push({ ...base, value: force });
                mTerms.push({ ...base, arm: xc === null ? null : xc - pivot, value: fm - force * pivot });
            });
            // Daha önce çözülen komşu parçadan aktarılan mafsal kuvvetleri (ters yönde)
            [[prt.index - 1, 'left'], [prt.index, 'right']].forEach(([h, side]) => {
                if (h < 0 || h >= hx.length || hingeF[h] === null) return;
                const f = side === 'right' ? hingeF[h] : -hingeF[h];
                if (Math.abs(f) < 1e-12) return;
                const from = side === 'right' ? parts[h + 1] : parts[h];
                const t = { kind: 'hinge', sym: `V_${res.nameOf(hx[h])}`, x: hx[h], force: f, fromPart: `${from.from}–${from.to}` };
                fTerms.push({ ...t, value: f });
                if (Math.abs(hx[h] - pivot) > TOL) mTerms.push({ ...t, arm: hx[h] - pivot, value: f * (hx[h] - pivot) });
            });
            return { mTerms, fTerms };
        };

        let step = 0;
        for (let guard = 0; guard < parts.length + 2 && step < parts.length; guard++) {
            let progressed = false;
            for (const prt of parts) {
                if (prt.solved) continue;
                const unknownH = [];
                if (prt.index > 0 && hingeF[prt.index - 1] === null) unknownH.push({ h: prt.index - 1, side: 'left' });
                if (prt.index < hx.length && hingeF[prt.index] === null) unknownH.push({ h: prt.index, side: 'right' });
                if (prt.own + unknownH.length !== 2) continue;
                const unknowns = [];
                prt.supports.forEach(sp => {
                    const nm = res.nameOf(sp.x);
                    unknowns.push({ key: `Fy@${sp.x}`, name: `${nm}_y`, x: sp.x, comp: 'Fy' });
                    if (sp.type === 'fixed-support') unknowns.push({ key: `Mz@${sp.x}`, name: `M_${nm}`, x: sp.x, comp: 'Mz' });
                });
                unknownH.forEach(u => unknowns.push({ key: `H${u.h}`, name: `V_${res.nameOf(hx[u.h])}`, x: hx[u.h], comp: 'Fy', hinge: u.h, side: u.side }));
                const pivot = (unknowns.find(u => u.comp === 'Fy') || unknowns[0]).x;
                const { mTerms, fTerms } = partLoads(prt, pivot);
                const eqM = {
                    kind: 'sumM', about: { x: pivot, name: res.nameOf(pivot) },
                    unknownTerms: unknowns.map(u => ({ key: u.key, name: u.name, coef: u.comp === 'Fy' ? u.x - pivot : 1, arm: u.comp === 'Fy' ? u.x - pivot : null })).filter(t => Math.abs(t.coef) > TOL),
                    loadTerms: mTerms
                };
                const eqF = { kind: 'sumFy', unknownTerms: unknowns.filter(u => u.comp === 'Fy').map(u => ({ key: u.key, name: u.name, coef: 1 })), loadTerms: fTerms };
                const eqs = [eqM, eqF];
                const A = eqs.map(eq => unknowns.map(u => { const t = eq.unknownTerms.find(q => q.key === u.key); return t ? t.coef : 0; }));
                const rhs = eqs.map(eq => -eq.loadTerms.reduce((acc, t) => acc + t.value, 0));
                const sol = solveLinear(A, rhs);
                if (!sol) return null;
                unknowns.forEach((u, i) => {
                    u.value = clean(sol[i]);
                    if (u.hinge !== undefined) hingeF[u.hinge] = u.side === 'right' ? u.value : -u.value;
                });
                // Daha önce çözülen komşulardan aktarılan mafsal kuvvetleri (sıfır olanlar dahil, gösterim için)
                const transfers = [[prt.index - 1, 'left'], [prt.index, 'right']]
                    .filter(([h]) => h >= 0 && h < hx.length && !unknownH.some(u => u.h === h))
                    .map(([h, side]) => { const from = side === 'right' ? parts[h + 1] : parts[h]; return { sym: `V_${res.nameOf(hx[h])}`, x: hx[h], force: clean(side === 'right' ? hingeF[h] : -hingeF[h]), fromPart: `${from.from}–${from.to}` }; });
                Object.assign(prt, { solved: true, step: step++, role: unknownH.length ? 'suspended' : 'carrier', unknowns, equations: eqs, transfers });
                progressed = true;
            }
            if (!progressed) return null;
        }
        if (step < parts.length) return null;
        return { parts: [...parts].sort((p1, p2) => p1.step - p2.step), hingeForces: hingeF.map(clean) };
    }

    return { analyze, section, gerberParts, classify: (model) => classify(normalize(model)), solveLinear, TOL };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BeamSolver;

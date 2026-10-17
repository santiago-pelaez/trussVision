// tests/run-tests.js
// calculations.js içindeki saf statik hesap fonksiyonları için birim testleri.
// Çalıştırma: node tests/run-tests.js
//
// calculations.js tarayıcı globalleri kullandığından, dosya bir vm bağlamında
// gerekli stub'larla yüklenir ve fonksiyonlar doğrudan çağrılır.
// Koordinat sistemi: 10 px = 1 m (toMeters = px / 10), kiriş 0 px'ten başlar.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- vm bağlamı: calculations.js'in ihtiyaç duyduğu globaller ---
const sandbox = {
    console,
    // Uygulama durumu (testler sırasında yeniden atanır)
    beam: { startX: 0, endX: 100, startY: 0 },
    supports: [],
    hinges: [],
    concentratedLoads: [],
    distributedLoads: [],
    trapezoidalLoads: [],
    concentratedMoments: [],
    torsionMoments: [],
    // Sabitler / yardımcılar (setup.js karşılıkları)
    EPSILON: 1e-9,
    COLORS: { LOAD: '#d9534f', BEAM_STROKE: '#389fb6', REACTION: '#5cb85c', GRID: '#eee' },
    diagramData: { normal: {}, shear: {}, moment: {}, torsion: {}, elasticCurve: {} },
    calculatedReactions: [],
    calculatedMomentReaction: 0,
    calculatedAxialReaction: null,
    normalForceChart: null,
    torsionChart: null,
    elasticityInput: { value: '200' },
    momentOfInertiaInput: { value: '100000' },
    metersPerGridInput: { value: '0.1' },
    gridSizeInput: { value: '10' },
    kNPerGridInput: { value: '2' },
    getGridSize: () => 10,
    getMetersPerGrid: () => 0.1,
    getKNPerGrid: () => 2,
    getConversionFunctions: () => ({ toMeters: (px) => px / 10, toPixels: (m) => m * 10 }),
    // Hesap katmanı çizim yapmamalı: çizim fonksiyonları çağrılırsa test düşer.
    // document, Chart, translations bilerek tanımlı değil (erişim ReferenceError verir).
    drawFreeBodyDiagram: () => { throw new Error('calculations.js çizim yaptı (drawFreeBodyDiagram)'); },
    drawDiagrams: () => { throw new Error('calculations.js çizim yaptı (drawDiagrams)'); },
    upsertLineChart: () => { throw new Error('calculations.js çizim yaptı (upsertLineChart)'); },
    showCalcWarning: () => {},
};
sandbox.globalThis = sandbox;
const context = vm.createContext(sandbox);

const load = (f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), context, { filename: f });
load('vetin/solver.js');
load('vetin/calculations.js');
// model.js'in saf dönüştürücüleri (serializeModel / deserializeModel) de aynı bağlamda test edilir
load('vetin/model.js');
vm.runInContext(
    'globalThis.__fns = { BeamSolver, isSystemStable, getSystemStatus, calculateAxialReaction, analyzeBeam, getCurrentModelMeters, serializeModel, deserializeModel };',
    context
);
const fns = sandbox.__fns;
const S = fns.BeamSolver;

// --- Mini test çerçevesi ---
let passed = 0, failed = 0;
function approx(actual, expected, tol, label) {
    const ok = Math.abs(actual - expected) <= tol;
    if (ok) { passed++; console.log(`  PASS  ${label}  (${actual.toFixed(6)} ≈ ${expected})`); }
    else { failed++; console.error(`  FAIL  ${label}  beklenen ${expected}, bulunan ${actual}`); }
}
function check(cond, label) {
    if (cond) { passed++; console.log(`  PASS  ${label}`); }
    else { failed++; console.error(`  FAIL  ${label}`); }
}
function resetState() {
    sandbox.beam = { startX: 0, endX: 100, startY: 0 };
    sandbox.supports = [];
    sandbox.hinges = [];
    sandbox.concentratedLoads = [];
    sandbox.distributedLoads = [];
    sandbox.trapezoidalLoads = [];
    sandbox.concentratedMoments = [];
    sandbox.torsionMoments = [];
}

// Metre cinsinden model kurucu: sup = [['pin-support', 0], ...]
const model = (L, sup, extra = {}) => Object.assign({
    beam: { length: L }, supports: sup.map(([type, x]) => ({ type, x })), hinges: [],
    concentratedLoads: [], distributedLoads: [], trapezoidalLoads: [], concentratedMoments: [], torsionMoments: []
}, extra);
const P = (x, F, deg = 90) => ({ x, magnitude: F, angle: deg * Math.PI / 180 });   // 90° = aşağı
const R = (res, x) => res.reactions.find(r => Math.abs(r.x - x) < 1e-9);
const EI = 200 * 100000 * 0.01; // varsayılan E=200 GPa, I=100000 cm⁴ → kNm²

// =====================================================================
console.log('\n1) Basit kiriş, tekil yük (L=10, P=10 kN @3 m)');
{
    const r = S.analyze(model(10, [['pin-support', 0], ['roller-support', 10]], { concentratedLoads: [P(3, 10)] }));
    check(r.status.kind === 'isostatic' && r.solved, 'İzostatik ve çözüldü');
    approx(R(r, 0).Fy, 7, 1e-9, 'A_y = 7 kN');
    approx(R(r, 10).Fy, 3, 1e-9, 'B_y = 3 kN');
    approx(r.V(3, -1), 7, 1e-9, 'V(3⁻) = 7');
    approx(r.V(3, 1), -3, 1e-9, 'V(3⁺) = −3 (tekil yükte sıçrama)');
    approx(r.extremes.Mmax.value, 21, 1e-9, 'M_max = Pab/L = 21 kNm');
    approx(r.deflectionAt(3), -10 * 3 * 3 * 7 * 7 / (3 * EI * 10) * 1000, 1e-6, 'δ(3) = −Pa²b²/(3EIL)');
}

// =====================================================================
console.log('\n2) Konsol, düzgün yayılı yük (w=2 kN/m aşağı → magnitude −2, L=10)');
{
    const r = S.analyze(model(10, [['fixed-support', 0]], { distributedLoads: [{ startX: 0, endX: 10, magnitude: -2 }] }));
    approx(R(r, 0).Fy, 20, 1e-9, 'A_y = wL = 20 kN');
    approx(R(r, 0).Mz, 100, 1e-9, 'M_A = +100 kNm (saat yönünün tersi)');
    approx(r.M(0, 1), -100, 1e-9, 'M(0⁺) = −wL²/2');
    approx(r.deflectionAt(10), -2 * 1e4 / (8 * EI) * 1000, 1e-3, 'δ(L) = −wL⁴/8EI');
    const up = S.analyze(model(10, [['fixed-support', 0]], { distributedLoads: [{ startX: 0, endX: 10, magnitude: 2 }] }));
    approx(R(up, 0).Fy, -20, 1e-9, 'Yukarı yük (+2): A_y = −20 kN');
}

// =====================================================================
console.log('\n3) Sağdan ankastre konsol, uçta P=10 kN (L=4)');
{
    const r = S.analyze(model(4, [['fixed-support', 4]], { concentratedLoads: [P(0, 10)] }));
    approx(R(r, 4).Fy, 10, 1e-9, 'B_y = 10');
    approx(R(r, 4).Mz, -40, 1e-9, 'M_B = −40 (saat yönü)');
    approx(r.M(4, -1), -40, 1e-9, 'M(L⁻) = −PL');
    approx(r.deflectionAt(0), -10 * 64 / (3 * EI) * 1000, 1e-6, 'δ(0) = −PL³/3EI');
}

// =====================================================================
console.log('\n4) Üçgen yük (0→6 kN/m, L=10): V=0 noktasında M_max');
{
    const r = S.analyze(model(10, [['pin-support', 0], ['roller-support', 10]], { trapezoidalLoads: [{ startX: 0, endX: 10, startMagnitude: 0, endMagnitude: -6 }] }));
    approx(R(r, 0).Fy, 10, 1e-9, 'A_y = 10');
    approx(R(r, 10).Fy, 20, 1e-9, 'B_y = 20');
    const z = r.critical.find(c => c.kind === 'zeroShear');
    check(!!z, 'V = 0 noktası kritik noktalarda');
    approx(z.x, 10 / Math.sqrt(3), 1e-9, 'x(V=0) = L/√3');
    approx(r.extremes.Mmax.value, 6 * 100 / (9 * Math.sqrt(3)), 1e-9, 'M_max = w₀L²/(9√3)');
    check(r.segments[0].V.global.length === 3 && Math.abs(r.segments[0].V.global[2] + 0.3) < 1e-9, 'V(x) = 10 − 0.3x² (bölge ifadesi)');
}

// =====================================================================
console.log('\n5) Tekil moment (M=10 kNm saat yönü @5, L=10)');
{
    const r = S.analyze(model(10, [['pin-support', 0], ['roller-support', 10]], { concentratedMoments: [{ x: 5, magnitude: 10 }] }));
    approx(R(r, 0).Fy, -1, 1e-9, 'A_y = −M/L');
    approx(r.M(5, -1), -5, 1e-9, 'M(5⁻) = −5');
    approx(r.M(5, 1), 5, 1e-9, 'M(5⁺) = +5 (sıçrama)');
}

// =====================================================================
console.log('\n6) Çıkmalı kiriş (A=0, B=6, uç P=10 @8)');
{
    const r = S.analyze(model(8, [['pin-support', 0], ['roller-support', 6]], { concentratedLoads: [P(8, 10)] }));
    approx(R(r, 0).Fy, -10 / 3, 1e-9, 'A_y = −3.333');
    approx(R(r, 6).Fy, 40 / 3, 1e-9, 'B_y = 13.333');
    approx(r.M(6), -20, 1e-9, 'M_B = −20');
    approx(r.deflectionAt(8), -10 * 4 * 8 / (3 * EI) * 1000, 1e-6, 'Uç sehimi −Pa²(L+a)/3EI');
}

// =====================================================================
console.log('\n7) Eksenel kuvvet işareti: çekme +');
{
    const r = S.analyze(model(10, [['pin-support', 0], ['roller-support', 10]], { concentratedLoads: [P(5, 10, 0)] }));
    approx(r.N(2.5), 10, 1e-9, 'Sabit mesnet solda, sağa 10 kN → N(0..5) = +10 (çekme)');
    approx(R(r, 0).Fx, -10, 1e-9, 'A_x = −10 kN');
    const r2 = S.analyze(model(10, [['roller-support', 0], ['pin-support', 10]], { concentratedLoads: [P(5, 10, 0)] }));
    approx(r2.N(7.5), -10, 1e-9, 'Sabit mesnet sağda → N(5..10) = −10 (basınç)');
    check(r.axial.points.some(p => p.x > 0 && p.x < 5 && Math.abs(p.y - 10) < 1e-9), 'EKD noktaları +10');
    approx(S.section(r, 2.5, 'left').N, 10, 1e-9, 'Kesim yöntemi N = diyagram N');
}

// =====================================================================
console.log('\n8) Burulma işareti');
{
    const r = S.analyze(model(3, [['fixed-support', 0]], { torsionMoments: [{ x: 2, magnitude: 5 }], concentratedLoads: [P(1, 1)] }));
    approx(r.T(1), 5, 1e-9, 'Ankastre solda, +5 @2 → T(0..2) = +5');
    approx(r.torsionReaction.Mx, -5, 1e-9, 'Burulma tepkisi −5');
    const r2 = S.analyze(model(3, [['fixed-support', 3]], { torsionMoments: [{ x: 1, magnitude: 5 }], concentratedLoads: [P(1, 1)] }));
    approx(r2.T(2), -5, 1e-9, 'Ankastre sağda → T(1..3) = −5');
}

// =====================================================================
console.log('\n9) Gerber: ankastre solda (elastik eğri)');
{
    const r = S.analyze(model(8, [['fixed-support', 0], ['roller-support', 8]], { hinges: [{ x: 4 }], distributedLoads: [{ startX: 0, endX: 8, magnitude: -2 }] }));
    approx(R(r, 8).Fy, 4, 1e-9, 'C_y = 4');
    approx(R(r, 0).Fy, 12, 1e-9, 'A_y = 12');
    approx(R(r, 0).Mz, 32, 1e-9, 'M_A = 32');
    approx(r.M(4, -1), 0, 1e-9, 'Mafsalda M = 0');
    approx(r.deflectionAt(8), 0, 1e-9, 'Kayıcı mesnette sehim 0');
    approx(r.deflectionAt(4), -0.74667, 1e-4, 'δ(mafsal) = −0.7467 mm');
    approx(r.deflectionAt(6), -0.40667, 1e-4, 'δ(6) = −0.4067 mm');
    const m = S.analyze(model(8, [['roller-support', 0], ['fixed-support', 8]], { hinges: [{ x: 4 }], distributedLoads: [{ startX: 0, endX: 8, magnitude: -2 }] }));
    approx(m.deflectionAt(0), 0, 1e-9, 'Ayna sistem: kayıcıda sehim 0');
    approx(m.deflectionAt(4), -0.74667, 1e-4, 'Ayna sistem: δ(mafsal) aynı');
}

// =====================================================================
console.log('\n10) Çok mafsallı Gerber');
{
    const r = S.analyze(model(4, [['fixed-support', 0], ['fixed-support', 4]], { hinges: [{ x: 1 }, { x: 3 }], concentratedLoads: [P(2, 10)] }));
    check(r.solved && r.status.kind === 'isostatic', 'İki ankastre + iki mafsal, yatay yük yok → izostatik (düşey sayım r = 4 = 2 + 2)');
    approx(R(r, 0).Fy, 5, 1e-9, 'A_y = 5');
    approx(r.M(1, -1), 0, 1e-9, 'Mafsal 1: M = 0');
    approx(r.M(3, -1), 0, 1e-9, 'Mafsal 2: M = 0');
    approx(r.deflectionAt(0), 0, 1e-9, 'Ankastrede sehim 0');
    const r3 = S.analyze(model(10, [['fixed-support', 0], ['roller-support', 5], ['roller-support', 10]], { hinges: [{ x: 3 }, { x: 7 }], distributedLoads: [{ startX: 0, endX: 10, magnitude: -1 }] }));
    check(r3.solved, 'Ankastre + 2 kayıcı + 2 mafsal çözüldü');
    approx(r3.V(10, 1), 0, 1e-9, 'Denge: V(L⁺) = 0');
    approx(r3.M(3, -1), 0, 1e-9, 'M(mafsal 1) = 0');
    approx(r3.M(7, -1), 0, 1e-9, 'M(mafsal 2) = 0');
    approx(r3.deflectionAt(5), 0, 1e-9, 'Ara mesnette sehim 0');
    approx(r3.deflectionAt(10), 0, 1e-9, 'Uç mesnette sehim 0');
}

// =====================================================================
console.log('\n10b) Asılı orta parçalı Gerber: elle çözüm (basit kiriş + mafsal kuvvetleri konsollara)');
{
    // Orta parça B–F (mafsallar) basit kiriş gibi çözülür; mafsal kuvvetleri ankastre konsollara aktarılır.
    const cases = [
        { name: 'model_10 (2 tekil yük + saat yönünde 4 kNm)', L: 4, h1: 1, h2: 3, P: [[1.5, 2], [2.5, 2]], C: [[2, 4]], q: [] },
        { name: 'yayılı yük tüm boyda', L: 6, h1: 1.5, h2: 4.5, P: [], C: [], q: [[0, 6, 3]] },
        { name: 'konsollarda da yük', L: 8, h1: 2, h2: 5, P: [[1, 4], [3, 6], [7, 5]], C: [[4, -3]], q: [[5, 8, 2]] }
    ];
    cases.forEach(cs => {
        const r = S.analyze(model(cs.L, [['fixed-support', 0], ['fixed-support', cs.L]], {
            hinges: [{ x: cs.h1 }, { x: cs.h2 }],
            concentratedLoads: cs.P.map(([x, F]) => P(x, F)),
            concentratedMoments: cs.C.map(([x, m]) => ({ x, magnitude: m })),
            distributedLoads: cs.q.map(([s, e, w]) => ({ startX: s, endX: e, magnitude: -w }))
        }));
        // Elle: orta parça (h1–h2) — ΣM_h1 = 0 (↺ +, aşağı yük +F) → R2, ΣFy → R1
        const a = cs.h1, b = cs.h2, l = b - a;
        let F = 0, Mh1 = 0;   // orta parçadaki aşağı yükler ve h1'e göre saat yönü momentleri
        cs.P.forEach(([x, f]) => { if (x > a && x < b) { F += f; Mh1 += f * (x - a); } });
        cs.C.forEach(([x, m]) => { if (x > a && x < b) Mh1 += m; });
        cs.q.forEach(([s, e, w]) => { const s2 = Math.max(s, a), e2 = Math.min(e, b); if (e2 > s2) { F += w * (e2 - s2); Mh1 += w * (e2 - s2) * ((s2 + e2) / 2 - a); } });
        const R2 = Mh1 / l, R1 = F - R2;
        // Sol konsol (0–h1): mafsalda aşağı R1 + kendi yükleri
        let FA = R1, MA = R1 * a;
        cs.P.forEach(([x, f]) => { if (x < a) { FA += f; MA += f * x; } });
        cs.C.forEach(([x, m]) => { if (x < a) MA += m; });
        cs.q.forEach(([s, e, w]) => { const e2 = Math.min(e, a); if (e2 > s) { FA += w * (e2 - s); MA += w * (e2 - s) * (s + e2) / 2; } });
        // Sağ konsol (h2–L)
        let FG = R2;
        cs.P.forEach(([x, f]) => { if (x > b) FG += f; });
        cs.q.forEach(([s, e, w]) => { const s2 = Math.max(s, b); if (e > s2) FG += w * (e - s2); });
        check(r.solved && r.status.kind === 'isostatic', `${cs.name}: izostatik ve çözüldü`);
        approx(r.hingeForces[0].V, R1, 1e-9, `${cs.name}: sol mafsaldaki kesme = orta parça sol tepkisi (${R1.toFixed(3)} kN)`);
        approx(R(r, 0).Fy, FA, 1e-9, `${cs.name}: A_y (sol konsol)`);
        approx(R(r, 0).Mz, MA, 1e-9, `${cs.name}: M_A (sol konsol, ↺ +)`);
        approx(R(r, cs.L).Fy, FG, 1e-9, `${cs.name}: G_y (sağ konsol)`);
        approx(r.M(a, -1), 0, 1e-9, `${cs.name}: M(mafsal 1) = 0`);
        approx(r.M(b, -1), 0, 1e-9, `${cs.name}: M(mafsal 2) = 0`);
    });
}

// =====================================================================
console.log('\n10c) Gerber parça parça çözüm (gerberParts): önce asılı parça, sonuçlar tüm sistemle aynı');
{
    const { readModels } = require(path.join(__dirname, '..', 'tools', 'build-models-data.js'));
    const models = readModels();
    const extra = {
        'ankastre–mafsal–kayıcı (yayılı)': model(8, [['fixed-support', 0], ['roller-support', 8]], { hinges: [{ x: 4 }], distributedLoads: [{ startX: 0, endX: 8, magnitude: -2 }] }),
        'ankastre + 2 kayıcı + 2 mafsal': model(10, [['fixed-support', 0], ['roller-support', 5], ['roller-support', 10]], { hinges: [{ x: 3 }, { x: 7 }], distributedLoads: [{ startX: 0, endX: 10, magnitude: -1 }], concentratedLoads: [P(8.5, 4)] }),
        'iki ankastre + 2 mafsal, konsollarda yük': model(8, [['fixed-support', 0], ['fixed-support', 8]], { hinges: [{ x: 2 }, { x: 5 }], concentratedLoads: [P(1, 4), P(3, 6), P(7, 5)], concentratedMoments: [{ x: 4, magnitude: -3 }], distributedLoads: [{ startX: 5, endX: 8, magnitude: -2 }] })
    };
    const cases = Object.entries(models).filter(([, m]) => (m.hinges || []).length).concat(Object.entries(extra));
    cases.forEach(([name, m]) => {
        const r = S.analyze(m);
        if (!r.solved) return;
        const g = S.gerberParts(r);
        check(!!g && g.parts.length === r.normalized.hinges.length + 1, `${name}: kiriş ${r.normalized.hinges.length + 1} parçaya ayrıldı`);
        if (!g) return;
        check(g.parts[0].role === 'suspended', `${name}: ilk çözülen parça asılı parça (${g.parts[0].from}–${g.parts[0].to})`);
        const sameReactions = g.parts.every(prt => prt.unknowns.every(u => {
            if (u.hinge !== undefined) return true;
            const rr = R(r, u.x);
            return rr && Math.abs((u.comp === 'Mz' ? rr.Mz : rr.Fy) - u.value) < 1e-9;
        }));
        check(sameReactions, `${name}: parça parça bulunan tepkiler tüm sistemin çözümüyle aynı`);
        check(g.hingeForces.every((f, i) => Math.abs(f + r.V(r.normalized.hinges[i].x, -1)) < 1e-9), `${name}: mafsal kuvvetleri = −V(mafsal⁻)`);
        // Her parçanın denklemleri sayısal olarak sağlanıyor
        const ok = g.parts.every(prt => prt.equations.every(eq => {
            const sum = eq.unknownTerms.reduce((acc, t) => acc + t.coef * prt.unknowns.find(u => u.key === t.key).value, 0) + eq.loadTerms.reduce((acc, t) => acc + t.value, 0);
            return Math.abs(sum) < 1e-9;
        }));
        check(ok, `${name}: her parçanın ΣM ve ΣFy denklemleri sağlanıyor`);
    });
    const m10 = S.gerberParts(S.analyze(models.model_10));
    approx(m10.parts[0].unknowns.find(u => u.name === 'V_B').value, 0, 1e-9, 'model_10: orta parça B_y (mafsal B) = 0');
    approx(m10.parts[0].unknowns.find(u => u.name === 'V_F').value, 4, 1e-9, 'model_10: orta parça F_y (mafsal F) = 4 kN');
}

// =====================================================================
console.log('\n11) Statik belirlilik sınıflandırması');
{
    const st = (sup, extra) => S.analyze(model(10, sup, Object.assign({ concentratedLoads: [P(3, 10)] }, extra || {}))).status;
    check(st([['roller-support', 0], ['roller-support', 10]]).reason === 'statusNoHorizontal', 'İki kayıcı mesnet → labil (yatayda tutulmamış)');
    const pp = st([['pin-support', 0], ['pin-support', 10]]);
    check(pp.kind === 'isostatic' && pp.solvable && pp.params.vertical, 'İki sabit mesnet, yalnız düşey yük → ΣFx özdeş sağlanır, izostatik');
    const ppa = S.analyze(model(10, [['pin-support', 0], ['pin-support', 10]], { concentratedLoads: [P(3, 10, 45)] })).status;
    check(ppa.kind === 'hyperstatic' && !ppa.solvable, 'İki sabit mesnet + eğik yük → çözülemez (N belirsiz)');
    const fr = st([['fixed-support', 0], ['roller-support', 10]]);
    check(fr.kind === 'hyperstatic' && fr.params.degree === 1 && !fr.solvable, 'Ankastre + kayıcı → 1. derece hiperstatik');
    check(st([['pin-support', 5], ['roller-support', 5]]).reason === 'statusCoincidentSupports', 'Aynı noktada iki mesnet → labil');
    check(st([['pin-support', 0], ['pin-support', 10]], { hinges: [{ x: 4 }] }).reason === 'statusMechanism', 'Sabit–mafsal–sabit → mekanizma');
    check(st([['fixed-support', 0], ['roller-support', 3]], { hinges: [{ x: 5 }] }).reason === 'statusGeometric', 'Mafsalın sağında mesnet yok → geometrik labil');
    check(st([['pin-support', 0], ['roller-support', 12]]).reason === 'statusSupportOutside', 'Kiriş dışındaki mesnet reddedilir');
    check(st([]).reason === 'statusNoSupports', 'Mesnet yok');
    const hs = S.analyze(model(10, [['pin-support', 0], ['roller-support', 5], ['roller-support', 10]], { hinges: [{ x: 5 }], distributedLoads: [{ startX: 0, endX: 10, magnitude: -2 }] }));
    check(hs.solved && Math.abs(R(hs, 5).Fy - 10) < 1e-9, 'Mesnet üzerindeki mafsal doğru çözülüyor');
}

// =====================================================================
console.log('\n12) Adım adım çözüm ve kesim yöntemi verisi');
{
    const r = S.analyze(model(10, [['pin-support', 0], ['roller-support', 10]], { distributedLoads: [{ startX: 2, endX: 6, magnitude: -4 }] }));
    const eqM = r.equations.find(e => e.kind === 'sumM');
    check(eqM && eqM.about.name === 'A', 'ΣM_A denklemi A noktasına göre');
    const w = eqM.loadTerms[0];
    approx(w.force, -16, 1e-9, 'Yayılı yük bileşkesi W = 16 kN (aşağı)');
    approx(w.xc, 4, 1e-9, 'Bileşke x = 4 m');
    approx(R(r, 0).Fy, 9.6, 1e-9, 'A_y = 9.6');
    approx(r.extremes.Mmax.value, 30.72, 1e-9, 'M_max = 30.72 kNm');
    approx(r.extremes.Mmax.x, 4.4, 1e-9, 'M_max konumu x = 4.4 m');
    const left = S.section(r, 3, 'left'), right = S.section(r, 3, 'right');
    approx(left.V, r.V(3), 1e-9, 'Kesim (sol parça) V = diyagram');
    approx(left.sumFy, r.V(3), 1e-9, 'Sol parça ΣFy = V');
    approx(left.sumM, -r.M(3), 1e-9, 'Sol parça ΣM_kesit (saat tersi +) = −M');
    approx(right.M, left.M, 1e-9, 'Sağ ve sol parça aynı M');
    approx(right.sumFy, -r.V(3), 1e-9, 'Sağ parça ΣFy = −V');

    // Burulma: ankastre konsol, uçta 4 kNm burulma momenti
    const rt = S.analyze({ beam: { length: 3 }, supports: [{ type: 'fixed-support', x: 0 }], torsionMoments: [{ x: 3, magnitude: 4 }],
        distributedLoads: [], trapezoidalLoads: [], concentratedLoads: [], concentratedMoments: [], hinges: [] });
    const tl = S.section(rt, 1.5, 'left'), trr = S.section(rt, 1.5, 'right');
    check(tl.hasTorsion && tl.forces.some(f => f.kind === 'reactionMx'), 'Kesim: burulma tepkisi sol parçada');
    approx(tl.T, rt.T(1.5), 1e-9, 'Kesim (sol parça) T = diyagram T');
    approx(tl.sumMx + tl.T, 0, 1e-9, 'Sol parça ΣMx + T = 0');
    approx(trr.sumMx - trr.T, 0, 1e-9, 'Sağ parça ΣMx − T = 0');
    check(S.section(r, 3, 'left').hasTorsion === false, 'Burulmasız modelde kesimde T yok');
}

// =====================================================================
console.log('\n13) Köprü katmanı (calculations.js): piksel model → çözücü, çizim yapılmadan');
{
    resetState();
    sandbox.beam = { startX: 0, endX: 100, startY: 0, length: 100 };
    sandbox.supports = [{ type: 'pin-support', x: 0 }, { type: 'roller-support', x: 100 }];
    sandbox.concentratedLoads = [{ x: 50, magnitude: -10, angle: -Math.PI / 2 }];
    const a = fns.analyzeBeam();   // çizim stub'ları çağrılsaydı burada hata fırlardı
    check(a.stable === true && a.solution !== null, 'Stabil sistem çözüldü');
    approx(a.solution.reactions.find(r => r.x === 0).magnitude, 5, 1e-9, 'Sol tepki 5 kN');
    approx(Math.max(...a.diagrams.momentPoints.map(p => p.y)), 25, 1e-6, 'Maksimum moment PL/4 = 25 kNm');
    check(a.axial === null && a.torsion === null, 'Eksenel ve burulma yükü yok → diyagram yok');
    check(fns.isSystemStable() === true, 'isSystemStable: sabit + kayıcı');
    sandbox.supports = [{ type: 'roller-support', x: 0 }];
    const b = fns.analyzeBeam();
    check(b.stable === false && b.solution === null && b.diagrams === null && b.status.kind === 'unstable', 'Labil sistemde çözüm yok, durum bildirilir');
    sandbox.supports = [{ type: 'fixed-support', x: 0 }];
    sandbox.concentratedLoads = [{ x: 50, magnitude: 10, angle: Math.PI / 2 }];
    const c = fns.analyzeBeam();
    approx(c.solution.momentReactions[0].magnitude, 50, 1e-9, 'Ankastre moment tepkisi (piksel konumlu) 50 kNm');
}

// =====================================================================
console.log('\n14) Hazır modeller: denge ve çözülebilirlik');
{
    const { readModels } = require(path.join(__dirname, '..', 'tools', 'build-models-data.js'));
    const models = readModels();
    Object.entries(models).forEach(([name, data]) => {
        const r = S.analyze(data);
        const meta = data.meta || {};
        check(!!(meta.title && meta.title.tr && meta.title.en && meta.objective && meta.level && meta.order), `${name}: başlık, öğrenme hedefi, seviye ve sıra tanımlı`);
        if (meta.expectSolvable === false) {
            check(!r.solved && r.status.kind === data.expected.status, `${name}: beklendiği gibi çözülemez (${r.status.kind}, ${r.status.reason})`);
            return;
        }
        const ok = r.solved && Math.abs(r.V(r.L, 1)) < 1e-6 && Math.abs(r.M(r.L, 1)) < 1e-6 &&
            r.normalized.hinges.every(h => Math.abs(r.M(h.x, -1)) < 1e-6) &&
            r.normalized.supports.every(s => Math.abs(r.deflectionAt(s.x)) < 1e-6);
        check(ok, `${name}: çözüldü, V(L)=M(L)=0, mafsalda M=0, mesnette δ=0`);
        // Regresyon: dosyadaki beklenen değerler (expected) ile karşılaştırma
        const e = data.expected;
        const same = e && e.reactions.every(er => { const rr = R(r, er.x); return rr && Math.abs(rr.Fy - er.Fy) < 1e-5 && (er.Mz === undefined || Math.abs(rr.Mz - er.Mz) < 1e-5) && (er.Fx === undefined || Math.abs(rr.Fx - er.Fx) < 1e-5); }) &&
            Math.abs(r.extremes.Mmax.value - e.Mmax) < 1e-5 && Math.abs(r.extremes.Mmin.value - e.Mmin) < 1e-5;
        check(same, `${name}: tepkiler ve M_max/M_min beklenen değerlerle aynı`);
    });
}

// =====================================================================
console.log('\n14b) Alıştırma üreteci: tohumlu, her zaman çözülebilir');
{
    const src = fs.readFileSync(path.join(__dirname, '..', 'vetin', 'practice.js'), 'utf8').split('// ---------- Alıştırma durumu')[0];
    vm.runInContext(src + ';globalThis.__gen = generatePracticeModel;', context, { filename: 'practice.js' });
    const gen = sandbox.__gen;
    let unsolved = 0;
    ['basic', 'intermediate', 'advanced'].forEach(l => { for (let i = 0; i < 200; i++) if (!S.analyze(gen(l, 's' + i)).solved) unsolved++; });
    check(unsolved === 0, '600 rastgele problemin tamamı izostatik ve çözülebilir');
    check(JSON.stringify(gen('basic', '2024001')) === JSON.stringify(gen('basic', '2024001')), 'Aynı tohum aynı problemi verir');
    const distinct = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(gen('intermediate', 'k' + i)))).size;
    check(distinct > 5, `Farklı tohumlar farklı problemler verir (${distinct}/20 farklı)`);
}

// =====================================================================
console.log('\n15) Hazır modeller: gömülü veri (models-data.js) JSON dosyalarıyla eşleşiyor');
{
    // Galeri, file:// ile açılışta da çalışsın diye modelleri models-data.js'ten okur.
    // Bu dosya JSON'lardan üretilir; bir model değişip yeniden üretilmezse test düşer.
    const { readModels, buildSource } = require(path.join(__dirname, '..', 'tools', 'build-models-data.js'));
    const dataPath = path.join(__dirname, '..', 'vetin', 'models', 'models-data.js');
    const win = {};
    vm.runInNewContext(fs.readFileSync(dataPath, 'utf8'), { window: win });
    const fromJson = readModels();
    check(Object.keys(fromJson).length > 0 && JSON.stringify(win.VETIN_MODELS) === JSON.stringify(fromJson),
        `models-data.js ${Object.keys(fromJson).length} modelin tamamını içeriyor ve JSON'larla aynı`);
    check(fs.readFileSync(dataPath, 'utf8').replace(/\r\n/g, '\n') === buildSource(fromJson),
        'models-data.js güncel (değilse: node tools/build-models-data.js)');
}

// =====================================================================
console.log('\n16) Dosya biçimi (model.js): piksel ↔ metre dönüşümü');
{
    // Kiriş 100 px'ten başlıyor, ölçek 20 px / 0.1 m = 200 px/m, boy 1200 px = 6 m
    const state = {
        beam: { startX: 100, endX: 1300, startY: 190, gridSizeOnCreation: 20, metersPerGridOnCreation: 0.1, length: 1200 },
        supports: [{ type: 'pin-support', x: 100 }, { type: 'roller-support', x: 900 }],
        hinges: [{ x: 700 }],
        concentratedLoads: [{ x: 1300, y: 180, magnitude: -20, angle: 0 }],
        distributedLoads: [{ startX: 700, endX: 300, magnitude: -4 }],   // ters yönde çizilmiş yük korunmalı
        trapezoidalLoads: [{ startX: 100, endX: 700, startMagnitude: 0, endMagnitude: -12 }],
        concentratedMoments: [{ x: 1300, y: 190, magnitude: -10 }],
        torsionMoments: []
    };
    const settings = { metersPerGrid: '0.1', kNPerGrid: '1', gridSize: '20' };
    const file = fns.serializeModel(state, settings);
    check(file.version === 2 && file.format === 'vetin-beam', 'Sürüm 2 dosya biçimi');
    check(file.beam.length === 6 && file.supports[1].x === 4 && file.hinges[0].x === 3, 'Konumlar metre, kiriş başına göre (6 m, 4 m, 3 m)');
    check(file.distributedLoads[0].startX === 3 && file.distributedLoads[0].endX === 1, 'Yük yönü (başlangıç/bitiş sırası) korunuyor');
    check(file.gridSettings.gridSize === 20 && !('y' in file.concentratedLoads[0]), 'Izgara ayarları sayı; görünüme özgü y alanı dosyada yok');

    // Farklı bir tuval konumuna yükleyip tekrar kaydetmek aynı dosyayı vermeli
    const back = fns.deserializeModel(JSON.parse(JSON.stringify(file)), { startX: 300, gridSize: 20, metersPerGrid: 0.1 });
    check(back.version === 2 && back.state.beam.startX === 300 && back.state.beam.endX === 1500, 'Yeni konumda kiriş 300 → 1500 px');
    check(back.state.supports[1].x === 1100, 'Mesnet de aynı ölçekle kaydırıldı (4 m → 1100 px)');
    check(JSON.stringify(fns.serializeModel(back.state, settings)) === JSON.stringify(file), 'Gidiş-dönüş kayıpsız (konumdan bağımsız)');

    // Eski (sürüm 1, piksel) dosyalar okunmaya devam eder
    const legacy = fns.deserializeModel({ beam: state.beam, supports: state.supports, gridSettings: settings }, { startX: 0, gridSize: 20, metersPerGrid: 0.1 });
    check(legacy.version === 1 && legacy.state.beam.startX === 100 && legacy.state.hinges.length === 0, 'Sürüm 1 dosya olduğu gibi okunuyor, eksik diziler boş');
    let threw = false;
    try { fns.deserializeModel({ version: 2, beam: { length: 0 } }, { startX: 0, gridSize: 20, metersPerGrid: 0.1 }); } catch (e) { threw = true; }
    check(threw, 'Geçersiz dosya (kiriş boyu 0) reddediliyor');
}

// =====================================================================
console.log('\n17) Hazır modeller sürüm 2 (metre) biçiminde ve okunabiliyor');
{
    const { readModels } = require(path.join(__dirname, '..', 'tools', 'build-models-data.js'));
    const models = readModels();
    const bad = Object.entries(models).filter(([, data]) => {
        try { return data.version !== 2 || !fns.deserializeModel(data, { startX: 100, gridSize: 20, metersPerGrid: 0.1 }).state.beam; }
        catch (e) { return true; }
    }).map(([name]) => name);
    check(bad.length === 0, `${Object.keys(models).length} hazır model sürüm 2 ve geçerli${bad.length ? ' (sorunlu: ' + bad.join(', ') + ')' : ''}`);
}

// =====================================================================
console.log('\n18) Yükleme bütünlüğü (index.html ↔ sw.js ↔ disk)');
{
    const { checkDeploy } = require(path.join(__dirname, '..', 'tools', 'check-deploy.js'));
    const { errors } = checkDeploy();
    errors.forEach(e => console.error('        ' + e));
    check(errors.length === 0, 'index.html\'in yüklediği her dosya sw.js önbellek listesinde ve diskte mevcut');
}

// =====================================================================
console.log('\n19) Çeviri kapsamı: tüm dillerde öğrenme metinleri çevrilmiş, yer tutucular korunmuş');
{
    const ctx = vm.createContext({ document: { documentElement: { lang: 'en' } } });
    const src = (f) => fs.readFileSync(path.join(__dirname, '..', 'vetin', f), 'utf8').replace(/^﻿/, '');
    vm.runInContext(src('translations.js').replace('const translations', 'var translations'), ctx);
    vm.runInContext(src('translations-learning.js'), ctx);
    vm.runInContext(src('translations-i18n.js'), ctx);
    const T = ctx.translations;
    const flat = (o, p = '', out = {}) => { for (const [k, v] of Object.entries(o)) { const kk = p ? `${p}.${k}` : k; if (v && typeof v === 'object') flat(v, kk, out); else out[kk] = v; } return out; };
    const en = flat(T.en);
    // Öğrenme özelliklerine ait anahtarlar (translations-learning.js ile eklenenler)
    const learningKeys = ['statusIsostatic', 'statusHyperstatic', 'statusMechanism', 'learningPanelTitle', 'stepsTitle', 'regionsTitle', 'practiceTitle',
        'cutLeftPart', 'cutRightPart', 'cutEquationsTitle', 'hintExplore', 'signConventionTitle', 'signM', 'stepEquilibriumTitle', 'regionsIntro',
        'practiceIntro', 'fbSign', 'elasticCurveDiagram', 'elasticCurve3D', 'resultsTitle', 'reactionsHeading', 'cutMethodTitle'];
    const tokens = (v) => ((v.match(/\{[a-z]+\}/gi) || []).sort().join(',')) + '|' + ((v.match(/<\/?[a-z]+>/gi) || []).sort().join(','));
    const langs = Object.keys(T).filter(l => l !== 'en');
    const untranslated = [], brokenTokens = [];
    langs.forEach(l => {
        const f = flat(T[l]);
        learningKeys.forEach(k => { if (l !== 'tl' && f[k] === en[k]) untranslated.push(`${l}.${k}`); });
        Object.keys(en).forEach(k => { if (typeof f[k] === 'string' && typeof en[k] === 'string' && tokens(f[k]) !== tokens(en[k])) brokenTokens.push(`${l}.${k}`); });
    });
    check(untranslated.length === 0, `${langs.length} dilde öğrenme metinleri çevrilmiş${untranslated.length ? ' (çevrilmemiş: ' + untranslated.slice(0, 10).join(', ') + ')' : ''}`);
    check(brokenTokens.length === 0, `Tüm dillerde {yer tutucu} ve HTML etiketleri korunmuş${brokenTokens.length ? ' (sorunlu: ' + brokenTokens.slice(0, 10).join(', ') + ')' : ''}`);
    check(langs.every(l => Object.keys(en).every(k => flat(T[l])[k] !== undefined)), 'Hiçbir dilde eksik anahtar yok');

    // Hazır model galerisi: başlık ve öğrenme hedefi her dilde; matematik simgeleri korunmuş
    const { readModels } = require(path.join(__dirname, '..', 'tools', 'build-models-data.js'));
    const SYM = /M_max|ΣM|L\/√3|\(\d\)|[VMN] = 0/g;
    const missingMeta = [], lostSymbols = [];
    Object.entries(readModels()).forEach(([name, data]) => {
        ['title', 'objective'].forEach(field => {
            const m = data.meta[field], need = m.en.match(SYM) || [];
            langs.forEach(l => {
                if (!m[l] || !m[l].trim()) { missingMeta.push(`${name}.${field}.${l}`); return; }
                if (need.some(s => !m[l].includes(s))) lostSymbols.push(`${name}.${field}.${l}`);
            });
        });
    });
    check(missingMeta.length === 0, `Model başlık ve hedefleri ${langs.length} dilde mevcut${missingMeta.length ? ' (eksik: ' + missingMeta.slice(0, 10).join(', ') + ')' : ''}`);
    check(lostSymbols.length === 0, `Model metinlerinde matematik simgeleri korunmuş${lostSymbols.length ? ' (sorunlu: ' + lostSymbols.slice(0, 10).join(', ') + ')' : ''}`);
}

// =====================================================================
console.log(`\nSonuç: ${passed} başarılı, ${failed} başarısız\n`);
process.exit(failed > 0 ? 1 : 0);

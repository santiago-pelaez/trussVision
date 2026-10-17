// solution-steps.js - Adım adım çözüm, bölge ifadeleri ve çözüm raporu
//
// Çözücünün döndürdüğü denge denklemi terimlerinden (BeamSolver: equations,
// unknowns, segments, critical) öğrencinin kâğıt üzerinde yapacağı çözümü
// sayılarla yazar:
//   1) Serbest cisim ve bilinmeyenler, statik belirlilik (r ve denklem sayısı)
//   2) Yayılı yüklerin bileşkeleri ve etki noktaları
//   3) Denge denklemleri (ΣFx, ΣM, ΣFy, mafsal denklemleri) ve çözüm
//   4) Kontrol: başka bir noktaya göre moment dengesi
//   5) Bölgeler: her bölgede q(x), V(x), M(x) ifadeleri ve dM/dx = V kontrolü
//   6) Kritik noktalar: V = 0 → M ekstremumu
// Ayrıca tüm sonuçları içeren yazdırılabilir "çözüm raporu" üretir.

// Yük simgeleri: P tekil yük, W yayılı yük bileşkesi, C kuvvet çifti
function loadSymbol(term, n) {
    const idx = (list, t) => list.findIndex(o => o.kind === t.kind && o.index === t.index && Math.abs((o.s ?? o.x) - (t.s ?? t.x)) < 1e-9);
    if (term.kind === 'point') return `P_${term.index + 1}`;
    if (term.kind === 'couple') return `C_${term.index + 1}`;
    // Yayılı ve trapez yükler tek numaralandırma ile: önce düzgün yayılılar, sonra trapezler
    const uniformCount = n.dists.filter(d => d.kind === 'uniform').length;
    const k = term.kind === 'uniform' ? term.index + 1 : uniformCount + term.index + 1;
    return `W_${k}`;
}

function sgnStr(v, first) {
    if (v < 0) return first ? '−' : ' − ';
    return first ? '' : ' + ';
}

function eqUnknownTerm(t, first) {
    const c = t.coef;
    const mag = Math.abs(c);
    const coefStr = Math.abs(mag - 1) < 1e-9 ? '' : `${fmtNum(mag)}·`;
    return `${sgnStr(c, first)}${coefStr}${subHTML(t.name)}`;
}

function eqLoadTerm(t, n, first) {
    const sym = subHTML(t.sym || loadSymbol(t, n));
    const v = t.value;
    if (t.kind === 'couple') return `${sgnStr(v, first)}${fmtNum(Math.abs(t.moment))}<span class="eq-sym">(${sym})</span>`;
    // ΣF terimi ya da kolu tanımsız (bileşkesi sıfır) yayılı yük momenti
    if (t.arm === undefined || t.arm === null) return `${sgnStr(v, first)}${fmtNum(Math.abs(v))}<span class="eq-sym">(${sym})</span>`;
    return `${sgnStr(v, first)}${fmtNum(Math.abs(t.force))}·${fmtNum(Math.abs(t.arm))}<span class="eq-sym">(${sym})</span>`;
}

function equationHTML(eq, n, res) {
    const parts = [];
    let first = true;
    eq.unknownTerms.forEach(t => { parts.push(eqUnknownTerm(t, first)); first = false; });
    eq.loadTerms.forEach(t => { if (Math.abs(t.value) > 1e-12) { parts.push(eqLoadTerm(t, n, first)); first = false; } });
    if (!parts.length) parts.push('0');
    let label;
    if (eq.kind === 'sumFx') label = 'ΣF<sub>x</sub> = 0';
    else if (eq.kind === 'sumFy') label = 'ΣF<sub>y</sub> = 0';
    else if (eq.kind === 'sumM') label = `ΣM<sub>${escapeHTMLText(eq.about.name)}</sub> = 0 <span class="eq-note">(↺ +)</span>`;
    else label = `ΣM<sub>${escapeHTMLText(eq.about.name)}</sub><sup>${escapeHTMLText(tFormat('leftPartShort'))}</sup> = 0 <span class="eq-note">(${escapeHTMLText(tFormat('hingeEquationNote'))})</span>`;
    return `<div class="eq-line"><span class="eq-label">${label}:</span> <span class="eq-body">${parts.join('')} = 0</span></div>`;
}

function renderStepsSection(el, res) {
    if (!el) return;
    if (!res || !res.solved) { el.innerHTML = notSolvedHTML(res); return; }
    const n = res.normalized;
    const st = res.status;
    let html = '';
    const step = (no, titleKey, body) => { html += `<section class="solution-step"><h3><span class="step-no">${no}</span>${escapeHTMLText(tFormat(titleKey))}</h3>${body}</section>`; };

    // 1) Serbest cisim ve bilinmeyenler
    const unknownNames = [];
    res.reactions.forEach(r => {
        if (r.type !== 'roller-support' && !(st.params && st.params.vertical)) unknownNames.push(`${r.name}_x`);
        unknownNames.push(`${r.name}_y`);
        if (r.type === 'fixed-support') unknownNames.push(`M_${r.name}`);
    });
    const p = st.params || {};
    step(1, 'stepFbdTitle', `<p>${escapeHTMLText(tFormat('stepFbdText'))}</p>
        <p>${escapeHTMLText(tFormat('stepUnknowns'))}: ${unknownNames.map(subHTML).join(', ')} → r = ${p.r}</p>
        <p>${escapeHTMLText(tFormat(p.vertical ? 'stepEquationCountVertical' : 'stepEquationCount', { e: p.e, nh: p.nh }))}${st.kind === 'isostatic' ? ' ⇒ ' + escapeHTMLText(tFormat('statusKindIsostatic')) : ''}</p>`);

    // 2) Yük bileşkeleri
    const loadLines = [];
    n.points.forEach(pt => {
        const comps = [];
        if (Math.abs(pt.fy) > 1e-9) comps.push(`${escapeHTMLText(tFormat('verticalComponent'))} ${fmtNum(Math.abs(pt.fy))} kN ${pt.fy < 0 ? '↓' : '↑'}`);
        if (Math.abs(pt.fx) > 1e-9) comps.push(`${escapeHTMLText(tFormat('horizontalComponent'))} ${fmtNum(Math.abs(pt.fx))} kN ${pt.fx < 0 ? '←' : '→'}`);
        const angle = Math.abs(pt.fx) > 1e-9 && Math.abs(pt.fy) > 1e-9 ? ` (${fmtNum(Math.abs(pt.magnitude))} kN, ${fmtNum(pt.angle * 180 / Math.PI, 1)}°)` : '';
        loadLines.push(`<li>${subHTML(`P_${pt.index + 1}`)}: x = ${fmtNum(pt.x)} m — ${comps.join(', ')}${angle}</li>`);
    });
    n.dists.forEach(d => {
        const q = { kind: d.kind, index: d.index, s: d.s };
        const sym = subHTML(loadSymbol(q, n));
        const W = (d.w1 + d.w2) / 2 * (d.e - d.s);
        const xc = Math.abs(W) > 1e-12 ? (d.e - d.s) * (d.w1 * (2 * d.s + d.e) + d.w2 * (d.s + 2 * d.e)) / 6 / W : null;
        const len = fmtNum(d.e - d.s);
        const formula = d.kind === 'uniform'
            ? `q·ℓ = ${fmtNum(Math.abs(d.w1))} × ${len}`
            : `(q₁ + q₂)/2 · ℓ = (${fmtNum(-d.w1)} + ${fmtNum(-d.w2)})/2 × ${len}`;
        loadLines.push(`<li>${sym} = ${formula} = ${fmtNum(Math.abs(W))} kN ${W < 0 ? '↓' : '↑'}, x̄ = ${xc === null ? '—' : fmtNum(xc) + ' m'}</li>`);
    });
    n.couples.forEach(c => loadLines.push(`<li>${subHTML(`C_${c.index + 1}`)} = ${fmtNum(Math.abs(c.m))} kNm ${c.m > 0 ? '↻' : '↺'}, x = ${fmtNum(c.x)} m</li>`));
    step(2, 'stepLoadsTitle', loadLines.length ? `<ul class="step-list">${loadLines.join('')}</ul><p class="eq-note">${escapeHTMLText(tFormat('stepLoadsNote'))}</p>` : `<p>—</p>`);

    // 3) Denge denklemleri — ders kitabı sırası: ΣFx, ΣM, mafsal(lar), ΣFy
    const order = { sumFx: 0, sumM: 1, hinge: 2, sumFy: 3 };
    const eqs = [...res.equations].sort((a, b) => order[a.kind] - order[b.kind]);
    const values = [];
    res.reactions.forEach(r => {
        if (r.type !== 'roller-support' && res.hasAxial) values.push(`${subHTML(`${r.name}_x`)} = ${fmtNum(r.Fx)} kN`);
        values.push(`${subHTML(`${r.name}_y`)} = ${fmtNum(r.Fy)} kN`);
        if (r.type === 'fixed-support') values.push(`${subHTML(`M_${r.name}`)} = ${fmtNum(r.Mz)} kNm`);
    });
    // Mafsallı (Gerber) kirişlerde ders kitabı yolu: mafsallardan ayır, önce asılı parçayı çöz
    const gp = n.hinges.length && BeamSolver.gerberParts ? BeamSolver.gerberParts(res) : null;
    if (gp) {
        step(3, 'stepPartsTitle', gerberStepsHTML(gp, res, values));
    } else {
        step(3, 'stepEquilibriumTitle', `<p class="eq-note">${escapeHTMLText(tFormat('stepEquilibriumNote'))}</p>
        <div class="eq-block">${eqs.map(e => equationHTML(e, n, res)).join('')}</div>
        <p>${escapeHTMLText(tFormat('stepSolveText'))}</p>
        <div class="eq-solution">${values.join('<span class="eq-sep">;</span> ')}</div>
        <p class="eq-note">${escapeHTMLText(tFormat('stepNegativeNote'))}</p>`);
    }

    // 4) Kontrol: kirişin sağ ucuna göre moment (çözümle sıfır çıkmalı)
    const L = res.L;
    // Yüklerin ve tepkilerin uç noktasına göre momenti, M(L⁺) = 0 olduğundan sıfırdır
    const residual = res.M(L, 1);
    step(4, 'stepCheckTitle', `<p>${escapeHTMLText(tFormat('stepCheckText', { name: res.nameOf(L) }))}</p>
        <div class="eq-line"><span class="eq-label">ΣM<sub>${escapeHTMLText(res.nameOf(L))}</sub>:</span> <span class="eq-body">${fmtNum(-residual, 4)} ≈ 0 ✓</span></div>
        <div class="eq-line"><span class="eq-label">ΣF<sub>y</sub>:</span> <span class="eq-body">${fmtNum(res.V(L, 1), 4)} ≈ 0 ✓</span></div>`);

    // 5) Bölgeler (özet) — ayrıntı "Bölge ifadeleri" sekmesinde
    const segRows = res.segments.map((s, i) => `<li><b>${escapeHTMLText(toRoman(i + 1))}</b> ${escapeHTMLText(s.from)}–${escapeHTMLText(s.to)} (${fmtNum(s.x0)} ≤ x ≤ ${fmtNum(s.x1)}): V(x) = ${polyHTML(s.V.global)}; M(x) = ${polyHTML(s.M.global)}</li>`).join('');
    step(5, 'stepRegionsTitle', `<p>${escapeHTMLText(tFormat('stepRegionsText'))}</p><ul class="step-list">${segRows}</ul>
        <p><button type="button" class="link-btn" data-goto-tab="regions">${escapeHTMLText(tFormat('regionsTitle'))} →</button></p>`);

    // 6) Kritik noktalar ve ekstremumlar
    const zs = res.critical.filter(c => c.kind === 'zeroShear');
    const zLines = zs.map(c => `<li>V(x) = 0 → x = ${fmtNum(c.x, 3)} m, M = ${fmtNum(c.Ml)} kNm</li>`).join('');
    const e = res.extremes;
    step(6, 'stepCriticalTitle', `<p>${escapeHTMLText(tFormat('stepCriticalText'))}</p>
        ${zLines ? `<ul class="step-list">${zLines}</ul>` : `<p>${escapeHTMLText(tFormat('stepNoZeroShear'))}</p>`}
        <p>M<sub>max</sub> = ${fmtNum(e.Mmax.value)} kNm (x = ${fmtNum(e.Mmax.x)} m); M<sub>min</sub> = ${fmtNum(e.Mmin.value)} kNm (x = ${fmtNum(e.Mmin.x)} m)</p>`);

    html += `<p class="report-actions"><button type="button" class="btn-primary" id="solution-report-btn">${escapeHTMLText(tFormat('reportButton'))}</button></p>`;
    el.innerHTML = html;
    el.querySelectorAll('[data-goto-tab]').forEach(b => b.addEventListener('click', () => setLearningTab(b.dataset.gotoTab)));
    const rb = el.querySelector('#solution-report-btn');
    if (rb) rb.addEventListener('click', openSolutionReport);
}

// Gerber kirişinin parça parça çözümü (BeamSolver.gerberParts): her parça için aktarılan
// mafsal kuvvetleri, ΣM ve ΣFy denklemleri ve çözüm; sonunda tüm sistemin çözümüyle karşılaştırma.
function gerberStepsHTML(gp, res, values) {
    const n = res.normalized;
    const withSym = (key, params, sym) => escapeHTMLText(tFormat(key, Object.assign({}, params, { sym: '\u0000' }))).replace(/\s+,/g, ',').replace('\u0000', subHTML(sym));
    let html = `<p>${escapeHTMLText(tFormat('stepPartsText'))}</p><p class="eq-note">${escapeHTMLText(tFormat('stepEquilibriumNote'))}</p>`;
    const fx = res.equations.find(e => e.kind === 'sumFx');
    if (fx) html += `<div class="eq-block">${equationHTML(fx, n, res)}</div>`;
    gp.parts.forEach((prt, i) => {
        const role = tFormat(prt.role === 'suspended' ? 'partSuspended' : 'partCarrier');
        html += `<div class="gerber-part ${prt.role}"><h4>${String.fromCharCode(97 + i)}) ${escapeHTMLText(tFormat('partHeading', { from: prt.from, to: prt.to }))} <span class="part-role">${escapeHTMLText(role)}</span></h4>`;
        const transfers = prt.transfers || [];
        if (transfers.length) {
            html += `<ul class="step-list">${transfers.map(t => `<li>${withSym('partTransferred', { value: fmtNum(Math.abs(t.force)), dir: Math.abs(t.force) < 0.005 ? '' : (t.force < 0 ? '↓' : '↑'), part: t.fromPart }, t.sym)}</li>`).join('')}</ul>`;
        }
        html += `<div class="eq-block">${prt.equations.map(e => equationHTML(e, n, res)).join('')}</div>`;
        html += `<div class="eq-solution">${prt.unknowns.map(u => `${subHTML(u.name)} = ${fmtNum(u.value)} ${u.comp === 'Mz' ? 'kNm' : 'kN'}`).join('<span class="eq-sep">;</span> ')}</div></div>`;
    });
    // Tüm sistemin çözümüyle karşılaştırma
    const agree = gp.parts.every(prt => prt.unknowns.every(u => {
        if (u.hinge !== undefined) return true;
        const r = res.reactions.find(q => Math.abs(q.x - u.x) < 1e-9);
        return r && Math.abs((u.comp === 'Mz' ? r.Mz : r.Fy) - u.value) < 1e-6;
    }));
    html += `<p>${escapeHTMLText(tFormat('stepSolveText'))}</p><div class="eq-solution">${values.join('<span class="eq-sep">;</span> ')}</div>`;
    if (agree) html += `<p class="eq-note">${escapeHTMLText(tFormat('partAgreement'))}</p>`;
    html += `<p class="eq-note">${escapeHTMLText(tFormat('stepNegativeNote'))}</p>`;
    return html;
}

// Polinom yazımı: c0 + c1 x + c2 x² + c3 x³ (v: değişken adı)
function polyHTML(c, v = 'x') {
    const terms = [];
    c.forEach((a, k) => {
        if (Math.abs(a) < 5e-4) return;
        const mag = Math.abs(a);
        const coef = k > 0 && Math.abs(mag - 1) < 5e-4 ? '' : fmtNum(mag, mag < 0.1 ? 4 : 2);
        const pow = k === 0 ? '' : (k === 1 ? v : `${v}<sup>${k}</sup>`);
        terms.push({ neg: a < 0, s: `${coef}${pow}` });
    });
    if (!terms.length) return '0';
    return terms.map((t, i) => (i === 0 ? (t.neg ? '−' : '') : (t.neg ? ' − ' : ' + ')) + t.s).join('');
}

function derivative(c) { return c.slice(1).map((a, k) => a * (k + 1)); }

let regionsLocal = false;

function renderRegionsSection(el, res) {
    if (!el) return;
    if (!res || !res.solved) { el.innerHTML = notSolvedHTML(res); return; }
    const v = regionsLocal ? 'ξ' : 'x';
    const rows = res.segments.map((s, i) => {
        const pick = (o) => regionsLocal ? o.local : o.global;
        const qDown = pick(s.q).map(a => -a); // q aşağı pozitif gösterilir
        const dM = derivative(pick(s.M));
        const ok = pick(s.V).every((a, k) => Math.abs(a - (dM[k] || 0)) < 1e-4 * Math.max(1, Math.abs(a)));
        const vDeg = pick(s.V).reduce((d, a, k) => (Math.abs(a) > 5e-4 ? k : d), 0);
        const mDeg = pick(s.M).reduce((d, a, k) => (Math.abs(a) > 5e-4 ? k : d), 0);
        return `<tr>
            <td><b class="region-roman">${escapeHTMLText(toRoman(i + 1))}</b> ${escapeHTMLText(s.from)}–${escapeHTMLText(s.to)}</td>
            <td>${fmtNum(s.x0)} – ${fmtNum(s.x1)}</td>
            <td>${polyHTML(qDown, v)}</td>
            <td>${polyHTML(pick(s.V), v)} <span class="deg-badge">${escapeHTMLText(tFormat('degree' + vDeg))}</span></td>
            <td>${polyHTML(pick(s.M), v)} <span class="deg-badge">${escapeHTMLText(tFormat('degree' + mDeg))}</span></td>
            <td>${ok ? '✓' : '✗'}</td>
        </tr>`;
    }).join('');
    el.innerHTML = `
        <p>${escapeHTMLText(tFormat('regionsIntro'))}</p>
        <label class="regions-toggle"><input type="checkbox" id="regions-local" ${regionsLocal ? 'checked' : ''}> ${escapeHTMLText(tFormat('regionsLocalToggle'))}</label>
        <div class="table-wrapper"><table class="regions-table"><thead><tr>
            <th>${escapeHTMLText(tFormat('colRegion'))}</th><th>x (m)</th><th>q(${v}) (kN/m, + ${escapeHTMLText(tFormat('downWord'))})</th>
            <th>V(${v}) (kN)</th><th>M(${v}) (kNm)</th><th>dM/d${v} = V</th>
        </tr></thead><tbody>${rows}</tbody></table></div>
        <p class="eq-note">${escapeHTMLText(tFormat('regionsRules'))}</p>`;
    const cb = el.querySelector('#regions-local');
    if (cb) cb.addEventListener('change', () => { regionsLocal = cb.checked; renderRegionsSection(el, res); });
}

// ---------- Çözüm raporu (yazdırılabilir) ----------

function canvasImage(c) {
    try { return c && c.width ? c.toDataURL('image/png') : null; } catch (e) { return null; }
}

function openSolutionReport() {
    const res = lastAnalysis && lastAnalysis.result;
    if (!res || !res.solved) return;
    // Raporda tüm diyagramlar dolu görünsün diye kapalı panellerin görüntüsü alınamaz; açık olanlar eklenir
    const imgs = [];
    const add = (titleKey, el) => { const src = canvasImage(el); if (src && el.clientWidth > 0) imgs.push({ title: tFormat(titleKey), src }); };
    add('structuralModel', canvas);
    add('freeBodyDiagram', fbdCanvas);
    [['normalForceDiagram', 'normalForceDiagram'], ['shearForceDiagram', 'shearForceDiagram'], ['bendingMomentDiagram', 'bendingMomentDiagram'], ['torsionMomentDiagram', 'torsionMomentDiagram'], ['elasticCurveDiagram', 'elasticCurveDiagram']]
        .forEach(([key, id]) => add(key, document.getElementById(id)));
    const results = document.getElementById('learning-results');
    const steps = document.getElementById('learning-steps');
    const regions = document.getElementById('learning-regions');
    const title = tFormat('reportTitle');
    const date = new Date().toLocaleString(document.documentElement.lang || undefined);
    const shareUrl = typeof buildShareUrl === 'function' ? buildShareUrl() : '';
    const html = `<!doctype html><html lang="${document.documentElement.lang}"><head><meta charset="utf-8"><title>${escapeHTMLText(title)}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
            h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 17px; margin: 22px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
            h3 { font-size: 15px; margin: 14px 0 6px; } img { max-width: 100%; border: 1px solid #ddd; margin: 4px 0 10px; }
            table { border-collapse: collapse; margin: 6px 0 12px; font-size: 13px; } th, td { border: 1px solid #bbb; padding: 4px 8px; text-align: left; }
            .eq-line { margin: 4px 0; } .eq-label { font-weight: bold; } .eq-note { color: #555; font-size: 12px; } .eq-sym { color: #888; font-size: 11px; margin-left: 1px; }
            .step-no { display: inline-block; min-width: 22px; } button, .report-actions, .regions-toggle, .link-btn { display: none !important; }
            .meta { color: #555; font-size: 12px; } section { page-break-inside: avoid; }
            @media print { body { margin: 10mm; } h2 { page-break-after: avoid; } }
        </style></head><body>
        <h1>${escapeHTMLText(title)}</h1>
        <p class="meta">vetin · ${escapeHTMLText(date)}${shareUrl ? ` · <a href="${escapeHTMLText(shareUrl)}">${escapeHTMLText(tFormat('shareLinkLabel'))}</a>` : ''}</p>
        <p class="meta">${escapeHTMLText(document.getElementById('system-status')?.dataset.text || '')}</p>
        ${imgs.map(i => `<h2>${escapeHTMLText(i.title)}</h2><img src="${i.src}" alt="${escapeHTMLText(i.title)}">`).join('')}
        <h2>${escapeHTMLText(tFormat('resultsTitle'))}</h2>${results ? results.innerHTML : ''}
        <h2>${escapeHTMLText(tFormat('stepsTitle'))}</h2>${steps ? steps.innerHTML : ''}
        <h2>${escapeHTMLText(tFormat('regionsTitle'))}</h2>${regions ? regions.innerHTML : ''}
        <script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));<\/script>
        </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert(tFormat('reportPopupBlocked')); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
}

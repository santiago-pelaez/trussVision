// learning-panel.js - Öğrenme katmanı: kritik değerler, durum, sonuçlar, işaret kabulü
//
// Hesap sonucunu (lastAnalysis.result, solver.js) öğrencinin okuyabileceği
// biçimlere dönüştürür:
//   - Diyagramlarda kritik noktalardaki değer etiketleri, (+)/(−) bölge işaretleri
//     ve olay noktalarından geçen kılavuz çizgileri (Chart.js eklentisi)
//   - Nokta adları (A, B, C …) ve indisli tepki etiketleri (A_y = …)
//   - Statik belirlilik durum çubuğu (izostatik / hiperstatik / labil ve nedeni)
//   - "Öğrenme" paneli: Sonuçlar, Adım adım çözüm, Bölge ifadeleri, Alıştırma sekmeleri
//   - İşaret kabulü penceresi
// Bu dosya hesap yapmaz; çözücü sonuçlarını okur.

// ---------- Biçimlendirme ----------

function fmtNum(v, d = 2) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    const r = Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v;
    return r.toFixed(d).replace('-', '−');
}

function escapeHTMLText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// "A_y" → A<sub>y</sub>, "M_A" → M<sub>A</sub>
function subHTML(name) {
    const i = name.indexOf('_');
    return i === -1 ? escapeHTMLText(name) : `${escapeHTMLText(name.slice(0, i))}<sub>${escapeHTMLText(name.slice(i + 1))}</sub>`;
}

/** Tuvale indisli etiket yazar: "A_y = 6.00 kN" → A, küçük y, " = 6.00 kN". */
function fillSubscriptText(ctx, text, x, y, align = 'left') {
    const m = /^([^_\s]+)_([^\s=]+)(.*)$/.exec(text);
    if (!m) { ctx.textAlign = align; ctx.fillText(text, x, y); return; }
    const font = ctx.font;
    const size = parseFloat(/(\d+(\.\d+)?)px/.exec(font)?.[1] || 12);
    const subFont = font.replace(/(\d+(\.\d+)?)px/, `${Math.round(size * 0.75)}px`);
    const wBase = ctx.measureText(m[1]).width;
    ctx.font = subFont; const wSub = ctx.measureText(m[2]).width; ctx.font = font;
    const wRest = ctx.measureText(m[3]).width;
    const total = wBase + wSub + wRest;
    let left = align === 'center' ? x - total / 2 : (align === 'right' ? x - total : x);
    ctx.textAlign = 'left';
    ctx.fillText(m[1], left, y);
    ctx.font = subFont; ctx.fillText(m[2], left + wBase, y + size * 0.3); ctx.font = font;
    ctx.fillText(m[3], left + wBase + wSub, y);
    ctx.textAlign = align;
}

// ---------- Bölge adları (I, II, III …) ----------

function toRoman(n) {
    const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let out = '';
    t.forEach(([v, r]) => { while (n >= v) { out += r; n -= v; } });
    return out;
}

/** i. bölgenin (0'dan) adı: "II (C–B)". */
function regionLabel(seg, i) {
    return `${toRoman(i + 1)} (${seg.from}–${seg.to})`;
}

/** x noktasının bölgesi; bölge sınırında sol parça için soldaki, sağ parça için sağdaki bölge. */
function regionIndexAt(res, x, preferLeft = true) {
    const segs = (res && res.segments) || [];
    const eps = 1e-9;
    let i = segs.findIndex(s => preferLeft ? (x > s.x0 + eps && x <= s.x1 + eps) : (x >= s.x0 - eps && x < s.x1 - eps));
    if (i === -1) i = segs.findIndex(s => x >= s.x0 - eps && x <= s.x1 + eps);
    return i;
}

/**
 * Bölge adının yazılacağı aralık (metre). Kesim çizgisi bölgenin içindeyse ad, incelenen
 * parçada kalan kısmın ortasına yazılır (kesim çizgisinin altında kalmaz).
 * @returns {number[][]} denenecek aralıklar: önce görünen kısım, sonra bölgenin tamamı
 */
function regionLabelSpans(s) {
    const spans = [];
    const cx = (typeof cutModeActive !== 'undefined' && cutModeActive && typeof cutPositionM !== 'undefined') ? cutPositionM : null;
    if (cx !== null && cx > s.x0 + 1e-9 && cx < s.x1 - 1e-9) {
        spans.push(typeof cutPart !== 'undefined' && cutPart === 'right' ? [cx, s.x1] : [s.x0, cx]);
    }
    spans.push([s.x0, s.x1]);
    return spans;
}

/** Bölge adını [a, b] piksel aralıklarından ilk sığana yazar (yazı boyutu küçülerek denenir). */
function fillRegionName(context, text, pxSpans, y, sizes) {
    for (const [a, b] of pxSpans) {
        for (const size of sizes) {
            context.font = `${size}px "Times New Roman", Georgia, serif`;
            if (context.measureText(text).width + 8 <= b - a) { context.fillText(text, (a + b) / 2, y); return; }
        }
    }
}

/** SCD bandı yüksekliği (bölge adları için kirişin üstünde ayrılan şerit). */
const REGION_BAND_H = 34;

/**
 * SCD'nin üstüne bölge bandı çizer: bölge sınırlarından geçen noktalı düşey çizgiler
 * (bant üstünden yBottom'a kadar) ve her bölgenin ortasında Roma rakamı.
 */
function drawRegionBand(context, yBottom) {
    const res = lastAnalysis && lastAnalysis.result;
    if (!beam || !res || !res.solved || !res.segments || !res.segments.length) return;
    const { toPixels } = getConversionFunctions();
    const dark = document.body.classList.contains('dark-mode');
    const top = 4, bottom = REGION_BAND_H - 4;
    const xs = [toPixels(res.segments[0].x0), ...res.segments.map(s => toPixels(s.x1))];
    context.save();
    context.strokeStyle = dark ? 'rgba(200,200,200,0.45)' : 'rgba(60,60,60,0.45)';
    context.lineWidth = 1;
    context.setLineDash([2, 3]);
    xs.forEach(x => { context.beginPath(); context.moveTo(x, top); context.lineTo(x, yBottom); context.stroke(); });
    [top, bottom].forEach(y => { context.beginPath(); context.moveTo(xs[0], y); context.lineTo(xs[xs.length - 1], y); context.stroke(); });
    context.setLineDash([]);
    context.fillStyle = dark ? '#e3e8ef' : '#2b3340';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    res.segments.forEach((s, i) => {
        fillRegionName(context, toRoman(i + 1), regionLabelSpans(s).map(([a, b]) => [toPixels(a), toPixels(b)]), (top + bottom) / 2 + 1, [17, 13, 10]);
    });
    context.restore();
}

// ---------- Nokta adları ----------

/** Ölçü çizgisindeki her olay noktasının altına adını (A, B, …) yazar. */
function drawPointNames(context, yDim) {
    const res = lastAnalysis && lastAnalysis.result;
    if (!beam || !res || !res.points) return;
    const { toPixels } = getConversionFunctions();
    const dark = document.body.classList.contains('dark-mode');
    context.save();
    context.font = 'bold 13px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    res.points.forEach(p => {
        const x = toPixels(p.x);
        const w = context.measureText(p.name).width + 8;
        context.fillStyle = dark ? 'rgba(15,20,25,0.9)' : 'rgba(255,255,255,0.9)';
        context.fillRect(x - w / 2, yDim + 13, w, 17);
        context.fillStyle = dark ? '#8ab4f8' : '#1f4e8c';
        context.fillText(p.name, x, yDim + 15);
    });
    context.restore();
}

// ---------- Diyagram eklentisi: kritik değerler ----------

const DIAGRAM_KINDS = {
    shearForceDiagram: 'V', bendingMomentDiagram: 'M', normalForceDiagram: 'N',
    torsionMomentDiagram: 'T', elasticCurveDiagram: 'd'
};

function diagramFunction(res, kind) {
    if (kind === 'V') return res.V;
    if (kind === 'M') return res.M;
    if (kind === 'N') return res.N;
    if (kind === 'T') return res.T;
    return null;
}

function labelCandidates(res, kind) {
    const f = diagramFunction(res, kind);
    if (!f) return [];
    const pts = res.critical.filter(c => kind === 'M' || c.kind === 'event');
    const out = [];
    pts.forEach((c, i) => {
        const first = i === 0, last = i === pts.length - 1;
        const l = first ? null : f(c.x, -1), r = last ? null : f(c.x, 1);
        if (l !== null && r !== null && Math.abs(l - r) < 1e-6) out.push({ x: c.x, v: r, align: 'center', extremum: c.kind === 'zeroShear' });
        else {
            if (l !== null) out.push({ x: c.x, v: l, align: 'right' });
            if (r !== null) out.push({ x: c.x, v: r, align: 'left' });
        }
    });
    const kept = [];
    let prev = null;
    out.forEach(o => {
        const constantRun = prev && Math.abs(prev.v - o.v) < 1e-6 && o.x > prev.x + 1e-9 && Math.abs(f((prev.x + o.x) / 2) - o.v) < 1e-6;
        if (Math.abs(o.v) >= 0.005 && !constantRun) kept.push(o);
        prev = o;
    });
    return kept;
}

// Diyagramın aynı işaretli bölgeleri ve her bölgenin alan ağırlık merkezi:
//   x̄ = ∫x·|f| dx / ∫|f| dx,  ȳ = ∫f²/2 dx / ∫|f| dx (işaretli)
// (+)/(−) işareti bu noktaya yazılır; böylece bölgenin "içinde", ortasında durur.
function signRegions(res, kind, L) {
    const f = diagramFunction(res, kind);
    if (!f || !(L > 0)) return [];
    const n = 600, dx = L / n, regions = [];
    let cur = null;
    for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * dx;
        const v = f(x);
        const s = Math.abs(v) < 1e-6 ? 0 : Math.sign(v);
        if (!cur || cur.s !== s) { if (cur) regions.push(cur); cur = { s, x0: x, x1: x, area: 0, mx: 0, my: 0 }; }
        cur.x1 = x;
        const a = Math.abs(v) * dx;
        cur.area += a; cur.mx += x * a; cur.my += (v / 2) * a;
    }
    if (cur) regions.push(cur);
    return regions
        .filter(r => r.s !== 0 && r.x1 - r.x0 > 0.04 * L && r.area > 0)
        .map(r => Object.assign(r, { xc: r.mx / r.area, yc: r.my / r.area }));
}

/** Diyagramlarda grafik alanının üstünde bölge adları için ayrılan şerit (px). */
const DIAGRAM_REGION_BAND = 22;

const criticalValuesPlugin = {
    id: 'criticalValuesPlugin',
    beforeDatasetsDraw(chart) {
        const res = lastAnalysis && lastAnalysis.result;
        if (!res || !res.solved || !DIAGRAM_KINDS[chart.canvas.id]) return;
        const area = chart.chartArea, xs = chart.scales.x;
        const ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = document.body.classList.contains('dark-mode') ? 'rgba(200,200,200,0.25)' : 'rgba(80,80,80,0.22)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        const bandTop = area.top - DIAGRAM_REGION_BAND + 2;
        res.points.forEach(p => {
            const x = xs.getPixelForValue(p.x);
            if (x < area.left - 1 || x > area.right + 1) return;
            ctx.beginPath(); ctx.moveTo(x, bandTop); ctx.lineTo(x, area.bottom); ctx.stroke();
        });
        // Bölge adları (I, II, …): SCD'deki bantla aynı; üstünde yatay kesikli çizgi
        const segs = res.segments || [];
        if (segs.length) {
            const xa = Math.max(area.left, xs.getPixelForValue(segs[0].x0)), xb = Math.min(area.right, xs.getPixelForValue(segs[segs.length - 1].x1));
            ctx.setLineDash([2, 3]);
            ctx.beginPath(); ctx.moveTo(xa, bandTop); ctx.lineTo(xb, bandTop); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#e3e8ef' : '#2b3340';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        (res.segments || []).forEach((s, i) => {
            fillRegionName(ctx, toRoman(i + 1), regionLabelSpans(s).map(([a, b]) => [xs.getPixelForValue(a), xs.getPixelForValue(b)]), area.top - DIAGRAM_REGION_BAND / 2, [15, 12, 10]);
        });
        ctx.restore();
    },
    afterDatasetsDraw(chart) {
        const res = lastAnalysis && lastAnalysis.result;
        const kind = DIAGRAM_KINDS[chart.canvas.id];
        if (!res || !res.solved || !kind || !chart.scales.y) return;
        if (window.diagramLabelsHidden) return;
        const area = chart.chartArea, xs = chart.scales.x, ys = chart.scales.y;
        const ctx = chart.ctx;
        const dark = document.body.classList.contains('dark-mode');
        const color = chart.data.datasets[0].borderColor || '#333';
        const y0 = ys.getPixelForValue(0);

        ctx.save();
        // (+)/(−) bölge işaretleri
        if (kind !== 'd') {
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.85;
            signRegions(res, kind, res.L).forEach(r => {
                const px = xs.getPixelForValue(r.xc);
                const py = ys.getPixelForValue(r.yc);
                // Bölge çok inceyse (işaret sığmıyorsa) yazılmaz
                if (Math.abs(py - y0) < 7) return;
                ctx.fillText(r.s > 0 ? '+' : '−', px, Math.min(Math.max(py, area.top + 9), area.bottom - 9));
            });
            ctx.globalAlpha = 1;
        }

        // Değer etiketleri
        ctx.font = 'bold 11px Arial';
        const placed = [];
        const overlaps = (r) => placed.some(p => r.x < p.x + p.w && r.x + r.w > p.x && r.y < p.y + p.h && r.y + r.h > p.y);
        const drawLabel = (xVal, v, align, text, mark) => {
            const px = xs.getPixelForValue(xVal), py = ys.getPixelForValue(v);
            if (px < area.left - 2 || px > area.right + 2) return;
            const w = ctx.measureText(text).width + 6, h = 14;
            const outward = py <= y0 ? -1 : 1;
            let lx = align === 'right' ? px - 4 - w : (align === 'left' ? px + 4 : px - w / 2);
            lx = Math.min(Math.max(lx, area.left), area.right - w);
            let ly = outward < 0 ? py - 6 - h : py + 6;
            let rect = { x: lx, y: ly, w, h };
            for (let k = 0; k < 3 && overlaps(rect); k++) { ly += outward * (h + 1); rect = { x: lx, y: ly, w, h }; }
            if (overlaps(rect)) return;
            ly = Math.min(Math.max(ly, area.top - 2), area.bottom - h + 8);
            rect.y = ly;
            placed.push(rect);
            if (mark) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 2 * Math.PI); ctx.fill(); }
            ctx.fillStyle = dark ? 'rgba(15,20,25,0.85)' : 'rgba(255,255,255,0.88)';
            ctx.fillRect(rect.x, rect.y, w, h);
            ctx.fillStyle = dark ? '#f0f0f0' : '#222';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(text, rect.x + 3, rect.y + 2);
        };
        if (kind === 'd') {
            const e = res.extremes && res.extremes.dmax;
            if (e && Math.abs(e.value) > 1e-9) drawLabel(e.x, e.value, 'center', `δmax = ${fmtNum(e.value, 3)} mm`, true);
        } else {
            labelCandidates(res, kind).forEach(o => drawLabel(o.x, o.v, o.align, (o.extremum ? 'Mmax ' : '') + fmtNum(o.v), o.extremum));
        }
        ctx.restore();
    }
};

/** Diyagram x ekseninde yalnızca olay noktalarına (A, B, …) işaret konur. */
function eventTickOptions() {
    return {
        autoSkip: false, maxRotation: 0, font: { size: 10 },
        callback: (v) => {
            const res = lastAnalysis && lastAnalysis.result;
            const p = res && res.points && res.points.find(q => Math.abs(q.x - v) < 1e-6);
            return p ? [`${p.name}`, Number(v.toFixed(2)).toString()] : Number(v.toFixed(2)).toString();
        }
    };
}

function eventTicksAfterBuild(axis) {
    const res = lastAnalysis && lastAnalysis.result;
    if (res && res.points && res.points.length) axis.ticks = res.points.map(p => ({ value: p.x }));
}

// ---------- Durum çubuğu ----------

function updateSystemStatus(analysis) {
    const el = document.getElementById('system-status');
    if (!el) return;
    const st = analysis && analysis.status;
    if (!beam || !st || st.kind === 'empty') { el.classList.add('hidden'); el.innerHTML = ''; el.dataset.key = ''; return; }
    el.classList.remove('hidden');
    let cls, title, msg;
    const p = Object.assign({ r: '?', e: '?', nh: 0, degree: 0, x: '' }, st.params || {});
    if (typeof p.x === 'number') p.x = fmtNum(p.x);
    if (st.kind === 'isostatic') { cls = 'ok'; title = tFormat('statusKindIsostatic'); msg = tFormat(p.vertical ? 'statusIsostaticVertical' : 'statusIsostatic', p); }
    else if (st.kind === 'hyperstatic') { cls = st.solvable ? 'note' : 'error'; title = tFormat('statusKindHyperstatic'); msg = tFormat(st.reason || 'statusHyperstatic', p); }
    else { cls = 'error'; title = tFormat('statusKindUnstable'); msg = tFormat(st.reason || 'statusMechanism', p); }
    el.className = `system-status ${cls}`;
    // Tuvaller için metin alternatifi: model özeti + durum
    const res = analysis.result;
    if (canvas && res) {
        const sup = res.normalized.supports.map(s => `${res.nameOf(s.x)} (${tFormat(s.type === 'pin-support' ? 'pinSupportTitle' : s.type === 'roller-support' ? 'rollerSupportTitle' : 'fixedSupportTitle')}, x = ${fmtNum(s.x)} m)`).join(', ');
        canvas.setAttribute('aria-label', `${tFormat('structuralModel')}: L = ${fmtNum(res.L)} m. ${sup}. ${title}.`);
    }
    // Ayrıntı yalnızca tıklayınca açılır; sistem çözülemez hale geldiğinde (durum değişince) bir kez kendiliğinden açılır
    const key = `${st.kind}|${st.reason || ''}|${st.solvable}`;
    const prev = el.querySelector('.status-detail');
    const wasOpen = prev && !prev.hidden;
    const open = wasOpen || (el.dataset.key !== key && cls === 'error');
    el.dataset.key = key;
    el.dataset.text = `${title}: ${msg}`;
    el.innerHTML = `<button type="button" class="status-chip" aria-expanded="${open}" aria-controls="system-status-detail" title="${escapeHTMLText(msg)}">` +
        `<span class="status-title">${escapeHTMLText(title)}</span>` +
        `<svg class="status-info" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg></button>` +
        `<div class="status-detail" id="system-status-detail" role="status" aria-live="polite"${open ? '' : ' hidden'}>${escapeHTMLText(msg)}</div>`;
}

function setStatusDetailOpen(open) {
    const el = document.getElementById('system-status');
    const chip = el && el.querySelector('.status-chip'), det = el && el.querySelector('.status-detail');
    if (!chip || !det) return;
    det.hidden = !open;
    chip.setAttribute('aria-expanded', String(open));
}

document.addEventListener('click', (e) => {
    const chip = e.target.closest && e.target.closest('#system-status .status-chip');
    if (chip) { setStatusDetailOpen(chip.getAttribute('aria-expanded') !== 'true'); return; }
    if (!(e.target.closest && e.target.closest('#system-status'))) setStatusDetailOpen(false);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setStatusDetailOpen(false); });

// ---------- Öğrenme paneli (sekmeler) ----------

const LEARNING_TABS = [
    { id: 'results', key: 'resultsTitle' },
    { id: 'steps', key: 'stepsTitle' },
    { id: 'regions', key: 'regionsTitle' },
    { id: 'practice', key: 'practiceTitle' }
];
let activeLearningTab = 'results';
try { activeLearningTab = localStorage.getItem('learningTab') || 'results'; } catch (e) { /* depolama kapalı */ }

function buildLearningPanel() {
    const panel = document.getElementById('learning-panel');
    if (!panel) return;
    const tabs = LEARNING_TABS.map(t => `<button type="button" role="tab" class="learning-tab" id="learning-tab-${t.id}" data-tab="${t.id}" aria-controls="learning-${t.id}" data-i18n="${t.key}">${escapeHTMLText(tFormat(t.key))}</button>`).join('');
    const sections = LEARNING_TABS.map(t => `<div role="tabpanel" class="learning-section" id="learning-${t.id}" aria-labelledby="learning-tab-${t.id}"></div>`).join('');
    panel.innerHTML = `
        <h4 data-i18n="learningPanelTitle">${escapeHTMLText(tFormat('learningPanelTitle'))}</h4>
        <button type="button" class="sign-convention-btn" id="sign-convention-btn" data-i18n-title="signConventionTitle" title="${escapeHTMLText(tFormat('signConventionTitle'))}">±<span data-i18n="signConventionButton">${escapeHTMLText(tFormat('signConventionButton'))}</span></button>
        <button class="toggle-button" data-i18n-title="hide">${ICON_EYE_HIDE}</button>
        <div class="content-wrapper">
            <div class="learning-tabs" role="tablist">${tabs}</div>
            ${sections}
        </div>`;
    panel.querySelectorAll('.learning-tab').forEach(btn => btn.addEventListener('click', () => setLearningTab(btn.dataset.tab)));
    panel.querySelector('#sign-convention-btn').addEventListener('click', showSignConventionModal);
    setLearningTab(activeLearningTab, false);
}

function setLearningTab(id, render = true) {
    if (!LEARNING_TABS.some(t => t.id === id)) id = 'results';
    activeLearningTab = id;
    try { localStorage.setItem('learningTab', id); } catch (e) { /* depolama kapalı */ }
    document.querySelectorAll('.learning-tab').forEach(b => {
        const on = b.dataset.tab === id;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.learning-section').forEach(s => s.classList.toggle('hidden', s.id !== `learning-${id}`));
    if (render) updateLearningPanel(lastAnalysis);
}

function updateLearningPanel(analysis) {
    const panel = document.getElementById('learning-panel');
    if (!panel) return;
    if (!panel.querySelector('.learning-tabs')) buildLearningPanel();
    const show = !!beam;
    panel.classList.toggle('hidden', !show);
    if (!show) return;
    const res = analysis && analysis.result;
    // Etkin olmayan sekmeler de güncellenir; içerik küçüktür ve dil değişiminde tutarlı kalır
    renderResultsSection(document.getElementById('learning-results'), res);
    if (typeof renderStepsSection === 'function') renderStepsSection(document.getElementById('learning-steps'), res);
    if (typeof renderRegionsSection === 'function') renderRegionsSection(document.getElementById('learning-regions'), res);
    if (typeof renderPracticeSection === 'function') renderPracticeSection(document.getElementById('learning-practice'), res);
}

function notSolvedHTML(res) {
    return `<p class="learning-empty">${escapeHTMLText(tFormat('hintFixSystem'))}</p>`;
}

function directionText(comp, v) {
    if (Math.abs(v) < 0.005) return '';
    if (comp === 'Fy') return tFormat(v > 0 ? 'dirUp' : 'dirDown');
    if (comp === 'Fx') return tFormat(v > 0 ? 'dirRight' : 'dirLeft');
    return tFormat(v > 0 ? 'dirCCW' : 'dirCW');
}

function renderResultsSection(el, res) {
    if (!el) return;
    if (!res || !res.solved) { el.innerHTML = notSolvedHTML(res); return; }
    const rows = [];
    res.reactions.forEach(r => {
        rows.push([r.name, fmtNum(r.x), subHTML(`${r.name}_y`), `${fmtNum(r.Fy)} kN`, directionText('Fy', r.Fy)]);
        if (r.type !== 'roller-support' && (res.hasAxial || Math.abs(r.Fx) > 1e-9)) rows.push([r.name, fmtNum(r.x), subHTML(`${r.name}_x`), `${fmtNum(r.Fx)} kN`, directionText('Fx', r.Fx)]);
        if (r.type === 'fixed-support') rows.push([r.name, fmtNum(r.x), subHTML(`M_${r.name}`), `${fmtNum(r.Mz)} kNm`, directionText('Mz', r.Mz)]);
    });
    if (res.torsionReaction) rows.push([res.torsionReaction.name, fmtNum(res.torsionReaction.x), subHTML(`T_${res.torsionReaction.name}`), `${fmtNum(res.torsionReaction.Mx)} kNm`, '']);
    const table = (cls, head, body) => `<div class="table-wrapper results-table-wrapper ${cls}"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

    let html = `<h3>${escapeHTMLText(tFormat('reactionsHeading'))}</h3>`;
    html += table('', [tFormat('colPoint'), tFormat('colX'), tFormat('colComponent'), tFormat('colValue'), tFormat('colDirection')].map(escapeHTMLText), rows);

    if (res.hingeForces.length) {
        html += `<h3>${escapeHTMLText(tFormat('hingeForcesHeading'))}</h3>`;
        html += table('', [tFormat('colPoint'), tFormat('colX'), tFormat('colComponent'), tFormat('colValue')].map(escapeHTMLText),
            res.hingeForces.map(h => [h.name, fmtNum(h.x), `V (${escapeHTMLText(tFormat('hingeShearLabel'))})`, `${fmtNum(h.V)} kN`]));
    }

    const e = res.extremes;
    const ex = [];
    if (e.Vmax && e.Vmax.value > 0.005) ex.push([escapeHTMLText(tFormat('maxShear')), `${fmtNum(e.Vmax.value)} kN`, fmtNum(e.Vmax.x)]);
    if (e.Vmin && e.Vmin.value < -0.005) ex.push([escapeHTMLText(tFormat('minShear')), `${fmtNum(e.Vmin.value)} kN`, fmtNum(e.Vmin.x)]);
    if (e.Mmax && e.Mmax.value > 0.005) ex.push([escapeHTMLText(tFormat('maxMoment')), `${fmtNum(e.Mmax.value)} kNm`, fmtNum(e.Mmax.x)]);
    if (e.Mmin && e.Mmin.value < -0.005) ex.push([escapeHTMLText(tFormat('minMoment')), `${fmtNum(e.Mmin.value)} kNm`, fmtNum(e.Mmin.x)]);
    if (e.dmax && Math.abs(e.dmax.value) > 1e-9) ex.push([escapeHTMLText(tFormat('maxDeflection')), `${fmtNum(e.dmax.value, 3)} mm`, fmtNum(e.dmax.x)]);
    html += `<h3>${escapeHTMLText(tFormat('extremesHeading'))}</h3>`;
    html += table('', ['', tFormat('colValue'), tFormat('colX')].map(escapeHTMLText), ex);

    const hingeXs = res.normalized.hinges.map(h => h.x);
    const supXs = res.normalized.supports.map(s => s.x);
    const crit = res.critical.map((c, i) => {
        const notes = [];
        if (c.kind === 'zeroShear') notes.push(tFormat('noteZeroShear'));
        else {
            if (supXs.some(x => Math.abs(x - c.x) < 1e-6)) notes.push(tFormat('noteSupport'));
            if (hingeXs.some(x => Math.abs(x - c.x) < 1e-6)) notes.push(tFormat('noteHinge'));
            if (i > 0 && i < res.critical.length - 1) {
                if (Math.abs(c.Vl - c.Vr) > 1e-6) notes.push(tFormat('noteJumpV'));
                if (Math.abs(c.Ml - c.Mr) > 1e-6) notes.push(tFormat('noteJumpM'));
            }
        }
        const first = i === 0, last = i === res.critical.length - 1;
        return [c.name || '—', fmtNum(c.x), first ? '' : fmtNum(c.Vl), last ? '' : fmtNum(c.Vr), first ? '' : fmtNum(c.Ml), last ? '' : fmtNum(c.Mr), escapeHTMLText(notes.join(', '))];
    });
    html += `<h3>${escapeHTMLText(tFormat('criticalPointsHeading'))}</h3>`;
    html += table('critical-table', [tFormat('colPoint'), tFormat('colX'), tFormat('colVleft'), tFormat('colVright'), tFormat('colMleft'), tFormat('colMright'), tFormat('colNote')].map(escapeHTMLText), crit);
    el.innerHTML = html;
}

// ---------- İşaret kabulü penceresi ----------

// İşaret kabulü şekli: SCD ile aynı çizim fonksiyonları (kalın ok, dolu ok başı, yay) kullanılır.
// Sol parçanın sağ yüzünde ve sağ parçanın sol yüzünde pozitif N, V, M ve T gösterilir.
function drawSignConventionFigure(cv) {
    const W = 640, H = 230;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.aspectRatio = `${W} / ${H}`;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dark = document.body.classList.contains('dark-mode');
    const color = typeof CUT_SECTION_COLOR !== 'undefined' ? (dark ? '#c58af0' : CUT_SECTION_COLOR) : '#6a1b9a';
    const text = dark ? '#f0f0f0' : '#222';
    const y = 100, h = 22;
    const L0 = 20, L1 = 185, R0 = 455, R1 = 620;

    // Kiriş parçaları (SCD'deki kiriş görünümü)
    ctx.save();
    ctx.fillStyle = COLORS.BEAM_FILL; ctx.strokeStyle = COLORS.BEAM_STROKE; ctx.lineWidth = 2;
    [[L0, L1], [R0, R1]].forEach(([a, b]) => { ctx.beginPath(); ctx.rect(a, y - h / 2, b - a, h); ctx.fill(); ctx.stroke(); });
    // Kesit yüzleri
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    [L1, R0].forEach(x => { ctx.beginPath(); ctx.moveTo(x, y - h / 2 - 4); ctx.lineTo(x, y + h / 2 + 4); ctx.stroke(); });
    ctx.restore();

    const label = (t, x, yy, align = 'center') => {
        ctx.save(); ctx.fillStyle = color; ctx.font = 'bold 16px Arial'; ctx.textAlign = align; ctx.textBaseline = 'middle';
        ctx.fillText(t, x, yy); ctx.restore();
    };
    // Moment vektörü (çift ok başı): burulma momenti T
    const momentVector = (x1, x2, yy) => {
        drawFilledArrow(ctx, x1, yy, x2, yy, color);
        const dir = Math.sign(x2 - x1);
        ctx.save(); ctx.fillStyle = color;
        const hx = x2 - dir * 14;
        ctx.beginPath(); ctx.moveTo(hx, yy); ctx.lineTo(hx - dir * 18, yy - 8); ctx.lineTo(hx - dir * 18, yy + 8); ctx.closePath(); ctx.fill();
        ctx.restore();
    };

    // Sol parça, sağ yüz: N →, V ↓ (eksene ortalı), M ↺, T → (dışa doğru vektör)
    drawFilledArrow(ctx, L1, y, L1 + 60, y, color);
    label('N', L1 + 70, y - 14, 'left');
    drawFilledArrow(ctx, L1 + 14, y - 30, L1 + 14, y + 30, color);
    label('V', L1 + 26, y + 34, 'left');
    drawFilledArcArrow(ctx, L1, y, h / 2 + 26, Math.PI / 3, -Math.PI / 3, true, color);
    label('M', L1 + 26, y - 52, 'left');
    momentVector(L1, L1 + 66, y + 82);
    label('T', L1 + 76, y + 82, 'left');

    // Sağ parça, sol yüz: N ←, V ↑, M ↻, T ←
    drawFilledArrow(ctx, R0, y, R0 - 60, y, color);
    label('N', R0 - 70, y - 14, 'right');
    drawFilledArrow(ctx, R0 - 14, y + 30, R0 - 14, y - 30, color);
    label('V', R0 - 26, y + 34, 'right');
    drawFilledArcArrow(ctx, R0, y, h / 2 + 26, Math.PI - Math.PI / 3, Math.PI + Math.PI / 3, false, color);
    label('M', R0 - 26, y - 52, 'right');
    momentVector(R0, R0 - 66, y + 82);
    label('T', R0 - 76, y + 82, 'right');

    // T vektörlerinin kesit yüzüne bağlantısı (kesikli)
    ctx.save(); ctx.strokeStyle = color; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    [L1, R0].forEach(x => { ctx.beginPath(); ctx.moveTo(x, y + h / 2 + 4); ctx.lineTo(x, y + 82); ctx.stroke(); });
    ctx.restore();

    // Parça adları
    ctx.save(); ctx.fillStyle = text; ctx.font = '14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(tFormat('cutLeftPart'), (L0 + L1) / 2 - 20, y - h / 2 - 10);
    ctx.fillText(tFormat('cutRightPart'), (R0 + R1) / 2 + 20, y - h / 2 - 10);
    ctx.restore();
}

function showSignConventionModal() {
    const existing = document.querySelector('.sign-modal-backdrop');
    if (existing) existing.remove();
    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-modal-backdrop sign-modal-backdrop show';
    backdrop.innerHTML = `
        <div class="confirm-modal sign-modal" role="dialog" aria-modal="true" aria-labelledby="sign-modal-title">
            <div class="confirm-modal-header"><div class="icon">±</div><h3 id="sign-modal-title">${escapeHTMLText(tFormat('signConventionTitle'))}</h3></div>
            <p>${escapeHTMLText(tFormat('signConventionIntro'))}</p>
            <canvas class="sign-figure" role="img" aria-label="N, V, M, T"></canvas>
            <ul class="sign-list">
                <li>${tFormat('signN')}</li><li>${tFormat('signV')}</li><li>${tFormat('signM')}</li><li>${tFormat('signT')}</li>
            </ul>
            <p class="sign-note">${escapeHTMLText(tFormat('signLoads'))}</p>
            <p class="sign-note">${escapeHTMLText(tFormat('signRelations'))}</p>
            <div class="confirm-modal-footer"><button type="button" class="btn-primary" data-action="close">${escapeHTMLText(tFormat('aboutClose'))}</button></div>
        </div>`;
    document.body.appendChild(backdrop);
    const fig = backdrop.querySelector('.sign-figure');
    if (fig) drawSignConventionFigure(fig);
    const previous = document.activeElement;
    const close = () => { document.removeEventListener('keydown', onKey, true); backdrop.remove(); if (previous && previous.focus) previous.focus(); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop || e.target.closest('[data-action="close"]')) close(); });
    backdrop.querySelector('[data-action="close"]').focus();
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('sign-btn');
    if (btn) btn.addEventListener('click', showSignConventionModal);
});

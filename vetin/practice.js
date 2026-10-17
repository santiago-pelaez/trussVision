// practice.js - Alıştırma modu, rastgele problem üretici, paylaşım bağlantısı, Moodle XML
//
// "Tahmin et – gir – denetle" akışı: alıştırma modunda tepkiler, diyagramlar ve
// çözüm sekmeleri gizlenir; öğrenci tepkileri, kritik noktalardaki V/M
// değerlerini ve her bölgedeki eğri derecesini girer. Araç toleransla denetler,
// yaygın hatalara (işaret, sıçramayı unutma, tepkileri karıştırma, M_max'ın
// yerini kaçırma) özgü geri bildirim verir; kademeli ipucu ve "çözümü göster" sunar.
// Problemler tohumlu (seed) rastgele üretilir: aynı öğrenci numarası aynı soruyu verir.

// ---------- Tohumlu rastgele sayı üreteci ----------

function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; };
}

function makeRng(seed) {
    let a = hashSeed(String(seed))();
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---------- Problem şablonları (metre, kN) ----------

const PRACTICE_TEMPLATES = {
    basic: [
        (r) => { const L = r.pick([4, 5, 6, 8]); const a = r.int(1, L - 1); return { L, supports: [['pin-support', 0], ['roller-support', L]], P: [[a, r.pick([5, 10, 12, 15, 20])]] }; },
        (r) => { const L = r.pick([4, 5, 6]); return { L, supports: [['pin-support', 0], ['roller-support', L]], q: [[0, L, r.pick([2, 3, 4, 5])]] }; },
        (r) => { const L = r.pick([2, 3, 4]); return { L, supports: [['fixed-support', 0]], P: [[L, r.pick([4, 6, 8, 10])]] }; },
        (r) => { const L = r.pick([2, 3, 4]); return { L, supports: [['fixed-support', L]], q: [[0, L, r.pick([2, 3, 4])]] }; }
    ],
    intermediate: [
        (r) => { const L = r.pick([5, 6]); const b = L - r.pick([1, 2]); return { L, supports: [['pin-support', 0], ['roller-support', b]], q: [[0, L, r.pick([2, 3, 4])]], P: [[L, r.pick([4, 6, 8])]] }; },
        (r) => { const L = r.pick([3, 6]); return { L, supports: [['pin-support', 0], ['roller-support', L]], tri: [[0, L, 0, r.pick([3, 6, 9])]] }; },
        (r) => { const L = r.pick([6, 8]); return { L, supports: [['pin-support', 0], ['roller-support', L]], P: [[2, r.pick([6, 10])], [L - 2, r.pick([4, 8])]], C: [[L / 2, r.pick([-6, 6, 8])]] }; },
        (r) => { const L = r.pick([4, 5, 6]); return { L, supports: [['pin-support', 0], ['roller-support', L]], P: [[r.int(1, L - 1), r.pick([10, 20]), r.pick([30, 45, 60, 120, 135])]] }; }
    ],
    advanced: [
        (r) => { const L = r.pick([6, 8]); const h = r.pick([2, 3]); return { L, supports: [['fixed-support', 0], ['roller-support', L]], hinges: [h], q: [[0, L, r.pick([2, 3])]] }; },
        (r) => { const L = 8; return { L, supports: [['pin-support', 0], ['roller-support', 4], ['roller-support', 8]], hinges: [r.pick([5, 6])], q: [[0, 4, r.pick([2, 4])]], P: [[7, r.pick([6, 8, 10])]] }; },
        (r) => { const L = 6; return { L, supports: [['roller-support', 0], ['fixed-support', 6]], hinges: [r.pick([2, 3])], P: [[1, r.pick([6, 9])]], tri: [[3, 6, 0, r.pick([3, 6])]] }; }
    ]
};

function generatePracticeModel(level, seed) {
    const rnd = makeRng(`${level}:${seed}`);
    const r = {
        pick: (arr) => arr[Math.floor(rnd() * arr.length)],
        int: (a, b) => a + Math.floor(rnd() * (b - a + 1))
    };
    const list = PRACTICE_TEMPLATES[level] || PRACTICE_TEMPLATES.basic;
    const spec = list[Math.floor(rnd() * list.length)](r);
    const rad = (d) => d * Math.PI / 180;
    return {
        format: 'vetin-beam', version: 2,
        meta: { title: { tr: `Alıştırma (${seed})`, en: `Practice (${seed})` }, level, practiceSeed: String(seed) },
        units: { length: 'm', force: 'kN', moment: 'kNm', distributedLoad: 'kN/m', angle: 'rad' },
        beam: { length: spec.L },
        supports: spec.supports.map(([type, x]) => ({ type, x })),
        hinges: (spec.hinges || []).map(x => ({ x })),
        concentratedLoads: (spec.P || []).map(([x, F, deg]) => ({ x, magnitude: F, angle: rad(deg === undefined ? 90 : deg) })),
        distributedLoads: (spec.q || []).map(([s, e, q]) => ({ startX: s, endX: e, magnitude: -q })),
        trapezoidalLoads: (spec.tri || []).map(([s, e, q1, q2]) => ({ startX: s, endX: e, startMagnitude: -q1, endMagnitude: -q2 })),
        concentratedMoments: (spec.C || []).map(([x, m]) => ({ x, magnitude: m })),
        torsionMoments: [],
        gridSettings: { metersPerGrid: 0.1, kNPerGrid: 1, gridSize: 20 }
    };
}

// ---------- Alıştırma durumu ----------

const practiceState = { active: false, answers: {}, results: null, hintLevel: 0, level: 'basic', seed: '' };

function setPracticeHidden(hidden) {
    practiceState.active = hidden;
    document.body.classList.toggle('practice-mode', hidden);
    fbdDisplayOptions.reactions = !hidden;
    document.querySelectorAll('.fbd-option-btn[data-fbd-option="reactions"]').forEach(b => b.setAttribute('aria-pressed', String(!hidden)));
    if (hidden && typeof setCutMode === 'function' && cutModeActive) setCutMode(false);
    redrawFreeBodyDiagram();
    if (typeof redrawCanvas === 'function') redrawCanvas();
}

function practiceQuestions(res) {
    const qs = [];
    res.reactions.forEach(r => {
        if (r.type !== 'roller-support' && res.hasAxial) qs.push({ id: `R-${r.name}-x`, label: subHTML(`${r.name}_x`), unit: 'kN', value: r.Fx, group: 'reactions' });
        qs.push({ id: `R-${r.name}-y`, label: subHTML(`${r.name}_y`), unit: 'kN', value: r.Fy, group: 'reactions' });
        if (r.type === 'fixed-support') qs.push({ id: `R-${r.name}-m`, label: subHTML(`M_${r.name}`), unit: 'kNm', value: r.Mz, group: 'reactions', hint: 'ccw' });
    });
    const crit = res.critical.filter(c => c.kind === 'event');
    crit.forEach((c, i) => {
        const first = i === 0, last = i === crit.length - 1;
        const jumpV = !first && !last && Math.abs(c.Vl - c.Vr) > 1e-6;
        const jumpM = !first && !last && Math.abs(c.Ml - c.Mr) > 1e-6;
        if (!last) {
            if (jumpV) qs.push({ id: `V-${c.name}-l`, label: `V(${c.name}<sup>−</sup>)`, unit: 'kN', value: c.Vl, other: c.Vr, group: 'shear' });
            qs.push({ id: `V-${c.name}-r`, label: first || !jumpV ? `V(${c.name}${first ? '<sup>+</sup>' : ''})` : `V(${c.name}<sup>+</sup>)`, unit: 'kN', value: c.Vr, other: jumpV ? c.Vl : null, group: 'shear' });
        }
        if (jumpM) {
            qs.push({ id: `M-${c.name}-l`, label: `M(${c.name}<sup>−</sup>)`, unit: 'kNm', value: c.Ml, other: c.Mr, group: 'moment' });
            qs.push({ id: `M-${c.name}-r`, label: `M(${c.name}<sup>+</sup>)`, unit: 'kNm', value: c.Mr, other: c.Ml, group: 'moment' });
        } else if (!first && !last) {
            qs.push({ id: `M-${c.name}`, label: `M(${c.name})`, unit: 'kNm', value: c.Mr, group: 'moment' });
        } else if (Math.abs(first ? c.Mr : c.Ml) > 1e-6) {
            qs.push({ id: `M-${c.name}`, label: `M(${c.name}${first ? '<sup>+</sup>' : '<sup>−</sup>'})`, unit: 'kNm', value: first ? c.Mr : c.Ml, group: 'moment' });
        }
    });
    res.critical.filter(c => c.kind === 'zeroShear').forEach((c, i) => {
        qs.push({ id: `Z-${i}-x`, label: `x (V = 0)`, unit: 'm', value: c.x, group: 'extreme' });
        qs.push({ id: `Z-${i}-m`, label: `M<sub>ext</sub>`, unit: 'kNm', value: c.Ml, group: 'extreme' });
    });
    res.segments.forEach((s, i) => {
        const deg = (c) => c.reduce((d, a, k) => (Math.abs(a) > 5e-4 ? k : d), 0);
        qs.push({ id: `D-${i}-V`, label: `V: ${regionLabel(s, i)}`, kind: 'degree', value: deg(s.V.global), group: 'shape' });
        qs.push({ id: `D-${i}-M`, label: `M: ${regionLabel(s, i)}`, kind: 'degree', value: deg(s.M.global), group: 'shape' });
    });
    return qs;
}

function parseAnswer(v) {
    const n = parseFloat(String(v).replace(',', '.').replace('−', '-'));
    return Number.isFinite(n) ? n : null;
}

function diagnose(q, a, all, res) {
    if (q.kind === 'degree') return a === q.value ? { ok: true } : { ok: false, key: 'fbShapeWrong' };
    const tol = Math.max(0.02, 0.01 * Math.abs(q.value));
    if (a === null) return { ok: false, key: 'fbEmpty' };
    if (Math.abs(a - q.value) <= tol) return { ok: true };
    if (Math.abs(q.value) > 0.01 && Math.abs(a + q.value) <= tol) return { ok: false, key: 'fbSign' };
    if (q.other !== null && q.other !== undefined && Math.abs(a - q.other) <= tol) return { ok: false, key: q.group === 'shear' ? 'fbJumpV' : 'fbJumpM' };
    if (q.group === 'reactions' && all.some(o => o.group === 'reactions' && o.id !== q.id && Math.abs(a - o.value) <= tol)) return { ok: false, key: 'fbSwapped' };
    if (q.group === 'extreme' && q.unit === 'm') return { ok: false, key: 'fbZeroShear' };
    if (q.group === 'moment' && res.hingeForces.some(h => q.label.includes(res.nameOf(h.x)))) return { ok: false, key: 'fbHinge' };
    return { ok: false, key: 'fbWrong' };
}

const PRACTICE_GROUPS = [
    { id: 'reactions', key: 'pqReactions' }, { id: 'shear', key: 'pqShear' }, { id: 'moment', key: 'pqMoment' },
    { id: 'extreme', key: 'pqExtreme' }, { id: 'shape', key: 'pqShape' }
];

function renderPracticeSection(el, res) {
    if (!el) return;
    const levelOpts = ['basic', 'intermediate', 'advanced'].map(l => `<option value="${l}"${practiceState.level === l ? ' selected' : ''}>${escapeHTMLText(tFormat({ basic: 'levelBasic', intermediate: 'levelIntermediate', advanced: 'levelAdvanced' }[l]))}</option>`).join('');
    let html = `
        <p>${escapeHTMLText(tFormat('practiceIntro'))}</p>
        <div class="practice-generator">
            <label>${escapeHTMLText(tFormat('practiceLevel'))} <select id="practice-level">${levelOpts}</select></label>
            <label>${escapeHTMLText(tFormat('practiceSeed'))} <input id="practice-seed" type="text" value="${escapeHTMLText(practiceState.seed)}" placeholder="${escapeHTMLText(tFormat('practiceSeedPlaceholder'))}" maxlength="20"></label>
            <button type="button" class="btn-primary" id="practice-new">${escapeHTMLText(tFormat('practiceNew'))}</button>
            <button type="button" class="btn-cancel" id="practice-current">${escapeHTMLText(tFormat('practiceCurrent'))}</button>
        </div>`;
    if (!practiceState.active) {
        html += `<p class="eq-note">${escapeHTMLText(tFormat('practiceHowTo'))}</p>`;
        html += practiceToolsHTML();
        el.innerHTML = html;
        bindPracticeControls(el, res);
        return;
    }
    if (!res || !res.solved) {
        html += notSolvedHTML(res);
        el.innerHTML = html;
        bindPracticeControls(el, res);
        return;
    }
    const qs = practiceQuestions(res);
    const results = practiceState.results;
    const degreeOpts = (sel) => [0, 1, 2, 3].map(d => `<option value="${d}"${sel === d ? ' selected' : ''}>${escapeHTMLText(tFormat('degree' + d))}</option>`).join('');
    html += `<form id="practice-form" class="practice-form" novalidate>`;
    PRACTICE_GROUPS.forEach(g => {
        const items = qs.filter(q => q.group === g.id);
        if (!items.length) return;
        html += `<fieldset class="practice-group"><legend>${escapeHTMLText(tFormat(g.key))}</legend><div class="practice-grid">`;
        items.forEach(q => {
            const prev = practiceState.answers[q.id];
            const r = results && results[q.id];
            const cls = r ? (r.ok ? 'ok' : 'bad') : '';
            const input = q.kind === 'degree'
                ? `<select data-q="${q.id}"><option value=""></option>${degreeOpts(prev === undefined || prev === '' ? null : Number(prev))}</select>`
                : `<input data-q="${q.id}" type="text" inputmode="decimal" value="${prev !== undefined ? escapeHTMLText(prev) : ''}" aria-label="${escapeHTMLText(q.label.replace(/<[^>]+>/g, ''))}">`;
            const fb = r && !r.ok ? `<span class="practice-fb">${escapeHTMLText(tFormat(r.key))}</span>` : (r && r.ok ? '<span class="practice-fb ok">✓</span>' : '');
            html += `<label class="practice-item ${cls}"><span class="practice-label">${q.label}${q.unit ? ` <small>(${q.unit})</small>` : ''}</span>${input}${fb}</label>`;
        });
        html += `</div></fieldset>`;
    });
    const score = results ? Object.values(results).filter(r => r.ok).length : null;
    html += `<div class="practice-actions">
            <button type="submit" class="btn-primary">${escapeHTMLText(tFormat('practiceCheck'))}</button>
            <button type="button" class="btn-cancel" id="practice-hint">${escapeHTMLText(tFormat('practiceHint'))}</button>
            <button type="button" class="btn-warning" id="practice-reveal">${escapeHTMLText(tFormat('practiceReveal'))}</button>
            ${score !== null ? `<span class="practice-score">${escapeHTMLText(tFormat('practiceScore', { ok: score, total: qs.length }))}</span>` : ''}
        </div></form>
        <div id="practice-hint-box" class="practice-hint" aria-live="polite">${practiceHintHTML(res)}</div>`;
    html += practiceToolsHTML();
    el.innerHTML = html;
    bindPracticeControls(el, res);
    const form = el.querySelector('#practice-form');
    form.addEventListener('input', (e) => { const id = e.target.dataset.q; if (id) practiceState.answers[id] = e.target.value; });
    form.addEventListener('change', (e) => { const id = e.target.dataset.q; if (id) practiceState.answers[id] = e.target.value; });
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const out = {};
        qs.forEach(q => {
            const raw = practiceState.answers[q.id];
            const a = q.kind === 'degree' ? (raw === undefined || raw === '' ? null : Number(raw)) : parseAnswer(raw);
            out[q.id] = q.kind === 'degree' && a === null ? { ok: false, key: 'fbEmpty' } : diagnose(q, a, qs, res);
        });
        practiceState.results = out;
        renderPracticeSection(el, res);
        el.querySelector('.practice-score')?.scrollIntoView({ block: 'nearest' });
    });
    el.querySelector('#practice-hint').addEventListener('click', () => {
        practiceState.hintLevel = Math.min(practiceState.hintLevel + 1, 3);
        el.querySelector('#practice-hint-box').innerHTML = practiceHintHTML(res);
    });
    el.querySelector('#practice-reveal').addEventListener('click', () => {
        setPracticeHidden(false);
        practiceState.results = null;
        updateLearningPanel(lastAnalysis);
        setLearningTab('steps');
    });
}

function practiceHintHTML(res) {
    const lvl = practiceState.hintLevel;
    if (!lvl || !res || !res.solved) return '';
    const parts = [`<p>💡 ${escapeHTMLText(tFormat('hint1'))}</p>`];
    if (lvl >= 2) parts.push(`<p>💡 ${escapeHTMLText(tFormat('hint2'))}</p>`);
    if (lvl >= 3) {
        const eq = res.equations.find(e => e.kind === 'sumM');
        if (eq && typeof equationHTML === 'function') parts.push(`<p>💡 ${escapeHTMLText(tFormat('hint3'))}</p>${equationHTML(eq, res.normalized, res)}`);
    }
    return parts.join('');
}

function practiceToolsHTML() {
    return `<div class="practice-tools">
        <h3>${escapeHTMLText(tFormat('shareTitle'))}</h3>
        <p class="eq-note">${escapeHTMLText(tFormat('shareIntro'))}</p>
        <button type="button" class="btn-cancel" id="share-copy">${escapeHTMLText(tFormat('shareCopy'))}</button>
        <button type="button" class="btn-cancel" id="share-practice-copy">${escapeHTMLText(tFormat('sharePracticeCopy'))}</button>
        <button type="button" class="btn-cancel" id="moodle-export">${escapeHTMLText(tFormat('moodleExport'))}</button>
        <span class="share-status" id="share-status" role="status" aria-live="polite"></span>
    </div>`;
}

function bindPracticeControls(el, res) {
    const lv = el.querySelector('#practice-level');
    const sd = el.querySelector('#practice-seed');
    if (lv) lv.addEventListener('change', () => { practiceState.level = lv.value; });
    if (sd) sd.addEventListener('input', () => { practiceState.seed = sd.value.trim(); });
    el.querySelector('#practice-new')?.addEventListener('click', () => {
        practiceState.level = lv.value;
        practiceState.seed = sd.value.trim() || String(Math.floor(Math.random() * 90000) + 10000);
        startPractice(practiceState.level, practiceState.seed);
    });
    el.querySelector('#practice-current')?.addEventListener('click', () => {
        practiceState.answers = {}; practiceState.results = null; practiceState.hintLevel = 0;
        setPracticeHidden(true);
        updateLearningPanel(lastAnalysis);
    });
    el.querySelector('#share-copy')?.addEventListener('click', () => copyText(buildShareUrl()));
    el.querySelector('#share-practice-copy')?.addEventListener('click', () => {
        const seed = practiceState.seed || (sd && sd.value.trim()) || '1';
        copyText(`${location.origin}${location.pathname}#p=${encodeURIComponent(practiceState.level)}:${encodeURIComponent(seed)}`);
    });
    el.querySelector('#moodle-export')?.addEventListener('click', exportMoodleXML);
}

function startPractice(level, seed) {
    const model = generatePracticeModel(level, seed);
    if (!loadModelIntoApp(model)) return;
    practiceState.level = level; practiceState.seed = String(seed);
    practiceState.answers = {}; practiceState.results = null; practiceState.hintLevel = 0;
    setPracticeHidden(true);
    setLearningTab('practice');
    document.getElementById('learning-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Paylaşım bağlantısı (#m=…) ----------

function base64UrlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s) {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
    const bin = atob(b64);
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

/** Modeli adres çubuğuna gömülü bir bağlantıya çevirir (parça sunucuya gönderilmez). */
function buildShareUrl() {
    const snap = typeof getModelSnapshot === 'function' ? getModelSnapshot() : null;
    if (!snap) return location.href.split('#')[0];
    delete snap.gridSettings;
    return `${location.origin}${location.pathname}#m=${base64UrlEncode(JSON.stringify(snap))}`;
}

function copyText(text) {
    const status = document.getElementById('share-status');
    const done = (ok) => { if (status) status.textContent = tFormat(ok ? 'shareCopied' : 'shareCopyFailed'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), () => { window.prompt('', text); done(true); });
    else { window.prompt('', text); done(true); }
}

/** Sayfa #m=… (model) ya da #p=düzey:tohum (alıştırma) ile açıldıysa uygular. */
function applyLocationHash() {
    const h = location.hash || '';
    try {
        if (h.startsWith('#m=')) {
            const data = JSON.parse(base64UrlDecode(h.slice(3)));
            if (data && typeof data === 'object') { loadModelIntoApp(data); return true; }
        } else if (h.startsWith('#p=')) {
            const [level, seed] = h.slice(3).split(':').map(decodeURIComponent);
            startPractice(['basic', 'intermediate', 'advanced'].includes(level) ? level : 'basic', seed || '1');
            return true;
        }
    } catch (e) {
        console.error('Bağlantıdaki model okunamadı:', e);
        alert(tFormat('alertInvalidModel'));
    }
    return false;
}

// ---------- Moodle XML (sayısal sorular) ----------

function xmlEscape(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function exportMoodleXML() {
    const res = lastAnalysis && lastAnalysis.result;
    if (!res || !res.solved) { alert(tFormat('hintFixSystem')); return; }
    // Soru görseli: tepkiler gizli SCD (yükler ve ölçüler)
    const prevReactions = fbdDisplayOptions.reactions;
    const wasCut = typeof cutModeActive !== 'undefined' && cutModeActive;
    if (wasCut) setCutMode(false);
    fbdDisplayOptions.reactions = false; redrawFreeBodyDiagram();
    let img = '';
    try { img = fbdCanvas.clientWidth ? fbdCanvas.toDataURL('image/png').split(',')[1] : ''; } catch (e) { img = ''; }
    fbdDisplayOptions.reactions = prevReactions; redrawFreeBodyDiagram();
    if (wasCut) setCutMode(true);
    const name = (practiceState.seed ? `vetin-${practiceState.level}-${practiceState.seed}` : 'vetin-beam');
    const intro = xmlEscape(tFormat('moodleIntro'));
    const image = img ? `<p><img src="@@PLUGINFILE@@/beam.png" alt="beam" /></p>` : '';
    const file = img ? `<file name="beam.png" path="/" encoding="base64">${img}</file>` : '';
    const q = (title, text, value) => {
        const tol = Math.max(0.02, Math.abs(value) * 0.01);
        return `<question type="numerical"><name><text>${xmlEscape(`${name} – ${title}`)}</text></name>
<questiontext format="html"><text><![CDATA[<p>${intro}</p>${image}<p>${text}</p>]]></text>${file}</questiontext>
<defaultgrade>1</defaultgrade><penalty>0.3333333</penalty>
<answer fraction="100"><text>${value.toFixed(4)}</text><tolerance>${tol.toFixed(4)}</tolerance></answer>
</question>`;
    };
    const items = [];
    res.reactions.forEach(r => {
        items.push(q(`${r.name}_y`, xmlEscape(tFormat('moodleAskReaction', { comp: `${r.name}_y`, unit: 'kN' })), r.Fy));
        if (r.type === 'fixed-support') items.push(q(`M_${r.name}`, xmlEscape(tFormat('moodleAskReaction', { comp: `M_${r.name}`, unit: 'kNm' })), r.Mz));
    });
    items.push(q('Mmax', xmlEscape(tFormat('moodleAskMmax')), res.extremes.Mmax.value));
    items.push(q('Mmin', xmlEscape(tFormat('moodleAskMmin')), res.extremes.Mmin.value));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n<question type="category"><category><text>$course$/vetin/${xmlEscape(name)}</text></category></question>\n${items.join('\n')}\n</quiz>\n`;
    triggerDownload(xml, `${name}.moodle.xml`, 'application/xml', '.xml');
}

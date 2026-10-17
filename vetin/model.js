// model.js - Model verisinin tek giriş/çıkış noktası
//
// Çalışma anında model, çizim ve etkileşim kodu için tuval pikseli cinsinden
// global dizilerde tutulur (setup.js: beam, supports, ... ). Dosyaya yazılan ve
// dosyadan okunan model ise görünümden bağımsızdır: tüm konumlar kiriş
// başlangıcından itibaren METRE cinsindendir (dosya biçimi sürüm 2).
//
// Bu dosyanın üst kısmı saf fonksiyonlardır (DOM'a dokunmaz); tests/ ve tools/
// tarafından Node.js'te de yüklenir.
//
// Dosya biçimi, sürüm 2:
//   { format: 'vetin-beam', version: 2, units: {...},
//     beam: { length }, supports: [{ type, x }], hinges: [{ x }],
//     concentratedLoads: [{ x, magnitude, angle }],
//     distributedLoads: [{ startX, endX, magnitude }],
//     trapezoidalLoads: [{ startX, endX, startMagnitude, endMagnitude }],
//     concentratedMoments: [{ x, magnitude }], torsionMoments: [{ x, magnitude }],
//     gridSettings: { metersPerGrid, kNPerGrid, gridSize },
//     material: { elasticityModulus, momentOfInertia } }
// Sürüm 1 (eski, piksel cinsinden, "version" alanı yok) dosyalar okunmaya devam eder.

const MODEL_FILE_FORMAT = 'vetin-beam';
const MODEL_FILE_VERSION = 2;
const MODEL_ARRAY_KEYS = ['supports', 'hinges', 'concentratedLoads', 'distributedLoads', 'trapezoidalLoads', 'concentratedMoments', 'torsionMoments'];

const roundModelValue = (v) => Math.round(v * 1e6) / 1e6;

/**
 * Piksel cinsinden çalışma durumunu, metre cinsinden dosya verisine çevirir.
 * @param {object} state - { beam, supports, hinges, ... } (piksel)
 * @param {object} settings - { metersPerGrid, kNPerGrid, gridSize, elasticityModulus?, momentOfInertia? }
 * @returns {object|null} sürüm 2 dosya verisi; kiriş yoksa null
 */
function serializeModel(state, settings) {
    const b = state.beam;
    if (!b) return null;
    // Konumlar kirişin oluşturulduğu andaki ölçekle yorumlanır (bkz. getConversionFunctions)
    const ppm = (b.gridSizeOnCreation || settings.gridSize) / (b.metersPerGridOnCreation || settings.metersPerGrid);
    const m = (px) => roundModelValue((px - b.startX) / ppm);
    const data = {
        format: MODEL_FILE_FORMAT,
        version: MODEL_FILE_VERSION,
        units: { length: 'm', force: 'kN', moment: 'kNm', distributedLoad: 'kN/m', angle: 'rad' },
        beam: { length: roundModelValue((b.endX - b.startX) / ppm) },
        supports: (state.supports || []).map(s => ({ type: s.type, x: m(s.x) })),
        hinges: (state.hinges || []).map(h => ({ x: m(h.x) })),
        concentratedLoads: (state.concentratedLoads || []).map(l => ({ x: m(l.x), magnitude: l.magnitude, angle: l.angle })),
        distributedLoads: (state.distributedLoads || []).map(l => ({ startX: m(l.startX), endX: m(l.endX), magnitude: l.magnitude })),
        trapezoidalLoads: (state.trapezoidalLoads || []).map(l => ({ startX: m(l.startX), endX: m(l.endX), startMagnitude: l.startMagnitude, endMagnitude: l.endMagnitude })),
        concentratedMoments: (state.concentratedMoments || []).map(c => ({ x: m(c.x), magnitude: c.magnitude })),
        torsionMoments: (state.torsionMoments || []).map(t => ({ x: m(t.x), magnitude: t.magnitude })),
        gridSettings: {
            metersPerGrid: Number(settings.metersPerGrid),
            kNPerGrid: Number(settings.kNPerGrid),
            gridSize: Number(settings.gridSize)
        }
    };
    if (settings.elasticityModulus !== undefined || settings.momentOfInertia !== undefined) {
        data.material = { elasticityModulus: Number(settings.elasticityModulus), momentOfInertia: Number(settings.momentOfInertia) };
    }
    return data;
}

/**
 * Dosya verisini piksel cinsinden çalışma durumuna çevirir. Sürüm 2 (metre) ve
 * sürüm 1 (eski piksel) dosyaları kabul eder; geçersiz veride hata fırlatır.
 * @param {object} data - dosyadan okunan nesne
 * @param {object} placement - { startX, gridSize, metersPerGrid } yeni kirişin tuvaldeki yeri ve ölçeği
 * @returns {{ state: object, gridSettings: object|null, material: object|null, version: number }}
 */
function deserializeModel(data, placement) {
    if (!data || typeof data !== 'object') throw new Error('Model verisi bir nesne değil');

    if (data.version === undefined) {
        // Sürüm 1: piksel cinsinden, doğrudan çalışma durumu
        if (!data.beam || typeof data.beam.startX !== 'number' || typeof data.beam.endX !== 'number') {
            throw new Error('Kiriş bilgisi eksik');
        }
        const copy = JSON.parse(JSON.stringify(data));
        const state = { beam: copy.beam };
        MODEL_ARRAY_KEYS.forEach(k => { state[k] = Array.isArray(copy[k]) ? copy[k] : []; });
        return { state, gridSettings: copy.gridSettings || null, material: null, version: 1 };
    }

    if (data.version > MODEL_FILE_VERSION) throw new Error(`Desteklenmeyen dosya sürümü: ${data.version}`);
    const length = Number(data.beam && data.beam.length);
    if (!(length > 0)) throw new Error('Kiriş uzunluğu geçersiz');

    const gs = Number(data.gridSettings && data.gridSettings.gridSize) || placement.gridSize;
    const mpg = Number(data.gridSettings && data.gridSettings.metersPerGrid) || placement.metersPerGrid;
    const ppm = gs / mpg;
    const startX = placement.startX;
    const px = (m) => roundModelValue(startX + Number(m) * ppm);
    const list = (key) => (Array.isArray(data[key]) ? data[key] : []);

    const state = {
        beam: { startX, endX: px(length), startY: 0, gridSizeOnCreation: gs, metersPerGridOnCreation: mpg, length: roundModelValue(length * ppm) },
        // y koordinatları çizimde kirişe göre yeniden hesaplanır (redrawCanvas)
        supports: list('supports').map(s => ({ type: s.type, x: px(s.x) })),
        hinges: list('hinges').map(h => ({ x: px(h.x) })),
        concentratedLoads: list('concentratedLoads').map(l => ({ x: px(l.x), y: 0, magnitude: Number(l.magnitude), angle: Number(l.angle) })),
        distributedLoads: list('distributedLoads').map(l => ({ startX: px(l.startX), endX: px(l.endX), magnitude: Number(l.magnitude) })),
        trapezoidalLoads: list('trapezoidalLoads').map(l => ({ startX: px(l.startX), endX: px(l.endX), startMagnitude: Number(l.startMagnitude), endMagnitude: Number(l.endMagnitude) })),
        concentratedMoments: list('concentratedMoments').map(c => ({ x: px(c.x), y: 0, magnitude: Number(c.magnitude) })),
        torsionMoments: list('torsionMoments').map(t => ({ x: px(t.x), y: 0, magnitude: Number(t.magnitude) }))
    };
    const gridSettings = data.gridSettings ? { metersPerGrid: mpg, kNPerGrid: data.gridSettings.kNPerGrid, gridSize: gs } : null;
    return { state, gridSettings, material: data.material || null, version: data.version };
}

// --- Çalışma durumu (tarayıcı) ---

function getModelState() {
    return {
        beam, supports, hinges, concentratedLoads, distributedLoads,
        trapezoidalLoads, concentratedMoments, torsionMoments
    };
}

function getModelSettings() {
    return {
        metersPerGrid: getMetersPerGrid(),
        kNPerGrid: getKNPerGrid(),
        gridSize: getGridSize(),
        elasticityModulus: elasticityInput ? parseFloat(elasticityInput.value) : undefined,
        momentOfInertia: momentOfInertiaInput ? parseFloat(momentOfInertiaInput.value) : undefined
    };
}

/** Kaydedilecek dosya verisi (metre, sürüm 2). Kiriş yoksa null. */
function getModelSnapshot() {
    return serializeModel(getModelState(), getModelSettings());
}

/** Kaydedilmemiş değişiklik denetimi için modelin özeti (görünüm konumundan bağımsız). */
function getCurrentModelHash() {
    try { return JSON.stringify(getModelSnapshot()); } catch (e) { return ''; }
}

function isModelEmpty() {
    const state = getModelState();
    return !state.beam && MODEL_ARRAY_KEYS.every(k => !state[k] || state[k].length === 0);
}

/** Model verisini boşaltır (yalnızca veri; arayüz sıfırlaması actions.js/resetApplication). */
function clearModelState() {
    beam = null; supports = []; hinges = []; concentratedLoads = []; distributedLoads = [];
    trapezoidalLoads = []; concentratedMoments = []; torsionMoments = [];
}

/** deserializeModel çıktısını global duruma ve ayar girdilerine uygular. */
function setModelState(parsed) {
    const s = parsed.state;
    beam = s.beam; supports = s.supports; hinges = s.hinges; concentratedLoads = s.concentratedLoads;
    distributedLoads = s.distributedLoads; trapezoidalLoads = s.trapezoidalLoads;
    concentratedMoments = s.concentratedMoments; torsionMoments = s.torsionMoments;
    if (parsed.gridSettings) {
        if (metersPerGridInput) metersPerGridInput.value = parsed.gridSettings.metersPerGrid;
        if (kNPerGridInput) kNPerGridInput.value = parsed.gridSettings.kNPerGrid;
        if (gridSizeInput) gridSizeInput.value = parsed.gridSettings.gridSize;
    }
    if (parsed.material) {
        if (elasticityInput && parsed.material.elasticityModulus > 0) elasticityInput.value = parsed.material.elasticityModulus;
        if (momentOfInertiaInput && parsed.material.momentOfInertia > 0) momentOfInertiaInput.value = parsed.material.momentOfInertia;
    }
}

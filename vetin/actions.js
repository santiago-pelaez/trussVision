// actions.js - Masaüstü ve mobilde ortak kullanıcı eylemleri
//
// Buton eylemleri (sıfırla, ortala, kaydet/aç, tam ekran, indir, panel
// göster/gizle, tablodan silme, araç seçimi, dil), model yükleme ve ayar
// girdilerinin dinleyicileri burada tek bir kez tanımlanır. desktop-events.js
// ve mobile-events.js yalnızca platforma özgü işaretçi (fare/dokunmatik)
// etkileşimini içerir.

/** Model değişikliğini işler: tuvali yeniden boyutlandırıp çizer, hesabı ve diyagramları yeniler. */
// --- Geri al / yinele ---
// Her updateAll() sonunda model durumu (piksel) değiştiyse geçmişe eklenir; sürükleme
// sırasındaki ara durumlar (yalnızca runAnalysis) kaydedilmez.
const modelHistory = { undo: [], redo: [], last: null, restoring: false, limit: 60 };

function snapshotModelState() {
    return JSON.stringify({ beam, supports, hinges, concentratedLoads, distributedLoads, trapezoidalLoads, concentratedMoments, torsionMoments });
}

function recordModelHistory() {
    if (modelHistory.restoring) return;
    const snap = snapshotModelState();
    if (snap === modelHistory.last) return;
    if (modelHistory.last !== null) {
        modelHistory.undo.push(modelHistory.last);
        if (modelHistory.undo.length > modelHistory.limit) modelHistory.undo.shift();
        modelHistory.redo = [];
    }
    modelHistory.last = snap;
    updateHistoryButtons();
}

// Geri al / İleri al düğmelerinin etkinliği geçmiş yığınlarına göre güncellenir
function updateHistoryButtons() {
    const u = document.getElementById('undo-btn'), r = document.getElementById('redo-btn');
    if (u) u.disabled = modelHistory.undo.length === 0;
    if (r) r.disabled = modelHistory.redo.length === 0;
}

function restoreModelSnapshot(snap) {
    const s = JSON.parse(snap);
    beam = s.beam; supports = s.supports; hinges = s.hinges; concentratedLoads = s.concentratedLoads;
    distributedLoads = s.distributedLoads; trapezoidalLoads = s.trapezoidalLoads;
    concentratedMoments = s.concentratedMoments; torsionMoments = s.torsionMoments;
    modelHistory.restoring = true;
    try { commitModelChange(); } finally { modelHistory.restoring = false; }
    modelHistory.last = snap;
    updateHistoryButtons();
}

// Geçmişi boşaltır: dosya açıldığında ya da yeni model başlatıldığında geri alınacak
// bir önceki durum yoktur (açılan dosyadan önceki boş modele dönülmez)
function clearModelHistory() {
    modelHistory.undo = [];
    modelHistory.redo = [];
    modelHistory.last = snapshotModelState();
    updateHistoryButtons();
}

function undoModelChange() {
    if (!modelHistory.undo.length) return;
    modelHistory.redo.push(modelHistory.last);
    restoreModelSnapshot(modelHistory.undo.pop());
}

function redoModelChange() {
    if (!modelHistory.redo.length) return;
    modelHistory.undo.push(modelHistory.last);
    restoreModelSnapshot(modelHistory.redo.pop());
}

// --- Izgara / Malzeme ayar panelleri ---
// Panel, araç çubuğunun kaydırma alanında kırpılmasın diye sabit konumludur ve
// düğmenin altına yerleştirilir. Dışarı tıklama, Esc, kaydırma ve yeniden boyutlandırma kapatır.
function closeSettingsPopovers() {
    document.querySelectorAll('.settings-popover').forEach(p => { p.hidden = true; });
    document.querySelectorAll('.settings-toggle').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

function toggleSettingsPopover(id, button) {
    const pop = document.getElementById(id);
    if (!pop) return;
    const willOpen = pop.hidden;
    closeSettingsPopovers();
    if (!willOpen) return;
    // Üst öğelerdeki backdrop-filter/transform sabit konumu bozmasın diye panel body'ye taşınır
    if (pop.parentElement !== document.body) document.body.appendChild(pop);
    pop.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    const r = button.getBoundingClientRect();
    const w = pop.offsetWidth;
    pop.style.top = `${Math.round(r.bottom + 6)}px`;
    pop.style.left = `${Math.round(Math.min(Math.max(8, r.left), window.innerWidth - w - 8))}px`;
    const first = pop.querySelector('input');
    if (first) first.focus();
}

document.addEventListener('mousedown', (e) => {
    if (e.target.closest && (e.target.closest('.settings-popover') || e.target.closest('.settings-toggle'))) return;
    closeSettingsPopovers();
});
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector('.settings-popover:not([hidden])');
    if (!open) return;
    e.stopImmediatePropagation();
    closeSettingsPopovers();
    const btn = document.querySelector(`[aria-controls="${open.id}"]`);
    if (btn) btn.focus();
}, true);
window.addEventListener('resize', closeSettingsPopovers);
document.addEventListener('scroll', (e) => { if (!(e.target.closest && e.target.closest('.settings-popover'))) closeSettingsPopovers(); }, true);

function commitModelChange() {
    scaleCanvasForHiDPI(canvas, ctx);
    redrawCanvas();
    updateAll();
}

// Etkileşim (çizim/sürükleme) durum bayraklarını başlangıç değerine döndürür
function resetInteractionState() {
    isDrawing = false; drawingStage = 0; loadStartPoint = null; confirmedMagnitude1 = 0;
    isResizing = false; activeHandle = null; hasDragged = false;
    isDrawingConcentratedLoad = false; concentratedLoadStartPoint = null;
    isDrawingConcentratedMoment = false; isDrawingTorsionMoment = false; momentStartPoint = null;
    isDraggingSupport = false; draggedSupportIndex = null;
    isDraggingHinge = false; draggedHingeIndex = null;
    isMovingConcentratedLoad = false; draggedConcentratedLoadIndex = null; clickedConcentratedLoadIndex = null;
    isResizingDistLoad = false; resizedDistLoadIndex = null; activeDistLoadHandle = null; clickedDistLoadIndex = null;
    isResizingTrapLoad = false; resizedTrapLoadIndex = null; activeTrapLoadHandle = null; clickedTrapLoadIndex = null;
    isMovingDistLoad = false; draggedDistLoadIndex = null;
    isMovingTrapLoad = false; draggedTrapLoadIndex = null;
    isMovingConcentratedMoment = false; draggedConcentratedMomentIndex = null; clickedConcentratedMomentIndex = null;
    isMovingTorsionMoment = false; draggedTorsionMomentIndex = null; clickedTorsionMomentIndex = null;
    firstTapPoint = null;
}

function selectTool(toolName) {
    document.querySelectorAll('.tool-button').forEach(btn => { btn.classList.remove('active'); if (btn.id && btn.id.startsWith('tool-')) btn.setAttribute('aria-pressed', 'false'); });
    const btn = document.getElementById('tool-' + toolName);
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); }
    currentTool = toolName;
    updateHintBox(true);
}

/**
 * Uygulamayı boş modele döndürür (onay sorulmadan; onay ui-handler.js'te).
 * Diğer modüller sıfırlamayı 'vetin:model-reset' olayıyla dinler.
 */
function resetApplication() {
    clearModelState();
    resetInteractionState();
    lastAnalysis = null;
    calculatedReactions = []; calculatedMomentReaction = 0; calculatedAxialReaction = null;

    const output = document.getElementById('reactions-output');
    if (output) output.innerHTML = '';
    [shearChart, momentChart, normalForceChart, torsionChart].forEach(c => { if (c) c.destroy(); });
    shearChart = null; momentChart = null; normalForceChart = null; torsionChart = null;
    if (fbdCtx) fbdCtx.clearRect(0, 0, fbdCanvas.clientWidth, fbdCanvas.clientHeight);

    selectTool('beam');
    document.getElementById('elastic-curve-diagram-wrapper')?.classList.add('hidden');
    document.getElementById('elastic-curve-3d-wrapper')?.classList.add('hidden');

    redrawCanvas();
    updateTables();
    updateDiagramsVisibility();
    clearModelHistory();
    document.dispatchEvent(new CustomEvent('vetin:model-reset'));
}

/**
 * Dosya verisini (sürüm 1 piksel ya da sürüm 2 metre) uygulamaya yükler.
 * @returns {boolean} başarılıysa true
 */
function loadModelIntoApp(data) {
    let parsed;
    try {
        parsed = deserializeModel(data, { startX: getGridSize() * 5, gridSize: getGridSize(), metersPerGrid: getMetersPerGrid() });
    } catch (err) {
        console.error('Model verisi okunamadı:', err);
        alert(tFormat('alertInvalidModel'));
        return false;
    }
    resetApplication();
    setModelState(parsed);
    // Metre cinsinden (sürüm 2) dosyalar tuvalde ortalanır; eski dosyalar kayıtlı konumunda açılır
    if (parsed.version >= 2) centerDrawing();
    commitModelChange();
    clearModelHistory();
    // Açılan model incelenir: yanlışlıkla eleman eklenmesin diye imleç aracı seçilir
    selectTool('cursor');
    window.__lastSavedHash = getCurrentModelHash();
    return true;
}

function loadProjectFromFile(file) {
    if (!file) return;
    // Bazı sistemler .json için MIME türü vermez; uzantı da kabul edilir
    if (!/json/.test(file.type) && !/\.json$/i.test(file.name || '')) {
        console.warn('Sadece JSON dosyaları desteklenmektedir.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        let data;
        try { data = JSON.parse(e.target.result); }
        catch (err) { console.error('JSON dosyası okunurken hata oluştu:', err); alert(tFormat('alertInvalidModel')); return; }
        loadModelIntoApp(data);
    };
    reader.readAsText(file);
}

function saveModelToFile() {
    if (!beam) { alert(tFormat('alertNothingToSave')); return; }
    downloadModelAsJson();
}

function toggleFullscreen(button) {
    body.classList.toggle('fullscreen-mode');
    const isFullscreen = body.classList.contains('fullscreen-mode');
    const currentLang = document.documentElement.lang || 'tr';
    const key = isFullscreen ? 'hideFullscreen' : 'showFullscreen';
    fullscreenBtn.querySelector('.icon-expand').style.display = isFullscreen ? 'none' : 'block';
    fullscreenBtn.querySelector('.icon-shrink').style.display = isFullscreen ? 'block' : 'none';
    button.setAttribute('title', translations[currentLang][key]);
    button.dataset.i18nTitle = key;
    setTimeout(() => {
        if (beam) centerDrawing();
        commitModelChange();
    }, 100);
}

function togglePanel(button) {
    const panel = button.closest('.diagram-container, #data-tables-container');
    if (!panel) return;
    const content = panel.querySelector('.content-wrapper, .table-grid-wrapper');
    if (!content) return;
    const currentLang = document.documentElement.lang || 'tr';
    content.classList.toggle('hidden');
    const isHidden = content.classList.contains('hidden');
    if (panel.id) userVisibilityPrefs[panel.id] = !isHidden;

    const key = isHidden ? 'show' : 'hide';
    button.innerHTML = isHidden ? ICON_EYE_SHOW : ICON_EYE_HIDE;
    button.setAttribute('title', translations[currentLang][key]);
    button.dataset.i18nTitle = key;
    if (isHidden) return;

    redrawFbdIfShown(panel); // gizliyken değişen SCD'yi yeniden çiz
    if (panel.id === 'elastic-curve-3d-wrapper' && typeof onWindowResize3d === 'function') {
        setTimeout(() => { onWindowResize3d(); drawElasticCurve3D(); }, 50);
    }
}

const DELETABLE_ARRAYS = {
    support: () => supports, hinge: () => hinges,
    concentratedLoad: () => concentratedLoads, distributedLoad: () => distributedLoads,
    trapezoidalLoad: () => trapezoidalLoads, concentratedMoment: () => concentratedMoments,
    torsionMoment: () => torsionMoments
};

function deleteModelItem(type, index) {
    const getter = DELETABLE_ARRAYS[type];
    const arr = getter && getter();
    if (!arr || isNaN(index) || !arr[index]) return;
    arr.splice(index, 1);
    commitModelChange();
}

const DOWNLOAD_ACTIONS = {
    'download-model-btn':  () => downloadDrawingAsTrueSvg('model', 'vetin_structural_model.svg'),
    'download-fbd-btn':    () => downloadDrawingAsTrueSvg('fbd', 'vetin_free_body_diagram.svg'),
    'download-nfd-btn':    () => normalForceChart && downloadCanvasAsPngInSvg(normalForceChart.canvas, 'vetin_normal_force_diagram.png'),
    'download-sfd-btn':    () => shearChart && downloadCanvasAsPngInSvg(shearChart.canvas, 'vetin_shear_force_diagram.png'),
    'download-bmd-btn':    () => momentChart && downloadCanvasAsPngInSvg(momentChart.canvas, 'vetin_bending_moment_diagram.png'),
    'download-tmd-btn':    () => torsionChart && downloadCanvasAsPngInSvg(torsionChart.canvas, 'vetin_torsion_diagram.png'),
    'download-ecd-btn':    () => elasticCurveChart && downloadCanvasAsPngInSvg(elasticCurveChart.canvas, 'vetin_elastic_curve_diagram.png'),
    'download-tables-btn': () => downloadTablesAsCsv('vetin_data_tables.csv')
};

// Belgedeki tüm tıklamalar için ortak işleyici (olay yetkilendirmesi)
function handleSharedClick(event) {
    const target = event.target;

    // Dar ekranda araç grubu başlığı akordiyon gibi açılıp kapanır
    if (target.matches('.tool-group-title')) {
        if (window.innerWidth <= 800) {
            const group = target.closest('.tool-group');
            if (!group) return;
            document.querySelectorAll('.toolbar .tool-group').forEach(g => { if (g !== group) g.classList.remove('is-open'); });
            group.classList.toggle('is-open');
        }
        return;
    }

    const button = target.closest('button');
    const editRow = !button && target.closest('tr[data-edit-type]');
    if (editRow) { openDialogForTableRow(editRow.dataset.editType, parseInt(editRow.dataset.editIndex, 10)); return; }
    if (!button) {
        // Kapalı bir panelin herhangi bir yerine tıklanınca panel açılır
        const panel = target.closest('.diagram-container, #data-tables-container');
        const content = panel && panel.querySelector('.content-wrapper, .table-grid-wrapper');
        if (content && content.classList.contains('hidden')) panel.querySelector('.toggle-button')?.click();
        return;
    }

    if (button.parentElement.classList.contains('language-switcher') && button.dataset.lang) { setLanguage(button.dataset.lang); return; }
    if (button.classList.contains('delete-btn')) { deleteModelItem(button.dataset.type, parseInt(button.dataset.index, 10)); return; }

    switch (button.id) {
        case 'reset-btn': resetApplication(); return;
        case 'grid-settings-btn': toggleSettingsPopover('grid-popover', button); return;
        case 'material-settings-btn': toggleSettingsPopover('material-popover', button); return;
        case 'undo-btn': undoModelChange(); return;
        case 'redo-btn': redoModelChange(); return;
        case 'center-btn': if (beam) { centerDrawing(); commitModelChange(); } return;
        case 'save-btn': saveModelToFile(); return;
        case 'open-btn': document.getElementById('file-input').click(); return;
        case 'fullscreen-btn': toggleFullscreen(button); return;
    }
    if (DOWNLOAD_ACTIONS[button.id]) { DOWNLOAD_ACTIONS[button.id](); return; }
    if (button.classList.contains('toggle-button')) { togglePanel(button); return; }
    if (button.classList.contains('tool-button')) {
        selectTool(button.id.replace('tool-', ''));
        resetInteractionState();
        redrawCanvas();
    }
}

function initializeSharedActions() {
    document.body.addEventListener('click', handleSharedClick);

    gridSizeInput.addEventListener('change', redrawCanvas);
    kNPerGridInput.addEventListener('change', redrawCanvas);
    metersPerGridInput.addEventListener('change', () => {
        if (beam) beam.metersPerGridOnCreation = getMetersPerGrid();
        redrawCanvas();
        updateAll();
    });
    elasticityInput.addEventListener('change', updateAll);
    momentOfInertiaInput.addEventListener('change', updateAll);

    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) loadProjectFromFile(file);
        fileInput.value = '';
    });

    document.addEventListener('keydown', (e) => {
        const inField = e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
        const modalOpen = document.querySelector('.confirm-modal-backdrop.show, #model-gallery-overlay');
        // Tablo satırı odaktayken Enter/boşluk düzenleme penceresini açar
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-edit-type]')) {
            e.preventDefault();
            openDialogForTableRow(e.target.dataset.editType, parseInt(e.target.dataset.editIndex, 10));
            return;
        }
        if (!inField && !modalOpen && (e.ctrlKey || e.metaKey) && !e.altKey) {
            const k = e.key.toLowerCase();
            if (k === 'z' && !e.shiftKey) { e.preventDefault(); undoModelChange(); return; }
            if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redoModelChange(); return; }
        }
        if (e.key === 'Escape') {
            // Yarım kalan çizim iptal edilir
            if (isDrawing || drawingStage || isDrawingConcentratedLoad || isDrawingConcentratedMoment || isDrawingTorsionMoment) {
                resetInteractionState(); redrawCanvas(); return;
            }
            if (body.classList.contains('fullscreen-mode')) fullscreenBtn.click();
        }
    });
    window.addEventListener('resize', () => { setTimeout(commitModelChange, 100); });
}

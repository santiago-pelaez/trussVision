// load-dialog.js - Yük ekleme/düzenleme penceresi
//
// Tarayıcının prompt() kutularının yerine kullanılır. Bir yükün bütün bilgileri
// (konum, şiddet, açı …) tek pencerede metre / kN cinsinden girilir. Yeni yükte
// "Ekle", var olan yükte "Kaydet" ve "Sil" düğmeleri bulunur; "İptal" hiçbir
// değişiklik yapmaz. desktop-events.js ve mobile-events.js ortak kullanır.

// Alan türleri: position → metre (tuvalde piksel), angle → derece (modelde radyan),
// value → değer olduğu gibi saklanır, downValue → ekranda "+ aşağı" (modelde + yukarı,
// işaret çevrilir), length → kiriş boyu (metre), select → seçenek listesi.
const SUPPORT_TYPE_OPTIONS = [
    { value: 'pin-support', labelKey: 'pinSupportTitle' },
    { value: 'roller-support', labelKey: 'rollerSupportTitle' },
    { value: 'fixed-support', labelKey: 'fixedSupportTitle' }
];

const LOAD_DIALOG_TYPES = {
    beam: {
        titleKey: 'beamDialogTitle', toolId: 'tool-beam',
        list: () => null,
        fields: [{ key: 'endX', labelKey: 'beamLengthM', kind: 'length' }]
    },
    support: {
        titleKey: 'supportDialogTitle', toolId: 'tool-pin-support',
        list: () => supports,
        fields: [
            { key: 'type', labelKey: 'supportTypeLabel', kind: 'select', options: SUPPORT_TYPE_OPTIONS },
            { key: 'x', labelKey: 'positionM', kind: 'position' }
        ]
    },
    hinge: {
        titleKey: 'hingeDialogTitle', toolId: 'tool-hinge',
        list: () => hinges,
        fields: [{ key: 'x', labelKey: 'positionM', kind: 'position' }]
    },
    concentratedLoad: {
        titleKey: 'pointLoadTitle', toolId: 'tool-concentrated-load', hintKey: 'loadDialogAngleHint',
        list: () => concentratedLoads,
        fields: [
            { key: 'x', labelKey: 'positionM', kind: 'position' },
            { key: 'magnitude', labelKey: 'magnitudeKN', kind: 'value' },
            { key: 'angle', labelKey: 'angleDeg', kind: 'angle' }
        ]
    },
    distributedLoad: {
        titleKey: 'distLoadTitle', toolId: 'tool-distributed-load', hintKey: 'loadDialogDistHint',
        list: () => distributedLoads,
        fields: [
            { key: 'startX', labelKey: 'startM', kind: 'position' },
            { key: 'endX', labelKey: 'endM', kind: 'position' },
            { key: 'magnitude', labelKey: 'magnitudeKNM', kind: 'downValue' }
        ]
    },
    trapezoidalLoad: {
        titleKey: 'trapLoadTitle', toolId: 'tool-triangular-load', hintKey: 'loadDialogDistHint',
        list: () => trapezoidalLoads,
        fields: [
            { key: 'startX', labelKey: 'startM', kind: 'position' },
            { key: 'endX', labelKey: 'endM', kind: 'position' },
            { key: 'startMagnitude', labelKey: 'loadDialogStartMagnitude', kind: 'downValue' },
            { key: 'endMagnitude', labelKey: 'loadDialogEndMagnitude', kind: 'downValue' }
        ]
    },
    concentratedMoment: {
        titleKey: 'momentTitle', toolId: 'tool-concentrated-moment', hintKey: 'loadDialogMomentHint',
        list: () => concentratedMoments,
        fields: [
            { key: 'x', labelKey: 'positionM', kind: 'position' },
            { key: 'magnitude', labelKey: 'magnitudeKNM2', kind: 'value' }
        ]
    },
    torsionMoment: {
        titleKey: 'torsionTitle', toolId: 'tool-torsion-moment', hintKey: 'loadDialogTorsionHint',
        list: () => torsionMoments,
        fields: [
            { key: 'x', labelKey: 'positionM', kind: 'position' },
            { key: 'magnitude', labelKey: 'magnitudeTorsion', kind: 'value' }
        ]
    }
};

let loadDialogClose = null;

function loadDialogText(key, fallback) {
    const lang = document.documentElement.lang || 'en';
    const t = translations[lang] || translations.en;
    return t[key] || translations.en[key] || fallback || key;
}

function loadDialogEscape(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Gösterim için gereksiz sıfırları atar: 2.50 → 2.5, 3.000 → 3
function formatLoadDialogNumber(value, digits) {
    return String(Number(value.toFixed(digits)));
}

/**
 * Yük penceresini açar.
 * @param {object} opts
 * @param {string} opts.type - LOAD_DIALOG_TYPES anahtarı
 * @param {object} opts.load - Düzenlenecek yük ya da (isNew ise) eklenecek taslak
 * @param {boolean} [opts.isNew=false] - true: "Ekle"; false: "Kaydet" + "Sil"
 */
function openLoadDialog({ type, load, isNew = false }) {
    const def = LOAD_DIALOG_TYPES[type];
    if (!def || !load || !beam) return;
    if (loadDialogClose) loadDialogClose();

    const { toMeters, toPixels } = getConversionFunctions();
    const beamLengthM = toMeters(beam.endX);

    const toDisplay = (field) => {
        const v = load[field.key];
        if (field.kind === 'position') return formatLoadDialogNumber(toMeters(v), 3);
        if (field.kind === 'angle') return formatLoadDialogNumber(v * 180 / Math.PI, 2);
        if (field.kind === 'downValue') return formatLoadDialogNumber(-v, 3);
        if (field.kind === 'length') return formatLoadDialogNumber(toMeters(v), 3);
        if (field.kind === 'select') return v;
        return formatLoadDialogNumber(v, 3);
    };

    const fieldsHTML = def.fields.map((field, i) => {
        const label = `<label class="load-dialog-label" for="load-dialog-field-${i}">${loadDialogEscape(loadDialogText(field.labelKey))}</label>`;
        if (field.kind === 'select') {
            const opts = field.options.map(o => `<option value="${o.value}"${o.value === load[field.key] ? ' selected' : ''}>${loadDialogEscape(loadDialogText(o.labelKey))}</option>`).join('');
            return `${label}<select class="load-dialog-input" id="load-dialog-field-${i}" data-index="${i}">${opts}</select>`;
        }
        return `${label}
        <input class="load-dialog-input" id="load-dialog-field-${i}" type="number" step="any" data-index="${i}" value="${toDisplay(field)}"${field.kind === 'position' ? ` min="0" max="${formatLoadDialogNumber(beamLengthM, 3)}"` : ''}${field.kind === 'length' ? ' min="0"' : ''}>`;
    }).join('');

    const toolSvg = document.querySelector(`#${def.toolId} svg`);
    const iconHTML = toolSvg ? toolSvg.outerHTML : '';
    const hintHTML = def.hintKey ? `<p class="load-dialog-hint">${loadDialogEscape(loadDialogText(def.hintKey))}</p>` : '';
    const primaryText = isNew ? loadDialogText('loadDialogAdd', 'Add') : loadDialogText('save', 'Save');
    const deleteHTML = (isNew || type === 'beam') ? '' : `<button type="button" class="btn-danger load-dialog-delete" data-action="delete">${loadDialogEscape(loadDialogText('tableColDelete', 'Delete'))}</button>`;

    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-modal-backdrop load-dialog-backdrop show';
    backdrop.innerHTML = `
        <form class="confirm-modal confirm-primary load-dialog" role="dialog" aria-modal="true" aria-labelledby="load-dialog-title" novalidate>
            <div class="confirm-modal-header">
                <div class="icon">${iconHTML}</div>
                <h3 id="load-dialog-title">${loadDialogEscape(loadDialogText(def.titleKey))}</h3>
            </div>
            <div class="load-dialog-fields">${fieldsHTML}</div>
            ${hintHTML}
            <p class="load-dialog-error" role="alert" hidden>${loadDialogEscape(loadDialogText('loadDialogInvalid'))}</p>
            <div class="confirm-modal-footer">
                ${deleteHTML}
                <button type="button" class="btn-cancel" data-action="cancel">${loadDialogEscape(loadDialogText('resetConfirmCancel', 'Cancel'))}</button>
                <button type="submit" class="btn-primary">${loadDialogEscape(primaryText)}</button>
            </div>
        </form>
    `;
    document.body.appendChild(backdrop);

    const form = backdrop.querySelector('form');
    const inputs = [...form.querySelectorAll('.load-dialog-input')];
    const errorBox = form.querySelector('.load-dialog-error');
    const previousFocus = document.activeElement;

    const close = () => {
        document.removeEventListener('keydown', onKeyDown, true);
        backdrop.remove();
        loadDialogClose = null;
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    };
    loadDialogClose = close;

    // Esc yalnız pencereyi kapatır; tam ekrandan çıkma gibi diğer Esc işleyicilerine ulaşmaz
    function onKeyDown(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    }
    document.addEventListener('keydown', onKeyDown, true);

    // Arka plana basılıp orada bırakılırsa kapanır (pencere içinden sürükleyip dışarıda bırakmak kapatmaz)
    let pressedOnBackdrop = false;
    backdrop.addEventListener('pointerdown', (e) => { pressedOnBackdrop = e.target === backdrop; });
    backdrop.addEventListener('click', (e) => { if (pressedOnBackdrop && e.target === backdrop) close(); });

    form.addEventListener('click', (e) => {
        const action = e.target.closest('button')?.dataset.action;
        if (action === 'cancel') close();
        else if (action === 'delete') {
            const list = def.list();
            const index = list.indexOf(load);
            if (index !== -1) list.splice(index, 1);
            close();
            commitModelChange();
        }
    });

    inputs.forEach(input => input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        errorBox.hidden = true;
    }));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const tolerance = 1e-6;
        const values = inputs.map((input, i) => def.fields[i].kind === 'select' ? input.value : parseFloat(String(input.value).replace(',', '.')));
        const invalid = new Set();
        def.fields.forEach((field, i) => {
            const v = values[i];
            if (field.kind === 'select') return;
            if (!Number.isFinite(v)) invalid.add(i);
            else if (field.kind === 'position' && (v < -tolerance || v > beamLengthM + tolerance)) invalid.add(i);
            else if (field.kind === 'length' && v <= tolerance) invalid.add(i);
        });
        // Yayılı/trapez yükte başlangıç ve bitiş aynı olamaz
        const startIdx = def.fields.findIndex(f => f.key === 'startX');
        const endIdx = def.fields.findIndex(f => f.key === 'endX');
        if (startIdx !== -1 && endIdx !== -1 && Math.abs(values[startIdx] - values[endIdx]) < tolerance) {
            invalid.add(startIdx); invalid.add(endIdx);
        }

        if (invalid.size > 0) {
            inputs.forEach((input, i) => {
                if (invalid.has(i)) input.setAttribute('aria-invalid', 'true');
                else input.removeAttribute('aria-invalid');
            });
            errorBox.hidden = false;
            inputs[[...invalid][0]].focus();
            return;
        }

        def.fields.forEach((field, i) => {
            const v = values[i];
            if (field.kind === 'position' || field.kind === 'length') load[field.key] = toPixels(v);
            else if (field.kind === 'angle') load[field.key] = v * Math.PI / 180;
            else if (field.kind === 'downValue') load[field.key] = -v;
            else load[field.key] = v;
        });
        if (type === 'beam') load.length = load.endX - load.startX;
        if (type === 'concentratedLoad') normalizeConcentratedLoad(load);
        if (isNew) def.list().push(load);
        close();
        commitModelChange();
    });

    inputs[0].focus();
    if (typeof inputs[0].select === 'function' && inputs[0].tagName === 'INPUT') inputs[0].select();
}

/** Tekil yükü pozitif şiddet + yön açısı biçimine getirir (açı −180° … 180°). */
function normalizeConcentratedLoad(load) {
    if (load.magnitude < 0) { load.magnitude = -load.magnitude; load.angle += Math.PI; }
    let a = load.angle % (2 * Math.PI);
    if (a > Math.PI + 1e-12) a -= 2 * Math.PI;
    if (a <= -Math.PI + 1e-12) a += 2 * Math.PI;
    load.angle = a;
}

/** Tablodaki satırdan pencereyi açar (tür: tablo satırındaki data-edit-type). */
function openDialogForTableRow(type, index) {
    if (type === 'beam') { openLoadDialog({ type: 'beam', load: beam }); return; }
    const def = LOAD_DIALOG_TYPES[type];
    const list = def && def.list();
    if (list && list[index]) openLoadDialog({ type, load: list[index] });
}

/** Düzenle aracında tıklanan yük/moment için pencereyi açar (tıklama dizinleri olay işleyicilerinde ayarlanır). */
function openLoadDialogForClickedItem() {
    if (draggedSupportIndex !== null && supports[draggedSupportIndex]) openLoadDialog({ type: 'support', load: supports[draggedSupportIndex] });
    else if (draggedHingeIndex !== null && hinges[draggedHingeIndex]) openLoadDialog({ type: 'hinge', load: hinges[draggedHingeIndex] });
    else if (clickedConcentratedLoadIndex !== null) openLoadDialog({ type: 'concentratedLoad', load: concentratedLoads[clickedConcentratedLoadIndex] });
    else if (clickedDistLoadIndex !== null) openLoadDialog({ type: 'distributedLoad', load: distributedLoads[clickedDistLoadIndex] });
    else if (clickedTrapLoadIndex !== null) openLoadDialog({ type: 'trapezoidalLoad', load: trapezoidalLoads[clickedTrapLoadIndex] });
    else if (clickedConcentratedMomentIndex !== null) openLoadDialog({ type: 'concentratedMoment', load: concentratedMoments[clickedConcentratedMomentIndex] });
    else if (clickedTorsionMomentIndex !== null) openLoadDialog({ type: 'torsionMoment', load: torsionMoments[clickedTorsionMomentIndex] });
}

/**
 * Sürükleyerek çizilen tekil yük için "Ekle" penceresini açar. Açı 5°'ye,
 * şiddet 0.01 kN'a yuvarlanmış öneri olarak gelir.
 */
function openNewConcentratedLoadDialog(startPos, endPos) {
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    if (Math.abs(dx) <= EPSILON && Math.abs(dy) <= EPSILON) return;
    const snappedAngleDeg = Math.round(Math.atan2(dy, dx) * 180 / Math.PI / 5) * 5;
    const magnitude = (Math.hypot(dx, dy) / getGridSize()) * getKNPerGrid();
    openLoadDialog({
        type: 'concentratedLoad',
        isNew: true,
        load: { x: startPos.x, y: startPos.y, magnitude: Number(magnitude.toFixed(2)), angle: snappedAngleDeg * Math.PI / 180 }
    });
}

/** Çizilen yayılı/trapez yükü "Ekle" penceresiyle onaylatır (değerler 0.01'e yuvarlanır). */
function openNewDistributedLoadDialog(type, load) {
    const r = (v) => Number(v.toFixed(2));
    ['magnitude', 'startMagnitude', 'endMagnitude'].forEach(k => { if (load[k] !== undefined) load[k] = r(load[k]); });
    load.startX = clampToBeam(load.startX); load.endX = clampToBeam(load.endX);
    if (Math.abs(load.endX - load.startX) < 0.5) return;
    openLoadDialog({ type, isNew: true, load });
}

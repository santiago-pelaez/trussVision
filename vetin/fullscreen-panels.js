// fullscreen-panels.js - Tam ekranda yapısal modelin altında gösterilecek çizimler
//
// Tam ekran modunda modelin altında hangi çizimlerin (SCD, diyagramlar, elastik
// eğri, 3B) görüneceğini kullanıcı seçer. Hiçbiri seçilmezse yalnızca model
// görünür. Seçim, modelin sağ üstündeki "Alttaki çizimler" butonunun açtığı
// menüden yapılır ve tarayıcıda saklanır. Tam ekranda üst menü (araç çubuğu)
// de "Üst menüyü gizle/göster" butonuyla gizlenebilir; bu tercih de saklanır.
//
// Görünürlük CSS ile sağlanır (desktop-layout.css): tam ekranda yalnızca
// .fs-visible sınıflı diyagram panelleri gösterilir. Model için uygun olmayan
// (ör. eksenel yük yokken EKD) paneller zaten .hidden olduğundan menüde pasiftir.

const FULLSCREEN_PANELS = [
    { id: 'free-body-diagram-wrapper',      key: 'freeBodyDiagram' },
    { id: 'normal-force-diagram-wrapper',   key: 'normalForceDiagram' },
    { id: 'shear-force-diagram-wrapper',    key: 'shearForceDiagram' },
    { id: 'bending-moment-diagram-wrapper', key: 'bendingMomentDiagram' },
    { id: 'torsion-moment-diagram-wrapper', key: 'torsionMomentDiagram' },
    { id: 'elastic-curve-diagram-wrapper',  key: 'elasticCurveDiagram' },
    { id: 'elastic-curve-3d-wrapper',       key: 'elasticCurve3D' }
];
const FULLSCREEN_PANELS_STORAGE_KEY = 'fullscreenPanels';
const FULLSCREEN_TOOLBAR_STORAGE_KEY = 'fullscreenToolbarHidden';

let fullscreenPanelSelection = loadFullscreenPanelSelection();

function loadFullscreenPanelSelection() {
    try {
        const saved = JSON.parse(localStorage.getItem(FULLSCREEN_PANELS_STORAGE_KEY));
        if (Array.isArray(saved)) return saved.filter(id => FULLSCREEN_PANELS.some(p => p.id === id));
    } catch (e) { /* bozuk ya da erişilemeyen kayıt: varsayılana dön */ }
    return [];
}

function saveFullscreenPanelSelection() {
    try { localStorage.setItem(FULLSCREEN_PANELS_STORAGE_KEY, JSON.stringify(fullscreenPanelSelection)); } catch (e) { /* yoksay */ }
}

function fullscreenText(key) {
    const lang = document.documentElement.lang || 'tr';
    return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

// Panel, mevcut model için çizilebiliyorsa (updateDiagramsVisibility gizlemediyse) seçilebilir
function isFullscreenPanelAvailable(id) {
    const wrapper = document.getElementById(id);
    if (!wrapper || wrapper.classList.contains('hidden')) return false;
    const container = wrapper.closest('#all-diagrams-container');
    return !(container && container.classList.contains('hidden'));
}

// Tam ekranda model alanının boyutu değiştiğinde (panel seçimi, üst menü)
// yerleşim oturduktan sonra model, SCD, diyagram hizası ve 3B görünüm tazelenir.
function refreshFullscreenLayout() {
    requestAnimationFrame(() => {
        if (typeof redrawCanvas === 'function') redrawCanvas();
        if (typeof realignDiagramsToModel === 'function') realignDiagramsToModel();
        if (fullscreenPanelSelection.includes('elastic-curve-3d-wrapper') && typeof drawElasticCurve3D === 'function') {
            if (typeof onWindowResize3d === 'function') onWindowResize3d();
            drawElasticCurve3D();
        }
    });
}

// Üst menü (araç çubuğu) gizli mi: CSS yalnızca tam ekranda uygular
function setFullscreenToolbarHidden(hidden, persist = true) {
    document.body.classList.toggle('toolbar-hidden', hidden);
    const btn = document.getElementById('fs-toolbar-btn');
    if (btn) {
        const key = hidden ? 'showToolbar' : 'hideToolbar';
        btn.setAttribute('aria-pressed', String(hidden));
        btn.dataset.i18nTitle = key; // dil değişince setLanguage doğru başlığı yazsın
        btn.setAttribute('title', fullscreenText(key));
    }
    if (persist) {
        try { localStorage.setItem(FULLSCREEN_TOOLBAR_STORAGE_KEY, hidden ? '1' : '0'); } catch (e) { /* yoksay */ }
    }
    if (document.body.classList.contains('fullscreen-mode')) refreshFullscreenLayout();
}

// Seçimi panellere uygular ve tam ekrandaysa değişen alanları yeniden çizer
function applyFullscreenPanels() {
    FULLSCREEN_PANELS.forEach(({ id }) => {
        const wrapper = document.getElementById(id);
        if (wrapper) wrapper.classList.toggle('fs-visible', fullscreenPanelSelection.includes(id));
    });
    if (document.body.classList.contains('fullscreen-mode')) refreshFullscreenLayout();
}

function renderFullscreenPanelsMenu() {
    const menu = document.getElementById('fs-panels-menu');
    if (!menu) return;
    const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    menu.innerHTML = `<div class="fs-panels-menu-title">${escapeFullscreenHtml(fullscreenText('fullscreenPanelsTitle'))}</div>` +
        FULLSCREEN_PANELS.map(({ id, key }) => {
            const checked = fullscreenPanelSelection.includes(id);
            const available = isFullscreenPanelAvailable(id);
            return `<button type="button" class="fs-panel-item" role="menuitemcheckbox" data-panel="${id}"
                        aria-checked="${checked}" ${available ? '' : 'disabled'}>
                        <span class="fs-panel-check">${check}</span><span>${escapeFullscreenHtml(fullscreenText(key))}</span>
                    </button>`;
        }).join('');
}

function escapeFullscreenHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setFullscreenPanelsMenuOpen(open) {
    const menu = document.getElementById('fs-panels-menu');
    const btn = document.getElementById('fs-panels-btn');
    if (!menu || !btn) return;
    if (open) renderFullscreenPanelsMenu();
    menu.classList.toggle('show', open);
    btn.classList.toggle('active', open);
    btn.setAttribute('aria-expanded', String(open));
}

function initializeFullscreenPanels() {
    const btn = document.getElementById('fs-panels-btn');
    const menu = document.getElementById('fs-panels-menu');
    if (!btn || !menu) return;

    btn.setAttribute('title', fullscreenText('fullscreenPanelsTitle'));
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setFullscreenPanelsMenuOpen(!menu.classList.contains('show'));
    });

    menu.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.fs-panel-item');
        if (!item || item.disabled) return;
        const id = item.dataset.panel;
        fullscreenPanelSelection = fullscreenPanelSelection.includes(id)
            ? fullscreenPanelSelection.filter(x => x !== id)
            : FULLSCREEN_PANELS.map(p => p.id).filter(x => x === id || fullscreenPanelSelection.includes(x)); // sayfa sırası korunur
        saveFullscreenPanelSelection();
        item.setAttribute('aria-checked', String(fullscreenPanelSelection.includes(id)));
        applyFullscreenPanels();
    });

    // Menü dışına tıklayınca kapanır; Esc önce menüyü kapatır (tam ekrandan çıkmaz)
    document.addEventListener('click', (e) => {
        if (menu.classList.contains('show') && !menu.contains(e.target) && e.target !== btn) setFullscreenPanelsMenuOpen(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('show')) {
            e.stopImmediatePropagation();
            setFullscreenPanelsMenuOpen(false);
        }
    }, true);

    // Tam ekrandan çıkınca menü kapanır
    new MutationObserver(() => {
        if (!document.body.classList.contains('fullscreen-mode')) setFullscreenPanelsMenuOpen(false);
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Üst menüyü gizle/göster
    const toolbarBtn = document.getElementById('fs-toolbar-btn');
    if (toolbarBtn) {
        toolbarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setFullscreenToolbarHidden(!document.body.classList.contains('toolbar-hidden'));
        });
        let savedHidden = false;
        try { savedHidden = localStorage.getItem(FULLSCREEN_TOOLBAR_STORAGE_KEY) === '1'; } catch (e) { /* yoksay */ }
        setFullscreenToolbarHidden(savedHidden, false);
    }

    applyFullscreenPanels();
}

// models-gallery.js - Hazır model galerisi (açılış katmanı)

(function () {
    const MODELS_PATH = 'models/';
    const LEVELS = ['basic', 'intermediate', 'advanced'];
    const LEVEL_KEYS = { basic: 'levelBasic', intermediate: 'levelIntermediate', advanced: 'levelAdvanced' };
    const STORAGE_KEY = 'gallery_dont_show';
    const FIXED_LANGS = ['tr', 'en', 'de', 'cn'];

    // Sayfanın aktif dilini bul
    function resolveLang() {
        if (document.documentElement.lang) return document.documentElement.lang;
        let saved = null;
        try { saved = localStorage.getItem('selectedLanguage'); } catch (e) { /* depolama kapalı */ }
        if (saved) return saved;
        const browser = (navigator.language || 'tr').split('-')[0];
        if (typeof translations !== 'undefined' && translations[browser]) return browser;
        return 'tr';
    }

    function tr(key, fallback) {
        const lang = resolveLang();
        const dict = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : null;
        return (dict && dict[key]) || (translations['en'] && translations['en'][key]) || fallback;
    }

    // JSON model verisini projeye uygular (sürüm 1 piksel / sürüm 2 metre; bkz. model.js)
    // Hata durumunda kullanıcıyı loadModelIntoApp uyarır; burada yalnızca sonuç döner
    function applyModelData(projectData) {
        return loadModelIntoApp(projectData);
    }

    function scalePanel() {
        const panel = document.querySelector('.model-gallery-panel');
        if (!panel) return;
        const padding = 48;
        const scaleX = (window.innerWidth  - padding) / panel.scrollWidth;
        const scaleY = (window.innerHeight - padding) / panel.scrollHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        panel.style.transform = scale < 1 ? `scale(${scale})` : '';
    }

    function hideGallery() {
        const overlay = document.getElementById('model-gallery-overlay');
        if (!overlay) return;
        document.removeEventListener('keydown', onGalleryKey, true);
        overlay.classList.add('hidden');
        overlay.addEventListener('transitionend', () => { overlay.remove(); }, { once: true });
        setTimeout(() => overlay.remove(), 400);
    }

    function onGalleryKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); hideGallery(); }
    }

    // --- Model verisinden şematik küçük resim (SVG) ---
    // Hazır SVG dosyası gerekmez; yeni eklenen modeller de otomatik çizilir.
    function modelThumbnailSVG(m) {
        const L = Number(m.beam && m.beam.length) || 1;
        const W = 300, H = 110, x0 = 22, x1 = 278, yb = 62;
        const X = (x) => x0 + (x1 - x0) * x / L;
        const loadC = '#d9534f', supC = '#4f5659', beamC = '#389fb6';
        const parts = [];
        const arrow = (xa, ya, xb, yb2) => {
            const ang = Math.atan2(yb2 - ya, xb - xa), h = 6;
            const p1 = [xb - h * Math.cos(ang - 0.45), yb2 - h * Math.sin(ang - 0.45)], p2 = [xb - h * Math.cos(ang + 0.45), yb2 - h * Math.sin(ang + 0.45)];
            return `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb2}" stroke="${loadC}" stroke-width="1.6"/><path d="M${xb} ${yb2}L${p1[0]} ${p1[1]}L${p2[0]} ${p2[1]}Z" fill="${loadC}"/>`;
        };
        // Yayılı ve trapez yükler (+ aşağı gösterim: veride negatif = aşağı)
        const dists = [];
        (m.distributedLoads || []).forEach(l => dists.push([l.startX, l.endX, l.magnitude, l.magnitude]));
        (m.trapezoidalLoads || []).forEach(l => dists.push([l.startX, l.endX, l.startMagnitude, l.endMagnitude]));
        const qmax = Math.max(1e-9, ...dists.map(d => Math.max(Math.abs(d[2]), Math.abs(d[3]))));
        dists.forEach(([s, e, w1, w2]) => {
            const h1 = 26 * Math.abs(w1) / qmax, h2 = 26 * Math.abs(w2) / qmax, top = yb - 6;
            parts.push(`<path d="M${X(s)} ${top}L${X(s)} ${top - h1}L${X(e)} ${top - h2}L${X(e)} ${top}Z" fill="rgba(217,83,79,0.12)" stroke="${loadC}" stroke-width="1"/>`);
            const n = Math.max(2, Math.round((X(e) - X(s)) / 14));
            for (let i = 0; i <= n; i++) {
                const xx = X(s) + (X(e) - X(s)) * i / n, hh = h1 + (h2 - h1) * i / n;
                if (hh > 4) parts.push(arrow(xx, top - hh, xx, top));
            }
        });
        // Kiriş
        parts.push(`<rect x="${x0}" y="${yb - 5}" width="${x1 - x0}" height="10" fill="rgba(56,159,182,0.2)" stroke="${beamC}" stroke-width="1.6"/>`);
        // Mesnetler
        (m.supports || []).forEach(s => {
            const x = X(s.x);
            if (s.type === 'fixed-support') {
                const dir = s.x < L / 2 ? -1 : 1;
                parts.push(`<line x1="${x}" y1="${yb - 16}" x2="${x}" y2="${yb + 16}" stroke="${supC}" stroke-width="2"/>`);
                for (let k = -14; k <= 12; k += 6) parts.push(`<line x1="${x}" y1="${yb + k}" x2="${x + dir * 6}" y2="${yb + k + 6}" stroke="${supC}" stroke-width="1"/>`);
            } else {
                parts.push(`<path d="M${x} ${yb + 5}L${x - 8} ${yb + 18}L${x + 8} ${yb + 18}Z" fill="none" stroke="${supC}" stroke-width="1.6"/>`);
                if (s.type === 'roller-support') parts.push(`<line x1="${x - 10}" y1="${yb + 22}" x2="${x + 10}" y2="${yb + 22}" stroke="${supC}" stroke-width="1.6"/>`);
                else parts.push(`<line x1="${x - 10}" y1="${yb + 19}" x2="${x + 10}" y2="${yb + 19}" stroke="${supC}" stroke-width="2.5"/>`);
            }
        });
        (m.hinges || []).forEach(h => parts.push(`<circle cx="${X(h.x)}" cy="${yb}" r="4" fill="#fff" stroke="${supC}" stroke-width="1.6"/>`));
        // Tekil yükler (açı: yön vektörü, ekranda y aşağı)
        (m.concentratedLoads || []).forEach(l => {
            const dx = Math.cos(l.angle) * Math.sign(l.magnitude || 1), dy = Math.sin(l.angle) * Math.sign(l.magnitude || 1);
            const tipX = X(l.x), tipY = yb - 6 - (dy < -0.1 ? -12 : 0);
            parts.push(arrow(tipX - dx * 30, tipY - dy * 30, tipX, tipY));
        });
        (m.concentratedMoments || []).forEach(c => {
            const x = X(c.x), r = 11, cw = c.magnitude > 0;
            parts.push(`<path d="M${x - r} ${yb - 4}A${r} ${r} 0 1 1 ${x + r} ${yb - 4}" fill="none" stroke="${loadC}" stroke-width="1.6"/>`);
            const tx = cw ? x + r : x - r;
            parts.push(`<path d="M${tx} ${yb}L${tx - 4} ${yb - 7}L${tx + 4} ${yb - 7}Z" fill="${loadC}"/>`);
        });
        (m.torsionMoments || []).forEach(t => {
            const x = X(t.x);
            parts.push(`<line x1="${x - 14}" y1="${yb - 22}" x2="${x + 14}" y2="${yb - 22}" stroke="${loadC}" stroke-width="1.6"/><path d="M${x + 14} ${yb - 22}l-6 -4v8z M${x + 8} ${yb - 22}l-6 -4v8z" fill="${loadC}"/>`);
        });
        return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts.join('')}</svg>`;
    }

    function localized(obj) {
        if (!obj) return '';
        const lang = resolveLang();
        return obj[lang] || obj.en || obj.tr || '';
    }

    function makeExtraLangBtn(lang) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gallery-lang-btn gallery-lang-extra';
        btn.dataset.lang = lang;
        const label = typeof getLanguageLabel === 'function' ? getLanguageLabel(lang) : lang.toUpperCase();
        btn.textContent = label;
        btn.title = typeof getLanguageNativeName === 'function' ? getLanguageNativeName(lang) : lang;
        btn.addEventListener('click', () => onLangClick(lang));
        return btn;
    }

    // Galeri metinlerini mevcut dile göre güncelle
    function updateGalleryTexts() {
        const titleEl    = document.querySelector('.model-gallery-panel .gallery-title');
        const subtitleEl = document.querySelector('.model-gallery-panel .gallery-subtitle');
        const newLabelEl  = document.querySelector('.model-card--new .gallery-new-label');
        const openLabelEl = document.querySelector('.model-card--open .gallery-open-label');
        const dontShowEl  = document.querySelector('.gallery-dontshow-text');

        if (titleEl)     titleEl.textContent    = tr('galleryTitle',    'Bir Model Seçin');
        if (subtitleEl)  subtitleEl.textContent  = tr('gallerySubtitle', '');
        if (newLabelEl)  newLabelEl.textContent  = tr('galleryNewModel', 'Yeni Model');
        if (openLabelEl) openLabelEl.textContent = tr('open',            'Dosya Aç');
        if (dontShowEl)  dontShowEl.textContent  = tr('galleryDontShow', 'Bir daha gösterme');
        document.querySelectorAll('.gallery-level-heading').forEach(h => { h.textContent = tr(LEVEL_KEYS[h.dataset.level], h.dataset.level); });
        document.querySelectorAll('.model-card--example').forEach(card => {
            const meta = (window.VETIN_MODELS[card.dataset.model] || {}).meta || {};
            const t1 = card.querySelector('.model-card-title'), t2 = card.querySelector('.model-card-objective');
            if (t1) t1.textContent = localized(meta.title) || card.dataset.model;
            if (t2) t2.textContent = localized(meta.objective);
            card.setAttribute('aria-label', `${t1 ? t1.textContent : ''}. ${t2 ? t2.textContent : ''}`);
        });

        const lang = resolveLang();

        // Aktif dil butonunu güncelle
        document.querySelectorAll('.gallery-lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Sabit diller dışında bir dil seçiliyse ekstra butonu göster/güncelle
        const switcher = document.querySelector('.gallery-lang-switcher');
        if (switcher) {
            const existing = switcher.querySelector('.gallery-lang-extra');
            if (!FIXED_LANGS.includes(lang)) {
                if (existing && existing.dataset.lang === lang) {
                    existing.classList.add('active');
                } else {
                    if (existing) existing.remove();
                    const extraBtn = makeExtraLangBtn(lang);
                    extraBtn.classList.add('active');
                    const moreBtn = switcher.querySelector('.gallery-lang-more');
                    switcher.insertBefore(extraBtn, moreBtn);
                }
            } else {
                if (existing) existing.remove();
            }
        }
    }

    function loadModel(name) {
        // Önce gömülü veri (models/models-data.js): sayfa file:// ile açıldığında
        // tarayıcı JSON dosyalarının okunmasını engellediği için asıl yol budur.
        // Kopya alınır; model düzenlenince gömülü veri bozulmasın.
        const embedded = window.VETIN_MODELS && window.VETIN_MODELS[name];
        if (embedded) {
            if (applyModelData(JSON.parse(JSON.stringify(embedded)))) hideGallery();
            return;
        }

        // Yedek: gömülü veri yoksa JSON dosyası ağdan okunur
        const xhr = new XMLHttpRequest();
        xhr.open('GET', MODELS_PATH + name + '.json', true);
        xhr.responseType = 'json';
        xhr.onload = function () {
            try {
                const data = xhr.response || JSON.parse(xhr.responseText);
                if (applyModelData(data)) hideGallery();
            } catch (err) {
                console.error('Model parse hatası:', name, err);
                alert(tFormat('alertModelLoadFailed', { name }));
            }
        };
        xhr.onerror = function () {
            console.error('Model yüklenemedi:', name);
            alert(tFormat('alertModelLoadFailed', { name }));
        };
        xhr.send();
    }

    // Dil butonları için tıklama işleyicisi
    function onLangClick(lang) {
        if (typeof setLanguage === 'function') setLanguage(lang);
        if (typeof ensureLanguageButtonExists === 'function') ensureLanguageButtonExists(lang);
        updateGalleryTexts();
        scalePanel();
    }

    function buildLangSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'gallery-lang-switcher';

        const currentLang = resolveLang();

        // Sabit dil butonları: TR EN DE CN
        FIXED_LANGS.forEach(lang => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'gallery-lang-btn' + (lang === currentLang ? ' active' : '');
            btn.dataset.lang = lang;
            btn.textContent = lang.toUpperCase();
            btn.title = typeof getLanguageNativeName === 'function' ? getLanguageNativeName(lang) : lang;
            btn.addEventListener('click', () => onLangClick(lang));
            switcher.appendChild(btn);
        });

        // Sabit diller dışında bir dil seçiliyse ekstra buton ekle
        if (!FIXED_LANGS.includes(currentLang)) {
            const extraBtn = makeExtraLangBtn(currentLang);
            extraBtn.classList.add('active');
            switcher.appendChild(extraBtn);
        }

        // "+" düğmesi + dropdown
        const btnMore = document.createElement('button');
        btnMore.type = 'button';
        btnMore.className = 'gallery-lang-btn gallery-lang-more';
        btnMore.textContent = '+';
        btnMore.title = tr('moreLanguages', 'More languages');

        const dropdown = document.createElement('div');
        dropdown.className = 'gallery-lang-dropdown';

        // Sabit diller dışındaki tüm dilleri listele
        const allLangs = typeof translations !== 'undefined'
            ? Object.keys(translations).filter(l => !FIXED_LANGS.includes(l))
            : [];
        allLangs.sort((a, b) => {
            const la = typeof getLanguageLabel === 'function' ? getLanguageLabel(a) : a;
            const lb = typeof getLanguageLabel === 'function' ? getLanguageLabel(b) : b;
            return la.localeCompare(lb);
        });
        allLangs.forEach(lang => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.lang = lang;
            const label = typeof getLanguageLabel === 'function' ? getLanguageLabel(lang) : lang.toUpperCase();
            const native = typeof getLanguageNativeName === 'function' ? getLanguageNativeName(lang) : lang;
            btn.textContent = label;
            btn.title = native;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onLangClick(lang);
                dropdown.classList.remove('show');
            });
            dropdown.appendChild(btn);
        });

        btnMore.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => dropdown.classList.remove('show'));

        switcher.appendChild(btnMore);
        switcher.appendChild(dropdown);
        return switcher;
    }

    function buildGallery(force = false) {
        let dontShow = false;
        try { dontShow = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { /* depolama kapalı */ }
        if (dontShow && !force) return;
        // Paylaşılan model/alıştırma bağlantısıyla açılışta galeri gösterilmez
        if (!force && /^#(m|p)=/.test(location.hash || '')) return;
        const old = document.getElementById('model-gallery-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'model-gallery-overlay';

        const panel = document.createElement('div');
        panel.className = 'model-gallery-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'gallery-title');

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'gallery-close-btn';
        closeBtn.setAttribute('aria-label', tr('aboutClose', 'Close'));
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', hideGallery);
        panel.appendChild(closeBtn);

        // Başlık
        const header = document.createElement('div');
        header.className = 'model-gallery-header';
        const title = document.createElement('h2');
        title.className = 'gallery-title';
        title.id = 'gallery-title';
        title.textContent = tr('galleryTitle', 'Bir Model Seçin');
        const subtitle = document.createElement('p');
        subtitle.className = 'gallery-subtitle';
        subtitle.textContent = tr('gallerySubtitle', '');
        header.appendChild(title);
        header.appendChild(subtitle);

        // Kart ızgarası
        const grid = document.createElement('div');
        grid.className = 'model-gallery-grid';

        // Yeni model butonu
        const newCard = document.createElement('button');
        newCard.type = 'button';
        newCard.className = 'model-card model-card--new';
        const newIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        const newSpan = document.createElement('span');
        newSpan.className = 'gallery-new-label';
        newSpan.textContent = tr('galleryNewModel', 'Yeni Model');
        newCard.innerHTML = newIcon;
        newCard.appendChild(newSpan);
        newCard.addEventListener('click', () => {
            const resetBtn = document.getElementById('reset-btn');
            if (resetBtn) {
                window.__skipResetConfirm = true;
                resetBtn.click();
                window.__skipResetConfirm = false;
                window.__lastSavedHash = null;
            }
            hideGallery();
        });
        grid.appendChild(newCard);

        // Dosya aç butonu
        const openCard = document.createElement('button');
        openCard.type = 'button';
        openCard.className = 'model-card model-card--new model-card--open';
        const openIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
        const openSpan = document.createElement('span');
        openSpan.className = 'gallery-open-label';
        openSpan.textContent = tr('open', 'Dosya Aç');
        openCard.innerHTML = openIcon;
        openCard.appendChild(openSpan);
        openCard.addEventListener('click', () => {
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                hideGallery();
                fileInput.click();
            }
        });
        grid.appendChild(openCard);

        // Hazır model kartları: seviyeye göre gruplu, sıraya göre dizili (models/*.json → meta)
        const all = Object.entries(window.VETIN_MODELS || {})
            .map(([name, data]) => ({ name, data, meta: data.meta || {} }))
            .sort((a, b) => (a.meta.order || 999) - (b.meta.order || 999));
        LEVELS.forEach(level => {
            const items = all.filter(m => (m.meta.level || 'advanced') === level);
            if (!items.length) return;
            const heading = document.createElement('h3');
            heading.className = 'gallery-level-heading';
            heading.dataset.level = level;
            heading.textContent = tr(LEVEL_KEYS[level], level);
            grid.appendChild(heading);
            items.forEach(({ name, data, meta }) => {
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'model-card model-card--example';
                card.dataset.model = name;
                card.dataset.level = level;
                const thumb = document.createElement('div');
                thumb.className = 'model-card-thumb';
                thumb.innerHTML = modelThumbnailSVG(data);
                const text = document.createElement('div');
                text.className = 'model-card-text';
                const t1 = document.createElement('strong');
                t1.className = 'model-card-title';
                t1.textContent = localized(meta.title) || name;
                const t2 = document.createElement('span');
                t2.className = 'model-card-objective';
                t2.textContent = localized(meta.objective);
                text.appendChild(t1);
                text.appendChild(t2);
                card.appendChild(thumb);
                card.appendChild(text);
                card.setAttribute('aria-label', `${t1.textContent}. ${t2.textContent}`);
                card.addEventListener('click', () => loadModel(name));
                grid.appendChild(card);
            });
        });

        // Alt çubuk: sol = dil seçici, sağ = "bir daha gösterme"
        const footer = document.createElement('div');
        footer.className = 'model-gallery-footer';

        footer.appendChild(buildLangSwitcher());

        const label = document.createElement('label');
        label.className = 'model-gallery-dontshow';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => {
            try { localStorage[checkbox.checked ? 'setItem' : 'removeItem'](STORAGE_KEY, '1'); } catch (e) { /* depolama kapalı */ }
        });
        const dontShowText = document.createElement('span');
        dontShowText.className = 'gallery-dontshow-text';
        dontShowText.textContent = tr('galleryDontShow', 'Bir daha gösterme');
        label.appendChild(checkbox);
        label.appendChild(dontShowText);
        footer.appendChild(label);

        panel.appendChild(header);
        panel.appendChild(grid);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        checkbox.checked = dontShow;
        document.addEventListener('keydown', onGalleryKey, true);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) hideGallery(); });
        requestAnimationFrame(() => { scalePanel(); const first = panel.querySelector('.model-card--example'); if (first) first.focus(); });
        window.addEventListener('resize', scalePanel);
    }

    // Uygulama menüsündeki "Örnekler" ile galeri her zaman yeniden açılabilir
    window.showModelGallery = () => buildGallery(true);
    window.modelThumbnailSVG = modelThumbnailSVG;

    document.addEventListener('DOMContentLoaded', () => {
        buildGallery();
    });
})();

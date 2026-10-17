// main.js - Hibrit Model için Uygulama Başlatıcı

document.addEventListener('DOMContentLoaded', () => {

    // 1. Platformu belirle ve body'e sınıf olarak ekle
    // (isTouchDevice setup.js'te tanımlanır; dokunmatik ekranlı dizüstüler
    //  hassas işaretçileri olduğu için masaüstü olarak sınıflandırılır)
    const platform = isTouchDevice ? 'mobile' : 'desktop';
    document.body.classList.add(platform);

    // 2. Dil ayarlarını yap ve HTML'i oluştur
    let savedLang = null;
    try { savedLang = localStorage.getItem('selectedLanguage'); } catch (e) { /* depolama kapalı */ }
    const browserLang = (navigator.language || 'en').split('-')[0];
    const browserKey = browserLang === 'zh' ? 'cn' : browserLang;
    // Desteklenmeyen tarayıcı dillerinde uluslararası varsayılan İngilizcedir
    const initialLang = savedLang || (translations[browserKey] ? browserKey : 'en');
    
    buildInitialHTML(initialLang);
    
    // 3. DOM'a bağlı global değişkenleri ata
    initializeDOMVariables(); 
    
    // 3.1 Temayı Başlat
    initializeTheme();

    // 3.1.1 vetin uygulamaları menüsü (logonun yanı)
    initAppSwitcher();

    // 3.2 3B Elastik Eğri Başlat — Three.js yüklenemezse (ör. vendor/ eksik) yalnızca
    // 3B görünüm devre dışı kalır; olay dinleyicileri ve diğer kurulumlar yine yapılır.
    if (typeof initElasticCurve3D === 'function') {
        try {
            initElasticCurve3D();
        } catch (err) {
            console.error('3B elastik eğri başlatılamadı (Three.js yüklü mü?):', err);
        }
    }

    // 4. Ortak eylemler (butonlar, model yükleme, ayar girdileri: actions.js),
    //    ardından yalnızca mevcut platforma ait işaretçi dinleyicileri
    initializeSharedActions();
    if (platform === 'desktop') {
        initializeDesktopEventListeners(); // desktop-events.js'deki fonksiyon
    } else {
        initializeMobileEventListeners(); // mobile-events.js'deki fonksiyon
    }

    // 4.1 Kesim Yöntemi (cut-method.js) — platform dinleyicilerinden sonra kurulur
    if (typeof initializeCutMethod === 'function') {
        initializeCutMethod();
    }

    // 4.2 Tam ekranda modelin altındaki çizimlerin seçimi (fullscreen-panels.js)
    if (typeof initializeFullscreenPanels === 'function') {
        initializeFullscreenPanels();
    }

    // 5. Dili ayarla
    // initialLang ile hemen dili uygula (buton aktif sınıfı, data-i18n elementleri)
    setLanguage(initialLang);

    // Dil butonlarını ve dropdown menüyü başlat
    if (typeof initializeLanguageButtons === 'function') {
        initializeLanguageButtons();
    }

    // Not: Önceki sürümdeki IP tabanlı dil tespiti (üçüncü taraf geolocation
    // servisi) gizlilik nedeniyle kaldırıldı; tarayıcı dili yeterlidir.

    scaleCanvasForHiDPI(canvas, ctx);
    redrawCanvas();

    // 5.1 Bağlantıyla paylaşılan model (#m=…) ya da alıştırma (#p=düzey:tohum)
    if (typeof applyLocationHash === 'function') applyLocationHash();

    // 6. Telif hakkı yılını ayarla
    const copyrightYear = document.getElementById('copyright-year');
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }
});
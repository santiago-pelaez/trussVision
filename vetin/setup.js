// common/setup.js

// 1. Global Değişkenlerin DEKLARASYONU (Atama Yok)
// DOM'a bağlı olanlar 'let' ile tanımsız olarak başlatılır.
let canvas, ctx, gridSizeInput, metersPerGridInput, kNPerGridInput, elasticityInput, momentOfInertiaInput, fbdCanvas, fbdCtx, body, fullscreenBtn;

// DOM'a bağlı olmayan durum ve sabit değişkenleri burada tanımlanabilir.
// Dokunmatik tespiti: dokunmatik ekranı olan ama hassas işaretçisi (fare/trackpad)
// de bulunan cihazlar (ör. dokunmatik ekranlı dizüstüler) masaüstü sayılır.
const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
    !(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
const COLORS = { BEAM_FILL: 'rgba(56, 159, 182, 0.2)', BEAM_STROKE: '#389fb6', SUPPORT: '#4f5659', LOAD: '#d9534f', REACTION: '#5cb85c', PREVIEW: 'rgba(0, 122, 255, 0.5)', DIMENSION: '#555', GRID: '#f2f2f5',
    // Serbest cisim diyagramı: mesnet/kesim tepkileri ve x mesafesi (ders görselleriyle aynı)
    // Tepkiler yüklerden (kırmızı) ayrı tonda: renk körlüğünde de ayırt edilsin diye yeşil-mavi; metin için koyu ton
    FBD_REACTION: '#1b9e77', FBD_REACTION_TEXT: '#0f6b50', FBD_DIMENSION: '#141515' };
const EPSILON = 1e-9;

// Izgara girdileri için NaN/sıfır korumalı okuma yardımcıları.
// Girdi boşaltılır ya da geçersiz olursa arayüzdeki varsayılanlara dönülür;
// böylece çizim ve hesap zinciri NaN'a düşmez.
function getGridSize() { const v = parseInt(gridSizeInput && gridSizeInput.value, 10); return (isFinite(v) && v >= 10) ? v : 20; }
function getMetersPerGrid() { const v = parseFloat(metersPerGridInput && metersPerGridInput.value); return (isFinite(v) && v > 0) ? v : 0.2; }
function getKNPerGrid() { const v = parseFloat(kNPerGridInput && kNPerGridInput.value); return (isFinite(v) && v > 0) ? v : 2; }

// Paylaşılan göz aç/kapa ikonları (Material Design visibility / visibility_off)
const ICON_EYE_SHOW = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>`;
const ICON_EYE_HIDE = `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;

// Veri tablolarındaki sil butonu ikonu (çöp kutusu)
const ICON_DELETE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>`;

// Application State (Uygulama Durumu)
let currentTool = 'beam', beam = null, supports = [], hinges = [];
let concentratedLoads = [], distributedLoads = [], trapezoidalLoads = [];
let concentratedMoments = [], torsionMoments = [];
let isDrawing = false, isResizing = false, activeHandle = null;
let drawingStage = 0, loadStartPoint = null, confirmedMagnitude1 = 0;
let isDrawingConcentratedLoad = false, concentratedLoadStartPoint = null;
let isDrawingConcentratedMoment = false, isDrawingTorsionMoment = false, momentStartPoint = null;
let isDraggingSupport = false, draggedSupportIndex = null;
let isDraggingHinge = false, draggedHingeIndex = null;
let hasDragged = false;
let isResizingDistLoad = false, resizedDistLoadIndex = null, activeDistLoadHandle = null;
let clickedDistLoadIndex = null;
let isResizingTrapLoad = false, resizedTrapLoadIndex = null, activeTrapLoadHandle = null;
let clickedTrapLoadIndex = null;
let isMovingConcentratedLoad = false, draggedConcentratedLoadIndex = null, clickedConcentratedLoadIndex = null;
let isMovingDistLoad = false, draggedDistLoadIndex = null;
let isMovingTrapLoad = false, draggedTrapLoadIndex = null;
let isMovingConcentratedMoment = false, draggedConcentratedMomentIndex = null, clickedConcentratedMomentIndex = null;
let isMovingTorsionMoment = false, draggedTorsionMomentIndex = null, clickedTorsionMomentIndex = null;
let startPoint = { x: 0, y: 0 };
let currentMousePos = { x: 0, y: 0 };
let currentRawMousePos = { x: 0, y: 0 };
let shearChart = null, momentChart = null, normalForceChart = null, torsionChart = null, elasticCurveChart = null;
let firstTapPoint = null;
let calculatedReactions = [], calculatedMomentReaction = 0, calculatedAxialReaction = null;
// Son hesabın sonucu (calculations.js/analyzeBeam); yeniden çizimler hesap yapmadan bunu kullanır
let lastAnalysis = null;
let userVisibilityPrefs = {};
// Serbest cisim diyagramında neyin çizileceği (SCD sağ üstündeki butonlar)
let fbdDisplayOptions = { loads: true, reactions: true };
let diagramData = {
    normal: { labels: [], datasets: [{ data: [] }] },
    shear: { labels: [], datasets: [{ data: [] }] },
    moment: { labels: [], datasets: [{ data: [] }] },
    torsion: { labels: [], datasets: [{ data: [] }] },
    elasticCurve: { labels: [], datasets: [{ data: [] }] }
};

// --- YENİ EKLENEN HIZALAMA PLUGİNİ (KÜRESEL) ---
const chartAlignmentPlugin = {
    id: 'chartAlignmentPlugin',
    beforeLayout: (chart) => {
        if (!beam || !canvas || !chart.canvas) return;
        
        const beamRect = canvas.getBoundingClientRect();
        const chartRect = chart.canvas.getBoundingClientRect();

        // Exact horizontal offset between structural canvas and diagram canvas
        const canvasDiffX = beamRect.left - chartRect.left;

        // Grafik alanının sol kenarı (paddingLeft + y ekseni genişliği) kiriş
        // başlangıcına denk gelmeli. Kiriş başı tuvalin solundan 100 px'ten
        // yakınsa boşluk negatife düşüp 0'a kırpılıyor ve grafik alanı sağa
        // kayıyordu; bu durumda y ekseni daraltılarak hiza korunur.
        const targetLeft = Math.max(0, canvasDiffX + beam.startX);
        const yAxisWidth = Math.min(100, targetLeft);
        const paddingLeft = targetLeft - yAxisWidth;

        const beamWidth = beam.endX - beam.startX;
        const paddingRight = chartRect.width - (targetLeft + beamWidth);

        // Ayarlardaki afterFit sabit 100 px verir; bu örnekteki ölçek onu geçersiz kılar
        if (chart.scales.y) chart.scales.y.afterFit = function () { this.width = yAxisWidth; };

        chart.options.layout.padding = {
            left: paddingLeft,
            right: Math.max(0, paddingRight),
            top: 10 + (typeof DIAGRAM_REGION_BAND !== 'undefined' ? DIAGRAM_REGION_BAND : 0),
            bottom: 10
        };
    }
};

/**
 * Diyagram eksenlerinin (ızgara, değerler, başlık) renklerini geçerli temaya
 * (açık/karanlık) göre ayarlar. Tüm diyagramlar aynı renkleri kullansın diye
 * hem grafik oluşturulurken hem de tema değiştiğinde çağrılır.
 */
function applyChartThemeColors(options) {
    if (!options || !options.scales) return;
    ['x', 'y'].forEach(axis => {
        const scale = options.scales[axis];
        if (!scale) return;
        // tickColor (eksen değerlerindeki kısa çizgiler) ve eksen çizgisi açıkça
        // verilir: Chart.js varsayılanı ızgara renginden türetip önbellekte tuttuğu
        // için tema değişince eski renkte kalıyordu.
        scale.grid = { ...(scale.grid || {}), color: COLORS.GRID, tickColor: COLORS.GRID };
        scale.border = { ...(scale.border || {}), color: COLORS.GRID };
        scale.ticks = { ...(scale.ticks || {}), color: COLORS.DIMENSION };
        scale.title = { ...(scale.title || {}), color: COLORS.DIMENSION };
    });
}

function refreshChartThemes() {
    [shearChart, momentChart, normalForceChart, torsionChart, elasticCurveChart].forEach(chart => {
        if (!chart) return;
        applyChartThemeColors(chart.options);
        chart.update('none');
    });
}

/**
 * Mevcut bir Chart örneğini veri/ayar güncelleyerek yeniden kullanır;
 * yoksa (veya farklı bir tuvale aitse) yenisini oluşturur. Her hesapta
 * destroy + new Chart yapmaktan çok daha akıcıdır (canlı sürüklemede önemli).
 */
function upsertLineChart(chartRef, canvasId, dataset, options, skipAnimation = false) {
    applyChartThemeColors(options);
    if (chartRef && chartRef.canvas && chartRef.canvas.id === canvasId) {
        Object.assign(chartRef.data.datasets[0], dataset);
        chartRef.options = options;
        chartRef.update(skipAnimation ? 'none' : undefined);
        return chartRef;
    }
    if (chartRef) chartRef.destroy();
    return new Chart(document.getElementById(canvasId).getContext('2d'), {
        type: 'line',
        data: { datasets: [dataset] },
        // Kesim Yöntemi katmanı (cut-method.js) varsa diyagramlara da eklenir
        plugins: [chartAlignmentPlugin,
            ...(typeof criticalValuesPlugin !== 'undefined' ? [criticalValuesPlugin] : []),
            ...(typeof cutDiagramPlugin !== 'undefined' ? [cutDiagramPlugin] : [])],
        options: options
    });
}

/**
 * 2. DOM Değişkenlerini ATAMA Fonksiyonu
 * Bu fonksiyon, HTML yapısı oluşturulduktan sonra çağrılmalıdır.
 */
function initializeDOMVariables() {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    gridSizeInput = document.getElementById('gridSize');
    metersPerGridInput = document.getElementById('metersPerGrid');
    kNPerGridInput = document.getElementById('kNPerGrid');
    elasticityInput = document.getElementById('elasticityModulus');
    momentOfInertiaInput = document.getElementById('momentOfInertia');
    fbdCanvas = document.getElementById('freeBodyDiagramCanvas');
    fbdCtx = fbdCanvas.getContext('2d');
    body = document.body;
    fullscreenBtn = document.getElementById('fullscreen-btn');
}
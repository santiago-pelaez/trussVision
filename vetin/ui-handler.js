// common/ui-handler.js
//
// Arayüz katmanı: hesap sonucunu (calculations.js/analyzeBeam) çizer (SCD,
// Chart.js diyagramları), tabloları ve panelleri günceller, tema ve modalları yönetir.

function drawFreeBodyDiagram(allReactions, momentReactions, T_reaction, axialReaction, loadsToDraw = distributedLoads, trapLoadsToDraw = trapezoidalLoads, hingeData = null, drawGridLines = true) {
    // Panel gizliyken tuvalin boyutu 0'dır; çizmeye çalışmak tuvali 0×0'a küçültür.
    // Panel açılınca SCD, lastAnalysis ile yeniden çizilir (bkz. redrawFbdIfShown).
    if (fbdCanvas.clientWidth === 0 || fbdCanvas.clientHeight === 0) return;
    scaleCanvasForHiDPI(fbdCanvas, fbdCtx);
    
    fbdCtx.save();
    
    // Karanlık mod kontrolü
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        fbdCtx.fillStyle = '#0F1419'; // Kesit referansı
    } else {
        fbdCtx.fillStyle = 'white';
    }
    
    fbdCtx.fillRect(0, 0, fbdCanvas.width, fbdCanvas.height);
    fbdCtx.restore();

    fbdCtx.save();
    
    // YENİ: Sadece masaüstünde (geniş ekranlarda) padding'i telafi etmek için sola kaydır.
    if (window.innerWidth > 800) {
        fbdCtx.translate(-20, 0);
    }

    // YENİ: Izgara genişliğini ekran boyutuna göre ayarla.
    const gridWidth = window.innerWidth > 800 ? fbdCanvas.clientWidth + 20 : fbdCanvas.clientWidth;
    if (drawGridLines) {
        drawGrid(fbdCtx, gridWidth, fbdCanvas.clientHeight);
    }
    
    if (!beam) {
        fbdCtx.restore();
        return;
    }
    // Üstte bölge bandı (I, II, …) için şerit ayrılır; kiriş ekseni kalan alanın ortasındadır
    const res = lastAnalysis && lastAnalysis.result;
    const band = (typeof drawRegionBand === 'function' && res && res.solved && res.segments && res.segments.length) ? REGION_BAND_H : 0;
    const y_beam = band + (fbdCanvas.clientHeight - band) / 2;
    if (band) drawRegionBand(fbdCtx, y_beam + 80);

    const drawVerticalArrow = (x, mag, color, isUp, position, label = `${mag.toFixed(2)} kN`) => {
        const L = 48, T = 5, beamTop = y_beam - getGridSize() / 2, beamBottom = y_beam + getGridSize() / 2;
        let startY, targetY, textY, textBaseline;
        if (position === 'above') {
            if (isUp) { startY = beamTop; targetY = startY - L; textY = targetY - T; textBaseline = 'bottom'; } 
            else { startY = beamTop - L; targetY = beamTop; textY = startY - T; textBaseline = 'bottom'; }
        } else {
            if (isUp) { startY = beamBottom + L; targetY = beamBottom; textY = startY + T; textBaseline = 'top'; } 
            else { startY = beamBottom; targetY = startY + L; textY = targetY + T; textBaseline = 'top'; }
        }
        drawFilledArrow(fbdCtx, x, startY, x, targetY, color);
        fbdCtx.save(); fbdCtx.fillStyle = color;
        fbdCtx.font = '12px Arial'; fbdCtx.textAlign = 'center'; fbdCtx.textBaseline = textBaseline;
        fbdCtx.fillText(label, x, textY);
        fbdCtx.restore();
    };

    const drawHorizontalArrow = (x, mag, color) => {
        const isLeft = mag < 0;
        fbdCtx.save();
        fbdCtx.strokeStyle = color; fbdCtx.fillStyle = color; fbdCtx.lineWidth = 2; fbdCtx.font = '12px Arial'; fbdCtx.textBaseline = 'middle';
        if (isLeft) {
            const startX = x + 44; const endX = x;
            drawFilledArrow(fbdCtx, startX, y_beam, endX, y_beam, color);
            fbdCtx.textAlign = 'right'; fbdCtx.fillText(`${Math.abs(mag).toFixed(2)} kN`, endX - 5, y_beam);
        } else {
            const startX = x - 44; const endX = x;
            drawFilledArrow(fbdCtx, startX, y_beam, endX, y_beam, color);
            fbdCtx.textAlign = 'left'; fbdCtx.fillText(`${Math.abs(mag).toFixed(2)} kN`, endX + 5, y_beam);
        }
        fbdCtx.restore();
    };

    // Mesnet tepkileri: kalın gövde + dolu üçgen uç (FBD_ARROW), COLORS.FBD_REACTION
    const drawReactionVertical = (x, mag, isUp, name) => {
        const L = 48, beamBottom = y_beam + getGridSize() / 2;
        const startY = isUp ? beamBottom + L : beamBottom;
        const targetY = isUp ? beamBottom : beamBottom + L;
        drawFilledArrow(fbdCtx, x, startY, x, targetY, COLORS.FBD_REACTION);
        fbdCtx.save(); fbdCtx.fillStyle = COLORS.FBD_REACTION_TEXT; fbdCtx.font = 'bold 12px Arial'; fbdCtx.textBaseline = 'top';
        const label = name ? `${name}_y = ${mag.toFixed(2)} kN` : `${mag.toFixed(2)} kN`;
        if (typeof fillSubscriptText === 'function') fillSubscriptText(fbdCtx, label, x, beamBottom + L + 4, 'center');
        else { fbdCtx.textAlign = 'center'; fbdCtx.fillText(label, x, beamBottom + L + 4); }
        fbdCtx.restore();
    };

    // Yatay tepki kiriş ucunun dış tarafına çizilir (kirişin ve yüklerin üstüne binmez)
    const drawReactionHorizontal = (x, mag, name) => {
        const L = 44, toLeft = mag < 0;
        const outsideLeft = x <= (beam.startX + beam.endX) / 2;
        const far = outsideLeft ? x - L : x + L;
        const pointsOutward = outsideLeft ? toLeft : !toLeft;
        drawFilledArrow(fbdCtx, pointsOutward ? x : far, y_beam, pointsOutward ? far : x, y_beam, COLORS.FBD_REACTION);
        fbdCtx.save(); fbdCtx.fillStyle = COLORS.FBD_REACTION_TEXT; fbdCtx.font = 'bold 12px Arial'; fbdCtx.textBaseline = 'middle';
        const label = name ? `${name}_x = ${Math.abs(mag).toFixed(2)} kN` : `${Math.abs(mag).toFixed(2)} kN`;
        if (typeof fillSubscriptText === 'function') fillSubscriptText(fbdCtx, label, outsideLeft ? far - 6 : far + 6, y_beam, outsideLeft ? 'right' : 'left');
        else { fbdCtx.textAlign = outsideLeft ? 'right' : 'left'; fbdCtx.fillText(label, outsideLeft ? far - 6 : far + 6, y_beam); }
        fbdCtx.restore();
    };

    drawBeam(fbdCtx, beam.startX, y_beam, beam.endX, y_beam);
    // Ara mafsallar SCD'de de gösterilir (M = 0 olan noktalar)
    if (typeof drawHinge === 'function') hinges.forEach(h => drawHinge(fbdCtx, h.x, y_beam));
    // Mafsal kuvvetleri: mafsalın iki yanındaki parçalara etkiyen eşit ve zıt kesme kuvvetleri (etki–tepki)
    if (fbdDisplayOptions.reactions && Array.isArray(hingeData)) {
        hingeData.forEach(h => {
            if (Math.abs(h.magnitude) < 0.005) return;
            const top = y_beam - getGridSize() / 2, Lh = 34;
            // Sol parçanın sağ ucunda kesme kuvveti V > 0 iken aşağı; sağ parçada tersi
            const leftDown = h.magnitude > 0;
            const drawPair = (x, down) => {
                const yA = down ? top - Lh : top, yB = down ? top : top - Lh;
                drawFilledArrow(fbdCtx, x, yA, x, yB, '#6a1b9a');
            };
            drawPair(h.x - 9, leftDown);
            drawPair(h.x + 9, !leftDown);
            fbdCtx.save(); fbdCtx.fillStyle = '#6a1b9a'; fbdCtx.font = 'bold 11px Arial'; fbdCtx.textBaseline = 'bottom';
            const label = `V_${h.name || ''} = ${Math.abs(h.magnitude).toFixed(2)} kN`;
            if (typeof fillSubscriptText === 'function') fillSubscriptText(fbdCtx, label, h.x, top - Lh - 4, 'center');
            fbdCtx.restore();
        });
    }

    // Kuvvetler ve mesnet tepkileri SCD sağ üstündeki butonlarla açılıp kapatılır
    const showLoads = fbdDisplayOptions.loads, showReactions = fbdDisplayOptions.reactions;

    if (showLoads) concentratedLoads.forEach(l => {
        const verticalForce = l.magnitude * Math.sin(l.angle);
        if (Math.abs(verticalForce) > EPSILON) {
            drawVerticalArrow(l.x, Math.abs(verticalForce), COLORS.LOAD, verticalForce < 0, 'above');
        }
        const horizontalForce = l.magnitude * Math.cos(l.angle);
        if (Math.abs(horizontalForce) > EPSILON) {
            drawHorizontalArrow(l.x, horizontalForce, COLORS.LOAD);
        }
    });

    if (showLoads) concentratedMoments.forEach(m => {
        const updatedMoment = { ...m, y: y_beam };
        drawConcentratedMoment(fbdCtx, updatedMoment, COLORS.LOAD);
    });

    if (showLoads) torsionMoments.forEach(t => {
        const updatedTorsion = { ...t, y: y_beam };
        drawTorsionMoment(fbdCtx, updatedTorsion);
    });
    
    if (showReactions && allReactions) {
        allReactions.forEach(reaction => {
            if (Math.abs(reaction.magnitude) > EPSILON) {
                drawReactionVertical(reaction.x, Math.abs(reaction.magnitude), reaction.magnitude > 0, reaction.name);
            }
        });
    }

    // Ankastre moment tepkileri: çözücüde Mz + saat yönünün tersi; drawReactionMoment
    // ise (tekil moment yüküyle aynı kuralla) + değeri saat yönünde çizer → işaret çevrilir.
    if (showReactions && Array.isArray(momentReactions)) {
        momentReactions.forEach(mr => {
            if (Math.abs(mr.magnitude) > EPSILON) drawReactionMoment(fbdCtx, mr.x, y_beam, -mr.magnitude, COLORS.FBD_REACTION, mr.name ? `M_${mr.name}` : null);
        });
    }

    if (showReactions && axialReaction && Math.abs(axialReaction.magnitude) > EPSILON) {
        drawReactionHorizontal(axialReaction.x, axialReaction.magnitude, axialReaction.name);
    }

    if (showReactions && T_reaction && Math.abs(T_reaction.magnitude) > EPSILON) {
        drawTorsionMoment(fbdCtx, { x: T_reaction.x, y: y_beam, magnitude: T_reaction.magnitude }, COLORS.FBD_REACTION);
    }

    if (showLoads) loadsToDraw.forEach(l => drawDistributedLoad(fbdCtx, l.startX, l.endX, y_beam, l.magnitude, false));
    if (showLoads) trapLoadsToDraw.forEach(l => drawTrapezoidalLoad(fbdCtx, l.startX, l.endX, y_beam, l.startMagnitude, l.endMagnitude, false));
    
    // Kesim etkinse ölçü çizgileri kesime göre yazılır (toplam boy yerine x ölçüsü çizilir)
    const cutForDims = (typeof cutModeActive !== 'undefined' && cutModeActive && typeof getCutPixelX === 'function') ? getCutPixelX() : null;
    drawDimensions(fbdCtx, y_beam + 80, cutForDims);
    if (typeof drawPointNames === 'function') drawPointNames(fbdCtx, y_beam + 80);

    if (typeof drawCutOverlayOnFbd === 'function') drawCutOverlayOnFbd(fbdCtx, y_beam);

    fbdCtx.restore();
}

// === Hesap sonucunun çizimi ===

/** Modeli analiz eder (calculations.js) ve sonucu çizer. */
function runAnalysis(isLiveUpdate = false) {
    const analysis = analyzeBeam();
    renderAnalysis(analysis, isLiveUpdate);
    return analysis;
}

/**
 * analyzeBeam() sonucunu çizer: SCD, kesme/moment/elastik eğri, eksenel ve
 * burulma diyagramları. Sonuç lastAnalysis'te saklanır; sonraki yeniden
 * çizimler (tema, SCD seçenekleri, kesim çizgisi, panel açma) hesap yapmaz.
 */
function renderAnalysis(analysis, isLiveUpdate = false) {
    lastAnalysis = analysis;
    if (typeof updateSystemStatus === 'function') updateSystemStatus(analysis);
    if (!isLiveUpdate && typeof updateLearningPanel === 'function') updateLearningPanel(analysis);
    if (!isLiveUpdate) updateHintBox();

    if (analysis.solution) {
        calculatedReactions = analysis.solution.reactions;
        calculatedMomentReaction = analysis.solution.M_fixed;
        calculatedAxialReaction = analysis.axialReaction;
        redrawFreeBodyDiagram();
        renderBeamDiagrams(analysis.diagrams, isLiveUpdate);
    }
    // Sistem stabil değilken diyagram alanı zaten gizlidir (updateDiagramsVisibility)
    if (analysis.stable) renderStepDiagram('axial', analysis.axial, isLiveUpdate);
    // Burulma uyarısı canlı sürüklemede tekrar tekrar gösterilmesin
    if (!isLiveUpdate) renderStepDiagram('torsion', analysis.torsion, false);
}

function toDiagramData(points, color) {
    return { labels: points.map(p => p.x), datasets: [{ data: points.map(p => p.y), borderColor: color }] };
}

function renderBeamDiagrams(d, isLiveUpdate) {
    diagramData.shear = toDiagramData(d.shearPoints, COLORS.LOAD);
    diagramData.moment = toDiagramData(d.momentPoints, COLORS.BEAM_STROKE);
    diagramData.elasticCurve = toDiagramData(d.elasticCurvePoints, COLORS.BEAM_STROKE);
    drawDiagrams(d.shearPoints, d.momentPoints, d.elasticCurvePoints, d.L, isLiveUpdate);
}

// Eksenel kuvvet ve burulma momenti: basamaklı diyagramlar (aynı grafik ayarları)
const STEP_DIAGRAMS = {
    axial:   { canvasId: 'normalForceDiagram',   dataKey: 'normal',  color: () => COLORS.REACTION, title: 'axialForce',      unit: 'unitKN',
               get: () => normalForceChart, set: (c) => { normalForceChart = c; } },
    torsion: { canvasId: 'torsionMomentDiagram', dataKey: 'torsion', color: () => COLORS.LOAD,     title: 'torsionalMoment', unit: 'unitKNM',
               get: () => torsionChart,     set: (c) => { torsionChart = c; } }
};

function renderStepDiagram(kind, result, isLiveUpdate) {
    const cfg = STEP_DIAGRAMS[kind];
    if (!result || result.warning) {
        if (result && result.warning && typeof showCalcWarning === 'function') showCalcWarning(result.warning);
        const chart = cfg.get();
        if (chart) { chart.destroy(); cfg.set(null); }
        return;
    }
    const color = cfg.color();
    diagramData[cfg.dataKey] = toDiagramData(result.points, color);

    const axisTitles = translations[document.documentElement.lang || 'tr'].diagramAxes;
    const options = {
        scales: {
            x: {
                type: 'linear', min: 0, max: result.L,
                ticks: eventTickOptions(), afterBuildTicks: eventTicksAfterBuild,
                title: { display: true, text: `${axisTitles.length} (${axisTitles.unitM})` }
            },
            y: {
                grid: { color: COLORS.GRID },
                ticks: { padding: 10 },
                title: { display: true, text: `${axisTitles[cfg.title]} (${axisTitles[cfg.unit]})`, padding: { top: 25 } },
                afterFit: (axis) => { axis.width = 100; }
            }
        },
        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
        elements: { point: { radius: 0, hoverRadius: 4 } },
        maintainAspectRatio: false,
        hover: { mode: 'index', intersect: false, animation: { duration: 0 } }
    };
    if (isLiveUpdate) options.animation = { duration: 0 };
    cfg.set(upsertLineChart(cfg.get(), cfg.canvasId,
        { data: result.points, borderColor: color, backgroundColor: color + '33', borderWidth: 2, fill: 'origin', stepped: false },
        options, isLiveUpdate));
}

/** SCD'yi son hesap sonucundan (hesap yapmadan) yeniden çizer. */
function redrawFreeBodyDiagram() {
    const s = lastAnalysis && lastAnalysis.solution;
    if (!s) return;
    drawFreeBodyDiagram(s.reactions, s.momentReactions, lastAnalysis.torsionReaction, lastAnalysis.axialReaction, s.fbdDistLoads, s.fbdTrapLoads, s.hingeData);
    drawGerberPartsDiagram();
}

/**
 * Model alanının boyutu/konumu değiştiğinde (ör. tam ekran panelleri) SCD'yi ve
 * diyagramları hesap yapmadan hizalar. Diyagram hizası chartAlignmentPlugin'in
 * beforeLayout adımında kurulduğu için grafiklerin yeniden yerleşmesi gerekir.
 */
function realignDiagramsToModel() {
    redrawFreeBodyDiagram();
    [normalForceChart, shearChart, momentChart, torsionChart, elasticCurveChart]
        .forEach(chart => { if (chart) chart.update('none'); });
}

// Göster/gizle butonuyla açılan panel SCD ise, gizliyken yapılan değişiklikler
// (kesim çizgisi, model düzenlemesi) görünsün diye son haliyle yeniden çizilir.
function redrawFbdIfShown(panel) {
    if (panel && panel.id === 'free-body-diagram-wrapper') redrawFreeBodyDiagram();
}

// SCD seçenek butonları (Dış Kuvvetler / Mesnet Tepkileri): dinleyici belgeye bağlanır
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.fbd-option-btn');
    if (!btn) return;
    const option = btn.dataset.fbdOption;
    fbdDisplayOptions[option] = !fbdDisplayOptions[option];
    btn.setAttribute('aria-pressed', String(fbdDisplayOptions[option]));
    redrawFreeBodyDiagram();
});

// Diyagramın üzerine gelince ayrıntılı (1200 nokta), ayrılınca hızlı (50 nokta)
// çizim. Tepkiler yeniden çözülmez; yalnızca eğri noktaları yeniden üretilir.
let isHighRes = false;

function renderDiagramResolution(interpolationPoints) {
    if (!lastAnalysis || !lastAnalysis.solution) return;
    const fresh = analyzeBeam({ interpolationPoints });
    if (!fresh.solution) return;
    lastAnalysis = fresh;
    renderBeamDiagrams(lastAnalysis.diagrams, true);
}

function switchToHighResDiagrams() {
    if (!isHighRes) { isHighRes = true; renderDiagramResolution(1200); }
}

function switchToLowResDiagrams() {
    if (isHighRes) { isHighRes = false; renderDiagramResolution(50); }
}


function drawDiagrams(shearPoints, momentPoints, elasticCurvePoints, L, isLiveUpdate = false) {
    const metersPerGrid = getMetersPerGrid();
    const currentLang = document.documentElement.lang || 'tr';
    const axisTitles = translations[currentLang].diagramAxes;

    const baseChartOptions = {
        scales: {
            x: { 
                type: 'linear', 
                min: 0, 
                max: L, 
                // İşaretler yalnızca olay noktalarında (A, B, …) — learning-panel.js
                ticks: eventTickOptions(),
                afterBuildTicks: eventTicksAfterBuild,
                title: {
                    display: true,
                    text: `${axisTitles.length} (${axisTitles.unitM})`
                }
            },
            y: { 
                grid: { color: COLORS.GRID }, 
                ticks: { padding: 10 },
                title: { display: true, padding: { top: 25 } }, // Pushes title right (away from left edge)
                afterFit: (axis) => { axis.width = 100; }
            }
        },
        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
        elements: { point: { radius: 0, hoverRadius: 4 } }, // Show point on hover?
        maintainAspectRatio: false,
        hover: { mode: 'index', intersect: false, animation: { duration: 0 } }
    };
    if (isLiveUpdate) { baseChartOptions.animation = { duration: 0 }; }

    const shearChartOptions = {
        ...baseChartOptions,
        scales: {
            ...baseChartOptions.scales,
            y: {
                ...baseChartOptions.scales.y,
                title: { 
                    ...baseChartOptions.scales.y.title,
                    display: true, 
                    text: `${axisTitles.shearForce} (${axisTitles.unitKN})` 
                }
            }
        }
    };
    
    const momentChartOptions = {
        ...baseChartOptions,
        scales: {
            ...baseChartOptions.scales,
            y: {
                ...baseChartOptions.scales.y,
                reverse: true,
                title: { 
                    ...baseChartOptions.scales.y.title,
                    display: true, 
                    text: `${axisTitles.bendingMoment} (${axisTitles.unitKNM}) — ${tFormat('momentAxisNote')}` 
                }
            }
        }
    };

    shearChart = upsertLineChart(shearChart, 'shearForceDiagram',
        { data: shearPoints, borderColor: COLORS.LOAD, backgroundColor: COLORS.LOAD + '33', borderWidth: 2, fill: 'origin', tension: 0 },
        shearChartOptions, isLiveUpdate);

    momentChart = upsertLineChart(momentChart, 'bendingMomentDiagram',
        { data: momentPoints, borderColor: COLORS.BEAM_STROKE, backgroundColor: COLORS.BEAM_STROKE + '33', borderWidth: 2, fill: 'origin', tension: 0 },
        momentChartOptions, isLiveUpdate);
    
    const elasticCurveChartOptions = {
        ...baseChartOptions,
        scales: {
            ...baseChartOptions.scales,
            y: {
                ...baseChartOptions.scales.y,
                grace: '10%',
                title: { 
                    ...baseChartOptions.scales.y.title,
                    display: true, 
                    text: `${axisTitles.displacement} (${axisTitles.unitMM})` 
                },
                ticks: { ...baseChartOptions.scales.y.ticks },
                afterFit: (axis) => { axis.width = 100; }
            }
        }
    };
    
    elasticCurveChart = upsertLineChart(elasticCurveChart, 'elasticCurveDiagram',
        { data: elasticCurvePoints, borderColor: COLORS.BEAM_STROKE, backgroundColor: COLORS.BEAM_STROKE + '33', borderWidth: 2, fill: 'origin', tension: 0 },
        elasticCurveChartOptions, isLiveUpdate);

    // Update 3D Elastic Curve
    if (typeof drawElasticCurve3D === 'function') {
        drawElasticCurve3D();
    }

    // Yüksek/düşük çözünürlük geçişi dinleyicileri yalnızca bir kez bağlanır;
    // aksi halde her hesaplamada üst üste eklenerek sızıntı oluştururlar.
    if (!window.__diagramHoverListenersBound) {
        window.__diagramHoverListenersBound = true;
        const shearCanvas = document.getElementById('shearForceDiagram');
        const momentCanvas = document.getElementById('bendingMomentDiagram');
        const elasticCurveCanvas = document.getElementById('elasticCurveDiagram');

        [shearCanvas, momentCanvas, elasticCurveCanvas].forEach(canvas => {
            if (canvas) {
                canvas.addEventListener('mouseenter', switchToHighResDiagrams);
                canvas.addEventListener('touchstart', switchToHighResDiagrams, { passive: true });
                canvas.addEventListener('mouseleave', switchToLowResDiagrams);
            }
        });

        // Mobil cihazda diyagram dışına dokunulduğunda düşük çözünürlüğe dön
        if (isTouchDevice) {
            document.body.addEventListener('touchstart', (e) => {
                if (!e.target.closest('#shear-force-diagram-wrapper, #bending-moment-diagram-wrapper, #elastic-curve-diagram-wrapper')) {
                    switchToLowResDiagrams();
                }
            });
        }
    }
}

function setDiagramState(wrapperId, shouldBeVisible) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const button = wrapper.querySelector('.toggle-button');
    const content = wrapper.querySelector('.content-wrapper');
    const currentLang = document.documentElement.lang || 'tr';
    const showIcon = ICON_EYE_SHOW;
    const hideIcon = ICON_EYE_HIDE;

    wrapper.classList.toggle('hidden', !shouldBeVisible);

    if (shouldBeVisible) {
        // Respect user preference. If no preference, use default (true).
        const userPref = userVisibilityPrefs[wrapperId];
        const showContent = (userPref !== undefined) ? userPref : true;

        content.classList.toggle('hidden', !showContent);
        if(button) {
            button.innerHTML = showContent ? hideIcon : showIcon;
            button.setAttribute('title', translations[currentLang][showContent ? 'hide' : 'show']);
            button.dataset.i18nTitle = showContent ? 'hide' : 'show';
        }
    }
}

function updateDiagramsVisibility() {
    const diagramsContainer = document.getElementById('all-diagrams-container');
    const isSystemDrawable = beam && isSystemStable();

    const hasVerticalLoadsOrMoments = concentratedLoads.some(l => Math.abs(l.magnitude * Math.sin(l.angle)) > EPSILON) || distributedLoads.length > 0 || trapezoidalLoads.length > 0 || concentratedMoments.length > 0;
    const hasAxialForces = concentratedLoads.some(l => Math.abs(l.magnitude * Math.cos(l.angle)) > EPSILON);
    const hasTorsionLoads = torsionMoments.length > 0;

    const shouldShowMainContainer = isSystemDrawable && (hasVerticalLoadsOrMoments || hasAxialForces || hasTorsionLoads);
    
    diagramsContainer.classList.toggle('hidden', !shouldShowMainContainer);

    if (!shouldShowMainContainer) {
        document.getElementById('elastic-curve-diagram-wrapper')?.classList.add('hidden');
        document.getElementById('elastic-curve-3d-wrapper')?.classList.add('hidden');
        return;
    }

    setDiagramState('free-body-diagram-wrapper', isSystemDrawable && (hasVerticalLoadsOrMoments || hasAxialForces));
    setDiagramState('normal-force-diagram-wrapper', isSystemDrawable && hasAxialForces);
    setDiagramState('shear-force-diagram-wrapper', isSystemDrawable && hasVerticalLoadsOrMoments);
    setDiagramState('bending-moment-diagram-wrapper', isSystemDrawable && hasVerticalLoadsOrMoments);
    setDiagramState('elastic-curve-diagram-wrapper', isSystemDrawable && hasVerticalLoadsOrMoments);
    setDiagramState('elastic-curve-3d-wrapper', isSystemDrawable);
    setDiagramState('torsion-moment-diagram-wrapper', isSystemDrawable && hasTorsionLoads);
}

function updateTables() {
    const tablesContainer = document.getElementById('data-tables-container');
    
    if (!beam) {
        tablesContainer.classList.add('hidden');
        return;
    }
    
    tablesContainer.classList.remove('hidden');

    // Respect user preference for table contents
    const content = tablesContainer.querySelector('.table-grid-wrapper');
    const userPref = userVisibilityPrefs['data-tables-container'];
    if (userPref !== undefined && content) {
        content.classList.toggle('hidden', !userPref);
        const button = tablesContainer.querySelector('.toggle-button');
        if (button) {
            const currentLang = document.documentElement.lang || 'tr';
            button.innerHTML = userPref ? ICON_EYE_HIDE : ICON_EYE_SHOW;
            button.setAttribute('title', translations[currentLang][userPref ? 'hide' : 'show']);
            button.dataset.i18nTitle = userPref ? 'hide' : 'show';
        }
    }
    
    document.querySelectorAll('#data-tables-container tbody').forEach(tbody => tbody.innerHTML = '');

    const currentLang = document.documentElement.lang || 'tr';
    const langTranslations = translations[currentLang];
    const deleteLabel = langTranslations.tableColDelete || translations.en.tableColDelete;
    
    const { toMeters } = getConversionFunctions();
    
    const setTableVisibility = (tableId, isVisible) => {
        const table = document.getElementById(tableId);
        if (table) {
            const wrapper = table.closest('.table-wrapper');
            if (wrapper) {
                wrapper.classList.toggle('hidden', !isVisible);
            }
        }
    };

    // Hücreler doğrudan düzenlenmez: satıra tıklanınca doğrulamalı düzenleme penceresi açılır
    // (load-dialog.js). Yayılı yük şiddetleri ders kitabı kuralıyla (+ aşağı) gösterilir.
    const editTitle = loadDialogEscape(tFormat('tableEditTitle'));
    const f2 = (v) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2);
    const delCell = (type, i) => `<td class="delete-cell"><button type="button" class="delete-btn" title="${deleteLabel}" aria-label="${deleteLabel}" data-type="${type}" data-index="${i}">${ICON_DELETE}</button></td>`;
    const addRow = (body, editType, index, cellsHTML) => {
        const row = body.insertRow();
        row.className = 'editable-row';
        row.dataset.editType = editType;
        row.dataset.editIndex = index;
        row.title = editTitle;
        row.tabIndex = 0;
        row.innerHTML = cellsHTML;
    };

    const beamBody = document.getElementById('beam-table').querySelector('tbody');
    const beamEndM = toMeters(beam.endX) - toMeters(beam.startX);
    beamBody.innerHTML = `<tr><td>${langTranslations.beamStartPos}</td><td>0.00</td></tr>`;
    addRow(beamBody, 'beam', 0, `<td>${langTranslations.beamEndPos}</td><td>${beamEndM.toFixed(2)}</td>`);
    setTableVisibility('beam-table', true);

    const supportsAndHingesExist = supports.length > 0 || hinges.length > 0;
    setTableVisibility('supports-table', supportsAndHingesExist);
    if (supportsAndHingesExist) {
        const supportsBody = document.getElementById('supports-table').querySelector('tbody');
        const supportTypeMap = {
            'pin-support': langTranslations.tableContent.supportPin,
            'roller-support': langTranslations.tableContent.supportRoller,
            'fixed-support': langTranslations.tableContent.supportFixed,
            'hinge': langTranslations.tableContent.supportHinge
        };
        let counter = 1;
        supports.forEach((s, i) => addRow(supportsBody, 'support', i,
            `<td>${counter++}</td><td>${supportTypeMap[s.type] || langTranslations.tableContent.unknown}</td><td>${toMeters(s.x).toFixed(2)}</td>${delCell('support', i)}`));
        hinges.forEach((h, i) => addRow(supportsBody, 'hinge', i,
            `<td>${counter++}</td><td>${supportTypeMap['hinge']}</td><td>${toMeters(h.x).toFixed(2)}</td>${delCell('hinge', i)}`));
    }

    const concentratedLoadsExist = concentratedLoads.length > 0;
    setTableVisibility('concentrated-loads-table', concentratedLoadsExist);
    if (concentratedLoadsExist) {
        const body = document.getElementById('concentrated-loads-table').querySelector('tbody');
        concentratedLoads.forEach((l, i) => addRow(body, 'concentratedLoad', i,
            `<td>${i + 1}</td><td>${toMeters(l.x).toFixed(2)}</td><td>${f2(l.magnitude)}</td><td>${(l.angle * 180 / Math.PI).toFixed(1)}</td>${delCell('concentratedLoad', i)}`));
    }

    const distributedLoadsExist = distributedLoads.length > 0;
    setTableVisibility('distributed-loads-table', distributedLoadsExist);
    if (distributedLoadsExist) {
        const body = document.getElementById('distributed-loads-table').querySelector('tbody');
        distributedLoads.forEach((l, i) => addRow(body, 'distributedLoad', i,
            `<td>${i + 1}</td><td>${toMeters(l.startX).toFixed(2)}</td><td>${toMeters(l.endX).toFixed(2)}</td><td>${f2(-l.magnitude)}</td>${delCell('distributedLoad', i)}`));
    }

    const trapezoidalLoadsExist = trapezoidalLoads.length > 0;
    setTableVisibility('trapezoidal-loads-table', trapezoidalLoadsExist);
    if (trapezoidalLoadsExist) {
        const body = document.getElementById('trapezoidal-loads-table').querySelector('tbody');
        trapezoidalLoads.forEach((l, i) => addRow(body, 'trapezoidalLoad', i,
            `<td>${i + 1}</td><td>${toMeters(l.startX).toFixed(2)}</td><td>${toMeters(l.endX).toFixed(2)}</td><td>${f2(-l.startMagnitude)}</td><td>${f2(-l.endMagnitude)}</td>${delCell('trapezoidalLoad', i)}`));
    }

    const concentratedMomentsExist = concentratedMoments.length > 0;
    setTableVisibility('concentrated-moments-table', concentratedMomentsExist);
    if (concentratedMomentsExist) {
        const body = document.getElementById('concentrated-moments-table').querySelector('tbody');
        concentratedMoments.forEach((m, i) => addRow(body, 'concentratedMoment', i,
            `<td>${i + 1}</td><td>${toMeters(m.x).toFixed(2)}</td><td>${f2(m.magnitude)}</td>${delCell('concentratedMoment', i)}`));
    }

    const torsionMomentsExist = torsionMoments.length > 0;
    setTableVisibility('torsion-moments-table', torsionMomentsExist);
    if (torsionMomentsExist) {
        const body = document.getElementById('torsion-moments-table').querySelector('tbody');
        torsionMoments.forEach((t, i) => addRow(body, 'torsionMoment', i,
            `<td>${i + 1}</td><td>${toMeters(t.x).toFixed(2)}</td><td>${f2(t.magnitude)}</td>${delCell('torsionMoment', i)}`));
    }

}

// === YENİ EKLENEN FONKSİYON ===
/**
 * Seçili olan araca göre ipucu kutusunun içeriğini günceller.
 */
// İpucu kutusu geçici bir bildirimdir: araç değişince (ya da ipucu metni değişince) birkaç
// saniye görünür, sonra kendiliğinden kaybolur. Aynı metin yeniden hesaplamalarda tekrar açılmaz.
let __hintTimer = null, __lastHintText = null;
const HINT_DURATION_MS = 6000;

function showHintText(hintBox, text, force) {
    if (!force && text === __lastHintText) return;
    __lastHintText = text;
    hintBox.textContent = `💡 ${text}`;
    hintBox.classList.remove('hidden');
    clearTimeout(__hintTimer);
    __hintTimer = setTimeout(() => hintBox.classList.add('hidden'), HINT_DURATION_MS);
}

function hideHintBox() {
    const hintBox = document.getElementById('hint-box');
    clearTimeout(__hintTimer);
    if (hintBox) hintBox.classList.add('hidden');
}

/** @param {boolean} force - araç düğmesine basıldığında: metin aynı olsa da yeniden göster */
function updateHintBox(force = false) {
    const hintBox = document.getElementById('hint-box');
    if (!hintBox) return;

    const lang = document.documentElement.lang || 'tr';
    // 'edit' aracının tam adı 'editMove' olduğu için özel bir kontrol ekliyoruz.
    const toolKey = (currentTool === 'edit') ? 'edit' : currentTool.replace(/-/g, '');
    
    // Çeviri anahtarlarını daha tutarlı hale getirmek için tireleri kaldırıyoruz
    let hintKey = currentTool;
    if (currentTool === 'pin-support') hintKey = 'pinSupport';
    if (currentTool === 'roller-support') hintKey = 'rollerSupport';
    if (currentTool === 'fixed-support') hintKey = 'fixedSupport';
    if (currentTool === 'concentrated-load') hintKey = 'concentratedLoad';
    if (currentTool === 'concentrated-moment') hintKey = 'concentratedMoment';
    if (currentTool === 'torsion-moment') hintKey = 'torsionMoment';
    if (currentTool === 'distributed-load') hintKey = 'distributedLoad';
    if (currentTool === 'triangular-load') hintKey = 'triangularLoad';
    if (currentTool === 'edit') hintKey = 'edit';


    let hintText = translations[lang]?.toolHints?.[hintKey];

    // Kiriş varken "kiriş" aracı seçiliyse bir sonraki öğrenme adımı önerilir
    if (beam && currentTool === 'beam') {
        const hasLoads = concentratedLoads.length || distributedLoads.length || trapezoidalLoads.length || concentratedMoments.length || torsionMoments.length;
        const status = lastAnalysis && lastAnalysis.status;
        let next;
        if (supports.length === 0) next = 'hintAddSupports';
        else if (status && !status.solvable) next = 'hintFixSystem';
        else if (!hasLoads) next = 'hintAddLoads';
        else next = 'hintExplore';
        hintText = `${tFormat(next)} ${tFormat('hintBeamReplace')}`;
    }

    if (hintText && beam) { // Sadece kiriş çizildikten sonra ipuçlarını göster
        showHintText(hintBox, hintText, force);
    } else if (currentTool === 'beam' && !beam) { // Kiriş yoksa sadece kiriş ipucunu göster
        showHintText(hintBox, translations[lang]?.toolHints?.beam, force);
    }
    else {
        __lastHintText = null;
        hideHintBox();
    }
}

// Modelde çalışmaya başlayınca ipucu hemen kapanır
document.addEventListener('pointerdown', (e) => {
    if (e.target && e.target.id === 'drawingCanvas') hideHintBox();
}, true);

// === HESAPLAMA UYARI KUTUSU ===
/**
 * Hesaplama sırasında oluşan, kullanıcıyı kilitlemeyen i18n uyarıları gösterir.
 * alert() yerine kullanılır; aynı anahtar art arda gelirse zamanlayıcı yenilenir.
 * @param {string} key - translations içindeki uyarı anahtarı (örn. 'warnMultiHinge')
 */
let __calcWarningTimer = null;
function showCalcWarning(key) {
    const lang = document.documentElement.lang || 'tr';
    const message = (translations[lang] && translations[lang][key]) || (translations['en'] && translations['en'][key]) || key;

    let warningBox = document.getElementById('calc-warning-box');
    if (!warningBox) {
        warningBox = document.createElement('div');
        warningBox.id = 'calc-warning-box';
        warningBox.className = 'calc-warning-box';
        warningBox.setAttribute('role', 'status');
        warningBox.setAttribute('aria-live', 'polite');
        const wrapper = document.getElementById('canvas-wrapper') || document.body;
        wrapper.appendChild(warningBox);
    }
    warningBox.textContent = '⚠️ ' + message;
    warningBox.classList.add('show');
    if (__calcWarningTimer) clearTimeout(__calcWarningTimer);
    __calcWarningTimer = setTimeout(() => warningBox.classList.remove('show'), 5000);
}

// --- TEMA YÖNETİMİ ---
function initializeTheme() {
    let savedTheme = null;
    try { savedTheme = localStorage.getItem('theme'); } catch (e) { /* depolama kapalı */ }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        enableDarkMode();
    } else {
        enableLightMode(false); 
    }

    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (document.body.classList.contains('dark-mode')) {
                enableLightMode(true);
            } else {
                enableDarkMode(true);
            }
            const menu = document.getElementById('appMenu');
            if (menu) menu.classList.remove('show');
        });
    }

    const appMenuBtn = document.getElementById('app-menu-toggle');
    const appMenu = document.getElementById('appMenu');
    if (appMenuBtn && appMenu) {
        appMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            appMenu.classList.toggle('show');
            // stopPropagation belge dinleyicisini atladığından uygulama menüsü elle kapanır
            closeAppSwitcher();
        });
        document.addEventListener('click', (e) => {
            if (!appMenu.contains(e.target) && e.target !== appMenuBtn) {
                appMenu.classList.remove('show');
            }
        });
    }

    const proxyMenuClick = (menuId, targetId) => {
        const menuBtn = document.getElementById(menuId);
        if (!menuBtn) return;
        menuBtn.addEventListener('click', () => {
            if (appMenu) appMenu.classList.remove('show');
            const target = document.getElementById(targetId);
            if (target) target.click();
        });
    };
    proxyMenuClick('menu-open', 'open-btn');
    proxyMenuClick('menu-save', 'save-btn');

    const performReset = () => {
        const resetBtn = document.getElementById('reset-btn');
        if (!resetBtn) return;
        window.__skipResetConfirm = true;
        resetBtn.click();
        window.__skipResetConfirm = false;
        window.__lastSavedHash = null;
    };

    const menuNewBtn = document.getElementById('menu-new');
    if (menuNewBtn) {
        menuNewBtn.addEventListener('click', () => {
            if (appMenu) appMenu.classList.remove('show');
            if (isModelEmpty()) { performReset(); return; }
            const currentHash = getCurrentModelHash();
            const isSavedAndClean = window.__lastSavedHash && currentHash === window.__lastSavedHash;
            if (isSavedAndClean) {
                showConfirmModal({
                    titleKey: 'newConfirmTitle',
                    messageKey: 'newConfirmMessage',
                    yesKey: 'newConfirmYes',
                    variant: 'primary',
                    onConfirm: performReset
                });
            } else {
                showConfirmModal({
                    titleKey: 'newUnsavedTitle',
                    messageKey: 'newUnsavedMessage',
                    yesKey: 'newConfirmYes',
                    variant: 'warning',
                    onConfirm: performReset
                });
            }
        });
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            if (window.__skipResetConfirm) return;
            e.stopImmediatePropagation();
            e.preventDefault();
            // "Yeni" düğmesi: menüdeki Yeni ile aynı akış (boş modelde doğrudan, kaydedilmemiş
            // değişiklik varsa uyarıyla yeni çalışma alanı)
            if (menuNewBtn) menuNewBtn.click();
        }, true);
    }

    const examplesBtn = document.getElementById('menu-examples');
    if (examplesBtn) examplesBtn.addEventListener('click', () => {
        if (appMenu) appMenu.classList.remove('show');
        if (typeof window.showModelGallery === 'function') window.showModelGallery();
    });
    const signMenuBtn = document.getElementById('menu-sign');
    if (signMenuBtn) signMenuBtn.addEventListener('click', () => {
        if (appMenu) appMenu.classList.remove('show');
        if (typeof showSignConventionModal === 'function') showSignConventionModal();
    });

    const aboutBtn = document.getElementById('about-toggle');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => {
            if (appMenu) appMenu.classList.remove('show');
            showAboutModal();
        });
    }
}

// --- UYGULAMA DEĞİŞTİRİCİ ---
// vetin uygulamaları arası geçiş menüsü (logonun yanındaki 3×3 simge).
// Kutucuklar düz bağlantıdır; burada yalnız aç/kapa ve klavye erişimi var.
function setAppSwitcherOpen(open) {
    const btn = document.getElementById('btnAppSwitcher');
    const menu = document.getElementById('appSwitcherMenu');
    if (!btn || !menu) return;
    menu.classList.toggle('show', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    // Menü araç çubuğu ve tuvalin üstüne taşar; başlık yığında onların üstüne alınır
    document.querySelector('.page-header2')?.classList.toggle('app-menu-open', open);
}

function closeAppSwitcher() {
    setAppSwitcherOpen(false);
}

function initAppSwitcher() {
    const btn = document.getElementById('btnAppSwitcher');
    const menu = document.getElementById('appSwitcherMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !menu.classList.contains('show');
        setAppSwitcherOpen(open);
        if (open) document.getElementById('appMenu')?.classList.remove('show');
    });
    document.addEventListener('click', (e) => {
        if (menu.classList.contains('show') && !menu.contains(e.target)) closeAppSwitcher();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('show')) {
            closeAppSwitcher();
            btn.focus();
        }
    });
}

function showAboutModal() {
    const lang = document.documentElement.lang || 'en';
    const t = (typeof translations !== 'undefined' && translations[lang]) || (typeof translations !== 'undefined' && translations['en']) || {};
    const title = t.aboutTitle || 'About Vetin';
    const content = t.aboutContent || 'Vetin is an educational software developed for calculating internal forces in beams. Released under the MIT License.';
    const closeText = t.aboutClose || 'Close';

    let backdrop = document.getElementById('about-modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'about-modal-backdrop';
        backdrop.className = 'about-modal-backdrop';
        document.body.appendChild(backdrop);
    }
    const tagline = t.aboutTagline || 'INTERNAL FORCE DIAGRAMS';
    const version = t.aboutVersion || 'v1.0 · MIT License';
    const content2 = t.aboutContent2 || 'You can access other academic solutions in the Vetin ecosystem at';
    backdrop.innerHTML = `
        <div class="about-modal" role="dialog" aria-modal="true">
            <div class="about-modal-grid">
                <div class="about-modal-left">
                    <div class="about-modal-left-content">
                        <img src="logo.svg" alt="Vetin" class="about-logo">
                        <div class="about-modal-tagline">${tagline}</div>
                        <div class="about-modal-version">${version}</div>
                    </div>
                    <a href="http://www.iuc.edu.tr" target="_blank" rel="noopener noreferrer" class="about-iuc-link">
                        <img src="IUC.svg" alt="IUC" class="about-iuc-logo">
                    </a>
                </div>
                <div class="about-modal-right">
                    <h2>${title}</h2>
                    <div class="about-modal-body">
                        <p>${content}</p>
                        <p>${content2} <a href="https://www.rasimtemur.com/vetin/" target="_blank" rel="noopener noreferrer">rasimtemur.com/vetin</a></p>
                    </div>
                    <div class="about-modal-footer">
                        <button id="about-modal-close">${closeText}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    backdrop.classList.add('show');
    const previousFocus = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
    const close = () => {
        backdrop.classList.remove('show');
        document.removeEventListener('keydown', onKey, true);
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    };
    document.addEventListener('keydown', onKey, true);
    const closeBtn = document.getElementById('about-modal-close');
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    setTimeout(() => closeBtn.focus(), 0);
}

// getCurrentModelHash ve isModelEmpty: model.js

const CONFIRM_VARIANT_ICONS = {
    danger: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
    warning: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
    primary: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="12" x2="12" y2="18"></line><line x1="9" y1="15" x2="15" y2="15"></line>'
};

function showConfirmModal(opts) {
    const lang = document.documentElement.lang || 'en';
    const t = (typeof translations !== 'undefined' && translations[lang]) || (typeof translations !== 'undefined' && translations['en']) || {};
    const title = t[opts.titleKey] || opts.title || '';
    const message = t[opts.messageKey] || opts.message || '';
    const yesText = t[opts.yesKey] || opts.yesText || 'OK';
    const cancelText = t.resetConfirmCancel || 'Cancel';
    const variant = opts.variant || 'danger';
    const iconSvg = CONFIRM_VARIANT_ICONS[variant] || CONFIRM_VARIANT_ICONS.danger;
    const yesClass = variant === 'primary' ? 'btn-primary' : (variant === 'warning' ? 'btn-warning' : 'btn-danger');

    let backdrop = document.getElementById('confirm-modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'confirm-modal-backdrop';
        backdrop.className = 'confirm-modal-backdrop';
        document.body.appendChild(backdrop);
    }
    backdrop.innerHTML = `
        <div class="confirm-modal confirm-${variant}" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
            <div class="confirm-modal-header">
                <div class="icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
                </div>
                <h3 id="confirm-modal-title">${title}</h3>
            </div>
            <p>${message}</p>
            <div class="confirm-modal-footer">
                <button class="btn-cancel" id="confirm-modal-cancel">${cancelText}</button>
                <button class="${yesClass}" id="confirm-modal-yes">${yesText}</button>
            </div>
        </div>
    `;
    backdrop.classList.add('show');

    // Esc kapatır, odak pencereye taşınır ve kapanınca geri verilir
    const previousFocus = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
    const close = () => {
        backdrop.classList.remove('show');
        document.removeEventListener('keydown', onKey, true);
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    };
    document.addEventListener('keydown', onKey, true);
    document.getElementById('confirm-modal-cancel').addEventListener('click', close);
    setTimeout(() => document.getElementById('confirm-modal-cancel')?.focus(), 0);
    document.getElementById('confirm-modal-yes').addEventListener('click', () => {
        close();
        if (typeof opts.onConfirm === 'function') opts.onConfirm();
    });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
}

function enableDarkMode(shouldRedraw = false) {
    document.body.classList.add('dark-mode');
    try { localStorage.setItem('theme', 'dark'); } catch (e) { /* depolama kapalı */ }
    
    // Koyu Mod Renkleri (Referans: Kesit Projesi)
    COLORS.GRID = '#1E293B';
    COLORS.BEAM_STROKE = '#3B82F6';
    COLORS.SUPPORT = '#A0A0A0';
    COLORS.DIMENSION = '#F0F0F0';
    COLORS.BEAM_FILL = 'rgba(59, 130, 246, 0.4)';
    COLORS.FBD_REACTION_TEXT = '#4fd1a5';
    
    if (shouldRedraw && typeof redrawCanvas === 'function') {
        // FBD güncellemesi - En öncelikli çizim
        const fbdWrapper = document.getElementById('freeBodyDiagramCanvas');
        if (fbdWrapper && !fbdWrapper.closest('.hidden')) redrawFreeBodyDiagram();

        redrawCanvas();
        // Tüm diyagramların (EKD ve burulma dahil) eksen renkleri temaya uyarlanır
        refreshChartThemes();
    }
}

function enableLightMode(shouldRedraw = false) {
    document.body.classList.remove('dark-mode');
    try { localStorage.setItem('theme', 'light'); } catch (e) { /* depolama kapalı */ }
    
    // Açık Mod Renkleri (Orijinal)
    COLORS.GRID = '#e9e9ed';
    COLORS.BEAM_STROKE = '#389fb6';
    COLORS.SUPPORT = '#4f5659';
    COLORS.DIMENSION = '#555';
    COLORS.BEAM_FILL = 'rgba(56, 159, 182, 0.2)';
    COLORS.FBD_REACTION_TEXT = '#0f6b50';

    if (shouldRedraw && typeof redrawCanvas === 'function') {
        // FBD güncellemesi - En öncelikli çizim
        const fbdWrapper = document.getElementById('freeBodyDiagramCanvas');
        if (fbdWrapper && !fbdWrapper.closest('.hidden')) redrawFreeBodyDiagram();

        redrawCanvas();
        // Tüm diyagramların (EKD ve burulma dahil) eksen renkleri temaya uyarlanır
        refreshChartThemes();
    }
}

// === Gerber kirişi: ara mafsallardan ayrılmış parçaların SCD'si ===
//
// SCD'nin üstünde, her parça kendi serbest cisim diyagramıyla ayrı çizilir. Parçalar
// SCD ile aynı x konumundadır; "asılı" parçalar oturdukları taşıyıcı parçaların üstünde
// yer alır (düzey, BeamSolver.gerberParts çözüm sırasından bulunur). Mafsal kuvvetleri
// etki–tepki ilkesiyle iki parçaya eşit ve ters yönde çizilir.

/** Parçaların düşey düzeyleri: taşıyıcı (kendi mesnetleriyle dengede) = 0; asılı parça,
 *  oturduğu komşulardan bir üst düzeydedir. Çözülemiyorsa null. */
function gerberPartLevels(res) {
    const gp = res && BeamSolver.gerberParts ? BeamSolver.gerberParts(res) : null;
    if (!gp) return null;
    const byIndex = [];
    gp.parts.forEach(p => { byIndex[p.index] = p; });
    const level = [];
    // Asılı parçanın bilinmeyen mafsalları, daha sonra çözülen komşulara oturur
    [...gp.parts].sort((p, q) => q.step - p.step).forEach(p => {
        const below = p.unknowns.filter(u => u.hinge !== undefined).map(u => level[u.side === 'right' ? p.index + 1 : p.index - 1] ?? 0);
        level[p.index] = below.length ? 1 + Math.max(...below) : 0;
    });
    return byIndex.map(p => ({ a: p.a, b: p.b, index: p.index, level: level[p.index] }));
}

function drawGerberPartsDiagram() {
    const cv = document.getElementById('gerberPartsCanvas');
    const section = document.getElementById('gerber-parts-section');
    if (!cv || !section) return;
    const res = lastAnalysis && lastAnalysis.result;
    const s = lastAnalysis && lastAnalysis.solution;
    const parts = (beam && s && res && res.solved && res.hingeForces && res.hingeForces.length) ? gerberPartLevels(res) : null;
    // Gerber kirişinde iki başlıklı bölüm: ayrılmış parçalar (üstte) ve bütün sistem (altta)
    section.hidden = !parts;
    const wholeTitle = document.getElementById('fbd-whole-title');
    if (wholeTitle) wholeTitle.hidden = !parts;
    section.parentElement?.classList.toggle('has-gerber-parts', !!parts);
    if (!parts || cv.clientWidth === 0) return;

    const ctx = cv.getContext('2d');
    const { toPixels } = getConversionFunctions();
    const gridSize = getGridSize();
    const pxPerKN = gridSize / getKNPerGrid();
    const showLoads = fbdDisplayOptions.loads, showReactions = fbdDisplayOptions.reactions;
    const dark = document.body.classList.contains('dark-mode');
    const HINGE_COLOR = '#6a1b9a';

    const dists = s.fbdDistLoads || [], traps = s.fbdTrapLoads || [];
    // Her düzeyin üst boşluğu yalnızca o düzeydeki parçaların yüklerine göre (gereksiz boşluk kalmaz)
    const below = 84, topPad = 4;
    const nLevels = Math.max(...parts.map(p => p.level)) + 1;
    const overlaps = (a1, b1, a2, b2) => Math.min(b1, b2) - Math.max(a1, a2) > 0.5;
    const partAbove = (p) => {
        const x1 = toPixels(p.a), x2 = toPixels(p.b), inP = (x) => x >= x1 - 0.5 && x <= x2 + 0.5;
        let h = 24;
        if (showLoads) {
            dists.forEach(l => { if (overlaps(Math.min(l.startX, l.endX), Math.max(l.startX, l.endX), x1, x2)) h = Math.max(h, Math.abs(l.magnitude) * pxPerKN + 26); });
            traps.forEach(l => { if (overlaps(l.startX, l.endX, x1, x2)) h = Math.max(h, Math.max(Math.abs(l.startMagnitude), Math.abs(l.endMagnitude)) * pxPerKN + 26); });
            if (concentratedLoads.some(l => inP(l.x) && Math.abs(l.magnitude * Math.sin(l.angle)) > EPSILON)) h = Math.max(h, 70);
            if (concentratedMoments.some(m => inP(m.x)) || torsionMoments.some(t => inP(t.x))) h = Math.max(h, 50);
        }
        if (showReactions) {
            if ((s.momentReactions || []).some(m => inP(m.x) && Math.abs(m.magnitude) > EPSILON)) h = Math.max(h, 50);
            // Taşıyıcı parçaya mafsaldan aşağı yönlü kuvvet (ok 48 px + etiket)
            if (res.hingeForces.some(hf => { const hx = toPixels(hf.x); return (Math.abs(hx - x2) <= 0.5 && -hf.V < -0.005) || (Math.abs(hx - x1) <= 0.5 && hf.V < -0.005); })) h = Math.max(h, 56);
        }
        return h + 8;
    };
    const levelAbove = Array.from({ length: nLevels }, (_, lv) => Math.max(32, ...parts.filter(p => p.level === lv).map(partAbove)));
    // Düzeyler yukarıdan aşağı: en üst düzey ilk sırada
    const levelY = [];
    let acc = topPad;
    for (let lv = nLevels - 1; lv >= 0; lv--) { levelY[lv] = acc + levelAbove[lv] + gridSize / 2; acc += levelAbove[lv] + gridSize + below; }
    const height = Math.round(acc);
    if (Math.abs(cv.clientHeight - height) > 1) cv.style.height = `${height}px`;
    scaleCanvasForHiDPI(cv, ctx);

    ctx.save();
    ctx.fillStyle = dark ? '#0F1419' : 'white';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.restore();

    ctx.save();
    // SCD ile aynı yatay hizalama (masaüstünde iç boşluk telafisi) ve ızgara
    if (window.innerWidth > 800) ctx.translate(-20, 0);
    drawGrid(ctx, window.innerWidth > 800 ? cv.clientWidth + 20 : cv.clientWidth, cv.clientHeight);


    const tolPx = 0.5;
    const pxParts = parts.map(p => ({ ...p, x1: toPixels(p.a), x2: toPixels(p.b) }));
    // Noktanın ait olduğu parça (mafsal üzerindeki yatay yük sol parçaya)
    const partAt = (x) => pxParts.find(p => x > p.x1 + tolPx && x < p.x2 - tolPx)
        || pxParts.find(p => Math.abs(x - p.x2) <= tolPx) || pxParts.find(p => Math.abs(x - p.x1) <= tolPx) || null;
    const label = (text, x, y, align, color, font = 'bold 12px Arial', baseline = 'top') => {
        ctx.save(); ctx.fillStyle = color; ctx.font = font; ctx.textBaseline = baseline;
        fillSubscriptText(ctx, text, x, y, align);
        ctx.restore();
    };

    pxParts.forEach(p => {
        const y = levelY[p.level];
        const top = y - gridSize / 2, bottom = y + gridSize / 2;
        const mine = (x) => partAt(x) === p;

        drawBeam(ctx, p.x1, y, p.x2, y);

        if (showLoads) {
            dists.forEach(l => {
                const a = Math.max(Math.min(l.startX, l.endX), p.x1), b = Math.min(Math.max(l.startX, l.endX), p.x2);
                if (b - a > tolPx) drawDistributedLoad(ctx, a, b, y, l.magnitude, false);
            });
            traps.forEach(l => {
                const a = Math.max(l.startX, p.x1), b = Math.min(l.endX, p.x2);
                if (b - a <= tolPx) return;
                const w = (x) => l.startMagnitude + (l.endMagnitude - l.startMagnitude) * (x - l.startX) / ((l.endX - l.startX) || 1);
                drawTrapezoidalLoad(ctx, a, b, y, w(a), w(b), false);
            });
            concentratedLoads.forEach(l => {
                if (!mine(l.x)) return;
                const fv = l.magnitude * Math.sin(l.angle), fh = l.magnitude * Math.cos(l.angle);
                if (Math.abs(fv) > EPSILON) {
                    const up = fv < 0, L = 48;
                    drawFilledArrow(ctx, l.x, up ? top : top - L, l.x, up ? top - L : top, COLORS.LOAD);
                    label(`${Math.abs(fv).toFixed(2)} kN`, l.x, top - L - 5, 'center', COLORS.LOAD, '12px Arial', 'bottom');
                }
                if (Math.abs(fh) > EPSILON) {
                    const toLeft = fh < 0;
                    drawFilledArrow(ctx, toLeft ? l.x + 44 : l.x - 44, y, l.x, y, COLORS.LOAD);
                    label(`${Math.abs(fh).toFixed(2)} kN`, toLeft ? l.x - 5 : l.x + 5, y, toLeft ? 'right' : 'left', COLORS.LOAD, '12px Arial', 'middle');
                }
            });
            concentratedMoments.forEach(m => { if (mine(m.x)) drawConcentratedMoment(ctx, { ...m, y }, COLORS.LOAD); });
            torsionMoments.forEach(t => { if (mine(t.x)) drawTorsionMoment(ctx, { ...t, y }); });
        }

        if (showReactions) {
            (s.reactions || []).forEach(r => {
                if (!mine(r.x) || Math.abs(r.magnitude) <= EPSILON) return;
                const up = r.magnitude > 0, L = 48;
                drawFilledArrow(ctx, r.x, up ? bottom + L : bottom, r.x, up ? bottom : bottom + L, COLORS.FBD_REACTION);
                label(r.name ? `${r.name}_y = ${Math.abs(r.magnitude).toFixed(2)} kN` : `${Math.abs(r.magnitude).toFixed(2)} kN`, r.x, bottom + L + 4, 'center', COLORS.FBD_REACTION_TEXT);
            });
            (s.momentReactions || []).forEach(mr => {
                if (mine(mr.x) && Math.abs(mr.magnitude) > EPSILON) drawReactionMoment(ctx, mr.x, y, -mr.magnitude, COLORS.FBD_REACTION, mr.name ? `M_${mr.name}` : null);
            });
            const ax = lastAnalysis.axialReaction;
            if (ax && mine(ax.x) && Math.abs(ax.magnitude) > EPSILON) {
                const outsideLeft = ax.x <= (beam.startX + beam.endX) / 2, far = outsideLeft ? ax.x - 44 : ax.x + 44;
                const outward = outsideLeft ? ax.magnitude < 0 : ax.magnitude > 0;
                drawFilledArrow(ctx, outward ? ax.x : far, y, outward ? far : ax.x, y, COLORS.FBD_REACTION);
                label(ax.name ? `${ax.name}_x = ${Math.abs(ax.magnitude).toFixed(2)} kN` : `${Math.abs(ax.magnitude).toFixed(2)} kN`,
                    outsideLeft ? far - 6 : far + 6, y, outsideLeft ? 'right' : 'left', COLORS.FBD_REACTION_TEXT, 'bold 12px Arial', 'middle');
            }
            const tr = lastAnalysis.torsionReaction;
            if (tr && mine(tr.x) && Math.abs(tr.magnitude) > EPSILON) drawTorsionMoment(ctx, { x: tr.x, y, magnitude: tr.magnitude }, COLORS.FBD_REACTION);

            // Mafsal kuvvetleri: sol parçaya düşeyde −V (yukarı +), yatayda +N (çekme → sağa); sağ parçaya tersi.
            // Etiket parçanın dışına (mafsalın öte yanına) yazılır.
            res.hingeForces.forEach(h => {
                const hx = toPixels(h.x);
                const isLeftPart = Math.abs(hx - p.x2) <= tolPx, isRightPart = Math.abs(hx - p.x1) <= tolPx;
                if (!isLeftPart && !isRightPart) return;
                const sgn = isLeftPart ? 1 : -1;
                const fy = -h.V * sgn, fx = h.N * sgn;
                const align = isLeftPart ? 'left' : 'right', lx = hx + (isLeftPart ? 9 : -9);
                if (Math.abs(fy) >= 0.005) {
                    const text = `V_${h.name} = ${Math.abs(fy).toFixed(2)} kN`;
                    if (fy > 0) {
                        drawFilledArrow(ctx, hx, bottom + 48, hx, bottom, HINGE_COLOR);
                        label(text, lx, bottom + 40, align, HINGE_COLOR, 'bold 12px Arial', 'middle');
                    } else {
                        const Ld = 48; // Asılı parçadaki ters yönlü okla aynı uzunluk
                        drawFilledArrow(ctx, hx, top - Ld, hx, top, HINGE_COLOR);
                        label(text, lx, top - Ld + 8, align, HINGE_COLOR, 'bold 12px Arial', 'middle');
                    }
                }
                if (Math.abs(fx) >= 0.005) {
                    const out = isLeftPart ? hx + 40 : hx - 40;
                    const pointsOut = isLeftPart ? fx > 0 : fx < 0;
                    drawFilledArrow(ctx, pointsOut ? hx : out, y, pointsOut ? out : hx, y, HINGE_COLOR);
                    label(`H_${h.name} = ${Math.abs(fx).toFixed(2)} kN`, out, y - 8, align, HINGE_COLOR, 'bold 12px Arial', 'bottom');
                }
            });
        }

        // Mafsallar ve nokta adları (A, B, C …): ad, noktanın sol altına
        res.hingeForces.forEach(h => {
            const hx = toPixels(h.x);
            if (Math.abs(hx - p.x1) <= tolPx || Math.abs(hx - p.x2) <= tolPx) drawHinge(ctx, hx, y);
        });
        ctx.save();
        ctx.font = 'bold 13px Arial'; ctx.textBaseline = 'top'; ctx.textAlign = 'right';
        ctx.fillStyle = dark ? '#8ab4f8' : '#1f4e8c';
        (res.points || []).forEach(pt => {
            const x = toPixels(pt.x);
            if (x >= p.x1 - tolPx && x <= p.x2 + tolPx) ctx.fillText(pt.name, x - 8, bottom + 4);
        });
        ctx.restore();
    });
    ctx.restore();
}

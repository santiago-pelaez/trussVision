// common/app.js

function scaleCanvasForHiDPI(canvas, context) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth * devicePixelRatio || canvas.height !== displayHeight * devicePixelRatio) {
        canvas.width = displayWidth * devicePixelRatio;
        canvas.height = displayHeight * devicePixelRatio;
        context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
}

const getConversionFunctions = () => {
    const gridSize = getGridSize();
    const metersPerGrid = getMetersPerGrid();

    // Metrik hesaplamaları için, varsa kirişin oluşturulduğu andaki ayarları kullan.
    // Bu, görsel ızgara boyutu değişikliklerinden etkilenmemeyi garantiler.
    const effectiveGridSize = beam ? (beam.gridSizeOnCreation || gridSize) : gridSize;
    const effectiveMetersPerGrid = beam ? (beam.metersPerGridOnCreation || metersPerGrid) : metersPerGrid;
    const pixelsPerMeter = effectiveGridSize / effectiveMetersPerGrid;

    const toMeters = (px) => beam ? (px - beam.startX) / pixelsPerMeter : 0;
    const toPixels = (m) => beam ? (m * pixelsPerMeter) + beam.startX : 0;
    
    return { toMeters, toPixels, gridSize, metersPerGrid };
};

function getEventPosition(evt) {
    let pos;
    if (evt.touches && evt.touches.length > 0) {
        // Aktif dokunma olayı (touchstart, touchmove)
        pos = evt.touches[0];
    } else if (evt.changedTouches && evt.changedTouches.length > 0) {
        // Dokunmanın bittiği olay (touchend)
        pos = evt.changedTouches[0];
    } else {
        // Fare olayı
        pos = evt;
    }
    return { clientX: pos.clientX, clientY: pos.clientY };
}

function getSnappedMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const pos = getEventPosition(evt); // Güncellenmiş yardımcı fonksiyonu kullan
    const gridSize = getGridSize();
    const x = pos.clientX - rect.left;
    const y = pos.clientY - rect.top;
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;
    return { x: snappedX, y: snappedY };
}

function getRawMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const pos = getEventPosition(evt); // Güncellenmiş yardımcı fonksiyonu kullan
    const x = pos.clientX - rect.left;
    const y = pos.clientY - rect.top;
    return { x, y };
}

// --- Kiriş sınırları ---
// Mesnet, mafsal ve yükler yalnızca kiriş üzerinde olabilir. Tıklama kirişin
// yatay aralığı dışındaysa eleman eklenmez; sürüklemede ve kiriş boyu
// değiştiğinde elemanlar kiriş üzerine sınırlanır (yayılı yükler kırpılır).
function isWithinBeamX(x) {
    return !!beam && x >= beam.startX - 0.5 && x <= beam.endX + 0.5;
}

function clampToBeam(x) {
    return beam ? Math.min(Math.max(x, beam.startX), beam.endX) : x;
}

function clampModelToBeam() {
    if (!beam) return;
    // Tekil yükler her zaman pozitif şiddet + yön açısı olarak tutulur (gösterimde çift eksi olmasın)
    if (typeof normalizeConcentratedLoad === 'function') concentratedLoads.forEach(normalizeConcentratedLoad);
    [supports, hinges, concentratedLoads, concentratedMoments, torsionMoments].forEach(list => list.forEach(el => { el.x = clampToBeam(el.x); }));
    const clip = (list, isTrap) => {
        for (let i = list.length - 1; i >= 0; i--) {
            const l = list[i];
            const s = Math.min(l.startX, l.endX), e = Math.max(l.startX, l.endX);
            const cs = clampToBeam(s), ce = clampToBeam(e);
            if (ce - cs < 0.5) { list.splice(i, 1); continue; }
            if (isTrap && (cs !== s || ce !== e)) {
                // Trapez yükün şiddetleri kırpılan uçlarda doğrusal olarak yeniden bulunur
                const asc = l.startX <= l.endX;
                const w1 = asc ? l.startMagnitude : l.endMagnitude, w2 = asc ? l.endMagnitude : l.startMagnitude;
                const at = (x) => w1 + (w2 - w1) * (x - s) / (e - s);
                const n1 = at(cs), n2 = at(ce);
                if (asc) { l.startMagnitude = n1; l.endMagnitude = n2; } else { l.startMagnitude = n2; l.endMagnitude = n1; }
            }
            if (l.startX <= l.endX) { l.startX = cs; l.endX = ce; } else { l.startX = ce; l.endX = cs; }
        }
    };
    clip(distributedLoads, false);
    clip(trapezoidalLoads, true);
}

function updateAll() {
    clampModelToBeam();
    updateDiagramsVisibility();
    updateTables();
    // Hesap (calculations.js/analyzeBeam) ve çizim (ui-handler.js/renderAnalysis)
    runAnalysis(false);
    if (typeof recordModelHistory === 'function') recordModelHistory();
}

function redrawCanvas(options = {}) {
    const defaultOptions = { drawGrid: true };
    const finalOptions = { ...defaultOptions, ...options };

    // Kaydırma çubuğu belirip kaybolduğunda (resize olayı olmadan) tuval CSS
    // genişliği değişebilir; bit eşlem boyutu güncel tutulmazsa çizim esner ve
    // SCD/diyagramlarla hizası bozulur.
    scaleCanvasForHiDPI(canvas, ctx);

    const devicePixelRatio = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.save();
    // Karanlık mod kontrolü
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        // Kesit referansı: --fluent-layer-fill-default: #0F1419
        ctx.fillStyle = '#0F1419';
    } else {
        ctx.fillStyle = 'white';
    }
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    if (beam) {
        const gridSize = getGridSize();
        const canvasCenterY = canvas.clientHeight * 0.58;
        const nearestGridY = Math.floor(canvasCenterY / gridSize) * gridSize;
        beam.startY = nearestGridY + gridSize / 2;
        
        concentratedLoads.forEach(l => {
            l.y = beam.startY - (gridSize / 2);
        });
        concentratedMoments.forEach(m => { m.y = beam.startY; });
        torsionMoments.forEach(t => { t.y = beam.startY; });
    }

    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    
    if (finalOptions.drawGrid) {
        drawGrid(ctx, cssWidth, cssHeight);
    }
    
    if (beam) {
        drawBeam(ctx, beam.startX, beam.startY, beam.endX, beam.endY);
        hinges.forEach(h => drawHinge(ctx, h.x, beam.startY));
    }
    supports.forEach(s => drawSupport(ctx, s.type, s.x, beam ? beam.startY : s.y));
    concentratedLoads.forEach(l => drawConcentratedLoad(ctx, l));
    concentratedMoments.forEach(m => drawConcentratedMoment(ctx, m, COLORS.LOAD));
    torsionMoments.forEach(t => drawTorsionMoment(ctx, t));
    distributedLoads.forEach(l => drawDistributedLoad(ctx, l.startX, l.endX, beam.startY, l.magnitude));
    trapezoidalLoads.forEach(l => drawTrapezoidalLoad(ctx, l.startX, l.endX, beam.startY, l.startMagnitude, l.endMagnitude));
    if (beam) {
        const gridSize = getGridSize();
        const beamBottomLineY = Math.round((beam.startY + gridSize / 2) / gridSize) * gridSize;
        const dimensionLineY = beamBottomLineY + (3 * gridSize);
        drawDimensions(ctx, dimensionLineY);
        if (typeof drawPointNames === 'function') drawPointNames(ctx, dimensionLineY);
        if (currentTool === 'edit') drawResizeHandles(ctx);
    }

    if (drawingStage > 0 && firstTapPoint) {
        drawTapIndicator(ctx, firstTapPoint);
    }

    if (beam && !isDrawing && !isResizing && !isDrawingConcentratedLoad && !isDrawingConcentratedMoment && !isDrawingTorsionMoment && drawingStage === 0) {
        drawPreview();
    }

    if (isDrawing || (drawingStage > 0 && ['distributed-load', 'triangular-load'].includes(currentTool))) {
        drawDragPreview();
    }
    
    if (isDrawingConcentratedLoad) {
        drawConcentratedLoadPreview();
    }
    
    if (isDrawingConcentratedMoment || isDrawingTorsionMoment) {
        drawMomentPreview();
    }

    // Kesim Yöntemi: çizgi ve sağ tarafın grileştirilmesi (en üst katman)
    if (typeof drawCutOverlayOnModel === 'function') drawCutOverlayOnModel(ctx);
}

function drawPreview() {
    const pos = currentMousePos;
    if (!beam) return;
    const isOnBeam = pos.x >= beam.startX && pos.x <= beam.endX;
    if (!isOnBeam) return;
    let showDimensionPreview = false;
    
    if (!isTouchDevice) {
        if (['pin-support', 'roller-support', 'fixed-support'].includes(currentTool)) {
            drawSupport(ctx, currentTool, pos.x, beam.startY, true);
            showDimensionPreview = true;
        } else if (currentTool === 'hinge') {
            drawHinge(ctx, pos.x, beam.startY);
            showDimensionPreview = true;
        }
    }
    
    if (['concentrated-load', 'concentrated-moment', 'torsion-moment', 'distributed-load', 'triangular-load'].includes(currentTool) && drawingStage === 0) {
        ctx.save();
        ctx.fillStyle = COLORS.PREVIEW;
        ctx.beginPath();
        let yPos;
        if (currentTool === 'concentrated-moment' || currentTool === 'torsion-moment') {
            yPos = beam.startY;
        } else {
            const gridSize = getGridSize();
            yPos = beam.startY - (gridSize / 2);
        }
        ctx.arc(pos.x, yPos, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
        showDimensionPreview = true;
    }

    if (showDimensionPreview) {
        let allPoints = [beam.startX, beam.endX, ...supports.map(s => s.x), ...hinges.map(h => h.x), ...concentratedLoads.map(l => l.x), ...distributedLoads.flatMap(l => [l.startX, l.endX]), ...trapezoidalLoads.flatMap(l => [l.startX, l.endX]), ...concentratedMoments.map(m => m.x), ...torsionMoments.map(t => t.x)];
        const gridSize = getGridSize();
        const beamBottomLineY = Math.round((beam.startY + gridSize / 2) / gridSize) * gridSize;
        const dimensionLineY = beamBottomLineY + (3 * gridSize);
        drawPreviewDimension(ctx, pos.x, allPoints, dimensionLineY);
    }
}

function drawConcentratedLoadPreview() {
    if (!isDrawingConcentratedLoad || !concentratedLoadStartPoint) return;
    const startPos = concentratedLoadStartPoint;
    const endPos = currentRawMousePos;
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const originalAngleRad = Math.atan2(dy, dx);
    const originalAngleDeg = originalAngleRad * 180 / Math.PI;
    const snappedAngleDeg = Math.round(originalAngleDeg / 5) * 5;
    const snappedAngleRad = snappedAngleDeg * Math.PI / 180;
    const length = Math.sqrt(dx * dx + dy * dy);
    const snappedEndX = startPos.x + length * Math.cos(snappedAngleRad);
    const snappedEndY = startPos.y + length * Math.sin(snappedAngleRad);
    const gridSize = getGridSize();
    const kNPerGrid = getKNPerGrid();
    const magnitude = (length / gridSize) * kNPerGrid;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = COLORS.PREVIEW;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(snappedEndX, snappedEndY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.DIMENSION;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const textX = startPos.x + (snappedEndX - startPos.x) / 2;
    const textY = startPos.y + (snappedEndY - startPos.y) / 2;
    ctx.fillText(snappedAngleDeg.toFixed(0) + '°', textX, textY - 10);
    ctx.fillText(magnitude.toFixed(2) + ' kN', textX, textY + 5);
    ctx.restore();
}

function drawMomentPreview() {
    if (!momentStartPoint) return;

    const startPos = momentStartPoint;
    const endPos = currentRawMousePos;
    const dy = endPos.y - startPos.y;
    // Izgara ayarlarıyla tutarlı ölçek (olay yöneticilerindeki hesapla aynı)
    const magnitude = -(dy / (getGridSize() / getKNPerGrid()));
    const currentX = currentMousePos.x;

    if (isDrawingConcentratedMoment) {
        drawConcentratedMoment(ctx, { x: currentX, y: beam.startY, magnitude: magnitude }, COLORS.LOAD, true);
    } else if (isDrawingTorsionMoment) {
        drawTorsionMoment(ctx, { x: currentX, y: beam.startY, magnitude: magnitude }, '#8B4513', true);
    }
}

function drawDragPreview() {
    if (currentTool === 'beam' && isDrawing) {
        const gridSize = getGridSize();
        const height = gridSize;
        const y = startPoint.y;
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = COLORS.PREVIEW;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.rect(startPoint.x, y - height / 2, currentMousePos.x - startPoint.x, height);
        ctx.stroke();
        ctx.restore();
    } 
    else if (['distributed-load', 'triangular-load'].includes(currentTool) && beam && drawingStage > 0) {
        const gridSize = getGridSize();
        const beamTopY = beam.startY - (gridSize / 2);
        const kNPerGrid = getKNPerGrid();

        if (isTouchDevice) {
            if (currentTool === 'triangular-load') {
                if (drawingStage === 1) {
                    const mag = ((currentRawMousePos.y - beamTopY) / gridSize) * kNPerGrid;
                    drawTrapezoidalLoad(ctx, loadStartPoint.x, loadStartPoint.x, beam.startY, mag, mag, true);
                } else if (drawingStage === 2) {
                    const startMag = confirmedMagnitude1;
                    const endMag = ((currentRawMousePos.y - beamTopY) / gridSize) * kNPerGrid;
                    drawTrapezoidalLoad(ctx, loadStartPoint.x, currentMousePos.x, beam.startY, startMag, endMag, true);
                }
            } else { // distributed-load (mobil)
                const currentVerticalDistance = currentRawMousePos.y - beamTopY;
                const mag2 = (currentVerticalDistance / gridSize) * kNPerGrid;
                drawDistributedLoad(ctx, loadStartPoint.x, currentMousePos.x, beam.startY, mag2, true);
            }
        } else { // Masaüstü için orijinal, çok adımlı önizleme
            if (drawingStage === 1) {
                const verticalDistance = currentRawMousePos.y - beamTopY;
                const mag = (verticalDistance / gridSize) * kNPerGrid;
                const pixelsPerKN = gridSize / kNPerGrid;
                const magHeight = Math.abs(mag) * pixelsPerKN;
                const y_top = (mag > 0) ? beamTopY + magHeight : beamTopY - magHeight;
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = COLORS.PREVIEW;
                ctx.setLineDash([4, 4]);
                ctx.moveTo(loadStartPoint.x, beamTopY);
                ctx.lineTo(loadStartPoint.x, y_top);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = COLORS.DIMENSION;
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(Math.abs(mag).toFixed(2) + " kN/m", loadStartPoint.x, mag > 0 ? y_top + 15 : y_top - 5);
                ctx.restore();
            } else if (drawingStage === 2) {
                if (currentTool === 'distributed-load') {
                    drawDistributedLoad(ctx, loadStartPoint.x, currentMousePos.x, beam.startY, confirmedMagnitude1, true);
                } else {
                    const verticalDistance2 = currentRawMousePos.y - beamTopY;
                    const mag2 = (verticalDistance2 / gridSize) * kNPerGrid;
                    drawTrapezoidalLoad(ctx, loadStartPoint.x, currentMousePos.x, beam.startY, confirmedMagnitude1, mag2, true);
                }
            }
        }
    }
}

// Hit Detection Functions
function getHingeAtPos(pos) { if (!beam) return null; for (let i = hinges.length - 1; i >= 0; i--) { const hinge = hinges[i]; const hitboxSize = 20; const isInsideX = pos.x >= hinge.x - hitboxSize / 2 && pos.x <= hinge.x + hitboxSize / 2; const isInsideY = pos.y >= beam.startY - hitboxSize / 2 && pos.y <= beam.startY + hitboxSize / 2; if (isInsideX && isInsideY) { return i; } } return null; }
function getHandleAtPos(pos) { if (!beam) return null; const handleSize = isTouchDevice ? 24 : 10; if (pos.x >= beam.startX - handleSize / 2 && pos.x <= beam.startX + handleSize / 2 && pos.y >= beam.startY - handleSize / 2 && pos.y <= beam.startY + handleSize / 2) { return 'start'; } if (pos.x >= beam.endX - handleSize / 2 && pos.x <= beam.endX + handleSize / 2 && pos.y >= beam.startY - handleSize / 2 && pos.y <= beam.startY + handleSize / 2) { return 'end'; } return null; }
function getSupportAtPos(pos) { if (!beam) return null; for (let i = supports.length - 1; i >= 0; i--) { const support = supports[i]; const bboxWidth = 30, bboxHeight = 40, startY = beam.startY; if (pos.x >= support.x - bboxWidth/2 && pos.x <= support.x + bboxWidth/2 && pos.y >= startY && pos.y <= startY + bboxHeight) { return i; } } return null; }
function getDistLoadHandleAtPos(pos) { if (!beam) return null; const handleSize = isTouchDevice ? 24 : 10; const gridSize = getGridSize(); const kNPerGrid = getKNPerGrid(); const pixelsPerKN = gridSize / kNPerGrid; for (let i = distributedLoads.length - 1; i >= 0; i--) { const load = distributedLoads[i]; const loadHeight = Math.abs(load.magnitude) * pixelsPerKN; const y_pos = (load.magnitude < 0) ? (beam.startY - 10) - loadHeight : (beam.startY - 10) + loadHeight; if (pos.x >= load.startX - handleSize / 2 && pos.x <= load.startX + handleSize / 2 && pos.y >= y_pos - handleSize / 2 && pos.y <= y_pos + handleSize / 2) { return { index: i, handle: 'start' }; } if (pos.x >= load.endX - handleSize / 2 && pos.x <= load.endX + handleSize / 2 && pos.y >= y_pos - handleSize / 2 && pos.y <= y_pos + handleSize / 2) { return { index: i, handle: 'end' }; } } return null; }
function getDistLoadAtPos(pos) { if (!beam) return null; for (let i = distributedLoads.length - 1; i >= 0; i--) { const load = distributedLoads[i]; const gridSize = getGridSize(); const kNPerGrid = getKNPerGrid(); const pixelsPerKN = gridSize / kNPerGrid; const loadHeight = Math.abs(load.magnitude) * pixelsPerKN; const startX = Math.min(load.startX, load.endX); const endX = Math.max(load.startX, load.endX); const y_top = (beam.startY - 10) - loadHeight; const y_bottom = beam.startY - 10; if (pos.x >= startX && pos.x <= endX && pos.y >= y_top && pos.y <= y_bottom) { return i; } } return null; }
function getTrapLoadHandleAtPos(pos) { if (!beam) return null; const handleSize = isTouchDevice ? 24 : 10; const gridSize = getGridSize(); const kNPerGrid = getKNPerGrid(); const pixelsPerKN = gridSize / kNPerGrid; for (let i = trapezoidalLoads.length - 1; i >= 0; i--) { const load = trapezoidalLoads[i]; const h1 = Math.abs(load.startMagnitude) * pixelsPerKN; const h2 = Math.abs(load.endMagnitude) * pixelsPerKN; const y1_pos = (load.startMagnitude < 0) ? (beam.startY - 10) - h1 : (beam.startY - 10) + h1; const y2_pos = (load.endMagnitude < 0) ? (beam.startY - 10) - h2 : (beam.startY - 10) + h2; if (pos.x >= load.startX - handleSize / 2 && pos.x <= load.startX + handleSize / 2 && pos.y >= y1_pos - handleSize/2 && pos.y <= y1_pos + handleSize/2) { return { index: i, handle: 'start' }; } if (pos.x >= load.endX - handleSize / 2 && pos.x <= load.endX + handleSize / 2 && pos.y >= y2_pos - handleSize/2 && pos.y <= y2_pos + handleSize/2) { return { index: i, handle: 'end' }; } } return null; }
function getTrapLoadAtPos(pos) { if (!beam) return null; for (let i = trapezoidalLoads.length - 1; i >= 0; i--) { const load = trapezoidalLoads[i]; const startX = Math.min(load.startX, load.endX); const endX = Math.max(load.startX, load.endX); const y_bottom = beam.startY - 10; if (pos.x >= startX && pos.x <= endX && pos.y <= y_bottom) { return i; } } return null; }
function getConcentratedLoadAtPos(pos) { if (!beam) return null; for (let i = concentratedLoads.length - 1; i >= 0; i--) { const load = concentratedLoads[i]; const { startX, startY, endX, endY } = getConcentratedLoadArrow(load, getGridSize()); const padding = 10; const minX = Math.min(startX, endX) - padding; const maxX = Math.max(startX, endX) + padding; const minY = Math.min(startY, endY) - padding; const maxY = Math.max(startY, endY) + padding; if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) { return i; } } return null; }
function getConcentratedMomentAtPos(pos) { if (!beam) return null; for (let i = concentratedMoments.length - 1; i >= 0; i--) { const moment = concentratedMoments[i]; const radius = 20; const dist = Math.sqrt(Math.pow(pos.x - moment.x, 2) + Math.pow(pos.y - moment.y, 2)); if (dist <= radius + 5) { return i; } } return null; }
function getTorsionMomentAtPos(pos) { if (!beam) return null; for (let i = torsionMoments.length - 1; i >= 0; i--) { const moment = torsionMoments[i]; const halfWidth = 30; const halfHeight = 10; if (pos.x >= moment.x - halfWidth && pos.x <= moment.x + halfWidth && pos.y >= moment.y - halfHeight && pos.y <= moment.y + halfHeight) { return i; } } return null; }

function centerDrawing() {
    if (!beam) return;
    const gridSize = getGridSize();
    const drawingWidth = beam.endX - beam.startX;
    const drawingCenterX = beam.startX + drawingWidth / 2;
    const canvasCenterX = canvas.clientWidth / 2;
    const centeringDx = canvasCenterX - drawingCenterX;
    const snappedStartX = Math.round((beam.startX + centeringDx) / gridSize) * gridSize;
    const finalDx = snappedStartX - beam.startX;

    beam.startX += finalDx;
    beam.endX += finalDx;
    
    supports.forEach(s => { s.x += finalDx; });
    hinges.forEach(h => { h.x += finalDx; });
    concentratedLoads.forEach(l => { l.x += finalDx; });
    distributedLoads.forEach(l => { l.startX += finalDx; l.endX += finalDx; });
    trapezoidalLoads.forEach(l => { l.startX += finalDx; l.endX += finalDx; });
    concentratedMoments.forEach(m => { m.x += finalDx; });
    torsionMoments.forEach(t => { t.x += finalDx; });
    // Hesap sonuçları kaydırılmaz: ortalamadan sonra model yeniden hesaplanır (commitModelChange)
}
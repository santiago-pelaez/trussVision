// mobile/mobile-events.js

function initializeMobileEventListeners() {

// Ortak buton eylemleri, model yükleme/kaydetme ve ayar girdileri: actions.js

function handleTouchStart(e) {
    // --- DEĞİŞİKLİK: Kaydırmayı engellemek için hem <html> hem <body> hedefleniyor ---
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    e.preventDefault(); 
    
    const rawPos = getRawMousePos(e);
    const snappedPos = getSnappedMousePos(e);
    const draggableTools = ['beam', 'pin-support', 'roller-support', 'fixed-support', 'hinge'];
    const mobileDrawableLoads = ['concentrated-load', 'concentrated-moment', 'torsion-moment', 'distributed-load', 'triangular-load'];

    if (currentTool === 'edit') {
        activeHandle = getHandleAtPos(rawPos);
        draggedSupportIndex = getSupportAtPos(rawPos);
        draggedHingeIndex = getHingeAtPos(rawPos);
        const distLoadHandleData = getDistLoadHandleAtPos(rawPos);
        const trapLoadHandleData = getTrapLoadHandleAtPos(rawPos);
        draggedConcentratedLoadIndex = getConcentratedLoadAtPos(rawPos);
        clickedConcentratedLoadIndex = draggedConcentratedLoadIndex; 
        draggedDistLoadIndex = getDistLoadAtPos(rawPos);
        clickedDistLoadIndex = draggedDistLoadIndex;
        draggedTrapLoadIndex = getTrapLoadAtPos(rawPos);
        clickedTrapLoadIndex = draggedTrapLoadIndex;
        draggedConcentratedMomentIndex = getConcentratedMomentAtPos(rawPos);
        clickedConcentratedMomentIndex = draggedConcentratedMomentIndex;
        draggedTorsionMomentIndex = getTorsionMomentAtPos(rawPos);
        clickedTorsionMomentIndex = draggedTorsionMomentIndex;

        if (activeHandle) isResizing = true; 
        else if (distLoadHandleData) { isResizingDistLoad = true; resizedDistLoadIndex = distLoadHandleData.index; activeDistLoadHandle = distLoadHandleData.handle; } 
        else if (trapLoadHandleData) { isResizingTrapLoad = true; resizedTrapLoadIndex = trapLoadHandleData.index; activeTrapLoadHandle = trapLoadHandleData.handle; } 
        else if (draggedSupportIndex !== null) isDraggingSupport = true;
        else if (draggedHingeIndex !== null) isDraggingHinge = true;
        else if (draggedConcentratedLoadIndex !== null) isMovingConcentratedLoad = true;
        else if (draggedDistLoadIndex !== null) isMovingDistLoad = true;
        else if (draggedTrapLoadIndex !== null) isMovingTrapLoad = true;
        else if (draggedConcentratedMomentIndex !== null) isMovingConcentratedMoment = true;
        else if (draggedTorsionMomentIndex !== null) isMovingTorsionMoment = true;
    } 
    
    else if (mobileDrawableLoads.includes(currentTool)) {
        if (!beam || !isWithinBeamX(snappedPos.x)) return;
        if (currentTool === 'concentrated-load') {
            isDrawingConcentratedLoad = true;
            drawingStage = 1;
            concentratedLoadStartPoint = { x: snappedPos.x, y: beam.startY - (getGridSize() / 2) };
        } else if (currentTool === 'concentrated-moment' || currentTool === 'torsion-moment') {
            isDrawingConcentratedMoment = (currentTool === 'concentrated-moment');
            isDrawingTorsionMoment = (currentTool === 'torsion-moment');
            drawingStage = 1;
            momentStartPoint = { x: snappedPos.x, y: rawPos.y };
        } else if (currentTool === 'distributed-load') {
            isDrawing = true;
            drawingStage = 1;
            loadStartPoint = { x: snappedPos.x, y: rawPos.y };
        } else if (currentTool === 'triangular-load') {
            isDrawing = true;
            drawingStage = 1;
            loadStartPoint = { x: snappedPos.x, y: rawPos.y };
        }
    } else if (draggableTools.includes(currentTool)) {
        if (!beam && currentTool !== 'beam') return;
        isDrawing = true;
        const gridSize = getGridSize();
        const canvasCenterY = canvas.clientHeight / 2;
        const nearestGridY = Math.floor(canvasCenterY / gridSize) * gridSize;
        startPoint = { x: snappedPos.x, y: nearestGridY + gridSize / 2 };
    }
}

function handleTouchEnd(e) {
    // --- DEĞİŞİKLİK: Kilidi hem <html> hem <body> etiketinden kaldırıyoruz ---
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');

    const pos = getSnappedMousePos(e);
    const rawPos = getRawMousePos(e);

    if (currentTool === 'edit' && !hasDragged) openLoadDialogForClickedItem();

    if (isDrawingConcentratedLoad) {
        openNewConcentratedLoadDialog(concentratedLoadStartPoint, rawPos);
    } else if (isDrawingConcentratedMoment || isDrawingTorsionMoment) {
        const startPos = momentStartPoint;
        const endPos = rawPos;
        const dy = endPos.y - startPos.y;
        // Izgara ayarlarıyla tutarlı ölçek: 1 ızgara = kNPerGrid kNm
        const magnitude = -(dy / (getGridSize() / getKNPerGrid()));
        if (Math.abs(magnitude) > EPSILON) {
            const finalX = clampToBeam(pos.x); 

            if (isDrawingConcentratedMoment) { concentratedMoments.push({ x: finalX, y: beam.startY, magnitude: magnitude }); } 
            else { torsionMoments.push({ x: finalX, y: beam.startY, magnitude: magnitude }); }
        }
    } else if (isDrawing && currentTool === 'distributed-load') {
        const gridSize = getGridSize(), kNPerGrid = getKNPerGrid();
        const beamTopY = beam.startY - (gridSize / 2);
        const endVerticalDistance = rawPos.y - beamTopY;
        const endMag = (endVerticalDistance / gridSize) * kNPerGrid;
        openNewDistributedLoadDialog('distributedLoad', { startX: loadStartPoint.x, endX: pos.x, magnitude: endMag });
    } else if (isDrawing && currentTool === 'triangular-load') {
         if (drawingStage === 2) {
            const gridSize = getGridSize(), kNPerGrid = getKNPerGrid();
            const beamTopY = beam.startY - (gridSize / 2);
            const startMag = confirmedMagnitude1;
            const endMag = ((rawPos.y - beamTopY) / gridSize) * kNPerGrid;
            openNewDistributedLoadDialog('trapezoidalLoad', { startX: loadStartPoint.x, endX: pos.x, startMagnitude: startMag, endMagnitude: endMag });
        }
    } else if (isDrawing && currentTool === 'beam') {
        if (Math.abs(startPoint.x - pos.x) > 0) { 
            beam = { startX: Math.min(startPoint.x, pos.x), startY: startPoint.y, endX: Math.max(startPoint.x, pos.x), gridSizeOnCreation: getGridSize(), metersPerGridOnCreation: getMetersPerGrid() }; 
            beam.length = beam.endX - beam.startX; 
            selectTool('cursor');
        }
    } else if (isDrawing && ['pin-support', 'roller-support', 'fixed-support'].includes(currentTool)) {
        if (beam && isWithinBeamX(pos.x)) supports.push({ type: currentTool, x: pos.x });
    } else if (isDrawing && currentTool === 'hinge') {
        if (beam && isWithinBeamX(pos.x)) hinges.push({ x: pos.x });
    }
    
    isDrawing = false; isDrawingConcentratedLoad = false; isDrawingConcentratedMoment = false; isDrawingTorsionMoment = false;
    concentratedLoadStartPoint = null; momentStartPoint = null; drawingStage = 0; loadStartPoint = null; confirmedMagnitude1 = 0;
    
    isResizing = false; activeHandle = null; isDraggingSupport = false; draggedSupportIndex = null; isDraggingHinge = false; draggedHingeIndex = null;
    isMovingConcentratedLoad = false; draggedConcentratedLoadIndex = null; isMovingDistLoad = false; draggedDistLoadIndex = null; isMovingTrapLoad = false; draggedTrapLoadIndex = null;
    isResizingDistLoad = false; resizedDistLoadIndex = null; activeDistLoadHandle = null; isResizingTrapLoad = false; resizedTrapLoadIndex = null; activeTrapLoadHandle = null;
    isMovingConcentratedMoment = false; draggedConcentratedMomentIndex = null; isMovingTorsionMoment = false; draggedTorsionMomentIndex = null;
    hasDragged = false; clickedConcentratedLoadIndex = null; clickedDistLoadIndex = null; clickedTrapLoadIndex = null; clickedConcentratedMomentIndex = null; clickedTorsionMomentIndex = null;

    redrawCanvas(); updateAll();
}

function handleTouchMove(e) {
    e.preventDefault();
    
    const rawPos = getRawMousePos(e); 
    const snappedPos = getSnappedMousePos(e);
    currentMousePos = snappedPos; 
    currentRawMousePos = rawPos; 
    
    let needsLiveUpdate = false;
    if (isResizing) { hasDragged = true; const gridSize = getGridSize(); if (activeHandle === 'start') { beam.startX = Math.min(snappedPos.x, beam.endX - gridSize); } else { beam.endX = Math.max(snappedPos.x, beam.startX + gridSize); } beam.length = beam.endX - beam.startX; needsLiveUpdate = true; } 
    else if (isResizingDistLoad) { hasDragged = true; const load = distributedLoads[resizedDistLoadIndex]; if (activeDistLoadHandle === 'start') { load.startX = snappedPos.x; } else { load.endX = snappedPos.x; } needsLiveUpdate = true; } 
    else if (isResizingTrapLoad) { hasDragged = true; const load = trapezoidalLoads[resizedTrapLoadIndex]; if (activeDistLoadHandle === 'start') { load.startX = snappedPos.x; } else { load.endX = snappedPos.x; } needsLiveUpdate = true; } 
    else if (isDraggingSupport) { hasDragged = true; supports[draggedSupportIndex].x = snappedPos.x; needsLiveUpdate = true; } 
    else if (isDraggingHinge) { hasDragged = true; hinges[draggedHingeIndex].x = snappedPos.x; needsLiveUpdate = true; }
    else if (isMovingConcentratedLoad) { hasDragged = true; concentratedLoads[draggedConcentratedLoadIndex].x = snappedPos.x; needsLiveUpdate = true; }
    else if (isMovingDistLoad) { hasDragged = true; const load = distributedLoads[draggedDistLoadIndex]; const dx = snappedPos.x - (load.startX + (load.endX - load.startX) / 2); load.startX += dx; load.endX += dx; needsLiveUpdate = true; }
    else if (isMovingTrapLoad) { hasDragged = true; const load = trapezoidalLoads[draggedTrapLoadIndex]; const dx = snappedPos.x - (load.startX + (load.endX - load.startX) / 2); load.startX += dx; load.endX += dx; needsLiveUpdate = true; }
    else if (isMovingConcentratedMoment) { hasDragged = true; concentratedMoments[draggedConcentratedMomentIndex].x = snappedPos.x; needsLiveUpdate = true; }
    else if (isMovingTorsionMoment) { hasDragged = true; torsionMoments[draggedTorsionMomentIndex].x = snappedPos.x; needsLiveUpdate = true; }
    
    if (isResizing || isDraggingSupport || isDraggingHinge || isMovingConcentratedLoad || isResizingDistLoad || isResizingTrapLoad || isMovingDistLoad || isMovingTrapLoad || isMovingConcentratedMoment || isMovingTorsionMoment || isDrawing || isDrawingConcentratedLoad || isDrawingConcentratedMoment || isDrawingTorsionMoment) {
        hasDragged = true;
    }
    
    if (isDrawing && currentTool === 'triangular-load') {
        const gridSize = getGridSize();
        if (drawingStage === 1) {
            if (Math.abs(snappedPos.x - loadStartPoint.x) >= gridSize) {
                const beamTopY = beam.startY - (gridSize / 2);
                const kNPerGrid = getKNPerGrid();
                const startMag = ((rawPos.y - beamTopY) / gridSize) * kNPerGrid;
                confirmedMagnitude1 = startMag;
                drawingStage = 2;
            }
        }
    }

    redrawCanvas();
    if(hasDragged) updateTables();

    if (isDrawing && currentTool === 'beam') {
        drawDragPreview();
        const gridSize = getGridSize();
        const beamBottomLineY = Math.round((startPoint.y + gridSize / 2) / gridSize) * gridSize;
        const dimensionY = beamBottomLineY + (3 * gridSize);
        drawPreviewDimension(ctx, snappedPos.x, [startPoint.x], dimensionY);
    } else if (isDrawing && beam && ['pin-support', 'roller-support', 'fixed-support', 'hinge'].includes(currentTool)) {
        if (currentTool === 'hinge') { drawHinge(ctx, snappedPos.x, beam.startY, true); } 
        else { drawSupport(ctx, currentTool, snappedPos.x, beam.startY, true); }
        let allPoints = [beam.startX, beam.endX, ...supports.map(s => s.x), ...hinges.map(h => h.x)];
        const gridSize = getGridSize();
        const beamBottomLineY = Math.round((beam.startY + gridSize / 2) / gridSize) * gridSize;
        const dimensionY = beamBottomLineY + (3 * gridSize);
        drawPreviewDimension(ctx, snappedPos.x, allPoints, dimensionY);
    }

    if (needsLiveUpdate) clampModelToBeam();
    if (needsLiveUpdate && isSystemStable()) runAnalysis(true);
}

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

}
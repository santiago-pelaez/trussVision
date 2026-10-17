// desktop-events.js

function initializeDesktopEventListeners() {
    
    const dragOverlay = document.getElementById('drag-overlay');
    // Ortak buton eylemleri, model yükleme/kaydetme ve ayar girdileri: actions.js
    window.addEventListener('dragenter', (event) => { event.preventDefault(); dragOverlay.style.display = 'flex'; dragOverlay.classList.remove('hidden'); dragOverlay.classList.add('visible'); });
    window.addEventListener('dragover', (event) => { event.preventDefault(); });
    window.addEventListener('dragleave', (event) => { if (event.relatedTarget === null || event.relatedTarget === document.documentElement) { dragOverlay.classList.remove('visible'); } });
    window.addEventListener('drop', (event) => { event.preventDefault(); dragOverlay.classList.remove('visible'); if (event.dataTransfer.files && event.dataTransfer.files.length > 0) { const file = event.dataTransfer.files[0]; loadProjectFromFile(file); event.dataTransfer.clearData(); } });

    function handleMouseDown(e) {
        const rawPos = getRawMousePos(e);
        const snappedPos = getSnappedMousePos(e);

        if (currentTool === 'edit' && e.button === 1) { 
            e.preventDefault(); 
            let wasSomethingDeleted = false;
            if (getSupportAtPos(rawPos) !== null) { supports.splice(getSupportAtPos(rawPos), 1); wasSomethingDeleted = true; }
            else if (getHingeAtPos(rawPos) !== null) { hinges.splice(getHingeAtPos(rawPos), 1); wasSomethingDeleted = true; }
            else if (getConcentratedLoadAtPos(rawPos) !== null) { concentratedLoads.splice(getConcentratedLoadAtPos(rawPos), 1); wasSomethingDeleted = true; }
            else if (getDistLoadAtPos(rawPos) !== null) { distributedLoads.splice(getDistLoadAtPos(rawPos), 1); wasSomethingDeleted = true; }
            else if (getTrapLoadAtPos(rawPos) !== null) { trapezoidalLoads.splice(getTrapLoadAtPos(rawPos), 1); wasSomethingDeleted = true; }
            else if (getConcentratedMomentAtPos(rawPos) !== null) { concentratedMoments.splice(getConcentratedMomentAtPos(rawPos), 1); wasSomethingDeleted = true; }
            else if (getTorsionMomentAtPos(rawPos) !== null) { torsionMoments.splice(getTorsionMomentAtPos(rawPos), 1); wasSomethingDeleted = true; }
            if (wasSomethingDeleted) { redrawCanvas(); updateAll(); }
            return;
        }

        if (e.button === 0) {
            if (currentTool === 'edit') {
                activeHandle = getHandleAtPos(rawPos); draggedSupportIndex = getSupportAtPos(rawPos); draggedHingeIndex = getHingeAtPos(rawPos);
                const distLoadHandleData = getDistLoadHandleAtPos(rawPos); const trapLoadHandleData = getTrapLoadHandleAtPos(rawPos);
                draggedConcentratedLoadIndex = getConcentratedLoadAtPos(rawPos); clickedConcentratedLoadIndex = draggedConcentratedLoadIndex;
                draggedDistLoadIndex = getDistLoadAtPos(rawPos); clickedDistLoadIndex = draggedDistLoadIndex;
                draggedTrapLoadIndex = getTrapLoadAtPos(rawPos); clickedTrapLoadIndex = draggedTrapLoadIndex;
                draggedConcentratedMomentIndex = getConcentratedMomentAtPos(rawPos); clickedConcentratedMomentIndex = draggedConcentratedMomentIndex;
                draggedTorsionMomentIndex = getTorsionMomentAtPos(rawPos); clickedTorsionMomentIndex = draggedTorsionMomentIndex;
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
                if (isResizing || isDraggingSupport || isDraggingHinge || isMovingConcentratedLoad || isResizingDistLoad || isResizingTrapLoad || isMovingDistLoad || isMovingTrapLoad || isMovingConcentratedMoment || isMovingTorsionMoment) e.preventDefault();
            } 
            else if (['distributed-load', 'triangular-load'].includes(currentTool) && beam) {
                 if (drawingStage === 0 && !isWithinBeamX(snappedPos.x)) return;
                 if (drawingStage === 0) { 
                    isDrawing = true; drawingStage = 1; loadStartPoint = { x: snappedPos.x, y: rawPos.y };
                } else if (drawingStage === 1) {
                    const gridSize = getGridSize(), kNPerGrid = getKNPerGrid();
                    const beamTopY = beam.startY - (gridSize / 2); const verticalDistance = rawPos.y - beamTopY;
                    confirmedMagnitude1 = (verticalDistance / gridSize) * kNPerGrid; 
                    drawingStage = 2;
                } else if (drawingStage === 2) {
                    const finalEndX = clampToBeam(snappedPos.x);
                    if (currentTool === 'distributed-load') {
                        openNewDistributedLoadDialog('distributedLoad', {startX: loadStartPoint.x, endX: finalEndX, magnitude: confirmedMagnitude1});
                    } else {
                        const gridSize = getGridSize(), kNPerGrid = getKNPerGrid();
                        const beamTopY = beam.startY - (gridSize / 2);
                        const verticalDistance2 = rawPos.y - beamTopY;
                        const confirmedMagnitude2 = (verticalDistance2 / gridSize) * kNPerGrid;
                        openNewDistributedLoadDialog('trapezoidalLoad', {startX: loadStartPoint.x, endX: finalEndX, startMagnitude: confirmedMagnitude1, endMagnitude: confirmedMagnitude2});
                    }
                    isDrawing = false; drawingStage = 0; loadStartPoint = null; confirmedMagnitude1 = 0;
                    redrawCanvas(); updateAll();
                }
            } 
            else if (currentTool === 'beam') {
                isDrawing = true;
                const gridSize = getGridSize();
                const canvasCenterY = canvas.clientHeight / 2;
                const nearestGridY = Math.floor(canvasCenterY / gridSize) * gridSize;
                startPoint = { x: snappedPos.x, y: nearestGridY + gridSize / 2 };
            }
            else if (currentTool === 'concentrated-load' && beam) {
                if (!isDrawingConcentratedLoad && isWithinBeamX(snappedPos.x)) {
                    isDrawingConcentratedLoad = true; const gridSize = getGridSize(); const beamTopY = beam.startY - (gridSize / 2);
                    concentratedLoadStartPoint = { x: snappedPos.x, y: beamTopY };
                }
            } else if (beam && !isDrawing && isWithinBeamX(snappedPos.x)) {
                 if(['pin-support','roller-support','fixed-support'].includes(currentTool)) supports.push({type:currentTool, x:snappedPos.x});
                 else if(currentTool==='hinge') hinges.push({x:snappedPos.x});
                 else if (currentTool === 'concentrated-moment') { isDrawingConcentratedMoment = true; momentStartPoint = rawPos; }
                 else if (currentTool === 'torsion-moment') { isDrawingTorsionMoment = true; momentStartPoint = rawPos; }
                 redrawCanvas(); updateAll();
            }
        }
    }

    function handleMouseUp(e) {
        const snappedPos = getSnappedMousePos(e);
        const rawPos = getRawMousePos(e);

        if (isDrawingConcentratedLoad) {
            // Şiddet ve açı, yükün bütün bilgilerini içeren pencerede onaylanır
            openNewConcentratedLoadDialog(concentratedLoadStartPoint, rawPos);
        } else if (isDrawingConcentratedMoment || isDrawingTorsionMoment) {
            const startPos = momentStartPoint;
            const endPos = rawPos;
            const dy = endPos.y - startPos.y;
            // Izgara ayarlarıyla tutarlı ölçek: 1 ızgara = kNPerGrid kNm
            const magnitude = -(dy / (getGridSize() / getKNPerGrid()));
            if (Math.abs(magnitude) > EPSILON) {
                const finalX = clampToBeam(snappedPos.x);
                if (isDrawingConcentratedMoment) {
                    concentratedMoments.push({ x: finalX, y: beam.startY, magnitude: magnitude });
                } else {
                    torsionMoments.push({ x: finalX, y: beam.startY, magnitude: magnitude });
                }
            }
        }
        else if (isDrawing && currentTool === 'beam') {
            if (Math.abs(startPoint.x - snappedPos.x) > 0) { 
                beam = { 
                    startX: Math.min(startPoint.x, snappedPos.x), 
                    startY: startPoint.y, 
                    endX: Math.max(startPoint.x, snappedPos.x),
                    gridSizeOnCreation: getGridSize(),
                    metersPerGridOnCreation: getMetersPerGrid()
                }; 
                beam.length = beam.endX - beam.startX; 
                // Kiriş çizildi: yanlışlıkla ikinci bir kiriş çizilmesin diye imleç aracına geçilir
                selectTool('cursor');
            }
        }
        
        if (currentTool === 'edit' && !hasDragged) openLoadDialogForClickedItem();
        
        isDrawing = false; isDrawingConcentratedLoad = false; isDrawingConcentratedMoment = false; isDrawingTorsionMoment = false;
        momentStartPoint = null; concentratedLoadStartPoint = null;
        redrawCanvas(); updateAll();
        isResizing = false; activeHandle = null; isDraggingSupport = false; draggedSupportIndex = null; isDraggingHinge = false; draggedHingeIndex = null; isMovingConcentratedLoad = false; draggedConcentratedLoadIndex = null; isMovingDistLoad = false; draggedDistLoadIndex = null; isMovingTrapLoad = false; draggedTrapLoadIndex = null; isResizingDistLoad = false; resizedDistLoadIndex = null; activeDistLoadHandle = null; isResizingTrapLoad = false; resizedTrapLoadIndex = null; activeTrapLoadHandle = null; isMovingConcentratedMoment = false; draggedConcentratedMomentIndex = null; isMovingTorsionMoment = false; draggedTorsionMomentIndex = null;
        hasDragged = false; clickedConcentratedLoadIndex = null; clickedDistLoadIndex = null; clickedTrapLoadIndex = null; clickedConcentratedMomentIndex = null; clickedTorsionMomentIndex = null;
    }
    
    function handleMouseMove(e) {
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
        else if (currentTool === 'edit' && beam) { if (getHandleAtPos(rawPos) || getDistLoadHandleAtPos(rawPos) || getTrapLoadHandleAtPos(rawPos)) { canvas.style.cursor = 'ew-resize'; } else if (getSupportAtPos(rawPos) !== null || getHingeAtPos(rawPos) !== null || getConcentratedLoadAtPos(rawPos) !== null || getDistLoadAtPos(rawPos) !== null || getTrapLoadAtPos(rawPos) !== null || getConcentratedMomentAtPos(rawPos) !== null || getTorsionMomentAtPos(rawPos) !== null) { canvas.style.cursor = 'move'; } else { canvas.style.cursor = 'default'; } } else { canvas.style.cursor = currentTool === 'cursor' ? 'default' : 'crosshair'; }
        
        if (isDrawing || isResizing || isDraggingSupport || isDraggingHinge || isMovingConcentratedLoad || isResizingDistLoad || isResizingTrapLoad || isMovingDistLoad || isMovingTrapLoad || isMovingConcentratedMoment || isMovingTorsionMoment || isDrawingConcentratedLoad || isDrawingConcentratedMoment || isDrawingTorsionMoment) {
            hasDragged = true;
        }

        redrawCanvas();
        if(hasDragged) updateTables();
        if (isDrawing && currentTool === 'beam') {
            drawDragPreview();
            const gridSize = getGridSize();
            const beamBottomLineY = Math.round((startPoint.y + gridSize / 2) / gridSize) * gridSize;
            const dimensionY = beamBottomLineY + (3 * gridSize);
            drawPreviewDimension(ctx, snappedPos.x, [startPoint.x], dimensionY);
        }
        if (needsLiveUpdate) clampModelToBeam();
        if (needsLiveUpdate && isSystemStable()) runAnalysis(true);
    }

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);


    setupToolbarScroll();
}

function setupToolbarScroll() {
    const toolbarLeft = document.querySelector('.toolbar-left');
    const btnLeft = document.getElementById('toolbar-scroll-left');
    const btnRight = document.getElementById('toolbar-scroll-right');
    if (!toolbarLeft || !btnLeft || !btnRight) return;

    function updateArrows() {
        const sl = toolbarLeft.scrollLeft;
        const max = toolbarLeft.scrollWidth - toolbarLeft.clientWidth;
        btnLeft.classList.toggle('visible', sl > 2);
        btnRight.classList.toggle('visible', max > 2 && sl < max - 2);
    }

    btnLeft.addEventListener('click', () => {
        toolbarLeft.scrollTo({ left: 0, behavior: 'smooth' });
    });
    btnRight.addEventListener('click', () => {
        const max = toolbarLeft.scrollWidth - toolbarLeft.clientWidth;
        toolbarLeft.scrollTo({ left: max, behavior: 'smooth' });
    });
    toolbarLeft.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    window.updateToolbarScrollArrows = updateArrows;
    updateArrows();
}
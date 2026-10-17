// common/draw-utilities.js

function drawGrid(context, width, height) {
    const gridSize = getGridSize();
    context.beginPath();
    context.strokeStyle = COLORS.GRID;
    context.lineWidth = 0.5;

    for (let x = 0; x <= width; x += gridSize) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
    }

    for (let y = 0; y <= height; y += gridSize) {
        context.moveTo(0, y);
        context.lineTo(width, y);
    }

    context.stroke();
}

// YENİ: Kullanıcının ilk tıkladığı noktayı göstermek için bir işaretçi çizer.
function drawTapIndicator(context, point) {
    if (!point) return;
    context.save();
    context.fillStyle = 'rgba(0, 122, 255, 0.8)';
    context.strokeStyle = 'white';
    context.lineWidth = 1;
    const size = 10;
    context.beginPath();
    context.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
}

function drawResizeHandles(context) {
    if (!beam) return;
    const handleSize = 8;
    const gridSize = getGridSize();
    const kNPerGrid = getKNPerGrid();
    const pixelsPerKN = gridSize / kNPerGrid;
    const beamTopY = beam.startY - (gridSize / 2);

    context.fillStyle = 'rgba(0, 122, 255, 0.8)';
    context.strokeStyle = 'white';
    context.lineWidth = 1;

    context.fillRect(beam.startX - handleSize / 2, beam.startY - handleSize / 2, handleSize, handleSize);
    context.strokeRect(beam.startX - handleSize / 2, beam.startY - handleSize / 2, handleSize, handleSize);
    context.fillRect(beam.endX - handleSize / 2, beam.startY - handleSize / 2, handleSize, handleSize);
    context.strokeRect(beam.endX - handleSize / 2, beam.startY - handleSize / 2, handleSize, handleSize);

    distributedLoads.forEach(load => {
        const loadHeight = Math.abs(load.magnitude) * pixelsPerKN;
        const y_pos = (load.magnitude < 0) ? beamTopY - loadHeight : beamTopY + loadHeight;
        
        context.fillRect(load.startX - handleSize / 2, y_pos - handleSize / 2, handleSize, handleSize);
        context.strokeRect(load.startX - handleSize / 2, y_pos - handleSize / 2, handleSize, handleSize);
        context.fillRect(load.endX - handleSize / 2, y_pos - handleSize / 2, handleSize, handleSize);
        context.strokeRect(load.endX - handleSize / 2, y_pos - handleSize / 2, handleSize, handleSize);
    });

    trapezoidalLoads.forEach(load => {
        const h1 = Math.abs(load.startMagnitude) * pixelsPerKN;
        const h2 = Math.abs(load.endMagnitude) * pixelsPerKN;
        const y1_pos = (load.startMagnitude < 0) ? beamTopY - h1 : beamTopY + h1;
        const y2_pos = (load.endMagnitude < 0) ? beamTopY - h2 : beamTopY + h2;

        context.fillRect(load.startX - handleSize / 2, y1_pos - handleSize / 2, handleSize, handleSize);
        context.strokeRect(load.startX - handleSize / 2, y1_pos - handleSize / 2, handleSize, handleSize);
        context.fillRect(load.endX - handleSize / 2, y2_pos - handleSize / 2, handleSize, handleSize);
        context.strokeRect(load.endX - handleSize / 2, y2_pos - handleSize / 2, handleSize, handleSize);
    });
}
    
// Kesimin böldüğü parçanın ölçü etiketi aralığa sığmadığında kesim çizgisinin dışına
// oklu olarak yazılır. Bu etiket SCD'nin gri katmanından SONRA çizilmelidir; bu yüzden
// burada yalnızca kaydedilir ve cut-method.js/drawCutOverlayOnFbd tarafından çizilir.
let pendingCutDimLabels = [];

// cutX (isteğe bağlı, piksel): SCD'de kesim etkinken verilir. Kesimin düştüğü parça iki
// ölçüye bölünür ve "x − a" / "b − x" olarak yazılır; toplam boy çizgisi yerine kesim
// fonksiyonu (drawCutDistanceArrow) x ölçüsünü çizer.
function drawDimensions(context, y_pos, cutX = null) {
    if (!beam) return;
    const { toMeters } = getConversionFunctions();
    
    // --- YENİ KOD ---
    let points = [beam.startX, beam.endX];
    supports.forEach(s => points.push(s.x));
    hinges.forEach(h => points.push(h.x));
    concentratedLoads.forEach(l => points.push(l.x));
    distributedLoads.forEach(l => {
        points.push(l.startX);
        points.push(l.endX);
    });
    trapezoidalLoads.forEach(l => {
        points.push(l.startX);
        points.push(l.endX);
    });
    // EKLENEN SATIRLAR
    concentratedMoments.forEach(m => points.push(m.x)); 
    torsionMoments.forEach(t => points.push(t.x));
    // EKLENEN SATIRLARIN SONU

    const sortedPoints = [...new Set(points)].sort((a,b)=>a-b);
    context.save();
    context.strokeStyle=COLORS.DIMENSION;
    context.fillStyle=COLORS.DIMENSION;
    context.lineWidth=1;
    context.font='12px Arial';
    context.textAlign='center';
    context.textBaseline='top';
    
    // Parçalı Boyutları Çiz
    const hasCut = cutX !== null && cutX > beam.startX + 0.5 && cutX < beam.endX - 0.5;
    pendingCutDimLabels = [];
    const activePart = (typeof cutPart !== 'undefined' && cutPart === 'right') ? 'right' : 'left';
    const tick = (x) => { context.beginPath(); context.moveTo(x, y_pos - 10); context.lineTo(x, y_pos + 10); context.stroke(); };
    // overflow: kesimin böldüğü parçada etiket sığmazsa ne yapılacağı —
    //   null → yazılmaz; 'right' / 'left' → kesim çizgisinin o yanına oklu etiket (sonradan çizilir)
    const span = (p1, p2, label, onlyIfFits = false, overflow = null) => {
        tick(p1); tick(p2);
        context.beginPath(); context.moveTo(p1, y_pos); context.lineTo(p2, y_pos); context.stroke();
        if (!onlyIfFits || context.measureText(label).width + 6 <= Math.abs(p2 - p1)) context.fillText(label, (p1 + p2) / 2, y_pos + 5);
        else if (overflow) pendingCutDimLabels.push({ label, mid: (p1 + p2) / 2, cutX, y: y_pos, side: overflow, font: context.font });
    };
    const fmtM = (m) => (Math.abs(m) < 0.005 ? 0 : m).toFixed(2);
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1 = sortedPoints[i];
        const p2 = sortedPoints[i + 1];
        if (p2 - p1 < EPSILON) continue;
        if (hasCut && cutX > p1 + 0.5 && cutX < p2 - 0.5) {
            // Kesimin düştüğü parça: soldaki kısım x − a, sağdaki kısım b − x
            const a = toMeters(p1) - toMeters(beam.startX), b = toMeters(p2) - toMeters(beam.startX);
            // Etkin parçanın ölçüsü sığmazsa kesimin öbür yanına oklu yazılır; diğeri yazılmaz
            span(p1, cutX, Math.abs(a) < 0.005 ? 'x' : `x − ${fmtM(a)} m`, true, activePart === 'left' ? 'right' : null);
            span(cutX, p2, `${fmtM(b)} m − x`, true, activePart === 'right' ? 'left' : null);
            continue;
        }
        span(p1, p2, (toMeters(p2) - toMeters(p1)).toFixed(2) + " m");
    }

    // --- YENİ EKLENDİ: Toplam boyut çizgisini sadece gerekliyse çiz ---
    // Eğer parçalı boyut çizgisi birden fazla bölümden oluşuyorsa
    // (yani kiriş başlangıç ve bitişi dışında ara noktalar varsa),
    // o zaman toplam uzunluk çizgisini de çiz.
    if (sortedPoints.length > 2 && !hasCut) {
        const gridSize = getGridSize();
        const totalLengthY = y_pos + (2 * gridSize);
        const beamStart = beam.startX;
        const beamEnd = beam.endX;

        // Başlangıç ve bitiş için dikey uzatma çizgileri
        context.beginPath();
        context.moveTo(beamStart, y_pos + 10); 
        context.lineTo(beamStart, y_pos - 10);
        context.stroke();

        context.beginPath();
        context.moveTo(beamEnd, y_pos + 10);
        context.lineTo(beamEnd, y_pos - 10);
        context.stroke();
        
        const tickHeight = gridSize / 2;
        // Bu kısım artık gereksiz, çünkü yukarıdaki uzun çizgiler bu işi görüyor.
        // İsterseniz estetik olarak kalabilir veya silebilirsiniz. Şimdilik yorum satırı yapıyorum.
        
        context.beginPath();
        context.moveTo(beamStart, totalLengthY - tickHeight);
        context.lineTo(beamStart, totalLengthY + tickHeight);
        context.stroke();

        context.beginPath();
        context.moveTo(beamEnd, totalLengthY - tickHeight);
        context.lineTo(beamEnd, totalLengthY + tickHeight);
        context.stroke();
        
        // Toplam uzunluk için yatay çizgi
        context.beginPath();
        context.moveTo(beamStart, totalLengthY);
        context.lineTo(beamEnd, totalLengthY);
        context.stroke();

        // Toplam uzunluk metni
        const totalLengthInMeters = toMeters(beamEnd) - toMeters(beamStart);
        context.fillText(totalLengthInMeters.toFixed(2) + " m", (beamStart + beamEnd) / 2, totalLengthY + 5);
    }
    // --- YENİ KOŞUL BİTTİ ---

    context.restore();
}

function drawPreviewDimension(context, previewX_px, allPoints_px, y_pos) {
    const gridSize = getGridSize();
    const metersPerGrid = getMetersPerGrid();

    const pointsWithPreview = [...new Set([...allPoints_px, previewX_px])].sort((a, b) => a - b);
    const previewIndex = pointsWithPreview.indexOf(previewX_px);

    context.save();
    context.strokeStyle = COLORS.PREVIEW;
    context.fillStyle = COLORS.PREVIEW;
    context.lineWidth = 1;
    context.font = '12px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.setLineDash([2, 3]);

    const drawTick = (x) => {
        context.beginPath();
        context.moveTo(x, y_pos - 10);
        context.lineTo(x, y_pos + 10);
        context.stroke();
    };
    
    drawTick(previewX_px);

    const pixelsToMeters = (px) => (px / gridSize) * metersPerGrid;

    if (previewIndex > 0) {
        const prevPointX = pointsWithPreview[previewIndex - 1];
        drawTick(prevPointX);
        
        if (previewX_px - prevPointX > EPSILON) {
            context.beginPath();
            context.moveTo(prevPointX, y_pos);
            context.lineTo(previewX_px, y_pos);
            context.stroke();
            const lengthInMeters = pixelsToMeters(previewX_px - prevPointX);
            context.fillText(lengthInMeters.toFixed(2) + " m", (prevPointX + previewX_px) / 2, y_pos + 5);
        }
    }

    if (previewIndex < pointsWithPreview.length - 1) {
        const nextPointX = pointsWithPreview[previewIndex + 1];
        drawTick(nextPointX);
        
        if (nextPointX - previewX_px > EPSILON) {
            context.beginPath();
            context.moveTo(previewX_px, y_pos);
            context.lineTo(nextPointX, y_pos);
            context.stroke();
            const lengthInMeters = pixelsToMeters(nextPointX - previewX_px);
            context.fillText(lengthInMeters.toFixed(2) + " m", (previewX_px + nextPointX) / 2, y_pos + 5);
        }
    }
    
    context.restore();
}

// --- Serbest cisim diyagramı tepki okları (kalın gövde + dolu üçgen uç) ---
const FBD_ARROW = { shaftWidth: 5, headLength: 18, headHalfWidth: 8 };

function drawFilledArrow(context, x1, y1, x2, y2, color, style = FBD_ARROW) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len < 1e-6) return;
    const ux = dx / len, uy = dy / len;
    const hl = Math.min(style.headLength, len);
    const bx = x2 - ux * hl, by = y2 - uy * hl;
    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = style.shaftWidth;
    context.lineCap = 'butt';
    context.setLineDash([]);
    // Gövde uç tabanının biraz içine kadar uzar; birleşimde boşluk kalmaz
    context.beginPath(); context.moveTo(x1, y1); context.lineTo(bx + ux, by + uy); context.stroke();
    context.beginPath();
    context.moveTo(x2, y2);
    context.lineTo(bx - uy * style.headHalfWidth, by + ux * style.headHalfWidth);
    context.lineTo(bx + uy * style.headHalfWidth, by - ux * style.headHalfWidth);
    context.closePath();
    context.fill();
    context.restore();
}

// Yay biçimli tepki oku (moment). Açılar tuval açısıdır; anticlockwise, arc() ile aynı anlamdadır.
function drawFilledArcArrow(context, cx, cy, r, startAngle, endAngle, anticlockwise, color, style = FBD_ARROW) {
    const dir = anticlockwise ? -1 : 1;
    const baseAngle = endAngle - dir * (style.headLength / r);
    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = style.shaftWidth;
    context.lineCap = 'butt';
    context.setLineDash([]);
    context.beginPath();
    context.arc(cx, cy, r, startAngle, baseAngle + dir * (1 / r), anticlockwise);
    context.stroke();
    const tipX = cx + r * Math.cos(endAngle), tipY = cy + r * Math.sin(endAngle);
    const bx = cx + r * Math.cos(baseAngle), by = cy + r * Math.sin(baseAngle);
    const nx = Math.cos(baseAngle), ny = Math.sin(baseAngle); // Uç tabanında yarıçap doğrultusu
    context.beginPath();
    context.moveTo(tipX, tipY);
    context.lineTo(bx + nx * style.headHalfWidth, by + ny * style.headHalfWidth);
    context.lineTo(bx - nx * style.headHalfWidth, by - ny * style.headHalfWidth);
    context.closePath();
    context.fill();
    context.restore();
}

// Mesnet moment tepkisi: drawConcentratedMoment ile aynı dönme yönü (pozitif = ekranda
// saat yönü). Yay, düşey tepki okuyla çakışmaması için kiriş ucunun dış tarafına çizilir.
function drawReactionMoment(context, x, y, magnitude, color = COLORS.FBD_REACTION, name = null) {
    const radius = 26;
    const outsideLeft = !beam || x <= (beam.startX + beam.endX) / 2;
    const a = 0.35 * Math.PI; // Yayın yatay eksenden yukarı/aşağı açıklığı
    const c = outsideLeft ? Math.PI : 0; // Yayın ortası: sol uçta solda, sağ uçta sağda
    // Artan tuval açısı = ekranda saat yönü
    if (magnitude > 0) drawFilledArcArrow(context, x, y, radius, c - a, c + a, false, color);
    else drawFilledArcArrow(context, x, y, radius, c + a, c - a, true, color);
    context.save();
    context.fillStyle = color === COLORS.FBD_REACTION ? COLORS.FBD_REACTION_TEXT : color;
    context.font = 'bold 12px Arial';
    context.textBaseline = 'bottom';
    const label = (name ? `${name} = ` : '') + Math.abs(magnitude).toFixed(2) + ' kNm';
    if (typeof fillSubscriptText === 'function') fillSubscriptText(context, label, outsideLeft ? x - 10 : x + 10, y - radius - 4, outsideLeft ? 'right' : 'left');
    else { context.textAlign = outsideLeft ? 'right' : 'left'; context.fillText(label, outsideLeft ? x - 10 : x + 10, y - radius - 4); }
    context.restore();
}

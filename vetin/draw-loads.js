// common/draw-loads.js

const CONCENTRATED_LOAD_LENGTH = 50;

/**
 * Tekil yük okunun uç noktalarını verir. Ok her zaman kirişe dışarıdan "iter":
 * ucu kiriş yüzeyine değer, gövdesi kuvvetin geldiği tarafta kalır; böylece
 * hiçbir açıda kiriş gövdesini kesmez. Aşağı bileşenli kuvvet üst yüzeye,
 * yukarı bileşenli kuvvet alt yüzeye oturur.
 * @param {object} load - { x, y (kiriş üst yüzeyi), magnitude, angle (tuval açısı, rad) }
 * @param {number} beamHeight - Kiriş yüksekliği (px)
 */
function getConcentratedLoadArrow(load, beamHeight) {
    const { x, y, magnitude, angle = Math.PI / 2 } = load;
    const sign = (magnitude === undefined || magnitude === null || magnitude >= 0) ? 1 : -1;
    // Kuvvetin tuvaldeki yön birim vektörü (y aşağı pozitif)
    const fx = sign * Math.cos(angle);
    const fy = sign * Math.sin(angle);
    const endX = x;
    const endY = (fy < -1e-9) ? y + beamHeight : y;
    return {
        startX: endX - CONCENTRATED_LOAD_LENGTH * fx,
        startY: endY - CONCENTRATED_LOAD_LENGTH * fy,
        endX, endY,
        below: endY !== y
    };
}

function drawConcentratedLoad(context, load, isPreview = false) {
    if (isPreview && load.magnitude === undefined) {
        return;
    }

    context.save();
    context.strokeStyle = isPreview ? COLORS.PREVIEW : COLORS.LOAD;
    context.fillStyle = isPreview ? COLORS.PREVIEW : COLORS.LOAD;
    context.lineWidth = 2;

    const { startX, startY, endX, endY, below } = getConcentratedLoadArrow(load, getGridSize());

    // SCD tepkileriyle aynı stil: kalın gövde + dolu üçgen uç
    drawFilledArrow(context, startX, startY, endX, endY, isPreview ? COLORS.PREVIEW : COLORS.LOAD);

    if (!isPreview) {
        context.font = '12px Arial';
        const text = Math.abs(load.magnitude).toFixed(1) + " kN";
        if (below) {
            // Kirişin altındaki ok: etiket kuyruğun dış yanında; ölçü çizgisiyle ve okun gövdesiyle çakışmaz
            const leansLeft = startX < endX - 1;
            context.textAlign = leansLeft ? 'right' : 'left';
            context.textBaseline = 'middle';
            context.fillText(text, startX + (leansLeft ? -8 : 8), startY - 6);
        } else {
            context.textAlign = 'center';
            context.textBaseline = 'bottom';
            context.fillText(text, startX, startY - 5);
        }
    }
    
    context.restore();
}

function drawDistributedLoad(context, x1, x2, y, mag, isPreview = false) {
    // GÜNCELLENDİ: y_base, yük yönüne göre kirişin üst (aşağı yük) veya alt (yukarı yük) kenarına oturuyor.
    const gridSize = getGridSize();
    const y_base = (mag < 0) ? y - (gridSize / 2) : y + (gridSize / 2);

    const kNPerGrid = getKNPerGrid();
    const pixelsPerKN = gridSize / kNPerGrid;
    const loadHeight = Math.abs(mag) * pixelsPerKN;
    
    const y_top = (mag < 0) ? y_base - loadHeight : y_base + loadHeight;

    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    const loadLength = endX - startX;
    const desiredSpacing = 30;
    let totalArrows = Math.max(2, Math.floor(loadLength / desiredSpacing) + 1);
    if (loadLength < desiredSpacing) { totalArrows = 2; }
    const actualSpacing = loadLength > 0 ? loadLength / (totalArrows - 1) : 0;
    context.save();
    context.strokeStyle = isPreview ? COLORS.PREVIEW : COLORS.LOAD;
    context.fillStyle = isPreview ? COLORS.PREVIEW : COLORS.LOAD;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(startX, y_top);
    context.lineTo(endX, y_top);
    context.stroke();
    for (let i = 0; i < totalArrows; i++) {
        const x = startX + i * actualSpacing;
        context.beginPath();
        context.moveTo(x, y_top);
        context.lineTo(x, y_base);
        context.moveTo(x, y_base);
        if (mag < 0) {
            context.lineTo(x - 4, y_base - 8);
            context.moveTo(x, y_base);
            context.lineTo(x + 4, y_base - 8);
        } else {
            context.lineTo(x - 4, y_base + 8);
            context.moveTo(x, y_base);
            context.lineTo(x + 4, y_base + 8);
        }
        context.stroke();
    }

    context.textAlign = 'center';
    context.font = '12px Arial';
    context.fillText(Math.abs(mag).toFixed(2) + " kN/m", (startX + endX) / 2, mag < 0 ? y_top - 5 : y_top + 15);
    
    context.restore();
}

function drawTrapezoidalLoad(context, x1, x2, y, mag1, mag2, isPreview = false) {
    // GÜNCELLENDİ: y_base, yük yönüne göre kirişin üst (aşağı yük) veya alt (yukarı yük) kenarına oturuyor.
    const gridSize = getGridSize();
    const isUpward = (mag1 >= 0 && mag2 >= 0);
    const y_base = isUpward ? y + (gridSize / 2) : y - (gridSize / 2);
    
    const kNPerGrid = getKNPerGrid();

    const pixelsPerKN = gridSize / kNPerGrid;

    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    const loadLength = endX - startX;
    const desiredSpacing = 30;
    const totalArrows = Math.max(2, Math.floor(loadLength / desiredSpacing) + 1);
    const actualSpacing = loadLength > 0 ? loadLength / (totalArrows - 1) : 0;
    const h1 = Math.abs(mag1) * pixelsPerKN;
    const h2 = Math.abs(mag2) * pixelsPerKN;
    
    const y1_top = (mag1 < 0) ? y_base - h1 : y_base + h1;
    const y2_top = (mag2 < 0) ? y_base - h2 : y_base + h2;

    context.save();
    context.strokeStyle = isPreview ? COLORS.PREVIEW : COLORS.LOAD;
    context.fillStyle = isPreview ? COLORS.PREVIEW : COLORS.LOAD;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(startX, y1_top);
    context.lineTo(endX, y2_top);
    context.stroke();
    for (let i = 0; i < totalArrows; i++) {
        const x = startX + i * actualSpacing;
        const ratio = loadLength > 0 ? (x - startX) / loadLength : 0;
        const currentH = h1 + (h2 - h1) * ratio;
        const currentMag = mag1 + (mag2 - mag1) * ratio;
        const y_top_current = (currentMag < 0) ? y_base - currentH : y_base + currentH;

        context.beginPath();
        context.moveTo(x, y_top_current);
        context.lineTo(x, y_base);
        context.moveTo(x, y_base);
        if (currentMag < 0) {
            context.lineTo(x - 4, y_base - 8);
            context.moveTo(x, y_base);
            context.lineTo(x + 4, y_base - 8);
        } else {
            context.lineTo(x - 4, y_base + 8);
            context.moveTo(x, y_base);
            context.lineTo(x + 4, y_base + 8);
        }
        context.stroke();
    }

    context.font = '12px Arial';
    context.textAlign = 'center';
    context.fillText(Math.abs(mag1).toFixed(2) + " kN/m", startX, mag1 < 0 ? y1_top - 5 : y1_top + 15);
    context.fillText(Math.abs(mag2).toFixed(2) + " kN/m", endX, mag2 < 0 ? y2_top - 5 : y2_top + 15);
    
    context.restore();
}

function drawConcentratedMoment(context, moment, color = COLORS.LOAD, isPreview = false) {
    const { x, y, magnitude } = moment;
    const radius = 22;
    const isClockwise = magnitude < 0;

    context.save();
    context.strokeStyle = isPreview ? COLORS.PREVIEW : color;
    context.fillStyle = isPreview ? COLORS.PREVIEW : color;
    context.lineWidth = 2;
    context.font = '12px Arial';
    context.textAlign = 'center';

    // SCD tepkileriyle aynı stil: kalın yay + dolu üçgen uç (yay geometrisi ve yön değişmedi)
    const arcColor = isPreview ? COLORS.PREVIEW : color;
    if (isClockwise) {
        drawFilledArcArrow(context, x, y, radius, Math.PI * -0.4, Math.PI * -1.4, true, arcColor);
    } else {
        drawFilledArcArrow(context, x, y, radius, Math.PI * 0.4, Math.PI * 1.4, false, arcColor);
    }
    
    context.fillText(Math.abs(magnitude).toFixed(2) + " kNm", x, y - radius - 5);
    context.beginPath();
    context.arc(x, y, 4, 0, 2 * Math.PI);
    context.fillStyle = 'white';
    context.fill();
    context.strokeStyle = isPreview ? COLORS.PREVIEW : color;
    context.stroke();
    
    context.restore();
}

function drawTorsionMoment(context, moment, color = COLORS.LOAD, isPreview = false) {
    const { x, y, magnitude } = moment;
    const isPositive = magnitude > 0;
    const lineLength = 60; 

    context.save();
    context.strokeStyle = isPreview ? COLORS.PREVIEW : color;
    context.fillStyle = isPreview ? COLORS.PREVIEW : color;
    context.lineWidth = 2;
    context.font = '12px Arial';
    
    context.beginPath();
    let startX, endX;
    if (isPositive) {
        startX = x;
        endX = x + lineLength;
        context.moveTo(startX, y);
        context.lineTo(endX, y);
        context.stroke();
        
        context.moveTo(endX, y); context.lineTo(endX - 10, y - 5);
        context.moveTo(endX, y); context.lineTo(endX - 10, y + 5);
        context.moveTo(endX - 5, y); context.lineTo(endX - 15, y - 5);
        context.moveTo(endX - 5, y); context.lineTo(endX - 15, y + 5);
        context.textAlign = 'left';
        context.fillText(Math.abs(magnitude).toFixed(2) + " kNm", endX + 5, y);
    } else {
        startX = x;
        endX = x - lineLength;
        context.moveTo(startX, y);
        context.lineTo(endX, y);
        context.stroke();

        context.moveTo(endX, y); context.lineTo(endX + 10, y - 5);
        context.moveTo(endX, y); context.lineTo(endX + 10, y + 5);
        context.moveTo(endX + 5, y); context.lineTo(endX + 15, y - 5);
        context.moveTo(endX + 5, y); context.lineTo(endX + 15, y + 5);
        context.textAlign = 'right';
        context.fillText(Math.abs(magnitude).toFixed(2) + " kNm", endX - 5, y);
    }
    context.stroke();

    context.beginPath();
    context.arc(x, y, 4, 0, 2 * Math.PI);
    context.fillStyle = 'white';
    context.fill();
    context.strokeStyle = isPreview ? COLORS.PREVIEW : color;
    context.stroke();
    
    context.restore();
}
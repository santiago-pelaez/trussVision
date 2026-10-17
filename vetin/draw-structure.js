// common/draw-structure.js

function drawBeam(context, x1, y1, x2, y2) {
    // Kirişin yüksekliğini (h) doğrudan ızgara boyutu input'undan al.
    const h = getGridSize();
    
    context.save();
    context.fillStyle = COLORS.BEAM_FILL;
    context.strokeStyle = COLORS.BEAM_STROKE;
    context.lineWidth = 2;
    context.beginPath();
    // Çizim, 'y1' (kirişin merkez çizgisi) etrafında 'h' kadar olacak şekilde yapılır.
    context.rect(x1, y1 - h / 2, x2 - x1, h);
    context.fill();
    context.stroke();
    context.restore();
}

function drawHinge(context, x, y) {
    context.save();
    context.beginPath();
    context.arc(x, y, 6, 0, 2 * Math.PI);
    context.fillStyle = 'white';
    context.fill();
    context.strokeStyle = COLORS.SUPPORT;
    context.lineWidth = 2;
    context.stroke();
    context.restore();
}

function drawSupport(context, type, x, y, isPreview = false) {
    const h = 20;
    const supportHeight = h * 3;
    const beamCenterY = y;

    context.save();
    context.strokeStyle = isPreview ? COLORS.PREVIEW : COLORS.SUPPORT;
    context.fillStyle = isPreview ? COLORS.PREVIEW : COLORS.SUPPORT;
    context.lineWidth = 2;

    if (type === 'pin-support') {
        const y_bottom = beamCenterY + h / 2;
        context.beginPath();
        context.moveTo(x, y_bottom);
        context.lineTo(x - 15, y_bottom + 15);
        context.lineTo(x + 15, y_bottom + 15);
        context.closePath();
        context.stroke();

        for (let i = -15; i <= 15; i += 6) {
            context.beginPath();
            context.moveTo(i + x - 3, y_bottom + 20);
            context.lineTo(i + x + 3, y_bottom + 15);
            context.stroke();
        }
    } else if (type === 'roller-support') {
        const y_bottom = beamCenterY + h / 2;
        context.beginPath();
        context.moveTo(x, y_bottom);
        context.lineTo(x - 15, y_bottom + 15);
        context.lineTo(x + 15, y_bottom + 15);
        context.closePath();
        context.stroke();

        for (let i = -12; i <= 12; i += 6) {
            context.beginPath();
            context.arc(x + i, y_bottom + 20, 3, 0, 2 * Math.PI);
            context.stroke();
        }
    } else if (type === 'fixed-support') {
        const topY = beamCenterY - supportHeight / 2;
        const bottomY = beamCenterY + supportHeight / 2;

        // Düşey çizgiyi çiz
        context.beginPath();
        context.moveTo(x, topY);
        context.lineTo(x, bottomY);
        context.stroke();

        // DÜZELTME: Ankastre mesnetin konumuna göre çizgi yönünü belirle
        let lineDirection = -10; // Varsayılan: Sola doğru
        if (beam) {
            // Eğer mesnetin konumu, kirişin orta noktasından daha sağdaysa,
            // çizgileri sağa doğru çiz.
            const beamMidpoint = beam.startX + (beam.endX - beam.startX) / 2;
            if (x > beamMidpoint) {
                lineDirection = 10; // Sağa doğru
            }
        }

        // Çapraz çizgileri belirlenen yöne doğru çiz
        for (let i = topY; i <= bottomY; i += 8) {
            context.beginPath();
            context.moveTo(x, i);
            context.lineTo(x + lineDirection, i + 10);
            context.stroke();
        }
    }
    context.restore();
}
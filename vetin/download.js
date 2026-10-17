// common/download.js

// === GÜNCELLENMİŞ GENEL YARDIMCI: "Farklı Kaydet" Penceresi Kullanır ===

/**
 * Kullanıcıya "Farklı Kaydet" penceresi göstererek içerik indirmeyi tetikler.
 * Modern tarayıcılarda çalışır.
 * @param {string} content - Dosyanın içeriği.
 * @param {string} filename - Varsayılan dosya adı.
 * @param {string} mimeType - Dosyanın MIME türü.
 * @param {string} extension - Dosya uzantısı (örn: '.svg', '.json').
 */
async function triggerDownload(content, filename, mimeType, extension) {
    // 1. Modern File System Access API'sini dene
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'Dosya',
                    accept: { [mimeType]: [extension] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            return;
        } catch (err) {
            // Kullanıcı "İptal" butonuna basarsa hata oluşur, bunu yoksay.
            if (err.name !== 'AbortError') {
                console.error(err.name, err.message);
            }
            return;
        }
    }

    // 2. Eski (Fallback) Yöntem: API desteklenmiyorsa veya hata verirse
    // Bu yöntem dosyayı direkt "İndirilenler" klasörüne kaydeder.
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// === PNG TABANLI İNDİRME FONKSİYONU (DİYAGRAMLAR İÇİN) ===

async function downloadCanvasAsPngInSvg(canvasElement, filename) {
    if (!canvasElement) {
        console.error("İndirilecek canvas elementi bulunamadı:", filename);
        return;
    }
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const scaleFactor = 2;
    tempCanvas.width = canvasElement.clientWidth * scaleFactor;
    tempCanvas.height = canvasElement.clientHeight * scaleFactor;
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvasElement, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Modern API için Blob oluştur
    tempCanvas.toBlob(async (blob) => {
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'PNG Dosyası',
                        accept: { 'image/png': ['.png'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } catch (err) {
                if (err.name !== 'AbortError') console.error(err.name, err.message);
            }
        } else {
            // Fallback: Eski yöntemle indir
            const dataUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(dataUrl);
        }
    }, 'image/png');
}


// === GERÇEK VEKTÖREL SVG OLUŞTURMA FONKSİYONLARI ===
// Bu yardımcı fonksiyonlarda değişiklik yok.
const drawBeamSVG = (beam, yPos) => `<rect x="${beam.startX}" y="${yPos - 10}" width="${beam.endX - beam.startX}" height="20" fill="${COLORS.BEAM_FILL}" stroke="${COLORS.BEAM_STROKE}" stroke-width="2" />`;
const drawHingeSVG = (hinge, yPos) => `<circle cx="${hinge.x}" cy="${yPos}" r="6" fill="white" stroke="${COLORS.SUPPORT}" stroke-width="2" />`;

const drawSupportSVG = (support, yPos) => {
    const { type, x } = support;
    const h = 20;
    const y_bottom = yPos + h / 2;
    let paths = '';
    if (type === 'pin-support') {
        paths = `<path d="M ${x} ${y_bottom} L ${x - 15} ${y_bottom + 15} L ${x + 15} ${y_bottom + 15} Z" />`;
        for (let i = -15; i <= 15; i += 6) { paths += `<path d="M ${i + x - 3} ${y_bottom + 20} L ${i + x + 3} ${y_bottom + 15}" />`; }
    } else if (type === 'roller-support') {
        paths = `<path d="M ${x} ${y_bottom} L ${x - 15} ${y_bottom + 15} L ${x + 15} ${y_bottom + 15} Z" />`;
        for (let i = -12; i <= 12; i += 6) { paths += `<circle cx="${x + i}" cy="${y_bottom + 20}" r="3" stroke="${COLORS.SUPPORT}" fill="none" stroke-width="2" />`; }
    } else if (type === 'fixed-support') {
        const supportHeight = h * 3, topY = yPos - supportHeight / 2, bottomY = yPos + supportHeight / 2;
        let lineDirection = (beam && x > beam.startX + (beam.endX - beam.startX) / 2) ? 10 : -10;
        paths = `<path d="M ${x} ${topY} L ${x} ${bottomY}" />`;
        for (let i = topY; i <= bottomY; i += 8) { paths += `<path d="M ${x} ${i} L ${x + lineDirection} ${i + 10}" />`; }
    }
    return `<g stroke="${COLORS.SUPPORT}" fill="none" stroke-width="2">${paths}</g>`;
};
const drawConcentratedLoadSVG = (load) => {
    const { startX, startY, endX, endY, below } = getConcentratedLoadArrow(load, getGridSize());
    const label = `${Math.abs(load.magnitude).toFixed(1)} kN`;
    const leansLeft = startX < endX - 1;
    const text = below
        ? `<text x="${startX + (leansLeft ? -8 : 8)}" y="${startY - 6}" text-anchor="${leansLeft ? 'end' : 'start'}" dominant-baseline="middle" font-family="Arial" font-size="12px" fill="${COLORS.LOAD}">${label}</text>`
        : `<text x="${startX}" y="${startY - 5}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${COLORS.LOAD}">${label}</text>`;
    return filledArrowSVG(startX, startY, endX, endY, COLORS.LOAD) + text;
};
const drawDistributedLoadSVG = (load, yPos) => {
    const y_base = (load.magnitude < 0) ? yPos - 10 : yPos + 10;
    const pixelsPerKN = 10;
    const loadHeight = Math.abs(load.magnitude) * pixelsPerKN;
    const y_top = (load.magnitude < 0) ? y_base - loadHeight : y_base + loadHeight;
    const startX = Math.min(load.startX, load.endX), endX = Math.max(load.startX, load.endX);
    const loadLength = endX - startX;
    const totalArrows = Math.max(2, Math.floor(loadLength / 30) + 1);
    const actualSpacing = loadLength > 0 ? loadLength / (totalArrows - 1) : 0;
    let arrows = '';
    for (let i = 0; i < totalArrows; i++) {
        const x = startX + i * actualSpacing;
        const arrowTip = (load.magnitude < 0) ? `L ${x-4} ${y_base-8} M ${x} ${y_base} L ${x+4} ${y_base-8}` : `L ${x-4} ${y_base+8} M ${x} ${y_base} L ${x+4} ${y_base+8}`;
        arrows += `<path d="M ${x} ${y_top} L ${x} ${y_base} ${arrowTip}" />`;
    }
    const top_line = `<path d="M ${startX} ${y_top} L ${endX} ${y_top}" />`;
    const text_y = (load.magnitude < 0) ? y_top - 5 : y_top + 15;
    const text = `<text x="${(startX + endX) / 2}" y="${text_y}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${COLORS.LOAD}">${Math.abs(load.magnitude).toFixed(2)} kN/m</text>`;
    return `<g stroke="${COLORS.LOAD}" fill="none" stroke-width="2">${top_line}${arrows}</g>${text}`;
};
// Yay biçimli dolu uçlu ok (tuvaldeki drawFilledArcArrow ile aynı geometri)
const filledArcArrowSVG = (cx, cy, r, startAngle, endAngle, anticlockwise, color) => {
    const dir = anticlockwise ? -1 : 1, hw = FBD_ARROW.headHalfWidth;
    const baseAngle = endAngle - dir * (FBD_ARROW.headLength / r);
    const shaftEnd = baseAngle + dir * (1 / r);
    const pt = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [sx, sy] = pt(startAngle), [ex, ey] = pt(shaftEnd), [tx, ty] = pt(endAngle), [bx, by] = pt(baseAngle);
    const nx = Math.cos(baseAngle), ny = Math.sin(baseAngle);
    const largeArc = Math.abs(shaftEnd - startAngle) > Math.PI ? 1 : 0;
    const sweepFlag = anticlockwise ? 0 : 1; // SVG'de (y aşağı) 1 = artan açı yönü
    return `<path d="M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}" stroke="${color}" stroke-width="${FBD_ARROW.shaftWidth}" fill="none" />` +
        `<path d="M ${tx} ${ty} L ${bx + nx * hw} ${by + ny * hw} L ${bx - nx * hw} ${by - ny * hw} Z" fill="${color}" stroke="none" />`;
};
const drawConcentratedMomentSVG = (moment, color = COLORS.LOAD) => {
    const { x, y, magnitude } = moment;
    const radius = 22, isClockwise = magnitude < 0;
    const arc = isClockwise
        ? filledArcArrowSVG(x, y, radius, -0.4 * Math.PI, -1.4 * Math.PI, true, color)
        : filledArcArrowSVG(x, y, radius, 0.4 * Math.PI, 1.4 * Math.PI, false, color);
    const text = `<text x="${x}" y="${y - radius - 5}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${color}">${Math.abs(magnitude).toFixed(2)} kNm</text>`;
    const centerDot = `<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="${color}" stroke-width="2" />`;
    return `${arc}${text}${centerDot}`;
};
const drawTrapezoidalLoadSVG = (load, yPos) => {
    const y_base = (load.startMagnitude >= 0 && load.endMagnitude >= 0) ? yPos + 10 : yPos - 10;
    const pixelsPerKN = 10;
    const startX = Math.min(load.startX, load.endX), endX = Math.max(load.startX, load.endX);
    const h1 = Math.abs(load.startMagnitude) * pixelsPerKN, h2 = Math.abs(load.endMagnitude) * pixelsPerKN;
    const y1_top = (load.startMagnitude < 0) ? y_base - h1 : y_base + h1;
    const y2_top = (load.endMagnitude < 0) ? y_base - h2 : y_base + h2;
    const top_line = `<path d="M ${startX} ${y1_top} L ${endX} ${y2_top}" />`;
    let arrows = '';
    const loadLength = endX - startX, totalArrows = Math.max(2, Math.floor(loadLength / 30) + 1);
    const actualSpacing = loadLength > 0 ? loadLength / (totalArrows - 1) : 0;
    for (let i = 0; i < totalArrows; i++) {
        const x = startX + i * actualSpacing;
        const ratio = loadLength > 0 ? (x - startX) / loadLength : 0;
        const currentH = h1 + (h2 - h1) * ratio;
        const currentMag = load.startMagnitude + (load.endMagnitude - load.startMagnitude) * ratio;
        const y_top_current = (currentMag < 0) ? y_base - currentH : y_base + currentH;
        const arrowTip = (currentMag < 0) ? `L ${x-4} ${y_base-8} M ${x} ${y_base} L ${x+4} ${y_base-8}` : `L ${x-4} ${y_base+8} M ${x} ${y_base} L ${x+4} ${y_base+8}`;
        arrows += `<path d="M ${x} ${y_top_current} L ${x} ${y_base} ${arrowTip}" />`;
    }
    const text1 = `<text x="${startX}" y="${(load.startMagnitude < 0) ? y1_top - 5 : y1_top + 15}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${COLORS.LOAD}">${Math.abs(load.startMagnitude).toFixed(2)} kN/m</text>`;
    const text2 = `<text x="${endX}" y="${(load.endMagnitude < 0) ? y2_top - 5 : y2_top + 15}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${COLORS.LOAD}">${Math.abs(load.endMagnitude).toFixed(2)} kN/m</text>`;
    return `<g stroke="${COLORS.LOAD}" fill="none" stroke-width="2">${top_line}${arrows}</g>${text1}${text2}`;
};
const drawTorsionMomentSVG = (moment) => {
    const { x, y, magnitude } = moment;
    const isPositive = magnitude > 0;
    const lineLength = 60, color = COLORS.LOAD;
    let line, arrowhead, text;
    if (isPositive) {
        line = `<path d="M ${x} ${y} L ${x + lineLength} ${y}" />`;
        arrowhead = `<g transform="translate(${x + lineLength}, ${y})"><path d="M 0 0 L -10 -5 M 0 0 L -10 5" /><path d="M -5 0 L -15 -5 M -5 0 L -15 5" /></g>`;
        text = `<text x="${x + lineLength + 5}" y="${y}" alignment-baseline="middle" font-family="Arial" font-size="12px" fill="${color}">${Math.abs(magnitude)} kNm</text>`;
    } else {
        line = `<path d="M ${x} ${y} L ${x - lineLength} ${y}" />`;
        arrowhead = `<g transform="translate(${x - lineLength}, ${y})"><path d="M 0 0 L 10 -5 M 0 0 L 10 5" /><path d="M 5 0 L 15 -5 M 5 0 L 15 5" /></g>`;
        text = `<text x="${x - lineLength - 5}" y="${y}" text-anchor="end" alignment-baseline="middle" font-family="Arial" font-size="12px" fill="${color}">${Math.abs(magnitude)} kNm</text>`;
    }
    const centerDot = `<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="${color}" stroke-width="2" />`;
    return `<g stroke="${color}" fill="none" stroke-width="2">${line}${arrowhead}</g>${text}${centerDot}`;
};
// SCD tepkileri: kalın gövde + dolu üçgen uç (tuvaldeki FBD_ARROW stiliyle aynı)
const filledArrowSVG = (x1, y1, x2, y2, color) => {
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 1e-6) return '';
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len, hl = Math.min(FBD_ARROW.headLength, len), hw = FBD_ARROW.headHalfWidth;
    const bx = x2 - ux * hl, by = y2 - uy * hl;
    return `<path d="M ${x1} ${y1} L ${bx + ux} ${by + uy}" stroke="${color}" stroke-width="${FBD_ARROW.shaftWidth}" fill="none" />` +
        `<path d="M ${x2} ${y2} L ${bx - uy * hw} ${by + ux * hw} L ${bx + uy * hw} ${by - ux * hw} Z" fill="${color}" stroke="none" />`;
};
const drawReactionArrowSVG = (reaction, yPos) => {
    const { x, magnitude } = reaction;
    if (Math.abs(magnitude) < EPSILON) return '';
    const L = 48, beamBottom = yPos + 10, color = COLORS.FBD_REACTION;
    const isUp = magnitude > 0;
    const startY = isUp ? beamBottom + L : beamBottom, targetY = isUp ? beamBottom : beamBottom + L;
    const text = `<text x="${x}" y="${beamBottom + L + 16}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${color}">${Math.abs(magnitude).toFixed(2)} kN</text>`;
    return filledArrowSVG(x, startY, x, targetY, color) + text;
};
const drawAxialReactionSVG = (reaction, yPos) => {
    const { x, magnitude } = reaction;
    if (Math.abs(magnitude) < EPSILON) return '';
    const L = 44, T = 5, color = COLORS.FBD_REACTION;
    const isRight = magnitude > 0;
    const textAnchor = isRight ? 'start' : 'end';
    const textX = isRight ? x + T : x - T;
    const text = `<text x="${textX}" y="${yPos - 14}" text-anchor="${textAnchor}" alignment-baseline="middle" font-family="Arial" font-size="12px" fill="${color}">${Math.abs(magnitude).toFixed(2)} kN</text>`;
    return filledArrowSVG(isRight ? x - L : x + L, yPos, x, yPos, color) + text;
};
const drawDimensionsSVG = (y_pos) => {
    if (!beam) return '';
    const { toMeters } = getConversionFunctions();
    let points = [
        beam.startX, beam.endX, 
        ...supports.map(s => s.x), 
        ...hinges.map(h => h.x), 
        ...concentratedLoads.map(l => l.x), 
        ...distributedLoads.flatMap(l => [l.startX, l.endX]), 
        ...trapezoidalLoads.flatMap(l => [l.startX, l.endX]),
        // EKLENEN SATIRLAR
        ...concentratedMoments.map(m => m.x),
        ...torsionMoments.map(t => t.x)
        // EKLENEN SATIRLARIN SONU
    ];
    const sortedPoints = [...new Set(points)].sort((a,b)=>a-b);
    let pathElements = '';
    let textElements = '';
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1=sortedPoints[i], p2=sortedPoints[i+1];
        if(p2-p1 < EPSILON) continue;
        pathElements += `<path d="M ${p1} ${y_pos-10} L ${p1} ${y_pos+10}" /><path d="M ${p2} ${y_pos-10} L ${p2} ${y_pos+10}" /><path d="M ${p1} ${y_pos} L ${p2} ${y_pos}" />`;
        const lengthInMeters = toMeters(p2) - toMeters(p1);
        textElements += `<text x="${(p1+p2)/2}" y="${y_pos+15}" text-anchor="middle" font-family="Arial" font-size="12px" fill="#000000">${lengthInMeters.toFixed(2)} m</text>`;
    }
    return `<g stroke="#000000" stroke-width="1">${pathElements}</g>${textElements}`;
};


function downloadDrawingAsTrueSvg(target, filename) {
    const canvasElement = (target === 'model') ? canvas : fbdCanvas;
    if (!canvasElement || !beam) return;
    const width = canvasElement.clientWidth, height = canvasElement.clientHeight;
    let svgElements = '';
    const yPos = (target === 'model') ? beam.startY : (height / 2 + 20);

    svgElements += drawBeamSVG(beam, yPos);
    if (target === 'model') { supports.forEach(s => svgElements += drawSupportSVG(s, yPos)); }
    hinges.forEach(h => svgElements += drawHingeSVG(h, yPos));
    // SCD indirilirken ekrandaki Kuvvetler / Mesnet Tepkileri seçimine uyulur
    const showLoads = target !== 'fbd' || fbdDisplayOptions.loads;
    const showReactions = target === 'fbd' && fbdDisplayOptions.reactions;
    if (showLoads) {
        concentratedLoads.forEach(l => svgElements += drawConcentratedLoadSVG(l));
        distributedLoads.forEach(l => svgElements += drawDistributedLoadSVG(l, yPos));
        trapezoidalLoads.forEach(l => svgElements += drawTrapezoidalLoadSVG(l, yPos));
        concentratedMoments.forEach(m => svgElements += drawConcentratedMomentSVG(m));
        torsionMoments.forEach(t => svgElements += drawTorsionMomentSVG(t));
    }
    if (showReactions && calculatedReactions) {
        calculatedReactions.forEach(r => svgElements += drawReactionArrowSVG(r, yPos));
        // Ankastre moment tepkileri (çözücüde + saat yönünün tersi; SVG çizimi + saat yönü → işaret çevrilir)
        const momentReactions = (lastAnalysis && lastAnalysis.solution && lastAnalysis.solution.momentReactions) || [];
        momentReactions.forEach(mr => {
            if (Math.abs(mr.magnitude) > EPSILON) svgElements += drawConcentratedMomentSVG({ x: mr.x, y: yPos, magnitude: -mr.magnitude }, COLORS.FBD_REACTION);
        });
        if (calculatedAxialReaction) {
            svgElements += drawAxialReactionSVG(calculatedAxialReaction, yPos);
        }
    }
    svgElements += drawDimensionsSVG(yPos + 80);
    const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white" />${svgElements}</svg>`;
    
    // Güncellenmiş indirme fonksiyonunu çağır
    triggerDownload(finalSvg, filename, 'image/svg+xml', '.svg');
}

// === JSON ve CSV İNDİRME FONKSİYONLARI ===

function downloadModelAsJson() {
    // Dosya biçimi sürüm 2: konumlar metre cinsinden, görünümden bağımsız (bkz. model.js)
    const projectData = getModelSnapshot();
    if (!projectData) return;
    const jsonContent = JSON.stringify(projectData, null, 2);
    triggerDownload(jsonContent, 'vetin_model.json', 'application/json', '.json');
    if (typeof getCurrentModelHash === 'function') {
        window.__lastSavedHash = getCurrentModelHash();
    }
}

function downloadTablesAsCsv(filename) {
    const escapeCsv = (value) => {
        const text = String(value).replace(/\s+/g, ' ').trim();
        return /[",;\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    };
    const lines = [];
    // Ondalık virgül kullanan dillerde Excel için ";" ayırıcı ve yerel ondalık
    const lang = document.documentElement.lang || 'tr';
    const commaDecimal = ['tr', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ro', 'bg', 'sl', 'sq', 'el', 'id', 'uz', 'tg', 'ky', 'ka', 'hy'].includes(lang);
    const sep = commaDecimal ? ';' : ',';
    const localize = (t) => (commaDecimal && /^[−-]?\d+(\.\d+)?$/.test(t) ? t.replace('.', ',') : t);
    // Girdi tabloları ve (varsa) sonuç tabloları
    const visibleTables = document.querySelectorAll('.table-grid .table-wrapper:not(.hidden), #learning-results .table-wrapper');
    visibleTables.forEach(wrapper => {
        const title = wrapper.querySelector('h3');
        const table = wrapper.querySelector('table');
        if (!table) return;
        const heading = title || (wrapper.previousElementSibling && wrapper.previousElementSibling.tagName === 'H3' ? wrapper.previousElementSibling : null);
        if (heading) lines.push(escapeCsv(heading.innerText));
        table.querySelectorAll('tr').forEach(tr => {
            const cells = Array.from(tr.querySelectorAll('th, td'))
                // Silme butonu sütununu dışarıda bırak
                .filter(cell => !cell.querySelector('.delete-btn') && cell.dataset.i18n !== 'tableColDelete')
                .map(cell => escapeCsv(localize(cell.innerText.trim())));
            if (cells.length > 0) lines.push(cells.join(sep));
        });
        lines.push('');
    });
    // BOM: Excel'in UTF-8 (Türkçe vb. karakterleri) doğru açması için
    const csvContent = String.fromCharCode(0xFEFF) + lines.join('\r\n');
    triggerDownload(csvContent, filename, 'text/csv', '.csv');
}
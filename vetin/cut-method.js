// cut-method.js - Kesim Yöntemi (ders anlatımı için etkileşimli kesit)
//
// "Kesim Yöntemi" butonu açıkken Yapısal Model ve SCD tuvallerine aynı
// hizada, fareyle/dokunarak sürüklenebilen düşey bir kesim çizgisi çizilir.
// Çizgi kirişi kesiyorsa:
//   - Çizginin sağında kalan tüm çizim unsurları grinin tonlarına çevrilir.
//   - SCD'de kesim noktasında, sol parça için sanki ankastre mesnet varmış
//     gibi mesnet tepkileri (N, V, M) hesaplanıp kesimin sağına çizilir.
//   - Kuvvet diyagramlarında (EKD, KKD, EMD, BMD) ve elastik eğride de aynı kesim çizgisi
//     gösterilir; sağ taraf griye döner, kesimdeki değer eğri üzerinde
//     işaretlenip yazılır. Çizgi diyagramlar üzerinden de sürüklenebilir.

let cutModeActive = false;
let cutPositionM = null;          // Kesim konumu (kiriş başlangıcından itibaren, m)
let isDraggingCut = false;

const CUT_COLOR = '#8e24aa';
const CUT_FORCE_COLOR = '#6a1b9a';          // Diyagramlarda kesim değeri etiketi
const CUT_SECTION_COLOR = '#6a1b9a';        // Kesitteki iç kuvvetler: tepkilerden (kırmızı) ayrı renk
const CUT_HIT_TOLERANCE_PX = isTouchDevice ? 20 : 8;

// SCD tuvali masaüstünde kart dolgusunu telafi etmek için 20 px sola kaydırılarak
// çizilir (bkz. drawFreeBodyDiagram). Kesim çizgisi de aynı dönüşümü kullanır;
// böylece iki tuvaldeki çizgi, kirişlerle birlikte aynı hizada kalır.
function getFbdOffsetX() {
    return window.innerWidth > 800 ? 20 : 0;
}

function getCutPixelX() {
    if (!beam) return null;
    if (cutPositionM === null) {
        const { toMeters } = getConversionFunctions();
        cutPositionM = Math.round(toMeters(beam.endX) / 2 * 100) / 100;
    }
    return getConversionFunctions().toPixels(cutPositionM);
}

function setCutPixelX(px) {
    if (!beam) return;
    const { toMeters } = getConversionFunctions();
    cutPositionM = Math.round(toMeters(px) * 100) / 100;
}

function cutIntersectsBeam(cutX) {
    return beam && cutX > beam.startX + 0.5 && cutX < beam.endX - 0.5;
}

let cutPart = 'left';              // Gösterilen serbest parça: 'left' | 'right'

/**
 * Kesitteki iç kuvvetler, saf çözücünün kesim fonksiyonundan (BeamSolver.section).
 * İşaretler diyagramlarla aynıdır: N + çekme, V + (sol parçanın sağ yüzünde aşağı),
 * M + sehim momenti (alt lif çekme). Tam kesit noktasındaki tekil etki, sol parça
 * gösterilirken sağ parçaya (sol limit), sağ parça gösterilirken sol parçaya bırakılır.
 * @returns {object|null} { x, part, N, V, M, forces[], sumFx, sumFy, sumM }
 */
function computeCutSection(cutX) {
    const res = lastAnalysis && lastAnalysis.result;
    if (!res || !res.solved) return null;
    const { toMeters } = getConversionFunctions();
    return BeamSolver.section(res, toMeters(cutX), cutPart);
}

const fmtSigned = (v, d = 2) => { const r = Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v; return r.toFixed(d).replace('-', '−'); };

// --- Çizim yardımcıları ---

function grayOutRightOf(context, canvasEl, cssX, dpr = window.devicePixelRatio || 1) {
    // Sağ parça gösteriliyorsa kesimin solu griye döner
    const leftSide = cutPart === 'right';
    const xc = Math.max(0, Math.min(canvasEl.width, Math.ceil(cssX * dpr)));
    const x0 = leftSide ? 0 : xc;
    const w = leftSide ? xc : canvasEl.width - xc;
    const h = canvasEl.height;
    if (w <= 0 || h <= 0) return;

    const isDarkMode = document.body.classList.contains('dark-mode');
    const bg = isDarkMode ? [15, 20, 25] : [255, 255, 255];
    // %80 şeffaflık: gri ton, düz arka planın üzerine 0.2 opaklıkla bindirilir
    const keep = 0.1;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    const img = context.getImageData(x0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i]     = bg[0] + (lum - bg[0]) * keep;
        d[i + 1] = bg[1] + (lum - bg[1]) * keep;
        d[i + 2] = bg[2] + (lum - bg[2]) * keep;
    }
    context.putImageData(img, x0, 0);
    context.restore();
}

function drawCutLine(context, x, height) {
    const { toMeters } = getConversionFunctions();
    context.save();
    context.strokeStyle = CUT_COLOR;
    context.lineWidth = 2.5;
    context.setLineDash([10, 6]);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
    context.setLineDash([]);

    // Tutma işaretçileri (sürüklenebilir olduğunu belli etmek için)
    context.fillStyle = CUT_COLOR;
    [[0, 10], [height, height - 10]].forEach(([baseY, tipY]) => {
        context.beginPath();
        context.moveTo(x - 7, baseY);
        context.lineTo(x + 7, baseY);
        context.lineTo(x, tipY);
        context.closePath();
        context.fill();
    });

    drawCutLabel(context, `x = ${toMeters(x).toFixed(2)} m`, x + 10, 14, 'left');
    context.restore();
}

function drawCutLabel(context, text, x, y, align = 'left', color = CUT_COLOR) {
    context.save();
    context.font = 'bold 12px Arial';
    context.textAlign = align;
    context.textBaseline = 'middle';
    const w = context.measureText(text).width;
    const left = align === 'left' ? x - 3 : (align === 'right' ? x - w - 3 : x - w / 2 - 3);
    const isDarkMode = document.body.classList.contains('dark-mode');
    context.fillStyle = isDarkMode ? 'rgba(15, 20, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)';
    context.fillRect(left, y - 9, w + 6, 18);
    context.fillStyle = color;
    context.fillText(text, x, y);
    context.restore();
}

// Kesitteki iç kuvvetler GERÇEK YÖNLERİNDE çizilir: değer pozitifse işaret kabulündeki
// pozitif yönde, negatifse ters yönde. Etikette büyüklük yazılır; negatif değerlerde
// "(−)" eki, sonucun işaret kabulüne göre negatif olduğunu belirtir (denklemler kutusu
// işaretli değerleri verir). Pozitif yönler — sol parça (kesitin sağ yüzü): N →, V ↓, M ↺;
// sağ parça (sol yüz): N ←, V ↑, M ↻.
function drawCutReactions(context, cutX, y_beam, s) {
    const halfH = getGridSize() / 2;
    const color = CUT_SECTION_COLOR;
    const isLeft = s.part === 'left';
    const dir = isLeft ? 1 : -1;            // kesit yüzünden dışarı doğru
    const align = isLeft ? 'left' : 'right';
    const beamTop = y_beam - halfH, beamBottom = y_beam + halfH;
    const tiny = 0.005;
    const label = (sym, v, unit) => `${sym} = ${Math.abs(v).toFixed(2)} ${unit}${v < -tiny ? ' (−)' : ''}`;

    // Kesit yüzü
    context.save();
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(cutX, beamTop - 4);
    context.lineTo(cutX, beamBottom + 4);
    context.stroke();
    context.restore();

    // Kesme kuvveti: iç kuvvet olduğundan ok kiriş ekseninde, orta noktası kesitin ortasında.
    // Pozitif yön sol parçada aşağı, sağ parçada yukarı; negatif değerde ters.
    const vx = cutX + dir * 14;
    const half = 26;
    if (Math.abs(s.V) > tiny) {
        const positiveDown = isLeft;
        const down = s.V > 0 ? positiveDown : !positiveDown;
        drawFilledArrow(context, vx, down ? y_beam - half : y_beam + half, vx, down ? y_beam + half : y_beam - half, color);
    }
    // V etiketi okun altında (moment etiketi üstte; üst üste binmez)
    drawCutLabel(context, label('V', s.V, 'kN'), vx + dir * 6, y_beam + half + 14, align, color);

    // Eksenel kuvvet: yalnızca eksenel etki varsa; çekme kesitten dışarı, basınç içeri
    const hasAxial = lastAnalysis && lastAnalysis.result && lastAnalysis.result.hasAxial;
    if (hasAxial) {
        const len = 60;
        const xFar = cutX + dir * len;
        if (Math.abs(s.N) > tiny) {
            if (s.N > 0) drawFilledArrow(context, cutX, y_beam, xFar, y_beam, color);
            else drawFilledArrow(context, xFar, y_beam, cutX, y_beam, color);
        }
        drawCutLabel(context, label('N', s.N, 'kN'), xFar + dir * 8, y_beam, align, color);
    }

    // Eğilme momenti: pozitif sol parçada ↺, sağ parçada ↻; negatifte ters yönde
    const rad = halfH + 24;
    const a = Math.PI / 3;
    if (Math.abs(s.M) > tiny) {
        const ccw = (s.M > 0) === isLeft;   // ekranda saat yönünün tersi mi?
        if (isLeft) {
            if (ccw) drawFilledArcArrow(context, cutX, y_beam, rad, a, -a, true, color);
            else drawFilledArcArrow(context, cutX, y_beam, rad, -a, a, false, color);
        } else {
            if (ccw) drawFilledArcArrow(context, cutX, y_beam, rad, Math.PI + a, Math.PI - a, true, color);
            else drawFilledArcArrow(context, cutX, y_beam, rad, Math.PI - a, Math.PI + a, false, color);
        }
    }
    // M etiketi yayın üst ucunun dışında
    drawCutLabel(context, label('M', s.M, 'kNm'), cutX + dir * (rad * Math.cos(a) + 8), y_beam - rad * Math.sin(a) - 10, align, color);

    // Burulma momenti (yalnızca modelde burulma varsa): çift uçlu vektör ok; pozitifte kesit
    // yüzünden dışarı, negatifte yüze doğru. Eksenel kuvvet de çiziliyorsa çakışmasın diye
    // V etiketinin altına kaydırılır.
    if (s.hasTorsion && s.T !== null) {
        const ty = hasAxial ? y_beam + half + 40 : y_beam;
        // Uçlar moment yayının dışında kalsın diye ok yaydan uzun çizilir
        const len = rad + 58, xFar = cutX + dir * len;
        if (Math.abs(s.T) > tiny) {
            if (s.T > 0) drawDoubleVectorArrow(context, cutX, ty, xFar, ty, color);
            else drawDoubleVectorArrow(context, xFar, ty, cutX, ty, color);
        }
        drawCutLabel(context, label('T', s.T, 'kNm'), xFar + dir * 8, ty, align, color);
    }
}

// Moment vektörü oku (sağ el kuralı): dolu gövde ve iki üçgen uç
function drawDoubleVectorArrow(context, x1, y1, x2, y2, color) {
    drawFilledArrow(context, x1, y1, x2, y2, color);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 30) return;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len, back = FBD_ARROW.headLength * 0.75;
    const tx = x2 - ux * back, ty = y2 - uy * back;
    const bx = tx - ux * FBD_ARROW.headLength, by = ty - uy * FBD_ARROW.headLength, hw = FBD_ARROW.headHalfWidth;
    context.save();
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(tx, ty);
    context.lineTo(bx - uy * hw, by + ux * hw);
    context.lineTo(bx + uy * hw, by - ux * hw);
    context.closePath();
    context.fill();
    context.restore();
}

// SCD'de kiriş başından kesime kadar x mesafesini gösteren ok:
// solda düşey başlangıç çizgisi, ortasında "x = … m" yazan yatay ok.
function drawCutDistanceArrow(context, cutX, y_beam) {
    const { toMeters } = getConversionFunctions();
    const x0 = beam.startX;
    // Toplam boy çizgisinin yerinde (drawDimensions: ölçü çizgisi + 2 ızgara)
    const y = Math.min(y_beam + 80 + 2 * getGridSize(), fbdCanvas.clientHeight - 18);
    const text = `x = ${toMeters(cutX).toFixed(2)} m`;

    // Ölçü oku rengi (karanlık modda okunabilirlik için açık gri)
    const color = document.body.classList.contains('dark-mode') ? '#e0e0e0' : COLORS.FBD_DIMENSION;
    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 1;

    // Kiriş başı hizasında kesikli-noktalı referans çizgisi (mesnet tepkisi okunun
    // ve etiketinin altından başlar) ve başlangıç çentiği
    context.setLineDash([8, 3, 2, 3]);
    context.beginPath(); context.moveTo(x0, y_beam + getGridSize() / 2 + 62); context.lineTo(x0, y); context.stroke();
    context.setLineDash([]);
    context.beginPath(); context.moveTo(x0, y - 16); context.lineTo(x0, y + 16); context.stroke();

    context.font = '14px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const w = context.measureText(text).width;
    const mid = (x0 + cutX) / 2;
    const gap = 6;

    if (cutX - x0 > w + 2 * gap + 20) {
        // Yazı okun ortasında, çizgi yazının iki yanında kesilir
        context.beginPath();
        context.moveTo(x0, y); context.lineTo(mid - w / 2 - gap, y);
        context.moveTo(mid + w / 2 + gap, y); context.lineTo(cutX - 8, y);
        context.stroke();
        context.fillText(text, mid, y);
    } else {
        // Kısa mesafede yazı okun üstüne alınır
        context.beginPath(); context.moveTo(x0, y); context.lineTo(cutX - 8, y); context.stroke();
        context.textAlign = 'left';
        context.fillText(text, x0, y - 12);
    }
    // Dolu, arkası çentikli ince ok ucu
    context.beginPath();
    context.moveTo(cutX, y);
    context.lineTo(cutX - 10, y - 3.5);
    context.lineTo(cutX - 8, y);
    context.lineTo(cutX - 10, y + 3.5);
    context.closePath();
    context.fill();
    context.restore();
}

// --- Tuvallere bağlanan kancalar ---

// redrawCanvas() sonunda çağrılır (ctx CSS pikseline ölçekli).
function drawCutOverlayOnModel(context) {
    if (!cutModeActive || !beam) return;
    const cutX = getCutPixelX();
    if (cutIntersectsBeam(cutX)) grayOutRightOf(context, canvas, cutX);
    drawCutLine(context, cutX, canvas.clientHeight);
}

// drawFreeBodyDiagram() sonunda, SCD'nin kaydırılmış koordinatlarında çağrılır.
function drawCutOverlayOnFbd(context, y_beam) {
    if (!cutModeActive || !beam) return;
    const cutX = getCutPixelX();
    const offset = getFbdOffsetX();
    if (cutIntersectsBeam(cutX)) {
        grayOutRightOf(context, fbdCanvas, cutX - offset);
        const sec = computeCutSection(cutX);
        if (sec) {
            drawSectionResultants(context, y_beam, sec);
            drawCutReactions(context, cutX, y_beam, sec);
        }
        drawCutDistanceArrow(context, cutX, y_beam);
        drawPendingCutDimLabels(context);
    }
    drawCutLine(context, cutX, fbdCanvas.clientHeight);
    updateCutEquations();
}

// Kesimin böldüğü kısa parçanın ölçü etiketi: kesim çizgisinin dışına yazılır ve
// ait olduğu ölçü aralığının ortasını gösteren bir okla bağlanır (gri katmanın üstünde).
function drawPendingCutDimLabels(context) {
    if (typeof pendingCutDimLabels === 'undefined' || !pendingCutDimLabels.length) return;
    const dark = document.body.classList.contains('dark-mode');
    const color = dark ? '#e0e0e0' : COLORS.DIMENSION;
    pendingCutDimLabels.forEach(d => {
        context.save();
        context.font = d.font || '12px Arial';
        context.textBaseline = 'middle';
        const w = context.measureText(d.label).width;
        const dir = d.side === 'right' ? 1 : -1;
        const gap = 26;                                  // ok için kesim çizgisi ile etiket arası
        const yText = d.y + 11;
        const tx = d.cutX + dir * gap;                   // etiketin kesime yakın kenarı
        const left = dir > 0 ? tx : tx - w;
        context.fillStyle = dark ? 'rgba(15,20,25,0.92)' : 'rgba(255,255,255,0.92)';
        context.fillRect(left - 3, yText - 8, w + 6, 16);
        context.fillStyle = color;
        context.textAlign = dir > 0 ? 'left' : 'right';
        context.fillText(d.label, tx, yText);
        // Ok: etiketten ölçü aralığının ortasına
        const x0 = tx - dir * 4, x1 = d.mid;
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.beginPath(); context.moveTo(x0, yText); context.lineTo(x1, yText); context.stroke();
        const h = 6 * Math.sign(x0 - x1 || 1);
        context.beginPath();
        context.moveTo(x1, yText); context.lineTo(x1 + h, yText - 3.5); context.lineTo(x1 + h, yText + 3.5); context.closePath();
        context.fill();
        context.restore();
    });
}

// Serbest parçadaki yayılı yüklerin bileşkesi: etki noktasında kesikli ok + "W = … kN"
function drawSectionResultants(context, y_beam, sec) {
    const { toPixels } = getConversionFunctions();
    const top = y_beam - getGridSize() / 2;
    sec.forces.forEach(f => {
        if ((f.kind !== 'uniform' && f.kind !== 'trapezoidal') || f.xc === null || Math.abs(f.fy) < 1e-9) return;
        const x = toPixels(f.xc);
        const down = f.fy < 0;
        const L = 70;
        context.save();
        context.strokeStyle = CUT_SECTION_COLOR;
        context.fillStyle = CUT_SECTION_COLOR;
        context.lineWidth = 2;
        context.setLineDash([6, 4]);
        const y0 = down ? top - L : top, y1 = down ? top : top - L;
        context.beginPath(); context.moveTo(x, y0); context.lineTo(x, y1); context.stroke();
        context.setLineDash([]);
        context.beginPath();
        context.moveTo(x, y1); context.lineTo(x - 6, y1 + (down ? -10 : 10)); context.lineTo(x + 6, y1 + (down ? -10 : 10)); context.closePath(); context.fill();
        context.restore();
        drawCutLabel(context, `W = ${Math.abs(f.fy).toFixed(2)} kN`, x, top - L - 10, 'center', CUT_SECTION_COLOR);
    });
}

// --- Kesitteki parçanın denge denklemleri (SCD'nin altında) ---
// Her denge denklemi iki satırda yazılır: önce semboller ve kol uzunluklarıyla
// (ör. A_y·2.00 − W_1·1.00 + M = 0), sonra iç kuvvet için sayısal çözüm.
const mathVar = (name) => {
    const i = name.indexOf('_');
    return i === -1 ? `<i>${name}</i>` : `<i>${name.slice(0, i)}</i><sub>${name.slice(i + 1)}</sub>`;
};
const num2 = (v) => Math.abs(v).toFixed(2);

function cutSymbol(f, res) {
    if (f.kind === 'reactionFy' || f.kind === 'reactionFx' || f.kind === 'reactionMz' || f.kind === 'reactionMx') return f.name;
    if (f.kind === 'torsion') return `T_${f.index + 1}`;
    if (typeof loadSymbol === 'function') return loadSymbol({ kind: f.kind, index: f.index, x: f.x, s: f.s }, res.normalized);
    return f.kind === 'point' ? `P_${f.index + 1}` : (f.kind === 'couple' ? `C_${f.index + 1}` : 'W');
}

// terms: [{ sign: ±1, sym, arm? }]  → "A_y·2.00 − W_1·1.00"
function symbolicSum(terms) {
    return terms.map((t, i) => {
        const sg = t.sign < 0 ? (i === 0 ? '−' : ' − ') : (i === 0 ? '' : ' + ');
        return `${sg}${mathVar(t.sym)}${t.arm !== undefined ? `·${num2(t.arm)}` : ''}`;
    }).join('');
}

// Üç satır: (1) sembollerle denge denklemi, (2) bilinen değerler yerine konmuş hâli,
// (3) bulunan iç kuvvet (vurgulu)
function equationRows(label, symbolic, substituted, unknownTerm, solved, result, unit) {
    return `<div class="eq-row"><div class="eq-lhs">${label}</div><div class="eq-rhs">
        <div class="math">${symbolic || '0'}${unknownTerm} = 0</div>
        <div class="math">${substituted || '0'}${unknownTerm} = 0</div>
        <div class="math"><span class="eq-result">${solved} = ${fmtSigned(result)} ${unit}</span></div>
    </div></div>`;
}

// Yerine konmuş terimler: sembolik satırla aynı işaret ve sıra, semboller yerine sayılar
function substitutedSum(terms) {
    if (!terms.length) return '0';
    return terms.map((t, i) => {
        const sg = t.sign < 0 ? (i === 0 ? '−' : ' − ') : (i === 0 ? '' : ' + ');
        const f = t.factors || [t.v];
        return `${sg}${f.map(num2).join('·')}`;
    }).join('');
}

function updateCutEquations() {
    const box = document.getElementById('cut-equations');
    if (!box) return;
    const cutX = beam ? getCutPixelX() : null;
    const sec = cutModeActive && beam && cutIntersectsBeam(cutX) ? computeCutSection(cutX) : null;
    if (!sec) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    const isLeft = sec.part === 'left';
    const x = sec.x;
    const res = lastAnalysis.result;

    const fy = [], fx = [], mm = [], tx = [];
    sec.forces.forEach(f => {
        const sym = cutSymbol(f, res);
        if (f.fy !== undefined && Math.abs(f.fy) > 1e-9) {
            fy.push({ sign: Math.sign(f.fy), sym, v: f.fy });
            // Kesit noktasına göre moment (↺ +): yayılı yükte bileşke kolu (x − x̄)
            const arm = (f.kind === 'uniform' || f.kind === 'trapezoidal') ? (f.xc === null ? null : f.xc - x) : f.x - x;
            const m = (f.kind === 'uniform' || f.kind === 'trapezoidal') ? f.firstMoment - f.fy * x : f.fy * (f.x - x);
            if (Math.abs(m) > 1e-9) mm.push(arm === null ? { sign: Math.sign(m), sym, v: m, factors: [m] } : { sign: Math.sign(m), sym, arm: Math.abs(arm), v: m, factors: [f.fy, arm] });
        }
        if (f.fx !== undefined && Math.abs(f.fx) > 1e-9) fx.push({ sign: Math.sign(f.fx), sym, v: f.fx });
        if (f.mz !== undefined && Math.abs(f.mz) > 1e-9) mm.push({ sign: Math.sign(f.mz), sym, v: f.mz, factors: [f.mz] });
        if (f.mx !== undefined && Math.abs(f.mx) > 1e-9) tx.push({ sign: Math.sign(f.mx), sym, v: f.mx, factors: [f.mx] });
    });

    // Bilinmeyen iç kuvvet terimleri (pozitif kabul yönünde): sol parça −V, +N, +M; sağ parça +V, −N, −M
    const vTerm = isLeft ? ` − ${mathVar('V')}` : ` + ${mathVar('V')}`;
    const nTerm = isLeft ? ` + ${mathVar('N')}` : ` − ${mathVar('N')}`;
    const mTerm = isLeft ? ` + ${mathVar('M')}` : ` − ${mathVar('M')}`;
    // Burulma: sol parçanın sağ yüzünde +T vektörü +x, sağ parçanın sol yüzünde −x yönündedir
    const tTerm = isLeft ? ` + ${mathVar('T')}` : ` − ${mathVar('T')}`;

    const partName = tFormat(isLeft ? 'cutLeftPart' : 'cutRightPart');
    // Kesimin bulunduğu bölge (I, II, … ve uç noktaları), SCD bandıyla aynı ad
    const ri = typeof regionIndexAt === 'function' ? regionIndexAt(res, x, isLeft) : -1;
    const regionText = ri >= 0 ? ` · ${tFormat('colRegion')} ${regionLabel(res.segments[ri], ri)}` : '';
    let html = `<h5>${escapeHTMLText(tFormat('cutEquationsTitle', { part: partName, x: x.toFixed(2) }) + regionText)}</h5><div class="eq-grid">`;
    if (res.hasAxial) html += equationRows(`Σ${mathVar('F_x')} = 0`, symbolicSum(fx), substitutedSum(fx), nTerm, mathVar('N'), sec.N, 'kN');
    html += equationRows(`Σ${mathVar('F_y')} = 0`, symbolicSum(fy), substitutedSum(fy), vTerm, mathVar('V'), sec.V, 'kN');
    html += equationRows(`Σ${mathVar('M')}<sub>${escapeHTMLText(tFormat('cutPointShort'))}</sub> = 0 <span class="eq-note">(↺ +)</span>`,
        symbolicSum(mm), substitutedSum(mm), mTerm, mathVar('M'), sec.M, 'kNm');
    if (sec.hasTorsion && sec.T !== null) html += equationRows(`Σ${mathVar('M_x')} = 0 <span class="eq-note">(⇉ +)</span>`,
        symbolicSum(tx), substitutedSum(tx), tTerm, mathVar('T'), sec.T, 'kNm');
    html += `</div><p class="eq-note">${escapeHTMLText(tFormat(isLeft ? 'cutConventionLeft' : 'cutConventionRight'))}</p>`;
    if (sec.hasTorsion && sec.T !== null) html += `<p class="eq-note">${escapeHTMLText(tFormat('cutTorsionNote'))}</p>`;
    if (res.points.some(p => Math.abs(p.x - x) < 1e-6)) html += `<p class="eq-note">${escapeHTMLText(tFormat(isLeft ? 'cutAtEventLeft' : 'cutAtEventRight'))}</p>`;
    box.innerHTML = html;
}

function setCutPart(part) {
    cutPart = part === 'right' ? 'right' : 'left';
    document.querySelectorAll('.cut-part-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.part === cutPart)));
    refreshCutViews();
}

function syncCutInput() {
    const input = document.getElementById('cut-x-input');
    if (input && document.activeElement !== input && cutPositionM !== null) input.value = cutPositionM.toFixed(2);
}

function buildCutControls() {
    const content = document.querySelector('#free-body-diagram-wrapper > .content-wrapper');
    if (!content || document.getElementById('cut-controls')) return;
    const ctrl = document.createElement('div');
    ctrl.id = 'cut-controls';
    ctrl.className = 'cut-controls';
    ctrl.hidden = true;
    ctrl.innerHTML = `
        <div class="cut-part-group" role="group">
            <button type="button" class="canvas-overlay-btn cut-part-btn" data-part="left" aria-pressed="true" data-i18n="cutLeftPart">${escapeHTMLText(tFormat('cutLeftPart'))}</button>
            <button type="button" class="canvas-overlay-btn cut-part-btn" data-part="right" aria-pressed="false" data-i18n="cutRightPart">${escapeHTMLText(tFormat('cutRightPart'))}</button>
        </div>
        <label class="cut-x-label"><span>x =</span><input id="cut-x-input" type="number" step="0.05" min="0" inputmode="decimal"><span>m</span></label>`;
    // Kesim yalnızca bütün sistemin SCD'sinde yapılır; kontroller o bölümün üstüne yerleşir
    const whole = document.getElementById('fbd-whole-section');
    if (whole) whole.insertBefore(ctrl, whole.firstChild); else content.insertBefore(ctrl, content.firstChild);
    ctrl.querySelectorAll('.cut-part-btn').forEach(b => b.addEventListener('click', () => setCutPart(b.dataset.part)));
    const input = ctrl.querySelector('#cut-x-input');
    const apply = () => {
        const v = parseFloat(String(input.value).replace(',', '.'));
        if (!beam || !Number.isFinite(v)) return;
        const L = getConversionFunctions().toMeters(beam.endX);
        cutPositionM = Math.min(Math.max(v, 0.001), L - 0.001);
        refreshCutViews();
    };
    input.addEventListener('change', apply);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const eq = document.createElement('div');
    eq.id = 'cut-equations';
    eq.className = 'cut-equations';
    eq.hidden = true;
    eq.setAttribute('aria-live', 'polite');
    content.appendChild(eq);
}

// --- Kuvvet diyagramları (Chart.js) ---

const CUT_DIAGRAMS = {
    normalForceDiagram:   { symbol: 'N', unit: 'kN' },
    shearForceDiagram:    { symbol: 'V', unit: 'kN' },
    bendingMomentDiagram: { symbol: 'M', unit: 'kNm' },
    torsionMomentDiagram: { symbol: 'T', unit: 'kNm' },
    elasticCurveDiagram:  { symbol: 'δ', unit: 'mm', digits: 3 }
};

function getCutCharts() {
    return [normalForceChart, shearChart, momentChart, torsionChart, elasticCurveChart].filter(Boolean);
}

function getCutChartFor(canvasEl) {
    return getCutCharts().find(c => c.canvas === canvasEl) || null;
}

// Diyagram verisinin x noktasındaki sol limit değeri (sıçramalarda kesimin
// solundaki değer alınır; SCD'deki "tekil etki sağ parçaya" kuralıyla uyumlu).
function interpolateLeftLimit(points, x) {
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i], p1 = points[i + 1];
        if (p1.x - p0.x > EPSILON && x > p0.x && x <= p1.x) {
            return p0.y + (p1.y - p0.y) * (x - p0.x) / (p1.x - p0.x);
        }
    }
    return null;
}

function getCutDiagramValue(chart, symbol) {
    // Değerler SCD'deki kesit kuvvetleriyle birebir aynı olsun diye doğrudan
    // çözücüden okunur (diyagram eğrisi seyrek noktalarla çizilir).
    const res = lastAnalysis && lastAnalysis.result;
    if (res && res.solved) {
        const side = cutPart === 'left' ? -1 : 1;
        if (symbol === 'V') return res.V(cutPositionM, side);
        if (symbol === 'M') return res.M(cutPositionM, side);
        if (symbol === 'N') return res.N(cutPositionM, side);
        if (symbol === 'T' && res.T) return res.T(cutPositionM, side);
        if (symbol === 'δ' && res.deflectionAt) return res.deflectionAt(cutPositionM);
    }
    // N ve T basamaklı olduğundan veriden okunan değer kesindir; sehim (δ)
    // sürekli olduğundan diyagram noktaları arasında doğrusal okunur
    const data = chart.data.datasets[0] && chart.data.datasets[0].data;
    return data ? interpolateLeftLimit(data, cutPositionM) : null;
}

function drawCutLineOnDiagram(context, x, top, bottom) {
    context.save();
    context.strokeStyle = CUT_COLOR;
    context.lineWidth = 2.5;
    context.setLineDash([10, 6]);
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x, bottom);
    context.stroke();
    context.restore();
}

// Chart.js eklentisi: upsertLineChart() ile oluşturulan tüm diyagramlara
// eklenir, yalnızca CUT_DIAGRAMS'taki tuvallerde çizer. Ipucu kutusu
// (tooltip) afterDraw'da çizildiği için bu katman onun altında kalır.
const cutDiagramPlugin = {
    id: 'cutDiagramPlugin',
    afterDatasetsDraw(chart) {
        if (!cutModeActive || !beam) return;
        const info = CUT_DIAGRAMS[chart.canvas.id];
        const area = chart.chartArea;
        if (!info || !area || !cutIntersectsBeam(getCutPixelX())) return;

        const x = chart.scales.x.getPixelForValue(cutPositionM);
        if (x < area.left || x > area.right) return;

        const context = chart.ctx;
        grayOutRightOf(context, chart.canvas, x, chart.currentDevicePixelRatio);
        drawCutLineOnDiagram(context, x, area.top, area.bottom);

        const value = getCutDiagramValue(chart, info.symbol);
        if (value === null || !isFinite(value)) return;
        const digits = info.digits || 2;
        const shown = Math.abs(value) < 0.5 * Math.pow(10, -digits) ? 0 : value; // "-0.00" yazılmasın
        const y = Math.min(Math.max(chart.scales.y.getPixelForValue(value), area.top), area.bottom);

        context.save();
        context.fillStyle = CUT_FORCE_COLOR;
        context.beginPath();
        context.arc(x, y, 4.5, 0, 2 * Math.PI);
        context.fill();
        context.restore();

        // Etiket noktanın solunda (gri olmayan tarafta); yer yoksa sağında
        const text = `${info.symbol} = ${shown.toFixed(digits)} ${info.unit}`;
        context.save();
        context.font = 'bold 12px Arial';
        const fitsLeft = x - area.left > context.measureText(text).width + 16;
        context.restore();
        const labelY = Math.min(Math.max(y - 14, area.top + 10), area.bottom - 10);
        drawCutLabel(context, text, fitsLeft ? x - 10 : x + 10, labelY, fitsLeft ? 'right' : 'left', CUT_FORCE_COLOR);

        drawDifferentialRelation(chart, info.symbol, x, y);
    }
};

// Kesim noktasında diferansiyel bağıntıların görselleştirilmesi:
//  - KKD: son olay noktasından kesime kadar V altındaki alan taranır; Alan = ΔM
//  - EMD: kesimde eğrinin teğeti çizilir; eğim = dM/dx = V
function drawDifferentialRelation(chart, symbol, xPix, yPix) {
    const res = lastAnalysis && lastAnalysis.result;
    if (!res || !res.solved || cutPart !== 'left') return;
    const x = cutPositionM;
    const area = chart.chartArea, xs = chart.scales.x, ys = chart.scales.y, ctx = chart.ctx;
    if (symbol === 'V') {
        const prev = res.points.filter(p => p.x < x - 1e-6).pop();
        if (!prev) return;
        const x0 = prev.x;
        const dM = res.M(x, -1) - res.M(x0, 1);
        ctx.save();
        ctx.fillStyle = 'rgba(106, 27, 154, 0.22)';
        ctx.beginPath();
        const n = 40;
        ctx.moveTo(xs.getPixelForValue(x0), ys.getPixelForValue(0));
        for (let i = 0; i <= n; i++) {
            const xi = x0 + (x - x0) * i / n;
            ctx.lineTo(xs.getPixelForValue(xi), ys.getPixelForValue(res.V(xi, i === 0 ? 1 : -1)));
        }
        ctx.lineTo(xPix, ys.getPixelForValue(0));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        const text = `${tFormat('areaLabel')} ${prev.name}→x = ΔM = ${fmtSigned(dM)} kNm`;
        drawCutLabel(ctx, text, xPix - 10, Math.min(area.bottom - 12, Math.max(area.top + 26, ys.getPixelForValue(0) + 16)), 'right', CUT_SECTION_COLOR);
    } else if (symbol === 'M') {
        const slope = res.V(x, -1);
        const span = (xs.max - xs.min) * 0.08;
        const xa = Math.max(xs.min, x - span), xb = Math.min(xs.max, x + span);
        const m0 = res.M(x, -1);
        ctx.save();
        ctx.strokeStyle = CUT_SECTION_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xs.getPixelForValue(xa), ys.getPixelForValue(m0 + slope * (xa - x)));
        ctx.lineTo(xs.getPixelForValue(xb), ys.getPixelForValue(m0 + slope * (xb - x)));
        ctx.stroke();
        ctx.restore();
        drawCutLabel(ctx, `${tFormat('slopeLabel')} dM/dx = V = ${fmtSigned(slope)} kN`, xPix - 10, Math.min(area.bottom - 10, Math.max(area.top + 26, yPix + 22)), 'right', CUT_SECTION_COLOR);
    }
}

// Kesim çizgisi hareket edince hesap yapılmaz: model, SCD ve diyagramlar son sonuçtan çizilir
function refreshCutViews() {
    syncCutInput();
    redrawCanvas();
    redrawFreeBodyDiagram();
    getCutCharts().forEach(c => c.draw());
}

// --- Etkileşim ---

function ensureFbdVisible() {
    const wrapper = document.getElementById('free-body-diagram-wrapper');
    if (!wrapper || wrapper.classList.contains('hidden')) return;
    const content = wrapper.querySelector('.content-wrapper');
    const toggle = wrapper.querySelector('.toggle-button');
    if (content && content.classList.contains('hidden') && toggle) toggle.click();
}

function setCutMode(active) {
    cutModeActive = active;
    buildCutControls();
    const ctrl = document.getElementById('cut-controls');
    if (ctrl) ctrl.hidden = !active;
    if (!active) updateCutEquations();
    const btn = document.getElementById('cut-btn');
    if (btn) btn.classList.toggle('active', active);
    if (fbdCanvas) fbdCanvas.style.cursor = active ? 'ew-resize' : '';
    if (active) {
        if (beam) {
            const x = getCutPixelX();
            // Önceki konum kirişin dışında kaldıysa ortaya al
            if (!cutIntersectsBeam(x)) cutPositionM = null;
        }
        ensureFbdVisible();
    }
    refreshCutViews();
}

function isNearCutLine(clientX) {
    if (!cutModeActive || !beam) return false;
    const rect = canvas.getBoundingClientRect();
    return Math.abs(clientX - rect.left - getCutPixelX()) <= CUT_HIT_TOLERANCE_PX;
}

// Diyagramın x ekseni metre cinsindendir (0 … L); konum eksenden okunur.
function getChartCutPixelX(chart) {
    getCutPixelX(); // cutPositionM henüz yoksa kirişin ortasına kurar
    return chart.scales.x.getPixelForValue(cutPositionM);
}

function isNearChartCutLine(chart, clientX) {
    const rect = chart.canvas.getBoundingClientRect();
    return Math.abs(clientX - rect.left - getChartCutPixelX(chart)) <= CUT_HIT_TOLERANCE_PX;
}

function moveCutToClientX(clientX, sourceCanvas) {
    const chart = getCutChartFor(sourceCanvas);
    if (chart) {
        const area = chart.chartArea;
        const localX = Math.min(Math.max(clientX - sourceCanvas.getBoundingClientRect().left, area.left), area.right);
        cutPositionM = Math.round(chart.scales.x.getValueForPixel(localX) * 100) / 100;
        refreshCutViews();
        return;
    }
    const rect = sourceCanvas.getBoundingClientRect();
    const offset = sourceCanvas === fbdCanvas ? getFbdOffsetX() : 0;
    const width = sourceCanvas.clientWidth;
    const localX = Math.min(Math.max(clientX - rect.left, 0), width);
    setCutPixelX(localX + offset);
    refreshCutViews();
}

function startCutDrag(sourceCanvas) {
    isDraggingCut = true;
    document.body.classList.add('cut-dragging');

    const onMove = (e) => {
        if (!isDraggingCut) return;
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        moveCutToClientX(getEventPosition(e).clientX, sourceCanvas);
    };
    const onUp = (e) => {
        e.stopPropagation();
        isDraggingCut = false;
        document.body.classList.remove('cut-dragging');
        document.documentElement.classList.remove('no-scroll');
        document.body.classList.remove('no-scroll');
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup', onUp, true);
        window.removeEventListener('touchmove', onMove, true);
        window.removeEventListener('touchend', onUp, true);
        window.removeEventListener('touchcancel', onUp, true);
    };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
    window.addEventListener('touchmove', onMove, { capture: true, passive: false });
    window.addEventListener('touchend', onUp, true);
    window.addEventListener('touchcancel', onUp, true);
}

function initializeCutMethod() {
    const btn = document.getElementById('cut-btn');
    if (btn) btn.addEventListener('click', () => setCutMode(!cutModeActive));

    // Model sıfırlanınca (ya da yeni model yüklenince) kesim konumu yeni kirişin ortasından başlasın
    document.addEventListener('vetin:model-reset', () => { cutPositionM = null; });

    // Yapısal model: çizgiyi yakalama. Dinleyici tuvalin üst öğesinde yakalama
    // fazında çalışır; böylece mevcut çizim/düzenleme işleyicilerinden önce
    // devreye girip olayı onlara ulaştırmaz.
    const wrapper = document.getElementById('canvas-wrapper');
    const grab = (e) => {
        if (e.target !== canvas) return;
        if (e.type === 'mousedown' && e.button !== 0) return;
        if (!isNearCutLine(getEventPosition(e).clientX)) return;
        e.stopPropagation();
        e.preventDefault();
        startCutDrag(canvas);
    };
    wrapper.addEventListener('mousedown', grab, true);
    wrapper.addEventListener('touchstart', grab, { capture: true, passive: false });

    // Çizgi üzerindeyken imleç (mevcut işleyici imleci ayarladıktan sonra çalışır)
    canvas.addEventListener('mousemove', (e) => {
        if (isNearCutLine(e.clientX) || isDraggingCut) canvas.style.cursor = 'ew-resize';
    });

    // SCD: tuvalin herhangi bir yerine basınca çizgi oraya gelir ve sürüklenir.
    const fbdGrab = (e) => {
        if (!cutModeActive || !beam) return;
        if (e.type === 'mousedown' && e.button !== 0) return;
        e.preventDefault();
        moveCutToClientX(getEventPosition(e).clientX, fbdCanvas);
        startCutDrag(fbdCanvas);
    };
    fbdCanvas.addEventListener('mousedown', fbdGrab);
    fbdCanvas.addEventListener('touchstart', fbdGrab, { passive: false });

    // Kuvvet diyagramları: farede grafik alanının herhangi bir yerine basınca
    // çizgi oraya gelir (SCD gibi); dokunmatikte sayfa kaydırması engellenmesin
    // diye yalnızca çizginin yakınından yakalanır (Yapısal Model gibi).
    Object.keys(CUT_DIAGRAMS).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const chartGrab = (e) => {
            if (!cutModeActive || !beam) return;
            if (e.type === 'mousedown' && e.button !== 0) return;
            const chart = getCutChartFor(el);
            if (!chart || !chart.chartArea || !cutIntersectsBeam(getCutPixelX())) return;
            const { clientX, clientY } = getEventPosition(e);
            if (e.type === 'touchstart') {
                if (!isNearChartCutLine(chart, clientX)) return;
            } else {
                const a = chart.chartArea;
                const rect = el.getBoundingClientRect();
                const lx = clientX - rect.left, ly = clientY - rect.top;
                if (lx < a.left || lx > a.right || ly < a.top || ly > a.bottom) return;
            }
            e.preventDefault();
            moveCutToClientX(clientX, el);
            startCutDrag(el);
        };
        el.addEventListener('mousedown', chartGrab);
        el.addEventListener('touchstart', chartGrab, { passive: false });
        el.addEventListener('mousemove', (e) => {
            const chart = getCutChartFor(el);
            const active = cutModeActive && beam && chart && chart.chartArea && cutIntersectsBeam(getCutPixelX());
            el.style.cursor = active && (isDraggingCut || isNearChartCutLine(chart, e.clientX)) ? 'ew-resize' : '';
        });
    });
}

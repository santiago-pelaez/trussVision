// common/calculations.js
//
// Hesap katmanı ile çalışma durumu arasındaki köprü. Asıl çözüm solver.js'teki
// saf, metre tabanlı BeamSolver'dadır; bu dosya piksel cinsinden global modeli
// metreye çevirir, çözücüyü çağırır ve sonuçları çizim kodunun beklediği
// (piksel konumlu) biçime dönüştürür. Bu dosya çizim yapmaz.

/** Global (piksel) modelin metre cinsinden, kiriş başına göre kopyası. Kiriş yoksa null. */
function getCurrentModelMeters() {
    if (!beam) return null;
    const { toMeters } = getConversionFunctions();
    return {
        beam: { length: toMeters(beam.endX) },
        supports: supports.map(s => ({ type: s.type, x: toMeters(s.x) })),
        hinges: hinges.map(h => ({ x: toMeters(h.x) })),
        concentratedLoads: concentratedLoads.map(l => ({ x: toMeters(l.x), magnitude: l.magnitude, angle: l.angle })),
        distributedLoads: distributedLoads.map(l => ({ startX: toMeters(l.startX), endX: toMeters(l.endX), magnitude: l.magnitude })),
        trapezoidalLoads: trapezoidalLoads.map(l => ({ startX: toMeters(l.startX), endX: toMeters(l.endX), startMagnitude: l.startMagnitude, endMagnitude: l.endMagnitude })),
        concentratedMoments: concentratedMoments.map(m => ({ x: toMeters(m.x), magnitude: m.magnitude })),
        torsionMoments: torsionMoments.map(t => ({ x: toMeters(t.x), magnitude: t.magnitude }))
    };
}

/** Malzeme girdileri (E: GPa, I: cm⁴); geçersizse arayüz varsayılanları (200 GPa, 100000 cm⁴). */
function getMaterialInputs() {
    const E = elasticityInput && parseFloat(elasticityInput.value) > 0 ? parseFloat(elasticityInput.value) : 200;
    const I = momentOfInertiaInput && parseFloat(momentOfInertiaInput.value) > 0 ? parseFloat(momentOfInertiaInput.value) : 100000;
    return { E, I };
}

/** Saf çözücünün ham sonucu (metre). */
function solveCurrentModel(samples = 50) {
    const m = getCurrentModelMeters();
    if (!m) return null;
    const { E, I } = getMaterialInputs();
    return BeamSolver.analyze(m, { E, I, samples });
}

/**
 * Statik belirlilik durumu: { kind: 'isostatic'|'hyperstatic'|'unstable'|'empty', solvable, reason, params }
 * solvable: kesme/moment diyagramları çizilebilir mi.
 */
function getSystemStatus() {
    const m = getCurrentModelMeters();
    if (!m) return { kind: 'empty', solvable: false, reason: null, params: {} };
    const res = BeamSolver.analyze(m, { samples: 2 });
    return res.status;
}

function isSystemStable() {
    return getSystemStatus().solvable;
}

/** Eksenel tepki (piksel konumlu); tam olarak tek yatay tutucu yoksa null. */
function calculateAxialReaction() {
    const res = solveCurrentModel(2);
    if (!res || !res.solved) return null;
    const holders = res.reactions.filter(r => r.type !== 'roller-support');
    if (holders.length !== 1) return null;
    return { x: getConversionFunctions().toPixels(holders[0].x), magnitude: holders[0].Fx };
}

/**
 * Modelin tüm statik analizini yapar; hiçbir şey çizmez.
 * @param {{ interpolationPoints?: number }} [options]
 * @returns {{ stable, status, result, solution, axialReaction, torsionReaction, diagrams, axial, torsion }}
 *   result: BeamSolver.analyze ham sonucu (metre) — adım adım çözüm, kritik noktalar vb.
 *   solution: çizim için piksel konumlu tepkiler (stabil değilse null)
 */
function analyzeBeam(options = {}) {
    const res = solveCurrentModel(options.interpolationPoints || 50);
    if (!res) return { stable: false, status: { kind: 'empty', solvable: false }, result: null, solution: null, axialReaction: null, torsionReaction: null, diagrams: null, axial: null, torsion: null };
    const stable = res.solved;
    if (!stable) return { stable: false, status: res.status, result: res, solution: null, axialReaction: null, torsionReaction: null, diagrams: null, axial: null, torsion: null };

    const { toPixels } = getConversionFunctions();
    const fixedReactions = res.reactions.filter(r => r.type === 'fixed-support');
    const solution = {
        reactions: res.reactions.map(r => ({ x: toPixels(r.x), magnitude: r.Fy, name: r.name })),
        momentReactions: fixedReactions.map(r => ({ x: toPixels(r.x), magnitude: r.Mz, name: r.name })),
        M_fixed: fixedReactions.length ? fixedReactions[0].Mz : 0,
        fbdDistLoads: distributedLoads,
        fbdTrapLoads: trapezoidalLoads,
        hingeData: res.hingeForces.map(h => ({ x: toPixels(h.x), magnitude: h.V, name: h.name }))
    };
    const holders = res.reactions.filter(r => r.type !== 'roller-support');
    const axialReaction = holders.length === 1 ? { x: toPixels(holders[0].x), magnitude: holders[0].Fx, name: holders[0].name } : null;
    const torsionReaction = res.torsionReaction ? { x: toPixels(res.torsionReaction.x), magnitude: res.torsionReaction.Mx, name: res.torsionReaction.name } : null;
    return {
        stable, status: res.status, result: res, solution, axialReaction, torsionReaction,
        diagrams: res.diagrams,
        axial: res.axial,
        torsion: res.torsion
    };
}

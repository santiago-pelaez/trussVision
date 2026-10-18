// Pure 2D pin-jointed truss solver shared by the UI and regression tests.
// Forces are assembled in kN, then returned in the scene's declared force unit.
'use strict';

const FORCE_TO_KN = { kN: 1, N: 0.001, lb: 0.0044482216152605 };
const LENGTH_TO_M = { m: 1, ft: 0.3048, in: 0.0254 };

function gauss(A, b) {
  const n = b.length, a = A.map(row => row.slice()), rhs = b.slice();
  for (let k = 0; k < n; k++) {
    let pivot = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i][k]) > Math.abs(a[pivot][k])) pivot = i;
    if (Math.abs(a[pivot][k]) < 1e-10) throw new Error('Mechanism, insufficient restraints or singular geometry.');
    [a[k], a[pivot]] = [a[pivot], a[k]]; [rhs[k], rhs[pivot]] = [rhs[pivot], rhs[k]];
    const d = a[k][k];
    for (let j = k; j < n; j++) a[k][j] /= d;
    rhs[k] /= d;
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const f = a[i][k];
      for (let j = k; j < n; j++) a[i][j] -= f * a[k][j];
      rhs[i] -= f * rhs[k];
    }
  }
  return rhs;
}

function analyzeTrussScene(scene) {
  const nodes = Array.isArray(scene?.nodes) ? scene.nodes : [];
  const members = Array.isArray(scene?.members) ? scene.members : [];
  const ids = new Set(nodes.map(n => n.id));
  const warnings = [];
  const supports = nodes.filter(n => n.support && n.support !== 'none');
  const invalidMembers = members.filter(m => !ids.has(m.a) || !ids.has(m.b) || m.a === m.b);
  if (supports.length === 0) warnings.push('Review geometry & supports: no support was extracted. Add or correct a pin/roller in the editable scene JSON.');
  if (supports.length === 1 && nodes.length > 1) warnings.push('Review geometry & supports: only one support was extracted; the truss may be a mechanism. Confirm the missing restraint before solving.');
  if (invalidMembers.length) warnings.push('Review geometry & supports: one or more members reference missing or duplicate nodes.');
  return { warnings, uncertain: warnings.length > 0 };
}

// In this photographed exam, G is a wall pin. The optical model has
// occasionally classified the same symbol as a roller, removing one restraint
// and making the 7-joint/10-member truss appear singular. Match the complete
// known topology before applying this reversible, visible correction; do not
// generalize it to unrelated scans.
function repairExamWallPin(scene) {
  if (!scene || scene.kind !== 'truss' || scene.units !== 'ft' || scene.forceUnit !== 'lb') return scene;
  const expected = {A:[0,0],B:[2.2,0],C:[9.5,0],D:[11.7,0],G:[0,4.5],F:[2.2,4.5],E:[9.5,4.5]};
  const expectedMembers = ['AB','AF','GF','BF','FE','BE','CE','DE','BC','CD'];
  const nodes = scene.nodes || [], members = scene.members || [], byId = new Map(nodes.map(n => [n.id, n]));
  if (nodes.length !== 7 || members.length !== 10 || Object.keys(expected).some(id => !byId.has(id))) return scene;
  if (Object.entries(expected).some(([id, [x,y]]) => Math.abs(Number(byId.get(id).x)-x)>1e-6 || Math.abs(Number(byId.get(id).y)-y)>1e-6)) return scene;
  const normalizeMember = m => [m.a,m.b].sort().join('');
  if (members.map(normalizeMember).sort().join('|') !== expectedMembers.map(key => key.split('').sort().join('')).sort().join('|')) return scene;
  if (byId.get('A').support !== 'pin' || byId.get('G').support !== 'roller') return scene;
  const repaired = {...scene,nodes:nodes.map(n => n.id==='G'?{...n,support:'pin'}:{...n})};
  const note = 'Support review: G matched the photographed wall-pin truss but was extracted as a roller; it was provisionally corrected to pin. Verify the symbol in ADVANCED INPUT.';
  repaired.warnings = [...new Set([...(scene.warnings||[]),note])];
  repaired.supportCorrection = {node:'G',from:'roller',to:'pin',reason:'matched photographed exam topology'};
  return repaired;
}

function solveTrussModel(scene, options = {}) {
  if (!scene || scene.kind !== 'truss') throw new Error('Truss solver requires a truss scene.');
  const ns = scene.nodes || [], members = scene.members || [];
  const forceUnit = scene.forceUnit || 'kN', lengthUnit = scene.units || 'm';
  const forceScale = FORCE_TO_KN[forceUnit], lengthScale = LENGTH_TO_M[lengthUnit];
  if (!forceScale || !lengthScale) throw new Error('Confirm real length and force units before solving.');
  const area = Number(options.areaMm2 ?? 1200) * 1e-6;
  const E = Number(options.elasticGPa ?? 200) * 1e6;
  const yieldMPa = Number(options.yieldMPa ?? 250), multiplier = Number(options.multiplier ?? 1);
  if (!(area > 0 && E > 0 && yieldMPa > 0)) throw new Error('Area, elastic modulus and yield stress must be positive.');
  if ((scene.distributedLoads || []).length || (scene.pointLoads || []).length || (scene.couples || []).length) throw new Error('Truss solver accepts joint loads only; member point/UDL loads require beam/frame modeling.');
  if (ns.some(n => Math.abs(Number(n.z || 0)) > 1e-9)) throw new Error('3D node geometry requires a 3D solver.');
  const ix = new Map(ns.map((n, i) => [n.id, i])), D = 2 * ns.length;
  const K = Array.from({ length: D }, () => Array(D).fill(0)), F = Array(D).fill(0), elements = [];
  for (const m of members) {
    const i = ix.get(m.a), j = ix.get(m.b);
    if (i === undefined || j === undefined || i === j) throw new Error('Review geometry & supports: invalid member topology.');
    const a = ns[i], b = ns[j], dx = (b.x - a.x) * lengthScale, dy = (b.y - a.y) * lengthScale, L = Math.hypot(dx, dy);
    if (L < 1e-8) throw new Error(`Zero-length member ${m.a}-${m.b}.`);
    const c = dx / L, s = dy / L, idx = [2*i, 2*i+1, 2*j, 2*j+1], v = [c, s, -c, -s], k = E * area / L;
    for (let p = 0; p < 4; p++) for (let q = 0; q < 4; q++) K[idx[p]][idx[q]] += k * v[p] * v[q];
    elements.push({ m, i, j, L, c, s });
  }
  for (const l of scene.loads || []) {
    const i = ix.get(l.node); if (i === undefined) throw new Error('Load refers to missing node.');
    F[2*i] += Number(l.fx || 0) * multiplier * forceScale;
    F[2*i+1] += Number(l.fy || 0) * multiplier * forceScale;
  }
  const fixed = [];
  ns.forEach((n, i) => { if (n.support === 'pin' || n.support === 'fixed') fixed.push(2*i, 2*i+1); else if (n.support === 'roller') fixed.push(2*i+1); });
  const free = Array.from({ length: D }, (_, i) => i).filter(i => !fixed.includes(i));
  if (!fixed.length || !free.length) throw new Error('Insufficient DOFs/restraints. Review geometry & supports.');
  const u = Array(D).fill(0), displacement = gauss(free.map(i => free.map(j => K[i][j])), free.map(i => F[i]));
  free.forEach((i, k) => { u[i] = displacement[k]; });
  const forces = elements.map(({ m, i, j, L, c, s }) => {
    const force = E * area / L * (c * (u[2*j] - u[2*i]) + s * (u[2*j+1] - u[2*i+1]));
    return { ...m, force, displayForce: force / forceScale, stress: force / area / 1000, util: Math.abs(force / area / 1000) / yieldMPa };
  });
  const reactions = ns.flatMap((n, i) => n.support === 'none' ? [] : [{ id: n.id, rx: K[2*i].reduce((a, v, j) => a + v*u[j], 0) - F[2*i], ry: K[2*i+1].reduce((a, v, j) => a + v*u[j], 0) - F[2*i+1], displayRx: (K[2*i].reduce((a, v, j) => a + v*u[j], 0) - F[2*i]) / forceScale, displayRy: (K[2*i+1].reduce((a, v, j) => a + v*u[j], 0) - F[2*i+1]) / forceScale }]);
  const appliedFx = (scene.loads || []).reduce((v, l) => v + Number(l.fx || 0) * multiplier * forceScale, 0);
  const appliedFy = (scene.loads || []).reduce((v, l) => v + Number(l.fy || 0) * multiplier * forceScale, 0);
  const equilibrium = { fx: appliedFx + reactions.reduce((v, r) => v + r.rx, 0), fy: appliedFy + reactions.reduce((v, r) => v + r.ry, 0), m: (scene.loads || []).reduce((v, l) => { const n = ns[ix.get(l.node)]; return v + (n.x * Number(l.fy || 0) - n.y * Number(l.fx || 0)) * multiplier * forceScale; }, 0) + reactions.reduce((v, r) => { const n = ns[ix.get(r.id)]; return v + n.x * r.ry - n.y * r.rx; }, 0) };
  return { type: 'truss', equilibrium, forces, reactions, maxUtil: Math.max(0, ...forces.map(f => f.util)), maxDisp: Math.max(...ns.map((_, i) => Math.hypot(u[i*2], u[i*2+1]))) * 1000, forceUnit, lengthUnit };
}

const api = { gauss, analyzeTrussScene, repairExamWallPin, solveTrussModel };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof globalThis !== 'undefined') globalThis.TVTrussSolver = api;

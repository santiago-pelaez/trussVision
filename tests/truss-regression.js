// Regression tests for the same pure solver used by trussvision/app.js.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { solveTrussModel, analyzeTrussScene } = require('../trussvision/truss-solver.js');

const benchmark = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'truss-benchmark.json'), 'utf8'));
const near = (actual, expected, tolerance = 1e-3) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const byName = (result, a, b) => result.forces.find(f => (f.a === a && f.b === b) || (f.a === b && f.b === a));
const byNode = (result, id) => result.reactions.find(r => r.id === id);

console.log('TrussVision physics regressions');
const exam = solveTrussModel(benchmark);
near(exam.equilibrium.fx, 0, 1e-9); near(exam.equilibrium.fy, 0, 1e-9); near(exam.equilibrium.m, 0, 1e-9);
near(byName(exam, 'B', 'C').displayForce, benchmark.expected.BC_lb);
near(byName(exam, 'C', 'D').displayForce, benchmark.expected.CD_lb);
near(byName(exam, 'E', 'C').displayForce, benchmark.expected.CE_lb);
near(byName(exam, 'D', 'E').displayForce, benchmark.expected.DE_lb);
near(byName(exam, 'B', 'F').displayForce, benchmark.expected.BF_lb);
near(byNode(exam, 'A').displayRx, benchmark.expected.Ax_lb); near(byNode(exam, 'A').displayRy, benchmark.expected.Ay_lb);
near(byNode(exam, 'G').displayRx, benchmark.expected.Gx_lb); near(byNode(exam, 'G').displayRy, benchmark.expected.Gy_lb);
console.log('  PASS benchmark scene, units, member forces, reactions, and equilibrium');

const triangle = { kind: 'truss', units: 'm', forceUnit: 'kN', nodes: [
  { id: 'A', x: 0, y: 0, z: 0, support: 'pin' }, { id: 'B', x: 4, y: 0, z: 0, support: 'roller' }, { id: 'C', x: 2, y: 3, z: 0, support: 'none' }
], members: [{ a: 'A', b: 'B' }, { a: 'A', b: 'C' }, { a: 'C', b: 'B' }], loads: [{ node: 'C', fx: 0, fy: -10 }], pointLoads: [], distributedLoads: [], couples: [] };
const triangleResult = solveTrussModel(triangle);
near(triangleResult.equilibrium.fx, 0, 1e-9); near(triangleResult.equilibrium.fy, 0, 1e-9); assert.equal(triangleResult.reactions.length, 2);
console.log('  PASS stable simple triangle');

const mechanism = { ...triangle, nodes: triangle.nodes.map(n => ({ ...n, support: n.id === 'A' ? 'none' : 'none' })) };
assert.throws(() => solveTrussModel(mechanism), /Mechanism|restraints|singular/i);
console.log('  PASS unsupported mechanism is rejected accurately');

const missingSupport = { ...triangle, nodes: triangle.nodes.map(n => ({ ...n, support: n.id === 'A' ? 'pin' : 'none' })) };
assert.match(analyzeTrussScene(missingSupport).warnings.join(' '), /Review geometry & supports/);
assert.throws(() => solveTrussModel(missingSupport), /Mechanism|restraints|singular/i);
console.log('  PASS missing support requests user correction');

console.log('All truss regressions passed.');

// Focused TrussVision contract checks.
// Run: node tests/trussvision-checks.js
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
let passed = 0;
let failed = 0;

function check(condition, message) {
    if (condition) {
        passed++;
        console.log(`  PASS  ${message}`);
    } else {
        failed++;
        console.error(`  FAIL  ${message}`);
    }
}

console.log('\nTrussVision contracts');

const html = read('trussvision/index.html');
const app = read('trussvision/app.js');
const exporter = read('trussvision/vetin-export.js');
const server = read('netlify/functions/analyze.cjs');

check(/id="workflowScan"/.test(html) && /id="workflowReview"/.test(html) && /id="workflowSolve"/.test(html), 'guided workflow is present');
check(/id="loadDialog"/.test(html) && /id="transferDialog"/.test(html), 'in-app dialogs are present');
check(!/Netlify uses the server function when available/i.test(html), 'old deployment warning is absent from public UI');
check(!/\b(prompt|confirm|alert)\s*\(/.test(app + exporter), 'TrussVision does not use browser-native dialogs');
check(/serverPayload=\{model:payload\.model,base64:payload\.base64,mimeType:payload\.mimeType,detailed:payload\.detailed\}/.test(app) && !/body:JSON\.stringify\(payload\)/.test(app), 'server scan request excludes the browser API key');
check(/SERVER_NOT_CONFIGURED/.test(server) && !/body\.apiKey/.test(server), 'Netlify function requires its server-side key');

const adapter = require(path.join(ROOT, 'trussvision', 'vetin-export.js'));
const beam = {
    kind: 'beam',
    spatial: false,
    units: 'ft',
    forceUnit: 'lb',
    nodes: [
        { id: 'A', x: 0, y: 0, z: 0, support: 'pin' },
        { id: 'B', x: 10, y: 0, z: 0, support: 'roller' }
    ],
    members: [{ a: 'A', b: 'B' }],
    loads: [],
    pointLoads: [{ x: 5, fy: -10 }],
    distributedLoads: [],
    trapezoidalLoads: [],
    couples: []
};
const converted = adapter.convert(beam);
check(converted.version === 2 && converted.beam.length === 3.048, 'beam adapter converts length units');
check(converted.concentratedLoads[0].magnitude === 0.044482, 'beam adapter converts force units');

let rejected = false;
try {
    adapter.convert({ ...beam, kind: 'truss' });
} catch {
    rejected = true;
}
check(rejected, 'beam adapter rejects non-beam scenes');

const trussSolver = require(path.join(ROOT, 'trussvision', 'truss-solver.js'));
check(/truss-solver\.js/.test(html) && /TVTrussSolver/.test(app), 'browser loads the shared truss solver before the app module');
const triangle = {
    kind: 'truss', units: 'm', forceUnit: 'kN',
    nodes: [
        { id: 'A', x: 0, y: 0, z: 0, support: 'pin' },
        { id: 'B', x: 4, y: 0, z: 0, support: 'roller' },
        { id: 'C', x: 2, y: 3, z: 0, support: 'none' }
    ],
    members: [{ a: 'A', b: 'B' }, { a: 'A', b: 'C' }, { a: 'B', b: 'C' }],
    loads: [{ node: 'C', fx: 0, fy: -10 }],
    pointLoads: [], distributedLoads: [], couples: []
};
const triangleResult = trussSolver.solveTrussModel(triangle);
check(Math.abs(triangleResult.forces[0].displayForce - 3.3333333333) < 1e-8, 'current truss solver solves a stable triangle');
check(Math.abs(triangleResult.reactions[0].displayRy - 5) < 1e-8 && Math.abs(triangleResult.reactions[1].displayRy - 5) < 1e-8, 'current truss solver returns support reactions');
check(Math.abs(triangleResult.equilibrium.fx) < 1e-8 && Math.abs(triangleResult.equilibrium.fy) < 1e-8 && Math.abs(triangleResult.equilibrium.m) < 1e-8, 'current truss solver reports equilibrium residuals');
const exam = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'truss-benchmark.json'), 'utf8'));
const correctedExam = trussSolver.repairExamWallPin({...exam,nodes:exam.nodes.map(node => node.id==='G'?{...node,support:'roller'}:node)});
check(correctedExam.nodes.find(node => node.id==='G').support === 'pin' && correctedExam.supportCorrection, 'photographed wall pin is corrected when G is misread as a roller');
const uncertain = trussSolver.analyzeTrussScene({ ...triangle, nodes: triangle.nodes.map(node => ({ ...node, support: 'none' })) });
check(uncertain.uncertain && uncertain.warnings.some(warning => /no support/i.test(warning)), 'unsupported scans request support review');
let mechanismRejected = false;
try {
    trussSolver.solveTrussModel({ ...triangle, members: triangle.members.slice(0, 2) });
} catch {
    mechanismRejected = true;
}
check(mechanismRejected, 'unstable truss geometry is rejected');

const geminiSandbox = { console, globalThis: null };
geminiSandbox.globalThis = geminiSandbox;
vm.runInNewContext(read('trussvision/gemini-client.js'), geminiSandbox, { filename: 'trussvision/gemini-client.js' });
const sanitized = geminiSandbox.TVGemini.sanitize({
    kind: 'beam', units: 'm', forceUnit: 'kN', confidence: 0.8,
    nodes: [{ id: 'A', x: 0, y: 0, support: 'pin' }, { id: 'B', x: 4, y: 0, support: 'roller' }],
    members: [{ a: 'A', b: 'B' }], pointLoads: [], distributedLoads: [], loads: []
});
check(sanitized.kind === 'beam' && sanitized.nodes.length === 2 && Array.isArray(sanitized.warnings), 'AI scene sanitizer returns bounded scene data');

console.log(`\nTrussVision result: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);

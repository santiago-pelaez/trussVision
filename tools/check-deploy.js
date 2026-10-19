// Check the files needed by both public entrypoints before deployment.
// Run: node tools/check-deploy.js
//      node tools/check-deploy.js --list

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENTRIES = [
    { name: 'TrussVision landing', root: 'trussvision', html: 'trussvision/index.html' },
    { name: 'Statics Studio', root: 'trussvision', html: 'trussvision/workbench.html' },
    { name: 'Legacy TrussVision', root: 'trussvision', html: 'trussvision/legacy.html' },
    { name: 'Vetin', root: 'vetin', html: 'vetin/index.html', sw: 'vetin/sw.js', manifest: 'vetin/manifest.json' }
];

const isLocal = (ref) => ref && !/^(https?:|data:|mailto:|javascript:|#|\/\/)/i.test(ref);
const cleanRef = (ref) => ref.replace(/\\/g, '/').split(/[?#]/)[0];

function normalizeRelative(base, ref) {
    const clean = cleanRef(ref);
    const joined = clean.startsWith('/')
        ? clean.slice(1)
        : path.posix.join(base, clean);
    const normalized = path.posix.normalize(joined).replace(/^\.\//, '');
    return normalized === '.' ? '' : normalized;
}

function readHtmlReferences(root, entry) {
    const html = fs.readFileSync(path.join(root, entry.html), 'utf8');
    const code = html.replace(/<!--[\s\S]*?-->/g, '');
    const refs = new Set();
    const patterns = [
        /<script\b[^>]*\bsrc=["']([^"']+)["']/gi,
        /<link\b[^>]*\bhref=["']([^"']+)["']/gi,
        /<img\b[^>]*\bsrc=["']([^"']+)["']/gi
    ];
    for (const pattern of patterns) {
        for (const match of code.matchAll(pattern)) {
            if (isLocal(match[1])) refs.add(normalizeRelative(entry.root, match[1]));
        }
    }
    return [...refs].filter(Boolean);
}

function readServiceWorkerAssets(root, swPath, entryRoot) {
    const sw = fs.readFileSync(path.join(root, swPath), 'utf8');
    const block = /const\s+ASSETS\s*=\s*\[([\s\S]*?)\];/.exec(sw);
    if (!block) throw new Error(`${swPath} does not contain an ASSETS list`);
    return [...block[1].matchAll(/["']([^"']+)["']/g)]
        .map((match) => normalizeRelative(entryRoot, match[1]))
        .filter(Boolean);
}

function readManifestFiles(root, manifestPath, entryRoot) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestPath), 'utf8'));
    return [...(manifest.icons || []), ...(manifest.screenshots || [])]
        .map((item) => item && item.src)
        .filter(isLocal)
        .map((src) => normalizeRelative(entryRoot, src))
        .filter(Boolean);
}

function readRuntimeFiles(root) {
    const dir = path.join(root, 'vetin', 'models');
    return fs.readdirSync(dir)
        .filter((file) => /^model_\d+\.(json|svg)$/.test(file))
        .map((file) => `vetin/models/${file}`);
}

function checkDeploy(root = ROOT) {
    const errors = [];
    const files = new Set(['index.html', 'sw.js']);
    const exists = (relative) => fs.existsSync(path.join(root, relative));

    if (!exists('index.html')) errors.push('root index.html is missing');
    else {
        const rootHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
        if (!/trussvision\//i.test(rootHtml)) errors.push('root index.html does not redirect to TrussVision');
    }
    if (!exists('sw.js')) errors.push('root migration sw.js is missing');

    for (const entry of ENTRIES) {
        if (!exists(entry.html)) {
            errors.push(`${entry.html} is missing`);
            continue;
        }
        files.add(entry.html);

        const references = readHtmlReferences(root, entry);
        const html = fs.readFileSync(path.join(root, entry.html), 'utf8');
        if (entry.html === 'trussvision/index.html' && (!/id="workflowScan"/.test(html) || !/id="stage"/.test(html))) errors.push('TrussVision landing must retain the original interactive workflow, not redirect');
        if (entry.html === 'trussvision/legacy.html') {
            const app = fs.readFileSync(path.join(root, 'trussvision', 'app.js'), 'utf8');
            const exporter = fs.readFileSync(path.join(root, 'trussvision', 'vetin-export.js'), 'utf8');
            if (/Netlify uses the server function when available/i.test(html)) {
                errors.push('legacy HTML contains the retired deployment warning');
            }
            if (/\b(prompt|confirm|alert)\s*\(/.test(app + exporter)) {
                errors.push('TrussVision still uses a browser-native dialog');
            }
            if (!/id="workflowScan"/.test(html) || !/id="workflowReview"/.test(html) || !/id="workflowSolve"/.test(html)) {
                errors.push('legacy TrussVision is missing guided workflow');
            }
            if (!/id="loadDialog"/.test(html) || !/id="transferDialog"/.test(html)) {
                errors.push('legacy TrussVision is missing in-app dialogs');
            }
        }
        if (entry.html === 'trussvision/workbench.html') {
            if (!/id="modelCanvas"/.test(html) || !/core\/editor\.js/.test(html) || !/id="solve"/.test(html)) errors.push('new studio lacks its connected graph editor or solve controls');
        }
        if (entry.root === 'vetin' && !/tvimport/.test(html)) {
            errors.push('vetin/index.html is missing the explicit handoff guard');
        }
        references.forEach((relative) => {
            if (!exists(relative)) errors.push(`${entry.html} references missing ${relative}`);
            files.add(relative);
        });

        if (entry.sw) {
            if (!exists(entry.sw)) {
                errors.push(`${entry.sw} is missing`);
            } else {
                files.add(entry.sw);
                let assets = [];
                try {
                    assets = readServiceWorkerAssets(root, entry.sw, entry.root);
                } catch (error) {
                    errors.push(error.message);
                }
                const assetSet = new Set(assets);
                references.forEach((relative) => {
                    if (!assetSet.has(relative)) {
                        errors.push(`${entry.html} loads ${relative}, but ${entry.sw} does not cache it`);
                    }
                });
                assets.forEach((relative) => {
                    if (!exists(relative)) errors.push(`${entry.sw} caches missing ${relative}`);
                    files.add(relative);
                });
            }
        }

        if (entry.manifest) {
            if (!exists(entry.manifest)) {
                errors.push(`${entry.manifest} is missing`);
            } else {
                files.add(entry.manifest);
                try {
                    readManifestFiles(root, entry.manifest, entry.root).forEach((relative) => {
                        if (!exists(relative)) errors.push(`${entry.manifest} references missing ${relative}`);
                        files.add(relative);
                    });
                } catch (error) {
                    errors.push(`${entry.manifest} could not be checked: ${error.message}`);
                }
            }
        }
    }

    try {
        const { readModels, buildSource } = require('./build-models-data.js');
        const dataPath = path.join(root, 'vetin', 'models', 'models-data.js');
        const current = fs.readFileSync(dataPath, 'utf8').replace(/\r\n/g, '\n');
        if (current !== buildSource(readModels())) {
            errors.push('vetin/models/models-data.js is stale: run node tools/build-models-data.js');
        }
    } catch (error) {
        errors.push(`vetin/models/models-data.js could not be checked: ${error.message}`);
    }

    readRuntimeFiles(root).forEach((relative) => {
        if (!exists(relative)) errors.push(`runtime model file ${relative} is missing`);
        files.add(relative);
    });

    return { errors, files: [...files].filter(Boolean).sort() };
}

if (require.main === module) {
    const { errors, files } = checkDeploy();
    if (errors.length) {
        console.error('Deployment check FAILED:\n' + errors.map((error) => `  ✗ ${error}`).join('\n'));
    } else {
        console.log(`Deployment check passed (${files.length} referenced files).`);
    }
    if (process.argv.includes('--list')) {
        console.log('\nReferenced deployment files:');
        files.forEach((file) => console.log(`  ${file}`));
    }
    process.exit(errors.length ? 1 : 0);
}

module.exports = { checkDeploy };

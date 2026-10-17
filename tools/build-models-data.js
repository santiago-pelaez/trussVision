// tools/build-models-data.js
// models/model_*.json dosyalarından models/models-data.js dosyasını üretir.
// Çalıştırma: node tools/build-models-data.js
//
// Neden: Sayfa doğrudan dosyadan (file://) açıldığında tarayıcı JSON dosyalarının
// XHR/fetch ile okunmasını engeller; <script> ile yüklenen bu dosya ise her
// durumda çalışır. Asıl kaynak JSON dosyalarıdır; bir modeli değiştirdikten ya da
// ekledikten sonra bu betiği yeniden çalıştırın (tests/run-tests.js eşleşmeyi denetler).

'use strict';

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'vetin', 'models');

function readModels() {
    return fs.readdirSync(modelsDir)
        .map(f => /^model_(\d+)\.json$/.exec(f))
        .filter(Boolean)
        .sort((a, b) => Number(a[1]) - Number(b[1]))
        .reduce((all, m) => {
            all[`model_${m[1]}`] = JSON.parse(fs.readFileSync(path.join(modelsDir, m[0]), 'utf8'));
            return all;
        }, {});
}

function buildSource(models) {
    return '// models/models-data.js — OTOMATİK ÜRETİLDİ, elle düzenlemeyin.\n' +
        '// Kaynak: models/model_*.json · Üretmek için: node tools/build-models-data.js\n' +
        '// Hazır model galerisi (models-gallery.js) verileri buradan okur; böylece sayfa\n' +
        '// file:// ile açıldığında da modeller yüklenebilir.\n' +
        `window.VETIN_MODELS = ${JSON.stringify(models, null, 2)};\n`;
}

if (require.main === module) {
    const models = readModels();
    fs.writeFileSync(path.join(modelsDir, 'models-data.js'), buildSource(models));
    console.log(`models/models-data.js üretildi (${Object.keys(models).length} model).`);
}

module.exports = { readModels, buildSource };

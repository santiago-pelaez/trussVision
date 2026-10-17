// common/localization.js

/**
 * Sayfanın ilk HTML yapısını (toolbar, diagram kapları, footer vb.) oluşturur.
 * @param {string} lang - Başlangıçta kullanılacak dil kodu ('tr', 'en' vb.).
 */
function buildInitialHTML(lang) {
    // Çeviri değerleri HTML şablonlarına gömüldüğü için erişim anında
    // escape edilir; ileride dış kaynaklı çeviri eklenirse XSS kapısı kalmaz.
    const escapeHtml = (value) => String(value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const t = new Proxy(translations[lang], {
        get: (obj, key) => (typeof obj[key] === 'string' ? escapeHtml(obj[key]) : obj[key])
    });

    // Toolbar HTML'ini oluştur
    const toolbarHTML = `
        <div class="toolbar-scroll-wrapper">
            <button class="toolbar-scroll-btn toolbar-scroll-btn--left" id="toolbar-scroll-left"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
            <div class="toolbar-left">
            <div class="tool-group tool-group--actions">
                <p class="tool-group-title" data-i18n="actions">${t.actions}</p>
                <div class="tool-group-actions">
                    <button class="tool-button tool-button-large" id="tool-cursor" data-i18n-title="cursorTitle" title="${t.cursorTitle}" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="M 6 3 L 18 13 L 12.5 13.8 L 15.5 20 L 13 21 L 10 14.8 L 6 18.5 Z"></path></svg><span data-i18n="cursorTool">${t.cursorTool}</span></button>
                    <button class="tool-button tool-button-large" id="undo-btn" data-i18n-title="undoTitle" title="${t.undoTitle}" disabled><svg viewBox="0 0 24 24"><path d="M 9 14 L 4 9 L 9 4"></path><path d="M 4 9 H 14 a 5 5 0 0 1 0 10 H 11"></path></svg><span data-i18n="undo">${t.undo}</span></button>
                    <button class="tool-button tool-button-large" id="redo-btn" data-i18n-title="redoTitle" title="${t.redoTitle}" disabled><svg viewBox="0 0 24 24"><path d="M 15 14 L 20 9 L 15 4"></path><path d="M 20 9 H 10 a 5 5 0 0 0 0 10 H 13"></path></svg><span data-i18n="redo">${t.redo}</span></button>
                    <button class="tool-button tool-button-large" id="save-btn" data-i18n-title="saveTitle" title="${t.saveTitle}"><svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><path d="M17 21v-8H7v8M7 3v5h8"></path></svg><span data-i18n="save">${t.save}</span></button>
                    <div class="actions-stack">
                        <button class="tool-button" id="reset-btn" data-i18n-title="newConfirmTitle" title="${t.newConfirmTitle}"><svg viewBox="0 0 24 24"><path d="M 14 2 H 6 a 2 2 0 0 0 -2 2 v 16 a 2 2 0 0 0 2 2 h 12 a 2 2 0 0 0 2 -2 V 8 z"></path><path d="M 14 2 v 6 h 6 M 12 12 v 6 M 9 15 h 6"></path></svg><span data-i18n="appMenuNew">${t.appMenuNew}</span></button>
                        <button class="tool-button" id="open-btn" data-i18n-title="openTitle" title="${t.openTitle}"><svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg><span data-i18n="open">${t.open}</span></button>
                        <input type="file" id="file-input" accept=".json" style="display: none;" />
                    </div>
                </div>
            </div>
            <div class="tool-group tool-group--element">
                <p class="tool-group-title" data-i18n="elementGroup">${t.elementGroup}</p>
                <div class="tool-group-buttons">
                    <button class="tool-button active" id="tool-beam" data-i18n-title="beamTitle" title="${t.beamTitle}">
                        <svg viewBox="0 0 24 24"><path d="M 2 8 h 20 v 8 H 2 z"></path></svg>
                        <span data-i18n="beam">${t.beam}</span>
                    </button>
                </div>
            </div>
            <div class="tool-group tool-group--supports">
                <p class="tool-group-title" data-i18n="supports">${t.supports}</p>
                <div class="tool-group-buttons">
                    <button class="tool-button" id="tool-pin-support" data-i18n-title="pinSupportTitle" title="${t.pinSupportTitle}"><svg viewBox="0 0 24 24"><path d="m 12 8 L 5 17 L 19 17 Z M 2 19 l 19 0"></path></svg><span data-i18n="pinSupport">${t.pinSupport}</span></button>
                    <button class="tool-button" id="tool-fixed-support" data-i18n-title="fixedSupportTitle" title="${t.fixedSupportTitle}"><svg viewBox="0 0 24 24"><path d="M 8 2 V 22 M 8 4 L 3 9 M 8 10 L 3 15 M 8 16 L 3 21"></path></svg><span data-i18n="fixedSupport">${t.fixedSupport}</span></button>
                    <button class="tool-button" id="tool-roller-support" data-i18n-title="rollerSupportTitle" title="${t.rollerSupportTitle}"><svg viewBox="0 0 24 24"><path d="m 12 8 L 5 17 L 19 17 Z M 10 19 A 1 1 0 0 0 14 19 A 1 1 0 0 0 10 19"></path></svg><span data-i18n="rollerSupport">${t.rollerSupport}</span></button>
                    <button class="tool-button" id="tool-hinge" data-i18n-title="hingeTitle" title="${t.hingeTitle}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle></svg><span data-i18n="hinge">${t.hinge}</span></button>
                </div>
            </div>
            <div class="tool-group tool-group--loads">
                <p class="tool-group-title" data-i18n="loads">${t.loads}</p>
                <div class="tool-group-buttons tool-group-buttons--loads">
                    <button class="tool-button" id="tool-concentrated-load" data-i18n-title="pointLoadTitle" title="${t.pointLoadTitle}"><svg viewBox="0 0 24 24"><path d="M12 4v14m-4-4l4 4 4-4"></path></svg><span data-i18n="pointLoad">${t.pointLoad}</span></button>
                    <div class="loads-grid">
                        <button class="tool-button" id="tool-concentrated-moment" data-i18n-title="momentTitle" title="${t.momentTitle}"><svg viewBox="0 0 24 24"><path d="M 12 5 A 7 7 0 1 0 12 19 M 12 5 L 10 9 M 12 5 L 8 3"></path></svg><span data-i18n="bendingMoment">${t.bendingMoment}</span></button>
                        <button class="tool-button" id="tool-distributed-load" data-i18n-title="distLoadTitle" title="${t.distLoadTitle}"><svg viewBox="0 0 24 24"><path d="M 6 8 h 16 M 6 14 V 8 m 4 6 V 8 m 4 6 V 8 M 18 14 V 8 M 22 14 V 8 M 5 13 L 6 14 M 7 13 L 6 14 M 9 13 L 10 14 M 11 13 L 10 14 M 13 13 L 14 14 M 15 13 L 14 14 M 17 13 L 18 14 M 19 13 L 19 13 L 18 14 M 21 13 L 22 14 M 23 13 L 22 14"></path></svg><span data-i18n="distributedLoad">${t.distributedLoad}</span></button>
                        <button class="tool-button" id="tool-torsion-moment" data-i18n-title="torsionTitle" title="${t.torsionTitle}"><svg viewBox="0 0 24 24"><path d="M 2 12 H 22 M 18 9 L 22 12 L 18 15 M 15 9 L 19 12 L 15 15 M 6 15 L 2 12 L 6 9 M 9 15 L 5 12 L 9 9"></path></svg><span data-i18n="torsionMoment">${t.torsionMoment}</span></button>
                        <button class="tool-button" id="tool-triangular-load" data-i18n-title="trapLoadTitle" title="${t.trapLoadTitle}"><svg viewBox="0 0 24 24"><path d="M 2 14 M 22 4 L 2 14 M 6 14 V 12 m 4 2 V 10 m 4 4 V 8 M 18 14 V 6 M 22 14 V 4 M 5 13 L 6 14 M 7 13 L 6 14 M 9 13 L 10 14 M 11 13 L 10 14 M 13 13 L 14 14 M 15 13 L 14 14 M 17 13 L 18 14 M 19 13 L 19 13 L 18 14 M 21 13 L 22 14 M 23 13 L 22 14"></path></svg><span data-i18n="trapezoidalLoad">${t.trapezoidalLoad}</span></button>
                    </div>
                </div>
            </div>
            <div class="tool-group tool-group--settings">
                <p class="tool-group-title" data-i18n="settingsGroup">${t.settingsGroup || 'Settings'}</p>
                <div class="tool-group-actions tool-group-settings">
                    <button class="tool-button tool-button-large" id="tool-edit" data-i18n-title="editMoveTitle" title="${t.editMoveTitle}"><svg viewBox="0 0 24 24"><path d="M 18 2 l -9 9 l -2 5 l 5 -2 l 9 -9 l -3 -3 z M 10 10 l 3 3"></path></svg><span data-i18n="editMove">${t.editMove}</span></button>
                    <button class="tool-button tool-button-large settings-toggle" id="grid-settings-btn" type="button" aria-expanded="false" aria-controls="grid-popover" data-i18n-title="gridSettings" title="${t.gridSettings}"><svg viewBox="0 0 24 24"><path d="M 3 3 H 21 V 21 H 3 Z M 9 3 V 21 M 15 3 V 21 M 3 9 H 21 M 3 15 H 21"></path></svg><span data-i18n="gridSettings">${t.gridSettings}</span></button>
                    <button class="tool-button tool-button-large settings-toggle" id="material-settings-btn" type="button" aria-expanded="false" aria-controls="material-popover" data-i18n-title="materialProperties" title="${t.materialProperties}"><svg viewBox="0 0 24 24"><path d="M 4 5 H 20 M 4 19 H 20 M 12 5 V 19 M 8 5 V 7 M 16 5 V 7 M 8 17 V 19 M 16 17 V 19"></path></svg><span data-i18n="materialProperties">${t.materialProperties}</span></button>
                </div>
                <!-- Açılır ayar panelleri (actions.js/toggleSettingsPopover); giriş kimlikleri değişmedi -->
                <div class="settings-popover" id="grid-popover" role="dialog" aria-labelledby="grid-settings-btn" hidden>
                    <div class="grid-settings">
                    <div><label for="metersPerGrid" data-i18n="horizontal">${t.horizontal}</label><input type="number" id="metersPerGrid" value="0.2" min="0.1" step="0.1"><span>m</span></div>
                    <div><label for="kNPerGrid" data-i18n="vertical">${t.vertical}</label><input type="number" id="kNPerGrid" value="2" min="0.1" step="0.1"><span>kN</span></div>
                    <div><label for="gridSize" data-i18n="grid">${t.grid}</label><input type="number" id="gridSize" value="20" min="10"><span>px</span></div>
                </div>
                </div>
                <div class="settings-popover" id="material-popover" role="dialog" aria-labelledby="material-settings-btn" hidden>
                    <div class="grid-settings">
                    <div><label for="elasticityModulus" data-i18n="elasticityModulus">${t.elasticityModulus}</label><input type="number" id="elasticityModulus" value="200" min="1"><span>${t.unitGPA}</span></div>
                    <div><label for="momentOfInertia" data-i18n="momentOfInertia">${t.momentOfInertia}</label><input type="number" id="momentOfInertia" value="100000" min="1"><span>${t.unitCM4}</span></div>
                </div>
                </div>
            </div>
            </div>
            <button class="toolbar-scroll-btn toolbar-scroll-btn--right" id="toolbar-scroll-right"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></button>
        </div>
        <div class="toolbar-right">

        </div>
    `;
    document.querySelector('.toolbar').innerHTML = toolbarHTML;

    

    document.getElementById('modeling-area-title').setAttribute('data-i18n', 'structuralModel');
    document.getElementById('modeling-area-title').innerText = t.structuralModel;

    document.getElementById('download-model-btn').innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>`;
    document.getElementById('download-model-btn').setAttribute('title', t.downloadModelTitle);

    // DÜZELTME: Simgenin <path> elementine fill="currentColor" ve stroke="none" özellikleri eklendi.
    document.getElementById('center-btn').innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
    document.getElementById('center-btn').setAttribute('title', t.centerViewTitle);

    document.getElementById('fullscreen-btn').innerHTML = `<svg class="icon-expand" viewBox="0 0 24 24"><path d="M15 3h6v6l-2-2-4 4-2-2 4-4-2-2zM9 21H3v-6l2 2 4-4 2 2-4 4 2 2z"></path></svg><svg class="icon-shrink" viewBox="0 0 24 24" style="display: none;"><path d="m 20 2 M 10 14 L 4 14 L 6 16 L 2 20 L 4 22 L 8 18 L 10 20 L 10 14 M 14 10 L 20 10 L 18 8 L 22 4 L 20 2 L 16 6 L 14 4 L 14 10"></path></svg>`;
    document.getElementById('fullscreen-btn').setAttribute('title', t.fullscreenTitle);

    document.getElementById('cut-btn').setAttribute('title', t.cutMethodTitle);

    // SCD çizim seçenekleri: sağ üst köşede aç/kapa butonları
    const fbdLabel = (key) => t[key] || escapeHtml(translations.en[key]);
    const fbdOptionBtn = (option, key, icon) =>
        `<button type="button" class="canvas-overlay-btn fbd-option-btn" data-fbd-option="${option}" aria-pressed="${fbdDisplayOptions[option]}">${icon}<span data-i18n="${key}">${fbdLabel(key)}</span></button>`;
    const fbdOptionsHTML = `<div class="fbd-options" role="group" data-i18n-title="fbdOptionsTitle" title="${fbdLabel('fbdOptionsTitle')}">` +
        fbdOptionBtn('loads', 'fbdShowLoads', '<svg viewBox="0 0 24 24"><path d="M12 3v14M6.5 12 12 17.5 17.5 12"/><path d="M4 21h16"/></svg>') +
        fbdOptionBtn('reactions', 'fbdShowReactions', '<svg viewBox="0 0 24 24"><path d="M12 21V9M6.5 14 12 8.5 17.5 14"/><path d="M8 3h8"/></svg>') +
        `</div>`;

    const diagramsHTML = `
        <div id="diagram-grid">
            <div id="free-body-diagram-wrapper" class="diagram-container"><h4 data-i18n="freeBodyDiagram">${t.freeBodyDiagram}</h4><button id="download-fbd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden">${fbdOptionsHTML}<section id="gerber-parts-section" class="fbd-section" hidden><h5 class="fbd-section-title" data-i18n="gerberPartsCaption">${t.gerberPartsCaption}</h5><canvas id="gerberPartsCanvas"></canvas></section><section id="fbd-whole-section" class="fbd-section"><h5 class="fbd-section-title" id="fbd-whole-title" data-i18n="fbdWholeCaption" hidden>${t.fbdWholeCaption}</h5><canvas id="freeBodyDiagramCanvas"></canvas></section><p id="reactions-output"></p></div></div>
            <div id="normal-force-diagram-wrapper" class="diagram-container"><h4 data-i18n="normalForceDiagram">${t.normalForceDiagram}</h4><button id="download-nfd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden"><div class="diagram-wrapper"><canvas id="normalForceDiagram"></canvas></div></div></div>
            <div id="shear-force-diagram-wrapper" class="diagram-container"><h4 data-i18n="shearForceDiagram">${t.shearForceDiagram}</h4><button id="download-sfd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden"><div class="diagram-wrapper"><canvas id="shearForceDiagram"></canvas></div></div></div>
            <div id="bending-moment-diagram-wrapper" class="diagram-container"><h4 data-i18n="bendingMomentDiagram">${t.bendingMomentDiagram}</h4><button id="download-bmd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden"><div class="diagram-wrapper"><canvas id="bendingMomentDiagram"></canvas></div></div></div>
            <div id="torsion-moment-diagram-wrapper" class="diagram-container"><h4 data-i18n="torsionMomentDiagram">${t.torsionMomentDiagram}</h4><button id="download-tmd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden"><div class="diagram-wrapper"><canvas id="torsionMomentDiagram"></canvas></div></div></div>
        </div>
    `;
    document.getElementById('all-diagrams-container').innerHTML = diagramsHTML;
    
    const dataTablesHTML = `
        <div class="data-tables-header"><h4 data-i18n="dataTables">${t.dataTables}</h4><button id="download-tables-btn" class="download-btn" data-i18n-title="downloadData"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="hide">${ICON_EYE_HIDE}</button></div>
        <div class="table-grid-wrapper">
            <div class="table-grid">
                <div class="table-wrapper"><h3 data-i18n="beamTable">${t.beamTable}</h3><table id="beam-table"><thead><tr><th data-i18n="property">${t.property}</th><th data-i18n="valueM">${t.valueM}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="supportsTable">${t.supportsTable}</h3><table id="supports-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="type">${t.type}</th><th data-i18n="positionM">${t.positionM}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="distributedLoadsTable">${t.distributedLoadsTable}</h3><table id="distributed-loads-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="startM">${t.startM}</th><th data-i18n="endM">${t.endM}</th><th data-i18n="magnitudeKNM">${t.magnitudeKNM}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="trapezoidalLoadsTable">${t.trapezoidalLoadsTable}</h3><table id="trapezoidal-loads-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="startM">${t.startM}</th><th data-i18n="endM">${t.endM}</th><th data-i18n="magnitude1KNM">${t.magnitude1KNM}</th><th data-i18n="magnitude2KNM">${t.magnitude2KNM}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="concentratedLoadsTable">${t.concentratedLoadsTable}</h3><table id="concentrated-loads-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="positionM">${t.positionM}</th><th data-i18n="magnitudeKN">${t.magnitudeKN}</th><th data-i18n="angleDeg">${t.angleDeg}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="concentratedMomentsTable">${t.concentratedMomentsTable}</h3><table id="concentrated-moments-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="positionM">${t.positionM}</th><th data-i18n="magnitudeKNM2">${t.magnitudeKNM2}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="torsionMomentsTable">${t.torsionMomentsTable}</h3><table id="torsion-moments-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="positionM">${t.positionM}</th><th data-i18n="magnitudeTorsion">${t.magnitudeTorsion}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
            </div>
        </div>
    `;
    document.getElementById('data-tables-container').innerHTML = dataTablesHTML;

    const footerHTML = `
        <div class="footer-content">
            <div class="footer-text">
                <p><strong data-i18n="footerText1">${t.footerText1}</strong></p>
                <p>&copy; <span id="copyright-year"></span> · <a href="https://www.rasimtemur.com" target="_blank" rel="noopener noreferrer">Rasim Temür</a><span data-i18n="footerText2">${t.footerText2}</span> · <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" style="color: inherit;" data-i18n="mitLicense">${t.mitLicense || 'MIT License'}</a> · <a href="https://github.com/rasimtemur/vetin-beam" target="_blank" rel="noopener noreferrer" style="color: inherit; display: inline-flex; align-items: center; gap: 4px; vertical-align: -2px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display: block;"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>GitHub</a></p>
            </div>
            <div class="language-switcher">
                <button id="app-menu-toggle" data-i18n-title="menuTitle" title="${t.menuTitle || 'Menu'}" aria-haspopup="true" aria-controls="appMenu">
                    <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <line x1="4" y1="7" x2="20" y2="7"></line>
                        <line x1="4" y1="12" x2="20" y2="12"></line>
                        <line x1="4" y1="17" x2="20" y2="17"></line>
                    </svg>
                </button>
                <div id="appMenu" class="app-menu">
                    <button id="menu-new" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="12" x2="12" y2="18"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        <span data-i18n="appMenuNew">${t.appMenuNew || 'New'}</span>
                    </button>
                    <button id="menu-open" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span data-i18n="open">${t.open || 'Open'}</span>
                    </button>
                    <button id="menu-save" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span data-i18n="save">${t.save || 'Save'}</span>
                    </button>
                    <div class="app-menu-separator"></div>
                    <button id="menu-examples" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect>
                            <rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>
                        </svg>
                        <span data-i18n="examplesTitle">${t.examplesTitle || 'Examples'}</span>
                    </button>
                    <button id="menu-sign" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <line x1="12" y1="4" x2="12" y2="12"></line><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="18" x2="16" y2="18"></line>
                        </svg>
                        <span data-i18n="signConventionTitle">${t.signConventionTitle || 'Sign convention'}</span>
                    </button>
                    <div class="app-menu-separator"></div>
                    <button id="dark-mode-toggle" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path class="moon-icon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            <g class="sun-icon" style="display: none;">
                                <circle cx="12" cy="12" r="4"></circle>
                                <line x1="12" y1="2" x2="12" y2="4"></line>
                                <line x1="12" y1="20" x2="12" y2="22"></line>
                                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
                                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
                                <line x1="2" y1="12" x2="4" y2="12"></line>
                                <line x1="20" y1="12" x2="22" y2="12"></line>
                                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line>
                                <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"></line>
                            </g>
                        </svg>
                        <span data-i18n="appMenuView">${t.appMenuView || 'View'}</span>
                    </button>
                    <button id="about-toggle" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span data-i18n="appMenuAbout">${t.appMenuAbout || 'About'}</span>
                    </button>
                </div>
                <button data-lang="tr" title="Türkçe">TR</button>
                <button data-lang="en" title="English">EN</button>
                <button data-lang="de" title="Deutsch">DE</button>
                <button data-lang="cn" title="中文">CN</button>
                <button id="btnMoreLanguages" title="More Languages">+</button>
                <div id="languageDropdown" class="language-dropdown">
                    <!-- Diller buraya JS ile doldurulacak -->
                </div>
            </div>
            <div class="footer-socials"><a href="http://www.iuc.edu.tr"><img src="IUC.svg" width="160" height="43"></a></div>
        </div>
    `;
    document.querySelector('.page-footer').innerHTML = footerHTML;
}


function setLanguage(lang) {
  if (typeof ensureLanguageButtonExists === 'function') {
      ensureLanguageButtonExists(lang);
  }

  if (!translations[lang]) {
    console.warn(`Language '${lang}' not found. Defaulting to English.`);
    lang = 'en';
  }

  try { localStorage.setItem('selectedLanguage', lang); } catch (e) { /* depolama kapalı */ }
  document.documentElement.lang = lang;
  // Sağdan sola yazılan diller: metin akışı RTL, çizimler ve diyagramlar LTR kalır (bkz. common.css)
  document.documentElement.dir = ['ar', 'he', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    const translation = translations[lang][key] || translations.en[key];
    if (translation) {
      element.innerText = translation;
    } else {
      console.warn(`Translation key '${key}' not found for language '${lang}'.`);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.dataset.i18nTitle;
    const translation = translations[lang][key] || translations.en[key];
    if (translation) {
      element.setAttribute('title', translation);
    } else {
      console.warn(`Title translation key '${key}' not found for language '${lang}'.`);
    }
  });

  if (typeof updateAll === 'function') {
    updateAll();
  }

  if (typeof updateHintBox === 'function') {
    updateHintBox();
  }

  document.querySelectorAll('.language-switcher button[data-lang]').forEach(button => {
    button.classList.toggle('active', button.dataset.lang === lang);
  });

  if (typeof window.updateToolbarScrollArrows === 'function') {
      setTimeout(window.updateToolbarScrollArrows, 50);
  }
}
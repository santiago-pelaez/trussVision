// elastic-3d.js

let scene3d, camera3d, renderer3d, controls3d;
let beamGroup3d;
let currentBeamLength = 4;

function initElasticCurve3D() {
    const container = document.getElementById('elasticCurve3DCanvas');
    if (!container) return;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    scene3d = new THREE.Scene();
    scene3d.background = new THREE.Color(0xf0f2f5);

    camera3d = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera3d.position.set(2, 2, 8);
    camera3d.lookAt(0, 0, 0);

    renderer3d = new THREE.WebGLRenderer({ antialias: true });
    renderer3d.setSize(width, height);
    renderer3d.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer3d.domElement);

    if (THREE.OrbitControls) {
        controls3d = new THREE.OrbitControls(camera3d, renderer3d.domElement);
        controls3d.enableDamping = true;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene3d.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight1.position.set(10, 20, 10);
    scene3d.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-10, -10, 5);
    scene3d.add(directionalLight2);

    beamGroup3d = new THREE.Group();
    scene3d.add(beamGroup3d);

    animate3d();

    window.addEventListener('resize', onWindowResize3d);
    initElasticCurve3DControls();
    update3DTheme();
}

function animate3d() {
    requestAnimationFrame(animate3d);
    if (controls3d) controls3d.update();
    if (renderer3d && scene3d && camera3d) {
        renderer3d.render(scene3d, camera3d);
    }
}

function onWindowResize3d() {
    const container = document.getElementById('elasticCurve3DCanvas');
    if (!container || !camera3d || !renderer3d) return;

    camera3d.aspect = container.clientWidth / container.clientHeight;
    camera3d.updateProjectionMatrix();
    renderer3d.setSize(container.clientWidth, container.clientHeight);
}

function update3DTheme() {
    if (!scene3d) return;
    const isDarkMode = document.body.classList.contains('dark-mode');
    scene3d.background = new THREE.Color(isDarkMode ? 0x0F1419 : 0xffffff);
}

function drawElasticCurve3D() {
    if (!beamGroup3d || !beam) return;
    beamGroup3d.clear();
    update3DTheme();

    // Ensure canvas is resized to full container
    onWindowResize3d();

    // Ölçek değerini al (fonksiyon kapsamında mesnet/mafsal için de kullanılacak)
    let scaleY = 1;
    const scaleInput = document.getElementById('scale3DInput');
    if (scaleInput) {
        scaleY = parseFloat(scaleInput.value) || 1;
    }

    let dataPoints;
    if (diagramData.elasticCurve) {
        const { toMeters } = getConversionFunctions();
        const L = toMeters(beam.endX) - toMeters(beam.startX);
        
        const yData = diagramData.elasticCurve.datasets[0].data;
        let maxDisp = 0;
        for (const val of yData) {
            if (Math.abs(val) > maxDisp) maxDisp = Math.abs(val);
        }
        // scaleY zaten fonksiyon başında alındı, burada sadece fallback kontrolü
        if (!scaleInput && maxDisp > 0.000001) {
            // Eğer giriş yoksa otomatik ölçekle
            const targetMaxVisual = L * 0.10;
            scaleY = targetMaxVisual / maxDisp;
        }
        
        const rawPoints = diagramData.elasticCurve.labels.map((x, i) => {
            const y = yData[i];
            // y değeri metre cinsinden, ölçek değerini 0.001 ile çarp
            // x: metre (kiriş boyu), y: metre (deplasman) * ölçek * 0.001
            return new THREE.Vector3(x, y * scaleY * 0.001, 0);
        });
        
        // Filter very close points (< 0.1mm) to prevent Three.js geometry generation issues
        dataPoints = [];
        if (rawPoints.length > 0) {
            dataPoints.push(rawPoints[0]);
            for (let i = 1; i < rawPoints.length; i++) {
                // Check distance to last valid point
                if (rawPoints[i].distanceTo(dataPoints[dataPoints.length - 1]) > 0.0001) {
                     dataPoints.push(rawPoints[i]);
                }
            }
        }
    } else {
        // Fallback: Straight beam if no elastic curve data exists yet
        const { toMeters } = getConversionFunctions();
        const L = toMeters(beam.endX) - toMeters(beam.startX);
        dataPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(L, 0, 0)];
    }

    if (dataPoints.length < 2) return;

    // --- 1. Draw Deformed Beam (Square Section) ---
    const curve = new THREE.CatmullRomCurve3(dataPoints);
    const sectionSize = 0.15;
    
    // Create a square shape for extrusion
    const shape = new THREE.Shape();
    shape.moveTo(-sectionSize/2, -sectionSize/2);
    shape.lineTo(sectionSize/2, -sectionSize/2);
    shape.lineTo(sectionSize/2, sectionSize/2);
    shape.lineTo(-sectionSize/2, sectionSize/2);
    shape.lineTo(-sectionSize/2, -sectionSize/2);

    const extrudeSettings = {
        steps: dataPoints.length * 2,
        bevelEnabled: false,
        extrudePath: curve
    };

    const beamGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const isDarkMode = document.body.classList.contains('dark-mode');
    const basefill = new THREE.Color(0x389fb6);
    const bgFill = isDarkMode ? new THREE.Color(0x0F1419) : new THREE.Color(0xffffff);
    // Simulate 0.2 opacity on background for opaque fill
    const opaqueFill = basefill.clone().lerp(bgFill, 0.8);

    const beamMaterial = new THREE.MeshPhongMaterial({ 
        color: opaqueFill, 
        transparent: false,
        side: THREE.DoubleSide
    });
    const beamMesh = new THREE.Mesh(beamGeometry, beamMaterial);
    beamGroup3d.add(beamMesh);

    // Draw Edges (Border)
    const edges = new THREE.EdgesGeometry(beamGeometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x389fb6 }));
    beamGroup3d.add(line);

    // --- 2. Draw Supports ---
    const { toMeters } = getConversionFunctions();
    const beamStartM = toMeters(beam.startX);
    currentBeamLength = toMeters(beam.endX) - beamStartM;

    // Tüm mesnetler tek bir zemine oturur: zemin, en alçaktaki mesnet
    // noktasının SUPPORT_HEIGHT_3D kadar altındadır; her mesnet bu seviyeye uzatılır.
    const supportPoints = supports.map(s => {
        const x_m = toMeters(s.x) - beamStartM;
        // Deplasman metre cinsinden, ölçek * 0.001 ile çarp
        return { type: s.type, pos: new THREE.Vector3(x_m, getDeflectionAtX(x_m) * scaleY * 0.001, 0) };
    });
    if (supportPoints.length > 0) {
        const groundY = Math.min(...supportPoints.map(p => p.pos.y)) - SUPPORT_HEIGHT_3D;
        supportPoints.forEach(p => drawSupport3D(p.type, p.pos, groundY));
        drawGround3D(groundY, supportPoints.map(p => p.pos.x), currentBeamLength);
    }

    // --- 3. Draw Hinges ---
    hinges.forEach(h => {
        const x_m = toMeters(h.x) - beamStartM;
        // Deplasman metre cinsinden, ölçek * 0.001 ile çarp
        const y_val = getDeflectionAtX(x_m) * scaleY * 0.001;
        drawHinge3D(new THREE.Vector3(x_m, y_val, 0));
    });

    // --- 4. Draw Loads ---
    // drawLoads3D(toMeters, beamStartM); // Disabled per user request

    // Center view
    const L = toMeters(beam.endX) - beamStartM;
    currentBeamLength = L;
    
    // Auto-fit view when drawn
    if (typeof setView3D === 'function') {
        setView3D('fit');
    } else {
        if (controls3d) {
             controls3d.target.set(L/2, 0, 0);
        }
    }
}

function getDeflectionAtX(x) {
    if (!diagramData.elasticCurve) return 0;
    const labels = diagramData.elasticCurve.labels;
    const data = diagramData.elasticCurve.datasets[0].data;
    for (let i = 0; i < labels.length - 1; i++) {
        if (x >= labels[i] && x <= labels[i+1]) {
            const t = (x - labels[i]) / (labels[i+1] - labels[i]);
            return data[i] + t * (data[i+1] - data[i]);
        }
    }
    return 0;
}

// Mesnetin kiriş altından zemine kadar olan yüksekliği (pin mesnet prizması 0.25 + yarım kesit)
const SUPPORT_HEIGHT_3D = 0.325;

// Mesnet gövdesi: 2B üçgen sembolün z yönünde kalınlık verilmiş hali (üçgen prizma).
// Tepe kirişin altına, taban bottomY seviyesine gelir; z ekseninde ortalanır.
function createTriangularPrism3D(x, bottomY, height, material, baseWidth = 0.24, depth = 0.2) {
    const shape = new THREE.Shape();
    shape.moveTo(-baseWidth / 2, 0);
    shape.lineTo(baseWidth / 2, 0);
    shape.lineTo(0, height);
    shape.lineTo(-baseWidth / 2, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, bottomY, 0);
    return mesh;
}

// Mesnet parçasını sahneye kenarlarıyla birlikte ekler (kenar rengi drawSupport3D'de ayarlanır). WebGL çizgileri her zaman
// 1 px çizildiği için kalın kenarlık, kenarlar boyunca ince silindirlerle; köşeler
// de küçük kürelerle kapatılarak çizilir. Eğrisel yüzeylerde (makaralar) yalnızca
// belirgin kenarlar (EDGE_ANGLE üzeri) alınır.
const SUPPORT_EDGE_RADIUS_3D = 0.0025;
const SUPPORT_EDGE_ANGLE_3D = 30;
let supportEdgeMaterial3D = null;
// Ortak geometriler ilk kullanımda oluşturulur: dosya yüklenirken THREE'ye
// dokunulmaz, böylece Three.js yüklenemese de sayfanın geri kalanı çalışır.
let supportEdgeCylinder3D = null, supportEdgeJoint3D = null;

function addSupportPart3D(mesh) {
    beamGroup3d.add(mesh);

    if (!supportEdgeCylinder3D) {
        supportEdgeCylinder3D = new THREE.CylinderGeometry(1, 1, 1, 6);
        supportEdgeJoint3D = new THREE.SphereGeometry(1, 8, 6);
    }

    mesh.updateMatrix();
    const edges = new THREE.EdgesGeometry(mesh.geometry, SUPPORT_EDGE_ANGLE_3D);
    const p = edges.attributes.position;
    const up = new THREE.Vector3(0, 1, 0);
    const joints = new Map();
    const R = SUPPORT_EDGE_RADIUS_3D;

    for (let i = 0; i < p.count; i += 2) {
        const a = new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(mesh.matrix);
        const b = new THREE.Vector3().fromBufferAttribute(p, i + 1).applyMatrix4(mesh.matrix);
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        if (len < 1e-6) continue;

        const edge = new THREE.Mesh(supportEdgeCylinder3D, supportEdgeMaterial3D);
        edge.scale.set(R, len, R);
        edge.quaternion.setFromUnitVectors(up, dir.normalize());
        edge.position.addVectors(a, b).multiplyScalar(0.5);
        beamGroup3d.add(edge);

        [a, b].forEach(v => joints.set(`${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`, v));
    }
    joints.forEach(v => {
        const joint = new THREE.Mesh(supportEdgeJoint3D, supportEdgeMaterial3D);
        joint.scale.setScalar(R);
        joint.position.copy(v);
        beamGroup3d.add(joint);
    });
    edges.dispose();
}

function drawSupport3D(type, pos, groundY) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    // Açık renk dolgu + dolgunun birkaç ton koyusu kalın kenarlık: koyu tek renk gövde
    // zeminde ve kirişin yanında seçilmiyordu. polygonOffset, kenarlar dolguya gömülmesin diye.
    const fillColor = new THREE.Color(isDarkMode ? 0xb8c2cc : 0xe3e8ee);
    const mat = new THREE.MeshPhongMaterial({
        color: fillColor, shininess: 10,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
    // Kenar rengi dolgudan türetilir (aynı ton, %32 daha koyu); tema değişince de güncellenir
    if (!supportEdgeMaterial3D) supportEdgeMaterial3D = new THREE.MeshBasicMaterial();
    supportEdgeMaterial3D.color.copy(fillColor).offsetHSL(0, 0, -0.32);
    const sectionOffset = 0.075; // Half of section size
    const beamBottom = pos.y - sectionOffset;

    if (type === 'pin-support') {
        // Kiriş altından zemine kadar üçgen prizma
        addSupportPart3D(createTriangularPrism3D(pos.x, groundY, beamBottom - groundY, mat));
    } else if (type === 'roller-support') {
        // 2B sembolün 3B hali: üçgen prizma → taban plakası → zemine değen yan yana makaralar.
        // Makaralar z ekseni boyunca uzanan silindirlerdir (kiriş yönünde yuvarlanır).
        const r = 0.025, rollerCount = 5, plateT = 0.02, plateD = 0.24;
        // Plaka, makaraların yan yana değdiği genişliğin (0.27) %10 fazlası
        const plateW = (2 * r * rollerCount + 0.02) * 1.1;
        // Makaralar plaka boyunca eşit aralıkla dağıtılır; uçtakiler plaka kenarından
        // 0.01 içeride kalır (eski yerleşimdeki kenar payı)
        const edgeMargin = 0.01;
        const firstX = -plateW / 2 + edgeMargin + r;
        const spacing = (plateW - 2 * (edgeMargin + r)) / (rollerCount - 1);

        for (let i = 0; i < rollerCount; i++) {
            const roller = new THREE.Mesh(new THREE.CylinderGeometry(r, r, plateD, 16), mat);
            roller.rotation.x = Math.PI / 2;
            roller.position.set(pos.x + firstX + i * spacing, groundY + r, 0);
            addSupportPart3D(roller);
        }

        const plateBottom = groundY + 2 * r;
        const plate = new THREE.Mesh(new THREE.BoxGeometry(plateW, plateT, plateD), mat);
        plate.position.set(pos.x, plateBottom + plateT / 2, 0);
        addSupportPart3D(plate);

        const prismBottom = plateBottom + plateT;
        addSupportPart3D(createTriangularPrism3D(pos.x, prismBottom, Math.max(beamBottom - prismBottom, 0.01), mat));
    } else if (type === 'fixed-support') {
        // Plaka kirişin üstünden zemine kadar uzanır
        const top = pos.y + 0.2;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, top - groundY, 0.4), mat);
        mesh.position.set(pos.x, (top + groundY) / 2, 0);
        addSupportPart3D(mesh);
    }
}

// Bütün mesnetlerin oturduğu tek zemin: yarı saydam dolgu üzerinde ızgara.
// X yönünde kirişi ve tüm mesnetleri kapsar, Z yönünde kiriş ekseninde ortalanır.
function drawGround3D(groundY, supportXs, beamLength) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const lineColor = isDarkMode ? 0x5b6b80 : 0x8a939c;
    const fillColor = isDarkMode ? 0x1e293b : 0xcfd6dd;
    const cell = 0.2, margin = 0.4, halfDepth = 0.6;

    // Izgara çizgileri hücre katlarına denk gelsin diye sınırlar yuvarlanır
    const x0 = Math.floor((Math.min(0, ...supportXs) - margin) / cell) * cell;
    const x1 = Math.ceil((Math.max(beamLength, ...supportXs) + margin) / cell) * cell;

    const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(x1 - x0, 2 * halfDepth),
        new THREE.MeshBasicMaterial({ color: fillColor, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
    );
    fill.rotation.x = -Math.PI / 2; // PlaneGeometry XY → XZ
    fill.position.set((x0 + x1) / 2, groundY, 0);
    beamGroup3d.add(fill);

    const vertices = [];
    const nx = Math.round((x1 - x0) / cell), nz = Math.round(2 * halfDepth / cell);
    for (let i = 0; i <= nx; i++) {
        const x = x0 + i * cell;
        vertices.push(x, 0, -halfDepth, x, 0, halfDepth);
    }
    for (let j = 0; j <= nz; j++) {
        const z = -halfDepth + j * cell;
        vertices.push(x0, 0, z, x1, 0, z);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const grid = new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.9 }));
    grid.position.y = groundY - 0.001; // Dolguyla çakışıp titremesin
    beamGroup3d.add(grid);
}

function drawHinge3D(pos) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const color = isDarkMode ? 0xffffff : 0x333333;
    const geo = new THREE.SphereGeometry(0.06, 16, 16);
    const mat = new THREE.MeshPhongMaterial({ color: color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    beamGroup3d.add(mesh);
}

function drawLoads3D(toMeters, beamStartM) {
    const arrowColor = 0xe74c3c;
    
    concentratedLoads.forEach(l => {
        const x_m = toMeters(l.x) - beamStartM;
        const y_def = getDeflectionAtX(x_m) * 0.5;
        const pos = new THREE.Vector3(x_m, y_def, 0);
        
        const verticalForce = l.magnitude * Math.sin(l.angle);
        if (Math.abs(verticalForce) > 0.01) {
            const dir = new THREE.Vector3(0, verticalForce > 0 ? 1 : -1, 0);
            const arrowPos = pos.clone();
            if (verticalForce < 0) arrowPos.y += 0.85; // Move base up if force is downward
            else arrowPos.y -= 0.85; 

            const arrowHelper = new THREE.ArrowHelper(dir, arrowPos, 0.8, arrowColor, 0.15, 0.1);
            beamGroup3d.add(arrowHelper);
        }
    });

    distributedLoads.forEach(l => {
        const sM = toMeters(l.startX) - beamStartM;
        const eM = toMeters(l.endX) - beamStartM;
        const count = 6;
        for (let i = 0; i <= count; i++) {
            const x = sM + (eM - sM) * (i / count);
            const y_def = getDeflectionAtX(x) * 0.5;
            const pos = new THREE.Vector3(x, y_def, 0);
            const dir = new THREE.Vector3(0, -1, 0);
            const arrowPos = pos.clone().add(new THREE.Vector3(0, 0.5, 0));
            const arrowHelper = new THREE.ArrowHelper(dir, arrowPos, 0.45, arrowColor, 0.08, 0.05);
            beamGroup3d.add(arrowHelper);
        }
    });

    trapezoidalLoads.forEach(l => {
        const sM = toMeters(l.startX) - beamStartM;
        const eM = toMeters(l.endX) - beamStartM;
        const count = 6;
        for (let i = 0; i <= count; i++) {
            const x = sM + (eM - sM) * (i / count);
            const y_def = getDeflectionAtX(x) * 0.5;
            const pos = new THREE.Vector3(x, y_def, 0);
            const dir = new THREE.Vector3(0, -1, 0);
            const arrowPos = pos.clone().add(new THREE.Vector3(0, 0.5, 0));
            const arrowHelper = new THREE.ArrowHelper(dir, arrowPos, 0.45, arrowColor, 0.08, 0.05);
            beamGroup3d.add(arrowHelper);
        }
    });
}

function initElasticCurve3DControls() {
    const btnTop = document.getElementById('btn3DTop');
    const btnFront = document.getElementById('btn3DFront');
    const btnSide = document.getElementById('btn3DSide');
    const btnISO = document.getElementById('btn3DISO');
    const btnZoomIn = document.getElementById('btn3DZoomIn');
    const btnZoomOut = document.getElementById('btn3DZoomOut');
    const btnFit = document.getElementById('btn3DFitAll');

    if (btnTop) btnTop.onclick = () => setView3D('top');
    if (btnFront) btnFront.onclick = () => setView3D('front');
    if (btnSide) btnSide.onclick = () => setView3D('side');
    if (btnISO) btnISO.onclick = () => setView3D('iso');

    if (btnZoomIn) {
        btnZoomIn.onclick = () => {
            if (!controls3d || !camera3d) return;
            const dist = camera3d.position.distanceTo(controls3d.target);
            const newDist = dist * 0.8;
            const dir = new THREE.Vector3().subVectors(camera3d.position, controls3d.target).normalize();
            camera3d.position.copy(controls3d.target).add(dir.multiplyScalar(newDist));
            controls3d.update();
        };
    }
    if (btnZoomOut) {
        btnZoomOut.onclick = () => {
            if (!controls3d || !camera3d) return;
            const dist = camera3d.position.distanceTo(controls3d.target);
            const newDist = dist * 1.25;
            const dir = new THREE.Vector3().subVectors(camera3d.position, controls3d.target).normalize();
            camera3d.position.copy(controls3d.target).add(dir.multiplyScalar(newDist));
            controls3d.update();
        };
    }
    if (btnFit) {
        btnFit.onclick = () => setView3D('fit');
    }

    const scaleInput = document.getElementById('scale3DInput');
    if (scaleInput) {
        scaleInput.addEventListener('change', () => {
            if (typeof drawElasticCurve3D === 'function') drawElasticCurve3D();
        });
        // Also redraw on Enter key if needed, but 'change' covers it usually.
    }
}

function setView3D(view) {
    if (!controls3d || !camera3d) return;

    const L = currentBeamLength || 5;
    const cx = L / 2;
    
    // Calculate distance to fit L into 90% of horizontal FOV
    // d = (L/0.9) / (2 * aspect * tan(fov/2))
    const fovRad = camera3d.fov * Math.PI / 180;
    const fitDist = L / (0.9 * 2 * Math.tan(fovRad / 2) * camera3d.aspect);
    
    // For Side view, we fit the vertical deflection/section (Approx L*0.2)
    const fitDistSide = fitDist * 0.3;

    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

    switch(view) {
        case 'top': 
             camera3d.position.set(cx, fitDist, 0); 
             controls3d.target.set(cx, 0, 0); 
             document.getElementById('btn3DTop')?.classList.add('active');
             break;
        case 'front':
             camera3d.position.set(cx, 0, fitDist);
             controls3d.target.set(cx, 0, 0); 
             document.getElementById('btn3DFront')?.classList.add('active');
             break;
        case 'side':
             camera3d.position.set(L + fitDistSide, 0, 0);
             controls3d.target.set(L, 0, 0);
             document.getElementById('btn3DSide')?.classList.add('active');
             break;
        case 'iso':
             // Isometric view adjusted to fit
             camera3d.position.set(cx + fitDist * 0.7, fitDist * 0.7, fitDist * 0.7);
             controls3d.target.set(cx, 0, 0);
             document.getElementById('btn3DISO')?.classList.add('active');
             break;
        case 'fit':
             camera3d.position.set(cx, 0, fitDist);
             controls3d.target.set(cx, 0, 0);
             document.getElementById('btn3DFitAll')?.classList.add('active');
             document.getElementById('btn3DFront')?.classList.add('active');
             break;
    }
    
    controls3d.update();
}

// Export init function globally
window.initElasticCurve3D = initElasticCurve3D;

// translations-learning.js - Öğrenme özelliklerinin metinleri ve dil yedeği
//
// translations.js'ten sonra yüklenir. (1) Statik belirlilik mesajları, sonuç
// tablosu, işaret kabulü, adım adım çözüm, kesim yöntemi ve alıştırma modu
// metinlerini en/tr (ve varsa de) için ekler; (2) terminoloji düzeltmelerini
// uygular; (3) her dilde eksik kalan anahtarları İngilizceden tamamlar, böylece
// eksik bir anahtar yüzünden arayüz önceki dilde takılı kalmaz.
// Şablonlardaki {ad} yer tutucuları tFormat() ile doldurulur.

(function () {
    const add = {
        en: {
            // --- Statik belirlilik ---
            statusKindIsostatic: 'Statically determinate',
            statusKindHyperstatic: 'Statically indeterminate',
            statusKindUnstable: 'Unstable',
            statusIsostatic: 'Unknown reactions r = {r}, equations = {e} (3 equilibrium + {nh} hinge). Reactions follow from equilibrium.',
            statusNoBeam: 'Draw a beam to start.',
            statusNoSupports: 'The beam has no supports, so it can move freely (unstable). Add supports.',
            statusSupportOutside: 'A support lies outside the beam. Move it onto the beam.',
            statusHingeAtEnd: 'A hinge cannot be at the end of the beam. Place it at an interior point where two beam parts meet.',
            statusCoincidentSupports: 'Two supports are at the same point (x = {x} m), so their reactions cannot be separated. Move one of them.',
            statusCoincidentHinges: 'Two hinges are at the same point (x = {x} m). Remove one of them.',
            statusMechanism: 'Unstable (mechanism): unknown reactions r = {r} < equations {e} (3 equilibrium + {nh} hinge). Add a support or remove a hinge.',
            statusNoHorizontal: 'Unstable: no support restrains horizontal motion (r = {r} < {e}). At least one pinned or fixed support is needed.',
            statusHyperstatic: 'Statically indeterminate to degree {degree}: unknown reactions r = {r} > equations {e}. Equilibrium alone cannot give the reactions; this tool solves statically determinate beams only.',
            statusHorizontalHyperstatic: 'Indeterminate in the horizontal direction (degree {degree}): more than one support restrains horizontal motion and there is a horizontal load, so the axial reactions cannot be found.',
            statusIsostaticVertical: 'No horizontal load, so ΣFx = 0 is satisfied identically. Unknowns (vertical reactions and fixed-end moments) r = {r}, equations = {e} (ΣFy, ΣM + {nh} hinge). Reactions follow from equilibrium.',
            statusGeometric: 'Geometrically unstable: the number of unknowns is sufficient (r = {r}, equations {e}), but the arrangement of supports and hinges forms a mechanism (e.g. a part beyond a hinge has no support).',
            warnTorsionHyperstatic: 'More than one fixed support makes the beam statically indeterminate in torsion; the torsional moment diagram cannot be drawn.',

            // --- Diyaloglar ve tablolar ---
            loadDialogAngleHint: 'The angle is measured clockwise from the horizontal: 90° points down, 0° points right. Enter the magnitude as a positive number.',
            loadDialogDistHint: 'Positive intensity acts downward; a negative value acts upward.',
            loadDialogMomentHint: 'Positive value: clockwise couple.',
            loadDialogTorsionHint: 'Positive value: torque vector along +x (right-hand rule).',
            supportDialogTitle: 'Support', hingeDialogTitle: 'Internal Hinge', beamDialogTitle: 'Beam',
            beamLengthM: 'Beam length (m)', supportTypeLabel: 'Support type',
            tableEditTitle: 'Click to edit',
            tableColEdit: 'Edit',
            concentratedLoadsTable: 'Point Loads',
            concentratedMomentsTable: 'Concentrated Moments (Couples)',
            supportsTable: 'Supports and Hinges',
            magnitudeKNM: 'q (kN/m, + down)',
            magnitude1KNM: 'q₁ (kN/m, + down)',
            magnitude2KNM: 'q₂ (kN/m, + down)',
            loadDialogStartMagnitude: 'Start intensity q₁ (kN/m, + down)',
            loadDialogEndMagnitude: 'End intensity q₂ (kN/m, + down)',
            magnitudeKN: 'Magnitude (kN)',
            angleDeg: 'Angle (°, 90 = down)',
            magnitudeKNM2: 'Magnitude (kNm, + clockwise)',
            magnitudeTorsion: 'Magnitude (kNm)',
            momentTitle: 'Concentrated Moment (Couple)',
            bendingMoment: 'Moment',
            torsionTitle: 'Concentrated Torque',

            // --- Araç çubuğu: imleç, geri al, ileri al ---
            settingsGroup: 'Settings',
            gerberPartsCaption: 'Free-body diagrams of the parts separated at the internal hinges',
            fbdWholeCaption: 'Free-body diagram of the whole system',
            cutTorsionNote: 'Torque T is drawn as a moment vector (double arrowhead, right-hand rule); T > 0 points out of the cut face.',
            cursorTool: 'Pointer', cursorTitle: 'Pointer (selection) – clicking the model adds nothing',
            undo: 'Undo', undoTitle: 'Undo (Ctrl+Z)', redo: 'Redo', redoTitle: 'Redo (Ctrl+Y)',
            toolHints: { cursor: 'Pointer tool: clicking the model adds nothing. You can safely view the model and drag the cut line. Choose a tool from the menu to draw.' },

            // --- Öğrenme paneli ---
            learningPanelTitle: 'Solution and Learning',
            stepsTitle: 'Step-by-step solution', regionsTitle: 'Region equations', practiceTitle: 'Practice',

            // --- Adım adım çözüm ---
            leftPartShort: 'left', hingeEquationNote: 'forces left of the hinge, ↺ +',
            stepFbdTitle: 'Free body diagram and unknowns',
            stepFbdText: 'Replace each support by its reactions (pinned: two forces, roller: one force, fixed: two forces and a moment). Assume all unknowns act in the positive direction.',
            stepUnknowns: 'Unknown reactions',
            stepEquationCount: 'Equations: 3 equilibrium + {nh} hinge condition(s) = {e}',
            stepPartsTitle: 'Splitting at the hinges and solving part by part',
            stepPartsText: 'Separate the beam at each internal hinge: a hinge transmits a vertical force V but no moment. First solve the suspended part, which rests on the hinge(s) like a simple beam; then apply the hinge forces in the opposite direction (action–reaction) to the supporting parts and solve them.',
            partSuspended: 'suspended part — solved like a simple beam resting on the hinges',
            partCarrier: 'supporting part',
            partHeading: 'Part {from}–{to}',
            partTransferred: '{sym} = {value} kN {dir}, transferred from part {part} in the opposite direction (action–reaction)',
            partAgreement: 'All reactions agree with the solution of the whole system ✓',
            stepEquationCountVertical: 'There is no horizontal load, so ΣFx = 0 holds identically and the horizontal reactions are zero. Equations: ΣFy, ΣM + {nh} hinge condition(s) = {e}',
            verticalComponent: 'vertical', horizontalComponent: 'horizontal',
            stepLoadsTitle: 'Loads and resultants',
            stepLoadsNote: 'A distributed load is replaced by its resultant W acting at the centroid x̄ of the load diagram (only for the equilibrium of a whole part).',
            stepEquilibriumTitle: 'Equilibrium equations',
            stepEquilibriumNote: 'Forces: up and right positive. Moments: counter-clockwise (↺) positive. Each term is force × lever arm.',
            stepSolveText: 'Solving the equations:',
            stepNegativeNote: 'A negative value means the reaction acts opposite to the assumed (positive) direction.',
            stepCheckTitle: 'Check',
            stepCheckText: 'With the reactions found, moment equilibrium about another point ({name}) and vertical equilibrium must also be satisfied:',
            stepRegionsTitle: 'Regions and internal force functions',
            stepRegionsText: 'Between load and support points the loading is continuous, so V(x) and M(x) are single polynomials. Cut each region at a distance x and write the equilibrium of the left part:',
            stepCriticalTitle: 'Critical points',
            stepCriticalText: 'Where V changes sign (V = 0) the moment has a local extremum, since dM/dx = V.',
            stepNoZeroShear: 'V does not cross zero inside a region; the moment extremes occur at load or support points.',
            reportButton: 'Solution report (print / PDF)', reportTitle: 'Beam solution report', reportPopupBlocked: 'Allow pop-ups to open the report.',
            shareLinkLabel: 'model link',
            regionsIntro: 'For each region the distributed load q, shear V and moment M as functions of x. The table also checks the differential relation dM/dx = V.',
            regionsLocalToggle: 'Measure x from the start of each region (ξ = x − x₀)',
            colRegion: 'Region', downWord: 'down',
            regionsRules: 'Rules: if q is constant, V is linear and M is quadratic; if q is linear, V is quadratic and M is cubic; with no load V is constant and M is linear. A point load makes V jump; a couple makes M jump.',
            degree0: 'constant', degree1: 'linear', degree2: '2nd degree', degree3: '3rd degree',
            // --- Kesim yöntemi ---
            cutLeftPart: 'Left part', cutRightPart: 'Right part', cutPointShort: 'cut',
            cutEquationsTitle: 'Method of sections – equilibrium of the {part} (x = {x} m)',
            cutConventionLeft: 'On the right face of the left part N, V and M are drawn in their positive directions (N →, V ↓, M ↺). A negative result means the actual direction is opposite.',
            cutConventionRight: 'On the left face of the right part N, V and M are drawn in their positive directions (N ←, V ↑, M ↻). They are equal and opposite to the forces on the left part (action–reaction).',
            cutAtEventLeft: 'The cut is at a load/support point: the left part does not contain the force at this point, so the left-limit values are shown.',
            cutAtEventRight: 'The cut is at a load/support point: the right part does not contain the force at this point, so the right-limit values are shown.',
            areaLabel: 'Area', slopeLabel: 'slope',

            // --- Alıştırma ---
            practiceIntro: 'Solve the problem on paper first, then enter your answers. Diagrams, reactions and the solution stay hidden until you reveal them.',
            practiceLevel: 'Level', practiceSeed: 'Seed', practiceSeedPlaceholder: 'e.g. student number',
            practiceNew: 'New problem', practiceCurrent: 'Practise on this model',
            practiceHowTo: 'Choose a level and press “New problem” — the same seed (e.g. your student number) always gives the same problem. Or practise on the model currently on screen.',
            pqReactions: 'Support reactions (+ up, + right, moment + counter-clockwise)', pqShear: 'Shear force at critical points', pqMoment: 'Bending moment at critical points',
            pqExtreme: 'Point of zero shear and the moment there', pqShape: 'Curve type in each region',
            practiceCheck: 'Check', practiceHint: 'Hint', practiceReveal: 'Show solution', practiceScore: '{ok} / {total} correct',
            fbEmpty: 'No answer entered.', fbSign: 'The magnitude is right but the sign is wrong — check the sign convention (± button).',
            fbJumpV: 'This is the value on the other side of the point: a point load makes V jump here.',
            fbJumpM: 'This is the value on the other side of the point: a couple makes M jump here.',
            fbSwapped: 'This value belongs to another reaction — check which support each moment equation gives.',
            fbZeroShear: 'Find where V(x) = 0 in the region: set the V(x) expression to zero.',
            fbHinge: 'Remember: the bending moment at an internal hinge is zero.',
            fbWrong: 'Not correct. Re-check the free body diagram and the lever arms.',
            fbShapeWrong: 'Not correct. Use dV/dx = −q and dM/dx = V: each integration raises the degree by one.',
            hint1: 'Draw the free body diagram: replace each support by its unknown reactions and each distributed load by its resultant.',
            hint2: 'Write ΣM about the support with the most unknowns first — it gives the other reaction directly. Then use ΣFy.',
            hint3: 'The moment equation for this problem:',
            shareTitle: 'Share and assign', shareIntro: 'The link contains the model itself; nothing is sent to a server. A practice link opens the same problem for every student with the given seed.',
            shareCopy: 'Copy model link', sharePracticeCopy: 'Copy practice link', moodleExport: 'Moodle XML (numerical questions)',
            shareCopied: 'Link copied.', shareCopyFailed: 'Could not copy the link.',
            moodleIntro: 'For the beam shown (loads and dimensions in kN and m), find the requested value. Use the sign convention: forces up positive, moments counter-clockwise positive; internal moment positive when sagging.',
            moodleAskReaction: 'Support reaction {comp} ({unit}):', moodleAskMmax: 'Largest positive bending moment Mmax (kNm):', moodleAskMmin: 'Largest negative bending moment Mmin (kNm):',


            // --- Sonuçlar ---
            resultsTitle: 'Results',
            reactionsHeading: 'Support reactions',
            hingeForcesHeading: 'Hinge forces',
            extremesHeading: 'Extreme values',
            criticalPointsHeading: 'Critical points',
            colPoint: 'Point', colX: 'x (m)', colComponent: 'Component', colValue: 'Value', colDirection: 'Direction',
            colVleft: 'V⁻ (kN)', colVright: 'V⁺ (kN)', colMleft: 'M⁻ (kNm)', colMright: 'M⁺ (kNm)', colNote: 'Note',
            dirUp: '↑ up', dirDown: '↓ down', dirLeft: '← left', dirRight: '→ right', dirCW: '↻ clockwise', dirCCW: '↺ counter-clockwise',
            maxShear: 'Largest positive shear V', minShear: 'Largest negative shear V',
            maxMoment: 'Largest positive moment M', minMoment: 'Largest negative moment M', maxDeflection: 'Largest deflection δ',
            noteZeroShear: 'V = 0 → M extremum', noteJumpV: 'jump in V', noteJumpM: 'jump in M', noteHinge: 'hinge: M = 0',
            noteSupport: 'support', noteEnd: 'free end', hingeShearLabel: 'transmitted shear',

            // --- İşaret kabulü ---
            signConventionTitle: 'Sign convention',
            signConventionButton: 'Sign convention',
            signConventionIntro: 'Internal forces are defined on the cut faces of a beam segment. Positive directions:',
            signN: '<b>N</b> &gt; 0: tension (the force pulls away from the cut face).',
            signV: '<b>V</b> &gt; 0: on the right face of the left part the shear acts downward; on the left face of the right part, upward.',
            signM: '<b>M</b> &gt; 0: sagging — the bottom fibres are in tension. In the BMD positive moments are drawn below the axis (tension side).',
            signT: '<b>T</b> &gt; 0: the torque vector points away from the cut face (right-hand rule).',
            signLoads: 'Loads: point loads with angle measured clockwise from the horizontal (90° = down); distributed load q positive downward; couple positive clockwise.',
            signRelations: 'Differential relations (q positive downward): dV/dx = −q, dM/dx = V. A point load P causes a jump of −P in V; a clockwise couple M₀ causes a jump of +M₀ in M.',
            momentAxisNote: '+ down',

            // --- İpucu kutusu ---
            hintAddSupports: 'The beam is ready. Now add supports (pinned, roller or fixed).',
            hintAddLoads: 'Supports are in place. Add loads to see the diagrams.',
            hintExplore: 'Diagrams are ready. Turn on the method of sections (dashed-line button) or open the step-by-step solution.',
            hintBeamReplace: 'Drawing a new beam replaces the current one.',
            hintFixSystem: 'The system cannot be solved yet — see the status message above the free body diagram.',

            // --- Galeri ---
            examplesTitle: 'Examples',
            levelBasic: 'Basic', levelIntermediate: 'Intermediate', levelAdvanced: 'Advanced',
            galleryLevelGroupTitle: '{level}',

            // --- Diğer ---
            diagramValueLabels: 'Values',
            alertInvalidModel: 'The selected model file is invalid or damaged.',
            alertNothingToSave: 'There is no model to save.',
            alertModelLoadFailed: 'The model could not be loaded: {name}',
            dropModelHere: 'Drop the model file here',
            moreLanguages: 'More languages',
            menuTitle: 'Menu'
        },
        tr: {
            statusKindIsostatic: 'İzostatik',
            statusKindHyperstatic: 'Hiperstatik',
            statusKindUnstable: 'Labil',
            statusIsostatic: 'Bilinmeyen tepki sayısı r = {r}, denklem sayısı = {e} (3 denge + {nh} mafsal). Tepkiler denge denklemlerinden bulunur.',
            statusNoBeam: 'Başlamak için bir kiriş çizin.',
            statusNoSupports: 'Kirişte mesnet yok; kiriş serbestçe hareket eder (labil). Mesnet ekleyin.',
            statusSupportOutside: 'Bir mesnet kirişin dışında. Mesnedi kiriş üzerine taşıyın.',
            statusHingeAtEnd: 'Mafsal kiriş ucunda olamaz. Mafsalı iki kiriş parçasının birleştiği bir iç noktaya koyun.',
            statusCoincidentSupports: 'Aynı noktada (x = {x} m) iki mesnet var; tepkileri birbirinden ayrılamaz. Mesnetlerden birini taşıyın.',
            statusCoincidentHinges: 'Aynı noktada (x = {x} m) iki mafsal var. Birini silin.',
            statusMechanism: 'Labil (mekanizma): bilinmeyen tepki sayısı r = {r} < denklem sayısı {e} (3 denge + {nh} mafsal). Mesnet ekleyin ya da bir mafsalı kaldırın.',
            statusNoHorizontal: 'Labil: yatay hareketi tutan mesnet yok (r = {r} < {e}). En az bir sabit ya da ankastre mesnet gerekir.',
            statusHyperstatic: '{degree}. derece hiperstatik: bilinmeyen tepki sayısı r = {r} > denklem sayısı {e}. Denge denklemleri tepkileri bulmaya yetmez; bu araç yalnızca izostatik kirişleri çözer.',
            statusHorizontalHyperstatic: 'Yatayda {degree}. derece hiperstatik: birden fazla mesnet yatay hareketi tutuyor ve yatay yük var; eksenel tepkiler belirlenemez.',
            statusIsostaticVertical: 'Yatay yük yok, ΣFx = 0 özdeş olarak sağlanır. Bilinmeyenler (düşey tepkiler ve ankastre momentleri) r = {r}, denklem sayısı = {e} (ΣFy, ΣM + {nh} mafsal). Tepkiler denge denklemlerinden bulunur.',
            statusGeometric: 'Geometrik olarak labil: bilinmeyen sayısı yeterli (r = {r}, denklem {e}) ama mesnet ve mafsalların yerleşimi bir mekanizma oluşturuyor (ör. mafsalın bir yanındaki parçada mesnet yok).',
            warnTorsionHyperstatic: 'Birden fazla ankastre mesnet burulmada hiperstatiktir; burulma momenti diyagramı çizilemez.',
            warnMultiHinge: 'Çok mafsallı sistemler desteklenir.',

            loadDialogAngleHint: 'Açı yataydan saat yönünde ölçülür: 90° aşağı, 0° sağa doğrudur. Şiddeti pozitif girin.',
            loadDialogDistHint: 'Pozitif şiddet aşağı yönlüdür; negatif değer yukarı yönlü yük demektir.',
            loadDialogMomentHint: 'Pozitif değer: saat yönünde kuvvet çifti.',
            loadDialogTorsionHint: 'Pozitif değer: moment vektörü +x yönünde (sağ el kuralı).',
            supportDialogTitle: 'Mesnet', hingeDialogTitle: 'Ara Mafsal', beamDialogTitle: 'Kiriş',
            beamLengthM: 'Kiriş boyu (m)', supportTypeLabel: 'Mesnet türü',
            tableEditTitle: 'Düzenlemek için tıklayın',
            tableColEdit: 'Düzenle',
            concentratedLoadsTable: 'Tekil Yükler',
            concentratedMomentsTable: 'Tekil Momentler (Kuvvet Çiftleri)',
            supportsTable: 'Mesnetler ve Mafsallar',
            type: 'Tür',
            magnitudeKNM: 'q (kN/m, + aşağı)',
            magnitude1KNM: 'q₁ (kN/m, + aşağı)',
            magnitude2KNM: 'q₂ (kN/m, + aşağı)',
            loadDialogStartMagnitude: 'Başlangıç şiddeti q₁ (kN/m, + aşağı)',
            loadDialogEndMagnitude: 'Bitiş şiddeti q₂ (kN/m, + aşağı)',
            magnitudeKN: 'Şiddet (kN)',
            angleDeg: 'Açı (°, 90 = aşağı)',
            magnitudeKNM2: 'Şiddet (kNm, + saat yönü)',
            magnitudeTorsion: 'Şiddet (kNm)',
            momentTitle: 'Tekil Moment (Kuvvet Çifti)',
            bendingMoment: 'Moment',
            torsionTitle: 'Tekil Burulma Momenti',
            torsionMomentDiagram: 'Burulma Momenti Diyagramı (BuMD)',
            displacementScale: 'Sehim Ölçeği:',
            resetConfirmTitle: 'Model sıfırlansın mı?',
            diagramAxes: { displacement: 'Sehim' },

            leftPartShort: 'sol', hingeEquationNote: 'mafsalın solundaki kuvvetler, ↺ +',
            stepFbdTitle: 'Serbest cisim diyagramı ve bilinmeyenler',
            stepFbdText: 'Her mesnedi tepkileriyle değiştirin (sabit: iki kuvvet, hareketli: bir kuvvet, ankastre: iki kuvvet ve bir moment). Bilinmeyenleri pozitif yönde kabul edin.',
            stepUnknowns: 'Bilinmeyen tepkiler',
            stepEquationCount: 'Denklemler: 3 denge + {nh} mafsal koşulu = {e}',
            stepPartsTitle: 'Mafsallardan ayırma ve parça parça çözüm',
            stepPartsText: 'Kirişi her ara mafsaldan ayırın: mafsal düşey kuvvet V aktarır, moment aktarmaz. Önce mafsal(lar)a oturan asılı parçayı basit kiriş gibi çözün; sonra mafsal kuvvetlerini ters yönde (etki–tepki) taşıyıcı parçalara yük olarak uygulayıp onları çözün.',
            partSuspended: 'asılı parça — mafsallara oturan basit kiriş gibi çözülür',
            partCarrier: 'taşıyıcı parça',
            partHeading: 'Parça {from}–{to}',
            partTransferred: '{sym} = {value} kN {dir}, {part} parçasından ters yönde aktarılır (etki–tepki)',
            partAgreement: 'Tüm tepkiler, sistemin bütün olarak çözümüyle aynıdır ✓',
            stepEquationCountVertical: 'Yatay yük olmadığından ΣFx = 0 özdeş olarak sağlanır ve yatay tepkiler sıfırdır. Denklemler: ΣFy, ΣM + {nh} mafsal koşulu = {e}',
            verticalComponent: 'düşey', horizontalComponent: 'yatay',
            stepLoadsTitle: 'Yükler ve bileşkeleri',
            stepLoadsNote: 'Yayılı yük, yük diyagramının ağırlık merkezi x̄ noktasında etkiyen bileşkesi W ile değiştirilir (yalnızca bir parçanın bütün dengesi için).',
            stepEquilibriumTitle: 'Denge denklemleri',
            stepEquilibriumNote: 'Kuvvetler: yukarı ve sağa pozitif. Momentler: saat yönünün tersi (↺) pozitif. Her terim kuvvet × kol uzunluğudur.',
            stepSolveText: 'Denklemler çözülürse:',
            stepNegativeNote: 'Negatif değer, tepkinin kabul edilen (pozitif) yönün tersine etkidiğini gösterir.',
            stepCheckTitle: 'Kontrol',
            stepCheckText: 'Bulunan tepkilerle başka bir noktaya ({name}) göre moment dengesi ve düşey denge de sağlanmalıdır:',
            stepRegionsTitle: 'Bölgeler ve kesit tesiri fonksiyonları',
            stepRegionsText: 'Yük ve mesnet noktaları arasında yükleme süreklidir; V(x) ve M(x) tek bir polinomdur. Her bölgeyi x uzaklığında kesip sol parçanın dengesini yazın:',
            stepCriticalTitle: 'Kritik noktalar',
            stepCriticalText: 'V işaret değiştirdiğinde (V = 0) moment yerel ekstremum yapar, çünkü dM/dx = V.',
            stepNoZeroShear: 'V bölge içinde sıfırdan geçmiyor; moment ekstremumları yük ya da mesnet noktalarındadır.',
            reportButton: 'Çözüm raporu (yazdır / PDF)', reportTitle: 'Kiriş çözüm raporu', reportPopupBlocked: 'Raporu açmak için açılır pencerelere izin verin.',
            shareLinkLabel: 'model bağlantısı',
            regionsIntro: 'Her bölge için yayılı yük q, kesme V ve moment M ifadeleri (x\'e bağlı). Tablo ayrıca dM/dx = V bağıntısını denetler.',
            regionsLocalToggle: 'x\'i her bölgenin başından ölç (ξ = x − x₀)',
            colRegion: 'Bölge', downWord: 'aşağı',
            regionsRules: 'Kurallar: q sabitse V doğrusal, M ikinci derecedir; q doğrusal ise V ikinci, M üçüncü derecedir; yük yoksa V sabit, M doğrusaldır. Tekil yük V\'de, kuvvet çifti M\'de sıçrama yapar.',
            degree0: 'sabit', degree1: 'doğrusal', degree2: '2. derece', degree3: '3. derece',
            cutLeftPart: 'Sol parça', cutRightPart: 'Sağ parça', cutPointShort: 'kesit',
            cutEquationsTitle: 'Kesim yöntemi – {part} dengesi (x = {x} m)',
            cutConventionLeft: 'Sol parçanın sağ yüzünde N, V ve M pozitif yönlerinde çizilir (N →, V ↓, M ↺). Sonuç negatifse gerçek yön terstir.',
            cutConventionRight: 'Sağ parçanın sol yüzünde N, V ve M pozitif yönlerinde çizilir (N ←, V ↑, M ↻). Sol parçadakilerle eşit ve zıt yönlüdür (etki–tepki).',
            cutAtEventLeft: 'Kesit bir yük/mesnet noktasında: bu noktadaki kuvvet sol parçada değildir; sol limit değerleri gösterilir.',
            cutAtEventRight: 'Kesit bir yük/mesnet noktasında: bu noktadaki kuvvet sağ parçada değildir; sağ limit değerleri gösterilir.',
            areaLabel: 'Alan', slopeLabel: 'eğim',
            practiceIntro: 'Önce problemi kâğıt üzerinde çözün, sonra cevaplarınızı girin. Siz açana kadar diyagramlar, tepkiler ve çözüm gizli kalır.',
            practiceLevel: 'Düzey', practiceSeed: 'Tohum', practiceSeedPlaceholder: 'ör. öğrenci numarası',
            practiceNew: 'Yeni problem', practiceCurrent: 'Bu modelle alıştırma yap',
            practiceHowTo: 'Bir düzey seçip “Yeni problem”e basın; aynı tohum (ör. öğrenci numaranız) her zaman aynı problemi verir. Ya da ekrandaki modelle alıştırma yapın.',
            pqReactions: 'Mesnet tepkileri (+ yukarı, + sağa, moment + saat yönünün tersi)', pqShear: 'Kritik noktalarda kesme kuvveti', pqMoment: 'Kritik noktalarda eğilme momenti',
            pqExtreme: 'Kesmenin sıfır olduğu nokta ve oradaki moment', pqShape: 'Her bölgede eğri türü',
            practiceCheck: 'Denetle', practiceHint: 'İpucu', practiceReveal: 'Çözümü göster', practiceScore: '{ok} / {total} doğru',
            fbEmpty: 'Cevap girilmedi.', fbSign: 'Büyüklük doğru, işaret yanlış; işaret kabulünü kontrol edin (± düğmesi).',
            fbJumpV: 'Bu, noktanın öteki yanındaki değer: tekil yük burada V\'de sıçrama yapar.',
            fbJumpM: 'Bu, noktanın öteki yanındaki değer: kuvvet çifti burada M\'de sıçrama yapar.',
            fbSwapped: 'Bu değer başka bir tepkiye ait; her moment denkleminin hangi tepkiyi verdiğini kontrol edin.',
            fbZeroShear: 'Bölgede V(x) = 0 olan noktayı bulun: V(x) ifadesini sıfıra eşitleyin.',
            fbHinge: 'Unutmayın: ara mafsalda eğilme momenti sıfırdır.',
            fbWrong: 'Doğru değil. Serbest cisim diyagramını ve kol uzunluklarını yeniden kontrol edin.',
            fbShapeWrong: 'Doğru değil. dV/dx = −q ve dM/dx = V bağıntılarını kullanın: her integral dereceyi bir artırır.',
            hint1: 'Serbest cisim diyagramını çizin: her mesnedi bilinmeyen tepkileriyle, her yayılı yükü bileşkesiyle değiştirin.',
            hint2: 'Önce en çok bilinmeyenin geçtiği mesnede göre ΣM yazın; diğer tepkiyi doğrudan verir. Sonra ΣFy kullanın.',
            hint3: 'Bu problemin moment denklemi:',
            shareTitle: 'Paylaş ve ödev ver', shareIntro: 'Bağlantı modelin kendisini içerir; hiçbir veri sunucuya gönderilmez. Alıştırma bağlantısı, verilen tohumla her öğrenciye aynı problemi açar.',
            shareCopy: 'Model bağlantısını kopyala', sharePracticeCopy: 'Alıştırma bağlantısını kopyala', moodleExport: 'Moodle XML (sayısal sorular)',
            shareCopied: 'Bağlantı kopyalandı.', shareCopyFailed: 'Bağlantı kopyalanamadı.',
            moodleIntro: 'Şekildeki kiriş için (yükler ve ölçüler kN ve m) istenen değeri bulun. İşaret kabulü: kuvvetler yukarı pozitif, momentler saat yönünün tersi pozitif; iç moment sehim (alt lif çekme) yönünde pozitif.',
            moodleAskReaction: 'Mesnet tepkisi {comp} ({unit}):', moodleAskMmax: 'En büyük pozitif eğilme momenti Mmax (kNm):', moodleAskMmin: 'En büyük negatif eğilme momenti Mmin (kNm):',
            settingsGroup: 'Ayarlar',
            gerberPartsCaption: 'Ara mafsallardan ayrılmış parçaların serbest cisim diyagramları',
            fbdWholeCaption: 'Bütün sistemin serbest cisim diyagramı',
            cutTorsionNote: 'Burulma momenti T, moment vektörü olarak (çift uçlu ok, sağ el kuralı) çizilir; T > 0 vektörü kesit yüzünden dışarı doğrudur.',
            cursorTool: 'İmleç', cursorTitle: 'İmleç (seçim) – modele tıklamak eleman eklemez',
            undo: 'Geri al', undoTitle: 'Geri al (Ctrl+Z)', redo: 'İleri al', redoTitle: 'İleri al (Ctrl+Y)',
            learningPanelTitle: 'Çözüm ve Öğrenme',
            stepsTitle: 'Adım adım çözüm', regionsTitle: 'Bölge ifadeleri', practiceTitle: 'Alıştırma',
            resultsTitle: 'Sonuçlar',
            reactionsHeading: 'Mesnet tepkileri',
            hingeForcesHeading: 'Mafsal kuvvetleri',
            extremesHeading: 'Uç değerler',
            criticalPointsHeading: 'Kritik noktalar',
            colPoint: 'Nokta', colX: 'x (m)', colComponent: 'Bileşen', colValue: 'Değer', colDirection: 'Yön',
            colVleft: 'V⁻ (kN)', colVright: 'V⁺ (kN)', colMleft: 'M⁻ (kNm)', colMright: 'M⁺ (kNm)', colNote: 'Not',
            dirUp: '↑ yukarı', dirDown: '↓ aşağı', dirLeft: '← sola', dirRight: '→ sağa', dirCW: '↻ saat yönü', dirCCW: '↺ saat yönünün tersi',
            maxShear: 'En büyük pozitif kesme V', minShear: 'En büyük negatif kesme V',
            maxMoment: 'En büyük pozitif moment M', minMoment: 'En büyük negatif moment M', maxDeflection: 'En büyük sehim δ',
            noteZeroShear: 'V = 0 → M ekstremum', noteJumpV: 'V\'de sıçrama', noteJumpM: 'M\'de sıçrama', noteHinge: 'mafsal: M = 0',
            noteSupport: 'mesnet', noteEnd: 'serbest uç', hingeShearLabel: 'aktarılan kesme',

            signConventionTitle: 'İşaret kabulü',
            signConventionButton: 'İşaret kabulü',
            signConventionIntro: 'Kesit tesirleri, kiriş parçasının kesit yüzlerinde tanımlanır. Pozitif yönler:',
            signN: '<b>N</b> &gt; 0: çekme (kuvvet kesit yüzünden dışarı doğru çeker).',
            signV: '<b>V</b> &gt; 0: sol parçanın sağ yüzünde kesme kuvveti aşağı, sağ parçanın sol yüzünde yukarı doğrudur.',
            signM: '<b>M</b> &gt; 0: alt lifler çekmede (sehim momenti). EMD\'de pozitif momentler eksenin altına (çekme tarafına) çizilir.',
            signT: '<b>T</b> &gt; 0: moment vektörü kesit yüzünden dışarı doğrudur (sağ el kuralı).',
            signLoads: 'Yükler: tekil yükün açısı yataydan saat yönünde ölçülür (90° = aşağı); yayılı yük q aşağı yönde pozitif; kuvvet çifti saat yönünde pozitif.',
            signRelations: 'Diferansiyel bağıntılar (q aşağı pozitif): dV/dx = −q, dM/dx = V. Tekil yük P, V\'de −P kadar; saat yönündeki kuvvet çifti M₀, M\'de +M₀ kadar sıçrama yapar.',
            momentAxisNote: '+ aşağı',

            hintAddSupports: 'Kiriş hazır. Şimdi mesnetleri ekleyin (sabit, hareketli ya da ankastre).',
            hintAddLoads: 'Mesnetler yerleşti. Diyagramları görmek için yük ekleyin.',
            hintExplore: 'Diyagramlar hazır. Kesim yöntemini (kesikli çizgi düğmesi) açın ya da adım adım çözümü inceleyin.',
            hintBeamReplace: 'Yeni bir kiriş çizerseniz mevcut kirişin yerini alır.',
            hintFixSystem: 'Sistem henüz çözülemiyor; serbest cisim diyagramının üstündeki durum mesajına bakın.',
            toolHints: {
                distributedLoad: 'Başlangıç noktasına tıklayın, fareyle şiddeti seçip ikinci kez tıklayın, bitiş noktasında üçüncü kez tıklayın. Değerleri açılan pencerede düzeltebilirsiniz.',
                triangularLoad: 'Başlangıç noktasına tıklayın; ikinci tıklama başlangıç şiddetini, üçüncü tıklama bitiş noktasını ve şiddetini belirler. Değerleri açılan pencerede düzeltebilirsiniz.',
                concentratedMoment: 'Kuvvet çiftini belirlemek için kiriş üzerinde tıklayıp dikey olarak sürükleyin.',
                torsionMoment: 'Burulma momentini belirlemek için kiriş üzerinde tıklayıp dikey olarak sürükleyin.',
                cursor: 'İmleç: modele tıklamak eleman eklemez. Modeli güvenle inceleyebilir, kesim çizgisini sürükleyebilirsiniz. Çizmek için menüden bir araç seçin.',
                edit: 'Değerleri düzenlemek için bir elemana tıklayın, taşımak için sürükleyin. Silmek için Delete tuşunu, fare tekerleğini ya da tablodaki çöp kutusunu kullanın.'
            },

            examplesTitle: 'Örnekler',
            levelBasic: 'Temel', levelIntermediate: 'Orta', levelAdvanced: 'İleri',
            galleryLevelGroupTitle: '{level}',

            diagramValueLabels: 'Değerler',
            alertInvalidModel: 'Seçilen model dosyası geçersiz ya da bozuk.',
            alertNothingToSave: 'Kaydedilecek bir model bulunmuyor.',
            alertModelLoadFailed: 'Model yüklenemedi: {name}',
            dropModelHere: 'Model dosyasını buraya sürükleyin',
            moreLanguages: 'Diğer diller',
            menuTitle: 'Menü'
        },
        de: {
            statusKindIsostatic: 'Statisch bestimmt',
            statusKindHyperstatic: 'Statisch unbestimmt',
            statusKindUnstable: 'Kinematisch (instabil)'
        }
    };

    const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
    const merge = (target, src) => {
        Object.keys(src).forEach(k => {
            if (isPlainObject(src[k])) { if (!isPlainObject(target[k])) target[k] = {}; merge(target[k], src[k]); }
            else target[k] = src[k];
        });
    };
    // Eksik anahtarları kaynaktan doldurur (var olanlara dokunmaz)
    const fill = (target, src) => {
        Object.keys(src).forEach(k => {
            if (isPlainObject(src[k])) { if (!isPlainObject(target[k])) target[k] = {}; fill(target[k], src[k]); }
            else if (target[k] === undefined || target[k] === '') target[k] = src[k];
        });
    };

    Object.keys(add).forEach(lang => { if (translations[lang]) merge(translations[lang], add[lang]); });
    Object.keys(translations).forEach(lang => { if (lang !== 'en') fill(translations[lang], translations.en); });
})();

/** Etkin dildeki metin (yoksa İngilizce), {ad} yer tutucuları params ile doldurulur. */
function tFormat(key, params = {}) {
    const lang = document.documentElement.lang || 'tr';
    const t = translations[lang] || translations.en;
    let s = (t && t[key]) || translations.en[key] || key;
    Object.keys(params).forEach(k => { s = s.split(`{${k}}`).join(params[k]); });
    return s;
}

/* Optional static-host Gemini adapter.
 *
 * GitHub Pages and Python's static server cannot run the Netlify function.
 * This adapter keeps the API key in memory and sends it directly to Gemini
 * only when the same-origin /api/analyze endpoint is unavailable.
 */
(function (root) {
  'use strict';

  const MODELS = new Set(['gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.6-flash']);
  const TYPES = new Set(['truss', 'beam', 'frame2d', 'force2d', 'friction2d', 'pulley2d', 'spring2d', 'centroid2d', 'cable3d', 'vector3d', 'machine3d', 'other2d', 'unknown']);
  const SPATIAL = new Set(['cable3d', 'vector3d', 'machine3d']);
  const PROMPT = `You are the optical interpretation component of an interactive university STATICS TEACHING TOOL. Extract from the PRINTED problem and its original diagram. Student handwritten solutions are NOT ground truth. Return one JSON object ONLY.

MANDATORY PHYSICAL QUANTITY PROVENANCE AND UNITS:
- Transcribe every printed numerical value with its exact label AND its original explicit unit: distances (mm/cm/m/in/ft), force (N/kN/lbf), couple (N·m/ft·lbf), angle (deg/rad), distributed load (N/m, lb/ft), spring stiffness (N/m or N/mm), mass (g/kg), area / second moment, density and friction coefficient (dimensionless). DO NOT strip compound units or pretend an unlabeled value has SI units.
- Add "sourceMeasurements": [{"symbol":"a","value":7.9,"unit":"ft","meaning":"horizontal dimension","source":"printed text|printed diagram","uncertain":false}]. Unit must be a nonempty original printed unit or "dimensionless" for ratios. If genuinely unspecified, use "unknown" and list it under unitAudit.missing; never infer it silently.
- Add "unitAudit":{"length":"ft|m|mm|in|unknown","force":"lb|N|kN|unknown","moment":"ft*lb|N*m|unknown","springStiffness":"N/mm|N/m|unknown|not_applicable","distributedLoad":"lb/ft|N/m|unknown|not_applicable","missing":[],"assumptions":[]}. Include explicit units for each physics value where its schema permits, e.g. physics.stiffnessUnit for springs, and physics.forceUnit / physics.lengthUnit for other models. If inconsistent units appear, preserve EACH original entry, explain conversions and show what unit is used in the physics values.
- DO NOT calculate intermediate force components from geometry if the included angle and magnitude are the primary source; preserve printed magnitudes/angles and leave uncertain vectors out of physics. Do not invent joints, springs, lever arms or pulley rope paths. For supports, report actual constraints; a smooth inclined contact force is normal to its surface.
- Raw OCR/transcription and deterministic physics are DIFFERENT stages. Return printed values even if no deterministic physics operation can safely be constructed. Reject unsupported/ambiguous structures by omitting physics and listing exact missing facts. Never insert a plausible-looking value. A self-reported confidence is not an accuracy guarantee.


WHAT TO RECOGNIZE:
- planar trusses and zero-force members; beams with point loads, linear or uniform distributed loads, concentrated couples; jointed frames and multiple two-force members;
- plane pulley/rope/friction problems, levers, machines, belt mechanisms;
- composite areas, centroids, area moment of inertia, holes;
- spatial 3D cables, vector projection, 3D moment r-cross-F, shaft+gears+bearings.

JSON fields (always include arrays, may be empty):
{"kind":"truss|beam|frame2d|force2d|friction2d|pulley2d|centroid2d|cable3d|vector3d|machine3d|other2d|unknown","spatial":false,"title":"brief topic","summary":"what question asks, NOT a guessed numerical answer","confidence":0.7,"sourceMeasurements":[{"symbol":"F","value":10,"unit":"N","source":"printed text","uncertain":false}],"unitAudit":{"length":"unknown","force":"N","moment":"not_applicable","springStiffness":"not_applicable","distributedLoad":"not_applicable","missing":[],"assumptions":[]},"units":"m|ft|in|relative","forceUnit":"kN|N|lb|unknown","nodes":[{"id":"A","x":0,"y":0,"z":0,"support":"none|pin|roller|fixed"}],"members":[{"a":"A","b":"B"}],"loads":[{"node":"A","fx":0,"fy":-10,"fz":0,"label":"10 lb down"}],"pointLoads":[{"x":4,"fy":-12,"label":"12 lb"}],"distributedLoads":[{"from":0,"to":4,"w":-5,"wEnd":-5,"label":"5 lb/ft"}],"couples":[{"node":"A","mx":0,"my":0,"mz":20,"label":"20 lb-ft CW"}],"shapes":[{"label":"Region 1","mode":"solid|cutout","points":[{"x":0,"y":0,"z":0}]}],"dimensions":[{"label":"4 ft","value":4}],"warnings":[],"questions":[],"studySteps":["Identify free-body diagrams"],"explanation":"What was extracted directly vs visually approximated; assumptions and any unsupported solver case."}

OPTIONAL DETERMINISTIC PHYSICS DATA — populate "physics" only when the printed question gives enough information for the specified model. Otherwise OMIT physics and explain exactly what input is missing. Examples of supported schemas:
- Spring: "physics":{"operation":"spring","arrangement":"parallel|series","stiffnesses":[27.1],"stiffnessUnit":"N/mm","massesKg":[0.717,0.336],"g":9.81} (stiffness N/mm => extension mm, stiffness N/m => extension m).
- Ideal pulley/rope: "physics":{"operation":"rigid2d","bodies":[{"id":"pulley","forces":[{"at":[0,0],"value":[0,-100]}]}],"ropes":[{"id":"R1","segments":[{"body":"pulley","at":[0,0],"direction":[0,1]},{"body":"pulley","at":[0,0],"direction":[0,1]}]}]} (ropes must have explicit correct segment directions, frictionless same tension).
- Particle cables: "physics":{"operation":"particle","dimension":2,"forces":[[0,-100]],"tensions":[{"id":"TA","direction":[-1,1]},{"id":"TB","direction":[1,1]}]}.
- Planar rigid body / frame: "physics":{"operation":"rigid2d","bodies":[{"id":"body","forces":[{"at":[2,0],"value":[0,-20]}],"supports":[{"id":"wall","type":"fixed","at":[0,0]}]}]}; supports can be pin, roller, fixed, direction (with direction vector). Connected bodies can have "joints":[{"id":"J","bodyA":"left","bodyB":"right","atA":[2,0],"atB":[2,0]}]. Springs on bodies have [at,direction,k,extension]. Never invent frictionless support type.
- 3D rigid body: "physics":{"operation":"rigid3d","forces":[{"at":[-20,39,59],"value":[8,17,-21]}],"couples":[[0,0,-183]],"supports":[{"id":"O","type":"fixed","at":[0,0,0]}]}. All six fixed-support reactions are unknowns. Bearings need explicitly defined directional constraints; don't assume a fixed bearing.
- 2D/3D known force system: "physics":{"operation":"resultant","dimension":3,"forces":[{"at":[-20,39,59],"value":[8,17,-21]}],"couples":[[0,0,-183]]}; this yields moment/resultant, not supports unless support model provided.
- Polynomial-bounded curved region: "physics":{"operation":"centroid_polynomial","regions":[{"xMin":0,"xMax":15,"top":[0,0,0.06666666666666667],"bottom":[0,-0.5]}]}. Coefficients are c0,c1,c2 for y=c0+c1*x+c2*x²; preserve unit and use only explicitly stated polynomial boundaries.
- Polygon centroid: "physics":{"operation":"centroid","regions":[{"points":[[0,0],[4,0],[4,4],[0,4]]},{"cutout":true,"points":[[1,1],[3,1],[3,3],[1,3]]}]}; ONLY for true straight-edged polygons. Curved boundaries need a separate analytical specification.
- Friction: "physics":{"operation":"friction","model":"belt","highTension":44,"mu":0.43,"wrapRadians":6.283185307179586}, or "model":"slide_tipping" with weight,width,pushHeight,muStatic, or "model":"incline" with weight,angleRadians,muStatic,parallelApplied.
- Virtual work: use operation "virtual_work" ONLY IF compatible virtual displacement/rotation coefficients are explicitly given, otherwise visualization only.

PRIORITY — SUPPORT REACTIONS ON RIGID 2D BODIES:
If the printed question asks for support reactions on ONE bent/T/L-shaped solid rod, bracket, bar, or rigid frame, classify as frame2d (NOT truss or simple beam). ALWAYS produce a complete physics.operation="rigid2d" model when all forces, couple moments, support locations, contact normals, and dimensions are legible. Use ONE rigid body for a continuous rigid rod even if it bends at right angles: do not invent internal pins.
- A wall pin at A produces TWO independent reactions, so physics.supports includes {"id":"A","type":"pin","at":[xA,yA]}.
- A smooth inclined contact at D produces ONE unknown force NORMAL to the surface, NOT zero, NOT a vertical-only roller. Use {"id":"D","type":"direction","at":[xD,yD],"direction":[-rise,run]} where the normal points away from the plane toward the supported body; for an incline rising 3 vertically per 4 horizontally, its upward/left normal is [-3,4]. The solver normalizes it.
- Applied concentrated couple M CW is a NEGATIVE scalar in physics.bodies[0].couples; CCW is POSITIVE. Its position does not affect equilibrium moment. Place point forces at actual coordinates in physics.bodies[0].forces and use the exact printed coordinate scale.
- Use symbolically derived actual printed measurements in all physics fields. Do not copy sample numerical values from these instructions into an unrelated scan. If any essential dimension is missing, leave out physics and identify the missing measurement.
- A diagram with enough data to compute reactions must NEVER be returned as visualization-only; create physics and let the deterministic equilibrium solver calculate reactions. If the numbers or normal direction genuinely cannot be read, provide an explicit warning identifying which fact is missing rather than fabricate it.
CRITICAL: physics is a mathematical model, NOT your guess of an answer. DO NOT create imaginary forces, supports, rope paths, spring extensions, friction coefficients or dimensions. Do NOT confuse tension, mass, weight, stiffness, angle units, geometric height or reaction force. Use explicit printed units and annotate assumptions.

REQUIREMENTS:
1. Use 3D only for actual spatial physics, non-coplanar vectors, or shaft/bearing equations. Use spatial=false and z=0 for planar mechanisms, frames, pulleys, friction, trusses, and beams.
2. A beam is a single straight span with identifiable supports. A frame is frame2d. A simple ideal pin truss is truss.
3. Preserve printed dimensions and force units. Never invent missing values; use units=relative and add a warning.
4. Negative fy means downward. Keep point/distributed loads and couples in the printed units.
5. Prefer printed problem text over handwritten calculations. Do not provide guessed answers.
6. For a multi-page PDF, focus on the first complete engineering question and warn that other questions were not parsed.
7. Extract quickly; do not write chain of thought.`;

  const number = (value, fallback = 0) => {
    const n = Number(value);
    return value !== null && value !== undefined && value !== '' && Number.isFinite(n)
      ? Math.max(-1e9, Math.min(1e9, n))
      : fallback;
  };
  const string = (value, max = 180) => String(value ?? '').slice(0, max).replace(/[\u0000-\u001f]/g, ' ');
  const array = (value, max) => Array.isArray(value) ? value.slice(0, max) : [];

  function sanitize(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Gemini did not return a scene object.');
    const kind = TYPES.has(raw.kind) ? raw.kind : 'unknown';
    const spatial = SPATIAL.has(kind);
    const validSupport = new Set(['none', 'pin', 'roller', 'fixed']);
    const nodes = array(raw.nodes, 45).map((node, i) => ({
      id: string(node?.id || `N${i + 1}`, 18),
      x: number(node?.x), y: number(node?.y), z: spatial ? number(node?.z) : 0,
      support: validSupport.has(node?.support) ? node.support : 'none'
    }));
    const ids = new Set(nodes.map(node => node.id));
    const members = array(raw.members, 75).map(member => ({a: string(member?.a, 18), b: string(member?.b, 18)}))
      .filter(member => ids.has(member.a) && ids.has(member.b) && member.a !== member.b);
    const loads = array(raw.loads, 30).map(load => ({
      node: string(load?.node, 18), fx: number(load?.fx), fy: number(load?.fy),
      fz: spatial ? number(load?.fz) : 0, label: string(load?.label, 70)
    })).filter(load => ids.has(load.node));
    const pointLoads = array(raw.pointLoads, 35).map(load => ({x: number(load?.x), fy: number(load?.fy), label: string(load?.label, 70)}));
    const distributedLoads = array(raw.distributedLoads, 35).map(load => ({
      from: number(load?.from), to: number(load?.to), w: number(load?.w),
      wEnd: number(load?.wEnd, number(load?.w)), label: string(load?.label, 70)
    }));
    const couples = array(raw.couples, 20).map(couple => ({
      node: string(couple?.node, 18), mx: spatial ? number(couple?.mx) : 0,
      my: spatial ? number(couple?.my) : 0, mz: number(couple?.mz), label: string(couple?.label, 70)
    })).filter(couple => ids.has(couple.node));
    const shapes = array(raw.shapes, 20).map(shape => ({
      label: string(shape?.label, 70), mode: shape?.mode === 'cutout' ? 'cutout' : 'solid',
      points: array(shape?.points, 50).map(point => ({x: number(point?.x), y: number(point?.y), z: spatial ? number(point?.z) : 0}))
    })).filter(shape => shape.points.length >= 3);
    const physics=extractPhysics(raw.physics);
    const warnings = array(raw.warnings, 12).map(value => string(value, 220));
    const questions = array(raw.questions, 10).map(value => string(value, 220));
    const units = ['m', 'ft', 'in', 'relative'].includes(raw.units) ? raw.units : 'relative';
    const forceUnit = ['kN', 'N', 'lb'].includes(raw.forceUnit) ? raw.forceUnit : 'unknown';
    if (!raw.unitAudit) warnings.push('This scan did not list explicit per-quantity unit provenance. Inspect the printed values before solving.');
    else if (Array.isArray(raw.unitAudit.missing) && raw.unitAudit.missing.length) warnings.push('Unresolved unit labels: '+raw.unitAudit.missing.map(v=>string(v,45)).join(', ')+'. Do not solve until corrected.');
    if (physics) warnings.push('AI-extracted mechanics input: review all measurements, units, supports and rope directions before relying on calculations.');
    if (units === 'relative') warnings.push('Coordinates are illustrative; confirm real dimensions before using a numerical solver.');
    if (kind === 'beam' && distributedLoads.some(load => Math.abs(load.w - load.wEnd) > 1e-8)) warnings.push('Linearly varying distributed load shown; the elementary beam solver does not cover this case yet.');
    if (spatial) warnings.push('3D vector display is educational; full 3D machine/cable equilibrium is not automatically solved.');
    return {
      kind, spatial, title: string(raw.title, 95), summary: string(raw.summary, 450),
      confidence: Math.min(1, Math.max(0, number(raw.confidence))), units, forceUnit,
      nodes, members, loads, pointLoads, distributedLoads, couples, shapes, physics,
      dimensions: array(raw.dimensions, 25).map(dimension => ({label: string(dimension?.label, 90), value: number(dimension?.value)})),
      warnings, questions,
      sourceMeasurements:array(raw.sourceMeasurements,70).map(t=>({symbol:string(t?.symbol,70),value:Number.isFinite(Number(t?.value))&&t?.value!==null?Number(t.value):null,unit:string(t?.unit||'unknown',32),meaning:string(t?.meaning,140),source:string(t?.source,50),uncertain:!!t?.uncertain})),
      unitAudit:raw.unitAudit&&typeof raw.unitAudit==='object'&&!Array.isArray(raw.unitAudit)?{
        length:string(raw.unitAudit.length||'unknown',40),force:string(raw.unitAudit.force||'unknown',40),moment:string(raw.unitAudit.moment||'unknown',40),
        springStiffness:string(raw.unitAudit.springStiffness||'not_applicable',40),distributedLoad:string(raw.unitAudit.distributedLoad||'not_applicable',40),
        missing:array(raw.unitAudit.missing,20).map(x=>string(x,120)),assumptions:array(raw.unitAudit.assumptions,20).map(x=>string(x,180))
      }:null,
      studySteps: array(raw.studySteps, 5).map(step => string(step, 160)),
      explanation: string(raw.explanation, 1000)
    };
  }

  // JSON-only structured mechanics model. Reject excessive payloads and nonfinite
  // values; never execute AI-produced formulas or JavaScript.
  function extractPhysics(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return undefined;
    const supported=new Set(['spring','rigid2d','rigid3d','particle','centroid','centroid_polynomial','friction','resultant','virtual_work']);
    if(!supported.has(value.operation))return undefined;
    const serialized=JSON.stringify(value);
    if(serialized.length>14000)return undefined;
    const clean=JSON.parse(serialized);
    const finite=(x,depth=0)=>depth<=9&& (x===null||typeof x==='string'||typeof x==='boolean'||typeof x==='number'&&Number.isFinite(x)||Array.isArray(x)&&x.length<=80&&x.every(v=>finite(v,depth+1))||typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length<=50&&Object.values(x).every(v=>finite(v,depth+1)));
    return finite(clean)?clean:undefined;
  }

  const isCapacityError = error => /(?:429|503|high demand|temporar(?:y|ily)|unavailable|resource exhausted|overload)/i.test(String(error?.message || error));
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function analyzeModel({apiKey, model, base64, mimeType, detailed}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 53000);
    try {
      // Never put API keys in URLs (which can enter histories, logs or referrers).
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const response = await fetch(url, {
        method: 'POST', signal: controller.signal,
        headers: {'Content-Type': 'application/json', 'x-goog-api-key': apiKey},
        body: JSON.stringify({
          contents: [{role: 'user', parts: [{text: PROMPT}, {inlineData: {mimeType, data: base64}}]}],
          generationConfig: {responseMimeType: 'application/json', thinkingConfig: {thinkingLevel: detailed ? 'medium' : 'low'}, maxOutputTokens: 8192}
        })
      });
      let data;
      try { data = await response.json(); } catch { throw Error('Gemini returned unreadable data.'); }
      if (!response.ok) throw Error(data?.error?.message || `Gemini HTTP ${response.status}`);
      const candidate = data?.candidates?.[0];
      const finishReason = candidate?.finishReason;
      if (finishReason && !['STOP', 'FINISH_REASON_UNSPECIFIED'].includes(finishReason))
        throw Error(`Gemini stopped before completing the scan (${finishReason}). Crop the diagram or try the detailed scan.`);
      const output = (candidate?.content?.parts || []).map(part => part.text || '').join('').trim();
      if (!output) throw Error(`Gemini returned no JSON scene${data?.promptFeedback?.blockReason ? ` (${data.promptFeedback.blockReason})` : ''}. Try a clearer, cropped image.`);
      let parsed;
      try { parsed = JSON.parse(output); } catch { throw Error('Gemini returned incomplete or malformed JSON. Retry with a clearer crop.'); }
      const scene = sanitize(parsed);
      if (['frame2d', 'other2d', 'pulley2d'].includes(scene.kind) && !scene.physics)
        scene.warnings.push('No structured rigid-body model was extracted. The image cannot be numerically solved until supports, force positions, directions, and couples are confirmed in Advanced Input.');
      return {scene, model};
    } catch (error) {
      if (error?.name === 'AbortError') throw Error('Gemini did not respond within 53 seconds. Switch to Flash or crop the image.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function analyze({apiKey, model, base64, mimeType, detailed}) {
    const key = String(apiKey || '').trim();
    if (!key) throw Error('Enter your private AI Studio API key before scanning.');
    if (!MODELS.has(model)) throw Error('Unknown model choice. Select a supported Gemini image model.');
    // One requested image -> one billable API attempt. Do not silently change
    // models or retry valid but incomplete JSON: either wastes quota or hides failures.
    return analyzeModel({apiKey:key, model, base64, mimeType, detailed});
  }

  root.TVGemini = {analyze, sanitize};
})(typeof window !== 'undefined' ? window : globalThis);

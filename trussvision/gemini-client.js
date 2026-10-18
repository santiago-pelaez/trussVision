/* Optional static-host Gemini adapter.
 *
 * GitHub Pages and Python's static server cannot run the Netlify function.
 * This adapter keeps the API key in memory and sends it directly to Gemini
 * only when the same-origin /api/analyze endpoint is unavailable.
 */
(function (root) {
  'use strict';

  const MODELS = new Set(['gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.6-flash']);
  const TYPES = new Set(['truss', 'beam', 'frame2d', 'force2d', 'friction2d', 'pulley2d', 'centroid2d', 'cable3d', 'vector3d', 'machine3d', 'other2d', 'unknown']);
  const SPATIAL = new Set(['cable3d', 'vector3d', 'machine3d']);
  const PROMPT = `You are the optical interpretation component of an interactive university STATICS TEACHING TOOL. Extract from the PRINTED problem and its original diagram. Student handwritten solutions are NOT ground truth. Return one JSON object ONLY.

WHAT TO RECOGNIZE:
- planar trusses and zero-force members; beams with point loads, linear or uniform distributed loads, concentrated couples; jointed frames and multiple two-force members;
- plane pulley/rope/friction problems, levers, machines, belt mechanisms;
- composite areas, centroids, area moment of inertia, holes;
- spatial 3D cables, vector projection, 3D moment r-cross-F, shaft+gears+bearings.

JSON fields (always include arrays, may be empty):
{"kind":"truss|beam|frame2d|force2d|friction2d|pulley2d|centroid2d|cable3d|vector3d|machine3d|other2d|unknown","spatial":false,"title":"brief topic","summary":"what question asks, NOT a guessed numerical answer","confidence":0.7,"units":"m|ft|in|relative","forceUnit":"kN|N|lb|unknown","nodes":[{"id":"A","x":0,"y":0,"z":0,"support":"none|pin|roller|fixed"}],"members":[{"a":"A","b":"B"}],"loads":[{"node":"A","fx":0,"fy":-10,"fz":0,"label":"10 lb down"}],"pointLoads":[{"x":4,"fy":-12,"label":"12 lb"}],"distributedLoads":[{"from":0,"to":4,"w":-5,"wEnd":-5,"label":"5 lb/ft"}],"couples":[{"node":"A","mx":0,"my":0,"mz":20,"label":"20 lb-ft CW"}],"shapes":[{"label":"Region 1","mode":"solid|cutout","points":[{"x":0,"y":0,"z":0}]}],"dimensions":[{"label":"4 ft","value":4}],"warnings":[],"questions":[],"studySteps":["Identify free-body diagrams"],"explanation":"What was extracted directly vs visually approximated; assumptions and any unsupported solver case."}

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
    const warnings = array(raw.warnings, 12).map(value => string(value, 220));
    const questions = array(raw.questions, 10).map(value => string(value, 220));
    const units = ['m', 'ft', 'in', 'relative'].includes(raw.units) ? raw.units : 'relative';
    const forceUnit = ['kN', 'N', 'lb'].includes(raw.forceUnit) ? raw.forceUnit : 'unknown';
    if (units === 'relative') warnings.push('Coordinates are illustrative; confirm real dimensions before using a numerical solver.');
    if (kind === 'beam' && distributedLoads.some(load => Math.abs(load.w - load.wEnd) > 1e-8)) warnings.push('Linearly varying distributed load shown; the elementary beam solver does not cover this case yet.');
    if (spatial) warnings.push('3D vector display is educational; full 3D machine/cable equilibrium is not automatically solved.');
    return {
      kind, spatial, title: string(raw.title, 95), summary: string(raw.summary, 450),
      confidence: Math.min(1, Math.max(0, number(raw.confidence))), units, forceUnit,
      nodes, members, loads, pointLoads, distributedLoads, couples, shapes,
      dimensions: array(raw.dimensions, 25).map(dimension => ({label: string(dimension?.label, 90), value: number(dimension?.value)})),
      warnings, questions, studySteps: array(raw.studySteps, 5).map(step => string(step, 160)),
      explanation: string(raw.explanation, 1000)
    };
  }

  const isCapacityError = error => /(?:429|503|high demand|temporar(?:y|ily)|unavailable|resource exhausted|overload)/i.test(String(error?.message || error));
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function analyzeModel({apiKey, model, base64, mimeType, detailed}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 53000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST', signal: controller.signal,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contents: [{role: 'user', parts: [{text: PROMPT}, {inlineData: {mimeType, data: base64}}]}],
          generationConfig: {responseMimeType: 'application/json', thinkingConfig: {thinkingLevel: detailed ? 'medium' : 'low'}, maxOutputTokens: 8192}
        })
      });
      let data;
      try { data = await response.json(); } catch { throw Error('Gemini returned unreadable data.'); }
      if (!response.ok) throw Error(data?.error?.message || `Gemini HTTP ${response.status}`);
      const output = (data?.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('').trim();
      if (!output) throw Error('Gemini returned no scene. Try a clearer, cropped image.');
      let parsed;
      try { parsed = JSON.parse(output); } catch { throw Error('Gemini returned incomplete JSON. Retry or switch models.'); }
      return {scene: sanitize(parsed), model};
    } catch (error) {
      if (error?.name === 'AbortError') throw Error('Gemini did not respond within 53 seconds. Switch to Flash or crop the image.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function analyze({apiKey, model, base64, mimeType, detailed}) {
    const key = String(apiKey || '').trim();
    if (!key) throw Error('Enter your AI key before scanning.');
    if (!MODELS.has(model)) throw Error('Unsupported model choice.');
    const candidates = [...new Set([model, 'gemini-3.6-flash', 'gemini-3.8-flash'])];
    let lastError;
    for (let i = 0; i < candidates.length; i++) {
      try {
        return await analyzeModel({apiKey: key, model: candidates[i], base64, mimeType, detailed});
      } catch (error) {
        lastError = error;
        if (!isCapacityError(error) || i === candidates.length - 1) throw error;
        await wait(800);
      }
    }
    throw Error(`Gemini models are busy right now. Please retry in a moment. ${lastError?.message || ''}`.trim());
  }

  root.TVGemini = {analyze, sanitize};
})(typeof window !== 'undefined' ? window : globalThis);

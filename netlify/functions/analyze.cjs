'use strict';
// TrussVision Mark V: image digitizer. Never executes model-produced code.
const MODELS = new Set(['gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.6-flash']);
const TYPES = new Set(['truss','beam','frame2d','force2d','friction2d','pulley2d','centroid2d','cable3d','vector3d','machine3d','other2d','unknown']);
const SPATIAL = new Set(['cable3d','vector3d','machine3d']);
const PROMPT = `You are the optical interpretation component of an interactive university STATICS TEACHING TOOL. Extract from the PRINTED problem and its original diagram. Student handwritten solutions are NOT ground truth. Return one JSON object ONLY.

WHAT TO RECOGNIZE:
- planar trusses and zero-force members; beams with point loads, linear or uniform distributed loads, concentrated couples; jointed frames and multiple two-force members;
- plane pulley/rope/friction problems, levers, machines, belt mechanisms;
- composite areas, centroids, area moment of inertia, holes;
- spatial 3D cables, vector projection, 3D moment r-cross-F, shaft+gears+bearings.

JSON fields (always include arrays, may be empty):
{
"kind":"truss|beam|frame2d|force2d|friction2d|pulley2d|centroid2d|cable3d|vector3d|machine3d|other2d|unknown",
"spatial":false,
"title":"brief topic", "summary":"what question asks, NOT a guessed numerical answer", "confidence":0.7,
"units":"m|ft|in|relative", "forceUnit":"kN|N|lb|unknown",
"nodes":[{"id":"A","x":0,"y":0,"z":0,"support":"none|pin|roller|fixed"}],
"members":[{"a":"A","b":"B"}],
"loads":[{"node":"A","fx":0,"fy":-10,"fz":0,"label":"10 lb down"}],
"pointLoads":[{"x":4,"fy":-12,"label":"12 lb"}],
"distributedLoads":[{"from":0,"to":4,"w":-5,"wEnd":-5,"label":"5 lb/ft"}],
"couples":[{"node":"A","mx":0,"my":0,"mz":20,"label":"20 lb-ft CW"}],
"shapes":[{"label":"Region 1","mode":"solid|cutout","points":[{"x":0,"y":0,"z":0}]}],
"dimensions":[{"label":"4 ft","value":4}],
"warnings":[], "questions":[], "studySteps":["Identify free-body diagrams"],
"explanation":"What was extracted directly vs visually approximated; assumptions and any unsupported solver case."
}

REQUIREMENTS:
1. 3D ONLY if the actual physics uses three spatial coordinates, a genuine spatial vector or mechanism, or 3D moment/bearing equations. Do NOT classify a perspective drawing as 3D when all physical forces are planar. For true 3D set spatial=true and use real noncoplanar z values if known; otherwise choose explicitly illustrative relative z geometry and warn. 2D = spatial:false, z=0.
2. Choose ONE best-fit type. A beam is kind=beam ONLY for a single straight beam with one left and right support where standard simple-span analysis is meaningful. Cantilever and multi-span loads are beam too, but warn advanced solver is unsupported. Frame is frame2d. Simple ideal pin truss is truss.
3. Coordinates: x right, y UP, z depth. If dimensions are legible, keep numeric coordinates IN THE ORIGINAL LENGTH UNIT (ft, in, or m). NEVER invent a dimension; use units=relative for illustrative positions and warn. For diagrams with no node construction, use short line/edge geometry or shape polygons if clearly visible; if impossible, return empty arrays.
4. Keep forces in original declared forceUnit (kN, N, lb). Negative FY means downward. For beams, point loads are {x,fy} and distributed loads have {from,to,w,wEnd}; constant wEnd=w, triangular/trapezoidal wEnd different. Coupling moments are in forceUnit*lengthUnit (right-hand positive).
5. For machine/shaft problems, represent every visible connected edge and force arrow as closely as possible. Add an axis-convention warning if sign orientation is unclear. External loads belong to nodes. Use 3D ONLY for actual spatial problems.
6. Prioritize readable original printed values over handwritten calculations. Do NOT supply made-up answers, reaction forces, tension values, dimensions, forces, or missing geometry. Mention illegible data and whether the problem is under-specified.
7. For a multi-page PDF: focus on the FIRST complete numbered engineering question after cover pages, not the entire exam. Add warning that other questions were not parsed; recommend uploading a screenshot of each problem individually.
8. Return nodes max 45, members max 75, loads max 30, dimensions max 20; explanation <= 500 chars; 0-5 studySteps. Respond fast: extract, don't solve. Do not write chain of thought.`;
function toNumber(v, def=0){const n=Number(v);return v!==null && v!==undefined && v!=='' && Number.isFinite(n)?Math.max(-1e9,Math.min(1e9,n)):def;}
function str(v,max=150){return String(v??'').slice(0,max).replace(/[\u0000-\u001f]/g,' ');}
function arr(v,n){return Array.isArray(v)?v.slice(0,n):[];}
function sanitizeScene(raw){
 if(!raw || typeof raw!=='object' || Array.isArray(raw))throw Error('Gemini did not return a scene object.');
 const kind=TYPES.has(raw.kind)?raw.kind:'unknown';const spatial=SPATIAL.has(kind);
 const validSupport=new Set(['none','pin','roller','fixed']);
 const nodes=arr(raw.nodes,45).map((n,i)=>({id:str(n?.id||`N${i+1}`,18),x:toNumber(n?.x),y:toNumber(n?.y),z:spatial?toNumber(n?.z):0,support:validSupport.has(n?.support)?n.support:'none'}));
 const ids=new Set(nodes.map(n=>n.id));
 const members=arr(raw.members,75).map(m=>({a:str(m?.a,18),b:str(m?.b,18)})).filter(m=>ids.has(m.a)&&ids.has(m.b)&&m.a!==m.b);
 const loads=arr(raw.loads,30).map(l=>({node:str(l?.node,18),fx:toNumber(l?.fx),fy:toNumber(l?.fy),fz:spatial?toNumber(l?.fz):0,label:str(l?.label,70)})).filter(l=>ids.has(l.node));
 const pointLoads=arr(raw.pointLoads,35).map(p=>({x:toNumber(p?.x),fy:toNumber(p?.fy),label:str(p?.label,70)}));
 const distributedLoads=arr(raw.distributedLoads,35).map(d=>({from:toNumber(d?.from),to:toNumber(d?.to),w:toNumber(d?.w),wEnd:toNumber(d?.wEnd,toNumber(d?.w)),label:str(d?.label,70)}));
 const couples=arr(raw.couples,20).map(c=>({node:str(c?.node,18),mx:spatial?toNumber(c?.mx):0,my:spatial?toNumber(c?.my):0,mz:toNumber(c?.mz),label:str(c?.label,70)})).filter(c=>ids.has(c.node));
 const shapes=arr(raw.shapes,20).map(s=>({label:str(s?.label,70),mode:s?.mode==='cutout'?'cutout':'solid',points:arr(s?.points,50).map(p=>({x:toNumber(p?.x),y:toNumber(p?.y),z:spatial?toNumber(p?.z):0}))})).filter(s=>s.points.length>=3);
 const warnings=arr(raw.warnings,12).map(v=>str(v,220));
 const questions=arr(raw.questions,10).map(v=>str(v,220));
 const units=['m','ft','in','relative'].includes(raw.units)?raw.units:'relative';
 const forceUnit=['kN','N','lb'].includes(raw.forceUnit)?raw.forceUnit:'unknown';
 if(units==='relative')warnings.push('Coordinates are illustrative; quantitative structural solver is disabled until real dimensions are confirmed.');
 if(kind==='beam'&&distributedLoads.some(d=>Math.abs(d.w-d.wEnd)>1e-8))warnings.push('Linearly varying distributed load shown; elementary simple-beam solver does not cover this case yet.');
 if(spatial)warnings.push('3D vector display is educational; full 3D machine/cable equilibrium is not automatically solved.');
 return {kind,spatial,title:str(raw.title,95),summary:str(raw.summary,450),confidence:Math.min(1,Math.max(0,toNumber(raw.confidence,0))),units,forceUnit,
 nodes,members,loads,pointLoads,distributedLoads,couples,shapes,dimensions:arr(raw.dimensions,25).map(d=>({label:str(d?.label,90),value:toNumber(d?.value)})),warnings,questions,studySteps:arr(raw.studySteps,5).map(s=>str(s,160)),explanation:str(raw.explanation,1000)};
}
const json=(statusCode,data)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'same-origin'},body:JSON.stringify(data)});
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed. POST an image to this function.'});
 let timer;
 try{
  if((event.body||'').length>5.4*1024*1024)return json(413,{error:'Image too large for Netlify. Try a cropped JPG screenshot.'});
  let body;try{body=JSON.parse(event.body||'{}');}catch{return json(400,{error:'Invalid request.'});}
  const key=String(process.env.GEMINI_API_KEY||'').trim();
  if(!key)return json(400,{code:'SERVER_NOT_CONFIGURED',error:'The server AI service is not configured.'});
  const model=body.model||'gemini-3.8-flash';if(!MODELS.has(model))return json(400,{error:'Unsupported model choice.'});
  const mt=body.mimeType;if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(mt))return json(400,{error:'Upload JPG, PNG, WebP or a small PDF.'});
  if(typeof body.base64!=='string'||body.base64.length<50||body.base64.length>5*1024*1024||!/^[a-zA-Z0-9+/=]+$/.test(body.base64))return json(400,{error:'Invalid or oversized image.'});
  const controller=new AbortController();timer=setTimeout(()=>controller.abort(),53000);
  const started=Date.now();
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
   method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},
   body:JSON.stringify({contents:[{role:'user',parts:[{text:PROMPT},{inlineData:{mimeType:mt,data:body.base64}}]}],
    generationConfig:{responseMimeType:'application/json',thinkingConfig:{thinkingLevel:body.detailed?'medium':'low'},maxOutputTokens:8192}})
  });
  let data;try{data=await res.json();}catch{return json(502,{error:'Gemini sent an unreadable response.'});}
  if(!res.ok)return json(res.status>=500?502:res.status,{error:data?.error?.message||`Gemini HTTP ${res.status}`});
  const output=(data?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
  if(!output)return json(502,{error:'Gemini returned no scene. Try a clearer, cropped image.'});
  let parsed;try{parsed=JSON.parse(output);}catch{return json(502,{error:'Gemini returned incomplete JSON. Retry or switch models.'});}
  const scene=sanitizeScene(parsed);return json(200,{scene,model,elapsedMs:Date.now()-started});
 }catch(e){return json(e?.name==='AbortError'?504:502,{error:e?.name==='AbortError'?'Gemini did not respond within 53 seconds. Switch to Flash or crop the image.':(e?.message||'Analysis error.')});}
 finally{if(timer)clearTimeout(timer);}
};
exports._sanitizeScene=sanitizeScene;

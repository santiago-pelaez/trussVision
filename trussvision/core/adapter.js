/* Adapter between scan data and canonical SI-driven mechanics input.
 * Visualization information is never automatically counted as additional forces.
 * A recognized problem may still require manual correction; no silent defaults.
 */
(function(root,factory){const api=factory(root.TrussVisionCore||(typeof require==='function'?require('./engine.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;root.TrussVisionAdapter=api})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
 'use strict';
 const unsupported=(msg)=>{throw new Core.ModelError('REVIEW_REQUIRED',msg)};
 const checkUnit=(u,type)=>{if(!Core.UNITS[u]||Core.UNITS[u].kind!==type)unsupported(`Unknown ${type} unit '${u}'. Confirm units before solving.`);return u};
 const xyz=(node,n)=>n===3?[node.x,node.y,node.z]:[node.x,node.y];
 const q=(value,unit)=>({value,unit});
 const text=(scene)=>(scene.questions||[]).join(' ')+' '+(scene.summary||'')+' '+(scene.title||'');
 const convert=scene=>{
  if(!scene||typeof scene!=='object')unsupported('No scan loaded');
  if(scene.unitAudit?.missing?.length)unsupported('Gemini left quantities with unresolved units: '+scene.unitAudit.missing.join(', '));
  const phy=scene.physics||{};const op=phy.operation;
  const n=scene.spatial?3:2;const length=scene.units,force=scene.forceUnit;
  const nodes=new Map((scene.nodes||[]).map(node=>[node.id,node]));
  if(scene.kind==='vector3d' && /unit vector/i.test(text(scene))){
   const match=text(scene).match(/from\s+([A-Za-z])\s+to\s+([A-Za-z])/i);
   if(!match)unsupported('Could not determine the requested vector direction (A to B).');
   const a=nodes.get(match[1]),b=nodes.get(match[2]);if(!a||!b)unsupported('Source or destination coordinates missing.');
   return {operation:'unit_vector',from:q(xyz(a,3),checkUnit(length,'length')),to:q(xyz(b,3),length)};
  }
  if(scene.kind==='vector3d'&&/angle\s+between/i.test(text(scene))){
   const all=[...nodes.values()],origin=nodes.get('O')||{x:0,y:0,z:0};
   const a=nodes.get('A'),b=nodes.get('B');if(!a||!b)unsupported('Line directions could not be determined.');
   const dir=(p)=>[p.x-origin.x,p.y-origin.y,p.z-origin.z];
   // Angle from direction cosines: the second point is a *direction*, not a physical coordinate.
   const alpha=(scene.dimensions||[]).find(d=>d.label==='alpha')?.value;
   if(alpha!==undefined){const cosCheck=Math.cos(alpha*Math.PI/180);if(Math.abs(cosCheck-dir(b)[0])>.004)unsupported('Direction cosines conflict with the printed coordinate angle.');}
   return {operation:'angle_between',first:dir(a),second:dir(b)};
  }
  if(/steering wheel/i.test(text(scene)) && /moment/i.test(text(scene))){
   const dim=scene.dimensions||[];
   const diameter=dim.find(d=>/diameter/i.test(d.label)),angle=dim.find(d=>/alpha/i.test(d.label));
   const load=text(scene).match(/F\s*=\s*([0-9]+(?:\.[0-9]+)?)/i);
   if(!diameter||!angle||!load)unsupported('Steering wheel requires diameter, force magnitude, and angle between force and radius.');
   checkUnit(length,'length');checkUnit(force,'force');
   return {operation:'moment_magnitude',leverArm:q(diameter.value/2,length),force:q(Number(load[1]),force),angle:q(angle.value,'deg')};
  }
  if(scene.kind==='truss'&&!op){
   if(scene.spatial)unsupported('A spatial truss requires a 3D truss model.');
   checkUnit(length,'length');checkUnit(force,'force');
   if((scene.pointLoads||[]).length || (scene.distributedLoads||[]).length || (scene.couples||[]).length)unsupported('All forces must act at verified truss joints; nonjoint loads require a different model.');
   const supports=(scene.nodes||[]).filter(s=>s.support&&s.support!=='none').map(s=>({node:s.id,type:s.support}));
   if(supports.some(s=>!['pin','roller'].includes(s.type)))unsupported('Truss has unsupported support constraints.');
   return {operation:'truss2d',nodes:(scene.nodes||[]).map(s=>({id:s.id,at:q([s.x,s.y],length)})),members:scene.members||[],supports,loads:(scene.loads||[]).map(l=>({node:l.node,vector:q([l.fx,l.fy],force)}))};
  }
  if(op==='particle'){
   checkUnit(force,'force');const dim=phy.dimension===3?3:2;
   return {operation:'particle',dimension:dim,forces:(phy.forces||[]).map(v=>q(v,force)),
    cables:(phy.tensions||[]).map(t=>({id:t.id,direction:t.direction,...(t.value!==undefined?{knownTension:q(t.value,force)}:{})})),
    reactions:(phy.reactions||[]).map(r=>({id:r.id,direction:r.direction}))};
  }
  if(op==='friction'&&phy.model==='belt'){
   checkUnit(force,'force');if(phy.wrapRadians===undefined)unsupported('Belt wrap angle is missing');
   return {operation:'belt_friction',mu:phy.mu,wrapAngle:q(phy.wrapRadians,'rad'),highTension:q(phy.highTension,force)};
  }
  if(op==='friction'&&phy.model==='slide_tipping'){
   checkUnit(force,'force');checkUnit(length,'length');
   return {operation:'slide_tip',weight:q(phy.weight,force),width:q(phy.width,length),pushHeight:q(phy.pushHeight,length),...(phy.muStatic!==undefined?{muStatic:phy.muStatic}:{})};
  }
  if(op==='centroid'&&Array.isArray(phy.regions)){
   checkUnit(length,'length');return {operation:'geometry2d',regions:phy.regions.map(r=>({type:'polygon',vertices:r.points.map(p=>q(p,length)),cutout:!!r.cutout}))};
  }
  if(op==='spring'){
   checkUnit(force,'force');
   if(!Array.isArray(phy.stiffnesses)||!phy.stiffnesses.length)unsupported('Missing spring stiffnesses');
   const supportText=[scene.explanation,scene.summary,(scene.questions||[]).join(' ')].join(' ');
   const parsed=supportText.match(/(?:spring constant\s*)?k\s*=\s*(\d+(?:\.\d+)?)\s*(N\/mm|N\/m|kN\/m|lb\/ft|lbf\/in)/i);
   let unit=phy.stiffnessUnit;
   if(!unit&&parsed&&phy.stiffnesses.length===1&&Math.abs(phy.stiffnesses[0]-Number(parsed[1]))<1e-7)unit=parsed[2];
   if(!unit)unsupported('The spring stiffness unit is missing from structured physics. Add physics.stiffnessUnit, e.g. N/mm, before solving.');
   checkUnit(unit,'stiffness');
   return {operation:'spring',arrangement:phy.arrangement,springs:phy.stiffnesses.map(v=>q(v,unit)),masses:(phy.massesKg||[]).map(v=>q(v,'kg')),gravity:phy.g??9.81,...(phy.force!==undefined?{force:q(phy.force,force)}:{})};
  }
  if(op==='rigid2d'){
   checkUnit(length,'length');checkUnit(force,'force');
   if(phy.bodies?.length>1||phy.joints?.length){
    if(phy.ropes?.length||phy.unknownForces?.length)unsupported('Rope and user-defined unknown constraints require separate model verification.');
    return {operation:'frame2d',bodies:(phy.bodies||[]).map(b=>({id:b.id,forces:(b.forces||[]).map(f=>({at:q(f.at,length),vector:q(f.value,force)})),couples:(b.couples||[]).map(c=>q(c,force==='lb'?'ft*lb':force==='kN'?'kN*m':'N*m')),supports:(b.supports||[]).map(t=>({id:t.id,type:t.type,at:q(t.at,length),...(t.direction?{direction:t.direction}:{})}))})),joints:(phy.joints||[]).map(j=>({id:j.id,bodyA:j.bodyA,bodyB:j.bodyB,atA:q(j.atA,length),atB:q(j.atB,length)}))};
   }
   if(phy.bodies?.length!==1)unsupported('A rigid body with no explicit bodies cannot be solved.');
   const b=phy.bodies[0];if(phy.ropes?.length)unsupported('Rope constraints require an explicit pulley/particle model.');
   if(b.distributedLoads?.length||b.springs?.length)unsupported('This adapter requires an explicit canonical distributed-load or spring model.');
   return {operation:'rigid2d',dimension:2,
    forces:(b.forces||[]).map(f=>({at:q(f.at,length),vector:q(f.value,force)})),
    couples:(b.couples||[]).map(c=>q(c,force==='lb'?'ft*lb':force==='kN'?'kN*m':'N*m')),
    supports:(b.supports||[]).map(s=>({id:s.id,type:s.type,at:q(s.at,length),...(s.direction?{direction:s.direction}:{})}))};
  }
  if(op==='rigid3d'){
   checkUnit(length,'length');checkUnit(force,'force');
   return {operation:'rigid3d',dimension:3,
    forces:(phy.forces||[]).map(f=>({at:q(f.at,length),vector:q(f.value,force)})),
    couples:(phy.couples||[]).map(c=>q(c,force==='lb'?'ft*lb':force==='kN'?'kN*m':'N*m')),
    supports:(phy.supports||[]).map(s=>({id:s.id,type:s.type,at:q(s.at,length),...(s.direction?{direction:s.direction}:{}),...(s.axis?{axis:s.axis}:{})}))};
  }
  if(op==='resultant'){
   // A purely concurrent force resultant needs force units, but NO invented length scale.
   if(length==='relative' && !(phy.couples||[]).length && /magnitude of the resultant force/i.test(text(scene))
      && (phy.forces||[]).every(f=>f.at?.every(v=>Math.abs(v)<1e-10))){
     checkUnit(force,'force');return {operation:'force_resultant',dimension:phy.dimension===3?3:2,forces:(phy.forces||[]).map(f=>q(f.value,force))};
   }
   checkUnit(length,'length');checkUnit(force,'force');
   const dim=phy.dimension===3?3:2;
   return {operation:'resultant',dimension:dim,
    forces:(phy.forces||[]).map(f=>({at:q(f.at,length),vector:q(f.value,force)})),
    couples:(phy.couples||[]).map(c=>q(c,force==='lb'?'ft*lb':force==='kN'?'kN*m':'N*m'))};
  }
  unsupported(`Gemini recognized ${scene.kind||'the image'} but did not provide a validated model for the requested quantity. Its visual geometry is not sufficient proof of the correct mechanics. Use the canonical model editor.`);
 };
 const assess=(scene)=>{try{const model=convert(scene);const solution=Core.solve(model);return {ok:true,model,solution};}catch(e){return {ok:false,error:e.message,code:e.code||'VALIDATION_ERROR'}}};
 return {convert,assess};
});

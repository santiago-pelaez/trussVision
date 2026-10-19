/* TrussVision Core v2 — deterministic engineering primitives.
 * MIT project; all numerical values are converted to SI before calculation.
 * UMD for Node regression tests and static GitHub Pages browser hosting.
 * x right, y up, CCW positive, right-hand rule in 3D.
 */
(function (root, factory) { const api=factory(); if(typeof module==='object'&&module.exports)module.exports=api;root.TrussVisionCore=api; })(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const UNITS=Object.freeze({
  m:{kind:'length',factor:1},cm:{kind:'length',factor:.01},mm:{kind:'length',factor:.001},ft:{kind:'length',factor:.3048},in:{kind:'length',factor:.0254},
  N:{kind:'force',factor:1},kN:{kind:'force',factor:1000},lb:{kind:'force',factor:4.4482216152605},lbf:{kind:'force',factor:4.4482216152605},
  'N*m':{kind:'moment',factor:1},'N·m':{kind:'moment',factor:1},'kN*m':{kind:'moment',factor:1000},'kN·m':{kind:'moment',factor:1000},
  'ft*lb':{kind:'moment',factor:1.3558179483314},'ft-lb':{kind:'moment',factor:1.3558179483314},'lb*ft':{kind:'moment',factor:1.3558179483314},
  'N/mm':{kind:'stiffness',factor:1000},'N/m':{kind:'stiffness',factor:1},'kN/m':{kind:'stiffness',factor:1000},'lb/ft':{kind:'stiffness',factor:14.5939029372},'lbf/in':{kind:'stiffness',factor:175.126835246},
  kg:{kind:'mass',factor:1},g:{kind:'mass',factor:.001},'kg/m3':{kind:'density',factor:1},'kg/m³':{kind:'density',factor:1},rad:{kind:'angle',factor:1},deg:{kind:'angle',factor:Math.PI/180}
 });
 class ModelError extends Error { constructor(code,message){super(message);this.name='ModelError';this.code=code;} }
 function fail(code,message){throw new ModelError(code,message);}
 function num(v,label){if(typeof v!=='number'||!Number.isFinite(v))fail('INVALID_NUMBER',`${label} must be a finite number`);return v;}
 function array(v,n,label){if(!Array.isArray(v)||v.length!==n)fail('INVALID_VECTOR',`${label} must have ${n} components`);return v.map((a,i)=>num(a,`${label}[${i}]`));}
 function scale(a,k){return a.map(x=>x*k)};
 function add(a,b){return a.map((x,i)=>x+b[i]);}
 function sub(a,b){return a.map((x,i)=>x-b[i]);}
 function dot(a,b){return a.reduce((sum,x,i)=>sum+x*b[i],0)};
 function mag(v){return Math.hypot(...v)};
 function unit(v,label='direction'){const len=mag(v);if(len<=1e-12)fail('ZERO_DIRECTION',`${label} has zero length`);return scale(v,1/len)};
 function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]};
 function getUnit(label,kind){const u=UNITS[label];if(!u||u.kind!==kind)fail('UNIT_MISSING',`Expected ${kind} unit, received ${String(label)}. Correct this before solving.`);return u.factor;}
 function qty(v,kind,label){if(!v||typeof v!=='object')fail('UNIT_MISSING',`${label} must contain value and unit`);return num(v.value,label)*getUnit(v.unit,kind)};
 function vector(v,kind,label,n){if(!v||typeof v!=='object')fail('UNIT_MISSING',`${label} must contain value and unit`);return scale(array(v.value,n,label),getUnit(v.unit,kind))};
 function direction(v,n,label){return unit(array(v,n,label),label)};
 // Scaled, pivoted Gauss-Jordan elimination; original coefficients retained for an independent residual check.
 function solveLinear(rows,rhs,labels){
  const m=rows.length,n=labels.length;if(!m||!n||rhs.length!==m||rows.some(r=>r.length!==n))fail('INVALID_MATRIX','Inconsistent linear-system dimensions');
  const M=rows.map((r,i)=>{r.forEach((v,j)=>num(v,`A[${i},${j}]`));num(rhs[i],`b[${i}]`);const s=Math.max(1e-30,...r.map(Math.abs),Math.abs(rhs[i]));return [...r.map(v=>v/s),rhs[i]/s]});
  const pivots=[];let rank=0;const EPS=1e-10;
  for(let c=0;c<n&&rank<m;c++){
   let p=rank;for(let r=rank+1;r<m;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
   if(Math.abs(M[p][c])<EPS)continue;
   [M[rank],M[p]]=[M[p],M[rank]];let d=M[rank][c];for(let k=c;k<=n;k++)M[rank][k]/=d;
   for(let r=0;r<m;r++)if(r!==rank){const t=M[r][c];for(let k=c;k<=n;k++)M[r][k]-=t*M[rank][k]}
   pivots.push(c);rank++;
  }
  for(let r=rank;r<m;r++)if(Math.abs(M[r][n])>1e-8)fail('INCONSISTENT','No equilibrium solution exists for these loads and constraints. Check the diagram.');
  if(rank<n)fail('UNDERDETERMINED',`${n-rank} reaction degree(s) remain undetermined; an extra constraint or more information is needed.`);
  const values=Array(n).fill(0);pivots.forEach((p,i)=>values[p]=M[i][n]);
  const residual=rows.map((r,i)=>dot(r,values)-rhs[i]);
  const relative=Math.max(...residual.map((v,i)=>Math.abs(v)/Math.max(1,Math.abs(rhs[i]),...rows[i].map((a,j)=>Math.abs(a*values[j])))));
  if(relative>1e-7)fail('RESIDUAL','An independent equilibrium residual check failed.');
  return {unknowns:Object.fromEntries(labels.map((n,i)=>[n,values[i]])),residual,relativeResidual:relative,rank};
 }
 function solveVectors(m){
  if(m.operation==='unit_vector'){
   const a=vector(m.from,'length','from',3),b=vector(m.to,'length','to',3),delta=sub(b,a),length=mag(delta),u=unit(delta,'line AB');
   return {type:'unit_vector',unitVector:u,length_m:length,verification:{unitNorm:mag(u)},steps:[`Δr = B − A = (${delta.map(x=>x.toPrecision(6)).join(', ')}) m`,`|Δr| = ${length.toPrecision(8)} m`,`u = Δr / |Δr| = (${u.map(x=>x.toFixed(6)).join(', ')})`]};
  }
  const a=direction(m.first,3,'first direction'),b=direction(m.second,3,'second direction');const dp=Math.max(-1,Math.min(1,dot(a,b)));
  const theta=Math.acos(dp)*180/Math.PI;
  return {type:'angle_between',angle_deg:m.unoriented===true?Math.min(theta,180-theta):theta,verification:{aNorm:mag(a),bNorm:mag(b),dot:dp},steps:[`â = (${a.map(x=>x.toFixed(6)).join(', ')})`,`b̂ = (${b.map(x=>x.toFixed(6)).join(', ')})`,`θ = acos(â · b̂) = ${theta.toFixed(6)}°`]};
 }
 function solveForceResultant(m){
  const dim=m.dimension===3?3:2;let R=Array(dim).fill(0);
  if(!Array.isArray(m.forces)||!m.forces.length)fail('NO_LOADS','No force vectors supplied');
  for(const [i,f] of m.forces.entries())R=add(R,vector(f,'force',`force ${i}`,dim));
  return {type:'force_resultant',R_N:R,magnitude_N:mag(R),steps:[`Resolve the original force magnitudes into Cartesian components with verified geometry.`,`R = ΣF = (${R.map(v=>v.toFixed(6)).join(', ')}) N`,`|R| = √(ΣRx² + ΣRy² ${dim===3?'+ ΣRz²':''}) = ${mag(R).toFixed(6)} N`]};
 }
 function solveResultant(m){
  const n=m.dimension===3?3:2,origin=vector(m.origin||{value:Array(n).fill(0),unit:'m'},'length','origin',n);
  let result=Array(n).fill(0),moment=Array(n===3?3:1).fill(0);
  const trace=[];
  for(const [i,f] of (m.forces||[]).entries()){
   const at=vector(f.at,'length',`force ${i} point`,n),v=vector(f.vector,'force',`force ${i}`,n);result=add(result,v);let mf=n===3?cross(sub(at,origin),v):[(at[0]-origin[0])*v[1]-(at[1]-origin[1])*v[0]];moment=add(moment,mf);trace.push(`F${i+1} = (${v.map(x=>x.toFixed(4))}) N; r × F = (${mf.map(x=>x.toFixed(4))}) N·m`);
  }
  for(const [i,c] of (m.couples||[]).entries()){const v=n===3?vector(c,'moment',`couple ${i}`,3):[qty(c,'moment',`couple ${i}`)];moment=add(moment,v)}
  if(!trace.length&&!(m.couples||[]).length)fail('NO_LOADS','No forces or couples supplied');
  return {type:'resultant',R_N:result,M_Nm:moment,steps:[...trace,'R = ΣF; Mₒ = Σ(r × F) + ΣM']};
 }
 function reactionDirections(s,n){
  const type=s.type,id=s.id;if(!id)fail('INVALID_SUPPORT','Every support needs an ID');
  if(type==='pin'&&n===2)return [[1,0],[0,1]];
  if(type==='roller'&&n===2)return [[0,1]];
  if(type==='fixed')return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
  if(type==='ball'&&n===3||type==='thrust_bearing'&&n===3)return [[1,0,0],[0,1,0],[0,0,1]];
  if(type==='journal_bearing'&&n===3){const axis=direction(s.axis,3,`${id} bearing axis`);if(Math.max(...axis.map(Math.abs))<.999999)fail('BEARING_AXIS','Bearing shaft axis must be aligned with a Cartesian axis in this release');const i=axis.map(Math.abs).indexOf(Math.max(...axis.map(Math.abs)));return [0,1,2].filter(j=>j!==i).map(j=>[0,1,2].map(k=>+(k===j)));}
  if(type==='direction')return [direction(s.direction,n,`${id} reaction`)];
  if(type==='custom')return (s.directions||[]).map((d,i)=>direction(d,n,`${id} direction ${i}`));
  fail('UNSUPPORTED_SUPPORT',`${id}: unrecognized support type ${type}`);
 }
 function solveMomentMagnitude(m){
  const r=qty(m.leverArm,'length','lever arm'),f=qty(m.force,'force','force'),theta=qty(m.angle,'angle','angle');
  const moment=r*f*Math.sin(theta);
  return {type:'moment_magnitude',momentMagnitude_Nm:Math.abs(moment),signedMoment_Nm:m.direction==='ccw'?Math.abs(moment):m.direction==='cw'?-Math.abs(moment):null,steps:[`Lever arm = ${r.toPrecision(7)} m; applied force = ${f.toPrecision(7)} N`,`M = r F sin(θ) = ${r.toPrecision(6)} × ${f.toPrecision(6)} × sin(${(theta*180/Math.PI).toFixed(4)}°)`,`|M| = ${Math.abs(moment).toPrecision(9)} N·m`],verification:{geometricForceAngleDegrees:theta*180/Math.PI}};
 }
 function solveRigid(m){
  const n=m.dimension===3?3:2,eqCount=n===3?6:3;
  const origin=vector(m.origin||{value:Array(n).fill(0),unit:'m'},'length','origin',n);
  const result=solveResultant({...m,operation:'resultant'});
  const rhs=[...scale(result.R_N,-1),...scale(result.M_Nm,-1)],columns=[],labels=[],reactionMeta=[];
  const moment=(pt,d)=>n===3?cross(sub(pt,origin),d):[(pt[0]-origin[0])*d[1]-(pt[1]-origin[1])*d[0]];
  const addColumn=(name,column,meta)=>{if(labels.includes(name))fail('DUPLICATE_REACTION',`Duplicate reaction ${name}`);labels.push(name);columns.push(column);reactionMeta.push(meta)};
  for(const s of m.supports||[]){const at=vector(s.at,'length',`${s.id} position`,n),dirs=reactionDirections(s,n);
   for(let i=0;i<dirs.length;i++){const d=dirs[i],axisIndex=d.findIndex(v=>Math.abs(v-1)<1e-10),component=s.type==='direction'?'R':s.type==='roller'?'Ry':axisIndex>=0?['Rx','Ry','Rz'][axisIndex]:`R${i}`;addColumn(`${s.id}.${component}`,[...d,...moment(at,d)],{support:s.id,component,at_m:at,direction:d})}
   if(s.type==='fixed')for(let i=0;i<(n===3?3:1);i++){
    const unitM=Array(n===3?3:1).fill(0);unitM[i]=1;addColumn(`${s.id}.${n===3?['Mx','My','Mz'][i]:'Mz'}`,[...Array(n).fill(0),...unitM],{support:s.id,component:n===3?['Mx','My','Mz'][i]:'Mz',moment:true})
   }
  }
  for(const t of m.cables||[]){const at=vector(t.at,'length',`${t.id} attachment`,n),anchor=vector(t.anchor,'length',`${t.id} anchor`,n),d=unit(sub(anchor,at),`${t.id} cable`);addColumn(`cable.${t.id}`, [...d,...moment(at,d)],{cable:t.id,direction:d})}
  if(!columns.length)fail('NO_SUPPORTS','Support constraints were not supplied');
  const rows=Array.from({length:eqCount},(_,i)=>columns.map(col=>col[i]));const solved=solveLinear(rows,rhs,labels);
  for(const t of reactionMeta)if(t.cable&&solved.unknowns[`cable.${t.cable}`]<-1e-8)fail('SLACK_CABLE',`Cable ${t.cable} would need to push; the assumed cable geometry cannot balance this load.`);
  const fmt=x=>Number(x.toPrecision(7));
  const steps=[`Take +x to the right, +y upward, and positive moments counterclockwise${n===3?' (right-hand rule)':''}.`,`Applied resultant force = (${result.R_N.map(fmt).join(', ')}) N.`,`Applied resultant moment about the reference point = (${result.M_Nm.map(fmt).join(', ')}) N·m.`,`Unknown reactions: ${labels.join(', ')}.`,`Write ${n===3?'ΣFx = ΣFy = ΣFz = 0, ΣMx = ΣMy = ΣMz = 0':'ΣFx = 0, ΣFy = 0 and ΣMz = 0'}; each reaction contributes its allowed force direction and its moment arm.`];
  if(n===2){for(let k=0;k<3;k++){const label=['ΣFx','ΣFy','ΣMz'][k];const terms=labels.map((name,j)=>({name,v:columns[j][k]*solved.unknowns[name]})).filter(t=>Math.abs(t.v)>1e-9);steps.push(`${label}: ${terms.map(t=>`${fmt(t.v)>=0?'+':''}${fmt(t.v)} (${t.name})`).join(' ')||'0'} ${fmt(k===2?result.M_Nm[0]:result.R_N[k])>=0?'+':''}${fmt(k===2?result.M_Nm[0]:result.R_N[k])} (applied) = 0 ${k===2?'N·m':'N'}.`)} }
  steps.push(`Independent substitution residuals: ${solved.residual.map(fmt).join(', ')} (force in N, moment in N·m).`);
  return {type:`rigid${n}d`,...solved,reactions:reactionMeta,steps};
 }
 function solveSpring(m){
  if(!Array.isArray(m.springs)||!m.springs.length)fail('SPRING_STIFFNESS','At least one spring with explicit stiffness units is required');
  const ks=m.springs.map((s,i)=>{const k=qty(s,'stiffness',`spring ${i}`);if(k<=0)fail('SPRING_STIFFNESS','Spring stiffness must be positive');return k});
  let k;if(m.arrangement==='series')k=1/ks.reduce((s,v)=>s+1/v,0);else if(m.arrangement==='parallel')k=ks.reduce((a,b)=>a+b,0);else fail('SPRING_ARRANGEMENT','Specify series or parallel');
  const f=m.force?qty(m.force,'force','spring force'):(m.masses||[]).reduce((a,x)=>a+qty(x,'mass','mass')*(m.gravity??9.81),0);
  if(!m.force&&!(m.masses||[]).length)fail('SPRING_LOAD','Provide an applied force or mass');
  return {type:'spring',force_N:f,k_N_per_m:k,extension_m:f/k,extension_mm:1000*f/k,steps:[`Equivalent stiffness = ${k.toPrecision(8)} N/m`,`Force = ${f.toPrecision(8)} N`,`Extension = F/k = ${(1000*f/k).toPrecision(8)} mm`]};
 }
 function solveParticle(m){
  const n=m.dimension===3?3:2;
  let rhs=Array(n).fill(0);for(const [i,f] of (m.forces||[]).entries())rhs=add(rhs,vector(f,'force',`applied force ${i}`,n));
  const labels=[],columns=[],cables=[];
  for(const c of (m.cables||[])){
   if(!c.id)fail('CABLE_ID','Each tension must have an ID');
   const d=c.direction?direction(c.direction,n,`cable ${c.id}`):
    unit(sub(vector(c.anchor,'length',`${c.id} anchor`,n),vector(c.at,'length',`${c.id} attachment`,n)),`cable ${c.id}`);
   if(c.knownTension){const t=qty(c.knownTension,'force',`${c.id} tension`);if(t<0)fail('SLACK_CABLE','Cable tension must be nonnegative');rhs=add(rhs,scale(d,t))}
   else{labels.push(`T.${c.id}`);columns.push(d);cables.push(`T.${c.id}`)}
  }
  for(const r of m.reactions||[]){labels.push(`R.${r.id}`);columns.push(direction(r.direction,n,`reaction ${r.id}`))}
  if(!labels.length)fail('NO_SUPPORTS','No unknown cable forces or reactions');
  if(new Set(labels).size!==labels.length)fail('DUPLICATE_REACTION','Duplicate cable/reaction IDs');
  const solved=solveLinear(Array.from({length:n},(_,i)=>columns.map(c=>c[i])),scale(rhs,-1),labels);
  for(const id of cables)if(solved.unknowns[id]<-1e-7)fail('SLACK_CABLE',`Cable ${id} would need compression; the assumed taut-cable model is invalid`);
  return {type:'particle',...solved,steps:[`Resolve all cable directions into unit vectors.`,`Write ΣF = 0 in ${n} dimensions.`,`Solve unknown positive cable tensions and verify residuals.`]};
 }
 function solveTruss(m){
  const nodes=m.nodes||[],members=m.members||[];
  if(nodes.length<2||!members.length)fail('TRUSS_TOPOLOGY','A statically determinate truss requires nodes and members');
  const points=new Map();for(const nd of nodes){if(!nd.id||points.has(nd.id))fail('TRUSS_NODE','Unique joint IDs required');points.set(nd.id,vector(nd.at,'length',`joint ${nd.id}`,2))}
  const names=[],columns=[],N=2*nodes.length,rhs=Array(N).fill(0),index=new Map(nodes.map((v,i)=>[v.id,i]));
  const addC=(name,effects)=>{if(names.includes(name))fail('DUPLICATE_REACTION',`Repeated member or support ${name}`);names.push(name);const col=Array(N).fill(0);for(const [id,vec] of effects){let j=index.get(id)*2;col[j]+=vec[0];col[j+1]+=vec[1]}columns.push(col)};
  for(const mbr of members){if(!points.has(mbr.a)||!points.has(mbr.b)||mbr.a===mbr.b)fail('TRUSS_MEMBER','Member references missing or repeated joint');const d=unit(sub(points.get(mbr.b),points.get(mbr.a)),`${mbr.a}-${mbr.b}`);addC(`N.${mbr.a}-${mbr.b}`,[[mbr.a,d],[mbr.b,scale(d,-1)]])}
  for(const supp of m.supports||[]){if(!points.has(supp.node))fail('TRUSS_SUPPORT','Support joint is missing');const r=reactionDirections({...supp,id:supp.id||supp.node},2);r.forEach((d,i)=>{const axis=d.findIndex(v=>Math.abs(v-1)<1e-10),comp=supp.type==='direction'?'R':axis>=0?['Rx','Ry'][axis]:`R${i}`;addC(`${supp.node}.${comp}`,[[supp.node,d]])})}
  for(const l of m.loads||[]){if(!points.has(l.node))fail('TRUSS_LOAD',`Load at missing joint ${l.node}`);const v=vector(l.vector,'force',`load at ${l.node}`,2);let i=index.get(l.node)*2;rhs[i]-=v[0];rhs[i+1]-=v[1]}
  const eq=Array.from({length:N},(_,i)=>columns.map(c=>c[i]));const solved=solveLinear(eq,rhs,names);
  const memberForces=members.map(mbr=>{const id=`N.${mbr.a}-${mbr.b}`,force_N=solved.unknowns[id];return {member:`${mbr.a}-${mbr.b}`,force_N,state:Math.abs(force_N)<1e-7?'zero':force_N>0?'tension':'compression'}});
  const steps=[`Draw a free-body diagram of each pin-jointed node. Unknown member axial forces act away from the node when assumed in tension.`,`Write 2 equilibrium equations per joint (ΣFx = 0 and ΣFy = 0), for ${N} equations.`,`Solve all joint equilibrium equations simultaneously; a negative assumed member force is compression.`];
  const fmt=x=>Number(x.toPrecision(6)),contributions=new Map(nodes.map(nd=>[nd.id,[[],[]]]));
  for(const mbr of members){const d=unit(sub(points.get(mbr.b),points.get(mbr.a))),v=solved.unknowns[`N.${mbr.a}-${mbr.b}`];for(const [nd,sgn] of [[mbr.a,1],[mbr.b,-1]])for(let k=0;k<2;k++)contributions.get(nd)[k].push({name:`${mbr.a}-${mbr.b}`,v:v*sgn*d[k]});}
  for(const supp of m.supports||[]){const ds=reactionDirections({...supp,id:supp.id||supp.node},2);for(const [i,d] of ds.entries()){const idx=d.findIndex(v=>Math.abs(v-1)<1e-10),name=`${supp.node}.${supp.type==='direction'?'R':idx>=0?['Rx','Ry'][idx]:`R${i}`}`,v=solved.unknowns[name];for(let k=0;k<2;k++)contributions.get(supp.node)[k].push({name,v:v*d[k]})}}
  for(const load of m.loads||[]){const v=vector(load.vector,'force',`load at ${load.node}`,2);for(let k=0;k<2;k++)contributions.get(load.node)[k].push({name:'external load',v:v[k]})}
  for(const nd of nodes){for(let k=0;k<2;k++){const terms=contributions.get(nd.id)[k],sum=terms.reduce((a,t)=>a+t.v,0);steps.push(`Joint ${nd.id} ΣF${k===0?'x':'y'}: ${terms.filter(t=>Math.abs(t.v)>1e-8).map(t=>`${t.v>=0?'+':''}${fmt(t.v)} (${t.name})`).join(' ')||'0'} = ${fmt(sum)} N ≈ 0.`)}}
  return {type:'truss2d',...solved,members:memberForces,steps};
 }
 function solveTruss3D(m){
  const nodes=m.nodes||[],members=m.members||[],n=nodes.length;
  if(n<3||n>45||!members.length)fail('TRUSS_TOPOLOGY','A spatial truss needs 3–45 joints and explicit members.');
  const points=new Map();for(const nd of nodes){if(!nd.id||points.has(nd.id))fail('TRUSS_NODE','All spatial joints must have unique IDs.');points.set(nd.id,vector(nd.at,'length',`joint ${nd.id}`,3))}
  const names=[],columns=[],rhs=Array(3*n).fill(0),ix=new Map(nodes.map((v,i)=>[v.id,3*i]));
  const col=(name,eff)=>{if(names.includes(name))fail('DUPLICATE_REACTION',`Repeated spatial member or reaction ${name}`);const c=Array(3*n).fill(0);for(const [id,d] of eff){const offset=ix.get(id);for(let k=0;k<3;k++)c[offset+k]+=d[k]}names.push(name);columns.push(c)};
  for(const mbr of members){if(!points.has(mbr.a)||!points.has(mbr.b)||mbr.a===mbr.b)fail('TRUSS_MEMBER','Member endpoints must reference distinct existing 3D joints.');const d=unit(sub(points.get(mbr.b),points.get(mbr.a)),`${mbr.a}-${mbr.b}`);col(`N.${mbr.a}-${mbr.b}`,[[mbr.a,d],[mbr.b,scale(d,-1)]])}
  for(const s of m.supports||[]){if(!points.has(s.node))fail('TRUSS_SUPPORT','Support must be attached to a 3D joint.');const directions=reactionDirections({...s,id:s.id||s.node},3);directions.forEach((d,i)=>{const axis=d.findIndex(x=>Math.abs(x-1)<1e-10);col(`${s.node}.${axis<0?'R'+i:['Rx','Ry','Rz'][axis]}`,[[s.node,d]])})}
  for(const load of m.loads||[]){if(!points.has(load.node))fail('TRUSS_LOAD',`Load at missing 3D joint ${load.node}`);const v=vector(load.vector,'force',`load at joint ${load.node}`,3);for(let i=0;i<3;i++)rhs[ix.get(load.node)+i]-=v[i]}
  const rows=Array.from({length:3*n},(_,i)=>columns.map(c=>c[i])),solved=solveLinear(rows,rhs,names);
  const mf=members.map(x=>{let v=solved.unknowns[`N.${x.a}-${x.b}`];return {member:`${x.a}-${x.b}`,force_N:v,state:Math.abs(v)<1e-7?'zero':v>0?'tension':'compression'}});
  return {type:'truss3d',...solved,members:mf,steps:['Each 3D pin joint has three independent equilibrium equations: ΣFx=0, ΣFy=0, ΣFz=0.','Resolve each member along the three-dimensional line between its end joints. Positive axial force is tension.','Include only reactions actually restrained by each support. Solve and independently check all joint residuals.']};
 }
 function solveBeltFriction(m){const mu=num(m.mu,'coefficient of friction'),theta=qty(m.wrapAngle,'angle','wrap angle'),high=qty(m.highTension,'force','high tension');
  if(mu<0||theta<=0||high<=0)fail('FRICTION_INPUT','Require μ ≥ 0, θ > 0 and tight-side tension > 0');
  const low=high*Math.exp(-mu*theta);
  return {type:'belt_friction',highTension_N:high,lowTension_N:low,ratio:high/low,steps:[`At impending slip: T_high/T_low = e^(μθ)`,`μ = ${mu}, θ = ${(theta).toFixed(6)} rad`,`T_low = T_high e^(−μθ) = ${low.toFixed(6)} N`]};
 }
 function solveSlideTip(m){const W=qty(m.weight,'force','weight'),width=qty(m.width,'length','base width'),height=qty(m.pushHeight,'length','push height');
  if(W<=0||width<=0||height<=0)fail('FRICTION_INPUT','Weight, base width and push height must be positive');const tip=W*width/(2*height),muCritical=width/(2*height);
  if(m.muStatic===undefined)return {type:'slide_tip',tipForce_N:tip,criticalMu:muCritical,steps:[`At impending tip, take moments about the downhill base edge.`,`P_tip h = W b/2, so P_tip = ${tip.toFixed(6)} N`,`For sliding before tipping: μ_s ≤ b/(2h) = ${muCritical.toFixed(6)}`]};
  const mu=num(m.muStatic,'μ_s');if(mu<0)fail('FRICTION_INPUT','Friction coefficient cannot be negative');const slide=mu*W;
  return {type:'slide_tip',slideForce_N:slide,tipForce_N:tip,criticalMu:muCritical,first:Math.abs(slide-tip)<1e-9?'simultaneous':slide<tip?'sliding':'tipping',steps:[`P_slide = μ_s W = ${slide.toFixed(6)} N`,`P_tip = W b/(2h) = ${tip.toFixed(6)} N`,`Lower threshold controls impending motion: ${slide<tip?'sliding':slide>tip?'tipping':'simultaneous'}`]};
 }
 function solveFrame2D(m){
  const bodies=m.bodies||[];if(!bodies.length||bodies.length>16)fail('FRAME_BODIES','A connected frame requires between 1 and 16 explicit rigid bodies');
  const bodyIndex=new Map();bodies.forEach((b,i)=>{if(!b.id||bodyIndex.has(b.id))fail('FRAME_BODIES','Every rigid body needs a unique ID');bodyIndex.set(b.id,i)});
  const count=3*bodies.length,known=Array(count).fill(0),labels=[],columns=[],jointNames=[];
  const location=(b)=>{if(!bodyIndex.has(b))fail('FRAME_BODY_MISSING',`Unknown body ${b}`);return 3*bodyIndex.get(b)};
  const insertKnown=(id,at,force)=>{const i=location(id);known[i]+=force[0];known[i+1]+=force[1];known[i+2]+=at[0]*force[1]-at[1]*force[0]};
  const effect=(id,at,vec)=>{const i=location(id);const e=Array(count).fill(0);e[i]=vec[0];e[i+1]=vec[1];e[i+2]=at[0]*vec[1]-at[1]*vec[0];return e};
  const addColumn=(name,ef)=>{if(labels.includes(name))fail('DUPLICATE_REACTION',`Duplicate frame unknown ${name}`);labels.push(name);columns.push(ef)};
  for(const b of bodies){
   for(const f of b.forces||[])insertKnown(b.id,vector(f.at,'length','frame force position',2),vector(f.vector,'force','frame force',2));
   for(const c of b.couples||[])known[location(b.id)+2]+=qty(c,'moment','frame couple');
   for(const support of b.supports||[]){const at=vector(support.at,'length',`${support.id} position`,2),ds=reactionDirections(support,2);
    ds.forEach((d,i)=>{const axis=d.findIndex(v=>Math.abs(v-1)<1e-10);addColumn(`${support.id}.${support.type==='direction'?'R':axis===0?'Rx':axis===1?'Ry':`R${i}`}`,effect(b.id,at,d))});
    if(support.type==='fixed'){const e=Array(count).fill(0);e[location(b.id)+2]=1;addColumn(`${support.id}.Mz`,e)}
   }
  }
  for(const j of m.joints||[]){const a=vector(j.atA,'length',`${j.id} location A`,2),b=vector(j.atB,'length',`${j.id} location B`,2);
   if(!j.id||j.bodyA===j.bodyB)fail('FRAME_JOINT','Joints need two different bodies and a unique ID');
   if(mag(sub(a,b))>1e-7)fail('FRAME_JOINT','Internal pin coordinates must coincide on both bodies');
   for(let k=0;k<2;k++){const d=k===0?[1,0]:[0,1];addColumn(`${j.id}.${k===0?'Fx':'Fy'}`,add(effect(j.bodyA,a,d),effect(j.bodyB,b,scale(d,-1))));jointNames.push(`${j.id}.${k===0?'Fx':'Fy'}`)}
  }
  for(const t of m.twoForceMembers||[]){const A=vector(t.atA,'length',`${t.id} A`,2),B=vector(t.atB,'length',`${t.id} B`,2),d=unit(sub(B,A),`${t.id} two-force direction`);
   addColumn(`link.${t.id}`,add(effect(t.bodyA,A,d),effect(t.bodyB,B,scale(d,-1))))
  }
  if(!labels.length)fail('NO_SUPPORTS','Frame needs support or joint reactions');
  const solved=solveLinear(Array.from({length:count},(_,i)=>columns.map(c=>c[i])),scale(known,-1),labels);
  return {type:'frame2d',...solved,steps:[`Draw independent free-body diagrams for ${bodies.map(b=>b.id).join(', ')}.`,`At internal pins the equal/opposite forces cancel across the connected bodies.`,`Assemble ΣFx=0, ΣFy=0, ΣM=0 on every body.`,`Solve the ${labels.length} unknown force and moment components, then verify every equation.`]};
 }
 function polygonGeometry(points){
  const n=points.length;if(n<3)fail('GEOMETRY','A polygon needs 3+ vertices');let ar=0,cx=0,cy=0,Ix=0,Iy=0,Ixy=0;
  for(let i=0;i<n;i++){const [x,y]=points[i],[X,Y]=points[(i+1)%n],cross=x*Y-X*y;
   ar+=cross;cx+=(x+X)*cross;cy+=(y+Y)*cross;
   Ix+=(y*y+y*Y+Y*Y)*cross;Iy+=(x*x+x*X+X*X)*cross;
   Ixy+=(2*x*y+x*Y+X*y+2*X*Y)*cross;
  }
  if(Math.abs(ar)<1e-12)fail('GEOMETRY','Zero-area polygon or degenerate vertices');const sign=Math.sign(ar);const area=Math.abs(ar)/2;
  return {area,cx:cx/(3*ar),cy:cy/(3*ar),Ix:Ix*sign/12,Iy:Iy*sign/12,Ixy:Ixy*sign/24};
 }
 function solveGeometry(m){
  let area=0,Qx=0,Qy=0,Ix=0,Iy=0,Ixy=0,mass=0,Mx=0,My=0;const regions=m.regions||[];
  if(!regions.length)fail('GEOMETRY','At least one primitive region is required');
  const hasDensity=regions.some(r=>r.density!==undefined);
  if(hasDensity&&regions.some(r=>!r.density||!r.thickness))fail('DENSITY','Every region, including removed material, needs its original density and thickness.');
  for(const r of regions){const s=r.cutout?-1:1;let geom;
   if(r.type==='polygon')geom=polygonGeometry((r.vertices||[]).map((v,i)=>vector(v,'length',`polygon vertex ${i}`,2)));
   else if(r.type==='rectangle'){
    const [x,y]=vector(r.origin,'length','rectangle origin',2),w=qty(r.width,'length','width'),h=qty(r.height,'length','height');if(w<=0||h<=0)fail('GEOMETRY','Rectangle dimensions must be positive');const A=w*h,X=x+w/2,Y=y+h/2;
    geom={area:A,cx:X,cy:Y,Ix:w*h**3/12+A*Y*Y,Iy:h*w**3/12+A*X*X,Ixy:A*X*Y};
   }
   else if(r.type==='semicircle'||r.type==='quarter_circle'){
    const [x,y]=vector(r.center,'length','circle reference',2),rad=qty(r.radius,'length','radius');if(rad<=0)fail('GEOMETRY','Radius must be positive');
    const sx=r.sx===-1?-1:1,sy=r.sy===-1?-1:1;
    const isQ=r.type==='quarter_circle',A=Math.PI*rad*rad/(isQ?4:2),d=4*rad/(3*Math.PI);
    const cx=x+(isQ?sx*d:0),cy=y+sy*d;
    const IxCent=isQ?Math.PI*rad**4/16-A*d*d:Math.PI*rad**4/8-A*d*d;
    const IyCent=isQ?IxCent:Math.PI*rad**4/8;
    const IxyCent=isQ?(sx*sy)*(rad**4/8-A*d*d):0;
    geom={area:A,cx,cy,Ix:IxCent+A*cy*cy,Iy:IyCent+A*cx*cx,Ixy:IxyCent+A*cx*cy};
   }
   else fail('GEOMETRY',`Unknown primitive geometry: ${r.type}`);
   area+=s*geom.area;Qx+=s*geom.area*geom.cx;Qy+=s*geom.area*geom.cy;Ix+=s*geom.Ix;Iy+=s*geom.Iy;Ixy+=s*geom.Ixy;
   if(hasDensity){const rho=qty(r.density,'density','material density'),thick=qty(r.thickness,'length','material thickness'),m=s*geom.area*thick*rho;
    mass+=m;Mx+=m*geom.cx;My+=m*geom.cy;
   }
  }
  if(area<=0)fail('GEOMETRY','Composite physical area must remain positive after cutouts.');
  const cx=Qx/area,cy=Qy/area;if(Ix< -1e-6||Iy< -1e-6)fail('GEOMETRY','Negative area moment: check overlapping/cutout geometry');
  const out={type:'geometry2d',area_m2:area,cx_m:cx,cy_m:cy,Ix_m4:Ix,Iy_m4:Iy,Ixy_m4:Ixy,IxCentroid_m4:Ix-area*cy*cy,IyCentroid_m4:Iy-area*cx*cx,
   steps:['Resolve each primitive into an exact area and centroid (cutouts negative).','Compute x̄ = ΣAx / ΣA and ȳ = ΣAy / ΣA.','Compute Ix and Iy by exact integration / parallel-axis theorem, never pixel area.']};
  if(hasDensity){if(mass<=0)fail('DENSITY','Total mass must be positive');out.mass_kg=mass;out.centerMass_m=[Mx/mass,My/mass];out.steps.push('Center of mass uses material density × thickness × signed region area, not unweighted geometric area.')}
  return out;
 }
 function solveIdealPulley(m){
  const W=qty(m.load,'force','hanging load'),n=num(m.supportingSegments,'supporting rope segments');
  if(W<=0||!Number.isInteger(n)||n<1||n>16)fail('PULLEY_INPUT','Require a positive hanging load and 1–16 rope segments supporting the moving assembly.');
  const T=W/n;return {type:'ideal_pulley',load_N:W,supportingSegments:n,ropeTension_N:T,ropeForces_N:Array(n).fill(T),relativeResidual:Math.abs(n*T-W)/W,steps:[`Isolate the moving pulley and its attached load: W = ${W.toPrecision(8)} N.`,`Assume an ideal, massless, frictionless rope with ${n} supporting segments; each segment has the same tension T.`,`ΣFy = ${n}T − W = 0, so T = W/${n} = ${T.toPrecision(8)} N.`,`Verification: ${n} × ${T.toPrecision(8)} − ${W.toPrecision(8)} = ${(n*T-W).toPrecision(4)} N.`]};
 }
 function solve(m){if(!m||typeof m!=='object')fail('INVALID_MODEL','Missing canonical mechanics model');
  const ops={unit_vector:solveVectors,angle_between:solveVectors,moment_magnitude:solveMomentMagnitude,force_resultant:solveForceResultant,resultant:solveResultant,particle:solveParticle,truss2d:solveTruss,truss3d:solveTruss3D,frame2d:solveFrame2D,geometry2d:solveGeometry,belt_friction:solveBeltFriction,slide_tip:solveSlideTip,rigid2d:solveRigid,rigid3d:solveRigid,spring:solveSpring,ideal_pulley:solveIdealPulley};
  const f=ops[m.operation];if(!f)fail('NOT_IMPLEMENTED',`The independent ${m.operation||'unknown'} solver is not implemented yet; no fabricated numerical answer will be shown.`);
  const result=f(m);
  const walk=(obj,path='result')=>{if(typeof obj==='number'&&!Number.isFinite(obj))fail('NONFINITE_RESULT',`Nonfinite calculated value at ${path}`);if(Array.isArray(obj))obj.forEach((v,i)=>walk(v,`${path}[${i}]`));else if(obj&&typeof obj==='object')Object.entries(obj).forEach(([k,v])=>walk(v,`${path}.${k}`))};
  walk(result);return result;
 }
 return {solve,solveLinear,UNITS,ModelError};
});

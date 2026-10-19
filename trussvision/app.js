const { solveTrussModel, analyzeTrussScene, repairExamWallPin } = globalThis.TVTrussSolver || {};
const $=id=>document.getElementById(id);

const clone=x=>structuredClone(x);
const demos={
 truss:{kind:'truss',title:'Five-node teaching truss',summary:'A planar pin-jointed truss with one downward joint load.',confidence:1,units:'m',nodes:[{id:'A',x:0,y:0,z:0,support:'pin'},{id:'B',x:4,y:0,z:0,support:'none'},{id:'C',x:8,y:0,z:0,support:'roller'},{id:'D',x:2,y:3,z:0,support:'none'},{id:'E',x:6,y:3,z:0,support:'none'}],members:[{a:'A',b:'B'},{a:'B',b:'C'},{a:'D',b:'E'},{a:'A',b:'D'},{a:'D',b:'B'},{a:'B',b:'E'},{a:'E',b:'C'}],loads:[{node:'B',fx:0,fy:-50,fz:0,label:'50 kN'}],pointLoads:[],distributedLoads:[],dimensions:[{label:'8 m span',value:8}],warnings:[],questions:[],explanation:'This demonstration is fully specified. The truss solver assumes pin joints, small displacements, and purely axial members. A roller restrains vertical translation only.'},
 beam:{kind:'beam',title:'Simply supported beam with a UDL',summary:'An 8 m beam under 6 kN/m over the entire span and a central 12 kN point load.',confidence:1,units:'m',nodes:[{id:'A',x:0,y:0,z:0,support:'pin'},{id:'B',x:8,y:0,z:0,support:'roller'}],members:[{a:'A',b:'B'}],loads:[],pointLoads:[{x:4,fy:-12,label:'12 kN'}],distributedLoads:[{from:0,to:8,w:-6,label:'6 kN/m'}],dimensions:[{label:'8 m',value:8}],warnings:[],questions:[],explanation:'For a simply supported beam, reactions come from ΣFy=0 and ΣM=0. Shear and bending moment are computed along the beam by integrating the applied loads.'},
 machine3d:{kind:'machine3d',spatial:true,title:'3D shaft and bearing demonstration',summary:'Spatial shaft with gears and two bearing supports. Rotate the hologram to inspect three-axis loads.',confidence:1,units:'m',forceUnit:'kN',nodes:[{id:'C',x:0,y:0,z:0,support:'pin'},{id:'A',x:1.3,y:0,z:0,support:'none'},{id:'D',x:3.5,y:0,z:0,support:'roller'},{id:'B',x:4.6,y:0,z:0,support:'none'},{id:'A+',x:1.3,y:1.1,z:0,support:'none'},{id:'A-',x:1.3,y:-1.1,z:0,support:'none'},{id:'Az+',x:1.3,y:0,z:1.1,support:'none'},{id:'Az-',x:1.3,y:0,z:-1.1,support:'none'},{id:'B+',x:4.6,y:.75,z:0,support:'none'},{id:'B-',x:4.6,y:-.75,z:0,support:'none'},{id:'Bz+',x:4.6,y:0,z:.75,support:'none'},{id:'Bz-',x:4.6,y:0,z:-.75,support:'none'}],members:[{a:'C',b:'A'},{a:'A',b:'D'},{a:'D',b:'B'},{a:'A+',b:'Az+'},{a:'Az+',b:'A-'},{a:'A-',b:'Az-'},{a:'Az-',b:'A+'},{a:'B+',b:'Bz+'},{a:'Bz+',b:'B-'},{a:'B-',b:'Bz-'},{a:'Bz-',b:'B+'},{a:'A',b:'A+'},{a:'A',b:'A-'},{a:'A',b:'Az+'},{a:'A',b:'Az-'},{a:'B',b:'B+'},{a:'B',b:'B-'},{a:'B',b:'Bz+'},{a:'B',b:'Bz-'}],loads:[{node:'A+',fx:0,fy:0,fz:18,label:'18 kN +Z'},{node:'Bz+',fx:0,fy:12,fz:0,label:'12 kN +Y'}],pointLoads:[],distributedLoads:[],couples:[],shapes:[],dimensions:[],studySteps:['Identify bearing reaction directions.','Write r × F for each gear load.','Apply 3D force and moment equilibrium.'],warnings:['Illustrative shaft and gear geometry. Known applied-force resultants only; bearing reactions are not solved.'],questions:[],explanation:'The shaft stays in 3D and automatically turns; drag to inspect bearings, gear loading and orthogonal directions.'}
 ,cable3d:{kind:'cable3d',spatial:true,title:'Spatial cable system / 3D vector demo',summary:'Three anchored cables stabilize a suspended joint. Drag to orbit and inspect force directions.',confidence:1,units:'m',forceUnit:'kN',nodes:[{id:'O',x:0,y:0,z:0,support:'none'},{id:'A',x:-3,y:3,z:2,support:'fixed'},{id:'B',x:3,y:2,z:-2,support:'fixed'},{id:'C',x:0,y:4,z:4,support:'fixed'}],members:[{a:'O',b:'A'},{a:'O',b:'B'},{a:'O',b:'C'}],loads:[{node:'O',fx:0,fy:-12,fz:0,label:'12 kN DOWN'}],pointLoads:[],distributedLoads:[],couples:[],shapes:[],dimensions:[],studySteps:['Sketch an FBD at the cable connection.','Determine cable unit vectors from anchor coordinates.','Set ΣFx=ΣFy=ΣFz=0 to solve cable tensions.'],warnings:['This demo illustrates 3D cable geometry; full cable-tension solution is not yet implemented.'],questions:[],explanation:'An orbiting 3D diagram helps students see x/y/z cable directions and how 3D force equilibrium differs from 2D.'},
 frame2d:{kind:'frame2d',spatial:false,title:'Pinned 2D articulated frame preview',summary:'Rigid frame with a distributed load and an internal pin. Geometry is interactive; reactions are not yet solved.',confidence:1,units:'ft',forceUnit:'lb',nodes:[{id:'A',x:0,y:0,z:0,support:'pin'},{id:'B',x:3,y:9,z:0,support:'none'},{id:'C',x:13,y:9,z:0,support:'pin'}],members:[{a:'A',b:'B'},{a:'B',b:'C'}],loads:[{node:'B',fx:180,fy:0,fz:0,label:'180 lb horizontal'}],pointLoads:[],distributedLoads:[],couples:[],shapes:[],dimensions:[{label:'10 ft',value:10}],studySteps:['Separate members at pin B.','Replace distributed loads with their equivalent resultants.','Write ΣM, ΣFx and ΣFy for each member.'],warnings:['Frame equilibrium solver not available; do not interpret the on-screen forces as solved reactions.'],questions:[],explanation:'A teaching example of a frame; inspect joint connectivity, external load directions and support conditions.'}
};

demos.cable3d.physics={operation:'particle',dimension:3,forces:[[0,-12,0]],tensions:[{id:'OA',direction:[-3,3,2]},{id:'OB',direction:[3,2,-2]},{id:'OC',direction:[0,4,4]}]};
demos.cable3d.warnings=['Ideal anchored cables; third cable has near-zero tension for this particular loading, so inspect whether it is taut.'];
demos.cable3d.explanation='The reviewed cable geometry is resolved into three spatial unit vectors and solved using ΣFx=ΣFy=ΣFz=0. Negative cable tensions are rejected.';
// Hibbeler-family deterministic examples. Visual geometry is a diagram, not
// a source of computed values: all arithmetic uses physics below.
demos.spring2d={kind:'spring2d',title:'Spring-supported hanging masses',summary:'Hooke law: two hanging masses carried by one spring.',confidence:1,units:'mm',forceUnit:'N',nodes:[{id:'Ceiling',x:0,y:2,z:0,support:'fixed'},{id:'Block',x:0,y:0,z:0,support:'none'}],members:[{a:'Ceiling',b:'Block'}],loads:[],physics:{operation:'spring',arrangement:'parallel',stiffnesses:[27.1],massesKg:[.717,.336],g:9.81},warnings:[],questions:[],explanation:'The mass-to-force conversion is explicit. Hooke law yields displacement in millimeters because stiffness is N/mm.'};
demos.pulley2d={kind:'pulley2d',title:'Ideal movable pulley',summary:'A 100 N weight supported by two segments of the same frictionless rope.',confidence:1,units:'m',forceUnit:'N',nodes:[{id:'L',x:-1,y:3,z:0,support:'fixed'},{id:'P',x:0,y:1,z:0,support:'none'},{id:'R',x:1,y:3,z:0,support:'none'}],members:[{a:'L',b:'P'},{a:'P',b:'R'}],loads:[{node:'P',fx:0,fy:-100,fz:0,label:'100 N'}],physics:{operation:'rigid2d',bodies:[{id:'pulley',forces:[{at:[0,0],value:[0,-100]}]}],ropes:[{id:'rope1',segments:[{body:'pulley',at:[0,0],direction:[0,1]},{body:'pulley',at:[0,0],direction:[0,1]}]}]},warnings:['Ideal massless rope/pulley; rope friction and acceleration neglected.'],questions:[],explanation:'Both rope segments share a common tension T, hence 2T−100=0.'};
demos.friction2d={kind:'friction2d',title:'Friction versus tipping',summary:'Compare the push needed to slide a cabinet versus the push needed to tip it.',confidence:1,units:'ft',forceUnit:'lb',nodes:[{id:'A',x:0,y:0,z:0,support:'none'},{id:'B',x:2,y:0,z:0,support:'none'},{id:'C',x:2,y:3,z:0,support:'none'},{id:'D',x:0,y:3,z:0,support:'none'}],members:[{a:'A',b:'B'},{a:'B',b:'C'},{a:'C',b:'D'},{a:'D',b:'A'}],loads:[],physics:{operation:'friction',model:'slide_tipping',weight:180,width:2,pushHeight:4,muStatic:.2},warnings:['Push height 4 ft is a parameter and is not drawn to scale on the cabinet.'],questions:[],explanation:'Competing thresholds decide which occurs first: impending slide or impending tip.'};
demos.centroid2d={kind:'centroid2d',title:'Composite centroid and area moments',summary:'Find centroid, second moments of area, and the effect of a square hole.',confidence:1,units:'ft',forceUnit:'lb',nodes:[{id:'O',x:0,y:0,z:0,support:'none'},{id:'E',x:4,y:4,z:0,support:'none'}],members:[],loads:[],shapes:[{mode:'solid',label:'SOLID',points:[{x:0,y:0},{x:4,y:0},{x:4,y:4},{x:0,y:4}]},{mode:'cutout',label:'HOLE',points:[{x:1,y:1},{x:3,y:1},{x:3,y:3},{x:1,y:3}]}],physics:{operation:'centroid',regions:[{points:[[0,0],[4,0],[4,4],[0,4]]},{cutout:true,points:[[1,1],[3,1],[3,3],[1,3]]}]},warnings:[],questions:[],explanation:'Exact polygon integrals, not a pixel-based approximation.'};
demos.frameSolved2d={kind:'frame2d',title:'Fixed-support frame reactions',summary:'Rigid planar cantilever with 20 N downward force 2 m from a fixed wall.',confidence:1,units:'m',forceUnit:'N',nodes:[{id:'A',x:0,y:0,z:0,support:'fixed'},{id:'B',x:2,y:0,z:0,support:'none'}],members:[{a:'A',b:'B'}],loads:[{node:'B',fx:0,fy:-20,fz:0,label:'20 N'}],physics:{operation:'rigid2d',bodies:[{id:'frame',forces:[{at:[2,0],value:[0,-20]}],supports:[{type:'fixed',id:'A',at:[0,0]}]}]},warnings:[],questions:[],explanation:'A fixed support provides horizontal, vertical, and moment reactions.'};
demos.belt2d={kind:'friction2d',title:'Belt friction / capstan equation',summary:'Given 44 lb tight-side tension and three cylinder contacts totaling 2π radians, find slack-side tension.',confidence:1,units:'ft',forceUnit:'lb',nodes:[{id:'A',x:0,y:0,z:0,support:'none'},{id:'B',x:3,y:0,z:0,support:'none'}],members:[{a:'A',b:'B'}],loads:[],physics:{operation:'friction',model:'belt',highTension:44,mu:.43,wrapRadians:2*Math.PI},warnings:['Wrap angles add only under a consistent slip direction.'],questions:[],explanation:'At impending belt slip, T_high/T_low=exp(μθ) with θ in radians.'};
demos.curved2d={kind:'centroid2d',title:'Curved boundary — exact area inertia',summary:'Compute Ix and Iy of the region between y=x²/15 and y=−x/2, 0≤x≤15 ft.',confidence:1,units:'ft',forceUnit:'lb',nodes:[{id:'O',x:0,y:0,z:0,support:'none'},{id:'B',x:15,y:15,z:0,support:'none'}],members:[],loads:[],shapes:[{label:'POLYNOMIAL REGION',mode:'solid',points:[...Array.from({length:31},(_,i)=>{const x=i/2;return {x,y:x*x/15};}),...Array.from({length:31},(_,i)=>{const x=15-i/2;return {x,y:-x/2};})]}],physics:{operation:'centroid_polynomial',regions:[{xMin:0,xMax:15,top:[0,0,1/15],bottom:[0,-.5]}]},warnings:['Curved boundary is drawn as a segmented approximation; integral is exact for the given polynomials.'],questions:[],explanation:'Exact area integration reproduces the 16,453.125 ft⁴ y-axis moment from the CE 211 worksheet.'};
demos.vector3d={kind:'vector3d',spatial:true,title:'3D bent pipe moment about O',summary:'Find the total moment of a 3D force and a clockwise applied couple about the origin.',confidence:1,units:'ft',forceUnit:'lb',nodes:[{id:'O',x:0,y:0,z:0,support:'fixed'},{id:'P',x:-20,y:39,z:59,support:'none'}],members:[{a:'O',b:'P'}],loads:[{node:'P',fx:8,fy:17,fz:-21,label:'(8,17,-21) lb'}],couples:[{node:'O',mx:0,my:0,mz:-183,label:'183 ft lb clockwise z'}],physics:{operation:'resultant',dimension:3,forces:[{at:[-20,39,59],value:[8,17,-21]}],couples:[[0,0,-183]]},warnings:['Uses the printed application point z=59 ft, not the handwritten z=34 ft.'],questions:[],explanation:'Calculate M_O=r×F+M_applied, with clockwise about +z negative.'};

let scene=clone(demos.truss),original=clone(scene),mult=1,mode='select',show3d=false,showLabels=true,selected=null,buildStart=null,drag=null,hover=null,angle=.45,tilt=.46,orbitMix=0,orbitOn=true,orbitSpeed=0,orbitedAt=0,lastFrame=0,animationFrame=0,solveFrame=0,pan={x:0,y:0},zoom=1,view={cx:0,cy:0,s:30},solution=null,problem=null,source='demo';
const canvas=$('stage'),ctx=canvas.getContext('2d');
const safe=(x,def=0)=>Number.isFinite(Number(x))&&x!==null&&x!==''?Number(x):def;
const fmt=(x,units='')=>Number.isFinite(x)?`${(Math.abs(x)<.0005?0:x).toFixed(Math.abs(x)>=100?1:2)}${units}`:'N/A';
const node=id=>scene.nodes.find(n=>n.id===id);
const eligible=()=>scene.physics ? Boolean(scene.physics.operation&&['kN','N','lb'].includes(scene.forceUnit)) : ['m','ft','in'].includes(scene.units) && ['kN','N','lb'].includes(scene.forceUnit||'kN') && scene.nodes.length>=2;
const lengthInM=()=>({m:1,ft:.3048,in:.0254}[scene.units]||1);
const forceInKN=()=>({kN:1,N:.001,lb:.0044482216152605}[scene.forceUnit||'kN']||1);
const forceLabel=()=>scene.forceUnit||'kN';
const workflowIds=['workflowScan','workflowReview','workflowSolve'];
function updateWorkflow(stage){
 const index={scan:0,review:1,solve:2}[stage]??0;
 workflowIds.forEach((id,i)=>{const el=$(id);if(!el)return;el.classList.toggle('active',i===index);el.classList.toggle('complete',i<index);});
}
function transferReason(){
 if(scene.kind!=='beam'||scene.spatial)return 'Beam handoff is available for straight 2D beams only.';
 if(!['m','ft','in'].includes(scene.units)||!['kN','N','lb'].includes(scene.forceUnit||'kN'))return 'Confirm real length and force units before handoff.';
 if(scene.nodes.length!==2)return 'The handoff requires exactly two beam endpoints.';
 const [a,b]=scene.nodes;
 if(!Number.isFinite(a.x)||!Number.isFinite(b.x)||a.x===b.x||a.y!==b.y)return 'The handoff requires a horizontal beam with two different endpoints.';
 if(!scene.nodes.some(n=>n.support&&n.support!=='none'))return 'Confirm at least one beam support before handoff.';
 return '';
}
function updateTransferAvailability(){
 const button=$('vetinExport'),note=$('vetinFeedback');if(!button)return;
 const reason=transferReason();button.disabled=Boolean(reason);
 if(note){note.textContent=reason||'Ready for review. The beam solver will open in a separate route.';note.style.color='';}
}
function scheduleSolve(){
 if(solveFrame)return;
 solveFrame=requestAnimationFrame(()=>{solveFrame=0;solveAndRender();});
}
function validate(s){
 if(!s || !['truss','beam','frame2d','force2d','friction2d','pulley2d','spring2d','centroid2d','cable3d','vector3d','machine3d','other2d','unknown'].includes(s.kind))throw Error('Unsupported scene type.');
 if(!Array.isArray(s.nodes)||!Array.isArray(s.members)||s.nodes.length>45||s.members.length>75)throw Error('Invalid node/member arrays or too many elements.');
 const ids=new Set();for(const n of s.nodes){if(!n.id||ids.has(n.id))throw Error('Node IDs must be unique.');ids.add(n.id);for(const p of ['x','y','z']){if(!Number.isFinite(Number(n[p]??0)))throw Error(`Invalid coordinate for ${n.id}.`);n[p]=Number(n[p]??0);}if(!['pin','roller','fixed','none'].includes(n.support))throw Error(`Invalid support ${n.support}`);}
 for(const m of s.members)if(!ids.has(m.a)||!ids.has(m.b)||m.a===m.b)throw Error('Members must connect two different existing nodes.');
 for(const l of s.loads||[])if(!ids.has(l.node))throw Error('Load refers to missing node.');
 for(const k of ['loads','pointLoads','distributedLoads','couples','shapes','studySteps','warnings','questions','dimensions'])if(!Array.isArray(s[k]))s[k]=[];
 if(s.physics && (!s.physics.operation||typeof s.physics.operation!=='string'))throw Error('Invalid structured mechanics operation.');
 return s;
}
function setScene(s,origin='demo'){
 const next=validate(repairExamWallPin(clone(s)));scene=next;original=clone(next);source=origin;selected=null;buildStart=null;zoom=1;pan={x:0,y:0};
 show3d=Boolean(scene.spatial||['cable3d','vector3d','machine3d'].includes(scene.kind));orbitOn=true;if(show3d)ensureAnimation();
 $('threeD').disabled=!show3d;
 $('threeD').textContent=show3d?'◈ AUTO ORBIT: ON':'◈ 2D VIEW • LOCKED';
 $('sceneJson').value=JSON.stringify(scene,null,2);
 document.querySelectorAll('[data-mode]').forEach(button=>{
   button.disabled=Boolean(scene.physics)&&button.dataset.mode!=='select';
   if(scene.physics)button.classList.toggle('on',button.dataset.mode==='select');
 });
 if(scene.physics){mode='select';$('modeInfo').textContent='Reviewed mechanics input is locked to prevent drawing/physics divergence. Edit Advanced Input JSON to modify forces, cables, springs or coordinates.';}
 $('multiplier').disabled=Boolean(scene.physics);
 $('multiplier').title=scene.physics?'Edit the reviewed physics model in Advanced Input to change its loads; multiplier applies only to beams/trusses.':'Load multiplier';
 if(scene.physics){mult=1;$('multiplier').value=100;$('multiplierLabel').textContent='1.00×';}
 $('sceneTitle').textContent=scene.title||'UNNAMED DIAGRAM';
 $('explanation').textContent=scene.summary||scene.title||'Review the identified geometry and loading.';
 updateWorkflow('review');
 solveAndRender();
}
function gauss(A,b){const n=b.length;A=A.map(r=>r.slice());b=b.slice();for(let k=0;k<n;k++){let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(A[i][k])>Math.abs(A[pivot][k]))pivot=i;if(Math.abs(A[pivot][k])<1e-10)throw Error('Mechanism, insufficient restraints or singular geometry.');[A[k],A[pivot]]=[A[pivot],A[k]];[b[k],b[pivot]]=[b[pivot],b[k]];const d=A[k][k];for(let j=k;j<n;j++)A[k][j]/=d;b[k]/=d;for(let i=0;i<n;i++){if(i===k)continue;const f=A[i][k];for(let j=k;j<n;j++)A[i][j]-=f*A[k][j];b[i]-=f*b[k];}}return b;}
function solveTrussLegacy(){
 const ns=scene.nodes,N=ns.length,area=safe($('area').value,1200)*1e-6,E=safe($('elastic').value,200)*1e6,yieldMPa=safe($('yield').value,250);
 if(!area||!E||!yieldMPa)throw Error('Area, elastic modulus and yield stress must be positive.');
 if(scene.distributedLoads.length||scene.pointLoads.length||(scene.couples||[]).length)throw Error('Truss solver accepts joint loads only; member point/UDL loads require beam/frame modeling.');
 if(ns.some(n=>Math.abs(n.z)>1e-9))throw Error('3D node geometry requires a 3D solver.');
 const D=2*N,K=Array.from({length:D},()=>Array(D).fill(0)),F=Array(D).fill(0),elements=[];
 const ix=new Map(ns.map((n,i)=>[n.id,i]));
 for(const m of scene.members){const i=ix.get(m.a),j=ix.get(m.b),a=ns[i],b=ns[j],dx=(b.x-a.x)*lengthInM(),dy=(b.y-a.y)*lengthInM(),L=Math.hypot(dx,dy);if(L<1e-8)throw Error(`Zero-length member ${m.a}-${m.b}.`);const c=dx/L,s=dy/L,idx=[2*i,2*i+1,2*j,2*j+1],v=[c,s,-c,-s],k=E*area/L;for(let p=0;p<4;p++)for(let q=0;q<4;q++)K[idx[p]][idx[q]]+=k*v[p]*v[q];elements.push({m,i,j,L,c,s});}
 for(const l of scene.loads){let i=ix.get(l.node);F[2*i]+=safe(l.fx)*mult*forceInKN();F[2*i+1]+=safe(l.fy)*mult*forceInKN();}
 const fixed=[];ns.forEach((n,i)=>{if(n.support==='pin'||n.support==='fixed')fixed.push(2*i,2*i+1);if(n.support==='roller')fixed.push(2*i+1);});
 const free=Array.from({length:D},(_,i)=>i).filter(i=>!fixed.includes(i));if(!fixed.length||!free.length)throw Error('Insufficient DOFs/restraints.');
 const u=Array(D).fill(0),small=free.map(i=>free.map(j=>K[i][j])),rhs=free.map(i=>F[i]);const displacement=gauss(small,rhs);free.forEach((i,k)=>u[i]=displacement[k]);
 const forces=elements.map(({m,i,j,L,c,s})=>{const force=E*area/L*(c*(u[2*j]-u[2*i])+s*(u[2*j+1]-u[2*i+1]));const stress=force/area/1000;return {...m,force,stress,util:Math.abs(stress)/yieldMPa};});
  const reactions=ns.flatMap((n,i)=>{if(n.support==='none')return [];return [{id:n.id,rx:K[2*i].reduce((a,v,j)=>a+v*u[j],0)-F[2*i],ry:K[2*i+1].reduce((a,v,j)=>a+v*u[j],0)-F[2*i+1]}]});
  const appliedFx=scene.loads.reduce((v,l)=>v+safe(l.fx)*mult*forceInKN(),0),appliedFy=scene.loads.reduce((v,l)=>v+safe(l.fy)*mult*forceInKN(),0);
  const eqFx=appliedFx+reactions.reduce((v,r)=>v+r.rx,0),eqFy=appliedFy+reactions.reduce((v,r)=>v+r.ry,0);
  const eqM=scene.loads.reduce((v,l)=>{const n=node(l.node);return v+(n.x*safe(l.fy)-n.y*safe(l.fx))*mult*forceInKN();},0)+reactions.reduce((v,r)=>{const n=node(r.id);return v+n.x*r.ry-n.y*r.rx;},0);
  return {type:'truss',equilibrium:{fx:eqFx,fy:eqFy,m:eqM},forces,reactions,maxUtil:Math.max(0,...forces.map(f=>f.util)),maxDisp:Math.max(...ns.map((_,i)=>Math.hypot(u[i*2],u[i*2+1])))*1000};
}
function solveTruss(){
 const review=analyzeTrussScene(scene);
 if(review.warnings.length && scene.confidence < 1) throw Error(review.warnings[0]);
 return solveTrussModel(scene,{areaMm2:safe($('area').value,1200),elasticGPa:safe($('elastic').value,200),yieldMPa:safe($('yield').value,250),multiplier:mult});
}
function solveBeam(){
 return globalThis.TVStaticsSolvers.solveBeamStatics(scene,mult);

 if(scene.members.length!==1||scene.nodes.length!==2)throw Error('Beam engine currently supports one straight, simply supported span.');
 const a=scene.nodes[0],b=scene.nodes[1],left=Math.min(a.x,b.x),right=Math.max(a.x,b.x),L=right-left;
 if(L<=0||a.y!==b.y||!['pin','roller'].includes(a.support)||!['pin','roller'].includes(b.support))throw Error('Beam requires a horizontal span with pin/roller supports at the ends.');
 if((scene.couples||[]).length)throw Error('Applied moments require an upgraded beam solver. Visualizing moments only.');
 if(scene.distributedLoads.some(d=>Math.abs(safe(d.w)-safe(d.wEnd,d.w))>1e-8))throw Error('Triangular/trapezoidal loads require an upgraded beam solver.');
  if(scene.loads.some(l=>Math.abs(safe(l.fx))>1e-9)||scene.pointLoads.some(l=>Math.abs(safe(l.fx))>1e-9))throw Error('Horizontal loads are not supported by this beam calculator.');
 const pts=[...scene.pointLoads.map(p=>({x:safe(p.x),P:safe(p.fy)*mult})),...scene.loads.map(p=>({x:node(p.node)?.x??left,P:safe(p.fy)*mult}))];
 const udls=scene.distributedLoads.map(d=>({from:safe(d.from),to:safe(d.to),w:safe(d.w)*mult}));
 for(const p of pts)if(p.x<left-1e-9||p.x>right+1e-9)throw Error('Point load outside beam span.');
 for(const d of udls)if(d.from<left-1e-9||d.to>right+1e-9||d.from>=d.to)throw Error('Distributed load has invalid range.');
 const total=pts.reduce((s,p)=>s+p.P,0)+udls.reduce((s,d)=>s+d.w*(d.to-d.from),0);
 const moments=pts.reduce((s,p)=>s+p.P*(p.x-left),0)+udls.reduce((s,d)=>s+d.w*(d.to-d.from)*((d.from+d.to)/2-left),0);
  const RB=-moments/L,RA=-total-RB;
  const equilibrium={fx:0,fy:RA+RB+total,m:RB*L+moments};
 const results=Array.from({length:161},(_,i)=>{const x=left+L*i/160;let V=RA,M=RA*(x-left);for(const p of pts){if(x>=p.x){V+=p.P;M+=p.P*(x-p.x);}}for(const d of udls){const overlap=Math.max(0,Math.min(x,d.to)-d.from);V+=d.w*overlap;M+=d.w*overlap*(x-d.from-overlap/2);}return {x,V,M};});
  return {type:'beam',RA,RB,equilibrium,totalApplied:total,momentApplied:moments,span:L,points:results,maxShear:Math.max(...results.map(r=>Math.abs(r.V))),maxMoment:Math.max(...results.map(r=>Math.abs(r.M))),maxUtil:null};
}
function solveSpatialVectors(){
 return globalThis.TVStaticsSolvers.solveSpatialStatics(scene,mult);

 const loads=scene.loads||[];if(!loads.length)throw Error('No explicitly known spatial forces to sum; upload clearer image or review scene data.');
 let R={x:0,y:0,z:0},M={x:0,y:0,z:0};
 for(const l of loads){const n=node(l.node);if(!n)continue;const fx=safe(l.fx)*mult,fy=safe(l.fy)*mult,fz=safe(l.fz)*mult;
 R.x+=fx;R.y+=fy;R.z+=fz;
 M.x+=n.y*fz-n.z*fy;M.y+=n.z*fx-n.x*fz;M.z+=n.x*fy-n.y*fx;
 }
 for(const c of scene.couples||[]){M.x+=safe(c.mx)*mult;M.y+=safe(c.my)*mult;M.z+=safe(c.mz)*mult;}
 return {type:'spatial',R,M,maxUtil:null};
}
function solveAndRender(){
 problem=null;solution=null;
 try{
  if(!eligible())throw Error('Numbers/units need confirmation. Visualization can still be used.');
  if(scene.physics)solution=globalThis.TVMechanics.solvePhysics(scene.physics);
  else if(scene.kind==='truss')solution=solveTruss();
  else if(scene.kind==='beam')solution=solveBeam();
  else if(show3d)solution=solveSpatialVectors();
  else throw Error('This topic can be visualized, but its specialized physics solver is not implemented yet.');
 }catch(e){problem=e.message;}
 updateWorkflow(solution?'solve':'review');
 renderInformation();draw();
}
// Units: truss reactions and member forces are solved internally in kN.
// Scene loads and beam reactions are stored/displayed in scene.forceUnit.
// Applied loads and support reactions are different external force categories.
function formatSignedForce(value){
 const x=Number.isFinite(value)?value:0,clean=Math.abs(x)<0.0005?0:x;
 return `${clean>0?'+':''}${Math.abs(clean)>=100?clean.toFixed(1):clean.toFixed(2)}`;
}
function telemetryRow(parent,values,classes,columns){
 const row=document.createElement('div');
 row.className=`hud-table-row ${columns}`;
 values.forEach((v,i)=>{
  const cell=document.createElement('span');cell.textContent=String(v);
  if(classes?.[i])cell.className=classes[i];
  row.appendChild(cell);
 });
 parent.appendChild(row);
}
function telemetryMessage(parent,message){
 const text=document.createElement('div');text.className='telemetry-empty';text.textContent=message;parent.appendChild(text);
}
function renderForceTelemetry(){
 const memberBox=$('telemetry'),nodeBox=$('nodeTelemetry'),reactionBox=$('reactionTelemetry');
 for(const x of [memberBox,nodeBox,reactionBox])x.replaceChildren();
 $('nodeForceUnit').textContent=forceLabel();
 $('reactionUnit').textContent=forceLabel();
 const spatial=show3d;
 $('nodeTableHead').className=`hud-table-head ${spatial?'node-cols-3d':'node-cols'}`;
 $('reactionHead').className=`hud-table-head ${spatial?'node-cols-3d':'node-cols'}`;
 $('nodeTableHead').replaceChildren();$('reactionHead').replaceChildren();
 for(const h of spatial?['NODE','Fx','Fy','Fz']:['NODE','Fx','Fy']){
  const cell=document.createElement('span');cell.textContent=h;$('nodeTableHead').appendChild(cell);
 }
 for(const h of spatial?['NODE','Rx','Ry','Rz']:['NODE','Rx','Ry']){
  const cell=document.createElement('span');cell.textContent=h;$('reactionHead').appendChild(cell);
 }
 const memberCols='member-cols',nodeCols=spatial?'node-cols-3d':'node-cols';
 if(solution?.type==='truss'){
  if(solution.forces.length){
   for(const f of solution.forces){
    const value=f.force/forceInKN();
    const state=Math.abs(value)<0.0005?'ZERO':value>0?'TENS (+)':'COMP (-)';
    const color=state==='ZERO'?'force-zero':value>0?'force-tension':'force-compression';
    telemetryRow(memberBox,[`${f.a}${f.b}`,state,`${fmt(Math.abs(value))} ${forceLabel()}`],['member-name',color,color],memberCols);
   }
  }else telemetryMessage(memberBox,'No truss members in scene.');
 }else if(scene.kind==='truss')telemetryMessage(memberBox,`Member forces unavailable: ${problem||'truss solver not run'}`);
 else telemetryMessage(memberBox,'Member tension/compression is calculated only for supported 2D trusses.');
 // Sum known applied point loads at each joint. These values exclude reactions
 // and do not misrepresent force equilibrium at a joint.
 const jointForces=new Map(scene.nodes.map(n=>[n.id,{x:0,y:0,z:0}]));
 for(const load of scene.loads||[]){
  const f=jointForces.get(load.node);if(!f)continue;
  f.x+=safe(load.fx)*mult;f.y+=safe(load.fy)*mult;f.z+=safe(load.fz)*mult;
 }
 for(const n of scene.nodes){
  const f=jointForces.get(n.id);
  const values=[n.id,formatSignedForce(f.x),formatSignedForce(f.y)];
  if(spatial)values.push(formatSignedForce(f.z));
  telemetryRow(nodeBox,values,['member-name',...values.slice(1).map(v=>v.startsWith('-')?'force-negative':'force-positive')],nodeCols);
 }
 if(!scene.nodes.length)telemetryMessage(nodeBox,'No nodes were identified.');
 $('beamNodeNote').hidden=scene.kind!=='beam';
 if(solution?.type==='truss'){
  if(solution.reactions.length){
   for(const r of solution.reactions){
    const values=[r.id,formatSignedForce(r.rx/forceInKN()),formatSignedForce(r.ry/forceInKN())];
    telemetryRow(reactionBox,values,['member-name','force-reaction','force-reaction'],nodeCols);
   }
  }else telemetryMessage(reactionBox,'No supports found.');
 }else if(solution?.type==='beam'){
  const supports=scene.nodes;
  // Beam reactions include the horizontal pin restraint when applicable.
  const left=supports[0].x<=supports[1].x?supports[0]:supports[1];
  const right=left===supports[0]?supports[1]:supports[0];
  telemetryRow(reactionBox,[left.id,formatSignedForce(solution.horizontalAt===left.id?solution.Rx:0),formatSignedForce(solution.RA)],['member-name','force-reaction','force-reaction'],nodeCols);
  telemetryRow(reactionBox,[right.id,formatSignedForce(solution.horizontalAt===right.id?solution.Rx:0),formatSignedForce(solution.RB)],['member-name','force-reaction','force-reaction'],nodeCols);
 }else if(solution?.reactions?.length){
  for(const r of solution.reactions){const v=r.value,dir=r.direction||[0,0];telemetryRow(reactionBox,[`${r.body}:${r.name.split('.').pop()}`,formatSignedForce(v*dir[0]),formatSignedForce(v*dir[1])],['member-name','force-reaction','force-reaction'],nodeCols);}
 }else if(solution?.unknowns){telemetryMessage(reactionBox,'Solved reactions and tensions are listed in the Analysis Output.');}
 else telemetryMessage(reactionBox,'Not calculated for this problem type — never assume zero.');
}
function renderInformation(){
 $('kind').textContent=scene.kind.toUpperCase();$('counts').textContent=`${scene.nodes.length} / ${scene.members.length}`;
 $('confidence').textContent=source==='demo'?'DEMO':`${Math.round(safe(scene.confidence)*100)}% AI`;
 const util=solution?.type==='truss'?solution.maxUtil:null;
 $('util').textContent=util===null?'N/A':`${(util*100).toFixed(1)}%`;
 $('bar').style.width=util===null?'0%':`${Math.min(100,util*100)}%`;
 $('bar').style.background=util>1?'var(--red)':util>.75?'var(--amber)':'var(--green)';
 $('solverBadge').textContent=solution?.type==='resultant'?'RESULTANT ONLY':solution?(source==='demo'?'CALCULATED • DEMO':'CALCULATED • CHECK INPUT'):'VISUALIZATION ONLY';
 $('solverBadge').style.color=source==='demo'&&solution?'var(--green)':'var(--amber)';
 renderForceTelemetry();
 renderStudentAnalysis();
 updateTransferAvailability();
 $('results').replaceChildren();const r=$('results');
 const line=(a,b,invalid=false)=>{const d=document.createElement('div');if(invalid)d.className='invalid';const label=document.createElement('strong');label.textContent=a+': ';d.append(label,document.createTextNode(b));r.append(d);};
 line('Topic',scene.summary||scene.title||'Unknown');
 if(problem)line('Solver limitation',problem,true);
 if(solution?.type==='truss'){
 line('Max displacement',fmt(solution.maxDisp,' mm'));line('Max stress/yield',fmt(solution.maxUtil*100,'%'));
 line('Legend','Cyan = tension, amber = compression.');
 }
 if(solution?.type==='beam'){
 line('Left support',fmt(solution.RA,' '+forceLabel()));line('Right support',fmt(solution.RB,' '+forceLabel()));
 line('Maximum |moment|',fmt(solution.maxMoment,` ${forceLabel()}·${scene.units}`));
 line('Maximum |shear|',fmt(solution.maxShear,' '+forceLabel()));
 line('Chart','Bending moment drawn below beam; ideal simply-supported model.');
 }
 if(solution?.type==='spatial'){
 const {R,M}=solution;line('Σ applied F',`(${fmt(R.x)}, ${fmt(R.y)}, ${fmt(R.z)}) ${forceLabel()}`);
 line('Σ applied M about origin',`(${fmt(M.x)}, ${fmt(M.y)}, ${fmt(M.z)}) ${forceLabel()}·${scene.units}`);
 line('Limit','Sums known external forces only; reaction forces and 3D equilibrium are NOT solved.');
 }
 if(scene.physics && solution){
  line('Mechanics model',scene.physics.operation);
  const titleMap={centroid_polynomial:'Exact curved-area integration',rigid2d:'2D rigid body reactions',rigid3d:'3D rigid body reactions',particle:'Particle/cable tensions',spring:'Linear spring equilibrium',friction:'Friction thresholds',centroid:'Centroid & area inertia',resultant:'Force / moment resultant',virtual_work:'Virtual-work equilibrium'};
  line('Method',titleMap[scene.physics.operation]||scene.physics.operation);
  for(const [key,value] of Object.entries(solution.unknowns||{})){const unit=/\.(?:M|Mx|My|Mz)$/.test(key)?`${forceLabel()}·${scene.units}`:forceLabel();line(key,fmt(value,` ${unit}`));}
  const omit=new Set(['type','unknowns','description','reactions','residuals','rank','equations','maxResidual','appliedResultant','appliedMoment']);
  for(const [key,value] of Object.entries(solution))if(!omit.has(key)){
    if(typeof value==='number'){const su=key==='area'?`${scene.units}²`:/^(?:Ix|Iy|Ixy|IxCentroid|IyCentroid|IxyCentroid)$/.test(key)?`${scene.units}⁴`:/^(?:cx|cy|extension)$/.test(key)?scene.units:/^(?:slidingForce|tippingForce|highTension|lowTension|force|requiredFriction|normal|maxStaticFriction)$/.test(key)?forceLabel():'';line(key,fmt(value,su?` ${su}`:''));}
    else if(typeof value==='boolean'||typeof value==='string')line(key,String(value));
    else if(Array.isArray(value))line(key,value.map(x=>fmt(x)).join(', ')+(` ${key==='M'?forceLabel()+'·'+scene.units:key==='R'?forceLabel():''}`));
  }
  if(solution.maxResidual!==undefined)line('Max equilibrium residual',fmt(solution.maxResidual));
  if(solution.description)line('Assumptions',solution.description);
 }
 for(const step of (scene.studySteps||[]).slice(0,5))line('Learning step',step);
 line('Source',source==='demo'?'Original demo':'AI-generated interpretation; values may be inaccurate. Inspect before relying on any result.');
 const reviewWarnings=scene.kind==='truss'?analyzeTrussScene(scene).warnings:[];
 const notes=[...new Set([...(scene.warnings||[]),...(solution?.stabilityWarning?[solution.stabilityWarning]:[]),...reviewWarnings,...(scene.questions||[]).map(q=>'Confirm: '+q),...(problem&&scene.kind==='truss'?[`Review geometry & supports: ${problem} Use ADVANCED INPUT to correct the extracted topology before solving.`]:[])])];
 $('warnings').replaceChildren();for(const w of notes){const n=document.createElement('div');n.className='note';n.textContent='⚠ '+w;$('warnings').append(n);}
}
// Equilibrium always governs a body at rest: unknown reactions must be included.
// Never substitute zero for an unsolved reaction or an unbalanced subset of loads.
function renderStudentAnalysis(){
 const target=$('analysisSteps');if(!target)return;target.replaceChildren();
 const add=(heading,body)=>{const block=document.createElement('section');block.className='analysis-step';const title=document.createElement('h3');title.textContent=heading;const para=document.createElement('p');para.textContent=body;block.append(title,para);target.append(block);};
 const u=forceLabel(),length=scene.units,allLoads=(scene.loads||[]).length+(scene.pointLoads||[]).length+(scene.distributedLoads||[]).length;
 add('1. Read the problem',`${scene.summary||scene.title||'Review the diagram.'} ${scene.nodes.length} identified nodes, ${scene.members.length} connecting elements, ${allLoads} load entries. Units: ${u}, ${length}. ${source==='demo'?(scene.physics?'Reviewed mechanics example: edit the physics object in Advanced Input to change forces/geometry.':'Demonstration data: change loads or geometry to explore the outcome.'):'Review every extracted or edited magnitude, direction, length and support before trusting the math.'}`);
 add('2. Draw the free-body diagram','Isolate the structure. Replace pin restraints with horizontal and vertical reactions; replace rollers with their restrained-direction reaction. Show each external load and its direction. For distributed loads, use the equivalent resultant at its centroid when taking moments.');
 add('3. Apply equilibrium','Because the structure is static, the COMPLETE set of external forces and moments must satisfy ΣFx = 0, ΣFy = 0, and ΣM = 0 in 2D; in 3D all three force and all three moment components must balance. Applied loads alone usually do NOT sum to zero: support reactions and unknown forces complete the balance.');
 if(problem){
  add('4. What can be solved',`A numerical answer is not available for this model: ${problem} The equilibrium equations still apply. Avoid assigning zero to unknown reactions.`);
 }else if(scene.physics && solution){
  const entries=Object.entries(solution.unknowns||{}).map(([k,v])=>`${k} = ${fmt(v)} ${u}`);
  const scalarKeys=Object.entries(solution).filter(([k,v])=>typeof v==='number'&&k!=='maxResidual').slice(0,9).map(([k,v])=>`${k}: ${fmt(v)}`);
  const vectors=Object.entries(solution).filter(([k,v])=>['R','M'].includes(k)&&Array.isArray(v)).map(([k,v])=>`${k}=(${v.map(x=>fmt(x)).join(', ')}) ${k==='M'?u+'·'+length:u}`);
  const principles={centroid_polynomial:'Integrate the true polynomial top and bottom boundaries exactly: dA=(y_top−y_bottom)dx, Iy=∫x²dA, and Ix=∫(y_top³−y_bottom³)dx/3.',spring:'Hooke law: F = kδ. Parallel stiffnesses add; series compliances add. First convert masses to weights with W = mg.',rigid2d:'Isolate EACH body. Write ΣFx=0, ΣFy=0 and ΣM=0, include moments from offset forces, springs, rope segments, supports and internal pin reactions.',rigid3d:'Write ΣFx=ΣFy=ΣFz=0 and ΣMx=ΣMy=ΣMz=0. For each applied force use M=r×F; a fixed support can supply three reactions and three reaction couples.',particle:'At the isolated joint, sum each cable tension along its UNIT direction and set all coordinate force components to zero. Cables cannot carry compression.',friction:'Use the appropriate impending-motion model: F_lim = μs N for dry contact; T_high/T_low=e^(μθ) for belt friction; compare sliding and tipping thresholds.',centroid:'For each signed polygon integrate dA, x dA, y dA, x² dA and y² dA. Subtract holes and apply the parallel-axis theorem.',resultant:'Sum the known applied forces and moments about the chosen reference point: R=ΣF and M_O=Σ(r×F)+ΣM_couple.',virtual_work:'Specify a physically compatible virtual displacement. For ideal stationary constraints, total external virtual work is zero.'};
  add('4. Set up this mechanics model',`${principles[scene.physics.operation]||'Write the governing equilibrium equations.'} ${solution.description||''} Do not assume supports/cables exist unless they were explicitly supplied.`);
  if(solution.stabilityWarning)add('Model stability warning',solution.stabilityWarning);
  add('5. Numerical result',`${[...entries,...vectors,...scalarKeys].join('; ')||'See Analysis Output for resultants.'}${solution.maxResidual!==undefined?` Max equation residual: ${fmt(solution.maxResidual)}.`:''} These values are only as accurate as the reviewed input and selected idealizations.`);
 }else if(solution?.type==='beam'){
  const q=solution;
  add('4. Solve the reactions',`Take moments about the left support: R_B × ${fmt(q.span)} ${length} + (${fmt(q.momentApplied)} ${u}·${length}) = 0, so R_B = ${fmt(q.RB)} ${u}. Then ΣFy = 0: R_A + R_B + (${fmt(q.totalApplied)} ${u}) = 0, giving R_A = ${fmt(q.RA)} ${u}.`);
  add('5. Shear and bending',`Cut sections along the beam and sum forces to obtain shear V(x); integrate shear to obtain bending moment M(x). Peak sampled |V| = ${fmt(q.maxShear)} ${u}; peak sampled |M| = ${fmt(q.maxMoment)} ${u}·${length}. These are sampled values, so an exact local peak between samples may differ.`);
 }else if(solution?.type==='truss'){
  const q=solution;
  const highest=[...q.forces].sort((a,b)=>Math.abs(b.force)-Math.abs(a.force))[0];
  const rx=q.reactions.map(r=>`${r.id}: (${fmt(r.rx/forceInKN())}, ${fmt(r.ry/forceInKN())}) ${u}`).join('; ');
  add('4. Solve joint forces and reactions',`The pin-jointed truss uses axial member stiffness and displacement compatibility. Computed support reactions: ${rx}. Positive axial member force means tension; negative means compression.${highest?` The highest |axial force| is ${highest.a}–${highest.b}: ${fmt(highest.force/forceInKN())} ${u}.`:''}`);
  add('5. Interpret the result',`Maximum joint displacement ≈ ${fmt(q.maxDisp)} mm; maximum axial stress/yield ratio ≈ ${fmt(q.maxUtil*100)}%. Stress results depend on the assumed area, modulus, yield stress and the ideal pin-joint/linear-elastic model. This is not a buckling or code-compliance check.`);
 }else if(solution?.type==='spatial'){
  const q=solution;
  add('4. Balance the 3D force system',`Sum of KNOWN applied forces = (${fmt(q.R.x)}, ${fmt(q.R.y)}, ${fmt(q.R.z)}) ${u}. Sum of KNOWN applied moments about the origin = (${fmt(q.M.x)}, ${fmt(q.M.y)}, ${fmt(q.M.z)}) ${u}·${length}. The missing cable or bearing reactions must oppose these as required by the actual support constraints; their individual values have NOT been solved.`);
  add('5. Next equations','List each allowable support reaction or cable tension, resolve along x/y/z and use ΣFx = ΣFy = ΣFz = 0 plus ΣMx = ΣMy = ΣMz = 0. Additional member geometry or constitutive relations may be needed. Do not assume every applied-force component is zero.');
 }
 if(solution?.equilibrium){
  const e=solution.equilibrium;
  const forceScale=solution.type==='beam'?[Math.abs(solution.RA),Math.abs(solution.RB),Math.abs(solution.totalApplied)]:solution.reactions.flatMap(r=>[Math.abs(r.rx),Math.abs(r.ry)]);
  const forceTol=1e-6*Math.max(1,...forceScale),momentTol=1e-6*Math.max(1,Math.abs(solution.type==='beam'?solution.momentApplied:0));
  const forcePass=Math.max(Math.abs(e.fx),Math.abs(e.fy))<=forceTol,momentPass=solution.type!=='truss'||Math.abs(e.m)<=momentTol;
  add('Equilibrium verification',`Calculated residuals (should be approximately zero): ΣFx = ${fmt(e.fx)} ${solution.type==='truss'?'kN':u}, ΣFy = ${fmt(e.fy)} ${solution.type==='truss'?'kN':u}, ΣM = ${fmt(e.m)} ${solution.type==='truss'?'kN·'+length:u+'·'+length}. ${forcePass&&momentPass?'Force and moment equilibrium checks passed.':'WARNING: equilibrium needs review.'} Small residuals are numerical rounding effects, not permission to skip reaction forces.`);
 }
 if((scene.studySteps||[]).length)add('Study prompts',scene.studySteps.slice(0,5).join(' '));
 if(scene.explanation)add('Model context',scene.explanation);
}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
function bounds(){
 const all=scene.nodes||[];if(!all.length)return {minX:0,maxX:1,minY:0,maxY:1,minZ:0,maxZ:1};
 return {minX:Math.min(...all.map(n=>n.x)),maxX:Math.max(...all.map(n=>n.x)),minY:Math.min(...all.map(n=>n.y)),maxY:Math.max(...all.map(n=>n.y)),minZ:Math.min(...all.map(n=>n.z||0)),maxZ:Math.max(...all.map(n=>n.z||0))};
}
function setupView(){
 const {width:w,height:h}=canvas.getBoundingClientRect(),b=bounds();
 const dx=Math.max(2,b.maxX-b.minX),dy=Math.max(2,b.maxY-b.minY),dz=Math.max(2,b.maxZ-b.minZ);
 view={cx:(b.maxX+b.minX)/2,cy:(b.maxY+b.minY)/2,cz:(b.maxZ+b.minZ)/2,s:Math.max(2,Math.min((w-145)/(show3d?Math.hypot(dx,dz):dx),(h-160)/(show3d?Math.hypot(dy,dz):dy)))*zoom};
}
function project(n){
 const x=n.x-view.cx,y=n.y-view.cy,z=(n.z||0)-view.cz;
 const yaw=angle,ca=Math.cos(yaw),sa=Math.sin(yaw),ct=Math.cos(tilt),st=Math.sin(tilt);
 const X=x*ca-z*sa,Z=x*sa+z*ca;
 const xp=x+(X-x)*orbitMix,yp=y+(y*ct-Z*st-y)*orbitMix;
 const depth=Z*st-y*ct;
 const perspective=1/(1+orbitMix*Math.max(-.5,Math.min(.5,depth/(Math.max(3,view.s)*16))));
 const r=canvas.getBoundingClientRect();return {x:r.width/2+xp*view.s*perspective+pan.x,y:r.height/2-yp*view.s*perspective+pan.y,depth};
}
function unproject(p){return {x:view.cx+(p.x-canvas.clientWidth/2-pan.x)/view.s,y:view.cy-(p.y-canvas.clientHeight/2-pan.y)/view.s};}
function line(a,b,color='#13e5fa',width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function drawArrow(a,b,color,label){line(a,b,color,2.6);const theta=Math.atan2(b.y-a.y,b.x-a.x);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-11*Math.cos(theta-.45),b.y-11*Math.sin(theta-.45));ctx.lineTo(b.x-11*Math.cos(theta+.45),b.y-11*Math.sin(theta+.45));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(label){ctx.fillStyle=color;ctx.font='11px JetBrains Mono';ctx.fillText(label,a.x+9,a.y-12);}}
function drawSupport(n,p){if(n.support==='none')return;ctx.save();ctx.strokeStyle='#ffcb69';ctx.fillStyle='#ffc96833';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y+8);ctx.lineTo(p.x-12,p.y+27);ctx.lineTo(p.x+12,p.y+27);ctx.closePath();ctx.fill();ctx.stroke();if(n.support==='roller'){ctx.beginPath();for(let k of [-6,6]){ctx.moveTo(p.x+k+4,p.y+31);ctx.arc(p.x+k,p.y+31,4,0,Math.PI*2);}ctx.stroke();}if(n.support==='fixed'){ctx.beginPath();ctx.moveTo(p.x-18,p.y+31);ctx.lineTo(p.x+18,p.y+31);ctx.stroke();}ctx.restore();}
function draw(){
 if(!canvas.width||!canvas.height)return;
 const W=canvas.clientWidth,H=canvas.clientHeight;ctx.clearRect(0,0,W,H);setupView();ctx.save();
 ctx.strokeStyle='#1f60702b';ctx.lineWidth=1;
 for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
 for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 if(!scene.nodes.length){if(sourceImage?.complete&&sourceImage.naturalWidth){const ratio=Math.min((W-35)/sourceImage.naturalWidth,(H-75)/sourceImage.naturalHeight);const iw=sourceImage.naturalWidth*ratio,ih=sourceImage.naturalHeight*ratio;ctx.globalAlpha=.82;ctx.drawImage(sourceImage,(W-iw)/2,(H-ih)/2,iw,ih);ctx.globalAlpha=1;}ctx.font='12px JetBrains Mono';ctx.fillStyle='#69aabb';ctx.textAlign='center';ctx.fillText('REFERENCE IMAGE • CHECK EXTRACTION',W/2,H-18);ctx.textAlign='left';ctx.restore();return;}
 if(orbitMix>.03){
  // perspective groundplane with glowing x/y/z axes; purely illustrative, no fabricated members
  const bb=bounds();const r=Math.max(2,bb.maxX-bb.minX,bb.maxY-bb.minY,bb.maxZ-bb.minZ)*.7;
  const o={x:view.cx,y:view.cy,z:view.cz};
  for(const axis of [{dx:r,dy:0,dz:0,c:'#ff637e',l:'X'},{dx:0,dy:r,dz:0,c:'#87ffb2',l:'Y'},{dx:0,dy:0,dz:r,c:'#72a6ff',l:'Z'}]){
   const a=project(o),b=project({x:o.x+axis.dx,y:o.y+axis.dy,z:o.z+axis.dz});ctx.globalAlpha=.48*orbitMix;drawArrow(a,b,axis.c,axis.l);ctx.globalAlpha=1;
  }
  const floor=bb.minY-Math.max(.3,(bb.maxY-bb.minY)*.2);ctx.globalAlpha=.15*orbitMix;
  for(let t=-4;t<=4;t++){
   const h=r*t/4;
   line(project({x:view.cx-r,y:floor,z:view.cz+h}),project({x:view.cx+r,y:floor,z:view.cz+h}),'#3cdeee',1);
   line(project({x:view.cx+h,y:floor,z:view.cz-r}),project({x:view.cx+h,y:floor,z:view.cz+r}),'#3cdeee',1);
  }ctx.globalAlpha=1;
 }
 const projected=new Map(scene.nodes.map(n=>[n.id,project(n)]));
 // Visualize idealized springs and rope wheels without changing solved physics.
 if(scene.kind==='pulley2d'&&scene.nodes.some(n=>n.id==='P')){
  const p=projected.get('P');ctx.save();ctx.strokeStyle='#48e4f8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,20,0,2*Math.PI);ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,5,0,2*Math.PI);ctx.fillStyle='#48e4f8';ctx.fill();ctx.restore();
 }
 if(scene.kind==='spring2d'&&scene.nodes.length>=2){
  const a=projected.get(scene.nodes[0].id),b=projected.get(scene.nodes[1].id),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  ctx.save();ctx.strokeStyle='#76f7ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);for(let i=1;i<=16;i++){const t=i/16,offset=i===16?0:(i%2?1:-1)*9;ctx.lineTo(a.x+t*dx+offset*nx,a.y+t*dy+offset*ny);}ctx.stroke();ctx.restore();
 }

 // Solid/hollow polygon regions are used for centroid geometry, not for structural solution.
 for(const region of scene.shapes||[]){const points=(region.points||[]).map(project);if(points.length<3)continue;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=region.mode==='cutout'?'#030914':'#16e4ff20';ctx.strokeStyle='#1eeeff';ctx.lineWidth=2;ctx.fill();ctx.stroke();if(showLabels){ctx.fillStyle='#d9fbff';ctx.fillText(region.label||'REGION',points[0].x+5,points[0].y-8);}}
 const edges=scene.members.map((m,i)=>({m,i,a:projected.get(m.a),b:projected.get(m.b)})).filter(e=>e.a&&e.b).sort((a,b)=>(b.a.depth+b.b.depth)-(a.a.depth+a.b.depth));
 for(const e of edges){const {m,i,a,b}=e,f=solution?.type==='truss'?solution.forces[i]:null;
  const color=f?(f.force>=0?'#04ddf6':'#ffb86c'):'#3ebfd6';
  if(orbitMix>.04){line({x:a.x+2*orbitMix,y:a.y+3*orbitMix},{x:b.x+2*orbitMix,y:b.y+3*orbitMix},'#082a4c',8);line(a,b,'#144d79',6);line(a,b,color,3.4);}
  else line(a,b,color,f?4:3);
  if(showLabels&&f){ctx.fillStyle='#d6faff';ctx.font='10px JetBrains Mono';ctx.fillText(fmt(f.force/forceInKN(),' '+forceLabel()),(a.x+b.x)/2+6,(a.y+b.y)/2-6);}
 }
 if(scene.kind==='beam' && scene.nodes.length>=2){
  for(const d of scene.distributedLoads){
   const a=project({x:d.from,y:scene.nodes[0].y}),b=project({x:d.to,y:scene.nodes[0].y});const c='#ffcb67';
   line({x:a.x,y:a.y-67},{x:b.x,y:b.y-67},c,2);
   const steps=Math.max(3,Math.min(20,Math.ceil(Math.abs(b.x-a.x)/24)));
   for(let i=0;i<=steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t;const m=Math.max(.1,Math.abs(safe(d.w)*(1-t)+safe(d.wEnd,d.w)*t)/Math.max(.01,Math.abs(d.w),Math.abs(d.wEnd||d.w)));drawArrow({x,y:a.y-10-57*m},{x,y:a.y-10},c,'');}
   ctx.fillStyle=c;ctx.font='10px JetBrains Mono';ctx.fillText(d.label||'DISTRIBUTED',a.x,a.y-78);
  }
  for(const p of scene.pointLoads){const pt=project({x:p.x,y:scene.nodes[0].y});drawArrow({x:pt.x,y:pt.y-92},{x:pt.x,y:pt.y-9},'#ff657f',p.label||fmt(p.fy));}
  if(solution?.type==='beam'){
   const data=solution.points,scale=Math.max(1e-6,...data.map(v=>Math.abs(v.M))),base=H-58;
   ctx.strokeStyle='#fdc56b';ctx.lineWidth=2;ctx.beginPath();data.forEach((r,i)=>{const x=project({x:r.x,y:scene.nodes[0].y}).x,y=base-r.M/scale*57;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
   ctx.fillStyle='#ffcb68';ctx.font='10px JetBrains Mono';ctx.fillText('BENDING MOMENT',12,base-81);
   ctx.strokeStyle='#487189';ctx.beginPath();ctx.moveTo(0,base);ctx.lineTo(W,base);ctx.stroke();
  }
 }
 for(const n of scene.nodes){const p=projected.get(n.id);drawSupport(n,p);ctx.beginPath();ctx.arc(p.x,p.y,n.id===selected?8:6,0,2*Math.PI);ctx.fillStyle=n.id===selected?'#ffffff':'#0be8ff';ctx.shadowColor='#00dfff';ctx.shadowBlur=15;ctx.fill();ctx.shadowBlur=0;if(showLabels){ctx.font='bold 12px JetBrains Mono';ctx.fillStyle='#d9fbff';ctx.fillText(n.id,p.x+10,p.y-11);}}
 for(const l of scene.loads){const n=node(l.node);if(!n)continue;const p=projected.get(n.id),fx=safe(l.fx)*mult,fy=safe(l.fy)*mult,fz=safe(l.fz)*mult;if(!fx&&!fy&&!fz)continue;
  const size=60/(Math.hypot(fx,fy,fz)||1),tip=project({x:n.x+fx*size/view.s,y:n.y+fy*size/view.s,z:(n.z||0)+fz*size/view.s});
  // Draw arrow toward the point of action, with head exactly at the joint.
  let dx=tip.x-p.x,dy=tip.y-p.y,mg=Math.hypot(dx,dy)||1;
  const start={x:p.x-dx/mg*66,y:p.y-dy/mg*66};drawArrow(start,p,'#ff637e',showLabels?(l.label||fmt(Math.hypot(fx,fy,fz),' '+forceLabel())):'');
 }
 for(const c of scene.couples||[]){const n=node(c.node),p=n&&projected.get(n.id);if(!p)continue;
  ctx.strokeStyle='#f5b86a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,24,.4,5.6,c.mz<0);ctx.stroke();ctx.fillStyle='#ffc968';if(showLabels)ctx.fillText(c.label||'M',p.x+25,p.y-24);
 }
 if(buildStart){const p=projected.get(buildStart);if(p){ctx.strokeStyle='#ffe288';ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.stroke();}}
 ctx.fillStyle='#598da4';ctx.font='10px JetBrains Mono';ctx.fillText(show3d?'3D • DRAG TO ORBIT • AUTO MOTION':'2D • PHYSICAL PLANE',14,H-15);ctx.restore();
}
const pos=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
function hit(p){let result=null,dist=16;for(const n of scene.nodes){const q=project(n),d=Math.hypot(p.x-q.x,p.y-q.y);if(d<dist){dist=d;result=n.id;}}return result;}
const loadDialog=$('loadDialog'),loadValue=$('loadValue'),loadUnit=$('loadUnit');let pendingLoadNode=null;
function openLoadDialog(id){
 pendingLoadNode=id;const exists=scene.loads.find(l=>l.node===id);loadValue.value=String(exists?.fy??-20);loadUnit.textContent=forceLabel();showError('');
 if(typeof loadDialog.showModal==='function'){loadDialog.showModal();loadValue.focus();}else loadValue.focus();
}
loadDialog?.addEventListener('close',()=>{
 if(loadDialog.returnValue!=='apply'||!pendingLoadNode)return;
 const value=Number(loadValue.value);if(!Number.isFinite(value)){showError('Enter a valid numeric load.');return;}
 scene.loads=scene.loads.filter(l=>l.node!==pendingLoadNode);if(value!==0)scene.loads.push({node:pendingLoadNode,fx:0,fy:value,fz:0,label:`${Math.abs(value)} ${forceLabel()}`});pendingLoadNode=null;sync();
});
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);const p=pos(e),id=hit(p);if(mode==='delete'&&id){scene.members=scene.members.filter(m=>m.a!==id&&m.b!==id);scene.loads=scene.loads.filter(l=>l.node!==id);scene.nodes=scene.nodes.filter(n=>n.id!==id);sync();return;}if(mode==='build'){if(!id)return;if(!buildStart){buildStart=id;}else if(buildStart!==id&&!scene.members.some(m=>(m.a===buildStart&&m.b===id)||(m.a===id&&m.b===buildStart))){scene.members.push({a:buildStart,b:id});buildStart=null;sync();}else buildStart=null;draw();return;}if(mode==='load'&&id){openLoadDialog(id);return;}selected=id;drag={p,start:pos(e),id,pan:{...pan},angle,tilt,original:id?{...node(id)}:null};draw();});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=pos(e),dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(drag.id&&!show3d&&mode==='select'&&!scene.physics){const n=node(drag.id);n.x=drag.original.x+dx/view.s;n.y=drag.original.y-dy/view.s;scheduleSolve();}else if(show3d){angle=drag.angle+dx/145;tilt=Math.max(-1.1,Math.min(1.15,drag.tilt+dy/250));orbitedAt=performance.now();draw();}else if(!drag.id){pan.x=drag.pan.x+dx;pan.y=drag.pan.y+dy;draw();}});
canvas.addEventListener('pointerup',()=>{if(drag?.id)sync();drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.25,Math.min(5,zoom*(e.deltaY>0?.9:1.1)));draw();},{passive:false});
function sync(){try{validate(scene);}catch(e){showError(e.message);} $('sceneJson').value=JSON.stringify(scene,null,2);solveAndRender();}
function showError(t){$('error').hidden=!t;$('error').textContent=t||'';}
document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.mode;buildStart=null;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on',b===btn));$('modeInfo').textContent={select:show3d?'Drag to orbit the spatial model; scroll to zoom.':'Drag joints to move them, pan blank space, wheel to zoom.',load:`Click a joint to set a vertical load in ${forceLabel()}.`,build:'Click two joints to add a member.',delete:'Click a joint to delete it and its attached members.'}[mode];draw();}));
$('threeD').onclick=()=>{if(!show3d)return;orbitOn=!orbitOn;$('threeD').textContent=`◈ AUTO ORBIT: ${orbitOn?'ON':'PAUSED'}`;draw();};$('fit').onclick=()=>{zoom=1;pan={x:0,y:0};draw();};$('labels').onclick=()=>{showLabels=!showLabels;$('labels').classList.toggle('on',showLabels);draw();};
$('multiplier').oninput=e=>{mult=Number(e.target.value)/100;$('multiplierLabel').textContent=mult.toFixed(2)+'×';solveAndRender();};for(const id of ['area','elastic','yield'])$(id).addEventListener('input',solveAndRender);
$('loadDemo').onclick=()=>{mult=1;$('multiplier').value=100;$('multiplierLabel').textContent='1.00×';setScene(demos[$('example').value]);showError('');};$('reset').onclick=()=>{setScene(original,source);showError('');};$('applyJson').onclick=()=>{try{const s=JSON.parse($('sceneJson').value);setScene(s,'edited');showError('');}catch(e){showError(`Invalid scene: ${e.message}`);}};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(scene,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='trussvision-scene.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);};
let currentFile=null,sourceImage=null;
function useFile(file){
 showError('');if(!file)return;
 currentFile=null;$('analyze').disabled=true;
 if(!file.size){showError('This file is empty. Choose a valid image or PDF.');return;}
 if(!['image/png','image/jpeg','image/webp','application/pdf'].includes(file.type)){showError('Please select a JPG, PNG, WebP or PDF.');return;}
  if(file.type==='application/pdf'&&file.size>3*1024*1024){showError('PDF must be under 3 MB. For a multi-page exam, screenshot one question as JPG.');return;}
 if(file.type!=='application/pdf'&&file.size>22*1024*1024){showError('Please choose an image under 22 MB.');return;}
 currentFile=file;$('analyze').disabled=false;updateWorkflow('scan');
 if(file.type==='application/pdf'){sourceImage=null;$('thumb').hidden=true;$('latency').textContent='PDF ready • upload one problem/page for best accuracy';}
 else{const reader=new FileReader();reader.onload=()=>{$('thumb').src=reader.result;$('thumb').hidden=false;sourceImage=new Image();sourceImage.onload=()=>draw();sourceImage.src=reader.result;};reader.readAsDataURL(file);$('latency').textContent='Press SCAN to begin';}
 $('status').textContent='● LOADED';
}
$('choose').onclick=()=>$('file').click();$('drop').onclick=()=>$('file').click();
$('drop').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();$('file').click();}});
$('file').onchange=e=>{const picked=e.target.files?.[0];e.target.value='';useFile(picked);};
$('drop').ondragover=e=>{e.preventDefault();$('drop').classList.add('dragging');};
$('drop').ondragleave=()=>$('drop').classList.remove('dragging');
$('drop').ondrop=e=>{e.preventDefault();$('drop').classList.remove('dragging');useFile(e.dataTransfer.files?.[0]);};
// Downscale phone screenshots before upload to stay comfortably under Netlify's 6 MB buffered request limit.
async function shrinkImage(file){
 if(file.type==='application/pdf'){const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(Error('Cannot read PDF.'));r.readAsDataURL(file);});return {base64,mimeType:'application/pdf'};}
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Cannot read this image.'));image.src=url;});
  const scale=Math.min(1,1800/Math.max(image.naturalWidth,image.naturalHeight));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(image.naturalWidth*scale));c.height=Math.max(1,Math.round(image.naturalHeight*scale));
  c.getContext('2d',{alpha:false}).drawImage(image,0,0,c.width,c.height);
  let data=c.toDataURL('image/jpeg',.82);
  if(data.length>3.5e6)data=c.toDataURL('image/jpeg',.63);
  if(data.length>5e6)throw Error('Image is still too large. Crop the problem diagram and try again.');
  return {base64:data.split(',')[1],mimeType:'image/jpeg'};
 }finally{URL.revokeObjectURL(url);}
}
let scanStarted=0,scanTick;
async function requestSceneAnalysis(encoded){
 const payload={model:$('model').value,...encoded,detailed:$('detailed')?.checked||false};
 const directPayload={apiKey:$('apiKey').value,...payload};
 const serverPayload={model:payload.model,base64:payload.base64,mimeType:payload.mimeType,detailed:payload.detailed};
 // Prefer a same-origin backend. Static hosts have no backend, so their
 // 404/405/501 responses are an explicit signal to use a personal browser key.
 const apiUrl=new URL('../api/analyze',location.href);
 let response;
 try{
  response=await fetch(apiUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(serverPayload)});
 }catch(networkError){
  // A missing network connection cannot be rescued by a direct Google request.
  throw Error('Cannot reach the analysis service. Check your connection and try again.');
 }
 if(![404,405,501].includes(response.status)){
  let data;
  try{data=await response.json();}catch{throw Error('The analysis API returned unreadable data.');}
  if(response.ok)return data;
  if(data?.code!=='SERVER_NOT_CONFIGURED')throw Error(data?.error||`Scan HTTP ${response.status}`);
 }
 if(!window.TVGemini?.analyze)throw Error('Direct image scanning is unavailable.');
 if(!directPayload.apiKey.trim())throw Error('Static hosting requires a Google AI Studio API key. Open AI Settings to add yours.');
 $('latency').textContent='Reading diagram…';
 return window.TVGemini.analyze(directPayload);
}
$('analyze').onclick=async()=>{
 if(!currentFile)return;
 showError('');$('analyze').disabled=true;$('status').textContent='● SCANNING';$('drop').classList.add('scanning');
 scanStarted=performance.now();$('latency').textContent='Preparing photo…';
 scanTick=setInterval(()=>{$('latency').textContent=`AI working… ${Math.floor((performance.now()-scanStarted)/1000)}s`;},250);
 try{
  const encoded=await shrinkImage(currentFile);
  const data=await requestSceneAnalysis(encoded);
  setScene(data.scene,'ai');$('status').textContent='● PARSED';
  $('latency').textContent=`Extracted in ${((performance.now()-scanStarted)/1000).toFixed(1)}s • ${scene.kind.toUpperCase()} • ${show3d?'3D':'2D'}`;
 }catch(err){$('status').textContent='● ERROR';updateWorkflow('scan');showError(err.message);$('latency').textContent='Analysis failed — review error';}
 finally{clearInterval(scanTick);$('drop').classList.remove('scanning');$('analyze').disabled=false;}
};
function animate(ts){
 const dt=lastFrame?Math.min(.05,(ts-lastFrame)/1000):0;lastFrame=ts;
 const target=show3d?1:0;
 if(Math.abs(orbitMix-target)>.002)orbitMix+=(target-orbitMix)*Math.min(1,dt*5.5);
 else orbitMix=target;
 const wantedSpeed=show3d&&orbitOn&&!drag&&ts-orbitedAt>2400?.32:0;
 orbitSpeed+=(wantedSpeed-orbitSpeed)*Math.min(1,dt*3.6);angle+=dt*orbitSpeed;
 if(show3d||orbitMix>.002)draw();
 if(show3d||Math.abs(orbitMix-target)>.002)animationFrame=requestAnimationFrame(animate);else{animationFrame=0;lastFrame=0;}
}
function ensureAnimation(){if(!animationFrame)animationFrame=requestAnimationFrame(animate);}
new ResizeObserver(resize).observe(canvas);setScene(demos.truss);resize();if(show3d)ensureAnimation();

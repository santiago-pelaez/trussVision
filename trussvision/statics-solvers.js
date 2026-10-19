'use strict';
// Pure, dependency-free statics routines. Positive x right, y up, CCW moment positive.
function finite(v, label) { const x = Number(v); if (!Number.isFinite(x)) throw new Error(`Invalid ${label}`); return x; }
function solveBeamStatics(scene, multiplier=1) {
  if(scene.kind !== 'beam') throw new Error('Expected beam model');
  const ns=scene.nodes||[], ms=scene.members||[];
  if(ns.length!==2||ms.length!==1)throw new Error('Only one straight beam span is supported.');
  const [a,b]=ns.map(n=>({...n,x:finite(n.x,'node x'),y:finite(n.y,'node y')})).sort((p,q)=>p.x-q.x);
  const L=b.x-a.x;
  if(!(L>0)||Math.abs(a.y-b.y)>1e-9)throw new Error('A horizontal nonzero span is required.');
  if(!['pin','roller'].includes(a.support)||!['pin','roller'].includes(b.support)||!(a.support==='pin'||b.support==='pin'))throw new Error('Exactly one or more horizontal restraints (pin) and two vertical restraints are required.');
  const scale=finite(multiplier,'load multiplier');
  const nodeMap=new Map(ns.map(n=>[n.id,n]));
  const pts=[...(scene.pointLoads||[]).map(p=>({x:finite(p.x,'point load position'),px:finite(p.fx||0,'horizontal point load')*scale,py:finite(p.fy||0,'vertical point load')*scale})),...(scene.loads||[]).map(p=>{const n=nodeMap.get(p.node);if(!n)throw new Error('Load at missing joint');return {x:finite(n.x,'joint position'),px:finite(p.fx||0,'horizontal joint load')*scale,py:finite(p.fy||0,'vertical joint load')*scale};})];
  const udls=(scene.distributedLoads||[]).map(d=>({from:finite(d.from,'UDL start'),to:finite(d.to,'UDL end'),w:finite(d.w,'UDL start intensity')*scale,wEnd:finite(d.wEnd??d.w,'UDL end intensity')*scale}));
  const couples=(scene.couples||[]).map(c=>({x:finite(c.x??(c.node?nodeMap.get(c.node)?.x:undefined),'couple position'),m:finite(c.mz??c.m??c.moment??0,'applied moment')*scale}));
  for(const p of [...pts,...couples])if(p.x<a.x-1e-9||p.x>b.x+1e-9)throw new Error('Load outside beam span');
  for(const d of udls)if(d.from<a.x-1e-9||d.to>b.x+1e-9||!(d.to>d.from))throw new Error('Invalid distributed load interval');
  // Integrate w(x)=w0+(w1-w0)t/T exactly, including its first moment.
  const udlTotals=udls.map(d=>{const len=d.to-d.from;return {...d,P:len*(d.w+d.wEnd)/2,firstMoment:len*(d.from-a.x)*(d.w+d.wEnd)/2+len*len*(d.w+2*d.wEnd)/6};});
  const totalVertical=pts.reduce((t,p)=>t+p.py,0)+udlTotals.reduce((t,d)=>t+d.P,0);
  const totalHorizontal=pts.reduce((t,p)=>t+p.px,0);
  const momentApplied=pts.reduce((t,p)=>t+p.py*(p.x-a.x),0)+udlTotals.reduce((t,d)=>t+d.firstMoment,0)+couples.reduce((t,c)=>t+c.m,0);
  const RB=-momentApplied/L, RA=-totalVertical-RB;
  const horizontalAt=a.support==='pin'?a.id:b.id;
  const Rx=-totalHorizontal;
  function evaluate(x, side='right') {
    let V=RA,M=RA*(x-a.x),N=Rx;
    for(const p of pts)if(p.x<x || (side==='right'&&p.x<=x)){V+=p.py;N+=p.px;M+=p.py*(x-p.x);}
    for(const d of udlTotals){const t=Math.max(0,Math.min(x,d.to)-d.from);if(t===0)continue;const slope=(d.wEnd-d.w)/(d.to-d.from);const P=d.w*t+slope*t*t/2;const first=d.w*t*t/2+slope*t*t*t/3;V+=P;M+=P*(x-d.from)-first;}
    for(const c of couples)if(c.x<x||(side==='right'&&c.x<=x))M-=c.m;
    return {x,V,M,N};
  }
  const coords=new Set([a.x,b.x,...pts.map(p=>p.x),...couples.map(c=>c.x),...udls.flatMap(d=>[d.from,d.to])]);
  for(let i=0;i<=320;i++)coords.add(a.x+L*i/320);
  const points=[...coords].sort((x,y)=>x-y).flatMap(x=>[evaluate(x,'left'),evaluate(x,'right')]);
  const eq={fx:Rx+totalHorizontal,fy:RA+RB+totalVertical,m:RB*L+momentApplied};
  return {type:'beam',RA,RB,Rx,horizontalAt,equilibrium:eq,totalApplied:totalVertical,momentApplied,span:L,points,maxShear:Math.max(...points.map(p=>Math.abs(p.V))),maxMoment:Math.max(...points.map(p=>Math.abs(p.M))),maxUtil:null};
}
function solveSpatialStatics(scene,multiplier=1) {
  const ns=new Map((scene.nodes||[]).map(n=>[n.id,n]));const scale=finite(multiplier,'load multiplier');
  const R={x:0,y:0,z:0},M={x:0,y:0,z:0};
  for(const l of scene.loads||[]){const n=ns.get(l.node);if(!n)throw new Error(`Force refers to missing joint ${l.node}`);
    const x=finite(n.x,'x'),y=finite(n.y,'y'),z=finite(n.z??0,'z');
    const fx=finite(l.fx??0,'Fx')*scale,fy=finite(l.fy??0,'Fy')*scale,fz=finite(l.fz??0,'Fz')*scale;
    R.x+=fx;R.y+=fy;R.z+=fz;M.x+=y*fz-z*fy;M.y+=z*fx-x*fz;M.z+=x*fy-y*fx;
  }
  for(const c of scene.couples||[]){M.x+=finite(c.mx??0,'Mx')*scale;M.y+=finite(c.my??0,'My')*scale;M.z+=finite(c.mz??0,'Mz')*scale;}
  if(!(scene.loads||[]).length&&!(scene.couples||[]).length)throw new Error('No known spatial forces or couples.');
  return {type:'spatial',R,M,maxUtil:null,calculation:'Known applied resultant only; unknown reactions not computed.'};
}
const api={solveBeamStatics,solveSpatialStatics};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof globalThis!=='undefined')globalThis.TVStaticsSolvers=api;

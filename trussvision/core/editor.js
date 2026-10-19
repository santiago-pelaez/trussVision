/* Connected, unit-aware mechanics drawing model. No drawing coordinates enter the solver. */
(function(root,factory){const api=factory(root.TrussVisionCore||(typeof require==='function'?require('./engine.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;root.TrussVisionEditor=api})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),fail=m=>{throw Error(m)},Q=(value,unit)=>({value,unit});
const L=['m','cm','mm','ft','in'],F=['N','kN','lb'],C=['rigid2d','truss2d','spring','ideal_pulley'];
const factor=(u,kind)=>{const unit=Core.UNITS[u];if(!unit||unit.kind!==kind)fail(`Unknown ${kind} unit: ${u}`);return unit.factor};
const sane=(v,label)=>{if(!Number.isFinite(Number(v))||v===''||v===null)fail(`${label} must be a finite number`);return Number(v)};
const round=x=>Number(x.toPrecision(12));
function create(mode='truss2d',lengthUnit='m',forceUnit='N',gridStep=1){if(!C.includes(mode))fail('Unknown editable problem mode');factor(lengthUnit,'length');factor(forceUnit,'force');if(!(gridStep>0))fail('Grid step must be positive');return {version:1,mode,lengthUnit,forceUnit,gridStep,nodes:[],members:[],supports:[],forces:[],couples:[],springs:[],pulleys:[]}}
const snap=(v,g)=>round(Math.round(sane(v,'Coordinate')/g)*g);
const checkNode=(s,id)=>{const node=s.nodes.find(x=>x.id===id);if(!node)fail(`Node ${id} does not exist`);return node};
function addNode(s,x,y,id){if(s.nodes.length>=45)fail('Limit 45 joints');const a=snap(x,s.gridStep),b=snap(y,s.gridStep);if(s.nodes.some(n=>Math.hypot(n.x-a,n.y-b)<s.gridStep*.01))fail('A joint already occupies this grid point');
 const used=new Set(s.nodes.map(n=>n.id));if(!id){let i=0;do{id=i<26?String.fromCharCode(65+i):`N${i+1}`;i++}while(used.has(id))}if(used.has(id))fail('Joint labels must be unique');s.nodes.push({id,x:a,y:b});return id}
function moveNode(s,id,x,y){const n=checkNode(s,id),a=snap(x,s.gridStep),b=snap(y,s.gridStep);if(s.nodes.some(p=>p.id!==id&&Math.hypot(p.x-a,p.y-b)<s.gridStep*.01))fail('Another node occupies this location');n.x=a;n.y=b;return n}
function addMember(s,a,b,type='member'){checkNode(s,a);checkNode(s,b);if(a===b)fail('A member must connect different joints');if(type==='spring'){
 if(s.mode!=='spring')fail('Spring segments require Spring mode');if(s.springs.some(m=>[m.a,m.b].sort().join(':')===[a,b].sort().join(':')))fail('That spring already exists');let id='S'+(s.springs.length+1);s.springs.push({id,a,b,k:100,kUnit:'N/m'});return id}
 if(s.mode!=='truss2d')fail('Truss members require Truss mode');if(s.members.some(m=>[m.a,m.b].sort().join(':')===[a,b].sort().join(':')))fail('That member already exists');s.members.push({id:`M${s.members.length+1}`,a,b});return s.members.at(-1).id}
function attach(s,tool,node,props={}){checkNode(s,node);
 if(['pin','roller','fixed'].includes(tool)){if(s.mode==='spring'||s.mode==='ideal_pulley')fail('Use the spring/pulley attachment tools in that workspace');if(s.mode==='truss2d'&&tool==='fixed')fail('A pin-jointed truss cannot have a moment-fixing support');s.supports=s.supports.filter(t=>t.node!==node);s.supports.push({node,type:tool,...(tool==='roller'?{direction:[0,1]}:{})});return}
 if(tool==='force'){const fx=sane(props.fx??0,'Fx'),fy=sane(props.fy??-10,'Fy');if(fx===0&&fy===0)fail('A zero force has no effect');s.forces=s.forces.filter(f=>f.node!==node);s.forces.push({node,fx,fy});return}
 if(tool==='couple'){if(s.mode!=='rigid2d')fail('Applied couples require the rigid-body workspace');s.couples=s.couples.filter(c=>c.node!==node);s.couples.push({node,value:sane(props.moment??10,'Moment')});return}
 if(tool==='pulley'){if(s.mode!=='ideal_pulley')fail('Pulley needs Ideal Pulley workspace');let n=sane(props.segments??2,'Supporting rope segments');if(!Number.isInteger(n)||n<1||n>16)fail('Supporting segments must be an integer between 1 and 16');s.pulleys=[{node,segments:n}];return}
 fail(`Unknown attachment ${tool}`)}
function remove(s,kind,id){if(kind==='node'){checkNode(s,id);s.nodes=s.nodes.filter(n=>n.id!==id);for(const key of ['supports','forces','couples','pulleys'])s[key]=s[key].filter(v=>v.node!==id);s.members=s.members.filter(v=>v.a!==id&&v.b!==id);s.springs=s.springs.filter(v=>v.a!==id&&v.b!==id)}else if(['members','springs'].includes(kind)){s[kind]=s[kind].filter(v=>v.id!==id)}else if(['supports','forces','couples','pulleys'].includes(kind))s[kind]=s[kind].filter(v=>v.node!==id);else fail('Unknown element type')}
function convertUnits(s,lengthUnit,forceUnit){const lf=factor(s.lengthUnit,'length')/factor(lengthUnit,'length'),ff=factor(s.forceUnit,'force')/factor(forceUnit,'force');for(const n of s.nodes){n.x=round(n.x*lf);n.y=round(n.y*lf)}for(const f of s.forces){f.fx=round(f.fx*ff);f.fy=round(f.fy*ff)}for(const c of s.couples)c.value=round(c.value*ff*lf);s.gridStep=round(s.gridStep*lf);s.lengthUnit=lengthUnit;s.forceUnit=forceUnit;return s}
function toCanonical(s){factor(s.lengthUnit,'length');factor(s.forceUnit,'force');let l=s.lengthUnit,f=s.forceUnit,coord=id=>{let n=checkNode(s,id);return Q([n.x,n.y],l)};
 if(s.mode==='truss2d'){
  if(s.members.some(m=>m.a===m.b))fail('Truss contains a zero-length member');return {operation:'truss2d',nodes:s.nodes.map(n=>({id:n.id,at:coord(n.id)})),members:s.members.map(m=>({a:m.a,b:m.b})),supports:s.supports.map(t=>({node:t.node,type:t.type==='roller'&&t.direction&&(Math.abs(t.direction[0])>1e-9||Math.abs(t.direction[1]-1)>1e-9)?'direction':t.type,...(t.direction?{direction:t.direction}:{})})),loads:s.forces.map(t=>({node:t.node,vector:Q([t.fx,t.fy],f)}))};}
 if(s.mode==='rigid2d')return {operation:'rigid2d',dimension:2,supports:s.supports.map(t=>({id:t.node,type:t.type==='roller'&&t.direction&&(Math.abs(t.direction[0])>1e-9||Math.abs(t.direction[1]-1)>1e-9)?'direction':t.type,at:coord(t.node),...(t.direction?{direction:t.direction}:{})})),forces:s.forces.map(t=>({at:coord(t.node),vector:Q([t.fx,t.fy],f)})),couples:s.couples.map(t=>Q(round(t.value*factor(f,'force')*factor(l,'length')),'N*m'))};
 if(s.mode==='spring'){
  // Partially drawn spring systems remain editable; solve() validates completeness.if(s.springs.some(m=>!s.nodes.some(n=>n.id===m.a)||!s.nodes.some(n=>n.id===m.b)))fail('Spring anchor missing');
  if(s.springs.length){
   const degrees=new Map();for(const link of s.springs){degrees.set(link.a,(degrees.get(link.a)||0)+1);degrees.set(link.b,(degrees.get(link.b)||0)+1)}
   if([...degrees.values()].some(d=>d>2))fail('Spring branches are not a series chain. Use a single unbranched path.');
   const ends=[...degrees].filter(([id,d])=>d===1).map(([id])=>id);if(ends.length!==2||degrees.size!==s.springs.length+1)fail('All series springs must form one connected path with two end joints.');
   const terminal=s.forces[0]?.node;if(terminal&&!ends.includes(terminal))fail('In this guided model, the downward load must attach to an end of the spring chain.');
  }
  if(s.forces.some(t=>Math.abs(t.fx)>1e-9||t.fy>=0))fail('The simplified vertical spring solver requires downward loads only.');if(s.forces.length>1)fail('The series spring tutorial accepts one end load; intermediate loads need a general network solver.');let total=s.forces.reduce((a,b)=>a-b.fy,0);// Until a force is attached, keep a physically zero draft load; solve() rejects it.
  return {operation:'spring',arrangement:s.springs.length===1?'series':'series',springs:s.springs.map(x=>Q(x.k,x.kUnit)),force:Q(total,f)};
 }
 if(s.mode==='ideal_pulley'){
  let id=s.pulleys[0]?.node;const fs=s.forces.filter(x=>x.node===id);if(fs.some(x=>x.fx!==0||x.fy>=0))fail('An ideal movable pulley supports one downward load');return {operation:'ideal_pulley',load:Q(fs.length?-fs[0].fy:0,f),supportingSegments:s.pulleys[0]?.segments||0};
 }
 fail('Unknown mode');}
function fromCanonical(m,lengthUnit,forceUnit){if(!m||!['truss2d','rigid2d','spring','ideal_pulley'].includes(m.operation))return null;
 let l=lengthUnit||m.nodes?.[0]?.at?.unit||m.supports?.[0]?.at?.unit||m.forces?.[0]?.at?.unit||'m';let f=forceUnit||m.loads?.[0]?.vector?.unit||m.forces?.[0]?.vector?.unit||m.force?.unit||m.load?.unit||'N';if(!L.includes(l))l='m';if(!F.includes(f))f='N';let s=create(m.operation,l,f,1);
 function nodeAt(at,name){const fac=factor(at.unit,'length')/factor(l,'length');const p=at.value.map(v=>round(v*fac));const found=s.nodes.find(n=>Math.hypot(n.x-p[0],n.y-p[1])<1e-8);return found?.id||addNode(s,p[0],p[1],name)}
 // Imported exact coordinates remain exact; snapping applies to subsequent user edits only.
 const addExact=(at,id)=>{const fac=factor(at.unit,'length')/factor(l,'length'),x=round(at.value[0]*fac),y=round(at.value[1]*fac);const old=s.nodes.find(n=>Math.hypot(n.x-x,n.y-y)<1e-8);if(old)return old.id;let label=id||'N'+(s.nodes.length+1);if(s.nodes.some(n=>n.id===label))label='N'+(s.nodes.length+1);s.nodes.push({id:label,x,y});return label};
 const forceVal=v=>v.value.map(n=>round(n*factor(v.unit,'force')/factor(f,'force')));
 if(m.operation==='truss2d'){
  s.nodes=(m.nodes||[]).map(n=>{let factorL=factor(n.at.unit,'length')/factor(l,'length');return {id:n.id,x:round(n.at.value[0]*factorL),y:round(n.at.value[1]*factorL)}});
  s.members=(m.members||[]).map((x,i)=>({id:`M${i+1}`,a:x.a,b:x.b}));s.supports=(m.supports||[]).map(x=>({...x,node:x.node}));s.forces=(m.loads||[]).map(x=>{let v=forceVal(x.vector);return {node:x.node,fx:v[0],fy:v[1]}});}
 else if(m.operation==='rigid2d'){
  for(const x of m.supports||[]){let id=addExact(x.at,x.id);s.supports.push({node:id,type:x.type,...(x.direction?{direction:x.direction}:{})})}
  for(const x of m.forces||[]){let id=addExact(x.at);let [fx,fy]=forceVal(x.vector);s.forces.push({node:id,fx,fy})}
  for(const x of m.couples||[]){let id=s.nodes[0]?.id||addNode(s,0,0);s.couples.push({node:id,value:round(x.value*factor(x.unit,'moment')/(factor(f,'force')*factor(l,'length')))})}
 }
 else if(m.operation==='spring'){
   addNode(s,0,3,'A');addNode(s,0,0,'B');(m.springs||[]).forEach((x,i)=>s.springs.push({id:`S${i+1}`,a:'A',b:'B',k:x.value,kUnit:x.unit}));let total=m.force?.value??((m.masses||[]).reduce((a,v)=>a+v.value*factor(v.unit,'mass')*9.81,0)/factor(f,'force'));s.forces.push({node:'B',fx:0,fy:-total});
 }else{
   addNode(s,0,2,'A');addNode(s,0,0,'B');s.pulleys=[{node:'B',segments:m.supportingSegments}];s.forces=[{node:'B',fx:0,fy:-m.load.value*factor(m.load.unit,'force')/factor(f,'force')}];}
 return s;
}
return {create,clone,snap,addNode,moveNode,addMember,attach,remove,convertUnits,toCanonical,fromCanonical};
});

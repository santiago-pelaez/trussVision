'use strict';
const assert=require('node:assert/strict');
const F=require('../trussvision/fundamentals-solvers.js');
const {solveBeamStatics,solveSpatialStatics}=require('../trussvision/statics-solvers.js');
const {solveTrussModel}=require('../trussvision/truss-solver.js');
const fs=require('node:fs');const path=require('node:path');
let checks=0;
const near=(a,b,t=1e-6,name='')=>{assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=t,`${name}: ${a} expected ${b}`);checks++};
const vec=(a,b,t=1e-6,name='')=>a.forEach((x,i)=>near(x,b[i],t,`${name}[${i}]`));
function run(){
// Exam 1 p2(a): two blocks supported by spring 717 g +336 g; k=27.1 N/mm.
near(F.springExtension([.717,.336],27.1),(.717+.336)*9.81/27.1,1e-10,'spring mm');
// Exam 1 p2(b): A=(0,3.8,0), B=(-7.5,1.8,5.9).
const v=[-7.5,-2,5.9],mag=Math.hypot(...v);vec(F.direction([0,3.8,0],[-7.5,1.8,5.9]),v.map(x=>x/mag),1e-12,'unit vector');
// Exam 2 p3(c): use PRINTED position z=59, NOT 59-25=34.
vec(F.momentAbout([0,0,0],[{position:[-20,39,59],force:[8,17,-21]}],[[0,0,-183]]),[-1822,52,-835],1e-12,'spatial printed');
const r3=solveSpatialStatics({kind:'vector3d',nodes:[{id:'P',x:-20,y:39,z:59}],loads:[{node:'P',fx:8,fy:17,fz:-21}],couples:[{mz:-183}]});vec([r3.M.x,r3.M.y,r3.M.z],[-1822,52,-835],1e-12,'TrussVision spatial solver');
// Exam 3 p2(B): zero-force CE, and force in BC from forces at D (published handwriting inconsistent).
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','truss-benchmark.json'),'utf8'));
const tr=solveTrussModel(data);
const member=(a,b)=>tr.forces.find(f=>f.a===a&&f.b===b||f.a===b&&f.b===a).displayForce;
near(member('E','C'),0,1e-6,'zero-force CE');near(member('B','C'),23-42*2.2/4.5,1e-6,'BC axial');near(tr.equilibrium.fx,0,1e-8,'truss Fx');near(tr.equilibrium.fy,0,1e-8,'truss Fy');near(tr.equilibrium.m,0,1e-8,'truss M');
// HW 23 p1-2: 46-ft span, 9.8 lb/ft over [8,38], opposite 414 ft-lb couples.
const beam=solveBeamStatics({kind:'beam',nodes:[{id:'A',x:0,y:0,support:'pin'},{id:'D',x:46,y:0,support:'roller'}],members:[{a:'A',b:'D'}],loads:[],pointLoads:[],distributedLoads:[{from:8,to:38,w:-9.8}],couples:[{x:8,mz:414},{x:38,mz:-414}]});
near(beam.RA,147,1e-9,'HW23 Ay');near(beam.RB,147,1e-9,'HW23 Dy');near(beam.maxShear,147,1e-8,'HW23 max shear');near(beam.maxMoment,1864.5,0.1,'HW23 peak moment grid sampled');near(beam.equilibrium.fy,0,1e-9,'HW23 force closure');near(beam.equilibrium.m,0,1e-9,'HW23 moment closure');
// Exam 4 p2(a): sliding threshold mu=P/W. Note: tipping comparison also requires geometry.
near(F.slideThresholdMu(44,180),44/180,1e-12,'friction ratio');
// Exam 4 p2(b): capstan 3 pulleys, wrap 2pi rad according to diagram; W2 needed to raise W1.
near(F.beltHighTension(44,.43,2*Math.PI),44*Math.exp(.43*2*Math.PI),1e-9,'belt friction');
// Area moments from Apr 17 sheet: 0<=x<=a, yTop=x^2/a, yBottom=-x/2, a=15 ft.
const a=15;const sec=F.areaMoments(x=>x*x/a,x=>-x/2,0,a,2000);
// Exact Iy: integral [x^4/a + x^3/2] dx = a^4/5 + a^4/8.
near(sec.Iy,a**4*(1/5+1/8),.001,'composite area Iy');
// Exact Ix: integral [(x^2/a)^3 -(-x/2)^3]/3 dx = a^4*(1/21+1/96).
near(sec.Ix,a**4*(1/21+1/96),.001,'composite area Ix');
return checks;
}
const count=run();console.log(`CE211 reference validation PASS: ${count} independent numeric assertions`);

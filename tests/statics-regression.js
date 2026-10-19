'use strict';
const assert=require('node:assert/strict');
const {solveBeamStatics:B,solveSpatialStatics:S}=require('../trussvision/statics-solvers.js');
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const base={kind:'beam',nodes:[{id:'A',x:0,y:0,support:'pin'},{id:'B',x:4,y:0,support:'roller'}],members:[{a:'A',b:'B'}],loads:[],pointLoads:[],distributedLoads:[],couples:[]};
function check(r){near(r.equilibrium.fx,0);near(r.equilibrium.fy,0);near(r.equilibrium.m,0);}
let r=B({...base,pointLoads:[{x:2,fy:-10}]});near(r.RA,5);near(r.RB,5);near(r.maxMoment,10);near(r.maxShear,5);check(r);
r=B({...base,distributedLoads:[{from:0,to:4,w:-6,wEnd:-6}]});near(r.RA,12);near(r.RB,12);near(r.maxMoment,12);check(r);
r=B({...base,distributedLoads:[{from:0,to:4,w:0,wEnd:-6}]});near(r.RA,4);near(r.RB,8);check(r);
r=B({...base,couples:[{x:2,mz:8}]});near(r.RA,2);near(r.RB,-2);near(r.points.findLast(p=>p.x===2).M, -4);check(r);
r=B({...base,pointLoads:[{x:2,fx:14,fy:-10}]});near(r.Rx,-14);near(r.RA,5);near(r.RB,5);check(r);
assert.throws(()=>B({...base,nodes:base.nodes.map(n=>({...n,support:'roller'}))}),/horizontal restraints/);
const space={kind:'vector3d',nodes:[{id:'P',x:-20,y:39,z:59}],loads:[{node:'P',fx:8,fy:17,fz:-21}],couples:[{mz:-183}]};
r=S(space);near(r.M.x,-1822);near(r.M.y,52);near(r.M.z,-835);near(r.R.x,8);near(r.R.y,17);near(r.R.z,-21);
r=S({...space,nodes:[{id:'P',x:-20,y:39,z:34}]});near(r.M.x,-1397);near(r.M.y,-148);near(r.M.z,-835);
assert.throws(()=>S({...space,loads:[{node:'MISSING',fx:8}]}),/missing joint/);
console.log('PASS: 8 beam and spatial validation cases (reaction/moment/shear/equilibrium/geometry).');

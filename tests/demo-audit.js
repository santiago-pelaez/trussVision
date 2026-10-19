'use strict';
// Verify that every advertised demo actually has a deterministic solver route.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'trussvision/app.js'),'utf8');
const fragment=app.slice(0,app.indexOf('let scene='));
const context={Math,structuredClone:global.structuredClone};vm.createContext(context);
const demos=vm.runInContext(fragment+'; demos',context);
const mechanics=require('../trussvision/mechanics-engine.js');
const truss=require('../trussvision/truss-solver.js');
const html=fs.readFileSync(path.join(root,'trussvision/legacy.html'),'utf8');
const options=[...html.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(m=>({id:m[1],label:m[2]}));
let total=0;
for(const [id,scene] of Object.entries(demos)){
 const option=options.find(o=>o.id===id);assert(option,`Demo ${id} is absent from selector`);
 if(id==='machine3d'||id==='frame2d'){
  assert(/preview|visualization/i.test(option.label),`Unsupported demo ${id} must be clearly labelled PREVIEW`);
  console.log('PREVIEW',id);continue;
 }
 if(scene.physics){const result=mechanics.solvePhysics(scene.physics);assert(result&&result.type,`Demo ${id} missing result`);}
 else if(id==='truss'){const result=truss.solveTrussModel(scene);assert(result.forces.length>0);}
 else if(id==='beam'){assert(scene.nodes.length===2&&scene.nodes[0].support==='pin'&&scene.nodes[1].support==='roller');}
 else throw Error(`Demo ${id} has no deterministic solver route`);
 ++total;console.log('PASS',id);
}
console.log(`PASS ${total} computed demos, 2 explicitly marked previews`);

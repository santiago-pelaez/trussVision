/* TrussVision → Vetin model v2 bridge. Pure converter plus browser button wiring.
 * No model-provided JavaScript is evaluated. All units are converted explicitly.
 */
(function (root) {
  'use strict';
  const lengthFactor = {m: 1, ft: 0.3048, in: 0.0254};
  const forceFactor = {kN: 1, N: 0.001, lb: 0.0044482216152605};
  const finite = (n) => typeof n === 'number' && Number.isFinite(n);
  const round = (n) => Math.round(n * 1e6) / 1e6;
  const near = (a,b,eps=1e-7) => Math.abs(a-b)<=eps;
  function convert(scene) {
    if (!scene || scene.kind !== 'beam' || scene.spatial) throw Error('Vetin only imports a straight 2D BEAM. Keep trusses and 3D problems in TrussVision.');
    const lf=lengthFactor[scene.units], ff=forceFactor[scene.forceUnit||'kN'];
    if(!lf || !ff) throw Error('Confirm real length (m, ft, in) and force (kN, N, lb) units first.');
    if(!Array.isArray(scene.nodes) || scene.nodes.length<2) throw Error('A beam needs at least two known endpoints.');
    const ns=scene.nodes;
    if(ns.some(n=>!finite(n.x)||!finite(n.y)||Math.abs(n.z||0)>1e-8)) throw Error('Beam nodes need finite 2D coordinates.');
    if(ns.some(n=>!near(n.y,ns[0].y))) throw Error('This bridge supports a horizontal beam only.');
    const xMin=Math.min(...ns.map(n=>n.x)),xMax=Math.max(...ns.map(n=>n.x));
    const L=(xMax-xMin)*lf;
    if(!(L>0)) throw Error('Beam length must be greater than zero.');
    const at=(x)=>{if(!finite(x)||x<xMin-1e-6||x>xMax+1e-6)throw Error('One force/support lies outside the beam. Check scanned dimensions.');return round((x-xMin)*lf);};
    const supports=ns.filter(n=>n.support&&n.support!=='none').map(n=>{
      const t={pin:'pin-support',roller:'roller-support',fixed:'fixed-support'}[n.support];
      if(!t)throw Error('Unrecognized support at '+n.id);
      return {type:t,x:at(n.x)};
    });
    if(!supports.length)throw Error('Confirm beam supports before importing.');
    const concentratedLoads=[];
    function addForce(x,fx,fy){
      if(!finite(fx)||!finite(fy))throw Error('Invalid force magnitude.');
      if(Math.hypot(fx,fy)<1e-12)return;
      // Vetin angle is clockwise from +X: downward corresponds to +90 deg.
      concentratedLoads.push({x:at(x),magnitude:round(Math.hypot(fx,fy)*ff),angle:round(Math.atan2(-fy,fx))});
    }
    for(const p of (scene.pointLoads||[]))addForce(p.x,0,p.fy);
    const nodesById=new Map(ns.map(n=>[n.id,n]));
    for(const f of (scene.loads||[])){
      const n=nodesById.get(f.node);if(!n)throw Error('Force references missing node '+f.node);
      if(Math.abs(f.fz||0)>1e-7)throw Error('Nonplanar force cannot be imported.');
      addForce(n.x,f.fx||0,f.fy||0);
    }
    const distributedLoads=[],trapezoidalLoads=[];
    for(const d of (scene.distributedLoads||[])){
      if(!finite(d.from)||!finite(d.to)||!finite(d.w))throw Error('Invalid distributed-load values.');
      if(!(d.to>d.from))throw Error('Distributed load span must increase left-to-right.');
      const w2=finite(d.wEnd)?d.wEnd:d.w;
      // Vetin JSON (unlike its UI) stores NEGATIVE magnitude for downward.
      const row={startX:at(d.from),endX:at(d.to)};
      if(near(d.w,w2)) distributedLoads.push({...row,magnitude:round(d.w*ff/lf)});
      else trapezoidalLoads.push({...row,startMagnitude:round(d.w*ff/lf),endMagnitude:round(w2*ff/lf)});
    }
    const concentratedMoments=[];
    for(const c of (scene.couples||[])){
      const n=nodesById.get(c.node);if(!n)throw Error('Couple references missing node '+c.node);
      if(Math.abs(c.mx||0)>1e-7||Math.abs(c.my||0)>1e-7)throw Error('3D moment cannot be imported.');
      if(!finite(c.mz))throw Error('Invalid moment.');
      // TrussVision +M_z = CCW; Vetin +moment = clockwise.
      concentratedMoments.push({x:at(n.x),magnitude:round(-c.mz*ff*lf)});
    }
    return {
      format:'vetin-beam',version:2,
      units:{length:'m',force:'kN',moment:'kNm',distributedLoad:'kN/m',angle:'rad'},
      beam:{length:round(L)},supports,hinges:[],concentratedLoads,distributedLoads,
      trapezoidalLoads,concentratedMoments,torsionMoments:[],
      gridSettings:{metersPerGrid:1,kNPerGrid:10,gridSize:50},
      material:{elasticityModulus:200,momentOfInertia:10000}
    };
  }
  const api={convert};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.TVBeamAdapter=api;
  if(typeof document==='undefined')return;
  document.addEventListener('DOMContentLoaded',()=>{
    const button=document.getElementById('vetinExport'),note=document.getElementById('vetinFeedback'),dialog=document.getElementById('transferDialog'),summary=document.getElementById('transferSummary');
    if(!button)return;
    let pendingData=null;
    const completeTransfer=()=>{
      if(!pendingData)return;
      sessionStorage.setItem('trussvision-pending-vetin',JSON.stringify(pendingData));
      location.href=new URL('../vetin/?tvimport=1',location.href).href;
    };
    dialog?.addEventListener('close',()=>{
      if(dialog.returnValue==='transfer')completeTransfer();
      else pendingData=null;
    });
    button.addEventListener('click',()=>{
      try{
        const s=JSON.parse(document.getElementById('sceneJson').value);
        pendingData=convert(s);
        if(summary)summary.textContent=`${pendingData.beam.length} m beam · ${pendingData.supports.length} support${pendingData.supports.length===1?'':'s'} · ${pendingData.concentratedLoads.length+pendingData.distributedLoads.length+pendingData.trapezoidalLoads.length} load entries`;
        if(dialog?.showModal)dialog.showModal();else completeTransfer();
      }catch(err){if(note){note.textContent='⚠ '+err.message;note.style.color='#ffad65';}}
    });
  });
})(typeof window!=='undefined'?window:globalThis);

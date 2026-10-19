'use strict';
/* TrussVision Mechanics Engine (no external dependencies)
 * Units are the explicit units provided by the calling scene; this module does
 * NOT silently convert mass to force, angles to radians, or inches to feet.
 * 2D: +X right, +Y up, +M counterclockwise. 3D: right-hand rule.
 * Every result is a deterministic computation from reviewed structured input.
 */
(function(root){
  const EPS=1e-9;
  function requireNum(v,label){if(typeof v!=='number'||!Number.isFinite(v))throw Error(`${label} must be a finite number`);return v;}
  function positive(v,label){requireNum(v,label);if(v<=0)throw Error(`${label} must be positive`);return v;}
  function nonnegative(v,label){requireNum(v,label);if(v<0)throw Error(`${label} must not be negative`);return v;}
  function pair(v,label){if(!Array.isArray(v)||v.length!==2)throw Error(`${label} must be [x,y]`);return v.map((n,i)=>requireNum(n,`${label}[${i}]`));}
  function triple(v,label){if(!Array.isArray(v)||v.length!==3)throw Error(`${label} must be [x,y,z]`);return v.map((n,i)=>requireNum(n,`${label}[${i}]`));}
  function vec(v,n,label){return n===2?pair(v,label):triple(v,label);}
  function unit(v,label){const u=v.map((x)=>requireNum(x,label));const length=Math.hypot(...u);if(length<EPS)throw Error(`${label} must have nonzero direction`);return u.map(x=>x/length);}
  function cross3(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function moments2D(point,force,origin=[0,0]){return (point[0]-origin[0])*force[1]-(point[1]-origin[1])*force[0];}
  function cloneZeros(n){return Array(n).fill(0);}
  // Solve a rectangular linear system A*x=b. Accept redundant equations if
  // consistent, but never invent a solution when rank < number of unknowns.
  function linearSolve(A,b,names=[]){
    const m=A.length,n=names.length||A[0]?.length||0;
    if(!m||!n||b.length!==m||A.some(r=>r.length!==n))throw Error('Invalid equilibrium equation dimensions');
    if(A.flat().some(v=>!Number.isFinite(v))||b.some(v=>!Number.isFinite(v)))throw Error('Nonfinite equilibrium coefficient');
    const M=A.map((r,i)=>[...r,b[i]]),scale=Math.max(1,...M.flat().map(Math.abs));
    const tol=1e-10*scale;
    let rank=0;const pivots=[];
    for(let col=0;col<n;col++){
      let pivot=rank;for(let r=rank+1;r<m;r++)if(Math.abs(M[r][col])>Math.abs(M[pivot]?.[col]??0))pivot=r;
      if(rank>=m||Math.abs(M[pivot][col])<=tol)continue;
      [M[rank],M[pivot]]=[M[pivot],M[rank]];
      const div=M[rank][col];for(let j=col;j<=n;j++)M[rank][j]/=div;
      for(let r=0;r<m;r++)if(r!==rank){const v=M[r][col];for(let j=col;j<=n;j++)M[r][j]-=v*M[rank][j];}
      pivots.push(col);rank++;
      if(rank===m)break;
    }
    for(let i=rank;i<m;i++)if(Math.abs(M[i][n])>tol)throw Error('Inconsistent equilibrium equations: check extracted forces, supports and model assumptions.');
    if(rank<n)throw Error(`Underdetermined equilibrium: ${n-rank} independent unknown(s) remain. Check missing restraints, cable constraints or internal hinges.`);
    const x=cloneZeros(n);pivots.forEach((col,r)=>x[col]=M[r][n]);
    const residuals=A.map((r,i)=>r.reduce((s,c,j)=>s+c*x[j],0)-b[i]);
    const maxResidual=Math.max(...residuals.map(Math.abs));
    const threshold=1e-7*Math.max(1,...b.map(Math.abs));
    if(maxResidual>threshold)throw Error(`Equilibrium verification failed (residual ${maxResidual}).`);
    return {unknowns:Object.fromEntries(x.map((v,i)=>[names[i]??`u${i}`,v])),maxResidual,residuals,rank,equations:m};
  }
  function forceContribution2D(body,at,force,apply){
    const [fx,fy]=pair(force,'force'),pt=pair(at,'application point');
    apply(body,[fx,fy,moments2D(pt,[fx,fy])]);
  }
  function assembleRigid2D(physics){
    const bodies=physics.bodies||[];
    if(!bodies.length||bodies.length>20)throw Error('rigid2d requires 1–20 rigid bodies');
    const ids=bodies.map(b=>b.id);if(ids.some(x=>!x)||new Set(ids).size!==ids.length)throw Error('Rigid bodies need unique IDs');
    const rows=bodies.length*3,A=Array.from({length:rows},()=>[]),rhs=cloneZeros(rows),names=[];
    const index=new Map(ids.map((id,i)=>[id,i]));const reactionRefs=[];
    const atBase=(body)=>{const i=index.get(body);if(i===undefined)throw Error(`Unknown body: ${body}`);return 3*i;};
    const applyKnown=(body,[fx,fy,mz])=>{const i=atBase(body);rhs[i]-=fx;rhs[i+1]-=fy;rhs[i+2]-=mz;};
    const addUnknown=(name,effects)=>{
      if(names.includes(name))throw Error(`Duplicate unknown: ${name}`);
      names.push(name);for(let r=0;r<rows;r++)A[r].push(0);
      for(const e of effects){const i=atBase(e.body);const [fx,fy,mz]=e.vector;A[i][names.length-1]+=fx;A[i+1][names.length-1]+=fy;A[i+2][names.length-1]+=mz;}
    };
    const effect=(body,at,direction)=>{const [x,y]=pair(at,'reaction location'),[dx,dy]=unit(pair(direction,'reaction direction'),'reaction direction');return {body,vector:[dx,dy,x*dy-y*dx]};};
    for(const b of bodies){
      for(const f of b.forces||[])forceContribution2D(b.id,f.at,f.value,applyKnown);
      for(const c of b.couples||[])applyKnown(b.id,[0,0,requireNum(c,'applied couple')]);
      for(const d of b.distributedLoads||[]){
        const at=pair(d.start,'distributed load start'),end=pair(d.end,'distributed load end');
        const w0=pair(d.wStart,'distributed intensity start'),w1=pair(d.wEnd??d.wStart,'distributed intensity end');
        const dx=end[0]-at[0],dy=end[1]-at[1],L=Math.hypot(dx,dy);positive(L,'distributed load length');
        const F=w0.map((v,i)=>L*(v+w1[i])/2);
        // First moment for linearly varying vector loads: exact integration.
        const M=moments2D(at,F)+L/6*(dx*(w0[1]+2*w1[1])-dy*(w0[0]+2*w1[0]));
        applyKnown(b.id,[F[0],F[1],M]);
      }
      for(const s of b.springs||[]){
        const k=positive(s.k,'spring stiffness'),extension=requireNum(s.extension,'spring signed extension');
        const direction=unit(pair(s.direction,'spring direction'),'spring direction');
        // Positive extension produces a restoring force opposite direction.
        forceContribution2D(b.id,s.at,direction.map(v=>-k*extension*v),applyKnown);
      }
      for(const s of b.supports||[]){
        const label=`${b.id}.${s.id||s.type}`,at=pair(s.at,'support location');
        const types={pin:[[1,0],[0,1]],roller:[[0,1]],fixed:[[1,0],[0,1]]};
        if(s.type==='direction')types.direction=[pair(s.direction,'support direction')];
        if(!types[s.type])throw Error(`Unsupported 2D support ${s.type}`);
        types[s.type].forEach((dir,i)=>{const name=`${label}.${s.type==='direction'?'R':s.type==='roller'?'Ry':(['Rx','Ry'][i])}`;addUnknown(name,[effect(b.id,at,dir)]);reactionRefs.push({body:b.id,name,at,direction:unit(dir,'direction')});});
        if(s.type==='fixed')addUnknown(`${label}.M`,[{body:b.id,vector:[0,0,1]}]);
      }
    }
    for(const j of physics.joints||[]){
      if(j.bodyA===j.bodyB)throw Error('Joint must connect different rigid bodies');
      for(const [suffix,dir] of [['Fx',[1,0]],['Fy',[0,1]]]){
        addUnknown(`${j.id}.${suffix}`,[effect(j.bodyA,j.atA,dir),effect(j.bodyB,j.atB,dir.map(x=>-x))]);
      }
    }
    // Ideal frictionless pulleys transmit a single tension throughout a rope.
    // Each rope segment is an explicit attachment force on a body in the given direction.
    for(const rope of physics.ropes||[]){
      const segments=rope.segments||[];if(!segments.length)throw Error('Rope needs at least one force segment');
      const effects=segments.map(s=>effect(s.body,s.at,pair(s.direction,'rope segment direction')));
      if(rope.tension!==undefined){
        nonnegative(rope.tension,'known rope tension');
        for(const e of effects)applyKnown(e.body,e.vector.map(v=>v*rope.tension));
      }else{
        if(!rope.id)throw Error('Unknown rope tension needs rope ID');
        addUnknown(`rope.${rope.id}.T`,effects);
      }
    }
    for(const f of physics.unknownForces||[]){
      if(!f.id)throw Error('Unknown force needs ID');addUnknown(f.id,[effect(f.body,f.at,pair(f.direction,'unknown force direction'))]);
    }
    if(!names.length)throw Error('No unknown reactions or tensions; check the physics model');
    const solved=linearSolve(A,rhs,names);
    for(const rope of physics.ropes||[])if(rope.tension===undefined&&solved.unknowns[`rope.${rope.id}.T`]<-1e-7)throw Error(`Rope ${rope.id} would have negative tension (slack): ideal taut-rope assumption invalid.`);
    return {type:'rigid2d',...solved,stabilityWarning:solved.rank<rows?'Force equilibrium solved for these loads, but not every rigid-body motion is constrained; assess stability separately.':null,reactions:reactionRefs.map(r=>({...r,value:solved.unknowns[r.name]})),description:'2D rigid-body equilibrium, ideal pins and frictionless pulleys; internal forces cancel across connected bodies.'};
  }
  function assembleRigid3D(physics){
    const forces=physics.forces||[],couples=physics.couples||[],supports=physics.supports||[];
    const origin=physics.origin?triple(physics.origin,'origin'):[0,0,0];
    const loads=cloneZeros(6);const add=(idx,v)=>{for(let i=0;i<v.length;i++)loads[idx+i]+=v[i];};
    for(const f of forces){const p=triple(f.at,'3D application point'),v=triple(f.value,'3D force');add(0,v);add(3,cross3(p.map((x,i)=>x-origin[i]),v));}
    for(const c of couples)add(3,triple(c,'3D applied couple'));
    const columns=[],names=[];
    const addColumn=(name,arr)=>{if(names.includes(name))throw Error(`Duplicate unknown ${name}`);names.push(name);columns.push(arr);};
    for(const s of supports){const p=triple(s.at,'3D support point'),r=p.map((x,i)=>x-origin[i]);
      const dirs=s.type==='ball'?[[1,0,0],[0,1,0],[0,0,1]]:
        s.type==='fixed'?[[1,0,0],[0,1,0],[0,0,1]]:
        s.type==='direction'?[triple(s.direction,'support direction')]:null;
      if(!dirs)throw Error(`Unsupported 3D support ${s.type}; use ball/fixed/direction with physically valid DOFs`);
      dirs.forEach((d,i)=>{const unitDir=unit(d,'support direction');addColumn(`${s.id}.${s.type==='direction'?'R':['Rx','Ry','Rz'][i]}`,[...unitDir,...cross3(r,unitDir)]);});
      if(s.type==='fixed')for(let i=0;i<3;i++){const v=cloneZeros(6);v[i+3]=1;addColumn(`${s.id}.${['Mx','My','Mz'][i]}`,v);}
    }
    for(const t of physics.cables||[]){const p=triple(t.at,'cable attachment'),anchor=triple(t.anchor,'cable anchor'),direction=unit(anchor.map((x,i)=>x-p[i]),'cable');
      const col=[...direction,...cross3(p.map((x,i)=>x-origin[i]),direction)];
      if(t.tension===undefined)addColumn(`cable.${t.id}.T`,col);
      else {nonnegative(t.tension,'cable tension');col.forEach((v,i)=>loads[i]+=t.tension*v);}
    }
    if(!names.length)throw Error('3D rigid body requires specified reaction DOFs');
    const A=Array.from({length:6},(_,i)=>columns.map(c=>c[i]));
    const solved=linearSolve(A,loads.map(x=>-x),names);
    for(const t of physics.cables||[])if(t.tension===undefined&&solved.unknowns[`cable.${t.id}.T`]<-1e-7)throw Error(`Cable ${t.id} would be slack; negative tension is not physically permitted.`);
    return {type:'rigid3d',...solved,appliedResultant:loads.slice(0,3),appliedMoment:loads.slice(3),description:'3D rigid-body force and moment equilibrium (six components).'};
  }
  function solveParticle(p){
    const dim=p.dimension===3?3:2;const loads=cloneZeros(dim);
    for(const f of p.forces||[])vec(f,dim,'particle force').forEach((v,i)=>loads[i]+=v);
    const names=[],columns=[];
    for(const t of p.tensions||[]){const direction=unit(vec(t.direction,dim,'tension direction'),'tension direction');
      if(t.value===undefined){if(!t.id)throw Error('Unknown tension needs ID');names.push(`T.${t.id}`);columns.push(direction);}
      else {nonnegative(t.value,'known tension');direction.forEach((v,i)=>loads[i]+=v*t.value);}
    }
    for(const r of p.reactions||[]){const d=unit(vec(r.direction,dim,'reaction direction'),'reaction direction');names.push(`R.${r.id}`);columns.push(d);}
    if(!names.length)throw Error('Particle model has no unknowns');
    const result=linearSolve(Array.from({length:dim},(_,i)=>columns.map(c=>c[i])),loads.map(x=>-x),names);
    for(const name of names.filter(n=>n.startsWith('T.')))if(result.unknowns[name]<-1e-7)throw Error(`Cable ${name} has negative tension; it cannot push.`);
    return {type:'particle',...result,description:`${dim}D particle equilibrium.`};
  }
  function signArea(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
  function segmentsCross(a,b,c,d){
    const o1=signArea(a,b,c),o2=signArea(a,b,d),o3=signArea(c,d,a),o4=signArea(c,d,b);
    if(o1*o2<-EPS&&o3*o4<-EPS)return true;
    const between=(x,y,z)=>Math.min(x,y)-EPS<=z&&z<=Math.max(x,y)+EPS;
    const on=(u,v,w)=>Math.abs(signArea(u,v,w))<=EPS&&between(u[0],v[0],w[0])&&between(u[1],v[1],w[1]);
    return on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
  }
  function verifySimplePolygon(pts){
    const n=pts.length;
    for(let i=0;i<n;i++){
      const a=pts[i],b=pts[(i+1)%n];if(Math.hypot(a[0]-b[0],a[1]-b[1])<EPS)throw Error('Zero-length polygon edge');
      for(let j=i+1;j<n;j++){
        if(j===i||j===(i+1)%n||(j+1)%n===i)continue;
        if(segmentsCross(a,b,pts[j],pts[(j+1)%n]))throw Error('Self-intersecting polygon not supported');
      }
    }
  }
  function pointInside(pt,polygon){
    let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
      if((yi>pt[1])!==(yj>pt[1])&&pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)inside=!inside;
    }return inside;
  }
  function centroidPolygons(p){
    const regions=p.regions||[];if(!regions.length)throw Error('Centroid requires at least one polygon');
    let A=0,Qx=0,Qy=0,Ix=0,Iy=0,Ixy=0;
    const solidPolys=regions.filter(r=>!r.cutout).map(r=>(r.points||[]).map((v,i)=>pair(v,`solid vertex ${i}`)));
    for(const region of regions){const vertices=region.points||[];if(vertices.length<3)throw Error('Each area needs at least three vertices');
      const pts=vertices.map((v,i)=>pair(v,`polygon vertex ${i}`));
      verifySimplePolygon(pts);
      if(region.cutout&&!pts.every(vertex=>solidPolys.some(poly=>pointInside(vertex,poly))))throw Error('Cutout vertices must lie inside a solid polygon');
      let twice=0,sx=0,sy=0,sIx=0,sIy=0,sIxy=0;
      for(let i=0;i<pts.length;i++){
        const [x,y]=pts[i],[u,v]=pts[(i+1)%pts.length],c=x*v-u*y;
        twice+=c;sx+=(x+u)*c;sy+=(y+v)*c;
        sIx+=c*(y*y+y*v+v*v);sIy+=c*(x*x+x*u+u*u);
        sIxy+=c*(2*x*y+x*v+u*y+2*u*v);
      }
      if(Math.abs(twice)<EPS)throw Error('Zero-area/self-canceling polygon');
      const sign=Math.sign(twice),factor=region.cutout?-1:1;
      A+=factor*Math.abs(twice)/2;
      Qx+=factor*sign*sy/6;Qy+=factor*sign*sx/6;
      Ix+=factor*sign*sIx/12;Iy+=factor*sign*sIy/12;Ixy+=factor*sign*sIxy/24;
    }
    if(A<=EPS)throw Error('Composite area must have positive net area');
    const cx=Qy/A,cy=Qx/A;
    const IcX=Ix-A*cy*cy,IcY=Iy-A*cx*cx,IcXY=Ixy-A*cx*cy;
    if(IcX<-1e-7||IcY<-1e-7)throw Error('Invalid polygon geometry or cutout ordering');
    return {type:'centroid',area:A,cx,cy,Ix,Iy,Ixy,IxCentroid:IcX,IyCentroid:IcY,IxyCentroid:IcXY,
      description:'Exact composite polygon centroid, area second moments, and parallel-axis shift. Polygons must be simple and cutouts physically contained.'};
  }
  // Exact integration for areas bounded by polynomial y_top(x) and y_bottom(x).
  // c[k] is the coefficient of x^k, not an executable expression.
  function centroidPolynomials(p){
    const regions=p.regions||[];if(!regions.length)throw Error('Polynomial centroid requires region bounds');
    const poly=(raw,label)=>{
      if(!Array.isArray(raw)||!raw.length||raw.length>11)throw Error(`${label} requires 1–11 polynomial coefficients`);
      return raw.map((v,i)=>requireNum(v,`${label} c${i}`));
    };
    const multiply=(a,b)=>{const out=cloneZeros(a.length+b.length-1);a.forEach((x,i)=>b.forEach((y,j)=>out[i+j]+=x*y));return out;};
    const power=(a,n)=>{let out=[1];for(let i=0;i<n;i++)out=multiply(out,a);return out;};
    const integrate=(a,lo,hi,offset=0)=>a.reduce((sum,c,k)=>sum+c/(k+offset+1)*(Math.pow(hi,k+offset+1)-Math.pow(lo,k+offset+1)),0);
    const add=(a,b,sign=1)=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]||0)+sign*(b[i]||0));
    const evaluate=(a,x)=>a.reduceRight((v,c)=>v*x+c,0);
    let A=0,Qx=0,Qy=0,Ix=0,Iy=0,Ixy=0;
    for(const r of regions){
      const lo=requireNum(r.xMin,'xMin'),hi=requireNum(r.xMax,'xMax');if(!(hi>lo))throw Error('xMax must be larger than xMin');
      const top=poly(r.top,'top boundary'),bottom=poly(r.bottom,'bottom boundary');
      for(let i=0;i<=128;i++){const x=lo+(hi-lo)*i/128;if(evaluate(top,x)<evaluate(bottom,x)-1e-8)throw Error('Top polynomial falls below bottom over domain');}
      const h=add(top,bottom,-1),h2=add(power(top,2),power(bottom,2),-1),h3=add(power(top,3),power(bottom,3),-1);
      const sign=r.cutout?-1:1;
      A+=sign*integrate(h,lo,hi);
      Qy+=sign*integrate(h,lo,hi,1);
      Qx+=sign*integrate(h2,lo,hi)/2;
      Ix+=sign*integrate(h3,lo,hi)/3;
      Iy+=sign*integrate(h,lo,hi,2);
      Ixy+=sign*integrate(h2,lo,hi,1)/2;
    }
    if(!(A>EPS))throw Error('Polynomial composite area must be positive');
    const cx=Qy/A,cy=Qx/A;
    return {type:'centroid',area:A,cx,cy,Ix,Iy,Ixy,IxCentroid:Ix-A*cy*cy,IyCentroid:Iy-A*cx*cx,IxyCentroid:Ixy-A*cx*cy,
      description:'Exact polynomial area integration in Cartesian coordinates. Bounds and signs must be reviewed; cross-section is not automatically inferred from pixels.'};
  }
  function solveFriction(p){
    const type=p.model;
    if(type==='belt'){
      const mu=nonnegative(p.mu,'friction coefficient'),theta=nonnegative(p.wrapRadians,'wrap radians'),ratio=Math.exp(mu*theta);
      if(p.lowTension===undefined&&p.highTension===undefined)throw Error('Belt friction requires a known slack- or tight-side tension');
      const Tlow=p.lowTension!==undefined?nonnegative(p.lowTension,'slack-side tension'):nonnegative(p.highTension,'tight-side tension')/ratio;
      return {type:'friction',highTension:Tlow*ratio,lowTension:Tlow,ratio,description:'Capstan equation at impending slip. Wrap angle must be radians, not degrees.'};
    }
    if(type==='slide_tipping'){
      const W=positive(p.weight,'weight'),width=positive(p.width,'base width'),height=positive(p.pushHeight,'applied force height'),mu=nonnegative(p.muStatic,'static friction');
      const tippingForce=W*width/(2*height),slidingForce=mu*W;
      return {type:'friction',slidingForce,tippingForce,maximumMuForSlidingFirst:width/(2*height),behavior:slidingForce<tippingForce-EPS?'slide':slidingForce>tippingForce+EPS?'tip':'simultaneous',description:'Horizontal push on level ground; weight acts at center of rectangular base.'};
    }
    if(type==='incline'){
      const W=positive(p.weight,'weight'),a=requireNum(p.angleRadians,'incline angle'),P=requireNum(p.parallelApplied??0,'parallel applied force'),mu=nonnegative(p.muStatic,'static friction');
      if(Math.abs(a)>=Math.PI/2)throw Error('Incline angle must be less than 90 degrees');
      const normal=W*Math.cos(a),drive=P-W*Math.sin(a),requiredFriction=-drive,maxStaticFriction=mu*normal;
      return {type:'friction',normal,requiredFriction,maxStaticFriction,equilibriumPossible:Math.abs(requiredFriction)<=maxStaticFriction+1e-8,description:'Static incline equilibrium with applied force parallel to slope; does not compute acceleration after slip.'};
    }
    throw Error(`Unsupported friction model: ${type}`);
  }
  function solveSprings(p){
    const springs=p.stiffnesses||[];if(!springs.length)throw Error('Spring model needs stiffnesses');
    springs.forEach((k,i)=>positive(k,`spring k${i}`));
    const equivalent=p.arrangement==='series'?1/springs.reduce((s,k)=>s+1/k,0):p.arrangement==='parallel'?springs.reduce((s,k)=>s+k,0):null;
    if(equivalent===null)throw Error('Spring arrangement must be series or parallel');
    const gravity=p.g===undefined?9.81:positive(p.g,'gravitational acceleration');
    const massForce=p.massesKg!==undefined?(p.massesKg||[]).reduce((acc,m)=>acc+nonnegative(m,'mass')*gravity,0):undefined;
    if(p.force!==undefined||massForce!==undefined){const force=p.force!==undefined?requireNum(p.force,'spring force'):massForce;return {type:'spring',equivalentStiffness:equivalent,extension:force/equivalent,force,description:'Linear Hooke-law springs, negligible spring weight; all stiffnesses must use the same units.'};}
    if(p.extension!==undefined){const extension=requireNum(p.extension,'spring extension');return {type:'spring',equivalentStiffness:equivalent,force:equivalent*extension,extension,description:'Linear Hooke-law springs with a prescribed displacement.'};}
    throw Error('Spring needs an applied force or extension');
  }
  function solveResultant(p){
    const dim=p.dimension===3?3:2,origin=vec(p.origin??cloneZeros(dim),dim,'moment reference');
    const R=cloneZeros(dim),M=cloneZeros(dim===3?3:1);
    for(const f of p.forces||[]){const at=vec(f.at,dim,'application point'),v=vec(f.value,dim,'force');v.forEach((x,i)=>R[i]+=x);
      if(dim===2)M[0]+=moments2D(at,v,origin);else cross3(at.map((x,i)=>x-origin[i]),v).forEach((x,i)=>M[i]+=x);
    }
    for(const c of p.couples||[]){if(dim===2)M[0]+=requireNum(c,'couple');else triple(c,'couple').forEach((x,i)=>M[i]+=x);}
    return {type:'resultant',R,M,description:'Known applied force and moment resultants; not automatically balanced by unknown reactions.'};
  }
  function solveVirtualWork(p){
    // User must provide a physically valid compatible virtual displacement.
    let known=0;for(const w of p.workTerms||[]){
      if(w.force!==undefined){const f=vec(w.force,2,'force'),d=vec(w.displacement,2,'virtual displacement');known+=f[0]*d[0]+f[1]*d[1];}
      else known+=requireNum(w.moment,'moment')*requireNum(w.rotation,'virtual rotation');
    }
    const coeff=requireNum(p.unknownWorkCoefficient,'unknown-force virtual work coefficient');
    if(Math.abs(coeff)<EPS)throw Error('Virtual work unknown coefficient cannot be zero');
    return {type:'virtual_work',unknownValue:-known/coeff,knownWork:known,description:'Ideal one-DOF virtual work with user-supplied compatible displacements/rotations; constraints must do zero virtual work.'};
  }
  function solvePhysics(physics){
    if(!physics||typeof physics!=='object')throw Error('No structured mechanics data supplied');
    const operations={rigid2d:assembleRigid2D,rigid3d:assembleRigid3D,particle:solveParticle,centroid:centroidPolygons,centroid_polynomial:centroidPolynomials,friction:solveFriction,spring:solveSprings,resultant:solveResultant,virtual_work:solveVirtualWork};
    const solver=operations[physics.operation];if(!solver)throw Error(`No verified solver for ${physics.operation||'this topic'}.`);
    return solver(physics);
  }
  const api={solvePhysics,linearSolve,assembleRigid2D,assembleRigid3D,solveParticle,centroidPolygons,centroidPolynomials,solveFriction,solveSprings,solveResultant,solveVirtualWork};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.TVMechanics=api;
})(typeof globalThis!=='undefined'?globalThis:this);

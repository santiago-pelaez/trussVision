'use strict';
// Independent closed-form statics fundamentals used for reference benchmarks.
// These pure routines are not automatically wired into the image scanner/UI.
function number(x, label) {if(typeof x !== 'number'||!Number.isFinite(x))throw new Error('Invalid '+label);return x;}
function vec3(a,label='vector'){if(!Array.isArray(a)||a.length!==3)return (()=>{throw Error('Invalid '+label)})();return a.map((v,i)=>number(v,label+'['+i+']'));}
function norm(v){v=vec3(v);return Math.hypot(...v);}
function direction(from,to){const a=vec3(from,'from'),b=vec3(to,'to'),d=b.map((x,i)=>x-a[i]),m=norm(d);if(m<=0)throw Error('Identical points');return d.map(x=>x/m);}
function cross(a,b){a=vec3(a);b=vec3(b);return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function momentAbout(point,forces,couples=[]){const p=vec3(point,'reference'),m=[0,0,0];for(const f of forces){const pos=vec3(f.position,'position'),force=vec3(f.force,'force'),c=cross(pos.map((x,i)=>x-p[i]),force);c.forEach((x,i)=>m[i]+=x);}for(const c of couples)vec3(c,'couple').forEach((x,i)=>m[i]+=x);return m;}
function springExtension(massesKg,kNPerMm,g=9.81){if(!Array.isArray(massesKg)||!massesKg.length)throw Error('Missing masses');const m=massesKg.reduce((s,x)=>s+number(x,'mass'),0),k=number(kNPerMm,'spring stiffness');if(m<0||k<=0)throw Error('Invalid mass or stiffness');return m*number(g,'gravity')/k;}
function slideThresholdMu(push,weight){const p=number(push,'push'),w=number(weight,'weight');if(p<0||w<=0)throw Error('Invalid force');return p/w;}
function beltHighTension(lowTension,mu,wrapRadians){const t=number(lowTension,'low tension'),u=number(mu,'friction coefficient'),th=number(wrapRadians,'wrap angle');if(t<0||u<0||th<0)throw Error('Invalid belt inputs');return t*Math.exp(u*th);}
// Planar second moments for region between yTop(x), yBottom(x), x in [a,b].
// Simpson integration for analytical cross-checks, not used for visual image extraction.
function areaMoments(top,bottom,a,b,n=10000){number(a,'lower bound');number(b,'upper bound');if(!(b>a)||n%2||n<2)throw Error('Invalid integration interval');const h=(b-a)/n;let A=0,Ix=0,Iy=0,Qx=0,Qy=0;for(let i=0;i<=n;i++){const x=a+h*i,t=number(top(x),'top'),lo=number(bottom(x),'bottom');if(t<lo-1e-12)throw Error('Negative section height');const wt=i===0||i===n?1:(i%2===0?2:4);const height=t-lo;A+=wt*height;Iy+=wt*x*x*height;Ix+=wt*(t*t*t-lo*lo*lo)/3;Qx+=wt*(t*t-lo*lo)/2;Qy+=wt*x*height;}return {area:A*h/3,Ix:Ix*h/3,Iy:Iy*h/3,centroidX:(Qy*h/3)/(A*h/3),centroidY:(Qx*h/3)/(A*h/3)};}
const api={direction,cross,momentAbout,springExtension,slideThresholdMu,beltHighTension,areaMoments};
if(typeof module!=='undefined')module.exports=api;
if(typeof globalThis!=='undefined')globalThis.TVFundamentals=api;

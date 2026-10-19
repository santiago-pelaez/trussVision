'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../trussvision/gemini-client.js'),'utf8');
async function run(body){let seen;const sandbox={globalThis:null,console,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{seen={url,options};return {ok:true,json:async()=>body};}};sandbox.globalThis=sandbox;vm.runInNewContext(source,sandbox);const result=await sandbox.TVGemini.analyze({apiKey:'TEST_KEY_NOT_REAL',model:'gemini-3.8-flash',mimeType:'image/png',base64:'FAKE',detailed:false});return {result,seen};}
(async()=>{
const payload={kind:'frame2d',nodes:[],members:[],loads:[],units:'ft',forceUnit:'lb'};
const good=await run({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(payload)}]}}]});
assert.equal(good.result.scene.kind,'frame2d');assert(good.result.scene.warnings.some(s=>s.includes('No structured rigid-body model')));
assert.equal(good.seen.options.headers['x-goog-api-key'],'TEST_KEY_NOT_REAL');assert(!good.seen.url.includes('TEST_KEY_NOT_REAL'));
let caught='';try{await run({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{}'}]}}]});}catch(e){caught=e.message;}assert(/MAX_TOKENS/.test(caught));
let blocked='';try{await run({promptFeedback:{blockReason:'SAFETY'},candidates:[]});}catch(e){blocked=e.message;}assert(/SAFETY/.test(blocked));
const physics={operation:'rigid2d',bodies:[{id:'R',forces:[{at:[2,0],value:[0,-10]}],supports:[{type:'fixed',id:'A',at:[0,0]}]}]};
const valid=await run({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...payload,physics})}]}}]});
assert.equal(valid.result.scene.physics.operation,'rigid2d');
console.log('PASS: Gemini response parsing, explicit incomplete response, safe key header, rigid2d model retention, and missing-model warnings');
})().catch(e=>{console.error(e);process.exitCode=1;});

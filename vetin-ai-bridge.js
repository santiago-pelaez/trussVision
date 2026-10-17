/* Non-invasive addon to Vetin Beam. Only invokes its publicly declared loader. */
(() => {
 'use strict';
 document.addEventListener('DOMContentLoaded',()=>{
   const button=document.createElement('a');
   button.href=new URL('trussvision/',location.href).href;
   button.textContent='OPEN TRUSSVISION AI';
   button.setAttribute('aria-label','Open the TrussVision AI statics importer');
   button.title='Open TrussVision AI statics importer';
   Object.assign(button.style,{position:'fixed',right:'18px',bottom:'18px',zIndex:'99999',background:'#29143e',color:'#ffb85c',border:'1px solid #ff8c39',borderRadius:'12px',padding:'12px 17px',boxShadow:'0 0 20px #e15e7155',font:'bold 13px system-ui',textDecoration:'none'});
   document.body.appendChild(button);
   if(new URLSearchParams(location.search).get('tvimport')!=='1')return;
   const notice=document.createElement('div');
   Object.assign(notice.style,{position:'fixed',left:'50%',top:'20px',transform:'translateX(-50%)',background:'#1b1b2f',color:'#f7d6a1',border:'1px solid #ff9a4f',padding:'12px 18px',zIndex:'99999',borderRadius:'8px',font:'14px system-ui',maxWidth:'90vw'});
   document.body.appendChild(notice);
   const pending=sessionStorage.getItem('trussvision-pending-vetin');
   if(!pending){notice.textContent='No pending model. Use AI Photo → Beam to scan one.';return;}
   try {
     const data=JSON.parse(pending);
     if(data.format!=='vetin-beam'||data.version!==2)throw Error('Wrong model format.');
     if(typeof loadModelIntoApp!=='function')throw Error('Original Vetin loader unavailable. Please import the JSON manually.');
     const success=loadModelIntoApp(data);
     if(success===false)throw Error('Vetin rejected the model. Check loads and supports.');
     sessionStorage.removeItem('trussvision-pending-vetin');
     notice.textContent='✓ AI beam imported. Inspect inputs and diagrams; correct any uncertain readings.';
     setTimeout(()=>notice.remove(),9000);
   } catch(err) {
     console.error('TrussVision bridge:',err);
     notice.textContent='⚠ '+err.message+' Model is preserved for retry; original simulator is still available.';
   }
 });
})();

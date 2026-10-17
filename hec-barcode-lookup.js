(function(){
'use strict';
const ENDPOINT='https://hec-tech-lookup.hectech.workers.dev/product-lookup';
function setup(){
 const area=document.getElementById('modalContent');if(!area)return;
 function installForm(){
  const form=area.querySelector('#toolForm');
  if(!form||form.dataset.hecBarcodeSearch)return;
  form.dataset.hecBarcodeSearch='1';
  const field=form.elements.namedItem('barcode');
  if(!field)return;
  const button=document.createElement('button');button.type='button';button.dataset.hecBarcodeLookup='1';button.textContent='🔎 Find product using barcode';
  button.style.cssText='padding:10px 12px;margin:8px 0;border-radius:10px';
  const status=document.createElement('div');status.setAttribute('role','status');
  let activeLookup=null;
  const results=document.createElement('div');results.style.cssText='display:grid;gap:8px;margin:10px 0';
  field.insertAdjacentElement('afterend',button);button.insertAdjacentElement('afterend',status);status.insertAdjacentElement('afterend',results);
  field.addEventListener('input',()=>{if(activeLookup)activeLookup.abort();results.replaceChildren();status.textContent='';button.disabled=false});
  button.onclick=async()=>{
   if(activeLookup)activeLookup.abort();
   const code=field.value.replace(/[\s-]/g,'');field.value=code;results.replaceChildren();
   if(!/^\d{8,14}$/.test(code)){status.textContent='Enter or scan an 8–14 digit product barcode first. QR web links are not product barcodes.';return}
   const warnings=document.createElement('div');results.append(warnings);
   const existing=(typeof items!=='undefined'&&Array.isArray(items)?items:[]).find(x=>String(x.barcode||'').trim()===code);
   if(existing){
    const warn=document.createElement('div');warn.setAttribute('role','alert');
    warn.style.cssText='padding:10px;border:2px solid #d97706;border-radius:9px;background:#fff7ed;color:#78350f';
    warn.textContent='Possible duplicate: '+String(existing.name||'An existing item')+' already uses this barcode. Check before adding another.';
    warnings.append(warn);
   }
   status.textContent='Searching the shared HEC TECH product catalog…';button.disabled=true;
   const controller=new AbortController();activeLookup=controller;
   const current=()=>activeLookup===controller&&!controller.signal.aborted&&form.isConnected&&field.value.trim()===code;
   const timeout=setTimeout(()=>controller.abort(),12000);
   try{
    const response=await fetch(ENDPOINT+'?barcode='+encodeURIComponent(code),{signal:controller.signal});
    const data=await response.json();if(!current())return;
    if(!response.ok)throw Error(data.error||'Catalog lookup failed');
    const matches=Array.isArray(data.matches)?data.matches:[];
    if(!matches.length){status.textContent='This barcode is not in the shared catalog yet. You can still enter the product details manually.';return}
    status.textContent='Found in the shared HEC TECH catalog. Confirm the packaging before using these details.';
    for(const item of matches){
     const choose=document.createElement('button');choose.type='button';
     choose.style.cssText='display:flex;align-items:center;gap:8px;padding:10px;text-align:left;white-space:normal;border-radius:10px';
     if(item.photoUrl){const img=document.createElement('img');img.src=item.photoUrl;img.alt='';img.referrerPolicy='no-referrer';img.style.cssText='width:55px;height:55px;object-fit:contain';choose.append(img)}
     const label=document.createElement('span');label.textContent=[item.name,item.brand,item.model].filter(Boolean).join(' · ');choose.append(label);
     choose.onclick=()=>{
      if(!current())return;
      for(const [fieldName,value] of Object.entries({name:item.name,brand:item.brand,model:item.model,barcode:item.barcode,category:item.category})){
       const input=form.elements.namedItem(fieldName);if(input&&!input.value.trim()&&value)input.value=value;
      }
      status.textContent='Catalog details added to the form. Review before saving. Your personal item photos, notes and other inventory details stay private.';
      results.replaceChildren(warnings);
     };
     results.append(choose);
     for(const [url,text] of [[item.productUrl,'Product details'],[item.manualUrl,'Manual link']]){
      if(!url)continue;const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=text;results.append(link)
     }
    }
   }catch(err){if(activeLookup!==controller||!form.isConnected||field.value.trim()!==code)return;status.textContent=err.name==='AbortError'?'Catalog lookup timed out. Try again.':'Catalog lookup unavailable: '+err.message}
   finally{clearTimeout(timeout);if(activeLookup===controller)button.disabled=false}
  };
 }
 const observer=new MutationObserver(installForm);
 observer.observe(area,{childList:true,subtree:true});
 window.HECLookupScannedBarcode=code=>{
  installForm();
  const form=area.querySelector('#toolForm');if(!form)return;
  const field=form.elements.namedItem('barcode');if(!field)return;
  field.value=String(code||'').trim();field.dispatchEvent(new Event('input',{bubbles:true}));
  const button=form.querySelector('[data-hec-barcode-lookup]');
  if(button){const pending=button.onclick();button.scrollIntoView({behavior:'smooth',block:'start'});return pending}
 };
 installForm();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();

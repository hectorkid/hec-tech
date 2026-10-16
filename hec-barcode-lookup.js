(function(){
'use strict';
const ENDPOINT='https://hec-tech-lookup.hectech.workers.dev/product-lookup';
function setup(){
 const area=document.getElementById('modalContent');if(!area)return;
 const observer=new MutationObserver(()=>{
  const form=area.querySelector('#toolForm');
  if(!form||form.dataset.hecBarcodeSearch)return;
  form.dataset.hecBarcodeSearch='1';
  const field=form.elements.namedItem('barcode');
  if(!field)return;
  const button=document.createElement('button');button.type='button';button.textContent='🔎 Find product using barcode';
  button.style.cssText='padding:10px 12px;margin:8px 0;border-radius:10px';
  const status=document.createElement('div');status.setAttribute('role','status');
  const results=document.createElement('div');results.style.cssText='display:grid;gap:8px;margin:10px 0';
  field.insertAdjacentElement('afterend',button);button.insertAdjacentElement('afterend',status);status.insertAdjacentElement('afterend',results);
  button.onclick=async()=>{
   const code=field.value.trim();results.replaceChildren();
   if(!/^\d{8,14}$/.test(code)){status.textContent='Enter or scan an 8–14 digit product barcode first. QR web links are not product barcodes.';return}
   status.textContent='Looking up barcode '+code+'…';button.disabled=true;
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),16000);
   try{
    const response=await fetch(ENDPOINT+'?barcode='+encodeURIComponent(code),{signal:controller.signal});
    const data=await response.json();if(!response.ok)throw Error(data.error||'Lookup failed');
    const matches=Array.isArray(data.matches)?data.matches:[];
    if(!matches.length){status.textContent='No product listings explicitly containing this barcode were found. Try the store search or enter details manually.';return}
    status.textContent='Listings mention this barcode, but the product identity is not independently verified. Confirm the packaging and brand before choosing.';
    for(const product of matches){
     const choose=document.createElement('button');choose.type='button';
     choose.style.cssText='display:flex;align-items:center;gap:8px;padding:9px;text-align:left;white-space:normal;border-radius:10px';
     if(product.thumbnail){const img=document.createElement('img');img.src=product.thumbnail;img.alt='';img.style.cssText='width:50px;height:50px;object-fit:contain';choose.append(img)}
     const label=document.createElement('span');label.textContent=[product.title,product.source].filter(Boolean).join(' · ');choose.append(label);
     choose.onclick=()=>{
      const name=form.elements.namedItem('name'),brand=form.elements.namedItem('brand'),notes=form.elements.namedItem('notes');
      if(name&&!name.value.trim())name.value=product.title||'';
      const brands=['Milwaukee','DeWalt','Makita','Bosch','Ryobi','Honeywell','Samsung','Panasonic','Sony','LG'];
      const b=brands.find(b=>(product.title||'').toLowerCase().includes(b.toLowerCase()));
      if(brand&&!brand.value.trim()&&b)brand.value=b;
      if(notes&&product.link&&!notes.value.includes(product.link))notes.value+=(notes.value?'\n':'')+'Product listing: '+product.link;
      status.textContent='Suggested details added. Check the item before saving; no changes have been saved yet.';
      results.replaceChildren();
     };
     results.append(choose);
    }
   }catch(err){status.textContent=err.name==='AbortError'?'Lookup timed out. Try again.':'Lookup unavailable: '+err.message}
   finally{clearTimeout(timeout);button.disabled=false}
  };
 });
 observer.observe(area,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
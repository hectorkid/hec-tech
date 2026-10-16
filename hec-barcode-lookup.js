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
  field.addEventListener('input',()=>{if(activeLookup)activeLookup.abort();results.replaceChildren();status.textContent='';button.disabled=false});
  const results=document.createElement('div');results.style.cssText='display:grid;gap:8px;margin:10px 0';
  field.insertAdjacentElement('afterend',button);button.insertAdjacentElement('afterend',status);status.insertAdjacentElement('afterend',results);
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
   status.textContent='Looking up barcode '+code+'…';button.disabled=true;
   const controller=new AbortController();activeLookup=controller;
   const current=()=>activeLookup===controller&&!controller.signal.aborted&&form.isConnected&&field.value.trim()===code;
   const timeout=setTimeout(()=>controller.abort(),22000);
   try{
    // Try a structured barcode catalog before shopping search. Catalog records
    // explicitly associate a product with its GTIN, unlike search snippets.
    for(const [catalogHost,catalogName] of [['world.openproductsfacts.org','Open Products Facts'],['world.openfoodfacts.org','Open Food Facts'],['world.openbeautyfacts.org','Open Beauty Facts']]){
     try{
     const perCatalog=new AbortController();
     const catalogTimer=setTimeout(()=>perCatalog.abort(),2000);
     let catalog,record;
     try{
      catalog=await fetch('https://'+catalogHost+'/api/v2/product/'+encodeURIComponent(code)+'.json?fields=code,product_name,brands,image_front_small_url',{signal:AbortSignal.any([controller.signal,perCatalog.signal])});
      if(catalog.ok)record=await catalog.json();
     }finally{clearTimeout(catalogTimer)}
     if(catalog.ok){
      if(!current())return;
      const item=record.product;
      if(record.status===1&&item&&item.product_name&&String(item.code||record.code||'')===code){
       const name=form.elements.namedItem('name'),brand=form.elements.namedItem('brand');
       status.textContent='Barcode found in '+catalogName+'. Confirm the packaging before using this catalog entry.';
       const choose=document.createElement('button');choose.type='button';
       choose.style.cssText='display:flex;align-items:center;gap:8px;padding:10px;text-align:left;white-space:normal;border-radius:10px';
       if(item.image_front_small_url&&/^https:\/\//.test(item.image_front_small_url)){const img=document.createElement('img');img.src=item.image_front_small_url;img.alt='';img.style.cssText='width:55px;height:55px;object-fit:contain';choose.append(img)}
       const label=document.createElement('span');label.textContent=item.product_name+' · '+catalogName+' catalog';choose.append(label);
       choose.onclick=()=>{if(!current())return;if(name&&!name.value.trim())name.value=item.product_name;if(brand&&!brand.value.trim())brand.value=(item.brands||'').split(',')[0].trim();status.textContent='Catalog details added. Review before saving.';results.replaceChildren(warnings)};
       results.append(choose);return;
      }
     }
     }catch(catalogError){if(controller.signal.aborted)throw catalogError}
    }
    const response=await fetch(ENDPOINT+'?barcode='+encodeURIComponent(code),{signal:controller.signal});
    const data=await response.json();if(!current())return;
    if(!response.ok)throw Error(data.error||'Lookup failed');
    const matches=Array.isArray(data.matches)?data.matches:[];
    if(!matches.length){status.textContent='No product listings explicitly containing this barcode were found. Try the store search or enter details manually.';return}
    status.textContent='Listings mention this barcode, but the product identity is not independently verified. Confirm the packaging and brand before choosing.';
    for(const product of matches){
     const choose=document.createElement('button');choose.type='button';
     choose.style.cssText='display:flex;align-items:center;gap:8px;padding:9px;text-align:left;white-space:normal;border-radius:10px';
     if(product.thumbnail){const img=document.createElement('img');img.src=product.thumbnail;img.alt='';img.style.cssText='width:50px;height:50px;object-fit:contain';choose.append(img)}
     const label=document.createElement('span');label.textContent=[product.title,product.source].filter(Boolean).join(' · ');choose.append(label);
     choose.onclick=()=>{
      if(!current())return;
      const name=form.elements.namedItem('name'),brand=form.elements.namedItem('brand'),notes=form.elements.namedItem('notes');
      if(name&&!name.value.trim())name.value=product.title||'';
      const brands=['Milwaukee','DeWalt','Makita','Bosch','Ryobi','Honeywell','Samsung','Panasonic','Sony','LG'];
      const b=brands.find(b=>(product.title||'').toLowerCase().includes(b.toLowerCase()));
      if(brand&&!brand.value.trim()&&b)brand.value=b;
      if(notes&&product.link&&!notes.value.includes(product.link))notes.value+=(notes.value?'\n':'')+'Product listing: '+product.link;
      status.textContent='Suggested details added. Check the item before saving; no changes have been saved yet.';
      results.replaceChildren(warnings);
     };
     results.append(choose);
    }
   }catch(err){if(activeLookup!==controller||!form.isConnected||field.value.trim()!==code)return;status.textContent=err.name==='AbortError'?'Lookup timed out. Try again.':'Lookup unavailable: '+err.message}
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
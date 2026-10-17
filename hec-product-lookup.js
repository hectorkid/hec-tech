(function(){
'use strict';
const API='https://hec-tech-lookup.hectech.workers.dev/product-lookup';
function fillProduct(product,query){
 if(typeof window.edit!=='function')return;
 window.edit(null);
 const form=document.getElementById('toolForm');
 if(!form)return;
 const title=String(product.name||product.title||'').replace(/\s+/g,' ').trim();
 const cleanQuery=query.trim().replace(/[.,;:!?]+$/,'').trim();
 const codes=cleanQuery.match(/\b(?=[a-z0-9-]*\d)[a-z0-9]+(?:-[a-z0-9]+)*\b/gi)||[];
 const fallbackModel=(codes.sort((a,b)=>b.length-a.length)[0]||cleanQuery);
 const model=String(product.model||fallbackModel);
 const brandCandidates=['Milwaukee','Honeywell','DeWalt','Makita','Bosch','Ryobi','Craftsman','Samsung','LG','GE','Panasonic','Klein','Ridgid','Husky','Apple','Sony','Shark','Dyson','Bissell','Black+Decker','Dremel'];
 const brand=brandCandidates.find(b=>(' '+title.toLowerCase().replace(/[^a-z0-9]+/g,' ')+' ').includes(' '+b.toLowerCase().replace(/[^a-z0-9]+/g,' ')+' '))||'';
 const set=(name,value)=>{if(name==='category'&&window.HECCategories)value=window.HECCategories.classify({category:value,name:title});const input=form.elements.namedItem(name);if(input)input.value=value||''};
 set('name',title.slice(0,180));
 set('brand',product.brand||brand);
 if(/\b(?:wi[ -]?fi|wireless|network|ethernet)\b.*\brouter\b|\brouter\b.*\b(?:modem|wi[ -]?fi|wireless|network|ethernet)\b/i.test(title))set('category','Electronics');
 else if(/sander|drill|grinder|saw|impact driver|(?:woodworking )?router(?! modem| wireless| wi-fi)|nailer|hammer drill/i.test(title))set('category','Power Tools');
 else if(/refrigerator|fridge|dehumidifier|dishwasher|microwave|air conditioner|washer|dryer|freezer|range hood/i.test(title))set('category','Appliances');
 else if(/television|\btv\b|monitor|headphones|speaker|tablet|laptop|camera|router modem/i.test(title))set('category','Electronics');
 else if(/fan|light switch|thermostat|humidistat|air purifier/i.test(title))set('category','Home Devices');
 set('model',model);
 if(product.barcode)set('barcode',product.barcode);
 if(product.category)set('category',product.category);
 // Check existing inventory without modifying or saving it.
 const existing=(typeof items!=='undefined'&&Array.isArray(items)?items:[]).find(item=>
   String(item.model||'').trim().toLowerCase()===model.toLowerCase()&&
   (!brand||String(item.brand||'').trim().toLowerCase()===brand.toLowerCase()));
 if(existing){
  const warning=document.createElement('div');
  warning.setAttribute('role','alert');
  warning.style.cssText='padding:12px;margin:10px 0;border:2px solid #d97706;border-radius:10px;background:#fff7ed;color:#78350f';
  const label=document.createElement('strong');label.textContent='Possible duplicate item';
  const detail=document.createElement('p');detail.textContent='Your inventory may already contain '+String(existing.name||model)+'. Review before saving another copy.';
  warning.append(label,detail);form.prepend(warning);
 }
 const photo=product.photoUrl||product.thumbnail;
 if(photo&&/^https:\/\//i.test(photo)){
  const section=document.createElement('div');section.style.cssText='display:grid;gap:8px;margin:12px 0';
  const preview=document.createElement('img');preview.src=photo;preview.alt='Catalog product photo preview';preview.referrerPolicy='no-referrer';preview.style.cssText='max-width:160px;max-height:160px;object-fit:contain';
  const status=document.createElement('small');status.textContent='Catalog photo preview only. Your personal item photos stay in your inventory.';
  section.append(preview,status);const photoInput=document.getElementById('photo');if(photoInput)photoInput.parentNode.insertBefore(section,photoInput);
 }
 const notice=document.createElement('p');notice.className='hec-smart-hint';notice.textContent='Review the product details before saving. Manual links stay online; download or upload a PDF to your private inventory only if you choose.';
 form.prepend(notice);
}
function install(){
 const area=document.getElementById('modalContent');if(!area)return;
 let activeLookup=null;
 const observer=new MutationObserver(()=>{
  if(activeLookup&&!area.querySelector('#hec-model-search')){activeLookup.abort();activeLookup=null}
  const search=area.querySelector('#hec-model-search');
  if(!search||search.dataset.hecLookupReady)return;
  search.dataset.hecLookupReady='1';
  const queryInput=area.querySelector('#hec-model-query');
  queryInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search.click()}});
  queryInput.addEventListener('input',()=>{if(activeLookup){activeLookup.abort();activeLookup=null}search.disabled=false;area.querySelector('#hec-lookup-results')?.replaceChildren()});
  search.addEventListener('click',async e=>{
   e.stopImmediatePropagation();e.preventDefault();
   const input=area.querySelector('#hec-model-query');
   const query=input&&input.value.trim();
   if(!query){input&&input.focus();return}
   let results=area.querySelector('#hec-lookup-results');
   if(!results){results=document.createElement('div');results.id='hec-lookup-results';results.setAttribute('role','status');search.insertAdjacentElement('afterend',results)}
   results.textContent='Searching for matching products…';
   search.disabled=true;
   if(activeLookup)activeLookup.abort();
   const controller=new AbortController();activeLookup=controller;
   const current=()=>activeLookup===controller&&search.isConnected&&input.value.trim()===query;
   const timeout=setTimeout(()=>controller.abort(),16000);
   try{
    const response=await fetch(API+'?model='+encodeURIComponent(query),{method:'GET',signal:controller.signal});
    const data=await response.json();
    if(!current())return;
    if(!response.ok)throw Error(data.error||'Lookup failed');
    results.replaceChildren();
    const matches=Array.isArray(data.matches)?data.matches:[];
    if(!matches.length){results.textContent='No confident exact-model matches found. Check the brand/model spelling, or continue manually. Compatible replacements are intentionally excluded.';return}
    const heading=document.createElement('p');heading.textContent='Choose a product from the shared HEC TECH catalog:';results.append(heading);
    matches.forEach(product=>{
     const btn=document.createElement('button');btn.type='button';btn.className='hec-lookup-result';
     btn.style.cssText='display:flex;gap:10px;align-items:center;width:100%;padding:10px;margin:8px 0;text-align:left;white-space:normal';
     if(product.photoUrl){const img=document.createElement('img');img.src=product.photoUrl;img.alt='';img.style.cssText='width:60px;height:60px;object-fit:contain';img.referrerPolicy='no-referrer';btn.append(img)}
     const label=document.createElement('span');label.textContent=[product.name,product.brand,product.model,product.barcode].filter(Boolean).join(' · ');btn.append(label);
     btn.onclick=()=>fillProduct(product,query);results.append(btn);
     for(const [url,text] of [[product.productUrl,'Product details'],[product.manualUrl,'Manual link']]){
      if(!url)continue;const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=text;link.style.cssText='display:inline-block;margin:0 8px 8px';results.append(link)
     }
    });
   }catch(err){if(!current())return;results.textContent=err.name==='AbortError'?'Search timed out. Please try again.':'Could not search: '+err.message+'. You can still continue manually.'}
   finally{clearTimeout(timeout);if(activeLookup===controller)search.disabled=false}
  },true)
 });
 observer.observe(area,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();

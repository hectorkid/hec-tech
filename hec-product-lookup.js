(function(){
'use strict';
const API='https://hec-tech-lookup.hectech.workers.dev/product-lookup';
function fillProduct(product,query){
 if(typeof window.edit!=='function')return;
 window.edit(null);
 const form=document.getElementById('toolForm');
 if(!form)return;
 const title=product.title||'';
 const cleanQuery=query.trim().replace(/[.,;:!?]+$/,'').trim();
 const codes=cleanQuery.match(/\b(?=[a-z0-9-]*\d)[a-z0-9]+(?:-[a-z0-9]+)*\b/gi)||[];
 const model=(codes.sort((a,b)=>b.length-a.length)[0]||cleanQuery);
 const source=product.source||'';
 const brandCandidates=['Milwaukee','Honeywell','DeWalt','Makita','Bosch','Ryobi','Craftsman','Samsung','LG','GE','Panasonic','Klein','Ridgid','Husky','Apple','Sony','Shark','Dyson','Bissell','Black+Decker','Dremel'];
 const brand=brandCandidates.find(b=>title.toLowerCase().includes(b.toLowerCase()))||'';
 const set=(name,value)=>{const input=form.elements.namedItem(name);if(input)input.value=value||''};
 set('name',title);
 set('brand',brand);
 if(/sander|drill|grinder|saw|impact driver|router|nailer|hammer drill/i.test(title))set('category','Power Tools');
 set('model',model);
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
 set('notes',[source?'Found via '+source:'',product.link?'Product listing: '+product.link:''].filter(Boolean).join('\n'));
 const priceLabel=document.createElement('label');priceLabel.textContent='Listed price (reference only)';
 const priceField=document.createElement('input');priceField.type='text';priceField.readOnly=true;priceField.value=product.price||'Not listed';
 priceField.setAttribute('aria-label','Listed price, not purchase price');
 const notesField=form.elements.namedItem('notes');
 if(notesField){const group=document.createElement('div');group.style.cssText='display:grid;gap:6px;margin:10px 0';group.append(priceLabel,priceField);notesField.parentNode.insertBefore(group,notesField)}
 const photo=product.thumbnail;
 if(photo&&/^https:\/\//i.test(photo)){
  const section=document.createElement('div');section.style.cssText='display:grid;gap:8px;margin:12px 0';
  const preview=document.createElement('img');preview.src=photo;preview.alt='Suggested product picture';preview.referrerPolicy='no-referrer';preview.style.cssText='max-width:160px;max-height:160px;object-fit:contain';
  const btn=document.createElement('button');btn.type='button';btn.textContent='Use this product picture';
  const status=document.createElement('small');status.textContent='Optional. You can still upload your own photo.';
  btn.onclick=async()=>{
   btn.disabled=true;status.textContent='Importing picture…';
   try{
    const response=await fetch(photo,{mode:'cors'});
    if(!response.ok)throw Error('Image not available');
    const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('Not an image');
    const file=new File([blob],'product-photo.'+(blob.type.includes('png')?'png':'jpg'),{type:blob.type});
    const input=document.getElementById('photo');if(!input)throw Error('Photo input missing');
    const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
    status.textContent='Picture ready. It will be saved with this item when you press Save.';
   }catch(e){status.textContent='This store blocks photo importing. Use Choose from Photos instead.'}
   finally{btn.disabled=false}
  };
  section.append(preview,btn,status);const photoInput=document.getElementById('photo');if(photoInput)photoInput.parentNode.insertBefore(section,photoInput);
 }
 const notice=document.createElement('p');notice.className='hec-smart-hint';notice.textContent='Review the product name and model before saving. Photos are optional; manuals are not automatically imported.';
 form.prepend(notice);
}
function install(){
 const area=document.getElementById('modalContent');if(!area)return;
 const observer=new MutationObserver(()=>{
  const search=area.querySelector('#hec-model-search');
  if(!search||search.dataset.hecLookupReady)return;
  search.dataset.hecLookupReady='1';
  search.addEventListener('click',async e=>{
   e.stopImmediatePropagation();e.preventDefault();
   const input=area.querySelector('#hec-model-query');
   const query=input&&input.value.trim();
   if(!query){input&&input.focus();return}
   let results=area.querySelector('#hec-lookup-results');
   if(!results){results=document.createElement('div');results.id='hec-lookup-results';results.setAttribute('role','status');search.insertAdjacentElement('afterend',results)}
   results.textContent='Searching for matching products…';
   search.disabled=true;
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),16000);
   try{
    const response=await fetch(API+'?model='+encodeURIComponent(query),{method:'GET',signal:controller.signal});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'Lookup failed');
    results.replaceChildren();
    const matches=Array.isArray(data.matches)?data.matches:[];
    if(!matches.length){results.textContent='No confident exact-model matches found. Check the brand/model spelling, or continue manually. Compatible replacements are intentionally excluded.';return}
    const heading=document.createElement('p');heading.textContent='Choose the correct product to fill your form:';results.append(heading);
    matches.forEach(product=>{
     const btn=document.createElement('button');btn.type='button';btn.className='hec-lookup-result';
     btn.style.cssText='display:flex;gap:10px;align-items:center;width:100%;padding:10px;margin:8px 0;text-align:left;white-space:normal';
     if(product.thumbnail){const img=document.createElement('img');img.src=product.thumbnail;img.alt='';img.style.cssText='width:60px;height:60px;object-fit:contain';img.referrerPolicy='no-referrer';btn.append(img)}
     const label=document.createElement('span');label.textContent=[product.title,product.price,product.source].filter(Boolean).join(' · ');btn.append(label);
     btn.onclick=()=>fillProduct(product,query);results.append(btn)
    });
   }catch(err){results.textContent=err.name==='AbortError'?'Search timed out. Please try again.':'Could not search: '+err.message+'. You can still continue manually.'}
   finally{clearTimeout(timeout);search.disabled=false}
  },true)
 });
 observer.observe(area,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
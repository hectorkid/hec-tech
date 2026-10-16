(function(){
'use strict';
const API='https://hec-tech-lookup.hectech.workers.dev/product-lookup';
function fillProduct(product,query){
 if(typeof window.edit!=='function')return;
 window.edit(null);
 const form=document.getElementById('toolForm');
 if(!form)return;
 const title=product.title||'';
 const model=query.trim().replace(/[.,;:!?]+$/,'').trim();
 const source=product.source||'';
 const brandCandidates=['Milwaukee','Honeywell','DeWalt','Makita','Bosch','Ryobi','Craftsman','Samsung','LG','GE','Panasonic','Klein','Ridgid','Husky','Apple','Sony','Shark','Dyson','Bissell','Black+Decker','Dremel'];
 const brand=brandCandidates.find(b=>title.toLowerCase().includes(b.toLowerCase()))||'';
 const set=(name,value)=>{const input=form.elements.namedItem(name);if(input)input.value=value||''};
 set('name',title);
 set('brand',brand);
 if(/sander|drill|grinder|saw|impact driver|router|nailer|hammer drill/i.test(title))set('category','Power Tools');
 set('model',model);
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
 const notice=document.createElement('p');notice.className='hec-smart-hint';notice.textContent='Review these suggested details before saving. Photos and manuals are not automatically imported.';
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
   try{
    const response=await fetch(API+'?model='+encodeURIComponent(query),{method:'GET'});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'Lookup failed');
    results.replaceChildren();
    const matches=Array.isArray(data.matches)?data.matches:[];
    if(!matches.length){results.textContent='No products found. You can continue manually.';return}
    const heading=document.createElement('p');heading.textContent='Choose the correct product to fill your form:';results.append(heading);
    matches.forEach(product=>{
     const btn=document.createElement('button');btn.type='button';btn.className='hec-lookup-result';
     btn.style.cssText='display:flex;gap:10px;align-items:center;width:100%;padding:10px;margin:8px 0;text-align:left;white-space:normal';
     if(product.thumbnail){const img=document.createElement('img');img.src=product.thumbnail;img.alt='';img.style.cssText='width:60px;height:60px;object-fit:contain';img.referrerPolicy='no-referrer';btn.append(img)}
     const label=document.createElement('span');label.textContent=[product.title,product.price,product.source].filter(Boolean).join(' · ');btn.append(label);
     btn.onclick=()=>fillProduct(product,query);results.append(btn)
    });
   }catch(err){results.textContent='Could not search: '+err.message+'. You can still continue manually.'}
   finally{search.disabled=false}
  },true)
 });
 observer.observe(area,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
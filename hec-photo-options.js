(function(){'use strict';
const original=window.startAddItemScan;
function showPhotoOptions(){
 const modal=document.getElementById('modal'),area=document.getElementById('modalContent');
 if(!modal||!area)return;
 area.innerHTML='<section class="hec-smart-model"><h2>Add photos</h2><p>Take a new picture or upload pictures you already have.</p><p>Photos are attached to your item. They do not identify the product automatically. Use Scan Barcode or Enter Model Number to search.</p><button type="button" id="hec-camera-choice">📷 Take Photo</button><button type="button" id="hec-upload-choice">🖼 Choose from Photos</button><button type="button" id="hec-photo-cancel">Back</button></section>';
 const choose=camera=>{window.edit(null);const picker=document.getElementById('photo');if(!picker)return;if(camera){picker.multiple=false;picker.setAttribute('capture','environment')}else{picker.multiple=true;picker.removeAttribute('capture')};picker.click()};
 area.querySelector('#hec-camera-choice').onclick=()=>choose(true);
 area.querySelector('#hec-upload-choice').onclick=()=>choose(false);
 area.querySelector('#hec-photo-cancel').onclick=()=>window.startAddItemScan();
 if(!modal.open)modal.showModal();
}
let previewInput=null,previewURLs=[];
function clearPreviewURLs(){previewURLs.forEach(url=>URL.revokeObjectURL(url));previewURLs=[]}
function installPreview(area){
 const input=area.querySelector('#photo');
 if(previewInput&&!previewInput.isConnected){clearPreviewURLs();previewInput=null}
 if(!input||input.dataset.hecPhotoPreview)return;
 input.dataset.hecPhotoPreview='1';previewInput=input;
 const panel=document.createElement('section');panel.setAttribute('aria-label','Selected photos');panel.hidden=true;
 const status=document.createElement('p');status.setAttribute('role','status');
 const gallery=document.createElement('div');gallery.style.cssText='display:flex;gap:10px;overflow-x:auto;padding:8px 0';
 const clear=document.createElement('button');clear.type='button';clear.textContent='Clear selected photos';
 panel.append(status,gallery,clear);input.insertAdjacentElement('afterend',panel);
 function paint(){
  clearPreviewURLs();gallery.replaceChildren();
  const files=Array.from(input.files||[]);panel.hidden=!files.length;
  status.textContent=files.length+' photo'+(files.length===1?'':'s')+' selected — saved when you press Save.';
  files.forEach(file=>{const img=document.createElement('img');const url=URL.createObjectURL(file);previewURLs.push(url);img.src=url;img.alt=file.name||'Selected item photo';img.style.cssText='width:110px;height:110px;object-fit:contain;border-radius:10px;background:#f5f6f8';gallery.append(img)});
 }
 input.addEventListener('change',paint);
 clear.onclick=()=>{input.value='';paint()};
}
function install(){
 const button=document.querySelector('[onclick*="startAddItemScan"]');
 if(!button)return;
 const observer=new MutationObserver(()=>{const area=document.getElementById('modalContent');if(area)installPreview(area);const photo=area&&area.querySelector('[data-mode="photo"]');if(photo&&!photo.dataset.hecPhotoOptions){photo.dataset.hecPhotoOptions='1';photo.addEventListener('click',e=>{e.stopImmediatePropagation();showPhotoOptions()},true)}});
 const area=document.getElementById('modalContent');if(area){observer.observe(area,{childList:true,subtree:true});installPreview(area)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
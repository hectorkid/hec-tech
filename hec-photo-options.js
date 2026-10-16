(function(){'use strict';
const original=window.startAddItemScan;
function showPhotoOptions(){
 const modal=document.getElementById('modal'),area=document.getElementById('modalContent');
 if(!modal||!area)return;
 area.innerHTML='<section class="hec-smart-model"><h2>Add photos</h2><p>Take a new picture or upload pictures you already have.</p><button type="button" id="hec-camera-choice">📷 Take Photo</button><button type="button" id="hec-upload-choice">🖼 Choose from Photos</button><button type="button" id="hec-photo-cancel">Back</button></section>';
 const choose=camera=>{window.edit(null);const picker=document.getElementById('photo');if(!picker)return;if(camera)picker.setAttribute('capture','environment');else picker.removeAttribute('capture');picker.click()};
 area.querySelector('#hec-camera-choice').onclick=()=>choose(true);
 area.querySelector('#hec-upload-choice').onclick=()=>choose(false);
 area.querySelector('#hec-photo-cancel').onclick=()=>window.startAddItemScan();
 if(!modal.open)modal.showModal();
}
function install(){
 const button=document.querySelector('[onclick*="startAddItemScan"]');
 if(!button)return;
 const observer=new MutationObserver(()=>{const area=document.getElementById('modalContent');const photo=area&&area.querySelector('[data-mode="photo"]');if(photo&&!photo.dataset.hecPhotoOptions){photo.dataset.hecPhotoOptions='1';photo.addEventListener('click',e=>{e.stopImmediatePropagation();showPhotoOptions()},true)}});
 const area=document.getElementById('modalContent');if(area)observer.observe(area,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
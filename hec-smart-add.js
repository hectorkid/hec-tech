(function(){
function openForm(){window.edit(null)}
function addChoice(){
 const modal=document.getElementById('modal'),area=document.getElementById('modalContent');
 if(!modal||!area)return;
 area.innerHTML='<section class="hec-smart-add"><h2>✨ Smart Add</h2><p>How would you like to add your item?</p><div class="hec-smart-grid"><button type="button" data-mode="photo">📷<strong>Take a Picture</strong><small>Add photos now</small></button><button type="button" data-mode="barcode">▦<strong>Scan Barcode</strong><small>Scan or choose code photo</small></button><button type="button" data-mode="model">🔎<strong>Enter Model Number</strong><small>Search by model</small></button><button type="button" data-mode="manual">✏️<strong>Add Manually</strong><small>Use existing form</small></button></div><button type="button" data-mode="close">Cancel</button></section>';
 area.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
 const mode=button.dataset.mode;if(mode==='close'){modal.close();return}
 if(mode==='manual'){openForm();return}
 if(mode==='photo'){openForm();const file=document.getElementById('photo');if(file){file.setAttribute('capture','environment');file.click()}return}
 if(mode==='barcode'){openForm();const form=document.getElementById('toolForm');if(form){const info=document.createElement('p');info.className='hec-smart-hint';info.textContent='Scan a barcode or choose an existing barcode picture. You can confirm the result before saving.';form.prepend(info)}return}
 if(mode==='model'){area.innerHTML='<div class="hec-smart-model"><h2>🔎 Search by model</h2><label for="hec-model-query">Brand and model number</label><input id="hec-model-query" type="search" placeholder="e.g. Honeywell CF200D1625"><p>Search product listings, then verify the exact model before saving.</p><button type="button" id="hec-model-search">Search products</button><button type="button" id="hec-model-continue">Continue to item form</button><button type="button" id="hec-model-back">Back</button></div>';const input=area.querySelector('#hec-model-query');const proceed=()=>{const query=input.value.trim();if(!query){input.focus();return}window.open('https://www.google.com/search?q='+encodeURIComponent(query+' product specifications manual'),'_blank','noopener')};area.querySelector('#hec-model-search').onclick=proceed;area.querySelector('#hec-model-continue').onclick=()=>{const value=input.value.trim();openForm();const field=document.querySelector('#toolForm [name="model"]');if(field)field.value=value};area.querySelector('#hec-model-back').onclick=addChoice;input.focus();return}
 });
 if(!modal.open)modal.showModal();
}
function install(){if(typeof window.startAddItemScan==='function')window.startAddItemScan=addChoice}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
(function(){'use strict';
function arrange(id){
 const area=document.getElementById('modalContent');if(!area||area.querySelector('#toolForm'))return;
 const item=typeof items!=='undefined'?items.find(x=>String(x.id)===String(id)):null;if(!item)return;
 const heading=area.querySelector('h2'),details=area.querySelector('.detail'),actions=area.querySelector('.detail-actions-main');if(!heading||!details||!actions)return;
 area.classList.add('hec-clean-detail');
 const header=document.createElement('div');header.className='hec-detail-header';
 const caption=document.createElement('span');caption.textContent='Item details';const close=document.createElement('button');close.type='button';close.textContent='✕';close.setAttribute('aria-label','Close item details');close.onclick=()=>document.getElementById('modal').close();header.append(caption,close);area.prepend(header);
 const title=document.createElement('div');title.className='hec-detail-title';heading.before(title);title.append(heading);
 const favorite=area.querySelector('.detail-favorite-btn');if(favorite){favorite.classList.toggle('is-favorite',Boolean(item.favorite||item.favourite));favorite.textContent=item.favorite||item.favourite?'♥':'♡';favorite.setAttribute('aria-label',item.favorite||item.favourite?'Remove from favorites':'Add to favorites');title.append(favorite)}
 const category=area.querySelector('select[aria-label="Item category"]');if(category){const section=category.closest('section');if(section)section.classList.add('hec-detail-category')}
 const extra=document.createElement('details');extra.className='hec-extra-details';const summary=document.createElement('summary');summary.textContent='More details';const content=document.createElement('div');content.className='detail';extra.append(summary,content);
 for(const row of [...details.children]){const label=row.querySelector('b')?.textContent;if(!['Brand','Model','Serial / ID'].includes(label)){if(label==='Loan status'&&item.loanedTo)row.classList.add('hec-visible-loan');else content.append(row)}}
 details.after(extra);
 const footer=document.createElement('div');footer.className='hec-detail-footer';
 const more=document.createElement('details');more.className='hec-more-actions';const moreTitle=document.createElement('summary');moreTitle.textContent='More actions ⋯';const moreList=document.createElement('div');more.append(moreTitle,moreList);
 const edit=actions.querySelector('button[onclick^="edit("]');if(edit){edit.textContent='Edit item';footer.append(edit)}footer.append(more);
 const receiptPanel=area.querySelector('.receipt-panel');
 if(receiptPanel){
  const receipt=document.createElement('details');receipt.className='hec-receipt-options hec-attachment-row';const receiptSummary=document.createElement('summary');
  const label=document.createElement('span');label.textContent='Receipt';const action=document.createElement('span');action.className='hec-attachment-action';action.textContent=item.receiptStored?'Receipt options ›':'Add receipt ›';receiptSummary.append(label,action);receipt.append(receiptSummary);receiptPanel.before(receipt);receipt.append(receiptPanel);
  if(item.receiptStored){const view=receiptPanel.querySelector('button[onclick^="viewReceipt("]');if(view){view.className='hec-receipt-view';view.textContent='View receipt';view.onclick=event=>{event.preventDefault();event.stopPropagation();window.viewReceipt(id)};action.textContent='';action.append(view)}const manage=document.createElement('button');manage.type='button';manage.textContent='Manage receipt';manage.onclick=()=>{receipt.open=true;more.open=false;receipt.scrollIntoView({behavior:'smooth',block:'nearest'})};moreList.append(manage)}
 }
 const manualRow=document.createElement('div');manualRow.className='hec-attachment-row hec-manual-row';const manualTitle=document.createElement('span');manualTitle.textContent='Manual';manualRow.append(manualTitle);
 const viewManual=actions.querySelector('button[onclick^="viewManual("]'),addManual=actions.querySelector('button[onclick^="addManual("]');
 if(item.manual||item.manualStored){if(viewManual){viewManual.textContent='View manual ›';manualRow.append(viewManual)}if(addManual){addManual.textContent='Add or replace manual';moreList.append(addManual)}}else{if(addManual){addManual.textContent='Add manual ›';manualRow.append(addManual)}if(viewManual)viewManual.remove()}
 extra.after(manualRow);const receipt=area.querySelector('.hec-receipt-options');if(receipt)manualRow.before(receipt);
 for(const button of [...actions.querySelectorAll('button')])moreList.append(button);
 const archive=area.querySelector('.archive-detail-btn');if(archive)moreList.append(archive);
 const gallery=area.querySelector('.hec-multi-gallery');if(gallery){gallery.classList.add('hec-detail-gallery');const photos=Array.isArray(item.images)&&item.images.length?item.images:item.image?[item.image]:[];gallery.hidden=!photos.length;const controls=gallery.querySelector('.hec-gallery-controls');if(controls&&photos.length<2)controls.hidden=true;const remove=gallery.querySelector('.hec-remove-photo');if(remove&&photos.length)moreList.append(remove);else if(remove)remove.remove()}
 actions.remove();area.querySelector('.detail-actions-bottom')?.remove();area.append(footer);area.scrollTop=0;
}
function install(){const original=window.detail;if(typeof original==='function')window.detail=function(id){const result=original.apply(this,arguments);arrange(id);return result};const area=document.getElementById('modalContent');if(area)new MutationObserver(()=>{if(!area.querySelector('.hec-detail-header'))area.classList.remove('hec-clean-detail')}).observe(area,{childList:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();

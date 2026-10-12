/* Portable backup for users without Google Drive.
   Backup includes local tool records, PDF manuals, and receipts from IndexedDB.
   iCloud Drive is a manual save destination, not automatic synchronization. */
(function(){
  function notify(message){
    let status=document.getElementById('portable-backup-status');
    if(!status){
      status=document.createElement('p');
      status.id='portable-backup-status';
      status.setAttribute('role','status');
      status.setAttribute('aria-live','polite');
      status.style.cssText='position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:99999;max-width:min(92vw,540px);box-sizing:border-box;font-size:14px;font-weight:650;margin:0;padding:12px 16px;border-radius:9px;box-shadow:0 4px 18px rgba(0,0,0,.25)';
      document.body.append(status);
    }
    status.textContent=message;
    status.style.background=/failed/i.test(message)?'#fff0f0':'#e8f6ed';
    status.style.color=/failed/i.test(message)?'#a52a2a':'#146c36';
    status.hidden=false;
  }
  function readDataURL(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=()=>reject(reader.error||new Error('Could not read PDF'));
      reader.readAsDataURL(blob);
    });
  }
  async function exportComplete(){
    try{
      const manuals={},receipts={};
      for(const tool of items){
        if(tool.manualStored){
          const pdf=await HECManualStore.get(tool.id);
          if(!pdf)throw new Error('Missing PDF for '+tool.name+'. Export stopped.');
          manuals[String(tool.id)]=await readDataURL(pdf);
        }
        if(tool.receiptStored){
          const receipt=await HECReceiptStore.get(tool.id);
          if(!receipt)throw new Error('Missing receipt for '+tool.name+'. Export stopped.');
          receipts[String(tool.id)]=await readDataURL(receipt);
        }
      }
      const data={format:'hec-tech-complete-v2',createdAt:new Date().toISOString(),items,manuals,receipts};
      const file=new File([JSON.stringify(data)],'hec-tech-complete-backup.json',{type:'application/json'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        try{await navigator.share({files:[file],title:'HEC TECH backup'});notify('Backup file shared. Choose a destination in the share panel to save it.');return}
        catch(err){if(err.name==='AbortError')return}
      }
      const url=URL.createObjectURL(file);
      const link=document.createElement('a');
      link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      notify('Complete backup downloaded. Check Downloads or Files for hec-tech-complete-backup.json. It includes your tools, attached PDF manuals, and item receipts.');
    }catch(err){notify('Backup failed: '+err.message)}
  }
  window.HECExportCompleteBackup=exportComplete;
  async function importComplete(input){
    const file=input.files&&input.files[0];
    input.value='';
    if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      const isV1=data.format==='hec-tech-complete-v1',isV2=data.format==='hec-tech-complete-v2';
      if((!isV1&&!isV2)||!Array.isArray(data.items)||!data.items.every(t=>t&&t.id!=null&&t.name)||!data.manuals||typeof data.manuals!=='object'||(isV2&&(!data.receipts||typeof data.receipts!=='object')))throw new Error('Not a valid complete backup.');
      for(const tool of data.items){
        if(tool.manualStored&&!data.manuals[String(tool.id)])throw new Error('Missing manual for '+tool.name);
        if(tool.receiptStored&&!(data.receipts||{})[String(tool.id)])throw new Error('Missing receipt for '+tool.name);
      }
      const restored=[],restoredReceipts=[];
      for(const [id,encoded] of Object.entries(data.manuals)){
        if(!/^data:application\/pdf;base64,/i.test(encoded))throw new Error('Invalid PDF backup data');
        const response=await fetch(encoded);
        const pdf=await response.blob();
        if(!pdf.size)throw new Error('Empty PDF in backup');
        restored.push([id,pdf]);
      }
      for(const [id,encoded] of Object.entries(data.receipts||{})){
        if(!/^data:(?:application\/pdf|image\/[a-z0-9.+-]+);base64,/i.test(encoded))throw new Error('Invalid receipt backup data');
        const response=await fetch(encoded);
        const receipt=await response.blob();
        if(!receipt.size)throw new Error('Empty receipt in backup');
        restoredReceipts.push([id,receipt]);
      }
      if(window.HECConfirm){if(!await window.HECConfirm('Replace the current inventory with this backup? Export your current inventory first.'))return}else if(!confirm('Replace the current inventory with this backup? Export your current inventory first.'))return;
      for(const [id,pdf] of restored)await HECManualStore.put(id,pdf);
      for(const [id,receipt] of restoredReceipts)await HECReceiptStore.put(id,receipt);
      const previous=items;
      items=data.items;
      if(!save()){items=previous;throw new Error('Inventory storage is full. Current inventory was preserved.')}
      filter='All';render();
      notify('Complete inventory, PDF manuals, and receipts restored on this device.');
    }catch(err){notify('Restore failed: '+err.message)}
  }
  function setup(){
    const main=document.querySelector('main.wrap');
    if(!main)return;
    const panel=document.createElement('section');
    panel.style.cssText='margin:10px 0 16px;padding:10px 14px;border:1px solid #d8dce3;border-radius:12px;background:#fff';
    const details=document.createElement('details');
    const title=document.createElement('summary');
    title.textContent='Manual backup options (includes PDFs and receipts)';
    title.style.cssText='font-weight:650;cursor:pointer';
    const note=document.createElement('p');
    note.style.cssText='font-size:13px;margin:10px 0';
    note.textContent='Create a separate backup file with your tools, attached PDF manuals, and item receipts. Save it to Files, iCloud Drive, or another location. Restoring replaces the inventory on this device.';
    const status=document.createElement('p');
    status.id='portable-backup-status';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    status.hidden=true;
    status.style.cssText='font-size:14px;font-weight:650;margin:10px 0;padding:10px;border-radius:9px';
    const actions=document.createElement('div');
    actions.className='controls';
    const exportButton=document.createElement('button');
    exportButton.type='button';
    exportButton.textContent='📦 Export complete backup';
    exportButton.addEventListener('click',exportComplete);
    const importButton=document.createElement('button');
    importButton.type='button';
    importButton.textContent='📦 Restore complete backup';
    const picker=document.createElement('input');
    picker.type='file';picker.accept='.json,application/json';picker.hidden=true;
    importButton.addEventListener('click',()=>picker.click());
    picker.addEventListener('change',()=>importComplete(picker));
    actions.append(exportButton,importButton,picker);
    details.append(title,note,actions,status);
    panel.id='manual-backup-panel';
    panel.append(details);
    const drive=document.getElementById('drive-backup');
    if(drive)drive.after(panel);
    else main.append(panel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();

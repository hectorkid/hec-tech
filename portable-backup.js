/* Portable backup for users without Google Drive.
   Backup includes local tool records and PDF manuals from IndexedDB.
   iCloud Drive is a manual save destination, not automatic synchronization. */
(function(){
  function notify(message){window.alert(message)}
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
      const manuals={};
      for(const tool of items){
        if(tool.manualStored){
          const pdf=await HECManualStore.get(tool.id);
          if(!pdf)throw new Error('Missing PDF for '+tool.name+'. Export stopped.');
          manuals[String(tool.id)]=await readDataURL(pdf);
        }
      }
      const data={format:'hec-tech-complete-v1',createdAt:new Date().toISOString(),items,manuals};
      const file=new File([JSON.stringify(data)],'hec-tech-complete-backup.json',{type:'application/json'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        try{await navigator.share({files:[file],title:'HEC TECH backup'});return}
        catch(err){if(err.name==='AbortError')return}
      }
      const url=URL.createObjectURL(file);
      const link=document.createElement('a');
      link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      notify('Complete backup downloaded. Check your Downloads or Files app for hec-tech-complete-backup.json. The file includes your tools and attached PDF manuals.');
    }catch(err){notify('Backup failed: '+err.message)}
  }
  async function importComplete(input){
    const file=input.files&&input.files[0];
    input.value='';
    if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      if(data.format!=='hec-tech-complete-v1'||!Array.isArray(data.items)||!data.items.every(t=>t&&t.id!=null&&t.name)||!data.manuals||typeof data.manuals!=='object')throw new Error('Not a valid complete backup.');
      for(const tool of data.items){
        if(tool.manualStored&&!data.manuals[String(tool.id)])throw new Error('Missing manual for '+tool.name);
      }
      const restored=[];
      for(const [id,encoded] of Object.entries(data.manuals)){
        if(!/^data:application\/pdf;base64,/i.test(encoded))throw new Error('Invalid PDF backup data');
        const response=await fetch(encoded);
        const pdf=await response.blob();
        if(!pdf.size)throw new Error('Empty PDF in backup');
        restored.push([id,pdf]);
      }
      if(!confirm('Replace the current inventory with this backup? Export your current inventory first.'))return;
      for(const [id,pdf] of restored)await HECManualStore.put(id,pdf);
      const previous=items;
      items=data.items;
      if(!save()){items=previous;throw new Error('Inventory storage is full. Current inventory was preserved.')}
      filter='All';render();
      notify('Complete inventory and PDF manuals restored on this device.');
    }catch(err){notify('Restore failed: '+err.message)}
  }
  function setup(){
    const main=document.querySelector('main.wrap');
    if(!main)return;
    const panel=document.createElement('section');
    panel.style.cssText='margin:10px 0 16px;padding:10px 14px;border:1px solid #d8dce3;border-radius:12px;background:#fff';
    const details=document.createElement('details');
    const title=document.createElement('summary');
    title.textContent='Manual backup options (includes PDFs)';
    title.style.cssText='font-weight:650;cursor:pointer';
    const note=document.createElement('p');
    note.style.cssText='font-size:13px;margin:10px 0';
    note.textContent='Create a separate backup file with your tools and attached PDF manuals. Save it to Files, iCloud Drive, or another location. Restoring replaces the inventory on this device.';
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
    details.append(title,note,actions);
    panel.append(details);
    const drive=document.getElementById('drive-backup');
    if(drive)drive.after(panel);
    else main.append(panel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();

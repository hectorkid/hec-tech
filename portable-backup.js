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
      notify('Complete backup downloaded. On iPhone, save it in Files > iCloud Drive. This is not automatic iCloud backup.');
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
    const controls=document.querySelector('main .controls');
    if(!controls)return;
    const exportButton=document.createElement('button');
    exportButton.type='button';
    exportButton.textContent='📦 Export complete backup (Files/iCloud)';
    exportButton.addEventListener('click',exportComplete);
    const importButton=document.createElement('button');
    importButton.type='button';
    importButton.textContent='📦 Restore complete backup';
    const picker=document.createElement('input');
    picker.type='file';picker.accept='.json,application/json';picker.hidden=true;
    importButton.addEventListener('click',()=>picker.click());
    picker.addEventListener('change',()=>importComplete(picker));
    controls.append(exportButton,importButton,picker);
    const note=document.createElement('p');
    note.style.fontSize='13px';
    note.textContent='Apple Files / iCloud Drive: manual complete backups. Google Drive automatic backup currently covers inventory only, not offline PDFs.';
    controls.after(note);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();

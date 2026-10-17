(function(root){
'use strict';
const FORMAT='hec-tech-item-updates-v1';
const FILE_NAME='HEC TECH private item updates.json';
const FILE_ID_KEY='hec-tech-private-item-sync-file-v1';
const ALLOWED_FIELDS=new Set(['name','brand','category','model','serial','location','purchaseDate','notes','image','favorite','manual','manualName','quantity','packageInfo']);
function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
function applyRemoteUpdates(items,manifest){
 if(!Array.isArray(items))throw new Error('Inventory is not available.');
 if(!manifest||manifest.format!==FORMAT||!Array.isArray(manifest.updates))throw new Error('Private item update file is not valid.');
 let changed=false;
 for(const update of manifest.updates){
  if(!update||typeof update.id!=='string'||!update.id.trim()||!update.item||typeof update.item!=='object'||Array.isArray(update.item)||!String(update.item.name||'').trim())throw new Error('Private item update is missing required details.');
  const updatedAt=String(update.updatedAt||manifest.updatedAt||'1');
  const model=normalize(update.item.model);
  let item=items.find(x=>x&&x.syncKey===update.id);
  if(!item&&model)item=items.find(x=>x&&normalize(x.model)===model);
  if(item&&item.syncKey===update.id&&String(item.syncUpdatedAt||'')>=updatedAt)continue;
  if(update.item.manual&&!/^https:\/\//i.test(String(update.item.manual)))throw new Error('Manual links must use HTTPS.');
  const incoming=Object.fromEntries(Object.entries(update.item).filter(([key])=>ALLOWED_FIELDS.has(key)));
  if(item){
   for(const [key,value] of Object.entries(incoming)){
    if((value===''||value==null)&&item[key])continue;
    item[key]=value;
   }
   item.syncKey=update.id;
   item.syncUpdatedAt=updatedAt;
  }else{
   const nextId=Math.max(0,...items.map(x=>Number(x&&x.id)||0))+1;
   item={id:nextId,name:'',brand:'',category:'Other',model:'',serial:'',location:'',purchaseDate:'',notes:'',image:'',manualStored:false,manualName:'',favorite:false};
   Object.assign(item,incoming,{syncKey:update.id,syncUpdatedAt:updatedAt});
   items.push(item);
  }
  changed=true;
 }
 return changed;
}
function apiUrl(path){return 'https://www.googleapis.com/drive/v3/files'+path}
function uploadUrl(path){return 'https://www.googleapis.com/upload/drive/v3/files'+path}
async function listSyncFile(api){
 const q=encodeURIComponent("name = '"+FILE_NAME+"' and trashed = false");
 const response=await api(apiUrl('?fields=files(id,name)&pageSize=10&q='+q));
 const data=await response.json();
 return (data.files||[])[0]||null;
}
async function createSyncFile(api){
 const boundary='hecitemupdates'+Date.now();
 const metadata={name:FILE_NAME,mimeType:'application/json',parents:['root']};
 const initial={format:FORMAT,updatedAt:new Date().toISOString(),updates:[]};
 const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(initial)+'\r\n--'+boundary+'--';
 const response=await api(uploadUrl('?uploadType=multipart&fields=id,name'),{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
 const result=await response.json();
 if(!result.id)throw new Error('Google Drive did not create the private sync file.');
 return result;
}
function setStatus(node,message,isError=false){
 if(!node)return;
 node.textContent=message;
 node.style.color=isError?'#a52a2a':'#146c36';
 node.setAttribute('role','status');
 node.setAttribute('aria-live','polite');
}
function makePanel(){
 const drive=root.document&&root.document.getElementById('drive-backup');
 if(!drive||root.document.getElementById('hec-private-item-sync'))return;
 const panel=root.document.createElement('div');
 panel.id='hec-private-item-sync';
 panel.style.cssText='margin-top:12px;padding-top:12px;border-top:1px solid #d8dce3';
 const title=root.document.createElement('strong');
 title.textContent='Private item sync';
 const note=root.document.createElement('p');
 note.style.cssText='font-size:13px;margin:6px 0';
 note.textContent='Keep item updates in your private Google Drive. HEC TECH checks for updates when it opens; your existing list is preserved.';
 const status=root.document.createElement('p');
 status.id='hec-private-item-sync-status';
 status.style.cssText='font-size:13px;margin:6px 0;min-height:18px';
 const button=root.document.createElement('button');
 button.type='button';
 button.id='hec-private-item-sync-button';
 button.textContent=localStorage.getItem(FILE_ID_KEY)?'Check for item updates':'Enable private item sync';
 button.addEventListener('click',async()=>{
  button.disabled=true;
  if(!localStorage.getItem(FILE_ID_KEY)){
   setStatus(status,'Opening Google Drive permission…');
   try{root.HECItemSyncBridge.reauthorize()}catch(error){setStatus(status,error.message||'Could not start Google Drive setup.',true);button.disabled=false}
   return;
  }
  try{await pull(true)}catch(error){setStatus(status,error.message||'Could not check for updates.',true)}
  button.disabled=false;
 });
 panel.append(title,note,status,button);
 drive.append(panel);
}
async function setupSync(){
 const bridge=root.HECItemSyncBridge;
 const status=root.document&&root.document.getElementById('hec-private-item-sync-status');
 const button=root.document&&root.document.getElementById('hec-private-item-sync-button');
 try{
  if(!bridge)throw new Error('Reload HEC TECH and try again.');
  await bridge.ensureAuthorized();
  let file=await listSyncFile(bridge.api);
  if(!file)file=await createSyncFile(bridge.api);
  localStorage.setItem(FILE_ID_KEY,file.id);
  setStatus(status,'Private item sync is ready.');
  if(button){button.textContent='Check for item updates';button.disabled=false}
  await pull(true);
  await bridge.backup();
 }catch(error){
  setStatus(status,error.message||'Private item sync could not be enabled.',true);
  if(button)button.disabled=false;
 }
}
async function pull(showStatus=false){
 const bridge=root.HECItemSyncBridge;
 if(!bridge||!bridge.hasSession())return false;
 const status=root.document&&root.document.getElementById('hec-private-item-sync-status');
 try{
  await bridge.ensureAuthorized(false);
  let fileId=localStorage.getItem(FILE_ID_KEY);
  if(!fileId){
   const file=await listSyncFile(bridge.api);
   if(!file)return false;
   fileId=file.id;
   localStorage.setItem(FILE_ID_KEY,fileId);
   const button=root.document.getElementById('hec-private-item-sync-button');
   if(button)button.textContent='Check for item updates';
  }
  const response=await bridge.api(apiUrl('/'+encodeURIComponent(fileId)+'?alt=media'));
  const manifest=await response.json();
  const changed=applyRemoteUpdates(bridge.getItems(),manifest);
  if(changed){
   if(!bridge.save())throw new Error('The item update could not be saved on this device.');
   bridge.render();
  }
  if(showStatus||changed)setStatus(status,changed?'Private item updates applied.':'Private item sync is up to date.');
  return changed;
 }catch(error){
  if(showStatus||/403|401|permission|scope/i.test(String(error.message||error)))setStatus(status,error.message||'Private item sync failed.',true);
  return false;
 }
}
function init(){
 makePanel();
 const pending=root.sessionStorage&&root.sessionStorage.getItem('hec-tech-drive-pending-action');
 if(pending==='item-sync'){
  root.sessionStorage.removeItem('hec-tech-drive-pending-action');
  root.setTimeout(setupSync,150);
 }
 if(root.HECItemSyncBridge&&root.HECItemSyncBridge.hasSession())root.setTimeout(()=>pull(false),350);
}
root.HECPrivateItemSyncPull=pull;
root.HECPrivateItemSyncSetup=setupSync;
if(typeof module!=='undefined'&&module.exports)module.exports={applyRemoteUpdates,FORMAT,FILE_NAME};
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init()}
})(typeof window!=='undefined'?window:globalThis);

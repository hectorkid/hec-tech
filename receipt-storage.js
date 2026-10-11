/* HEC TECH receipt attachments — private, offline IndexedDB storage. */
const HECReceiptStore=(()=>{
 const dbName='hec-tech-receipts-v1',storeName='receipts';
 function open(){
  return new Promise((resolve,reject)=>{
   if(!('indexedDB' in window))return reject(new Error('This browser does not support offline receipt storage.'));
   const request=indexedDB.open(dbName,1);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(storeName))request.result.createObjectStore(storeName)};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||new Error('Cannot open receipt storage'));
  });
 }
 async function run(mode,key,value){
  const db=await open();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(storeName,mode),store=tx.objectStore(storeName);
   const request=mode==='readonly'?store.get(String(key)):mode==='readwrite'&&value!==undefined?store.put(value,String(key)):store.delete(String(key));
   let result;
   request.onsuccess=()=>{result=request.result};
   tx.oncomplete=()=>{db.close();resolve(result)};
   tx.onerror=()=>{db.close();reject(tx.error||new Error('Receipt storage failed'))};
   tx.onabort=()=>{db.close();reject(tx.error||new Error('Receipt storage was canceled'))};
  });
 }
 return {put:(key,blob)=>run('readwrite',key,blob),get:key=>run('readonly',key),remove:key=>run('readwrite',key)};
})();

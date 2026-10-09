/* HEC TECH manual PDF storage — local offline copies, not cloud backup. */
const HECManualStore=(()=>{
 const dbName='hec-tech-manuals-v1',storeName='pdfs';
 function open(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(new Error('This browser does not support offline PDF storage.'));const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(storeName))r.result.createObjectStore(storeName)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Cannot open PDF storage'))})}
 async function run(mode,key,value){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,mode),store=tx.objectStore(storeName);const req=mode==='readonly'?store.get(key):store.put(value,key);let result;req.onsuccess=()=>{result=req.result};tx.oncomplete=()=>{db.close();resolve(result)};tx.onerror=()=>{db.close();reject(tx.error||new Error('PDF storage failed'))};tx.onabort=()=>{db.close();reject(tx.error||new Error('PDF storage aborted'))}})}
 return {put:(key,blob)=>run('readwrite',String(key),blob),get:key=>run('readonly',String(key))};
})();

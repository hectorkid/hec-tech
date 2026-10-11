const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

async function testIndexedDbStorage(){
 const stores=new Map();
 let upgraded=false;
 const db={
  objectStoreNames:{contains:name=>stores.has(name)},
  createObjectStore:name=>stores.set(name,new Map()),
  transaction(name,mode){
   const tx={objectStore(){
    const map=stores.get(name);
    const request=action=>{const result={};setTimeout(()=>{try{result.result=action();result.onsuccess&&result.onsuccess();tx.oncomplete&&tx.oncomplete()}catch(error){result.error=error;result.onerror&&result.onerror();tx.onerror&&tx.onerror()}},0);return result};
    return {
     get:key=>request(()=>map.get(String(key))),
     put:(value,key)=>request(()=>map.set(String(key),value)),
     delete:key=>request(()=>map.delete(String(key)))
    };
   }};
   return tx;
  }
 };
 const indexedDB={open(){const request={};setTimeout(()=>{request.result=db;if(!upgraded){upgraded=true;request.onupgradeneeded&&request.onupgradeneeded()}request.onsuccess&&request.onsuccess()},0);return request}};
 const context={window:{},indexedDB,Error,setTimeout};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync('receipt-storage.js','utf8'),context,{filename:'receipt-storage.js'});
 const store=vm.runInContext('HECReceiptStore',context);
 const photo=new Blob(['offline-receipt-photo'],{type:'image/jpeg'});
 await store.put(42,photo);
 const restored=await store.get(42);
 assert.equal(await restored.text(),'offline-receipt-photo','receipt remains available after reopening the IndexedDB connection');
 assert.equal(restored.type,'image/jpeg','receipt MIME type remains available offline');
 await store.remove(42);
 assert.equal(await store.get(42),undefined,'receipt can be removed');
}

async function testDriveBackupRestore(){
 const saved=new Map(),remote=new Map();
 let nextId=1;
 const context={
  window:{},
  HECReceiptStore:{
   get:async key=>saved.get(String(key)),
   put:async(key,value)=>{saved.set(String(key),value)}
  },
  Blob,URL,URLSearchParams,encodeURIComponent,Error
 };
 vm.createContext(context);
 for(const file of ['drive-receipt-helpers.js','drive-receipt-upload.js','drive-receipt-restore.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
 }
 const request=async(url,options)=>{
  if(url.includes('/upload/drive/v3/files')){
   const text=await options.body.text();
   const name=text.match(/"name":"([^"]+)"/)?.[1];
   assert.ok(name&&name.startsWith('hec-tech-receipt-'),'Drive receipt has a stable item-specific name');
   assert.match(text,/Content-Type: (?:image\/jpeg|application\/pdf)/,'receipt MIME type is included');
   const marker=text.includes('receipt-photo-payload')?'receipt-photo-payload':'%PDF-1.4 receipt-payload';
   assert.ok(text.includes(marker),'uploaded Drive body contains the receipt bytes');
   const id=decodeURIComponent(url.match(/\/files\/([^?]+)/)?.[1]||String(nextId++));
   remote.set(id,{name,blob:new Blob([marker],{type:name.endsWith('42')?'image/jpeg':'application/pdf'})});
   return {json:async()=>({id})};
  }
  if(url.includes('alt=media')){
   const id=decodeURIComponent(url.match(/\/files\/([^?]+)/)?.[1]);
   const file=remote.get(id);
   if(!file)throw new Error('Missing remote receipt');
   return {blob:async()=>file.blob};
  }
  if(url.includes('/drive/v3/files?')){
   const query=new URL(url).searchParams.get('q');
   const name=query.match(/name = '([^']+)'/)?.[1];
   return {json:async()=>({files:[...remote.entries()].filter(([,file])=>file.name===name).map(([id])=>({id}))})};
  }
  throw new Error('Unexpected request '+url);
 };
 const photoItem={id:42,name:'Milwaukee Sander',receiptStored:true,receiptName:'receipt.jpg',receiptMimeType:'image/jpeg'};
 saved.set('42',new Blob(['receipt-photo-payload'],{type:'image/jpeg'}));
 await context.window.HECReceiptDriveUpload(photoItem,request);
 assert.equal(remote.size,1,'photo receipt uploaded once');
 await context.window.HECReceiptDriveUpload(photoItem,request);
 assert.equal(remote.size,1,'repeat backup updates the same Drive receipt');
 saved.delete('42');
 await context.window.HECReceiptDriveRestore(photoItem,request);
 assert.equal(await (await saved.get('42')).text(),'receipt-photo-payload','photo receipt restored from Drive');

 const pdfItem={id:19,name:'Tool',receiptStored:true,receiptName:'receipt.pdf',receiptMimeType:'application/pdf'};
 saved.set('19',new Blob(['%PDF-1.4 receipt-payload'],{type:'application/pdf'}));
 await context.window.HECReceiptDriveUpload(pdfItem,request);
 saved.delete('19');
 await context.window.HECReceiptDriveRestore(pdfItem,request);
 assert.equal((await saved.get('19')).type,'application/pdf','PDF receipt restored with its content type');
 await assert.rejects(context.window.HECReceiptDriveRestore({id:999,name:'Missing'},request),/No Drive receipt found/);
}

(async()=>{
 await testIndexedDbStorage();
 await testDriveBackupRestore();
 console.log('Receipt offline storage and Drive backup/restore tests passed');
})().catch(error=>{console.error(error);process.exitCode=1});

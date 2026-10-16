const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function run(){
 const html=fs.readFileSync('index.html','utf8');const source=html.slice(html.indexOf('async function download(){'),html.indexOf('function queueAutoBackup(){'));
 for(const envelope of [false,true])for(const failure of ['none','receipt','save']){
  const original=[{id:1,name:'Original',images:['photo-old']}];const incoming=[{id:1,name:'Restored',images:['photo-new'],manualStored:true,receiptStored:true},{id:2,name:'New',manualStored:true}];
  const manuals=new Map([['1','old-pdf']]),receipts=new Map([['1','old-receipt']]);
  const store=map=>({get:async id=>map.get(String(id)),put:async(id,value)=>map.set(String(id),value),remove:async id=>map.delete(String(id))});
  const pdfStore=store(manuals),receiptStore=store(receipts);let renders=0;
  const categoryStorage=new Map([['categories',JSON.stringify({names:['Other'],removed:[]})]]);
  const context={localStorage:{getItem:key=>categoryStorage.get(key)||null,setItem:(key,value)=>categoryStorage.set(key,value),removeItem:key=>categoryStorage.delete(key)},items:original,filter:'All',window:{HECConfirm:async()=>true,HECPdfDriveRestore:async tool=>pdfStore.put(tool.id,'new-pdf'),HECReceiptDriveRestore:async tool=>{await receiptStore.put(tool.id,'new-receipt');if(failure==='receipt')throw Error('Download failed')}},HECManualStore:pdfStore,HECReceiptStore:receiptStore,status(){},ensureAuthorized:async()=>{},findFile:async()=>1,api:async()=>({json:async()=>envelope?{format:'hec-tech-drive-v2',items:incoming,categories:{names:['Other','Custom'],removed:[]}}:incoming}),encodeURIComponent,save:()=>failure!=='save',render(){renders++},Error};
  if(envelope)context.window.HECCategories={storageKey:'categories',validate:data=>data};
  vm.runInNewContext(source,context);
  if(failure==='none'){await context.download();if(envelope)assert.ok(JSON.parse(categoryStorage.get('categories')).names.includes('Custom'));assert.equal(context.items[0].images[0],'photo-new');assert.equal(manuals.get('2'),'new-pdf');assert.equal(receipts.get('1'),'new-receipt');assert.equal(renders,1)}
  else{await assert.rejects(context.download(),/preserved/);if(envelope)assert.ok(!JSON.parse(categoryStorage.get('categories')).names.includes('Custom'));assert.equal(context.items,original);assert.equal(manuals.get('1'),'old-pdf');assert.equal(manuals.has('2'),false);assert.equal(receipts.get('1'),'old-receipt');assert.equal(renders,0)}
 }
 console.log('Drive restore success, partial attachment failure and quota rollback passed');
}
run().catch(e=>{console.error(e);process.exitCode=1});

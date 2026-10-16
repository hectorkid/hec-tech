const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function run(){
 const source=fs.readFileSync('portable-backup.js','utf8').replace('  function setup(){','  window.testImport=importComplete;\n  function setup(){');
 const photo='data:image/jpeg;base64,cGhvdG8=';
 for(const failure of ['none','save','receipt']){
  const oldPDF=new Blob(['%PDF-old'],{type:'application/pdf'}),oldReceipt=new Blob(['old receipt'],{type:'image/png'});
  const manuals=new Map([['1',oldPDF]]),receipts=new Map([['1',oldReceipt]]);let failOnce=failure==='receipt',shared;
  const status={style:{}};
  const items=[{id:1,name:'Old item',images:[photo],image:photo,manualStored:true,receiptStored:true}];
  const store=(map,receipt=false)=>({get:async id=>map.get(String(id)),put:async(id,blob)=>{if(receipt&&failOnce){failOnce=false;throw Error('Simulated attachment failure')}map.set(String(id),blob)},remove:async id=>map.delete(String(id))});
  const context={window:{HECConfirm:async()=>true},items,filter:'All',Blob,File,fetch,URL,FileReader:class{readAsDataURL(blob){blob.arrayBuffer().then(bytes=>{this.result='data:'+blob.type+';base64,'+Buffer.from(bytes).toString('base64');this.onload()})}},navigator:{canShare:()=>true,share:async({files})=>{shared=files[0]}},document:{readyState:'loading',addEventListener(){},getElementById:()=>status},HECManualStore:store(manuals),HECReceiptStore:store(receipts,true),save:()=>failure!=='save',render(){},setTimeout};
  vm.runInNewContext(source,context);
  await context.window.HECExportCompleteBackup();const backup=JSON.parse(await shared.text());assert.equal(backup.items[0].images[0],photo);assert.ok(backup.manuals['1']);assert.ok(backup.receipts['1']);
  backup.items[0].name='Restored item';backup.manuals['1']='data:application/pdf;base64,JVBERi1uZXc=';backup.receipts['1']='data:image/png;base64,bmV3';
  await context.window.testImport({files:[{text:async()=>JSON.stringify(backup)}],value:'selected'});
  if(failure==='none'){assert.equal(context.items[0].name,'Restored item');assert.equal(context.items[0].images[0],photo);assert.equal(await manuals.get('1').text(),'%PDF-new');assert.equal(await receipts.get('1').text(),'new')}
  else{assert.equal(context.items[0].name,'Old item');assert.equal(await manuals.get('1').text(),'%PDF-old');assert.equal(await receipts.get('1').text(),'old receipt');assert.match(status.textContent,/preserved/)}
 }
 console.log('Complete backup round trip and attachment/inventory rollback checks passed');
}
run().catch(e=>{console.error(e);process.exitCode=1});

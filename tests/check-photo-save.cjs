const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function run(){
 const html=fs.readFileSync('index.html','utf8');const edit=html.slice(html.indexOf('function edit(id)'));
 const a=edit.indexOf('async e=>{'),b=edit.indexOf(";document.getElementById('modal').showModal()",a);
 const handler=edit.slice(a,b);
 for(const succeeds of [true,false]){
  const x={id:1,name:'Original',image:'old',images:['old']};let writes=0;
  const form={__hecPreparedPhotos:['old','new1','new2']};
  const context={x,id:1,items:[x],Object,FormData:class{get(k){return k==='name'?'Updated':''}},document:{getElementById:id=>id==='photo'?{files:[{}]}:{close(){}}},save(){writes++;return succeeds},render(){},Image:class{constructor(){throw Error('Photo was decoded twice')}},setTimeout};
  const submit=vm.runInNewContext('('+handler+')',context);await submit({preventDefault(){},target:form});
  assert.equal(writes,1,'Item and photos use one inventory save');assert.equal(x.name,succeeds?'Updated':'Original');assert.equal(x.images.length,succeeds?3:1);assert.equal(x.image,'old');
 }
 const source=fs.readFileSync('hec-multi-photos.js','utf8');const block=source.slice(source.indexOf('function enhanceEdit('),source.indexOf('function enhanceCards('));
 let compressions=0,submits=0;
 const input={files:[{},{}],insertAdjacentHTML(){}};const button={};
 const form={querySelectorAll:()=>[button],onsubmit:async()=>{submits++;assert.equal(form.__hecPreparedPhotos.length,3)}};
 const context={document:{getElementById:id=>id==='photo'?input:form},photos:x=>x.images,getItem:()=>({images:['old']}),compress:async()=>{compressions++;return 'new'},alert:message=>{throw Error(message)}};
 vm.runInNewContext(block+';enhanceEdit(1)',context);
 const event={preventDefault(){},stopImmediatePropagation(){}};await Promise.all([form.onsubmit(event),form.onsubmit(event)]);
 assert.equal(submits,1);assert.equal(compressions,2);assert.equal(form.__hecPreparedPhotos,undefined);assert.equal(button.disabled,false);
 console.log('Photo atomic save, quota rollback, single compression and double-submit checks passed');
}
run().catch(e=>{console.error(e);process.exitCode=1});

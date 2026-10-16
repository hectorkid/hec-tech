const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('hec-categories.js','utf8');
const storage=new Map();let succeeds=true;
const inventory=[{id:1,name:'Milwaukee M18 Cut-Out Tool',category:'Cut-out tool'},{id:2,name:'Claw hammer',category:'Hand Tools'},{id:3,name:'Cordless drill',category:'Power Tools',archived:true}];
function load(){const context={window:{dispatchEvent(){}},document:{readyState:'loading',addEventListener(){}},items:inventory,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},save:()=>succeeds,alert(){},Event,setTimeout};vm.runInNewContext(source,context);return context.window.HECCategories}
let api=load();assert.equal(api.classify(inventory[0]),'Power Tools');
assert.equal(api.create('Batteries'),'Batteries');assert.ok(api.names().includes('Batteries'));assert.throws(()=>api.create('batteries'),/already/);
assert.equal(api.rename('Power Tools','Powered Gear'),true);assert.equal(inventory[0].category,'Powered Gear');assert.equal(inventory[2].category,'Powered Gear','Archived items move too');
api=load();assert.ok(api.names().includes('Powered Gear'));assert.equal(api.classify(inventory[0]),'Powered Gear');
assert.equal(api.remove('Powered Gear','Batteries'),true);assert.equal(inventory.length,3);assert.equal(inventory[0].category,'Batteries');assert.equal(inventory[2].category,'Batteries');assert.ok(!api.names().includes('Powered Gear'));
assert.throws(()=>api.remove('Other','Hand Tools'),/Other/);
const before=JSON.stringify(inventory),catalog=JSON.stringify(api.read());succeeds=false;assert.equal(api.rename('Batteries','Failed'),false);assert.equal(JSON.stringify(inventory),before);assert.equal(JSON.stringify(api.read()),catalog);
assert.throws(()=>api.validate({names:[null],removed:[]}),/Invalid/);
console.log('Category creation, reload, rename, safe deletion, archive reassignment and failed-save rollback passed');

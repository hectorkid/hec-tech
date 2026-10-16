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
// Edit dropdown actions preserve the original form nodes and selected files.
{
 let available=['Power Tools','Hand Tools','Other'],back,dropdown;
 function node(){return {children:[],hidden:false,append(...xs){this.children.push(...xs)},replaceChildren(...xs){this.children=xs},setAttribute(){},insertAdjacentElement(){},focus(){this.focused=true},querySelector(){return {focus(){}}}}}
 const nameField={value:'Unsaved edited name'},photoField={files:[{name:'unsaved.jpg'}]};
 const form=Object.assign(node(),{dataset:{}}),area={childNodes:[form],scrollTop:123,replaceChildren(...xs){this.childNodes=xs}};
 const input={value:'Power Tools',tagName:'INPUT',replaceWith(value){dropdown=value}};
 form.elements={namedItem:key=>({category:input,name:nameField,photo:photoField}[key])};
 const sourceForm=source.slice(source.indexOf('function mountForm('),source.indexOf('function manage('));
 const context={document:{getElementById:id=>id==='toolForm'?form:area,createElement:node},select:value=>Object.assign(node(),{value}),classify:item=>item.category,names:()=>available,inventory:()=>[],createControls:()=>node(),manage:callback=>{back=callback;area.childNodes=[]}};
 vm.runInNewContext(sourceForm+';mountForm(null)',context);
 assert.ok(dropdown.children.some(x=>x.value==='__new'));assert.ok(dropdown.children.some(x=>x.value==='__manage'));
 dropdown.value='__manage';dropdown.onchange();assert.equal(dropdown.value,'Power Tools');assert.equal(typeof back,'function');available.push('Custom');back();
 assert.equal(area.childNodes[0],form);assert.equal(nameField.value,'Unsaved edited name');assert.equal(photoField.files[0].name,'unsaved.jpg');assert.equal(area.scrollTop,123);assert.ok(dropdown.children.some(x=>x.value==='Custom'));
 dropdown.value='__new';dropdown.onchange();assert.equal(dropdown.value,'Power Tools','Action options must never become item categories');
 console.log('Edit dropdown add/manage actions preserve draft fields and selected photos');
}

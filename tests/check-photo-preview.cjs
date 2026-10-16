const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let observe;const made=[],revoked=[];
function element(){const e={dataset:{},children:[],style:{},listeners:{},hidden:false,append(...xs){this.children.push(...xs)},replaceChildren(){this.children=[]},setAttribute(){},addEventListener(n,f){this.listeners[n]=f},insertAdjacentElement(_,x){this.panel=x}};made.push(e);return e}
const input=element();input.isConnected=true;input.files=[];
Object.defineProperty(input,'value',{set(v){if(v==='')this.files=[]}});
const area={querySelector:s=>s==='#photo'&&input.isConnected?input:null};
const document={readyState:'complete',querySelector:()=>({}),getElementById:()=>area,createElement:element};
vm.runInNewContext(fs.readFileSync('hec-photo-options.js','utf8'),{window:{},document,URL:{createObjectURL:f=>'blob:'+f.name,revokeObjectURL:url=>revoked.push(url)},MutationObserver:class{constructor(f){observe=f}observe(){}}});
input.files=[{name:'front.jpg'},{name:'back.jpg'}];input.listeners.change();
const [status,gallery,clear]=input.panel.children;
assert.equal(input.panel.hidden,false);assert.equal(gallery.children.length,2);assert.match(status.textContent,/2 photos selected/);
clear.onclick();assert.equal(input.files.length,0);assert.equal(input.panel.hidden,true);assert.equal(revoked.length,2);
input.files=[{name:'new.jpg'}];input.listeners.change();input.isConnected=false;observe();assert.ok(revoked.includes('blob:new.jpg'),'Closing the form releases preview image resources');
console.log('Photo preview, clear selection and resource cleanup passed');

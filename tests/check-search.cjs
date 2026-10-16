const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');const start=html.indexOf('let hecSearchTimer=');const end=html.indexOf('render();</script>',start);
let renders=0,next=0;const timers=new Map(),handlers={};
const input={value:'',addEventListener(n,f){handlers[n]=f},blur(){},scrollIntoView(){}};
const context={q:'',document:{getElementById:()=>input},render(){renders++},clearTimeout:id=>timers.delete(id),setTimeout:f=>{timers.set(++next,f);return next}};
vm.runInNewContext(html.slice(start,end),context);
const flush=()=>{const pending=[...timers.values()];timers.clear();pending.forEach(f=>f())};
for(const value of ['M','Mi','Mil','Milw','Milwa','Milwaukee']){input.value=value;input.oninput()}
assert.equal(renders,0);assert.equal(timers.size,1);flush();assert.equal(renders,1);assert.equal(context.q,'milwaukee');
input.value='sander';input.oninput();handlers.keydown({key:'Enter',currentTarget:input,preventDefault(){}});assert.equal(renders,2);flush();assert.equal(renders,2,'Enter must cancel the delayed duplicate redraw');
input.value='';input.oninput();assert.equal(renders,3);assert.equal(context.q,'','Clearing search applies immediately');
handlers.compositionstart();input.value='test';input.oninput();assert.equal(timers.size,0);handlers.keydown({key:'Enter',isComposing:true});assert.equal(renders,3);
handlers.compositionend();flush();assert.equal(renders,4);assert.equal(context.q,'test');
console.log('Search batching, immediate Enter/clear and composed input passed');

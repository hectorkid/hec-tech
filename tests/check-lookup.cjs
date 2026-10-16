const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function check(){
 let observe,resolveFetch,calls=0;
 function element(){return {dataset:{},style:{},isConnected:true,disabled:false,listeners:{},children:[],value:'Milwaukee 2648-20',addEventListener(n,f){this.listeners[n]=f},setAttribute(){},insertAdjacentElement(){},replaceChildren(...children){this.children=children;this.textContent=''},append(x){this.children.push(x)}}}
 const search=element(),input=element(),results=element(),area=element();
 area.querySelector=s=>({'#hec-model-search':search,'#hec-model-query':input,'#hec-lookup-results':results}[s]);
 const document={readyState:'complete',getElementById:()=>area,createElement:element};
 vm.runInNewContext(fs.readFileSync('hec-product-lookup.js','utf8'),{document,window:{},MutationObserver:class{constructor(f){observe=f}observe(){}},AbortController,setTimeout,clearTimeout,fetch:()=>{calls++;return new Promise(r=>resolveFetch=r)}});
 observe();
 search.click=()=>search.listeners.click({stopImmediatePropagation(){},preventDefault(){}});
 const pending=search.click();assert.equal(search.disabled,true);
 input.value='Honeywell CF200D1625';input.listeners.input();assert.equal(search.disabled,false);
 resolveFetch({ok:true,json:async()=>({matches:[{title:'Old sander'}]})});await pending;
 assert.equal(results.children.length,0,'A previous query must never render after the query changes');
 input.listeners.keydown({key:'Enter',preventDefault(){}});assert.equal(calls,2,'Enter starts a model lookup');
 resolveFetch({ok:true,json:async()=>({matches:[]})});
 await new Promise(r=>setTimeout(r,0));
 assert.match(results.textContent,/No confident exact-model/);
 console.log('Lookup query cancellation and keyboard behavior passed');
}
check().catch(e=>{console.error(e);process.exitCode=1});

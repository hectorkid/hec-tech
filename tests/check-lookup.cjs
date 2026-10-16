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

// Exercise the actual autofill rules with ambiguous product titles.
{
 const source=fs.readFileSync('hec-product-lookup.js','utf8');
 const brandRules=source.slice(source.indexOf(' const brandCandidates='),source.indexOf(' const set='));
 const brand=title=>vm.runInNewContext(brandRules+';brand',{title});
 assert.equal(brand('Generic battery charger'),'');
 assert.equal(brand('GE refrigerator'),'GE');
 assert.equal(brand('LG OLED television'),'LG');
 assert.equal(brand('BLACK+DECKER drill'),'Black+Decker');
 const rules=source.slice(source.indexOf(' if(/\\b(?:wi'),source.indexOf(" set('model'"));
 const category=title=>{let result='Other';vm.runInNewContext(rules,{title,set:(key,value)=>{result=value}});return result};
 for(const title of ['Wireless Router','Wi-Fi Router','Router Modem','Ethernet Network Router'])assert.equal(category(title),'Electronics',title);
 assert.equal(category('Woodworking Router'),'Power Tools');
 assert.equal(category('Milwaukee Random Orbit Sander'),'Power Tools');
 console.log('Brand and category ambiguity checks passed');
}

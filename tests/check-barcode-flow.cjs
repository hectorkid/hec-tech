const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function check(){
 const created=[],requests=[];let observer;
 const form={dataset:{},isConnected:true};
 function element(){const e={dataset:{},style:{},listeners:{},value:'',children:[],textContent:'',setAttribute(){},addEventListener(n,f){this.listeners[n]=f},dispatchEvent(e){this.listeners[e.type]?.()},insertAdjacentElement(){},append(x){this.children.push(x)},replaceChildren(...xs){this.children=xs},scrollIntoView(){this.scrolled=true}};created.push(e);return e}
 const barcode=element(),name=element(),brand=element();
 form.elements={namedItem:n=>({barcode,name,brand}[n])};
 form.querySelector=()=>created.find(x=>x.dataset.hecBarcodeLookup);
 const area={querySelector:()=>form};
 const document={readyState:'complete',getElementById:()=>area,createElement:element};
 const window={};
 vm.runInNewContext(fs.readFileSync('hec-barcode-lookup.js','utf8'),{document,window,items:[],Event,AbortController,AbortSignal,setTimeout,clearTimeout,MutationObserver:class{constructor(f){observer=f}observe(){}},fetch:async url=>{requests.push(url);return {ok:true,json:async()=>({status:1,code:'012345678905',product:{code:'012345678905',product_name:'Scanned product',brands:'Example'}})}}});
 await window.HECLookupScannedBarcode('012345678905');
 assert.equal(requests.length,1,'Scan must automatically start product lookup');
 assert.equal(barcode.value,'012345678905');assert.equal(name.value,'','Details require confirmation');
 const choice=created.find(x=>x.children.some(y=>String(y.textContent).includes('Scanned product')));
 assert.ok(choice,'A selectable product result must appear');choice.onclick();
 assert.equal(name.value,'Scanned product');assert.equal(brand.value,'Example');
 const html=fs.readFileSync('index.html','utf8');
 assert.equal((html.match(/if\(!isUrl\)hecLookupBarcode\(raw\)/g)||[]).length,2,'Camera and photo scans must both use direct lookup');
 console.log('Scanned barcode starts lookup and requires product confirmation');
}
check().catch(e=>{console.error(e);process.exitCode=1});

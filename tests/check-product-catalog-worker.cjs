const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const source=fs.readFileSync('cloudflare/product-lookup-worker.js','utf8').replace('export default {','globalThis.worker = {');
const context={Response,URL,crypto:webcrypto};vm.runInNewContext(source,context);
const records=[];
const db={prepare(sql){
 return {bind(...values){
  return {
   all:async()=>{
    if(sql.includes('WHERE barcode = ?'))return {results:records.filter(x=>x.barcode===values[0])};
    if(sql.includes('WHERE brand_key = ?'))return {results:records.filter(x=>x.brand_key===values[0]&&x.model_key===values[1])};
    if(sql.includes('model_key = ? OR'))return {results:records.filter(x=>x.model_key===values[0]||x.model_key.startsWith(values[1])||x.name_key.includes(values[2].replace(/%/g,''))||x.search_key.includes(values[3].replace(/%/g,'')))};
    return {results:[]};
   },
   run:async()=>{
    if(sql.startsWith('INSERT'))records.push({id:values[0],name:values[1],brand:values[2],model:values[3],barcode:values[4],category:values[5],product_url:values[6],photo_url:values[7],manual_url:values[8],brand_key:values[9],model_key:values[10],name_key:values[11],search_key:values[12]});
    return {success:true};
   }
  };
 }
}}};
const env={PRODUCT_CATALOG:db,CATALOG_WRITE_TOKEN:'test-secret'};
const request=(url,options={})=>new Request('https://worker.test/product-lookup'+url,{...options,headers:{Origin:'https://hectorkid.github.io',...(options.headers||{})}});
async function check(){
 let res=await context.worker.fetch(request('',{method:'POST',headers:{Authorization:'Bearer test-secret','Content-Type':'application/json'},body:JSON.stringify({name:'Milwaukee M18 Drill',brand:'Milwaukee',model:'2904-20',barcode:'012345678905',category:'Power Tools',productUrl:'https://example.com/product',photoUrl:'https://example.com/photo.jpg',manualUrl:'https://example.com/manual.pdf'})}),env);
 assert.equal(res.status,201);assert.equal((await res.json()).action,'created');
 res=await context.worker.fetch(request('?barcode=012345678905'),env);
 let data=await res.json();assert.equal(res.status,200);assert.equal(data.matches[0].name,'Milwaukee M18 Drill');assert.equal(data.matchStatus,'verified-catalog-barcode');
 res=await context.worker.fetch(request('?model=Milwaukee%202904-20'),env);
 data=await res.json();assert.equal(data.matches[0].model,'2904-20');
 res=await context.worker.fetch(request('',{method:'POST',headers:{Authorization:'Bearer test-secret','Content-Type':'application/json'},body:JSON.stringify({name:'Leak',model:'A-1',serial:'private'})}),env);
 assert.equal(res.status,400,'private inventory fields must be rejected');
 res=await context.worker.fetch(request('?barcode=12'),env);assert.equal(res.status,400);
 assert.match(source,/FROM products/);assert.doesNotMatch(source,/SERPAPI|serpapi/);
 console.log('D1 product catalog lookup, validation, and privacy allowlist passed');
}
check().catch(e=>{console.error(e);process.exitCode=1});

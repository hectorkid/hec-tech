// HEC TECH product lookup Cloudflare Worker. Automated deployment via GitHub Actions. Deploy separately and set SERPAPI_KEY secret.
// Never put the secret in the public GitHub Pages frontend.
export default {
 async fetch(request, env) {
  const origin=request.headers.get('Origin')||'';
  const allowed=origin==='https://hectorkid.github.io';
  const headers={'Access-Control-Allow-Origin':allowed?origin:'https://hectorkid.github.io','Vary':'Origin','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Content-Type':'application/json','Cache-Control':'no-store'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!allowed)return new Response(JSON.stringify({error:'Origin not allowed'}),{status:403,headers});
  const url=new URL(request.url);
  if(url.pathname!=='/product-lookup'||request.method!=='GET')return new Response(JSON.stringify({error:'Not found'}),{status:404,headers});
  const model=(url.searchParams.get('model')||'').trim().slice(0,100);
  if(model.length<3)return new Response(JSON.stringify({error:'Enter a model number'}),{status:400,headers});
  if(!env.SERPAPI_KEY)return new Response(JSON.stringify({error:'Product lookup is not configured yet'}),{status:503,headers});
  try{
   const search=new URL('https://serpapi.com/search.json');
   search.searchParams.set('engine','google_shopping');search.searchParams.set('q',model+' original manufacturer genuine -replacement -compatible -AIRx');search.searchParams.set('api_key',env.SERPAPI_KEY);search.searchParams.set('gl','us');search.searchParams.set('hl','en');
   const response=await fetch(search.toString(),{signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('Product search temporarily unavailable');
   const data=await response.json();
   const modelToken=(model.match(/[a-z]+[0-9][a-z0-9-]{3,}/i)||[model])[0].toLowerCase();
   const matches=(data.shopping_results||[]).filter(x=>{
    const title=String(x.title||'').toLowerCase();
    return title.includes(modelToken)&&!/replacement|compatible|fits |by airx|by filterbuy|aftermarket/i.test(title);
   }).slice(0,8).map(x=>({title:String(x.title||''),source:String(x.source||''),link:String(x.product_link||x.link||''),thumbnail:String(x.thumbnail||''),price:String(x.price||'')}));
   
   return new Response(JSON.stringify({query:model,matches}),{headers});
  }catch(e){return new Response(JSON.stringify({error:'Product search unavailable. Try again shortly.'}),{status:502,headers})}
 }
};
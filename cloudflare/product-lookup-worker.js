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
   search.searchParams.set('engine','google_shopping');search.searchParams.set('q',model+' tool product');search.searchParams.set('api_key',env.SERPAPI_KEY);search.searchParams.set('gl','us');search.searchParams.set('hl','en');
   const response=await fetch(search.toString(),{signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('Product search temporarily unavailable');
   const data=await response.json();
   // Extract model codes like 2648-20, CF200D1625, or DCD771C2.
   const tokens=model.match(/\b(?=[a-z0-9-]*\d)[a-z0-9]+(?:-[a-z0-9]+)*\b/gi)||[];
   const modelToken=(tokens.sort((a,b)=>b.length-a.length)[0]||model).toLowerCase();
   const requestedBrand=(model.match(/milwaukee|honeywell|dewalt|makita|bosch|ryobi|craftsman|panasonic|samsung|lg|sony|ridgid|husky|dremel/i)||[])[0]||'';
   const excluded=/replacement|compatible|fits |aftermarket|for use with|sanding discs?|sandpaper|dust bags?|parts? only|battery only/i;
   const ranked=(data.shopping_results||[]).filter(x=>x.title).map(x=>{
    const title=String(x.title);
    const lower=title.toLowerCase();
    const exactModel=lower.includes(modelToken);
    const brandMatch=!requestedBrand||lower.includes(requestedBrand.toLowerCase());
    const accessory=excluded.test(title);
    return {title,source:String(x.source||''),link:String(x.product_link||x.link||''),thumbnail:String(x.thumbnail||''),price:String(x.price||''),exactModel,brandMatch,accessory};
   });
   const matches=ranked.filter(x=>x.exactModel&&x.brandMatch&&!x.accessory).slice(0,8).map(({exactModel,brandMatch,accessory,...x})=>x);
      return new Response(JSON.stringify({query:model,matches}),{headers});
  }catch(e){return new Response(JSON.stringify({error:'Product search unavailable. Try again shortly.'}),{status:502,headers})}
 }
};
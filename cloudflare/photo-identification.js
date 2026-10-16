// HEC TECH image recognition proxy: add to Cloudflare Worker after configuring a vision provider.
// This module intentionally returns an explicit unavailable status until a provider is configured.
// Never expose a vision API key in the public PWA.
export async function identifyPhoto(request, env) {
 const origin=request.headers.get('Origin')||'';
 const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'https://hectorkid.github.io','Vary':'Origin'};
 if(origin!=='https://hectorkid.github.io')return new Response(JSON.stringify({error:'Origin not allowed'}),{status:403,headers});
 if(!env.VISION_API_KEY)return new Response(JSON.stringify({error:'Photo identification is not configured yet. You can still attach your photo and enter details manually.'}),{status:503,headers});
 return new Response(JSON.stringify({error:'Vision provider integration is pending.'}),{status:501,headers});
}

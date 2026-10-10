/* HEC TECH: online-first navigation with offline fallback. */
const CACHE='hec-tech-v22';
const ASSETS=['./index.html','./manual-storage.js','./portable-backup.js','./drive-pdf-helpers.js','./drive-pdf-upload.js','./drive-pdf-restore.js','./install-guide.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hec-tech-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(new URL(request.url).pathname.endsWith('/portable-backup.js')){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok)await cache.put(request,response.clone());
    return response;
   }catch(error){
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    throw error;
   }
  })());
  return;
 }
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok)await cache.put('./index.html',response.clone());
    return response;
   }catch(error){
    const cached=await cache.match('./index.html');
    if(cached)return cached;
    throw error;
   }
  })());
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});

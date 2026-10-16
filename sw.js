/* HEC TECH: online-first navigation with offline fallback. */
const CACHE='hec-tech-v130';
const ASSETS=['./index.html','./private-item-sync.js?v=109','./manual-storage.js','./receipt-storage.js','./portable-backup.js','./drive-pdf-helpers.js','./drive-pdf-upload.js','./drive-pdf-restore.js','./drive-receipt-helpers.js','./drive-receipt-upload.js','./drive-receipt-restore.js','./install-guide.js','./hec-v3.css','./hec-v3.js','./hec-v3-header.jpg','./hec-header-redhot.jpg','./hec-header-yellow.jpg','./hec-header-ocean.jpg','./hec-header-forest.jpg','./hec-header-orange.jpg','./hec-header-lime.jpg','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hec-tech-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(/\/(portable-backup|hec-v3|welcome)\.(js|css)$/.test(new URL(request.url).pathname)){
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
   const url=new URL(request.url);
   const appURL=new URL('./index.html',self.location.href);
   const isApp=url.pathname===appURL.pathname||url.pathname===new URL('./',appURL).pathname;
   const cacheKey=isApp?appURL.href:request;
   try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok)await cache.put(cacheKey,response.clone());
    return response;
   }catch(error){
    const cached=await cache.match(cacheKey,{ignoreSearch:true});
    if(cached)return cached;
    throw error;
   }
  })());
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});


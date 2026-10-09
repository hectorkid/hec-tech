/* HEC TECH offline-first app shell: avoid network-dependent blank startup. */
const CACHE='hec-tech-v7';
const ASSETS=['./','./index.html','./manual-storage.js','./portable-backup.js','./drive-pdf-helpers.js','./drive-pdf-upload.js','./drive-pdf-restore.js','./install-guide.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hec-tech-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith(caches.open(CACHE).then(async cache=>{
   const cached=await cache.match('./index.html');
   if(cached)return cached;
   const response=await fetch(request);
   if(response.ok)await cache.put('./index.html',response.clone());
   return response;
  }));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});

const CACHE_PREFIX = 'phase60plus-pwa-';
const CACHE_NAME = CACHE_PREFIX + 'v5.9-1';
const APP_SHELL = ['./','./index.html','./data-v59.js','./modules-v59.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
 // Activate after the previous app closes, keeping HTML and scripts consistent.
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 // Versioned shell is served together; updates install into a new cache.
 event.respondWith(caches.open(CACHE_NAME).then(cache=>cache.match(event.request)).then(cached=>cached||fetch(event.request)).catch(()=>event.request.mode==='navigate'?caches.open(CACHE_NAME).then(cache=>cache.match('./index.html')):Response.error()));
});

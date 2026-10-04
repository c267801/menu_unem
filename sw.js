/* La Lista — funzionamento offline.
   Pagina e icona: prima la rete (così gli aggiornamenti arrivano subito),
   la copia salvata solo se manca la connessione.
   Font di Google: dalla copia salvata, se c'è. */
const CACHE = 'lalista-v1';
const CORE = ['./', './index.html', './apple-touch-icon.png'];

self.addEventListener('install', event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', event=>{
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);

  if(url.origin === self.location.origin){
    event.respondWith(
      fetch(req).then(res=>{
        if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); }
        return res;
      }).catch(()=>
        caches.match(req, {ignoreSearch:true})
          .then(hit=> hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
          .then(hit=> hit || Response.error())
      )
    );
    return;
  }

  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    event.respondWith(
      caches.match(req).then(hit=> hit || fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy));
        return res;
      }))
    );
  }
});

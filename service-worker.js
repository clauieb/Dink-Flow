// Dink Flow — offline app-shell cache.
//
// IMPORTANT:
// Bump CACHE_NAME whenever you publish a new version of index.html.
//
// HTML files use NETWORK-FIRST so visitors get the newest GitHub Pages
// version whenever they have internet access. If offline, the cached
// version is used.
//
// Other assets use CACHE-FIRST for fast offline loading.

var CACHE_NAME = 'dink-flow-cache-v2';

var CORE_ASSETS = [
'./',
'./index.html',
'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js',
'https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js'
];

/* ---------- INSTALL ---------- */

self.addEventListener('install', function(event){

event.waitUntil(

```
caches.open(CACHE_NAME)

  .then(function(cache){

    return Promise.all(
      CORE_ASSETS.map(function(url){

        return cache.add(url).catch(function(err){

          console.warn(
            'SW: failed to pre-cache',
            url,
            err
          );

        });

      })
    );

  })

  .then(function(){

    // Activate the new service worker immediately.
    return self.skipWaiting();

  })
```

);

});

/* ---------- ACTIVATE ---------- */

self.addEventListener('activate', function(event){

event.waitUntil(

```
caches.keys()

  .then(function(keys){

    return Promise.all(

      keys
        .filter(function(key){
          return key !== CACHE_NAME;
        })

        .map(function(key){

          console.log(
            'SW: deleting old cache',
            key
          );

          return caches.delete(key);

        })

    );

  })

  .then(function(){

    // Take control of all open pages immediately.
    return self.clients.claim();

  })
```

);

});

/* ---------- FETCH ---------- */

self.addEventListener('fetch', function(event){

var req = event.request;

if(req.method !== 'GET'){
return;
}

var url = new URL(req.url);

/*

* HTML / navigation requests:
*
* Try the network first so GitHub Pages changes appear quickly.
* If offline, use the cached version.
  */

if(
req.mode === 'navigate' ||
url.pathname.endsWith('/index.html') ||
url.pathname.endsWith('/')
){

```
event.respondWith(

  fetch(req)

    .then(function(response){

      if(
        response &&
        response.status === 200
      ){

        var copy=response.clone();

        caches.open(CACHE_NAME)
          .then(function(cache){
            cache.put(req,copy);
          });

      }

      return response;

    })

    .catch(function(){

      return caches.match(req)
        .then(function(cached){

          return cached ||
            caches.match('./index.html');

        });

    })

);

return;
```

}

/*

* Other GET requests:
*
* Cache-first for fast/offline loading.
  */

event.respondWith(

```
caches.match(req)

  .then(function(cached){

    var networkFetch=fetch(req)

      .then(function(response){

        if(
          response &&
          response.status === 200
        ){

          var copy=response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache){
              cache.put(req,copy);
            });

        }

        return response;

      })

      .catch(function(){

        return cached;

      });

    return cached || networkFetch;

  })
```

);

});

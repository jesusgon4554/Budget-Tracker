const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const iconSizes = ["72", "96", "128", "144", "152", "192", "384", "512"];
const FILES_TO_PRE_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];


// install
self.addEventListener("install", function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log("Your files were pre-cached successfully!");
        return cache.addAll(FILES_TO_PRE_CACHE);
      })
    );
  
    self.skipWaiting();
  });
  
  // activate
  self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });
  
  // fetch
  self.addEventListener("fetch", function(evt) {
    const {url} = evt.request;
    if (evt.request.url.includes("/api/")){
      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
    } 
      // respond from static cache, request is not for /api/*
      evt.respondWith(
       fetch(evt.request).catch(() => {
          return caches.match(evt.request).then(response => {
            if(response){
              return response;
            }else if(evt.request.headers.get("accept").includes("text/html")){
              return caches.match("/");
            }
          });
        })
      );
  });
  
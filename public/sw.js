// Service Worker для PWA
const CACHE_NAME = 'harmonix-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.svg',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Обработка запросов - НЕ кэшируем API запросы
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Пропускаем API запросы без кэширования
  if (
    url.hostname.includes('soundcloud.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('spotify.com') ||
    url.hostname.includes('music.yandex') ||
    url.hostname.includes('vk.com') ||
    url.hostname.includes('allorigins') ||
    url.hostname.includes('corsproxy') ||
    url.hostname === 'localhost' ||
    url.pathname.includes('/api/')
  ) {
    // Просто пропускаем запрос без кэширования
    return;
  }
  
  // Кэшируем только статические ресурсы
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

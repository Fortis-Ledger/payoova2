// Payoova Wallet Service Worker
const CACHE_NAME = 'payoova-v1.0.0';
const STATIC_CACHE = 'payoova-static-v1.0.0';
const DYNAMIC_CACHE = 'payoova-dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets as needed
];

// Assets to cache dynamically
const CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /\.(?:png|jpg|jpeg|svg|webp|gif)$/,
  /\.(?:js|css)$/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Remove old caches
            return cacheName.startsWith('payoova-') && 
                   cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control immediately
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip API calls (let them go through network)
  if (url.pathname.startsWith('/api/')) return;
  
  // Skip chrome-extension and other protocols
  if (!request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        console.log('[SW] Serving from cache:', request.url);
        return response;
      }
      
      // Network fallback
      return fetch(request)
        .then((response) => {
          // Don't cache opaque responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Check if we should cache this response
          const shouldCache = CACHE_PATTERNS.some(pattern => 
            pattern.test(request.url)
          );
          
          if (shouldCache) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              console.log('[SW] Caching dynamic asset:', request.url);
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch((error) => {
          console.log('[SW] Fetch failed:', error);
          
          // Return offline page for navigation requests
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          // Return cached version or throw error
          throw error;
        });
    })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'transaction-sync') {
    event.waitUntil(syncTransactions());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/shortcut-dashboard.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Payoova Wallet', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync transactions when back online
async function syncTransactions() {
  try {
    // Get pending transactions from IndexedDB
    const pendingTransactions = await getPendingTransactions();
    
    for (const transaction of pendingTransactions) {
      try {
        const response = await fetch('/api/wallet/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${transaction.token}`
          },
          body: JSON.stringify(transaction.data)
        });
        
        if (response.ok) {
          // Remove from pending queue
          await removePendingTransaction(transaction.id);
          console.log('[SW] Transaction synced:', transaction.id);
        }
      } catch (error) {
        console.log('[SW] Failed to sync transaction:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers (simplified)
async function getPendingTransactions() {
  // This would use IndexedDB to get pending transactions
  return [];
}

async function removePendingTransaction(id) {
  // This would remove the transaction from IndexedDB
  return Promise.resolve();
}

// Update check
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

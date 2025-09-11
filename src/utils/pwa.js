// PWA Service Worker Registration and Utilities

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('ServiceWorker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, prompt user to refresh
            showUpdateNotification();
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
};

export const showUpdateNotification = () => {
  // Create a custom notification for app updates
  const notification = document.createElement('div');
  notification.className = 'pwa-update-notification';
  notification.innerHTML = `
    <div class="fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">App Update Available</p>
          <p class="text-xs text-blue-100">Refresh to get the latest features</p>
        </div>
      </div>
      <div class="mt-3 flex space-x-2">
        <button onclick="refreshApp()" class="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs font-medium">
          Refresh
        </button>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium">
          Later
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 10000);
};

// Make refreshApp globally available
window.refreshApp = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
};

export const checkForAppUpdate = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.update();
    }
  }
};

// Install prompt handling
let deferredPrompt;

export const handleInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = event;
    // Show install button or banner
    showInstallBanner();
  });
};

export const showInstallBanner = () => {
  const banner = document.createElement('div');
  banner.className = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Install Payoova Wallet</p>
          <p class="text-sm text-blue-100">Get the full app experience</p>
        </div>
        <div class="flex space-x-2">
          <button onclick="installApp()" class="bg-white text-blue-600 px-4 py-2 rounded font-medium text-sm hover:bg-gray-100">
            Install
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-blue-100 hover:text-white px-2">
            ✕
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
  }, 30000);
};

// Make installApp globally available
window.installApp = async () => {
  if (deferredPrompt) {
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // Clear the saved prompt since it can't be used again
    deferredPrompt = null;
    
    // Remove banner
    const banner = document.querySelector('.pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }
};

// Push notification support
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showLocalNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options
    });
  }
};

// Offline status
export const handleOnlineOffline = () => {
  const updateOnlineStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    document.body.classList.toggle('offline', !navigator.onLine);
    
    if (!navigator.onLine) {
      showOfflineNotification();
    } else {
      hideOfflineNotification();
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
};

const showOfflineNotification = () => {
  let notification = document.querySelector('.offline-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'offline-notification fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm z-50';
    notification.innerHTML = '📵 You are offline. Some features may be limited.';
    document.body.appendChild(notification);
  }
};

const hideOfflineNotification = () => {
  const notification = document.querySelector('.offline-notification');
  if (notification) {
    notification.remove();
  }
};

/**
 * Minimal service worker to prevent 404 errors
 * This is a placeholder that can be expanded with actual caching functionality later
 */

// Install event - called when service worker is first installed
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - called when service worker takes control
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    // Take control of all pages immediately
    event.waitUntil(clients.claim());
});

// Fetch event - intercepts network requests (currently just passes through)
self.addEventListener('fetch', event => {
    // For now, just pass through all requests to the network
    // This can be enhanced later to add offline caching
    event.respondWith(fetch(event.request));
});


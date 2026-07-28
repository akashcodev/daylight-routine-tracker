// pwa-register.js
// Registers the service worker so the site can be installed and work offline.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => console.log('Service worker registered, scope:', reg.scope))
      .catch((err) => console.log('Service worker registration failed:', err));
  });
}

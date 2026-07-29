// pwa-register.js
// Improved SW registration: logs update lifecycle and requests the
// new service worker activate immediately (skipWaiting) so users get the
// latest content. It also reloads the page when the new SW takes control.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('[PWA] Service worker registered. Scope:', reg.scope);

        // If there's an updated worker already waiting, ask it to skip waiting
        if (reg.waiting) {
          console.log('[PWA] SW waiting — sending SKIP_WAITING');
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          console.log('[PWA] updatefound, state:', installing && installing.state);
          installing.addEventListener('statechange', () => {
            console.log('[PWA] installing statechange:', installing.state);
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available — ask the SW to activate immediately
              console.log('[PWA] New SW installed, asking to skip waiting');
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // When the new SW takes control, reload to load the fresh content
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] controllerchange — reloading to activate new SW');
          window.location.reload();
        });
      })
      .catch(err => console.log('[PWA] registration failed:', err));
  });
}

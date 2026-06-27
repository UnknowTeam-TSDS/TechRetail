/*
  Registro del Service Worker para habilitar la PWA (instalable + offline básico).
*/
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (error) {
      console.warn('No se pudo registrar el service worker:', error);
    });
  });
}

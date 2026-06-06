/* Service Worker do Firebase Cloud Messaging — recebe push com o app fechado.
 * Registrado automaticamente pelo getToken() no escopo /firebase-cloud-messaging-push-scope,
 * então NÃO conflita com o /sw.js (cache do PWA), que fica no escopo raiz. */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBo8Ps6EIwVrtRTa4lezJ_4TOuP3A6gzv0',
  authDomain: 'maestria-vendas.firebaseapp.com',
  projectId: 'maestria-vendas',
  storageBucket: 'maestria-vendas.firebasestorage.app',
  messagingSenderId: '631002275552',
  appId: '1:631002275552:web:f07042021dbf7a92463a85',
});

const messaging = firebase.messaging();

// Push recebido com o app em segundo plano / fechado
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const d = payload.data || {};
  self.registration.showNotification(n.title || d.title || 'GSS', {
    body: n.body || d.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: d.url || '/' },
    tag: d.tag || 'gss',
  });
});

// Clique na notificação → abre o app na rota certa
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});

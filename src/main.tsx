import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme before render (avoids flash)
const savedTheme = localStorage.getItem('gss_theme');
if (savedTheme === 'dark' || savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// Recupera de "chunk velho" após deploy: se o app ficou aberto e tenta carregar
// um pedaço (lazy, ex: aba Maestria) que mudou de nome, limpa cache + SW e
// recarrega 1x pra pegar o bundle novo (evita o app "travar" num bundle velho).
async function recoverFromStaleChunk() {
  if (sessionStorage.getItem('gss_chunk_reload')) return;
  sessionStorage.setItem('gss_chunk_reload', '1');
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
    await Promise.all(regs.map(r => r.unregister()));
  } catch { /* segue pro reload mesmo assim */ }
  window.location.reload();
}
window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); recoverFromStaleChunk(); });
window.addEventListener('unhandledrejection', (e) => {
  const reason = (e as PromiseRejectionEvent).reason;
  const msg = String((reason && (reason.message || reason)) || '');
  if (/dynamically imported module|module script failed|importing a module|Failed to fetch/i.test(msg)) recoverFromStaleChunk();
});
// Libera o flag depois de carregar ok, pra futuros deploys também se recuperarem.
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('gss_chunk_reload'), 5000));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed silently
    });
  });
}

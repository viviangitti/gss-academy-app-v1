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
// SÓ erro real de carregamento de chunk (não confundir com falha de API/fetch comum).
const CHUNK_ERR = /dynamically imported module|module script failed|importing a module script/i;
window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); recoverFromStaleChunk(); });
window.addEventListener('unhandledrejection', (e) => {
  const reason = (e as PromiseRejectionEvent).reason;
  const msg = String((reason && (reason.message || reason)) || '');
  if (CHUNK_ERR.test(msg)) recoverFromStaleChunk();
});
// Sem auto-limpar o flag: recarrega no MÁXIMO 1x por sessão — nunca entra em loop.
// (Um novo acesso/sessão reseta sozinho, então deploys futuros ainda se recuperam.)

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

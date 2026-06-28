import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: string; isChunk: boolean }

// Erro REAL de carregamento de chunk (deploy novo enquanto o app estava aberto).
// NÃO inclui "Failed to fetch" genérico (falha de API) — senão entra em loop.
const CHUNK_ERR = /dynamically imported module|module script failed|importing a module script|loading chunk|chunkloaderror/i;
const RELOAD_FLAG = 'gss_chunk_reload';

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '', isChunk: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || 'Erro desconhecido';
    return { hasError: true, error: msg, isChunk: CHUNK_ERR.test(msg) };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // Chunk velho após deploy → recarrega 1x por sessão pra pegar o bundle novo.
    // Guard por sessionStorage impede qualquer loop.
    if (CHUNK_ERR.test(error?.message || '') && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    }
  }

  // Reload "duro": limpa caches + service worker antes de recarregar (último recurso).
  hardReload = async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
      await Promise.all(regs.map(r => r.unregister()));
    } catch { /* segue pro reload mesmo assim */ }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Se for erro de chunk e o auto-reload já vai disparar, evita piscar a tela de erro.
      const recovering = this.state.isChunk && sessionStorage.getItem(RELOAD_FLAG) === '1';
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '24px',
          textAlign: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>{recovering ? '🔄' : '⚠️'}</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {recovering ? 'Atualizando o app…' : 'Algo deu errado'}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#666', maxWidth: 300, lineHeight: 1.5 }}>
            {recovering
              ? 'Saiu uma versão nova — recarregando pra você. Se demorar, toque no botão.'
              : 'Ocorreu um erro inesperado. Seus dados estão seguros — é só recarregar.'}
          </p>
          {!recovering && (
            <details style={{ fontSize: 12, color: '#999', maxWidth: 320, wordBreak: 'break-all' }}>
              <summary style={{ cursor: 'pointer' }}>Detalhes técnicos</summary>
              <p style={{ marginTop: 8, textAlign: 'left', padding: '8px', background: '#f5f5f5', borderRadius: 8 }}>
                {this.state.error}
              </p>
            </details>
          )}
          <button
            onClick={this.hardReload}
            style={{
              padding: '12px 24px', background: '#7c6af7', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Recarregar o app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

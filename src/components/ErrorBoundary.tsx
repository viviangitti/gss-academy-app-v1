import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message || 'Erro desconhecido' };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: '' });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '24px',
          textAlign: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Algo deu errado</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#666', maxWidth: 280, lineHeight: 1.5 }}>
            Ocorreu um erro inesperado. Seus dados estão seguros.
          </p>
          <details style={{ fontSize: 12, color: '#999', maxWidth: 320, wordBreak: 'break-all' }}>
            <summary style={{ cursor: 'pointer' }}>Detalhes técnicos</summary>
            <p style={{ marginTop: 8, textAlign: 'left', padding: '8px', background: '#f5f5f5', borderRadius: 8 }}>
              {this.state.error}
            </p>
          </details>
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 24px', background: '#7c6af7', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Voltar ao início
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

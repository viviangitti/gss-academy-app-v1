import { WifiOff } from 'lucide-react';
import './OfflineState.css';

interface Props {
  feature?: string; // ex: "o Coach de IA"
  subtitle?: string; // mensagem customizada (ex: erro de configuração)
}

export default function OfflineState({ feature = 'esta funcionalidade', subtitle }: Props) {
  return (
    <div className="offline-state">
      <div className="offline-icon">
        <WifiOff size={40} />
      </div>
      <h3>{subtitle ? 'Indisponível' : 'Sem conexão'}</h3>
      <p>
        {subtitle ?? `${feature} precisa de internet para funcionar. Verifique sua conexão e tente novamente.`}
      </p>
      <div className="offline-works">
        <span className="offline-works-label">Funciona offline:</span>
        <div className="offline-chips">
          <span>Biblioteca</span>
          <span>Objeções</span>
          <span>Roteiros</span>
          <span>Técnicas</span>
          <span>Histórico</span>
          <span>Favoritos</span>
        </div>
      </div>
    </div>
  );
}

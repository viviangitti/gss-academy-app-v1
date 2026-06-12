import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './Header.css';

const titles: Record<string, string> = {
  '/': 'Maestria',
  '/biblioteca': 'Painel',
  '/objecoes': 'Objeções',
  '/scripts': 'Roteiros',
  '/tecnicas': 'Técnicas',
  '/noticias': 'Notícias',
  '/favoritos': 'Favoritos',
  '/treino-hub': 'Treino',
  '/treino': 'Treino',
  '/treino-voz': 'Treino falado',
  '/follow-ups': 'Follow-ups',
  '/boost': 'Boost',
  '/rescue': 'Rescue',
  '/pre-reuniao': 'Pré-reunião',
  '/coach-mensagem': 'Revisar Mensagem',
  '/analise-reuniao': 'Pós-reunião',
  '/vendas-perdidas': 'Vendas Perdidas',
  '/historico': 'Histórico',
  '/privacidade': 'Privacidade',
  '/instalar': 'Instalar o app',
  '/feedback': 'Feedback',
  '/vendas': 'Histórico de Vendas',
  '/ia-coach': 'Coaching',
  '/coach-voz': 'Coach por Voz',
  '/perfil': 'Perfil',
  '/controladoria': 'Gestão de Metas',
  '/ofertas': 'Ofertas do Mês',
  '/ofertas-admin': 'Painel Marketing',
  '/concorrencia': 'Concorrência',
  '/concorrencia-admin': 'Concorrência',
  '/gatilhos': 'Gatilhos',
  '/condicoes': 'Condições Comerciais',
  '/condicoes-admin': 'Campanhas e Condições',
  '/playbook': 'Playbook',
  '/marketing-hub': 'Marketing Hub',
  '/marketing-chat': 'Copiloto Marketing',
  '/guia-marca': 'Guia de Marca',
  '/analise-campanha': 'Análise de Campanhas',
  '/gerador-copy': 'Gerador de Copy',
  '/conteudo-dia': 'Conteúdo do Dia',
  '/painel-gestor': 'Painel do Gestor',
};

const LIBRARY_SUB_PAGES = [
  '/objecoes', '/scripts', '/tecnicas', '/favoritos', '/historico',
  '/condicoes', '/gatilhos', '/concorrencia', '/ofertas', '/playbook',
  '/analise-campanha', '/follow-ups',
];
// Treino sub-pages go back to /treino-hub
const TRAINING_SUB_PAGES = ['/treino', '/treino-voz', '/pre-reuniao', '/coach-mensagem', '/analise-reuniao', '/vendas-perdidas'];
// Treino hub itself goes back to /biblioteca
const TRAINING_HUB_PAGES = ['/treino-hub'];
// Marketing Hub sub-pages go back to /marketing-hub
const MARKETING_HUB_SUB_PAGES = ['/guia-marca', '/marketing-chat', '/gerador-copy'];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || 'MAESTR.IA';
  const isHome = location.pathname === '/';
  const isLibrarySub = LIBRARY_SUB_PAGES.includes(location.pathname);
  const isTrainingSub = TRAINING_SUB_PAGES.includes(location.pathname);
  const isTrainingHub = TRAINING_HUB_PAGES.includes(location.pathname);
  const isMarketingHubSub = MARKETING_HUB_SUB_PAGES.includes(location.pathname);

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const accessType = profile.userAccessType || 'vendas';
  const subtitle = accessType === 'marketing' ? 'em Marketing' : accessType === 'ambos' ? 'em Vendas & Marketing' : 'em Vendas';

  const handleBack = () => {
    if (isLibrarySub) navigate('/biblioteca');
    else if (isMarketingHubSub) navigate('/marketing-hub');
    else if (isTrainingSub) navigate('/treino-hub');
    else if (isTrainingHub) navigate('/biblioteca');
    else navigate(-1);
  };

  return (
    <header className="header">
      <div className="header-content">
        {isHome ? (
          <div className="header-brand">
            <div className="header-logo">GSS</div>
            <div className="header-brand-text">
              <span className="header-title-main">MAESTRIA</span>
              <span className="header-subtitle">{subtitle}</span>
            </div>
          </div>
        ) : (
          <div className="header-nav">
            <button className="header-back" onClick={handleBack} aria-label="Voltar">
              <ArrowLeft size={20} />
            </button>
            <h1 className="header-title">{title}</h1>
          </div>
        )}
        {location.pathname !== '/perfil' && (
          <button className="header-profile" onClick={() => navigate('/perfil')} aria-label="Perfil">
            <User size={20} />
          </button>
        )}
      </div>
    </header>
  );
}

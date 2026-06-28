import { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './Header.css';

const titles: Record<string, string> = {
  '/': 'Maestria',
  '/biblioteca': 'Marketing',
  '/objecoes': 'Objeções',
  '/scripts': 'Roteiros',
  '/tecnicas': 'Técnicas',
  '/noticias': 'Notícias',
  '/favoritos': 'Favoritos',
  '/treino-hub': 'Treino',
  '/treino': 'Treino',
  '/treino-voz': 'Treino falado',
  '/treino-video': 'Treino em vídeo',
  '/narrativa': 'Narrativa aspiracional',
  '/prospeccao': 'Prospecção',
  '/follow-ups': 'Follow-ups',
  '/negociacoes': 'Negociações',
  '/negociacoes-gestor': 'Negociações',
  '/maestria': 'Maestria',
  '/raio-x': 'Raio X',
  '/criar-conteudo': 'Criar conteúdo',
  '/rituais-gestor': 'Rotinas & rituais',
  '/gestao-comercial': 'Gestão comercial',
  '/treino-lideranca': 'Treino de liderança',
  '/guia-marketing': 'Guia de Marketing',
  '/boost': 'Cliente em atendimento',
  '/rescue': 'Resgate',
  '/meu-raiox': 'Meu Raio-X',
  '/mapa': 'Mapa do app',
  '/pre-reuniao': 'Pré-atendimento',
  '/coach-mensagem': 'Revisar Mensagem',
  '/analise-reuniao': 'Pós-atendimento',
  '/vendas-perdidas': 'Vendas Perdidas',
  '/historico': 'Histórico',
  '/privacidade': 'Privacidade',
  '/instalar': 'Instalar o app',
  '/feedback': 'Feedback',
  '/vendas': 'Histórico de Vendas',
  '/ia-coach': 'Coaching',
  '/coach-voz': 'Coach por Voz',
  '/perfil': 'Perfil',
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
  '/painel-gestor': 'Raio X do Time',
};

// Abas principais (destinos da barra inferior) — sem botão "voltar"
const TOP_TAB_PAGES = ['/negociacoes', '/negociacoes-gestor', '/maestria', '/raio-x', '/painel-gestor', '/ia-coach'];

// Subtítulo opcional no cabeçalho de cada aba principal
const TAB_SUBTITLES: Record<string, string> = {
  '/maestria': 'Treine e afie suas habilidades de venda',
  '/painel-gestor': 'Perfil e performance da equipe',
};

// Pra onde o "voltar" leva cada tela de detalhe. Quando há mais de uma entrada
// possível (array), volta pra ORIGEM real (de onde a pessoa veio); se a origem
// não bate, usa a primeira (a aba principal daquela tela). Fonte: entry points
// reais (cards que abrem cada página).
const BACK: Record<string, string | string[]> = {
  // Negociações
  '/boost': '/negociacoes',
  '/rescue': '/negociacoes',
  '/prospeccao': '/negociacoes',
  '/pre-reuniao': ['/negociacoes', '/maestria'],
  // Maestria
  '/treino-hub': '/maestria',
  '/treino': ['/maestria', '/treino-hub', '/ia-coach'],
  '/treino-voz': ['/maestria', '/treino-hub', '/ia-coach', '/boost'],
  '/treino-video': '/maestria',
  '/narrativa': '/maestria',
  '/objecoes': '/maestria',
  '/scripts': '/maestria',
  '/tecnicas': '/maestria',
  '/gatilhos': '/maestria',
  '/playbook': '/maestria',
  '/criar-conteudo': '/maestria',
  '/conteudo-dia': ['/maestria', '/biblioteca'],
  '/rituais-gestor': '/maestria',
  '/gestao-comercial': '/maestria',
  '/treino-lideranca': '/maestria',
  '/guia-marketing': '/maestria',
  '/coach-mensagem': ['/maestria', '/treino-hub'],
  '/analise-reuniao': ['/maestria', '/treino-hub'],
  // Raio X
  '/meu-raiox': '/raio-x',
  '/historico': '/raio-x',
  '/vendas-perdidas': ['/raio-x', '/negociacoes', '/follow-ups'],
  // Coaching
  '/coach-voz': '/ia-coach',
  // Painel Controle
  '/condicoes': ['/', '/biblioteca'],
  '/concorrencia': ['/', '/biblioteca'],
  '/noticias': '/',
  '/follow-ups': '/',
  '/vendas': '/',
  '/feedback': '/',
  // Marketing (central /biblioteca)
  '/biblioteca': '/',
  '/favoritos': ['/', '/biblioteca'],
  '/ofertas': '/biblioteca',
  '/guia-marca': ['/biblioteca', '/marketing-hub'],
  '/gerador-copy': ['/biblioteca', '/marketing-hub'],
  '/marketing-chat': ['/biblioteca', '/marketing-hub'],
  '/analise-campanha': '/biblioteca',
  '/marketing-hub': '/biblioteca',
  '/condicoes-admin': '/biblioteca',
  '/concorrencia-admin': '/biblioteca',
  '/ofertas-admin': '/biblioteca',
  '/pos-campanha': '/biblioteca',
  '/revisar-copy': '/biblioteca',
  '/pre-lancamento': '/biblioteca',
  // Globais / configuração
  '/perfil': '/',
  '/instalar': '/perfil',
  '/privacidade': '/perfil',
  '/mapa': '/perfil',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || 'MAESTR.IA';
  const isHome = location.pathname === '/';
  // Abas principais (destinos da barra inferior) — não mostram "voltar"
  const isTopTab = TOP_TAB_PAGES.includes(location.pathname);

  // De onde a pessoa veio (path do commit anterior) — pra desambiguar telas
  // com mais de uma entrada possível.
  const cameFromRef = useRef('/');
  const cameFrom = cameFromRef.current;
  useEffect(() => { cameFromRef.current = location.pathname; }, [location.pathname]);

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const accessType = profile.userAccessType || 'vendas';
  const subtitle = accessType === 'marketing' ? 'em Marketing' : accessType === 'ambos' ? 'em Vendas & Marketing' : 'em Vendas';

  const handleBack = () => {
    const cfg = BACK[location.pathname];
    let target: string;
    if (Array.isArray(cfg)) target = cfg.includes(cameFrom) ? cameFrom : cfg[0];
    else target = cfg || '/';
    navigate(target);
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
        ) : isTopTab ? (
          <div className="header-nav header-nav-tab">
            <h1 className="header-title header-title-tab">{title}</h1>
            {TAB_SUBTITLES[location.pathname] && (
              <span className="header-tab-sub">{TAB_SUBTITLES[location.pathname]}</span>
            )}
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

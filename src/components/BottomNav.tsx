import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Handshake, GraduationCap, BookOpen, Sparkles } from 'lucide-react';
import './BottomNav.css';

const NEGOTIATION_PATHS = ['/negociacoes', '/boost', '/rescue', '/pre-reuniao', '/vendas-perdidas'];
const MAESTRIA_PATHS = [
  '/maestria', '/treino', '/treino-voz', '/treino-hub', '/objecoes', '/scripts',
  '/tecnicas', '/playbook', '/gatilhos', '/coach-mensagem', '/analise-reuniao', '/criar-conteudo',
];
const LIBRARY_PATHS = [
  '/biblioteca', '/favoritos', '/historico', '/condicoes', '/concorrencia', '/ofertas',
  '/guia-marca', '/analise-campanha', '/gerador-copy', '/pos-campanha', '/revisar-copy',
  '/pre-lancamento', '/marketing-chat', '/conteudo-dia',
];

const tabs = [
  { path: '/', icon: Home, label: 'Painel Controle' },
  { path: '/negociacoes', icon: Handshake, label: 'Negociações' },
  { path: '/maestria', icon: GraduationCap, label: 'Maestria' },
  { path: '/biblioteca', icon: BookOpen, label: 'Painel' },
  { path: '/ia-coach', icon: Sparkles, label: 'Coaching' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {tabs.map(({ path, icon: Icon, label }) => {
        let isActive = location.pathname === path;
        if (path === '/negociacoes') isActive = NEGOTIATION_PATHS.includes(location.pathname);
        if (path === '/maestria') isActive = MAESTRIA_PATHS.includes(location.pathname);
        if (path === '/biblioteca') isActive = LIBRARY_PATHS.includes(location.pathname);

        return (
          <button
            key={path}
            data-tour={path === '/negociacoes' ? 'nav-negociacoes' : path === '/biblioteca' ? 'nav-painel' : path === '/ia-coach' ? 'nav-coaching' : undefined}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

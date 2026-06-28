import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Handshake, GraduationCap, Activity, Sparkles } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './BottomNav.css';

const NEGOTIATION_PATHS = ['/negociacoes', '/boost', '/rescue', '/pre-reuniao', '/prospeccao'];
const MAESTRIA_PATHS = [
  '/maestria', '/treino', '/treino-voz', '/treino-video', '/treino-hub', '/objecoes', '/scripts',
  '/tecnicas', '/playbook', '/gatilhos', '/coach-mensagem', '/analise-reuniao', '/criar-conteudo', '/rituais-gestor', '/gestao-comercial', '/treino-lideranca', '/guia-marketing', '/conteudo-dia', '/narrativa',
];
const RAIOX_PATHS = ['/raio-x', '/meu-raiox', '/vendas-perdidas', '/historico'];
const LIBRARY_PATHS = [
  '/biblioteca', '/favoritos', '/condicoes', '/concorrencia', '/ofertas',
  '/guia-marca', '/analise-campanha', '/gerador-copy', '/pos-campanha', '/revisar-copy',
  '/pre-lancamento', '/marketing-chat',
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const isGestor = profile.isGestor === true || profile.isAdmin === true;
  const isMarketing = profile.userAccessType === 'marketing';

  // Marketing: sem Negociações nem Raio X de vendas (foco em marketing).
  // Gestor: Negociações e Raio X têm visão de gestão própria.
  const tabs = [
    { path: '/', icon: Home, label: 'Painel Controle' },
    ...(isMarketing
      ? []
      : [isGestor
          ? { path: '/negociacoes-gestor', icon: Handshake, label: 'Negociações' }
          : { path: '/negociacoes', icon: Handshake, label: 'Negociações' }]),
    { path: '/maestria', icon: GraduationCap, label: 'Maestria' },
    ...(isMarketing
      ? []
      : [isGestor
          ? { path: '/painel-gestor', icon: Activity, label: 'Raio X do Time' }
          : { path: '/raio-x', icon: Activity, label: 'Raio X' }]),
    { path: '/ia-coach', icon: Sparkles, label: 'Coaching' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(({ path, icon: Icon, label }) => {
        let isActive = location.pathname === path;
        if (path === '/negociacoes') isActive = NEGOTIATION_PATHS.includes(location.pathname);
        if (path === '/maestria') isActive = MAESTRIA_PATHS.includes(location.pathname);
        if (path === '/raio-x') isActive = RAIOX_PATHS.includes(location.pathname);
        if (path === '/painel-gestor') isActive = location.pathname === '/painel-gestor' || RAIOX_PATHS.includes(location.pathname);
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

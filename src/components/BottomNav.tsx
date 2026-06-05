import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Newspaper, BookOpen, Sparkles } from 'lucide-react';
import './BottomNav.css';

const NEWS_PATHS = ['/noticias'];
const LIBRARY_PATHS = [
  '/biblioteca', '/playbook', '/objecoes', '/scripts', '/tecnicas', '/favoritos', '/historico',
  '/treino-hub', '/treino', '/pre-reuniao', '/coach-mensagem', '/analise-reuniao',
  '/vendas-perdidas', '/condicoes', '/gatilhos', '/concorrencia', '/ofertas',
];

const tabs = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/noticias', icon: Newspaper, label: 'Notícias' },
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
        if (path === '/noticias') isActive = NEWS_PATHS.includes(location.pathname);
        if (path === '/biblioteca') isActive = LIBRARY_PATHS.includes(location.pathname);

        return (
          <button
            key={path}
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

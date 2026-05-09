import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Swords, Sparkles } from 'lucide-react';
import './BottomNav.css';

const LIBRARY_PATHS = ['/biblioteca', '/objecoes', '/scripts', '/tecnicas', '/noticias', '/favoritos', '/historico'];
const TRAINING_PATHS = ['/treino-hub', '/treino', '/pre-reuniao', '/coach-mensagem', '/analise-reuniao', '/vendas-perdidas'];

const tabs = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/biblioteca', icon: BookOpen, label: 'Biblioteca' },
  { path: '/treino-hub', icon: Swords, label: 'Treino' },
  { path: '/ia-coach', icon: Sparkles, label: 'IA' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {tabs.map(({ path, icon: Icon, label }) => {
        let isActive = location.pathname === path;
        if (path === '/biblioteca') isActive = LIBRARY_PATHS.includes(location.pathname);
        if (path === '/treino-hub') isActive = TRAINING_PATHS.includes(location.pathname);

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

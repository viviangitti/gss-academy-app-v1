import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import './Header.css';

const titles: Record<string, string> = {
  '/': 'MAESTR.IA',
  '/biblioteca': 'Biblioteca',
  '/objecoes': 'Objeções',
  '/scripts': 'Roteiros',
  '/tecnicas': 'Técnicas',
  '/noticias': 'Notícias',
  '/favoritos': 'Favoritos',
  '/treino-hub': 'Treino',
  '/treino': 'Simulador de Treino',
  '/pre-reuniao': 'Pré-reunião',
  '/coach-mensagem': 'Coach de Mensagem',
  '/analise-reuniao': 'Análise pós-reunião',
  '/vendas-perdidas': 'Vendas Perdidas',
  '/historico': 'Meu Histórico',
  '/privacidade': 'Privacidade',
  '/instalar': 'Instalar o app',
  '/feedback': 'Enviar Feedback',
  '/vendas': 'Histórico de Vendas',
  '/ia-coach': 'Pergunte à IA',
  '/perfil': 'Perfil',
};

const LIBRARY_SUB_PAGES = ['/objecoes', '/scripts', '/tecnicas', '/noticias', '/favoritos', '/historico'];
const TRAINING_SUB_PAGES = ['/treino', '/pre-reuniao', '/coach-mensagem', '/analise-reuniao', '/vendas-perdidas'];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || 'MAESTR.IA';
  const isHome = location.pathname === '/';
  const isLibrarySub = LIBRARY_SUB_PAGES.includes(location.pathname);
  const isTrainingSub = TRAINING_SUB_PAGES.includes(location.pathname);

  const handleBack = () => {
    if (isLibrarySub) navigate('/biblioteca');
    else if (isTrainingSub) navigate('/treino-hub');
    else navigate(-1);
  };

  return (
    <header className="header">
      <div className="header-content">
        {isHome ? (
          <div className="header-brand">
            <div className="header-logo">GSS</div>
            <span className="header-subtitle">MAESTR.IA em Vendas</span>
          </div>
        ) : (
          <div className="header-nav">
            {(isLibrarySub || isTrainingSub) && (
              <button className="header-back" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="header-title">{title}</h1>
          </div>
        )}
        {location.pathname !== '/perfil' && (
          <button className="header-profile" onClick={() => navigate('/perfil')}>
            <User size={20} />
          </button>
        )}
      </div>
    </header>
  );
}

import { useNavigate } from 'react-router-dom';
import { Swords, Zap, Wand2, Mic, TrendingDown } from 'lucide-react';
import './Content.css';

const MENU_ITEMS = [
  { path: '/vendas-perdidas', icon: TrendingDown, label: 'Vendas Perdidas', desc: 'Registre por que perdeu e aprenda com cada erro', color: '#ef4444' },
  { path: '/pre-reuniao', icon: Zap, label: 'Pré-reunião', desc: 'Prepare-se em 2 minutos antes de cada encontro', color: '#c9a84c' },
  { path: '/coach-mensagem', icon: Wand2, label: 'Coach de Mensagem', desc: 'Revise seu WhatsApp ou e-mail antes de enviar', color: '#10b981' },
  { path: '/analise-reuniao', icon: Mic, label: 'Pós-reunião', desc: 'Grave 1 min falando como foi, a IA extrai tudo', color: '#8b5cf6' },
  { path: '/treino', icon: Swords, label: 'Simulador', desc: 'Treine objeções com um cliente virtual', color: '#f59e0b' },
];

export default function TrainingHub() {
  const navigate = useNavigate();

  return (
    <div className="content-page">
      <div className="content-grid">
        {MENU_ITEMS.map(item => (
          <button key={item.path} className="content-item card" onClick={() => navigate(item.path)}>
            <div className="content-icon" style={{ background: `${item.color}15`, color: item.color }}>
              <item.icon size={22} />
            </div>
            <h4>{item.label}</h4>
            <p>{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

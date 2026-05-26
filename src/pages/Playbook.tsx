import { useNavigate } from 'react-router-dom';
import { Shield, FileText, BookOpen, Zap } from 'lucide-react';
import './Content.css';

const ITEMS = [
  { path: '/objecoes',  icon: Shield,   label: 'Objeções',  desc: 'Como responder cada objeção do seu segmento', color: '#ef4444' },
  { path: '/scripts',   icon: FileText, label: 'Roteiros',  desc: 'Abordagem, follow-up e fechamento',            color: '#3b82f6' },
  { path: '/tecnicas',  icon: BookOpen, label: 'Técnicas',  desc: 'Perguntas, qualificação e leitura do cliente', color: '#8b5cf6' },
  { path: '/gatilhos',  icon: Zap,      label: 'Gatilhos',  desc: 'Frases para mover o cliente na hora certa',    color: '#f59e0b' },
];

export default function Playbook() {
  const navigate = useNavigate();

  return (
    <div className="content-page">
      <div className="content-grid">
        {ITEMS.map(item => (
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

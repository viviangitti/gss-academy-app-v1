import { Home, Newspaper, LayoutGrid, MessageCircle, Brain, Sparkles, ArrowRight } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './WelcomeIntro.css';

interface Props { onClose: () => void; }

const AREAS = [
  { icon: Home, color: '#185FA5', title: 'Início', desc: 'Resumo do dia, registro de vendas, Boost e suas tarefas' },
  { icon: Newspaper, color: '#0F6E56', title: 'Notícias', desc: 'Do seu mercado e dos concorrentes, ao vivo' },
  { icon: LayoutGrid, color: '#534AB7', title: 'Painel', desc: 'Follow-ups, treino, playbook, condições e seu Raio-X' },
  { icon: MessageCircle, color: '#993C1D', title: 'Coaching', desc: 'Coach por texto e voz, Boost e Rescue de clientes' },
];

export default function WelcomeIntro({ onClose }: Props) {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const firstName = profile.name ? profile.name.split(' ')[0] : '';

  const finish = () => {
    localStorage.setItem('gss_intro_seen', 'true');
    onClose();
  };

  return (
    <div className="wi-page">
      <div className="wi-inner">
        <div className="wi-badge"><Sparkles size={26} /></div>
        <h1>Bem-vindo{firstName ? `, ${firstName}` : ''}! 👋</h1>
        <p className="wi-lead">Esse é o seu copiloto de vendas. Olha tudo que ele faz por você:</p>

        <div className="wi-areas">
          {AREAS.map(a => {
            const Icon = a.icon;
            return (
              <div key={a.title} className="wi-area" style={{ ['--wi' as string]: a.color }}>
                <div className="wi-area-icon"><Icon size={20} /></div>
                <div className="wi-area-text">
                  <strong>{a.title}</strong>
                  <span>{a.desc}</span>
                </div>
              </div>
            );
          })}
          <div className="wi-area wi-area--ia" style={{ ['--wi' as string]: '#5F5E5A' }}>
            <div className="wi-area-icon"><Brain size={20} /></div>
            <div className="wi-area-text">
              <strong>Uma IA que aprende com a equipe</strong>
              <span>Quanto mais vocês usam, mais ela melhora — lembra de você e dos casos reais</span>
            </div>
          </div>
        </div>

        <button className="wi-start" onClick={finish}>
          Começar a usar <ArrowRight size={18} />
        </button>
        <p className="wi-hint">Pode rever tudo isso quando quiser no <strong>Mapa do app</strong> (no Painel).</p>
      </div>
    </div>
  );
}

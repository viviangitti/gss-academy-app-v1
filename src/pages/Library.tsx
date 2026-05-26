import { useNavigate } from 'react-router-dom';
import { Tag, Swords, BookOpen, ChevronRight, BarChart2 } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './Library.css';

export default function Library() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const isMarketingUser = profile.userAccessType === 'marketing' || profile.userAccessType === 'ambos';

  return (
    <div className="lib-page">
      <div className="lib-section-label">Intel do mês</div>

      <div className="lib-intel-grid">
        <button className="lib-intel-card card" onClick={() => navigate('/condicoes')}>
          <div className="lib-intel-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <Tag size={20} />
          </div>
          <span className="lib-intel-title">Condições</span>
          <span className="lib-intel-desc">Tabelas e campanhas do mês</span>
        </button>

        <button className="lib-intel-card card" onClick={() => navigate('/concorrencia')}>
          <div className="lib-intel-icon" style={{ background: 'rgba(185,28,28,0.1)', color: '#b91c1c' }}>
            <Swords size={20} />
          </div>
          <span className="lib-intel-title">Concorrência</span>
          <span className="lib-intel-desc">O que estão fazendo agora</span>
        </button>
      </div>

      <div className="lib-section-label">Referência</div>

      <button className="lib-playbook-card card" onClick={() => navigate('/playbook')}>
        <div className="lib-intel-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
          <BookOpen size={20} />
        </div>
        <div className="lib-playbook-text">
          <span className="lib-intel-title">Playbook</span>
          <span className="lib-intel-desc">Objeções · Roteiros · Técnicas · Gatilhos</span>
        </div>
        <ChevronRight size={18} className="lib-playbook-arrow" />
      </button>

      {isMarketingUser && (
        <>
          <div className="lib-section-label">Análise</div>
          <button className="lib-playbook-card card" onClick={() => navigate('/analise-campanha')}>
            <div className="lib-intel-icon" style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
              <BarChart2 size={20} />
            </div>
            <div className="lib-playbook-text">
              <span className="lib-intel-title">Análise de Campanhas</span>
              <span className="lib-intel-desc">Envie um print ou relatório — IA gera insights e takeaways</span>
            </div>
            <ChevronRight size={18} className="lib-playbook-arrow" />
          </button>
        </>
      )}
    </div>
  );
}

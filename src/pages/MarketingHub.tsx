import { useNavigate } from 'react-router-dom';
import { Megaphone, Swords, FileText, ChevronRight, Sparkles, BookOpen, PenLine } from 'lucide-react';
import './MarketingHub.css';

export default function MarketingHub() {
  const navigate = useNavigate();

  return (
    <div className="mh-page">
      <div className="mh-hero card">
        <Megaphone size={22} />
        <div>
          <h2>Painel Marketing</h2>
          <p>Gerencie ofertas e inteligência competitiva</p>
        </div>
      </div>

      <button className="mh-card card" onClick={() => navigate('/guia-marca')}>
        <div className="mh-icon" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--accent)' }}>
          <BookOpen size={22} />
        </div>
        <div className="mh-info">
          <h3>Guia de Marca</h3>
          <p>Carregue o guide e a IA confere alinhamento, sugere campanhas e cria briefings dentro da identidade da marca</p>
        </div>
        <ChevronRight size={18} className="mh-arrow" />
      </button>

      <button className="mh-card card" onClick={() => navigate('/gerador-copy')}>
        <div className="mh-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
          <PenLine size={22} />
        </div>
        <div className="mh-info">
          <h3>Gerador de Copy</h3>
          <p>Descreva a oferta e a IA cria 3 versões prontas — post, stories, WhatsApp ou e-mail</p>
        </div>
        <ChevronRight size={18} className="mh-arrow" />
      </button>

      <button className="mh-card mh-card-ai card" onClick={() => navigate('/marketing-chat')}>
        <div className="mh-icon" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--accent)' }}>
          <Sparkles size={22} />
        </div>
        <div className="mh-info">
          <h3>Copiloto de Marketing</h3>
          <p>Conferir peças, sugerir ações e diagnosticar o mix da concessionária</p>
        </div>
        <ChevronRight size={18} className="mh-arrow" />
      </button>

      <button className="mh-card card" onClick={() => navigate('/ofertas-admin')}>
        <div className="mh-icon" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>
          <Megaphone size={22} />
        </div>
        <div className="mh-info">
          <h3>Ofertas do Mês</h3>
          <p>Cadastre campanhas e promoções para os vendedores</p>
        </div>
        <ChevronRight size={18} className="mh-arrow" />
      </button>

      <button className="mh-card card" onClick={() => navigate('/concorrencia-admin')}>
        <div className="mh-icon" style={{ background: 'rgba(185,28,28,0.1)', color: '#b91c1c' }}>
          <Swords size={22} />
        </div>
        <div className="mh-info">
          <h3>Concorrência</h3>
          <p>Importe e analise ofertas da concorrência com IA</p>
        </div>
        <ChevronRight size={18} className="mh-arrow" />
      </button>

      <button className="mh-card card" onClick={() => navigate('/condicoes-admin')}>
        <div className="mh-icon" style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--accent)' }}>
          <FileText size={22} />
        </div>
        <div className="mh-info">
          <h3>Condições Comerciais</h3>
          <p>Publique tabelas, campanhas e PDFs do mês para a equipe</p>
        </div>
        <ChevronRight size={18} className="mh-arrow" />
      </button>
    </div>
  );
}

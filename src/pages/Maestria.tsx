import { useNavigate } from 'react-router-dom';
import { GraduationCap, Swords, Mic, MessageCircle, Sparkles, BookOpen, Flame, ArrowRight } from 'lucide-react';
import './Home.css';
import './Maestria.css';

export default function Maestria() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* Hero */}
      <div className="mae-hero card">
        <div className="mae-hero-icon"><GraduationCap size={24} /></div>
        <div>
          <h2>Maestria</h2>
          <p>Treine e afie suas habilidades de venda</p>
        </div>
      </div>

      {/* Role-play / simulação */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Role-play / simulação</h3></div>
        <div className="home-dual-grid">
          <button className="home-dual-card card" onClick={() => navigate('/treino')}>
            <div className="home-dual-icon"><Swords size={18} /></div>
            <strong>Role-play</strong>
            <span>Atendimento, financiamento e objeções — como cliente real</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/treino-voz')}>
            <div className="home-dual-icon"><Mic size={18} /></div>
            <strong>Treino falado</strong>
            <span>Treine conversando por voz com o cliente difícil</span>
          </button>
        </div>
      </div>

      {/* Contornar objeções */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Contornar objeções</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/objecoes')}>
          <div className="home-content-icon mae-obj-icon"><MessageCircle size={20} /></div>
          <div className="home-content-text">
            <strong>Biblioteca de objeções</strong>
            <span>Respostas prontas pras objeções mais comuns</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>

      {/* Narrativa & técnicas — vender por valor, menos desconto */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Narrativa & técnicas</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/tecnicas')}>
          <div className="home-content-icon mae-narr-icon"><Sparkles size={20} /></div>
          <div className="home-content-text">
            <strong>Técnicas de venda</strong>
            <span>Narrativa que inspira, venda por valor — menos desconto</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
        <button className="home-content-card card" onClick={() => navigate('/scripts')}>
          <div className="home-content-icon mae-script-icon"><BookOpen size={20} /></div>
          <div className="home-content-text">
            <strong>Roteiros prontos</strong>
            <span>Aberturas, mensagens e fechamentos que convertem</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
        <button className="home-content-card card" onClick={() => navigate('/gatilhos')}>
          <div className="home-content-icon mae-trigger-icon"><Flame size={20} /></div>
          <div className="home-content-text">
            <strong>Gatilhos de urgência</strong>
            <span>Crie senso de oportunidade sem apelar pro desconto</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>
    </div>
  );
}

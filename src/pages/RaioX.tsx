import { useNavigate } from 'react-router-dom';
import { Activity, BarChart2, TrendingDown, History, ArrowRight } from 'lucide-react';
import './Home.css';
import './RaioX.css';

export default function RaioX() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* Hero */}
      <div className="rx-hero card">
        <div className="rx-hero-icon"><Activity size={24} /></div>
        <div>
          <h2>Raio X</h2>
          <p>Por que você ganha e por que perde — seu diagnóstico</p>
        </div>
      </div>

      {/* Meu Raio-X */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Meu desempenho</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/meu-raiox')}>
          <div className="home-content-icon rx-main-icon"><BarChart2 size={20} /></div>
          <div className="home-content-text">
            <strong>Meu Raio-X</strong>
            <span>O que te faz ganhar e o que te faz perder — seu gap</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>

      {/* Aprender com os números */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Aprender com os números</h3></div>
        <div className="home-dual-grid">
          <button className="home-dual-card card" onClick={() => navigate('/vendas-perdidas')}>
            <div className="home-dual-icon rx-lost-icon"><TrendingDown size={18} /></div>
            <strong>Vendas perdidas</strong>
            <span>Registre o motivo e aprenda com cada perda</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/historico')}>
            <div className="home-dual-icon rx-hist-icon"><History size={18} /></div>
            <strong>Histórico</strong>
            <span>Tudo que você fez no app, dia a dia</span>
          </button>
        </div>
      </div>
    </div>
  );
}

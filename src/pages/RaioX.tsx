import { useNavigate } from 'react-router-dom';
import { Activity, TrendingDown, History } from 'lucide-react';
import MyReport from './MyReport';
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
          <p>Seu diagnóstico: pontos fortes, gaps e onde melhorar</p>
        </div>
      </div>

      {/* Relatório com gráfico aranha (radar de competências), gaps e pontos fortes */}
      <MyReport />

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

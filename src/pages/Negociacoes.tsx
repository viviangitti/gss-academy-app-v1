import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import './Home.css';

export default function Negociacoes() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* Cliente em atendimento */}
      <div className="day-section">
        <div className="day-section-header">
          <h3 className="section-title">Cliente em atendimento</h3>
        </div>
        <button className="home-boost-card card" onClick={() => navigate('/boost')}>
          <div className="home-boost-icon"><Zap size={22} /></div>
          <div className="home-boost-text">
            <strong>Travou numa objeção?</strong>
            <span>Receba caminhos possíveis baseados no perfil do cliente</span>
          </div>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

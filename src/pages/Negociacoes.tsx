import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, Check, X } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import QuickSaleSheet from '../components/QuickSaleSheet';
import './Home.css';

export default function Negociacoes() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [showQuickSale, setShowQuickSale] = useState(false);

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

      {/* Cliente concluído — registra ganho OU perda (a IA aprende com os dois) */}
      {profile.userAccessType !== 'marketing' && (
        <div className="day-section">
          <div className="day-section-header">
            <h3 className="section-title">Cliente concluído</h3>
          </div>
          <div className="home-outcome card">
            <p className="home-outcome-q">Acabou um atendimento? Como foi?</p>
            <div className="home-outcome-btns">
              <button className="home-outcome-btn won" onClick={() => setShowQuickSale(true)}>
                <Check size={18} /> Vendi!
              </button>
              <button className="home-outcome-btn lost" onClick={() => navigate('/vendas-perdidas')}>
                <X size={18} /> Não fechou
              </button>
            </div>
            <p className="home-outcome-note">Registrar os dois faz a IA aprender e melhora seu Raio-X.</p>
          </div>
        </div>
      )}

      <QuickSaleSheet open={showQuickSale} onClose={() => setShowQuickSale(false)} />
    </div>
  );
}

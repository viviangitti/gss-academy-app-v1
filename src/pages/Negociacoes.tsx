import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, ClipboardList, Zap, Check, X, LifeBuoy, ArrowRight } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import QuickSaleSheet from '../components/QuickSaleSheet';
import './Home.css';
import './Negociacoes.css';

export default function Negociacoes() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [showQuickSale, setShowQuickSale] = useState(false);
  const isSales = profile.userAccessType !== 'marketing';

  return (
    <div className="home">
      {/* Hero */}
      <div className="neg-hero card">
        <div className="neg-hero-icon"><Handshake size={24} /></div>
        <div>
          <h2>Negociações</h2>
          <p>Seu copiloto em cada etapa do atendimento</p>
        </div>
      </div>

      {/* Antes do atendimento */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Antes do atendimento</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/pre-reuniao')}>
          <div className="home-content-icon neg-prep-icon"><ClipboardList size={20} /></div>
          <div className="home-content-text">
            <strong>Preparar a reunião</strong>
            <span>Chegue pronto: pauta, perguntas e argumentos</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>

      {/* Cliente em atendimento */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Cliente em atendimento</h3></div>
        <button className="home-boost-card card" onClick={() => navigate('/boost')}>
          <div className="home-boost-icon"><Zap size={22} /></div>
          <div className="home-boost-text">
            <strong>Travou numa objeção?</strong>
            <span>Receba caminhos possíveis baseados no perfil do cliente</span>
          </div>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Cliente concluído */}
      {isSales && (
        <div className="day-section">
          <div className="day-section-header"><h3 className="section-title">Cliente concluído</h3></div>
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

      {/* Resgate */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Cliente esfriou ou não fechou?</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/rescue')}>
          <div className="home-content-icon neg-rescue-icon"><LifeBuoy size={20} /></div>
          <div className="home-content-text">
            <strong>Resgatar cliente</strong>
            <span>A IA monta a mensagem certa pra trazer de volta</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>

      <QuickSaleSheet open={showQuickSale} onClose={() => setShowQuickSale(false)} />
    </div>
  );
}

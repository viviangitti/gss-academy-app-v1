import { useNavigate } from 'react-router-dom';
import { GraduationCap, Swords, Mic, MessageCircle, Sparkles, BookOpen, Flame, PenSquare, ClipboardCheck, Users, Dumbbell, Share2, ArrowRight } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './Home.css';
import './Maestria.css';

export default function Maestria() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const isGestor = profile.isGestor === true || profile.isAdmin === true;

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

      {/* Para o gestor — rotinas e rituais com o time */}
      {isGestor && (
        <div className="day-section">
          <div className="day-section-header"><h3 className="section-title">Para o gestor</h3></div>
          <button className="home-content-card card" onClick={() => navigate('/rituais-gestor')}>
            <div className="home-content-icon mae-gestor-icon"><Users size={20} /></div>
            <div className="home-content-text">
              <strong>Rotinas & rituais com o time</strong>
              <span>Cadência diária, semanal e mensal pra aplicar de forma simples</span>
            </div>
            <ArrowRight size={16} className="home-train-arrow" />
          </button>
        </div>
      )}

      {/* Check-lists */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Check-lists</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/pre-reuniao')}>
          <div className="home-content-icon mae-check-icon"><ClipboardCheck size={20} /></div>
          <div className="home-content-text">
            <strong>Pré-atendimento / test-drive</strong>
            <span>O que revisar antes de cada atendimento pra chegar pronto</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>

      {/* Treino */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Treino</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/treino-hub')}>
          <div className="home-content-icon mae-train-icon"><Dumbbell size={20} /></div>
          <div className="home-content-text">
            <strong>Central de treino</strong>
            <span>Role-play, objeções, reuniões e mensagens num lugar só</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
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

      {/* Criar conteúdo */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Criar conteúdo</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/criar-conteudo')}>
          <div className="home-content-icon mae-content-icon"><PenSquare size={20} /></div>
          <div className="home-content-text">
            <strong>Aprenda a criar conteúdo</strong>
            <span>Roteiros pra Reels, Insta e LinkedIn + modelos de WhatsApp</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
        <button className="home-content-card card" onClick={() => navigate('/conteudo-dia')}>
          <div className="home-content-icon mae-conteudodia-icon"><Share2 size={20} /></div>
          <div className="home-content-text">
            <strong>Conteúdo do Dia</strong>
            <span>Poste nas suas redes e ganhe pontos</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
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

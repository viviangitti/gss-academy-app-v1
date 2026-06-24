import { useNavigate } from 'react-router-dom';
import {
  Tag, Swords, BookOpen, ChevronRight, BarChart2, Map,
  PenLine, Palette, Sparkles, FileText, Megaphone,
} from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './Library.css';

export default function Library() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const isMarketingUser = profile.userAccessType === 'marketing' || profile.userAccessType === 'ambos';
  const showMarketing = isMarketingUser || profile.isAdmin === true;

  return (
    <div className="lib-page">
      {/* ── Mapa do app ── */}
      <button className="lib-playbook-card card" onClick={() => navigate('/mapa')}>
        <div className="lib-intel-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
          <Map size={20} />
        </div>
        <div className="lib-playbook-text">
          <span className="lib-intel-title">Mapa do app</span>
          <span className="lib-intel-desc">Tudo que existe no app — e vá direto</span>
        </div>
      </button>

      {/* ── Meus clientes (vendas) ── */}
      <div className="lib-section-label">Meus clientes</div>
      <button className="lib-playbook-card card" onClick={() => navigate('/meu-raiox')}>
        <div className="lib-intel-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
          <BarChart2 size={20} />
        </div>
        <div className="lib-playbook-text">
          <span className="lib-intel-title">Meu Raio-X</span>
          <span className="lib-intel-desc">Por que você ganha e por que perde — seu gap</span>
        </div>
      </button>

      {/* ── Intel do mês (todos) ── */}
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

      {/* ── Referência (todos) ── */}
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

      {/* ── Marketing (só marketing/admin) ── */}
      {showMarketing && (
        <>
          <div className="lib-section-label">Marketing</div>

          <button className="lib-playbook-card card" onClick={() => navigate('/gerador-copy')}>
            <div className="lib-intel-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <PenLine size={20} />
            </div>
            <div className="lib-playbook-text">
              <span className="lib-intel-title">Gerador de Copy</span>
              <span className="lib-intel-desc">A IA cria 3 versões prontas — post, stories, WhatsApp</span>
            </div>
            <ChevronRight size={18} className="lib-playbook-arrow" />
          </button>

          <button className="lib-playbook-card card" onClick={() => navigate('/guia-marca')}>
            <div className="lib-intel-icon" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--accent)' }}>
              <Palette size={20} />
            </div>
            <div className="lib-playbook-text">
              <span className="lib-intel-title">Guia de Marca</span>
              <span className="lib-intel-desc">Confere alinhamento e sugere campanhas dentro da marca</span>
            </div>
            <ChevronRight size={18} className="lib-playbook-arrow" />
          </button>

          <button className="lib-playbook-card card" onClick={() => navigate('/marketing-chat')}>
            <div className="lib-intel-icon" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>
              <Sparkles size={20} />
            </div>
            <div className="lib-playbook-text">
              <span className="lib-intel-title">Copiloto de Marketing</span>
              <span className="lib-intel-desc">Conferir peças, sugerir ações e diagnosticar o mix</span>
            </div>
            <ChevronRight size={18} className="lib-playbook-arrow" />
          </button>

          <button className="lib-playbook-card card" onClick={() => navigate('/analise-campanha')}>
            <div className="lib-intel-icon" style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
              <BarChart2 size={20} />
            </div>
            <div className="lib-playbook-text">
              <span className="lib-intel-title">Análise de Campanhas</span>
              <span className="lib-intel-desc">Envie um print ou relatório — IA gera insights</span>
            </div>
            <ChevronRight size={18} className="lib-playbook-arrow" />
          </button>
        </>
      )}

      {/* ── Gestão / publicar (só marketing/admin) ── */}
      {showMarketing && (
        <>
          <div className="lib-section-label">Gestão</div>

          <button className="lib-playbook-card card" onClick={() => navigate('/condicoes-admin')}>
            <div className="lib-intel-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <FileText size={20} />
            </div>
            <div className="lib-playbook-text">
              <span className="lib-intel-title">Campanhas e Condições</span>
              <span className="lib-intel-desc">Publique ofertas, tabelas e PDFs para a equipe</span>
            </div>
            <ChevronRight size={18} className="lib-playbook-arrow" />
          </button>

          <button className="lib-playbook-card card" onClick={() => navigate('/concorrencia-admin')}>
            <div className="lib-intel-icon" style={{ background: 'rgba(185,28,28,0.1)', color: '#b91c1c' }}>
              <Megaphone size={20} />
            </div>
            <div className="lib-playbook-text">
              <span className="lib-intel-title">Gerenciar Concorrência</span>
              <span className="lib-intel-desc">Importe e analise ofertas da concorrência com IA</span>
            </div>
            <ChevronRight size={18} className="lib-playbook-arrow" />
          </button>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Share2, Trophy, Medal, Flame, TrendingUp } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getTeamSummary } from '../services/firestore/contentScores';
import type { TeamSummary } from '../services/firestore/contentScores';
import type { UserProfile } from '../types';
import './GestorPanel.css';

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

export default function GestorPanel() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [summary, setSummary] = useState<TeamSummary>({ totalPosts: 0, totalPoints: 0, activeMembers: 0, members: [] });
  const [loading, setLoading] = useState(true);

  const isGestor = profile.isGestor === true || profile.isAdmin === true;

  useEffect(() => {
    if (!isGestor) return;
    getTeamSummary(profile.company || '', profile.segment || '', monthKey())
      .then(setSummary)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isGestor) {
    return (
      <div className="gp-page">
        <div className="gp-restricted card">
          <Users size={40} />
          <h3>Acesso restrito</h3>
          <p>Esta área é exclusiva para gestores de equipe.</p>
          <button onClick={() => navigate('/')}>Voltar ao início</button>
        </div>
      </div>
    );
  }

  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const inativos = summary.members.filter(m => (m.shares || 0) === 0);

  return (
    <div className="gp-page">
      <div className="gp-hero card">
        <Users size={22} />
        <div>
          <h2>Painel do Gestor</h2>
          <p>Engajamento da equipe em conteúdo — {mes}</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="gp-stats">
        <div className="gp-stat card">
          <Share2 size={18} />
          <span className="gp-stat-val">{summary.totalPosts}</span>
          <span className="gp-stat-lbl">posts no mês</span>
        </div>
        <div className="gp-stat card">
          <Users size={18} />
          <span className="gp-stat-val">{summary.activeMembers}</span>
          <span className="gp-stat-lbl">ativos</span>
        </div>
        <div className="gp-stat card">
          <Trophy size={18} />
          <span className="gp-stat-val">{summary.totalPoints}</span>
          <span className="gp-stat-lbl">pontos</span>
        </div>
      </div>

      {loading && <div className="gp-empty card">Carregando…</div>}

      {!loading && summary.members.length === 0 && (
        <div className="gp-empty card">
          <TrendingUp size={28} />
          <p>Ninguém da equipe postou conteúdo este mês ainda.</p>
          <span>Incentive o time a usar o "Conteúdo do Dia" 🚀</span>
        </div>
      )}

      {/* Ranking completo */}
      {summary.members.length > 0 && (
        <div className="gp-rank card">
          <div className="gp-rank-head"><Medal size={16} /> Ranking da equipe</div>
          {summary.members.map((m, i) => (
            <div key={m.uid} className="gp-rank-row">
              <span className={`gp-pos gp-pos--${i < 3 ? i + 1 : 'n'}`}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
              </span>
              <span className="gp-name">{m.name}</span>
              {m.streak > 0 && <span className="gp-streak"><Flame size={11} /> {m.streak}</span>}
              <span className="gp-posts">{m.shares} posts</span>
              <span className="gp-pts">{m.points} pts</span>
            </div>
          ))}
        </div>
      )}

      {/* Inativos — pra cobrar */}
      {inativos.length > 0 && (
        <div className="gp-inactive card">
          <div className="gp-inactive-head">⚠️ Sem postar este mês ({inativos.length})</div>
          <div className="gp-inactive-list">
            {inativos.map(m => <span key={m.uid} className="gp-inactive-name">{m.name}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

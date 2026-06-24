import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Share2, Trophy, Medal, Flame, TrendingUp, Crosshair, RefreshCw } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getTeamSummary } from '../services/firestore/contentScores';
import { getTeamGapReport } from '../services/gapReport';
import { getWeeklyReport } from '../services/weeklyReport';
import type { WeeklyReport } from '../services/weeklyReport';
import type { TeamReport } from '../services/gapReport';
import type { TeamSummary } from '../services/firestore/contentScores';
import type { UserProfile } from '../types';
import './GestorPanel.css';

const GAP_BADGES: Record<string, string> = {
  produto: '📦 Produto',
  processo: '⚙️ Processo',
  abordagem: '🤝 Abordagem',
  'follow-up': '📞 Follow-up',
};

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

export default function GestorPanel() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [summary, setSummary] = useState<TeamSummary>({ totalPosts: 0, totalPoints: 0, activeMembers: 0, members: [] });
  const [loading, setLoading] = useState(true);
  const [gaps, setGaps] = useState<TeamReport | null>(null);
  const [gapsLoading, setGapsLoading] = useState(false);
  const [gapsError, setGapsError] = useState('');

  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState('');
  const [copiedWeekly, setCopiedWeekly] = useState(false);

  const generateWeekly = async () => {
    setWeeklyLoading(true);
    setWeeklyError('');
    try {
      setWeekly(await getWeeklyReport());
    } catch {
      setWeeklyError('Ainda não há atividade registrada pela equipe esta semana.');
    }
    setWeeklyLoading(false);
  };

  const copyWeekly = async () => {
    if (!weekly) return;
    try {
      await navigator.clipboard.writeText(weekly.mensagemGrupo);
      setCopiedWeekly(true);
      setTimeout(() => setCopiedWeekly(false), 1500);
    } catch { /* */ }
  };

  const generateGaps = async () => {
    setGapsLoading(true);
    setGapsError('');
    try {
      setGaps(await getTeamGapReport());
    } catch {
      setGapsError('Ainda não há casos registrados pela equipe (vendas/perdas). Os dados aparecem conforme o time usa o app.');
    }
    setGapsLoading(false);
  };

  const isGestor = profile.isAdmin === true || (profile.isGestor === true && profile.userAccessType !== 'marketing');

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

      {/* Relatório de segunda — pronto pra colar no grupo */}
      <div className="gp-gaps card">
        <div className="gp-rank-head"><TrendingUp size={16} /> Resumo da semana</div>
        {!weekly && !weeklyLoading && (
          <>
            <p className="gp-gaps-desc">A IA monta o resumo da semana da equipe — pronto pra colar no grupo — com destaque da semana e elogio pronto.</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={generateWeekly}>
              Gerar resumo da semana
            </button>
            {weeklyError && <p className="gp-gaps-error">{weeklyError}</p>}
          </>
        )}
        {weeklyLoading && <p className="gp-gaps-desc">Montando o resumo…</p>}
        {weekly && (
          <>
            <p className="gp-weekly-msg">{weekly.mensagemGrupo}</p>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 10 }} onClick={copyWeekly}>
              {copiedWeekly ? '✓ Copiado!' : 'Copiar mensagem pro grupo'}
            </button>
            <div className="gp-gap-row">
              <div className="gp-gap-top">
                <strong>🏆 Destaque: {weekly.destaque}</strong>
              </div>
              <p className="gp-gap-resumo">Elogio pronto (manda no privado): "{weekly.elogio}"</p>
            </div>
            <div className="gp-gap-row">
              <p className="gp-gap-rec">🎯 Foco da semana: {weekly.focoSemana}</p>
            </div>
          </>
        )}
      </div>

      {/* Mapa de gaps — por que cada vendedor ganha/perde */}
      <div className="gp-gaps card">
        <div className="gp-rank-head"><Crosshair size={16} /> Mapa de gaps da equipe</div>
        {!gaps && !gapsLoading && (
          <>
            <p className="gp-gaps-desc">A IA cruza as vendas e perdas registradas pela equipe e mostra o gap de cada vendedor: produto, processo, abordagem ou follow-up.</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={generateGaps}>
              Gerar análise da equipe
            </button>
            {gapsError && <p className="gp-gaps-error">{gapsError}</p>}
          </>
        )}
        {gapsLoading && <p className="gp-gaps-desc">Analisando os casos da equipe…</p>}
        {gaps && (
          <>
            <p className="gp-gaps-resumo">{gaps.resumoEquipe}</p>
            {gaps.porVendedor.map((s, i) => (
              <div key={i} className="gp-gap-row">
                <div className="gp-gap-top">
                  <strong>{s.nome}</strong>
                  <span className="gp-gap-badge">{GAP_BADGES[s.gap] || s.gap}</span>
                </div>
                <p className="gp-gap-resumo">{s.resumo}</p>
                <p className="gp-gap-rec">→ {s.recomendacao}</p>
              </div>
            ))}
            <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={generateGaps}>
              <RefreshCw size={13} /> Atualizar análise
            </button>
          </>
        )}
      </div>

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

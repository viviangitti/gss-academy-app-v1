import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Share2, Trophy, Medal, Flame, TrendingUp, Crosshair, RefreshCw, Camera } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getTeamSummary } from '../services/firestore/contentScores';
import { getTeamProofs } from '../services/firestore/contentProofs';
import type { TeamProof } from '../services/firestore/contentProofs';
import { getTeamGapReport } from '../services/gapReport';
import RadarChart from '../components/RadarChart';
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
  const [proofs, setProofs] = useState<TeamProof[]>([]);
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

  const isGestor = profile.isGestor === true || profile.isAdmin === true;

  useEffect(() => {
    if (!isGestor) return;
    getTeamSummary(profile.company || '', profile.segment || '', monthKey())
      .then(setSummary)
      .finally(() => setLoading(false));
    getTeamProofs(profile.company || '', monthKey())
      .then(setProofs)
      .catch(() => {});
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
          <h2>Raio X do Time</h2>
          <p>Diagnóstico e engajamento da equipe — {mes}</p>
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

      {/* Comprovação de posts — prints que a equipe anexou */}
      {proofs.length > 0 && (
        <div className="gp-proofs card">
          <div className="gp-rank-head"><Camera size={16} /> Comprovação de posts ({proofs.length})</div>
          <div className="gp-proofs-grid">
            {proofs.map(p => (
              <a key={p.id} href={p.imageUrl} target="_blank" rel="noopener noreferrer" className="gp-proof-item" title={`${p.name} — toque pra ampliar`}>
                <img src={p.imageUrl} alt={`Post de ${p.name}`} loading="lazy" />
                <span className="gp-proof-name">{p.name}</span>
              </a>
            ))}
          </div>
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
            {gaps.competencias?.length >= 3 && (
              <div className="gp-team-radar">
                <div className="gp-radar-title"><Crosshair size={14} /> Raio X do time</div>
                <RadarChart items={gaps.competencias.map(c => ({ label: c.nome, value: c.nota }))} benchmark={80} />
                <div className="gp-radar-legend">
                  <span><span className="gp-rl-swatch gp-rl-team" /> Seu time</span>
                  <span><span className="gp-rl-swatch gp-rl-bench" /> Time com Maestria</span>
                </div>
              </div>
            )}
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

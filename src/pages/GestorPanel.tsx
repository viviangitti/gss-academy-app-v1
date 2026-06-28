import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Medal, Flame, TrendingUp, Crosshair, RefreshCw, Camera, Radar, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getTeamSummary } from '../services/firestore/contentScores';
import { getTeamProofs } from '../services/firestore/contentProofs';
import { fetchRecentCases } from '../services/firestore/salesCases';
import type { SalesCase } from '../services/firestore/salesCases';
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
  produto: '📦 Produto', processo: '⚙️ Processo', abordagem: '🤝 Abordagem', 'follow-up': '📞 Follow-up',
};

function monthKey() { return new Date().toISOString().slice(0, 7); }
function msOf(c: SalesCase): number {
  const ts = c.createdAt as { toMillis?: () => number; seconds?: number } | undefined;
  return ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);
}
function determinante(c: SalesCase): string {
  const a = (c.approach || '').replace(/^Determinante pra venda:\s*/i, '').replace(/^Follow-up:.*/i, '').trim();
  return a || 'Não informado';
}

export default function GestorPanel() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const isGestor = profile.isGestor === true || profile.isAdmin === true;

  const [summary, setSummary] = useState<TeamSummary>({ totalPosts: 0, totalPoints: 0, activeMembers: 0, members: [] });
  const [proofs, setProofs] = useState<TeamProof[]>([]);
  const [cases, setCases] = useState<SalesCase[]>([]);
  const [perfPeriod, setPerfPeriod] = useState<7 | 30>(30);

  const [gaps, setGaps] = useState<TeamReport | null>(null);
  const [gapsLoading, setGapsLoading] = useState(false);
  const [gapsError, setGapsError] = useState('');

  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState('');
  const [copiedWeekly, setCopiedWeekly] = useState(false);

  useEffect(() => {
    if (!isGestor) return;
    getTeamSummary(profile.company || '', profile.segment || '', monthKey()).then(setSummary).catch(() => {});
    getTeamProofs(profile.company || '', monthKey()).then(setProofs).catch(() => {});
    fetchRecentCases(profile.company || '', 200).then(setCases).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateGaps = async () => {
    setGapsLoading(true); setGapsError('');
    try { setGaps(await getTeamGapReport()); }
    catch { setGapsError('Ainda não há casos suficientes registrados pela equipe. O diagnóstico aparece conforme o time registra vendas e perdas.'); }
    setGapsLoading(false);
  };

  const generateWeekly = async () => {
    setWeeklyLoading(true); setWeeklyError('');
    try { setWeekly(await getWeeklyReport()); }
    catch { setWeeklyError('Ainda não há atividade registrada pela equipe esta semana.'); }
    setWeeklyLoading(false);
  };

  const copyWeekly = async () => {
    if (!weekly) return;
    try { await navigator.clipboard.writeText(weekly.mensagemGrupo); setCopiedWeekly(true); setTimeout(() => setCopiedWeekly(false), 1500); } catch { /* */ }
  };

  if (!isGestor) {
    return (
      <div className="gp-page">
        <div className="gp-restricted card">
          <Users size={40} /><h3>Acesso restrito</h3>
          <p>Esta área é exclusiva para gestores de equipe.</p>
          <button onClick={() => navigate('/')}>Voltar ao início</button>
        </div>
      </div>
    );
  }

  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const inativos = summary.members.filter(m => (m.shares || 0) === 0);

  // Competências: pontos fortes e gaps a partir do radar
  const comps = gaps?.competencias || [];
  const sortedComps = [...comps].sort((a, b) => b.nota - a.nota);
  const fortes = sortedComps.slice(0, 2);
  const fracos = sortedComps.slice(-2).reverse();

  // Performance: ganhos/perdas no período
  const cut = Date.now() - perfPeriod * 86400000;
  const pc = cases.filter(c => msOf(c) >= cut);
  const won = pc.filter(c => c.kind === 'won');
  const lost = pc.filter(c => c.kind === 'lost');
  const totConc = won.length + lost.length;
  const taxaSucesso = totConc ? Math.round((won.length / totConc) * 100) : 0;
  const taxaInsucesso = totConc ? 100 - taxaSucesso : 0;
  const agg = (arr: SalesCase[], keyer: (c: SalesCase) => string) => {
    const m = new Map<string, number>();
    arr.forEach(c => { const k = keyer(c); m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const motivosSucesso = agg(won, determinante);
  const motivosPerda = agg(lost, c => (c.reason || 'Não informado').trim());

  return (
    <div className="gp-page">
      <div className="gp-hero card">
        <Users size={22} />
        <div>
          <h2>Raio X do Time</h2>
          <p>Perfil e performance da equipe — {mes}</p>
        </div>
      </div>

      {/* 1. COMPETÊNCIAS — gráfico aranha (time × Executivo com Maestria) */}
      <div className="gp-section card">
        <div className="gp-rank-head"><Radar size={16} /> Competências</div>
        <p className="gp-sec-sub">Time × Executivo com Maestria em Vendas</p>
        {!gaps && !gapsLoading && (
          <>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={generateGaps}>Gerar diagnóstico do time</button>
            {gapsError && <p className="gp-gaps-error">{gapsError}</p>}
          </>
        )}
        {gapsLoading && <p className="gp-gaps-desc">Analisando os casos da equipe…</p>}
        {gaps && comps.length >= 3 && (
          <div className="gp-team-radar">
            <RadarChart items={comps.map(c => ({ label: c.nome, value: c.nota }))} benchmark={85} />
            <div className="gp-radar-legend">
              <span><span className="gp-rl-swatch gp-rl-team" /> Seu time</span>
              <span><span className="gp-rl-swatch gp-rl-bench" /> Executivo com Maestria</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. GAPS & PONTOS FORTES */}
      {gaps && (
        <div className="gp-section card">
          <div className="gp-rank-head"><Crosshair size={16} /> Principais GAPs e Pontos Fortes</div>
          <p className="gp-gaps-resumo">{gaps.resumoEquipe}</p>
          {comps.length >= 3 && (
            <div className="gp-sf-grid">
              <div className="gp-sf gp-sf-strong">
                <span className="gp-sf-title">💪 Pontos fortes</span>
                {fortes.map(c => <span key={c.nome} className="gp-sf-item">{c.nome} <b>{c.nota}</b></span>)}
              </div>
              <div className="gp-sf gp-sf-gap">
                <span className="gp-sf-title">🎯 Principais GAPs</span>
                {fracos.map(c => <span key={c.nome} className="gp-sf-item">{c.nome} <b>{c.nota}</b></span>)}
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
            <RefreshCw size={13} /> Atualizar diagnóstico
          </button>
        </div>
      )}

      {/* 3. PERFORMANCE — vendeu/perdeu + taxas + motivos */}
      <div className="gp-section card">
        <div className="gp-rank-head"><BarChart3 size={16} /> Performance</div>
        <div className="gp-period">
          <button className={perfPeriod === 7 ? 'on' : ''} onClick={() => setPerfPeriod(7)}>7 dias</button>
          <button className={perfPeriod === 30 ? 'on' : ''} onClick={() => setPerfPeriod(30)}>30 dias</button>
        </div>
        {totConc === 0 ? (
          <p className="gp-gaps-desc">Nenhuma venda/perda registrada nesse período. As taxas aparecem conforme o time registra os fechamentos.</p>
        ) : (
          <>
            <div className="gp-perf-rates">
              <div className="gp-perf-rate success">
                <CheckCircle2 size={16} />
                <span className="gp-perf-pct">{taxaSucesso}%</span>
                <span className="gp-perf-lbl">sucesso · {won.length} vendeu</span>
              </div>
              <div className="gp-perf-rate fail">
                <XCircle size={16} />
                <span className="gp-perf-pct">{taxaInsucesso}%</span>
                <span className="gp-perf-lbl">insucesso · {lost.length} perdeu</span>
              </div>
            </div>
            <div className="gp-perf-motivos">
              <span className="gp-perf-mtitle">✅ Por que venderam</span>
              {motivosSucesso.length ? motivosSucesso.map(([r, n]) => (
                <div key={r} className="gp-perf-row"><span>{r}</span><b>{n}</b></div>
              )) : <p className="gp-perf-none">Registre o determinante de cada venda pra ver os motivos.</p>}
            </div>
            <div className="gp-perf-motivos">
              <span className="gp-perf-mtitle">❌ Por que perderam</span>
              {motivosPerda.length ? motivosPerda.map(([r, n]) => (
                <div key={r} className="gp-perf-row"><span>{r}</span><b>{n}</b></div>
              )) : <p className="gp-perf-none">Sem motivos de perda registrados.</p>}
            </div>
          </>
        )}
      </div>

      {/* 4. RESUMO GERAL DA SEMANA */}
      <div className="gp-section card">
        <div className="gp-rank-head"><TrendingUp size={16} /> Resumo geral da semana</div>
        {!weekly && !weeklyLoading && (
          <>
            <p className="gp-gaps-desc">A IA monta o resumo da semana — pronto pra colar no grupo — com destaque e elogio.</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={generateWeekly}>Gerar resumo da semana</button>
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
              <div className="gp-gap-top"><strong>🏆 Destaque: {weekly.destaque}</strong></div>
              <p className="gp-gap-resumo">Elogio pronto (manda no privado): "{weekly.elogio}"</p>
            </div>
            <div className="gp-gap-row"><p className="gp-gap-rec">🎯 Foco da semana: {weekly.focoSemana}</p></div>
          </>
        )}
      </div>

      {/* Engajamento em conteúdo (secundário) */}
      {summary.members.length > 0 && (
        <div className="gp-section card">
          <div className="gp-rank-head"><Medal size={16} /> Engajamento em conteúdo</div>
          {summary.members.map((m, i) => (
            <div key={m.uid} className="gp-rank-row">
              <span className={`gp-pos gp-pos--${i < 3 ? i + 1 : 'n'}`}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
              <span className="gp-name">{m.name}</span>
              {m.streak > 0 && <span className="gp-streak"><Flame size={11} /> {m.streak}</span>}
              <span className="gp-posts">{m.shares} posts</span>
              <span className="gp-pts">{m.points} pts</span>
            </div>
          ))}
          {inativos.length > 0 && (
            <p className="gp-inactive-inline">⚠️ Sem postar este mês: {inativos.map(m => m.name).join(', ')}</p>
          )}
        </div>
      )}

      {proofs.length > 0 && (
        <div className="gp-section card">
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
    </div>
  );
}

// Briefing do Dia — a tela de 30 segundos que abre o dia do vendedor.
// Meta em R$ (quanto falta, quanto por dia útil), follow-ups de hoje,
// condição mais recente e a comissão em jogo na carteira.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Target, CalendarClock, Tag, Wallet, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { getMonthWins, hasAnyWin } from '../services/wins';
import { loadData, KEYS } from '../services/storage';
import { getStats } from '../services/goal';
import { getDueFollowUps, getPipelineValue } from '../services/followups';
import { getActiveConditionsForMonth } from '../services/firestore/commercialConditions';
import type { UserProfile } from '../types';
import './DailyBriefing.css';

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

/** Dias úteis (seg-sáb — concessionária abre sábado) restantes no mês, incluindo hoje. */
function workdaysLeft(): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let count = 0;
  for (let d = now.getDate(); d <= last; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), d).getDay();
    if (day !== 0) count++; // exclui domingo
  }
  return Math.max(1, count);
}

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function DailyBriefing() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => localStorage.getItem('gss_brief_collapsed') !== '1');
  const [latestCondition, setLatestCondition] = useState('');

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const goal = profile.monthlyGoal || 0;
  const stats = goal > 0 ? getStats(goal) : null;
  const due = getDueFollowUps();
  const dueCount = due.today.length + due.overdue.length;
  const pipeline = getPipelineValue();
  const daysLeft = workdaysLeft();

  useEffect(() => {
    getActiveConditionsForMonth(monthKey(), profile.segment || undefined, profile.company || '')
      .then(conds => {
        if (conds.length) setLatestCondition(conds[0].title);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem('gss_brief_collapsed', next ? '0' : '1');
  };

  const rows: { icon: React.ReactNode; text: React.ReactNode; to: string }[] = [];

  if (stats && goal > 0) {
    const remaining = Math.max(0, goal - stats.monthSales);
    rows.push({
      icon: <Target size={15} />,
      to: '/vendas',
      text: remaining > 0
        ? <>Faltam <strong>{brl(remaining)}</strong> pra meta — <strong>{brl(Math.ceil(remaining / daysLeft))}</strong>/dia útil ({daysLeft} dias)</>
        : <><strong>Meta batida! 🏆</strong> Agora é recorde: cada venda é lucro seu</>,
    });
  }

  rows.push({
    icon: <CalendarClock size={15} />,
    to: '/follow-ups',
    text: dueCount > 0
      ? <><strong>{dueCount} follow-up{dueCount > 1 ? 's' : ''}</strong> pra fazer hoje{due.overdue.length > 0 ? <> ({due.overdue.length} atrasado{due.overdue.length > 1 ? 's' : ''}!)</> : null}</>
      : <>Nenhum follow-up hoje — <strong>registre seus atendimentos</strong> pra não perder retorno</>,
  });

  if (pipeline.totalCommission > 0) {
    rows.push({
      icon: <Wallet size={15} />,
      to: '/follow-ups',
      text: <><strong>{brl(pipeline.totalCommission)}</strong> de comissão em jogo na sua carteira ({pipeline.count} cliente{pipeline.count > 1 ? 's' : ''})</>,
    });
  }

  if (latestCondition) {
    rows.push({
      icon: <Tag size={15} />,
      to: '/condicoes',
      text: <>Munição do mês: <strong>{latestCondition}</strong></>,
    });
  }

  // Placar de ganho: o ROI do app em números — por que continuar usando
  if (hasAnyWin()) {
    const w = getMonthWins();
    const bits: string[] = [];
    if (w.boostWins) bits.push(`${w.boostWins} objeç${w.boostWins > 1 ? 'ões viradas' : 'ão virada'} no Boost`);
    if (w.fuWon) bits.push(`${w.fuWon} venda${w.fuWon > 1 ? 's' : ''} via follow-up${w.fuCommission ? ` (${brl(w.fuCommission)})` : ''}`);
    if (w.rescuesSent) bits.push(`${w.rescuesSent} resgate${w.rescuesSent > 1 ? 's' : ''} enviado${w.rescuesSent > 1 ? 's' : ''}`);
    rows.push({
      icon: <Trophy size={15} />,
      to: '/historico',
      text: <>Este mês o app te ajudou: <strong>{bits.join(' · ')}</strong></>,
    });
  }

  if (!rows.length) return null;

  return (
    <div className="brief card" data-tour="briefing">
      <button className="brief-head" onClick={toggle}>
        <span className="brief-title"><Sun size={16} /> Resumo do dia</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="brief-rows">
          {rows.map((r, i) => (
            <button key={i} className="brief-row" onClick={() => navigate(r.to)}>
              <span className="brief-row-icon">{r.icon}</span>
              <span className="brief-row-text">{r.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

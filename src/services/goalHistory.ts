// Histórico de meta × realizado por mês.
// Quando o mês vira, congela o resultado do mês anterior (volume + por modelo).
// Usa um "snapshot" da meta vigente durante o mês, já que a meta no perfil
// é um alvo único (não guarda histórico por si só).
import { getSales } from './goal';
import type { ModelGoal } from '../types';

export interface MonthModelResult { model: string; target: number; count: number }
export interface MonthResult {
  monthKey: string;        // "2026-05"
  goal: number;            // meta de volume daquele mês
  count: number;           // vendas realizadas
  total: number;           // faturamento (R$)
  models: MonthModelResult[];
}

interface Snapshot { month: string; goal: number; modelGoals: ModelGoal[] }

const HISTORY_KEY = 'gss_goal_history';
const SNAPSHOT_KEY = 'gss_goal_snapshot';

function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadHistory(): Record<string, MonthResult> {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}'); } catch { return {}; }
}

function salesForMonth(mk: string) {
  return getSales().filter(s => (s.date || '').startsWith(mk));
}

function computeResult(snap: Snapshot): MonthResult {
  const sales = salesForMonth(snap.month);
  const models = (snap.modelGoals || [])
    .filter(g => g.model && g.model.trim() && g.target > 0)
    .map(g => {
      const key = g.model.trim().toLowerCase();
      return { model: g.model.trim(), target: g.target, count: sales.filter(s => (s.model || '').toLowerCase().includes(key)).length };
    });
  return {
    monthKey: snap.month,
    goal: snap.goal,
    count: sales.length,
    total: sales.reduce((sum, s) => sum + (s.amount || 0), 0),
    models,
  };
}

/**
 * Chamar no carregamento do app. Se o mês virou desde a última visita, congela
 * o resultado do mês anterior no histórico. Sempre atualiza o snapshot com a
 * meta vigente do mês atual.
 */
export function archiveIfNeeded(profile: { monthlyGoal?: number; modelGoals?: ModelGoal[] }): void {
  const cur = monthKey();
  let snap: Snapshot | null = null;
  try { snap = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null'); } catch { snap = null; }

  if (snap && snap.month !== cur && (snap.goal > 0 || (snap.modelGoals || []).length > 0)) {
    const history = loadHistory();
    history[snap.month] = computeResult(snap);
    // mantém só os últimos 12 meses
    const keys = Object.keys(history).sort().slice(-12);
    const trimmed: Record<string, MonthResult> = {};
    keys.forEach(k => { trimmed[k] = history[k]; });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  }

  const next: Snapshot = { month: cur, goal: profile.monthlyGoal || 0, modelGoals: profile.modelGoals || [] };
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
}

/** Histórico de meses fechados, mais recente primeiro. */
export function getGoalHistory(): MonthResult[] {
  return Object.values(loadHistory()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export function formatMonthLabel(mk: string): string {
  const [y, m] = mk.split('-').map(Number);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[(m || 1) - 1]}/${y}`;
}

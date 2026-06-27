// Meta mensal e histórico de vendas registradas
import { auth } from './firebase';
import { pushData } from './firestore/sync';
import { logCase } from './firestore/salesCases';

function syncSales(sales: Sale[]) {
  const uid = auth?.currentUser?.uid;
  if (uid) pushData(uid, 'sales', sales).catch(() => {});
}

export interface Sale {
  id: string;
  amount: number;       // valor total da venda (opcional — pra faturamento/ticket)
  model?: string;       // modelo vendido (ex: "Corolla Cross XRE")
  client: string;
  date: string; // ISO
  notes?: string;
  area?: string;        // área de negócio (Veículo, Financiamento, Seguro...)
}

/** Áreas de negócio pra classificar vendas e perdas. */
export const BUSINESS_AREAS = ['Veículo', 'Financiamento', 'Seguro', 'Acessórios', 'Outro'];

export interface GoalStats {
  goal: number;                // meta de vendas (QUANTIDADE) no mês
  monthCount: number;          // vendas fechadas no mês (puxa o progresso)
  monthTotal: number;          // valor vendido no mês (faturamento, referência)
  progress: number; // 0-100
  daysLeft: number;
  remaining: number;           // vendas faltando pra meta
  pace: 'atras' | 'no_ritmo' | 'adiantado' | 'sem_meta';
}

const SALES_KEY = 'gss_sales';

function monthPrefix(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getSales(): Sale[] {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSale(opts: { amount?: number; client: string; model?: string; notes?: string; area?: string }): Sale {
  const { amount = 0, client, model, notes, area } = opts;
  const sale: Sale = {
    id: generateId(),
    amount,
    model,
    client,
    notes,
    area,
    date: new Date().toISOString(),
  };
  const sales = getSales();
  sales.push(sale);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  syncSales(sales);

  // Cérebro coletivo: a venda vira um caso anônimo da empresa
  try {
    const profile = JSON.parse(localStorage.getItem('gss_profile') || '{}');
    if (profile.company) {
      logCase({
        kind: 'won',
        authorName: profile.name || '',
        company: profile.company,
        segment: profile.segment || '',
        approach: notes || undefined,
        value: amount || undefined,
      });
    }
  } catch { /* sem perfil — ignora */ }

  return sale;
}

export function removeSale(id: string): void {
  const sales = getSales().filter(s => s.id !== id);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  syncSales(sales);
}

export function getCurrentMonthSales(): Sale[] {
  const prefix = monthPrefix();
  return getSales().filter(s => s.date.startsWith(prefix));
}

export function getStats(goal: number): GoalStats {
  const rawSales = getCurrentMonthSales();
  const monthCount = rawSales.length;
  const monthTotal = rawSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  const progress = goal > 0 ? Math.min((monthCount / goal) * 100, 100) : 0;

  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.max(0, lastDay.getDate() - now.getDate());

  const remaining = Math.max(0, goal - monthCount);

  let pace: GoalStats['pace'] = 'sem_meta';
  if (goal > 0) {
    const dayOfMonth = now.getDate();
    const totalDays = lastDay.getDate();
    const expectedProgress = (dayOfMonth / totalDays) * 100;
    if (progress >= expectedProgress + 5) pace = 'adiantado';
    else if (progress >= expectedProgress - 10) pace = 'no_ritmo';
    else pace = 'atras';
  }

  return {
    goal,
    monthCount,
    monthTotal,
    progress,
    daysLeft,
    remaining,
    pace,
  };
}

/** Modelo base: tira o sufixo de versão (XRE, SRX, XLS, GR…) mas mantém nomes
 * compostos (ex: "Corolla Cross XRE" -> "Corolla Cross"; "Hilux SRX" -> "Hilux"). */
export function baseModel(model?: string): string {
  const words = (model || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words.join(' ');
  const last = words[words.length - 1];
  const isTrim = /\d/.test(last) || last === last.toUpperCase() || last.length <= 4;
  return (isTrim ? words.slice(0, -1) : words).join(' ');
}

export interface ModelGoalProgress { model: string; target: number; count: number }

/** Progresso por modelo no mês: conta vendas cujo modelo casa (contém) o alvo. */
export function getModelProgress(goals: { model: string; target: number }[]): ModelGoalProgress[] {
  const sales = getCurrentMonthSales();
  return goals
    .filter(g => g.model && g.model.trim())
    .map(g => {
      const key = g.model.trim().toLowerCase();
      const count = sales.filter(s => (s.model || '').toLowerCase().includes(key)).length;
      return { model: g.model.trim(), target: g.target, count };
    });
}

export type Period = 'dia' | 'semana' | 'mes' | 'ano';

export function getSalesByPeriod(period: Period): Sale[] {
  const now = new Date();
  return getSales().filter(s => {
    const d = new Date(s.date);
    if (period === 'dia') return d.toDateString() === now.toDateString();
    if (period === 'semana') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return d >= weekStart;
    }
    if (period === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'ano') return d.getFullYear() === now.getFullYear();
    return false;
  });
}

export function getPeriodStats(period: Period): { total: number; count: number; average: number } {
  const sales = getSalesByPeriod(period);
  const total = sales.reduce((s, x) => s + (x.amount || 0), 0);
  const count = sales.length;
  const average = count > 0 ? total / count : 0;  // ticket médio
  return { total, count, average };
}

// Dados para gráfico mensal (vendas acumuladas por dia)
export function getMonthChartData(): { label: string; value: number }[] {
  const sales = getSalesByPeriod('mes').sort((a, b) => a.date.localeCompare(b.date));
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = now.getDate();
  const result: { label: string; value: number }[] = [];
  let acc = 0;
  let idx = 0;
  for (let d = 1; d <= Math.min(today, lastDay); d++) {
    while (idx < sales.length && new Date(sales[idx].date).getDate() <= d) {
      acc += 1;
      idx++;
    }
    result.push({ label: String(d), value: acc });
  }
  return result;
}

// Dados para gráfico anual (vendas acumuladas por mês)
export function getYearChartData(): { label: string; value: number }[] {
  const sales = getSalesByPeriod('ano');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const result: { label: string; value: number }[] = [];
  let acc = 0;
  for (let m = 0; m <= now.getMonth(); m++) {
    const monthCount = sales.filter(s => new Date(s.date).getMonth() === m).length;
    acc += monthCount;
    result.push({ label: months[m], value: acc });
  }
  return result;
}

// Dados para gráfico semanal (vendas acumuladas por dia da semana)
export function getWeekChartData(): { label: string; value: number }[] {
  const sales = getSalesByPeriod('semana');
  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const now = new Date();
  const result: { label: string; value: number }[] = [];
  let acc = 0;
  for (let d = 0; d <= now.getDay(); d++) {
    const dayCount = sales.filter(s => new Date(s.date).getDay() === d).length;
    acc += dayCount;
    result.push({ label: labels[d], value: acc });
  }
  return result;
}

// Agrupa vendas por dia do mês atual para gráfico (vendas acumuladas)
export function getDailyAccumulation(): { day: number; accumulated: number }[] {
  const sales = getCurrentMonthSales().sort((a, b) => a.date.localeCompare(b.date));
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const todayDay = now.getDate();

  const result: { day: number; accumulated: number }[] = [];
  let acc = 0;
  let saleIdx = 0;

  for (let d = 1; d <= Math.min(todayDay, lastDay); d++) {
    while (saleIdx < sales.length) {
      const saleDay = new Date(sales[saleIdx].date).getDate();
      if (saleDay <= d) {
        acc += 1;
        saleIdx++;
      } else break;
    }
    result.push({ day: d, accumulated: acc });
  }

  return result;
}

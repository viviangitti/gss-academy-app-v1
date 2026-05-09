// Meta mensal e histórico de vendas registradas
import { auth } from './firebase';
import { pushData } from './firestore/sync';

function syncSales(sales: Sale[]) {
  const uid = auth?.currentUser?.uid;
  if (uid) pushData(uid, 'sales', sales).catch(() => {});
}

export interface Sale {
  id: string;
  amount: number;       // valor total da venda
  commission: number;   // comissão do vendedor nessa venda
  client: string;
  date: string; // ISO
  notes?: string;
}

export interface GoalStats {
  goal: number;                // meta de comissão
  monthCommission: number;     // comissão acumulada no mês
  monthTotal: number;          // valor vendido no mês (referência)
  monthCount: number;
  progress: number; // 0-100
  daysLeft: number;
  pace: 'atras' | 'no_ritmo' | 'adiantado' | 'sem_meta';
  dailyTarget: number;
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

export function addSale(amount: number, commission: number, client: string, notes?: string): Sale {
  const sale: Sale = {
    id: generateId(),
    amount,
    commission,
    client,
    notes,
    date: new Date().toISOString(),
  };
  const sales = getSales();
  const normalized = sales.map(s => ({ ...s, commission: s.commission ?? 0 }));
  normalized.push(sale);
  localStorage.setItem(SALES_KEY, JSON.stringify(normalized));
  syncSales(normalized);
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
  const monthSales = getCurrentMonthSales();
  const monthCommission = monthSales.reduce((sum, s) => sum + (s.commission ?? 0), 0);
  const monthTotal = monthSales.reduce((sum, s) => sum + s.amount, 0);
  const progress = goal > 0 ? Math.min((monthCommission / goal) * 100, 100) : 0;

  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.max(0, lastDay.getDate() - now.getDate());

  const remaining = Math.max(0, goal - monthCommission);
  const dailyTarget = daysLeft > 0 ? remaining / daysLeft : remaining;

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
    monthCommission,
    monthTotal,
    monthCount: monthSales.length,
    progress,
    daysLeft,
    pace,
    dailyTarget,
  };
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

export function getPeriodStats(period: Period): { total: number; commission: number; count: number; average: number } {
  const sales = getSalesByPeriod(period);
  const total = sales.reduce((s, x) => s + x.amount, 0);
  const commission = sales.reduce((s, x) => s + (x.commission ?? 0), 0);
  const count = sales.length;
  const average = count > 0 ? total / count : 0;
  return { total, commission, count, average };
}

// Dados para gráfico mensal (comissão acumulada por dia)
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
      acc += (sales[idx].commission ?? 0);
      idx++;
    }
    result.push({ label: String(d), value: acc });
  }
  return result;
}

// Dados para gráfico anual (comissão acumulada por mês)
export function getYearChartData(): { label: string; value: number }[] {
  const sales = getSalesByPeriod('ano');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const result: { label: string; value: number }[] = [];
  let acc = 0;
  for (let m = 0; m <= now.getMonth(); m++) {
    const monthTotal = sales
      .filter(s => new Date(s.date).getMonth() === m)
      .reduce((sum, s) => sum + (s.commission ?? 0), 0);
    acc += monthTotal;
    result.push({ label: months[m], value: acc });
  }
  return result;
}

// Dados para gráfico semanal (comissão acumulada por dia da semana)
export function getWeekChartData(): { label: string; value: number }[] {
  const sales = getSalesByPeriod('semana');
  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const now = new Date();
  const result: { label: string; value: number }[] = [];
  let acc = 0;
  for (let d = 0; d <= now.getDay(); d++) {
    const dayTotal = sales
      .filter(s => new Date(s.date).getDay() === d)
      .reduce((sum, s) => sum + (s.commission ?? 0), 0);
    acc += dayTotal;
    result.push({ label: labels[d], value: acc });
  }
  return result;
}

// Agrupa vendas por dia do mês atual para gráfico
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
        acc += (sales[saleIdx].commission ?? 0);
        saleIdx++;
      } else break;
    }
    result.push({ day: d, accumulated: acc });
  }

  return result;
}

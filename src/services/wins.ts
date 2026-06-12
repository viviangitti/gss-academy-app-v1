// Placar de ganho: registra quando um recurso do app AJUDOU de verdade.
// É o "por que usar" visível — o vendedor vê o ROI do app em reais.
// Regra de ouro: só conta o que está registrado no app.

export interface MonthWins {
  boostWins: number;       // objeções contornadas com o Boost ("Funcionou!")
  rescuesSent: number;     // mensagens de resgate enviadas/copiadas
  fuWon: number;           // vendas fechadas via follow-up
  fuCommission: number;    // comissão dessas vendas
}

const KEY = 'gss_wins';

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function load(): Record<string, MonthWins> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function getMonthWins(): MonthWins {
  const all = load();
  return all[monthKey()] || { boostWins: 0, rescuesSent: 0, fuWon: 0, fuCommission: 0 };
}

export function addWin(kind: 'boost' | 'rescue' | 'fuWon', commission = 0): void {
  const all = load();
  const mk = monthKey();
  const m = all[mk] || { boostWins: 0, rescuesSent: 0, fuWon: 0, fuCommission: 0 };
  if (kind === 'boost') m.boostWins++;
  else if (kind === 'rescue') m.rescuesSent++;
  else { m.fuWon++; m.fuCommission += commission; }
  all[mk] = m;
  // guarda só os últimos 3 meses
  const keys = Object.keys(all).sort().slice(-3);
  const trimmed: Record<string, MonthWins> = {};
  keys.forEach(k => { trimmed[k] = all[k]; });
  localStorage.setItem(KEY, JSON.stringify(trimmed));
}

export function hasAnyWin(): boolean {
  const m = getMonthWins();
  return m.boostWins > 0 || m.rescuesSent > 0 || m.fuWon > 0;
}

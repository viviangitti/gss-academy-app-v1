// Follow-ups: os clientes do vendedor moram no app.
// Cada atendimento vira um card com próximo passo + data. É a fundação do
// Briefing do Dia, do Rescue e da comissão projetada.
import { auth } from './firebase';
import { pushData } from './firestore/sync';

export type FollowUpStage = 'novo' | 'negociando' | 'proposta' | 'esfriou';

export interface FollowUp {
  id: string;
  clientName: string;
  interest: string;        // carro/produto de interesse (ex: "XC60 usado")
  stage: FollowUpStage;
  note?: string;           // em que pé parou
  nextAction: string;      // ex: "Ligar", "Mandar proposta"
  nextDate: string;        // YYYY-MM-DD
  estValue?: number;       // valor estimado da venda
  estCommission?: number;  // comissão estimada
  createdAt: number;
  updatedAt: number;
  lastTouchAt?: number;    // último contato real
  outcome?: 'won' | 'lost';   // definido ao encerrar
  closedAt?: number;
}

export const STAGE_LABELS: Record<FollowUpStage, string> = {
  novo: 'Novo contato',
  negociando: 'Negociando',
  proposta: 'Proposta enviada',
  esfriou: 'Esfriou',
};

const KEY = 'gss_followups';
const MAX = 200;

function sync(items: FollowUp[]) {
  const uid = auth?.currentUser?.uid;
  if (uid) pushData(uid, 'followups', items).catch(() => {});
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function save(items: FollowUp[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX)));
  sync(items);
}

export function getFollowUps(): FollowUp[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Abertos (não fechados), ordenados por data do próximo passo. */
export function getOpenFollowUps(): FollowUp[] {
  return getFollowUps()
    .filter(f => !f.outcome)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

export function addFollowUp(data: Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>): FollowUp {
  const item: FollowUp = { ...data, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
  const all = getFollowUps();
  all.push(item);
  save(all);
  return item;
}

export function updateFollowUp(id: string, patch: Partial<FollowUp>): void {
  const all = getFollowUps().map(f =>
    f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f
  );
  save(all);
}

export function removeFollowUp(id: string): void {
  save(getFollowUps().filter(f => f.id !== id));
}

/** Encerra: ganhou ou perdeu (a página conecta com vendas/vendas perdidas). */
export function closeFollowUp(id: string, outcome: 'won' | 'lost'): FollowUp | null {
  const f = getFollowUps().find(x => x.id === id) || null;
  if (f) updateFollowUp(id, { outcome, closedAt: Date.now() });
  return f;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Follow-ups de hoje + atrasados (o que o vendedor precisa fazer HOJE). */
export function getDueFollowUps(): { today: FollowUp[]; overdue: FollowUp[] } {
  const t = todayStr();
  const open = getOpenFollowUps();
  return {
    today: open.filter(f => f.nextDate === t),
    overdue: open.filter(f => f.nextDate < t),
  };
}

/** Comissão estimada dos follow-ups em aberto (alimenta "quanto vale sua carteira"). */
export function getPipelineValue(): { count: number; totalValue: number; totalCommission: number } {
  const open = getOpenFollowUps();
  return {
    count: open.length,
    totalValue: open.reduce((s, f) => s + (f.estValue || 0), 0),
    totalCommission: open.reduce((s, f) => s + (f.estCommission || 0), 0),
  };
}

/** Esfriados: sem contato há 5+ dias (candidatos a Rescue). */
export function getColdFollowUps(days = 5): FollowUp[] {
  const cutoff = Date.now() - days * 86400000;
  return getOpenFollowUps().filter(f => (f.lastTouchAt || f.updatedAt) < cutoff);
}

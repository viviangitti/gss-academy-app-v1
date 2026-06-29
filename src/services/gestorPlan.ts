// Plano da semana do gestor: transforma a Maestria em AÇÃO.
// Junta rituais de gestão (sempre) + sinais reais do time (quem está parado,
// destaque) e deixa cada item marcável. Reseta a cada semana.
import { currentWeekKey } from './socialContent';
import type { TeamSummary } from './firestore/contentScores';

export interface PlanItem {
  id: string;
  text: string;
  detail?: string;
  link?: string;     // rota pra agir (opcional)
}

const KEY = 'gss_gestor_plan';

/** Ações-base de gestão (sempre presentes — as que sustentam o ritmo do time). */
const BASE: PlanItem[] = [
  { id: 'reuniao', text: 'Rode a reunião da semana com o time', detail: 'Alinhe foco e meta — 15 min', link: '/rituais-gestor' },
  { id: 'reconhecer', text: 'Reconheça publicamente 1 destaque', detail: 'Quem é reconhecido, repete' },
  { id: 'um-a-um', text: 'Tenha 1 conversa 1:1 com quem precisa', detail: 'Treine a conversa antes', link: '/treino-lideranca' },
  { id: 'gap', text: 'Aja no gap nº1 do time', detail: 'Veja o Raio X e defina 1 treino', link: '/painel-gestor' },
];

/** Monta o plano da semana, enriquecido com dados reais do time quando houver.
 *  `selfName` (o próprio gestor) é SEMPRE excluído — nunca aparece no plano. */
export function buildPlan(summary?: TeamSummary | null, selfName?: string): PlanItem[] {
  const plan: PlanItem[] = BASE.map(p => ({ ...p }));
  const me = (selfName || '').trim().toLowerCase();
  const isMe = (n?: string) => !!me && (n || '').trim().toLowerCase() === me;

  if (summary && summary.members.length) {
    const others = summary.members.filter(m => !isMe(m.name));
    // Destaque do mês → personaliza o reconhecimento (nunca o próprio gestor)
    const top = others.find(m => (m.points || 0) > 0);
    if (top) {
      const r = plan.find(p => p.id === 'reconhecer');
      if (r) { r.text = `Reconheça publicamente ${top.name}`; r.detail = `Destaque do mês — ${top.points} pts`; }
    }
    // Quem está parado (sem atividade no mês) → ação concreta no topo
    const parados = others.filter(m => (m.shares || 0) === 0).map(m => m.name).filter(Boolean);
    if (parados.length) {
      plan.unshift({
        id: 'parados',
        text: `Fale com quem está parado: ${parados.slice(0, 3).join(', ')}${parados.length > 3 ? '…' : ''}`,
        detail: 'Sem atividade registrada este mês',
        link: '/painel-gestor',
      });
    }
  }
  return plan;
}

function map(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function getDonePlan(): string[] {
  return map()[currentWeekKey()] || [];
}

export function isPlanItemDone(id: string): boolean {
  return getDonePlan().includes(id);
}

export function togglePlanItem(id: string): void {
  const wk = currentWeekKey();
  const m = map();
  const done = m[wk] || [];
  m[wk] = done.includes(id) ? done.filter(x => x !== id) : [...done, id];
  localStorage.setItem(KEY, JSON.stringify(m));
}

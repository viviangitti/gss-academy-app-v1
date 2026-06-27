// Progresso de Maestria do vendedor — nível, ofensiva (streak) e o "treino do dia"
// (repetição espaçada). Tudo derivado do histórico de treinos já registrado,
// sem novo backend.
import { getAllHistory } from './history';
import { getObjections } from './content';
import type { Objection } from './content';
import type { UserProfile } from '../types';

const LEVELS = ['Aprendiz', 'Praticante', 'Avançado', 'Expert', 'Maestro'];
const THRESHOLDS = [0, 3, 8, 16, 30]; // pontos pra entrar em cada nível

export interface MaestriaProgress {
  level: number;          // 1..5
  levelLabel: string;     // Aprendiz..Maestro
  pct: number;            // % até o próximo nível
  streak: number;         // dias seguidos treinando
  totalTreinos: number;
  avgNota: number | null;
  nextLevelLabel: string | null;  // próximo nível (null se já é Maestro)
  nextLevelIn: number;            // treinos restantes (estimado) pro próximo nível
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

interface SimData { score?: number | null; objection?: string }

function sessions() {
  return getAllHistory().filter(h => h.type === 'simulator_session');
}

export function getMaestriaProgress(): MaestriaProgress {
  const sims = sessions();
  const total = sims.length;
  const notas = sims
    .map(s => (s.data as SimData)?.score)
    .filter((n): n is number => typeof n === 'number');
  const avg = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;

  // Ofensiva: dias consecutivos com treino, terminando hoje (ou ontem, pra não
  // "quebrar" antes do fim do dia).
  const days = new Set(sims.map(s => dayKey(s.createdAt)));
  let streak = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d.getTime()))) { streak++; d.setDate(d.getDate() - 1); }

  // Nível: volume ponderado pela qualidade (nota média)
  const quality = avg != null ? avg / 10 : 0.5;
  const points = total * (0.6 + 0.4 * quality);
  let level = 1;
  for (let i = 0; i < THRESHOLDS.length; i++) if (points >= THRESHOLDS[i]) level = i + 1;
  const idx = level - 1;
  const cur = THRESHOLDS[idx];
  const next = THRESHOLDS[Math.min(idx + 1, THRESHOLDS.length - 1)];
  const pct = next > cur ? Math.min(100, Math.round(((points - cur) / (next - cur)) * 100)) : 100;

  // Quantos treinos faltam (estimado) pro próximo nível
  const isMax = level >= LEVELS.length;
  const perTreino = 0.6 + 0.4 * quality;           // pontos que cada treino soma
  const nextLevelIn = isMax ? 0 : Math.max(1, Math.ceil((next - points) / perTreino));

  return {
    level,
    levelLabel: LEVELS[idx],
    pct,
    streak,
    totalTreinos: total,
    avgNota: avg != null ? Math.round(avg * 10) / 10 : null,
    nextLevelLabel: isMax ? null : LEVELS[idx + 1],
    nextLevelIn,
  };
}

export interface TreinoDoDia {
  objection: Objection;
  reason: string;
}

/** Escolhe a objeção do dia por repetição espaçada: nunca treinada > mais antiga
 * > menor nota. */
export function getTreinoDoDia(segment: UserProfile['segment']): TreinoDoDia | null {
  const objs = getObjections(segment).filter(o => !o.stage);
  if (!objs.length) return null;

  const last: Record<string, { ts: number; score?: number | null }> = {};
  sessions().forEach(s => {
    const o = (s.data as SimData)?.objection;
    if (!o) return;
    if (!last[o] || s.createdAt > last[o].ts) last[o] = { ts: s.createdAt, score: (s.data as SimData)?.score };
  });

  const sorted = [...objs].sort((a, b) => {
    const la = last[a.objection], lb = last[b.objection];
    if (!la && lb) return -1;
    if (la && !lb) return 1;
    if (!la && !lb) return 0;
    if (la!.ts !== lb!.ts) return la!.ts - lb!.ts;     // mais antiga primeiro
    return (la!.score ?? 10) - (lb!.score ?? 10);       // menor nota primeiro
  });

  const pick = sorted[0];
  const lp = last[pick.objection];
  let reason: string;
  if (!lp) reason = 'você ainda não treinou essa';
  else if (lp.score != null && lp.score < 7) reason = `da última vez você tirou ${lp.score}/10`;
  else {
    const dias = Math.max(1, Math.round((Date.now() - lp.ts) / 86400000));
    reason = `faz ${dias} dia${dias !== 1 ? 's' : ''} que você não treina essa`;
  }
  return { objection: pick, reason };
}

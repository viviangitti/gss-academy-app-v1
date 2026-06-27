// Serviço de "Conteúdo do Dia" — social selling.
// Gera posts prontos pro vendedor compartilhar e rastreia compartilhamentos + pontos.

import type { Offer } from '../types';

export interface ContentSuggestion {
  id: string;
  type: 'oferta' | 'dica' | 'novidade';
  emoji: string;
  title: string;       // título curto do card
  caption: string;     // texto pronto pra compartilhar
}

export interface ContentActivity {
  id: string;
  contentId: string;
  title: string;
  date: string;        // ISO yyyy-mm-dd
  ts: number;
  points: number;
}

const ACTIVITY_KEY = 'gss_content_activity';
const MISSION_DONE_KEY = 'gss_content_missions';   // { [weekKey]: missionId[] }
const POINTS_PER_SHARE = 10;

// ── Missões da semana (social selling estilo Socialis: tarefas pontuadas que
// dizem O QUE / QUANDO / COMO criar — aprender fazendo) ──

export interface WeeklyMission {
  id: string;
  emoji: string;
  title: string;   // o que fazer
  how: string;     // como fazer (dica prática)
  pilar: string;   // tag (pilar de conteúdo)
  points: number;
}

const MISSION_POOL: WeeklyMission[] = [
  { id: 'reels-entrega', emoji: '🎬', title: 'Grave 1 Reels de uma entrega da semana', how: 'Cliente pegando o carro, sorriso real. Gancho: "Mais uma realização 🚗". 15 a 30s.', pilar: 'Bastidores', points: 20 },
  { id: 'carrossel-duvida', emoji: '🎠', title: 'Poste 1 carrossel resolvendo uma dúvida comum', how: 'Escolha uma pergunta que cliente sempre faz. Capa com a dúvida, 3 a 5 slides respondendo.', pilar: 'Educar', points: 20 },
  { id: 'story-enquete', emoji: '⏱️', title: 'Faça 1 Story com enquete', how: 'Ex: "Próximo carro: 0km ou seminovo?". Puxa resposta e abre conversa no direct.', pilar: 'Stories', points: 10 },
  { id: 'depoimento', emoji: '⭐', title: 'Peça 1 depoimento a um cliente e poste', how: 'Print da conversa (com permissão) ou vídeo curto do cliente feliz. Prova social vende.', pilar: 'Prova social', points: 25 },
  { id: 'novidade', emoji: '🔥', title: 'Publique 1 novidade ou condição do mês', how: 'Modelo que chegou ou condição boa. 3 motivos pra conhecer + "me chama 👇".', pilar: 'Oferta', points: 10 },
  { id: 'bastidor-rotina', emoji: '🎥', title: 'Mostre seu bastidor: como prepara um atendimento', how: 'Vídeo curto do seu processo. Aproxima o cliente de você antes mesmo de chegar.', pilar: 'Bastidores', points: 15 },
  { id: 'reels-dica', emoji: '💡', title: 'Grave 1 Reels com uma dica rápida', how: '"3 perguntas antes de financiar". Gancho nos 3 primeiros segundos, feche com CTA.', pilar: 'Educar', points: 20 },
  { id: 'marca-historia', emoji: '🙋', title: 'Conte por que você trabalha com carros', how: 'Sua história em 30s ou num texto curto. Marca pessoal gera confiança e indicação.', pilar: 'Marca pessoal', points: 15 },
  { id: 'antes-depois', emoji: '🔄', title: 'Poste a jornada de um cliente (antes e depois)', how: 'Da busca até achar o carro certo. Storytelling curto que mostra seu cuidado.', pilar: 'Prova social', points: 20 },
  { id: 'linkedin-caso', emoji: '💼', title: 'Escreva 1 post no LinkedIn sobre um caso real', how: 'Situação → o que você fez → aprendizado. Autoridade sem parecer vendedor.', pilar: 'Autoridade', points: 15 },
];

const MISSIONS_PER_WEEK = 5;

/** Chave da semana atual: "2026-W26". */
export function currentWeekKey(): string {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

/** 5 missões da semana — determinístico por semana (giram a cada semana). */
export function getWeeklyMissions(): WeeklyMission[] {
  const offset = dayHash(currentWeekKey()) % MISSION_POOL.length;
  const out: WeeklyMission[] = [];
  for (let i = 0; i < MISSIONS_PER_WEEK; i++) {
    out.push(MISSION_POOL[(offset + i) % MISSION_POOL.length]);
  }
  return out;
}

function getMissionMap(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(MISSION_DONE_KEY) || '{}'); } catch { return {}; }
}

export function getDoneMissions(): string[] {
  return getMissionMap()[currentWeekKey()] || [];
}

export function isMissionDone(id: string): boolean {
  return getDoneMissions().includes(id);
}

/** Marca a missão como feita, dá os pontos e registra na atividade (entra no ranking). */
export function completeMission(m: WeeklyMission): void {
  const week = currentWeekKey();
  const map = getMissionMap();
  const done = map[week] || [];
  if (done.includes(m.id)) return;
  map[week] = [...done, m.id];
  localStorage.setItem(MISSION_DONE_KEY, JSON.stringify(map));

  // Pontos entram no mesmo sistema de atividade (totais, ranking, painel do gestor)
  const activity = getActivity();
  activity.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    contentId: `mission-${week}-${m.id}`,
    title: m.title,
    date: new Date().toISOString().split('T')[0],
    ts: Date.now(),
    points: m.points,
  });
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
}

export interface WeeklyMissionProgress { done: number; total: number; points: number; earned: number }

export function getWeeklyMissionProgress(): WeeklyMissionProgress {
  const missions = getWeeklyMissions();
  const done = getDoneMissions();
  const doneMissions = missions.filter(m => done.includes(m.id));
  return {
    done: doneMissions.length,
    total: missions.length,
    points: missions.reduce((s, m) => s + m.points, 0),
    earned: doneMissions.reduce((s, m) => s + m.points, 0),
  };
}

// ── Templates evergreen por segmento (dicas/engajamento que sempre funcionam) ──
const EVERGREEN: Record<string, { emoji: string; title: string; caption: string }[]> = {
  automotivo_luxo: [
    { emoji: '🔑', title: 'Test drive', caption: 'Comprar um carro de luxo é sentir. Agende seu test drive comigo e viva a experiência antes de decidir. Chama no WhatsApp 👇' },
    { emoji: '💎', title: 'Exclusividade', caption: 'Atendimento de verdade não é sobre vender um carro — é sobre entender o seu estilo de vida. Vamos conversar sobre o seu próximo? Me chama 👇' },
    { emoji: '📈', title: 'Valor de revenda', caption: 'Carro premium bem cuidado é patrimônio. Te ajudo a escolher o modelo com melhor valorização. Fala comigo 👇' },
  ],
  automotivo: [
    { emoji: '🚗', title: 'Hora de trocar', caption: 'Seu carro atual já te serviu bem — que tal sair com um zero agora? Te mostro as melhores condições do mês. Chama no WhatsApp 👇' },
    { emoji: '💰', title: 'Avaliação grátis', caption: 'Quer saber quanto vale o seu usado na troca? Faço a avaliação sem compromisso. Me manda mensagem 👇' },
    { emoji: '⚡', title: 'Condições', caption: 'Taxa boa não dura o mês todo. Se você está pensando em trocar de carro, esse é o momento. Fala comigo 👇' },
  ],
  _default: [
    { emoji: '💡', title: 'Dica do dia', caption: 'Posso te ajudar a tomar a melhor decisão sem enrolação. Me chama no WhatsApp que eu te explico tudo 👇' },
    { emoji: '🤝', title: 'Atendimento', caption: 'Atendimento de verdade faz diferença. Estou à disposição pra tirar suas dúvidas. Fala comigo 👇' },
    { emoji: '⭐', title: 'Novidades', caption: 'Tem novidade boa por aqui. Quer saber em primeira mão? Me manda uma mensagem 👇' },
  ],
};

/** Hash determinístico simples (mesmo conteúdo o dia inteiro). */
function dayHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Monta o conteúdo do dia: 1-2 posts de ofertas ativas + 2 dicas evergreen.
 * Determinístico por dia (não muda a cada refresh).
 */
export function buildDailyContent(segment: string, offers: Offer[]): ContentSuggestion[] {
  const today = new Date().toISOString().split('T')[0];
  const out: ContentSuggestion[] = [];

  // 1. Ofertas ativas → posts prontos
  for (const o of offers.slice(0, 2)) {
    const destaque = o.highlights?.[0] ? ` ${o.highlights[0]}.` : '';
    out.push({
      id: `oferta-${o.id || o.title}`,
      type: 'oferta',
      emoji: '🔥',
      title: o.title,
      caption: `🔥 ${o.title}!${destaque} ${o.pitch || o.description || ''}\n\nChama no WhatsApp que eu te explico tudo 👇`.trim(),
    });
  }

  // 2. Dicas evergreen — escolhe rotativo por dia
  const templates = EVERGREEN[segment] || EVERGREEN._default;
  const idx = dayHash(today + segment) % templates.length;
  const pick = [templates[idx], templates[(idx + 1) % templates.length]];
  for (let i = 0; i < pick.length; i++) {
    const t = pick[i];
    out.push({
      id: `dica-${today}-${i}`,
      type: 'dica',
      emoji: t.emoji,
      title: t.title,
      caption: t.caption,
    });
  }

  return out;
}

// ── Rastreamento de compartilhamento + pontos ──

export function getActivity(): ContentActivity[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** Registra um compartilhamento e dá pontos. */
export function logShare(content: ContentSuggestion): ContentActivity {
  const activity = getActivity();
  const entry: ContentActivity = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    contentId: content.id,
    title: content.title,
    date: new Date().toISOString().split('T')[0],
    ts: Date.now(),
    points: POINTS_PER_SHARE,
  };
  activity.push(entry);
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  return entry;
}

export function hasSharedToday(contentId: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return getActivity().some(a => a.contentId === contentId && a.date === today);
}

export interface ContentStats {
  totalPoints: number;
  totalShares: number;
  sharesToday: number;
  streak: number;   // dias consecutivos com pelo menos 1 share
}

/** Chave do mês atual: "2026-06". */
export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Pontos e posts do MÊS atual (para o ranking). */
export function getMonthlyStats(): { points: number; shares: number } {
  const month = currentMonthKey();
  const monthActivity = getActivity().filter(a => a.date.startsWith(month));
  return {
    points: monthActivity.reduce((s, a) => s + a.points, 0),
    shares: monthActivity.length,
  };
}

export function getContentStats(): ContentStats {
  const activity = getActivity();
  const today = new Date().toISOString().split('T')[0];
  const totalPoints = activity.reduce((s, a) => s + a.points, 0);
  const sharesToday = activity.filter(a => a.date === today).length;

  // Streak: dias consecutivos (a partir de hoje/ontem) com share
  const days = new Set(activity.map(a => a.date));
  let streak = 0;
  const d = new Date();
  if (!days.has(today)) d.setDate(d.getDate() - 1); // não postou hoje ainda → não quebra
  for (;;) {
    const key = d.toISOString().split('T')[0];
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }

  return { totalPoints, totalShares: activity.length, sharesToday, streak };
}

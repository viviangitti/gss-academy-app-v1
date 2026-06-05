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
const POINTS_PER_SHARE = 10;

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

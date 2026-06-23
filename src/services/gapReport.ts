// Report "Por que ganho / por que perco" (vendedor) e Mapa de gaps (gestor).
// A IA cruza vendas, perdas e treinos e classifica o gap:
// produto / processo / abordagem / follow-up — com recomendação acionável.
import { generateText } from './ai';
import { getCurrentMonthSales, getSales } from './goal';
import { getLostSales, REASON_LABELS, STAGE_LABELS } from './lostSales';
import { getAllHistory } from './history';
import { fetchRecentCases } from './firestore/salesCases';
import { loadData, KEYS } from './storage';
import type { UserProfile } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export type GapKind = 'produto' | 'processo' | 'abordagem' | 'follow-up';

export interface CompetencyScore {
  nome: string;            // ex: "Produto"
  nota: number;            // 0-100
}

export interface MyReport {
  resumo: string;          // 1-2 frases: o padrão central
  forte: string[];         // onde ganha (2-3)
  fraco: string[];         // onde perde (2-3)
  gap: GapKind;            // o gap principal
  recomendacao: string;    // o que treinar/fazer esta semana
  competencias: CompetencyScore[];  // 6 competências-chave com nota (radar)
}

export interface SellerGap {
  nome: string;
  resumo: string;          // 1 frase
  gap: GapKind;
  recomendacao: string;    // 1 frase, acionável pro gestor
}

export interface TeamReport {
  resumoEquipe: string;
  porVendedor: SellerGap[];
}

function parseJson<T>(raw: string): T {
  return JSON.parse(raw.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, '')) as T;
}

/** Mínimo de dados pro report fazer sentido. */
export function hasEnoughDataForMyReport(): boolean {
  return getSales().length + getLostSales().length >= 3;
}

export async function getMyGapReport(): Promise<MyReport> {
  const sales = getCurrentMonthSales();
  const allSales = getSales().slice(-20);
  const lost = getLostSales().slice(0, 20);
  const sims = getAllHistory().filter(h => h.type === 'simulator_session').slice(0, 8);

  const data = [
    `VENDAS FECHADAS (últimas ${allSales.length}, ${sales.length} este mês):`,
    ...allSales.map(s => `• R$ ${Math.round(s.amount / 1000)}k${s.notes ? ` — ${s.notes}` : ''}`),
    '',
    `VENDAS PERDIDAS (últimas ${lost.length}):`,
    ...lost.map(l => `• ${l.opportunity} (R$ ${Math.round(l.value / 1000)}k) — motivo: ${REASON_LABELS[l.reason]}, etapa: ${STAGE_LABELS[l.stage]}${l.learning ? ` — aprendizado: ${l.learning}` : ''}`),
    '',
    `TREINOS DE OBJEÇÃO:`,
    ...sims.map(s => `• ${s.title} — ${s.subtitle || ''}`),
  ].join('\n');

  const prompt = `Você é um analista de performance comercial. Analise os dados REAIS deste vendedor e identifique POR QUE ele ganha e POR QUE ele perde.

Responda APENAS com JSON válido:
{"resumo":"...","forte":["...","..."],"fraco":["...","..."],"gap":"produto|processo|abordagem|follow-up","recomendacao":"...","competencias":[{"nome":"Produto","nota":70},{"nome":"Processo","nota":45},{"nome":"Abordagem","nota":60},{"nome":"Negociação","nota":55},{"nome":"Fechamento","nota":65},{"nome":"Follow-up","nota":40}]}

Regras:
- "resumo": o padrão central em 1-2 frases diretas (ex: "Você fecha bem à vista, mas perde quando entra financiamento").
- "forte": 2-3 pontos onde ele claramente ganha (com base nos dados).
- "fraco": 2-3 pontos onde ele perde (com base nos motivos das perdas).
- "gap": classifique o gap PRINCIPAL: "produto" (não domina o que vende), "processo" (trava em simulação/financiamento/burocracia), "abordagem" (perde por preço/conexão), "follow-up" (perde por sumir/timing).
- "recomendacao": UMA ação concreta pra esta semana.
- "competencias": EXATAMENTE estas 6, nesta ordem: Produto, Processo, Abordagem, Negociação, Fechamento, Follow-up. Nota 0-100 baseada na EVIDÊNCIA dos dados (vitórias sobem a nota, perdas relacionadas derrubam). Sem evidência sobre uma competência → nota entre 50-60. Seja criterioso: notas devem variar entre as competências, refletindo os dados.
- Português brasileiro, direto, sem rodeio. Se os dados forem poucos, diga isso no resumo mas analise mesmo assim.

DADOS:
${data}`;

  return parseJson<MyReport>(await generateText(API_KEY, prompt));
}

export async function getTeamGapReport(): Promise<TeamReport> {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const cases = await fetchRecentCases((profile.company || '').trim().toLowerCase(), 100);
  if (!cases.length) throw new Error('sem casos');

  const byAuthor: Record<string, string[]> = {};
  cases.forEach(c => {
    const name = c.authorName || 'Sem nome';
    const line = c.kind === 'won'
      ? `FECHOU${c.value ? ` R$ ${Math.round((c.value || 0) / 1000)}k` : ''}${c.approach ? ` — ${c.approach}` : ''}`
      : c.kind === 'objection_won'
        ? `CONTORNOU "${c.objection}"`
        : `PERDEU (${c.reason || '?'}${c.stage ? `, ${c.stage}` : ''})${c.learning ? ` — ${c.learning}` : ''}`;
    (byAuthor[name] = byAuthor[name] || []).push(line);
  });

  const data = Object.entries(byAuthor)
    .map(([name, lines]) => `${name}:\n${lines.slice(0, 12).map(l => `  • ${l}`).join('\n')}`)
    .join('\n\n');

  const prompt = `Você é um analista de performance comercial ajudando um GESTOR de vendas. Analise os casos reais por vendedor e identifique o gap de cada um.

Responda APENAS com JSON válido:
{"resumoEquipe":"...","porVendedor":[{"nome":"...","resumo":"...","gap":"produto|processo|abordagem|follow-up","recomendacao":"..."}]}

Regras:
- "resumoEquipe": o padrão geral da equipe em 1-2 frases (onde a equipe mais perde).
- Para cada vendedor com dados: "resumo" (1 frase: por que ganha/perde), "gap" principal, "recomendacao" (1 frase acionável pro gestor — ex: "treino de simulação de financiamento").
- Não invente vendedores. Português brasileiro direto.

CASOS POR VENDEDOR:
${data}`;

  return parseJson<TeamReport>(await generateText(API_KEY, prompt));
}

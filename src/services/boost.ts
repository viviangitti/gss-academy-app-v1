// Boost 🚀 — SOS de argumentação.
// O vendedor descreve em 1 frase onde travou e recebe 3 caminhos IMEDIATOS,
// alimentados pela memória (perfil + casos reais da equipe) e pelas condições do mês.
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildMemoryContext } from './memory';
import { getActiveOffers } from './firestore/offers';
import { getActiveConditionsForMonth } from './firestore/commercialConditions';
import { loadData, KEYS } from './storage';
import { logCase } from './firestore/salesCases';
import { addWin } from './wins';
import type { UserProfile } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface BoostPath {
  title: string;   // nome curto do caminho (ex: "Vire o jogo pro valor de revenda")
  say: string;     // a fala pronta, na boca do vendedor
}

const BOOST_PROMPT = `Você é o assistente de emergência de um vendedor que está AGORA na frente do cliente (ou no WhatsApp) e travou. Não há tempo pra teoria.

Responda APENAS com JSON válido neste formato (sem markdown, sem comentários):
{"paths":[{"title":"...","say":"..."},{"title":"...","say":"..."},{"title":"...","say":"..."}]}

Regras dos 3 caminhos:
- "title": o nome da jogada em até 6 palavras.
- "say": a fala PRONTA pra usar agora, em português brasileiro natural de vendedor (1-3 frases). Nada de "você poderia dizer..." — escreva a fala em si.
- Caminho 1: o mais direto pro fechamento.
- Caminho 2: uma pergunta inteligente que destrava (diagnóstico).
- Caminho 3: um ângulo diferente (urgência real, prova social, condição do mês, caso real da equipe).
- Se houver CASOS REAIS DA EQUIPE no contexto, use o que já funcionou nesta empresa.
- Se houver condições/ofertas do mês no contexto, use como munição concreta.`;

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function buildAmmo(): Promise<string> {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const parts: string[] = [];
  try {
    const [offers, conditions] = await Promise.all([
      getActiveOffers(profile.segment || undefined).catch(() => []),
      getActiveConditionsForMonth(monthKey(), profile.segment || undefined).catch(() => []),
    ]);
    if (conditions.length) {
      parts.push('CONDIÇÕES DO MÊS:\n' + conditions.slice(0, 5).map(c => `• ${c.title}${c.highlights?.length ? ` — ${c.highlights.join(', ')}` : ''}`).join('\n'));
    }
    if (offers.length) {
      parts.push('OFERTAS ATIVAS:\n' + offers.slice(0, 5).map(o => `• ${o.title}${o.highlights?.length ? ` — ${o.highlights.join(', ')}` : ''}`).join('\n'));
    }
  } catch { /* sem munição extra */ }
  return parts.join('\n\n');
}

export async function getBoost(situation: string): Promise<BoostPath[]> {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const memory = buildMemoryContext();
  const ammo = await buildAmmo();
  const prompt = [
    BOOST_PROMPT,
    memory,
    ammo,
    `SITUAÇÃO DO VENDEDOR AGORA: "${situation}"`,
  ].filter(Boolean).join('\n\n');

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim()
    .replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(text) as { paths: BoostPath[] };
  if (!Array.isArray(parsed.paths) || !parsed.paths.length) throw new Error('resposta vazia');
  return parsed.paths.slice(0, 3);
}

/** O vendedor marcou que um caminho FUNCIONOU → vira caso real do cérebro coletivo. */
export function reportBoostWin(situation: string, path: BoostPath): void {
  addWin('boost');
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  if (!profile.company) return;
  logCase({
    kind: 'objection_won',
        authorName: profile.name || '',
    company: profile.company,
    segment: profile.segment || '',
    objection: situation.slice(0, 140),
    approach: `${path.title}: ${path.say}`.slice(0, 300),
  });
}

// Boost 🚀 — SOS de argumentação.
// O vendedor descreve em 1 frase onde travou e recebe 3 caminhos IMEDIATOS,
// alimentados pela memória (perfil + casos reais da equipe) e pelas condições do mês.
import { generateText } from './ai';
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
  const memory = buildMemoryContext();
  const ammo = await buildAmmo();
  const prompt = [
    BOOST_PROMPT,
    memory,
    ammo,
    `SITUAÇÃO DO VENDEDOR AGORA: "${situation}"`,
  ].filter(Boolean).join('\n\n');

  const text = (await generateText(API_KEY, prompt)).trim()
    .replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(text) as { paths: BoostPath[] };
  if (!Array.isArray(parsed.paths) || !parsed.paths.length) throw new Error('resposta vazia');
  return parsed.paths.slice(0, 3);
}

// ── Debrief pós-atendimento: o vendedor conta o que houve e recebe coaching na hora ──

export interface DebriefInput {
  situacao: string;      // como foi a situação
  motivos: string;       // motivos alegados pelo cliente pra não fechar
  autocritica: string;   // o que ele sente que faltou nele
}

export interface DebriefResult {
  leitura: string;       // a leitura honesta do que aconteceu (2-3 frases)
  oQueFaltou: string;    // o que de fato faltou (validando ou corrigindo a autocrítica)
  falas: string[];       // 2 falas prontas pra usar na próxima vez
  exercicio: string;     // 1 micro-exercício pra treinar isso
  aindaDaTempo: string;  // se der pra resgatar ESTE cliente, como; senão, vazio
}

const DEBRIEF_PROMPT = `Você é um coach de vendas experiente fazendo o pós-jogo de um atendimento que NÃO fechou. O vendedor teve a coragem de fazer autocrítica — honre isso: seja honesto, específico e construtivo (nunca genérico).

Responda APENAS com JSON válido:
{"leitura":"...","oQueFaltou":"...","falas":["...","..."],"exercicio":"...","aindaDaTempo":"..."}

Regras:
- "leitura": sua leitura honesta do que aconteceu (2-3 frases). Use os casos reais da equipe se ajudarem.
- "oQueFaltou": valide OU corrija a autocrítica dele — às vezes o vendedor se culpa do motivo errado. Diga o que de fato faltou.
- "falas": exatamente 2 falas PRONTAS (na boca do vendedor) pra situação equivalente na próxima vez.
- "exercicio": 1 micro-exercício de 5 minutos pra treinar a lacuna (pode citar o Treino falado do app).
- "aindaDaTempo": se ESTE cliente ainda for recuperável, diga o próximo passo concreto (ex: mensagem amanhã com a condição X). Se não, string vazia "".
- Português brasileiro, direto, tom de treinador que respeita o atleta.`;

export async function getDebrief(input: DebriefInput): Promise<DebriefResult> {
  const memory = buildMemoryContext();
  const ammo = await buildAmmo();
  const situacao = [
    'O ATENDIMENTO:',
    `- Como foi: ${input.situacao}`,
    `- Motivos que o cliente alegou pra não fechar: ${input.motivos}`,
    `- Autocrítica do vendedor (o que ele sente que faltou): ${input.autocritica}`,
  ].join('\n');

  const prompt = [DEBRIEF_PROMPT, memory, ammo, situacao].filter(Boolean).join('\n\n');
  const text = (await generateText(API_KEY, prompt)).trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(text) as DebriefResult;
  if (!parsed.leitura) throw new Error('debrief vazio');

  // O registro alimenta o cérebro coletivo e o Raio-X — o ganho composto do app
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  if (profile.company) {
    logCase({
      kind: 'lost',
      authorName: profile.name || '',
      company: profile.company,
      segment: profile.segment || '',
      objection: input.motivos.slice(0, 140),
      reason: input.motivos.slice(0, 100),
      learning: input.autocritica.slice(0, 200),
    });
  }
  return parsed;
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

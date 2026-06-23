// Camada resiliente sobre o Gemini.
// O Google às vezes devolve 503 ("high demand") ou 429 no modelo flash-lite — congestionamento
// transitório do lado deles. Sem tratamento, isso virava erro cru na tela do vendedor.
// Aqui: retry com backoff + fallback automático pro flash + mensagem amigável.
import { GoogleGenerativeAI } from '@google/generative-ai';

// lite primeiro (5x mais rápido, mesma qualidade); flash como reserva quando o lite congestiona.
const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** O erro é congestionamento transitório do Gemini (503/429/overloaded)? — vale tentar de novo. */
export function isOverloaded(err: unknown): boolean {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return /\b50[0-3]\b/.test(m) || m.includes('429')
    || m.includes('overload') || m.includes('high demand') || m.includes('unavailable')
    || m.includes('rate limit') || m.includes('try again') || m.includes('exhausted');
}

/** Mensagem pronta pra mostrar ao usuário. */
export function aiErrorMessage(err: unknown): string {
  return isOverloaded(err)
    ? 'A IA está congestionada agora — tenta de novo em alguns segundos.'
    : (err instanceof Error ? err.message : 'Erro desconhecido');
}

type GenRequest = Parameters<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['generateContent']>[0];

/**
 * generateContent resiliente. Tenta o lite com `retries` re-tentativas (backoff) em caso de 503/429;
 * se o lite seguir congestionado, cai pro flash. Devolve só o texto.
 * Erros reais (chave inválida, prompt malformado) propagam na hora — não adianta repetir.
 */
export async function generateText(
  apiKey: string,
  request: GenRequest,
  opts: { models?: string[]; retries?: number; modelParams?: Record<string, unknown> } = {},
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = opts.models ?? FALLBACK_MODELS;
  const retries = opts.retries ?? 1;
  let lastErr: unknown = new Error('IA indisponível');
  for (const modelName of models) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, ...(opts.modelParams ?? {}) });
        const result = await model.generateContent(request);
        return result.response.text();
      } catch (e) {
        lastErr = e;
        if (!isOverloaded(e)) throw e;                 // erro real → propaga
        if (attempt < retries) await sleep(700 * (attempt + 1));
      }
    }
    // esgotou as tentativas nesse modelo → tenta o próximo (flash)
  }
  throw lastErr;
}

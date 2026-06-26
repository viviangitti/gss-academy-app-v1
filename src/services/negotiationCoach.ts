// Modo "Me ajuda numa negociação" do Coaching.
// A IA confere 6 itens do contexto; se faltar algo crítico, o app mostra
// uma ficha só com os campos faltantes. Depois monta um plano sob medida.

import { generateText } from './ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const VALORIZA_OPTIONS = [
  'Espaço interno', 'Porta-malas', 'Tamanho', 'Tem filhos', 'Autonomia',
  'Consumo', 'Segurança', 'Conforto', 'Desempenho', 'Revenda',
];

export const ETAPA_OPTIONS = ['Primeiro contato', 'Cotando / comparando', 'Quase fechando', 'Esfriou'];

export interface NegotiationContext {
  etapa: string;
  carro: string;
  valoriza: string[];
  travou: string;
  pagamento: string;
  falou: string;
}

// Itens críticos: se faltar algum, a ficha é mostrada.
export const CRITICAL_FIELDS: (keyof NegotiationContext)[] = ['carro', 'travou', 'valoriza'];

const EMPTY: NegotiationContext = { etapa: '', carro: '', valoriza: [], travou: '', pagamento: '', falou: '' };

/** Extrai da descrição livre o que o vendedor já contou (deixa '' o que faltar). */
export async function extractNegotiationContext(freeText: string): Promise<NegotiationContext> {
  const prompt = `Você analisa a descrição de uma negociação de carro feita por um vendedor e extrai o contexto. Responda APENAS com JSON válido:
{"etapa":"","carro":"","valoriza":[],"travou":"","pagamento":"","falou":""}

Regras:
- "etapa": em que ponto está, SÓ entre: "Primeiro contato","Cotando / comparando","Quase fechando","Esfriou". "" se não der pra inferir.
- "carro": modelo/versão mencionado (inclua 0km ou seminovo se disser). "" se não mencionou.
- "valoriza": array do que o cliente valoriza, SÓ entre: ["Espaço interno","Porta-malas","Tamanho","Tem filhos","Autonomia","Consumo","Segurança","Conforto","Desempenho","Revenda"]. [] se não der.
- "travou": a objeção / o que travou a venda. "" se não disse.
- "pagamento": forma de pagamento ou troca mencionada. "" se não disse.
- "falou": algo marcante que o cliente falou. "" se não tiver.
NÃO invente. Se não estiver claro, deixe "" (ou [] em valoriza).

DESCRIÇÃO DO VENDEDOR:
${freeText}`;

  try {
    const raw = await generateText(API_KEY, prompt);
    const json = JSON.parse(raw.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''));
    return {
      etapa: typeof json.etapa === 'string' ? json.etapa : '',
      carro: typeof json.carro === 'string' ? json.carro : '',
      valoriza: Array.isArray(json.valoriza) ? json.valoriza.filter((v: unknown) => typeof v === 'string') : [],
      travou: typeof json.travou === 'string' ? json.travou : '',
      pagamento: typeof json.pagamento === 'string' ? json.pagamento : '',
      falou: typeof json.falou === 'string' ? json.falou : '',
    };
  } catch {
    return { ...EMPTY };
  }
}

/** Quais campos críticos ainda faltam. */
export function missingCritical(ctx: NegotiationContext): (keyof NegotiationContext)[] {
  return CRITICAL_FIELDS.filter(f => {
    const v = ctx[f];
    return Array.isArray(v) ? v.length === 0 : !String(v || '').trim();
  });
}

/** Monta o prompt final pro Coach com o contexto estruturado + pedido do plano. */
export function buildNegotiationPrompt(ctx: NegotiationContext, freeText: string): string {
  const linhas: string[] = [];
  if (ctx.etapa) linhas.push(`- Etapa: ${ctx.etapa}`);
  if (ctx.carro) linhas.push(`- Carro: ${ctx.carro}`);
  if (ctx.valoriza.length) linhas.push(`- O que o cliente valoriza: ${ctx.valoriza.join(', ')}`);
  if (ctx.travou) linhas.push(`- O que travou: ${ctx.travou}`);
  if (ctx.pagamento) linhas.push(`- Pagamento / troca: ${ctx.pagamento}`);
  if (ctx.falou) linhas.push(`- O cliente falou: ${ctx.falou}`);

  return `[MODO NEGOCIAÇÃO — cliente específico]

Situação (nas palavras do vendedor): ${freeText}

Contexto do cliente:
${linhas.join('\n')}

Monte um plano sob medida pra ESTE cliente (nada de teoria genérica):
1. **Abertura / script** pra retomar — 1-2 frases que eu posso falar já.
2. **2-3 caminhos** de argumentação que conectem o que ELE valoriza ao carro, defendendo VALOR em vez de apelar pro desconto.
3. **Próxima ação** concreta.
Seja direto e prático, em português brasileiro.`;
}

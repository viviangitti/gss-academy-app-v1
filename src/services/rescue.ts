// Rescue 🎯 — resgate de cliente perdido ou esfriado.
// Gera o plano de reaproximação: mensagem de WhatsApp pronta, melhor momento
// e o gancho certo (condição/oferta do mês como pretexto de contato).
import { generateText } from './ai';
import { buildMemoryContext } from './memory';
import { buildAmmo } from './boost';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface RescueTarget {
  clientName?: string;    // se conhecido
  interest?: string;      // o que ele queria (carro/produto)
  valoriza?: string[];    // o que é importante pra ele (espaço, segurança, consumo...)
  context: string;        // por que perdeu/esfriou (motivo, observações)
  daysSince?: number;     // dias desde o último contato
}

export interface RescuePlan {
  message: string;   // a mensagem de WhatsApp pronta
  timing: string;    // quando mandar (ex: "amanhã às 10h, fora do horário de pico")
  hook: string;      // o gancho usado (ex: "taxa zero que saiu essa semana")
  fallback: string;  // se ele não responder em 3 dias, o plano B
}

const RESCUE_PROMPT = `Você é especialista em reativar clientes que esfriaram ou desistiram de uma compra. Monte um plano de resgate REALISTA.

Responda APENAS com JSON válido (sem markdown):
{"message":"...","timing":"...","hook":"...","fallback":"..."}

Regras:
- "message": mensagem de WhatsApp pronta pra enviar, em português brasileiro natural — curta (2-4 frases), leve, SEM parecer cobrança nem desespero. Se houver condição/oferta nova no contexto, use como pretexto genuíno do contato ("saiu X, lembrei de você"). Use o nome do cliente se informado.
- "timing": o melhor momento pra mandar e por quê (1 frase).
- "hook": qual gancho foi usado e por quê funciona nesse caso (1 frase).
- "fallback": plano B se não responder em 3 dias (1-2 frases).
- Se houver "o que o cliente valoriza", conecte o gancho ao que importa PRA ELE (ex: espaço pra família, segurança, consumo) — defendendo valor, não desconto.
- Se houver CASOS REAIS DA EQUIPE no contexto, aproveite o que já funcionou.
- NUNCA invente desconto/condição que não esteja no contexto.`;

export async function getRescuePlan(target: RescueTarget): Promise<RescuePlan> {
  const memory = buildMemoryContext();
  const ammo = await buildAmmo();
  const situation = [
    `CLIENTE A RESGATAR:`,
    target.clientName ? `- Nome: ${target.clientName}` : '',
    target.interest ? `- Interesse: ${target.interest}` : '',
    target.valoriza?.length ? `- O que o cliente valoriza: ${target.valoriza.join(', ')}` : '',
    `- Situação: ${target.context}`,
    target.daysSince ? `- Sem contato há ${target.daysSince} dias` : '',
  ].filter(Boolean).join('\n');

  const prompt = [RESCUE_PROMPT, memory, ammo, situation].filter(Boolean).join('\n\n');
  const text = (await generateText(API_KEY, prompt)).trim()
    .replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  const plan = JSON.parse(text) as RescuePlan;
  if (!plan.message) throw new Error('plano vazio');
  return plan;
}

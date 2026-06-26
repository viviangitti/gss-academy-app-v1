// Feedback de IA sobre um rascunho de post do vendedor (social selling).
import { generateText } from './ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface PostFeedback {
  nota: number;            // 0-10 — potencial de atrair/engajar
  pontosFortes: string[];
  melhorias: string[];
  versaoMelhorada: string; // post reescrito, pronto pra postar
}

const PROMPT = (draft: string, plataforma: string) =>
  `Você é especialista em conteúdo de vendas para redes sociais, ajudando um VENDEDOR DE CARRO a postar melhor — atrair clientes e gerar conversa, sem parecer panfleto/anúncio.

Plataforma: ${plataforma || 'rede social'}.
Rascunho do vendedor:
"""${draft}"""

Responda APENAS com JSON válido (sem markdown):
{"nota": <número 0-10>, "pontosFortes": ["..."], "melhorias": ["..."], "versaoMelhorada": "..."}

Regras:
- "nota": 0 a 10 pro potencial do post atrair/engajar.
- "pontosFortes": 1 a 3 coisas que já estão boas.
- "melhorias": 2 a 4 ajustes CONCRETOS (gancho mais forte, CTA claro, menos "venda" e mais valor/história, adequar ao tom da plataforma).
- "versaoMelhorada": o post reescrito, pronto pra postar, no tom da plataforma, em português BR — mantendo a ideia original do vendedor.`;

export async function getPostFeedback(draft: string, plataforma = ''): Promise<PostFeedback> {
  const text = (await generateText(API_KEY, PROMPT(draft, plataforma))).trim()
    .replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(text) as PostFeedback;
  if (!parsed || typeof parsed.versaoMelhorada !== 'string') throw new Error('resposta inválida');
  return {
    nota: Math.max(0, Math.min(10, Number(parsed.nota) || 0)),
    pontosFortes: Array.isArray(parsed.pontosFortes) ? parsed.pontosFortes : [],
    melhorias: Array.isArray(parsed.melhorias) ? parsed.melhorias : [],
    versaoMelhorada: parsed.versaoMelhorada,
  };
}

// Narrativa aspiracional — transforma carro + o que o cliente valoriza num pitch
// que vende o SONHO/VALOR (não o preço), com falas pra defender o preço sem dar desconto.
import { generateText } from './ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const VALORIZA_OPTIONS = [
  'Espaço interno', 'Porta-malas', 'Tamanho', 'Tem filhos', 'Autonomia',
  'Consumo', 'Segurança', 'Conforto', 'Desempenho', 'Revenda', 'Status',
];

export interface AspirationalPitch {
  abertura: string;       // 2-3 frases pintando o sonho/cenário de vida
  caminhos: string[];     // 3 falas que ancoram valor (não preço)
  defesaPreco: string;    // como responder ao pedido de desconto, defendendo valor
  frase: string;          // 1 frase de efeito aspiracional
}

export async function getAspirationalPitch(carro: string, valoriza: string[]): Promise<AspirationalPitch> {
  const prompt = `Você é mestre em venda consultiva de carros, especialista em narrativa ASPIRACIONAL: vender o sonho, o estilo de vida e o VALOR — nunca o preço nem o desconto.

Responda APENAS com JSON válido (sem markdown):
{"abertura":"...","caminhos":["...","...","..."],"defesaPreco":"...","frase":"..."}

Regras:
- "abertura": 2-3 frases que pintam o SONHO / cenário de vida com esse carro, conectando ao que o cliente valoriza. NÃO fale de preço.
- "caminhos": 3 falas curtas que ancoram VALOR — cada uma liga uma característica do carro a um benefício e ao SIGNIFICADO pra ele (ex: segurança da família, status, tranquilidade, revenda, experiência). Prontas pra falar.
- "defesaPreco": como responder quando ele pedir desconto — defendendo o valor SEM ceder no preço (ancoragem, comparação de valor, o custo de não ter). 2-3 frases.
- "frase": 1 frase de efeito aspiracional pra fechar.
- Português brasileiro, natural, sem clichê batido. Fale como um vendedor de verdade fala.

DADOS:
Carro: ${carro || 'não informado'}
O que o cliente valoriza: ${valoriza.length ? valoriza.join(', ') : 'não informado'}`;

  const raw = (await generateText(API_KEY, prompt)).trim()
    .replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  const p = JSON.parse(raw) as AspirationalPitch;
  if (!p.abertura) throw new Error('pitch vazio');
  if (!Array.isArray(p.caminhos)) p.caminhos = [];
  return p;
}

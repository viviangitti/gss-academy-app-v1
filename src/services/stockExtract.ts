// Lê uma foto/PDF de veículo (etiqueta de vidro, ficha de estoque, anúncio) e
// extrai os dados pra pré-preencher o cadastro — o gestor confere antes de salvar.
import { generateText } from './ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface ExtractedVehicle {
  model: string;
  year: string;
  color: string;
  price: string;
  note: string;
}

const PROMPT = `Você recebe a FOTO ou PDF de um veículo (anúncio, ficha de estoque, etiqueta de vidro, tabela de preços). Extraia os dados do veículo.

Responda APENAS com JSON válido (sem markdown, sem comentários):
{"model":"...","year":"...","color":"...","price":"...","note":"..."}

Regras:
- "model": marca + modelo + versão, se houver (ex: "Toyota Corolla Cross XRE").
- "year": ano/modelo no formato que aparecer (ex: "2024/2025"); senão "".
- "color": cor do veículo; senão "".
- "price": preço OU condição/bônus, como aparecer (ex: "R$ 159.900" ou "Bônus de R$ 8 mil"); senão "".
- "note": observação útil pro time (km, único dono, tempo parado, premiação, opcionais); senão "".
- Se não tiver certeza de um campo, devolva "" — NÃO invente dados.`;

export async function extractVehicleFromFile(base64: string, mimeType: string): Promise<ExtractedVehicle> {
  const text = (await generateText(API_KEY, [
    { inlineData: { data: base64, mimeType } },
    { text: PROMPT },
  ])).trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  const p = JSON.parse(text) as Partial<ExtractedVehicle>;
  return {
    model: p.model || '',
    year: p.year || '',
    color: p.color || '',
    price: p.price || '',
    note: p.note || '',
  };
}

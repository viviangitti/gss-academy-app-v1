// Guia de Marca — fonte única da verdade (cores, fontes, tom de voz, identidade).
// Lido por TODAS as ferramentas de criação: Gerador de Copy, Copiloto, Criar conteúdo.
export interface BrandGuide {
  id?: string;
  name?: string;
  type: 'text' | 'file';
  content: string;     // text: o texto; file: base64
  mimeType?: string;
  savedAt?: number;
}

const KEY = 'gss_brand_guide_v1';        // /guia-marca (formato novo)
const LIST_KEY = 'gss_brand_guides';     // Copiloto (lista de guides)

/** Pega o Guia de Marca vigente, venha de onde vier (/guia-marca ou Copiloto). */
export function getBrandGuide(): BrandGuide | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as BrandGuide;
  } catch { /* ignore */ }
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (raw) {
      const guides = JSON.parse(raw) as Array<{ id: string; name: string; base64: string; mimeType: string; savedAt: number }>;
      if (guides.length) {
        const l = [...guides].sort((a, b) => b.savedAt - a.savedAt)[0];
        return { id: l.id, name: l.name, type: 'file', content: l.base64, mimeType: l.mimeType, savedAt: l.savedAt };
      }
    }
  } catch { /* ignore */ }
  return null;
}

export function hasBrandGuide(): boolean {
  return getBrandGuide() != null;
}

/** Bloco de prompt pra injetar o guia (quando é texto). Vazio se não houver/for arquivo. */
export function brandGuidePromptBlock(): string {
  const g = getBrandGuide();
  if (!g || g.type !== 'text' || !g.content?.trim()) return '';
  return `\n\nGUIA DE MARCA DA EMPRESA (fonte da verdade — tom de voz, cores, tipografia, identidade):\n"""\n${g.content.trim()}\n"""\nRespeite o guia em TODAS as sugestões: linguagem, tom e referências visuais.`;
}

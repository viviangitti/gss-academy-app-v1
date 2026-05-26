import { GoogleGenerativeAI } from '@google/generative-ai';

// Competitors per segment for offer scanning
export const SEGMENT_COMPETITORS: Record<string, string[]> = {
  automotivo:               ['Fiat', 'Volkswagen', 'Chevrolet', 'Toyota', 'Renault', 'Honda', 'Hyundai', 'Jeep', 'Nissan', 'Kia'],
  automotivo_china:         ['BYD', 'GWM', 'Caoa Chery', 'MG Motor', 'Changan', 'GAC Motor', 'Jaecoo'],
  automotivo_luxo:          ['Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Land Rover', 'Volvo'],
  farmaceutico:             ['Raia Drogasil', 'Ultrafarma', 'Nissei', 'Farmácia Pacheco', 'iHerb Brasil'],
  varejo:                   ['Magazine Luiza', 'Casas Bahia', 'Americanas', 'Shopee Brasil', 'Amazon Brasil'],
  imobiliario:              ['MRV', 'Cyrela', 'Tenda', 'Direcional', 'EzTec'],
  tecnologia:               ['Totvs', 'RD Station', 'HubSpot Brasil', 'Salesforce Brasil', 'Pipedrive'],
  saude:                    ['Hapvida', 'NotreDame Intermédica', 'Unimed', 'OdontoPrev', 'Clínica Popular'],
  educacao:                 ['Anhanguera', 'Estácio', 'Unopar', 'UNIP', 'Wyden'],
  financeiro:               ['Nubank', 'Itaú', 'Bradesco', 'XP Investimentos', 'BTG Pactual'],
  bebidas_alcoolicas:       ['Ambev', 'Heineken Brasil', 'Grupo Petrópolis', 'Backer', 'Colorado'],
  bebidas_alcoolicas_vinho: ['Miolo', 'Aurora', 'Chandon Brasil', 'Concha y Toro Brasil', 'Salton'],
  agro:                     ['Syngenta', 'BASF Agro', 'Bayer Agro', 'Corteva', 'FMC Agrícola'],
  energia:                  ['Solfácil', 'BYD Solar', 'Canadian Solar Brasil', 'Intelbras Solar', 'Trina Solar'],
  industria:                ['WEG', 'Tigre', 'Schuller', 'Marcopolo', 'Embraer'],
  servicos:                 ['SAP Brasil', 'Oracle Brasil', 'Totvs', 'Accenture Brasil', 'Deloitte Brasil'],
};

/** Toyota segment competitors with display names */
export const TOYOTA_COMPETITORS = [
  { id: 'honda',       label: 'Honda' },
  { id: 'volkswagen',  label: 'Volkswagen' },
  { id: 'fiat',        label: 'Fiat' },
  { id: 'chevrolet',   label: 'Chevrolet' },
  { id: 'hyundai',     label: 'Hyundai' },
  { id: 'nissan',      label: 'Nissan' },
  { id: 'jeep',        label: 'Jeep' },
  { id: 'renault',     label: 'Renault' },
  { id: 'mitsubishi',  label: 'Mitsubishi' },
  { id: 'caoa-chery',  label: 'Caoa Chery' },
];

/** Strips HTML tags and collapses whitespace. Limits to maxLen chars. */
function stripHtml(html: string, maxLen = 9000): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, maxLen);
}

export interface ScrapedOffer {
  title: string;
  model?: string;        // ex: "Civic EX", "Taos Comfortline", "HRV Touring"
  description: string;
  highlights: string[];
  legalText: string;
  validFrom: string;
  validTo: string;
  competitor?: string;
  sourceUrl?: string;
}

/**
 * Fetches the text content of a competitor offer page via a CORS proxy,
 * then asks Gemini to extract structured offer data.
 */
export async function extractOffersFromUrl(
  url: string,
  competitor: string,
  apiKey: string,
): Promise<ScrapedOffer[]> {
  // 1 ── Fetch via public CORS proxy
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  let res: Response;
  try {
    res = await fetch(proxyUrl, { signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new Error('Não foi possível acessar a URL. Verifique sua conexão ou tente outra URL.');
  }
  if (!res.ok) {
    throw new Error(`Erro ao buscar a página (status ${res.status}). Tente outra URL.`);
  }

  const json = await res.json() as { contents?: string };
  const html = json.contents || '';
  if (!html || html.length < 200) {
    throw new Error('A página retornou conteúdo muito curto. O site pode bloquear este tipo de acesso.');
  }

  const pageText = stripHtml(html);
  if (pageText.length < 100) {
    throw new Error('Não foi possível extrair texto da página.');
  }

  // 2 ── Extract with Gemini
  const today = new Date().toISOString().split('T')[0];
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString().split('T')[0];

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `Você é um especialista em análise competitiva para o mercado brasileiro.

Extraia as ofertas/promoções do seguinte texto do site da marca "${competitor}".
Data de hoje: ${today}

TEXTO DO SITE:
${pageText}

Retorne APENAS um JSON válido com um array de ofertas encontradas. Cada oferta deve ter:
- title: título curto da oferta (string)
- description: descrição completa da oferta (string)
- highlights: array de bullets com as principais condições, ex: ["Taxa 0%", "Entrada zero", "IPVA grátis"] (string[])
- legalText: texto jurídico / asterisco se encontrado (string, vazio se não houver)
- validFrom: data de início no formato YYYY-MM-DD (use ${today} se não especificado)
- validTo: data de término no formato YYYY-MM-DD (use ${endOfMonth} se não especificado)

Retorne APENAS o JSON, sem markdown, sem explicações. Se não encontrar nenhuma oferta clara, retorne [].
Exemplo: [{"title":"Oferta X","description":"...","highlights":["Taxa 0%"],"legalText":"","validFrom":"${today}","validTo":"${endOfMonth}"}]`;

  let raw: string;
  try {
    const result = await model.generateContent(prompt);
    raw = result.response.text().trim();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    throw new Error(`Falha na IA: ${msg}`);
  }

  // Strip markdown fences if present
  const jsonStr = raw
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(jsonStr) as ScrapedOffer[];
    if (!Array.isArray(parsed)) throw new Error('Resposta não é um array');
    return parsed;
  } catch {
    throw new Error('A IA retornou um formato inesperado. Tente novamente.');
  }
}

/**
 * Uses Gemini with Google Search grounding to find current competitor offers
 * in the Brazilian market — no URL or CORS proxy needed.
 */
export async function searchCompetitorOffers(
  competitor: string,
  apiKey: string,
): Promise<ScrapedOffer[]> {
  const today = new Date().toISOString().split('T')[0];
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).toISOString().split('T')[0];
  const monthYear = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const genAI = new GoogleGenerativeAI(apiKey);
  // gemini-2.0-flash supports google_search grounding
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    // @ts-expect-error – SDK types lag behind; googleSearch is valid at runtime
    tools: [{ googleSearch: {} }],
  });

  const prompt = `Pesquise no Google as ofertas, promoções e condições especiais ATUAIS da marca ${competitor} no mercado brasileiro de automóveis em ${monthYear}.

Liste todas as ofertas encontradas. Para cada uma inclua:
- Modelo do veículo
- Condição especial (taxa de juros, entrada reduzida, desconto, bônus, IPVA grátis, etc.)
- Valores se disponíveis (preço, parcela, entrada)
- Validade da oferta

Retorne APENAS um JSON válido (sem markdown, sem texto extra):
[
  {
    "title": "Modelo — Condição principal",
    "description": "Descrição completa da oferta",
    "highlights": ["Taxa X%", "Parcelas de R$Y", "Bônus de R$Z"],
    "legalText": "Texto jurídico se houver, senão vazio",
    "validFrom": "${today}",
    "validTo": "data de validade no formato YYYY-MM-DD ou ${endOfMonth}"
  }
]

Se não encontrar nenhuma oferta confirmada, retorne [].`;

  let raw: string;
  try {
    const result = await model.generateContent(prompt);
    raw = result.response.text().trim();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    throw new Error(`Falha na busca com IA: ${msg}`);
  }

  // Strip markdown fences if present
  const jsonStr = raw
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/i, '')
    // Sometimes the model wraps in a code block with extra text before — find first [
    .replace(/^[\s\S]*?(\[)/m, '$1')
    .replace(/(\])[^]*$/m, '$1')
    .trim();

  try {
    const parsed = JSON.parse(jsonStr) as ScrapedOffer[];
    if (!Array.isArray(parsed)) throw new Error('Resposta não é um array');
    return parsed;
  } catch {
    // Last resort: try parsing the raw response
    try {
      const fallback = JSON.parse(raw) as ScrapedOffer[];
      if (Array.isArray(fallback)) return fallback;
    } catch { /* ignore */ }
    throw new Error('A IA retornou formato inesperado.');
  }
}

const OFFERS_CACHE_KEY = 'gss_offers_cache';
const OFFERS_CACHE_TTL = 2 * 60 * 60 * 1000; // 2h

interface OffersCacheEntry { ts: number; offers: ScrapedOffer[] }

export function getCachedOffers(segment: string): ScrapedOffer[] | null {
  try {
    const raw = localStorage.getItem(`${OFFERS_CACHE_KEY}_${segment}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as OffersCacheEntry;
    if (Date.now() - entry.ts > OFFERS_CACHE_TTL) return null;
    return entry.offers;
  } catch { return null; }
}

export function setCachedOffers(segment: string, offers: ScrapedOffer[]): void {
  try {
    localStorage.setItem(`${OFFERS_CACHE_KEY}_${segment}`, JSON.stringify({ ts: Date.now(), offers }));
  } catch { /* ignore */ }
}

export function clearOffersCache(segment: string): void {
  localStorage.removeItem(`${OFFERS_CACHE_KEY}_${segment}`);
}

/**
 * Uses Gemini + Google Search to find current offers from segment competitors in Brazil.
 */
// Stable official offers pages — verified 200 OK (May 2026)
const BRAND_OFFER_URLS: Record<string, string> = {
  'fiat':             'https://ofertas.fiat.com.br/',
  'volkswagen':       'https://ofertas.vw.com.br/',
  'vw':               'https://ofertas.vw.com.br/',
  'chevrolet':        'https://www.chevrolet.com.br/veiculos/ofertas',
  'toyota':           'https://www.toyota.com.br/ofertas',
  'renault':          'https://www.renault.com.br/ofertas.html',
  'honda':            'https://www.honda.com.br/automoveis/ofertas',
  'hyundai':          'https://www.hyundai.com.br/ofertas',
  'jeep':             'https://www.jeep.com.br/ofertas.html',
  'nissan':           'https://www.nissan.com.br/ofertas',
  'kia':              'https://www.kia.com/br/campaign/offers/',
  'byd':              'https://www.byd.com.br/ofertas',
  'gwm':              'https://www.gwmmotors.com.br/pt/saiba-mais/condicoes-comerciais',
  'caoa chery':       'https://www.caoachery.com.br/ofertas',
  'chery':            'https://www.caoachery.com.br/ofertas',
  'mg motor':         'https://mgmotoroficial.com.br/',
  'mg':               'https://mgmotoroficial.com.br/',
  'changan':          'https://caoachangan.com.br/',
  'caoa changan':     'https://caoachangan.com.br/',
  'gac motor':        'https://www.gacgroup.com/pt-br',
  'gac':              'https://www.gacgroup.com/pt-br',
  'jaecoo':           'https://www.omodajaecoo.com.br/ofertas',
  'omoda':            'https://www.omodajaecoo.com.br/ofertas',
};

function getStableOfferUrl(competitor: string): string | undefined {
  const key = (competitor || '').toLowerCase().trim();
  return BRAND_OFFER_URLS[key] || BRAND_OFFER_URLS[key.split(' ')[0]];
}

// Models with Google Search grounding support (verified available May 2026)
const GROUNDING_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
];

function buildOffersPrompt(brands: string, today: string, endOfMonth: string, monthYear: string, extraContext = ''): string {
  return `Quais são as ofertas e condições comerciais vigentes em ${monthYear} no Brasil para: ${brands}?
${extraContext}
Use suas próprias palavras para descrever cada oferta — não reproduza textos de sites.
Para cada modelo com condição especial ativa, crie um objeto JSON com:
- "competitor": nome da marca
- "model": nome do modelo (obrigatório)
- "title": condição principal resumida (ex: "Taxa Zero 24x", "Bônus R$5.000")
- "description": síntese da oferta em 1-2 frases originais
- "highlights": até 4 pontos-chave
- "legalText": ""
- "validFrom": "${today}"
- "validTo": "${endOfMonth}"
- "sourceUrl": site oficial da marca

Até 3 modelos por marca. Retorne APENAS JSON array válido sem markdown.`;
}

async function runGroundedSearch(prompt: string, genAI: GoogleGenerativeAI): Promise<ScrapedOffer[]> {
  const PROMO_WORDS = /taxa|bônus|bonus|ipva|juros|entrada|desconto|parcela|preço|oferta|promoção|grátis|pago|zero|cashback/i;
  const TIMEOUT_MS = 90_000;
  let lastError = '';
  for (const modelName of GROUNDING_MODELS) {
    // AbortController per attempt — signal passed via getGenerativeModel so buildFetchOptions wires it to fetch
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const model = genAI.getGenerativeModel(
        // @ts-expect-error – SDK types lag behind for tools
        { model: modelName, tools: [{ googleSearch: {} }] },
        { signal: controller.signal },
      );
      const result = await model.generateContent(prompt);
      clearTimeout(timer);
      const raw = result.response.text().trim();
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : raw;
      const parsed = JSON.parse(jsonStr) as ScrapedOffer[];
      if (!Array.isArray(parsed)) continue;
      return parsed.map(o => {
        // Always use stable brand offer page instead of volatile campaign URLs
        const stableUrl = getStableOfferUrl(o.competitor || '');
        const withUrl = stableUrl ? { ...o, sourceUrl: stableUrl } : o;
        if (withUrl.model && withUrl.model.trim()) return withUrl;
        const fromTitle = withUrl.title?.match(/^([A-Z][^—\-–:]+?)\s*(?:—|-|–|:| com | para )/i);
        if (fromTitle && fromTitle[1].length < 35 && !PROMO_WORDS.test(fromTitle[1]))
          return { ...withUrl, model: fromTitle[1].trim() };
        const brand = withUrl.competitor || '';
        const fromDesc = withUrl.description?.match(new RegExp(`${brand}\\s+([A-Z][\\w\\s-]{3,30}?)(?:\\s+com|\\s+0|\\.|,)`, 'i'));
        if (fromDesc && !PROMO_WORDS.test(fromDesc[1]))
          return { ...withUrl, model: fromDesc[1].trim() };
        return withUrl;
      });
    } catch (e: unknown) {
      clearTimeout(timer);
      const msg = e instanceof Error ? e.message : '';
      const name = e instanceof Error ? e.name : '';
      // Abort (timeout), HTTP errors, deprecated models, RECITATION → try next model
      const isRetryable = name === 'AbortError'
        || msg.toLowerCase().includes('abort')
        || msg.includes('404')
        || msg.includes('403')
        || msg.toLowerCase().includes('no longer available')
        || msg.toLowerCase().includes('recitation')
        || msg.toLowerCase().includes('blocked');
      if (isRetryable) {
        lastError = msg || 'timeout'; continue;
      }
      throw new Error(`Falha na busca: ${msg}`);
    }
  }
  throw new Error(`Falha na busca: ${lastError}`);
}

export async function searchSegmentOffers(
  segment: string,
  apiKey: string,
): Promise<ScrapedOffer[]> {
  const competitors = SEGMENT_COMPETITORS[segment];
  if (!competitors || competitors.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString().split('T')[0];
  const monthYear = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const genAI = new GoogleGenerativeAI(apiKey);

  const isAuto = segment === 'automotivo';

  if (isAuto) {
    // Parallel searches — rate limit is not an issue with 2 concurrent grounding calls
    const traditional = competitors.slice(0, 5).join(', ');
    const chineseBrands = ['BYD', 'GWM', 'Caoa Chery', 'MG Motor'];
    const chineseContext = `Foque nestas montadoras chinesas com presença no Brasil em ${monthYear}:\n- BYD: elétricos/híbridos (King, Dolphin, Seal, Tan, Yuan). Site: byd.com.br\n- GWM: Haval H6, H2, ORA 03. Site: gwmbrasil.com.br\n- Caoa Chery: Tiggo 5x, 7 Pro, 8 Pro. Site: caoa-chery.com.br\n- MG Motor: MG ZS, ZS EV, MG5, MG4. Site: mgbrasil.com.br\n- Changan: Uni-T, Uni-K, CS55 Plus. Site: changandobrasil.com.br\n- GAC Motor: GS3, GS4, GS8. Site: gac-motor.com.br\n- Jaecoo: J7, J8. Site: omodajaecoo.com.br\nRetorne apenas ofertas com fonte confirmada via Google Search.`;

    const [tradResult, chineseResult] = await Promise.allSettled([
      runGroundedSearch(buildOffersPrompt(traditional, today, endOfMonth, monthYear), genAI),
      runGroundedSearch(buildOffersPrompt(chineseBrands.join(', '), today, endOfMonth, monthYear, chineseContext), genAI),
    ]);

    const tradOffers = tradResult.status === 'fulfilled' ? tradResult.value : [];
    const chineseOffers = chineseResult.status === 'fulfilled' ? chineseResult.value : [];

    const all = [...tradOffers, ...chineseOffers];
    if (all.length === 0) throw new Error('Nenhuma oferta encontrada. Tente novamente.');
    return all;
  }

  // Non-auto segments: single search
  const top = competitors.slice(0, 6).join(', ');
  return runGroundedSearch(buildOffersPrompt(top, today, endOfMonth, monthYear), genAI);
}

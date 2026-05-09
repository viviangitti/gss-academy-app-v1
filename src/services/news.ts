import type { Segment, NewsItem } from '../types';

export type NewsCategory = 'tudo' | 'lancamentos' | 'ofertas' | 'concorrencia' | 'mercado';

// Cache local para não martelar API
const CACHE_KEY = 'gss_news_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

interface CacheEntry {
  ts: number;
  items: NewsItem[];
}

// Termos base expandidos por segmento
const SEGMENT_BASE: Record<string, string> = {
  farmaceutico: '(farmacêutica OR medicamentos OR laboratório OR drogaria OR farmácia)',
  automotivo: '(automotivo OR automóveis OR veículos OR concessionária OR montadora)',
  automotivo_luxo: '(carros de luxo OR premium OR Porsche OR BMW OR Mercedes OR Audi OR Lexus)',
  tecnologia: '(tecnologia OR software OR SaaS OR startup OR plataforma digital)',
  varejo: '(varejo OR e-commerce OR lojas OR shopping OR consumo)',
  imobiliario: '(imobiliário OR imóveis OR construtoras OR incorporadora OR lançamentos imobiliários)',
  financeiro: '(bancos OR seguros OR fintech OR investimentos OR mercado financeiro)',
  industria: '(indústria OR manufatura OR produção industrial OR fábrica)',
  saude: '(saúde OR hospitais OR clínicas OR estética OR odontologia)',
  educacao: '(educação OR escolas OR edtech OR cursos OR universidade)',
  servicos: '(serviços OR consultoria empresarial OR terceirização)',
  agro: '(agronegócio OR agricultura OR safra OR commodities OR pecuária)',
  energia: '(energia solar OR renovável OR fotovoltaico OR sustentabilidade energética)',
  bebidas_alcoolicas: '(bebidas alcoólicas OR cerveja OR destilados OR cachaça OR gin OR whisky OR distribuidora de bebidas OR mercado de bebidas Brasil)',
  bebidas_alcoolicas_vinho: '(vinho OR vinhos OR importadora de vinho OR enologia OR adega OR safra vinho OR mercado de vinhos Brasil)',
};

// Queries específicas por categoria — múltiplas para garantir volume
const CATEGORY_QUERIES: Record<NewsCategory, string[]> = {
  tudo: [''],
  lancamentos: [
    'lançamento',
    'novo produto',
    'estreia',
    'apresenta',
    'inovação',
  ],
  ofertas: [
    '"condições especiais"',
    'promoção',
    'desconto',
    'campanha comercial',
    'pacote',
    '"black friday"',
    'benefícios',
    'cashback',
  ],
  concorrencia: [
    'concorrência',
    'disputa de mercado',
    'rival',
    'estratégia',
    'movimento',
    'aquisição',
    'fusão',
  ],
  mercado: [
    'tendências',
    'análise',
    'crescimento',
    'previsão',
    'mercado',
    'setor',
  ],
};

function cacheKey(segment: string, cat: NewsCategory): string {
  return `${CACHE_KEY}_${segment}_${cat}`;
}

function getCached(segment: string, cat: NewsCategory): NewsItem[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(segment, cat));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts > CACHE_TTL) return null;
    return entry.items;
  } catch {
    return null;
  }
}

function setCached(segment: string, cat: NewsCategory, items: NewsItem[]): void {
  try {
    const entry: CacheEntry = { ts: Date.now(), items };
    localStorage.setItem(cacheKey(segment, cat), JSON.stringify(entry));
  } catch { /* storage cheio, ignore */ }
}

async function fetchFromGoogleNews(query: string, limit: number): Promise<NewsItem[]> {
  const encoded = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  // rss2json free não aceita 'count' — limitamos no cliente
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) return [];
    return data.items.slice(0, limit).map((item: { title: string; link: string; pubDate: string; description: string }) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.description?.replace(/<[^>]*>/g, '').slice(0, 150) || '',
    }));
  } catch {
    return [];
  }
}

function dedupeByTitle(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    // Remove sufixo de fonte do Google News (ex: "Notícia - G1")
    const key = item.title.replace(/\s*-\s*[^-]+$/, '').toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortByDate(items: NewsItem[]): NewsItem[] {
  return items.sort((a, b) => {
    try {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    } catch {
      return 0;
    }
  });
}

// Compatível com a Home
export async function fetchNews(segment: Segment): Promise<NewsItem[]> {
  if (!segment) return [];
  return fetchNewsByCategory(segment, 'tudo');
}

export async function fetchNewsByCategory(segment: Segment, category: NewsCategory): Promise<NewsItem[]> {
  if (!segment) return [];

  // Cache primeiro
  const cached = getCached(segment, category);
  if (cached) return cached;

  const base = SEGMENT_BASE[segment] || segment;
  const categoryQueries = CATEGORY_QUERIES[category];

  // Para "tudo", faz uma query ampla
  if (category === 'tudo') {
    const items = await fetchFromGoogleNews(base, 25);
    const result = sortByDate(dedupeByTitle(items));
    setCached(segment, category, result);
    return result;
  }

  // Para categorias específicas, faz 3-4 queries em paralelo e junta
  const selectedQueries = categoryQueries.slice(0, 4);
  const promises = selectedQueries.map(q =>
    fetchFromGoogleNews(`${base} ${q}`, 8)
  );

  const results = await Promise.all(promises);
  const allItems = results.flat();
  const deduped = dedupeByTitle(allItems);
  const sorted = sortByDate(deduped).slice(0, 20);

  // Se veio pouco, faz fallback pra categoria "tudo"
  if (sorted.length < 3) {
    const fallback = await fetchFromGoogleNews(base, 20);
    const merged = sortByDate(dedupeByTitle([...sorted, ...fallback])).slice(0, 20);
    setCached(segment, category, merged);
    return merged;
  }

  setCached(segment, category, sorted);
  return sorted;
}

// Limpa cache quando usuário quer forçar refresh
export function clearNewsCache(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY));
    keys.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

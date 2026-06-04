import type { Segment, NewsItem } from '../types';

// Notícias são buscadas AO VIVO do Google News (grátis, sempre frescas).
// O banco central do Firestore (segmentNews) ficou reservado para casos que custam (ofertas via Gemini).

export type NewsCategory = 'tudo' | 'lancamentos' | 'ofertas' | 'mercado' | 'marketing' | 'concorrentes';
export type NewsGeo = 'brasil' | 'mundo';

// Queries para notícias de marketing — usadas quando userAccessType é 'marketing' ou 'ambos'
// Organizadas por tipo: Eventos, Mídia, Parcerias, Tendências

const MARKETING_QUERIES_BR = [
  // 🎪 Eventos
  'evento marketing automotivo ativação showroom fórum lançamento Brasil 2025',
  'salão automotivo motorshow expo evento marca lançamento novidade Brasil',
  'ativação ponto de venda PDV concessionária experiência marca luxury 2025',
  // 📺 Mídia
  'campanha mídia veiculação TV digital outdoor anúncio automóvel premium Brasil 2025',
  'publicidade digital programática Google Meta TikTok marca automotiva premium Brasil',
  'mídia OOH outdoor DOOH campanha premium automotivo lançamento publicidade',
  // 🤝 Parcerias
  'parceria patrocínio marca automotiva esporte cultural luxo collab Brasil 2025',
  'brand ambassador influencer parceria marca luxury automotive colaboração',
  'co-branding parceria premium lifestyle moda arte marca automotiva',
  // 📊 Tendências & Branding
  'tendência marketing luxury brand premium experiência cliente CX 2025 Brasil',
  'storytelling branding campanha digital social media marca automotiva premium',
];

const MARKETING_QUERIES_WORLD = [
  // Events
  'luxury automotive marketing event activation launch summit 2025',
  'brand activation experiential marketing luxury showroom global',
  // Media
  'luxury brand advertising campaign media digital OOH 2025',
  'premium automotive programmatic digital marketing media buying',
  // Partnerships
  'luxury brand partnership sponsorship collaboration sport art 2025',
  'brand ambassador influencer luxury automotive partnership collaboration',
  // Trends
  'luxury brand marketing strategy trend digital 2025',
  'luxury customer experience CX retail omnichannel innovation',
];

// Queries de ações de marketing da concorrência — por segmento
const COMPETITOR_MKT_QUERIES: Partial<Record<string, string[]>> = {
  automotivo: [
    'campanha publicitária marketing Volkswagen Fiat Toyota Hyundai Honda concessionária Brasil',
    'ação marketing digital BYD GWM Chery Changan lançamento campanha anúncio',
    'campanha TV internet marketing automóvel concorrente Brasil 2025',
    'patrocínio evento ativação marca automotiva concorrente Brasil',
  ],
  automotivo_luxo: [
    'campanha marketing BMW Mercedes Porsche Audi Land Rover Range Rover Brasil',
    'ativação evento experiência marca luxo automotivo concorrente',
    'publicidade digital premium luxury car campanha Brasil 2025',
    'lançamento campanha marca luxo event ação concorrente automotivo',
  ],
  farmaceutico: [
    'campanha marketing laboratório farmácia medicamento publicidade Brasil',
    'ação marketing digital farmácias Drogasil Raia Pacheco campanha',
    'marketing farmacêutico campanha consciência saúde publicidade concorrente',
    'laboratório campanha produto publicidade divulgação mídia Brasil',
  ],
  varejo: [
    'campanha marketing Magazine Luiza Americanas Casas Bahia Renner concorrente',
    'ação marketing digital varejo promoção publicidade loja campanha Brasil',
    'influencer parceria marca varejo concorrente campanha digital',
    'campanha retail varejo Black Friday promoção anúncio concorrente',
  ],
  tecnologia: [
    'campanha marketing software SaaS empresa tecnologia concorrente Brasil',
    'ação marketing B2B tecnologia publicidade digital campanha 2025',
    'evento tech marketing empresa software concorrente lançamento',
    'marketing tecnologia Google Microsoft SAP Totvs campanha Brasil',
  ],
  imobiliario: [
    'campanha marketing MRV Cyrela Trisul construtora incorporadora concorrente',
    'ação marketing digital imobiliária lançamento campanha anúncio publicidade',
    'marketing imóvel branding incorporadora evento lançamento concorrente',
    'publicidade TV digital imobiliário campanha concorrente Brasil 2025',
  ],
  financeiro: [
    'campanha marketing banco seguradora fintech concorrente publicidade Brasil',
    'ação marketing digital Nubank Itaú Bradesco XP campanha publicidade',
    'marketing seguros consórcio campanha publicidade influencer parceria',
    'evento patrocínio branding banco fintech campanha concorrente Brasil',
  ],
  saude: [
    'campanha marketing clínica hospital plano saúde Unimed Hapvida concorrente',
    'ação marketing digital saúde estética publicidade campanha Brasil',
    'marketing saúde consciência campanha publicidade mídia concorrente',
    'patrocínio evento saúde marca campanha concorrente Brasil 2025',
  ],
  educacao: [
    'campanha marketing universidade escola faculdade EAD concorrente Brasil',
    'ação marketing digital educação plataforma publicidade campanha',
    'marketing educacional edtech campanha publicidade influencer',
    'evento branding escola faculdade lançamento campanha concorrente',
  ],
  agro: [
    'campanha marketing defensivo agrícola semente fertilizante concorrente Syngenta BASF',
    'ação marketing agronegócio publicidade campanha feiras concorrente',
    'marketing agro evento Agrishow Expointer campanha marca concorrente',
    'publicidade agro digital campanha agricultor produtor concorrente Brasil',
  ],
  energia: [
    'campanha marketing energia solar concorrente publicidade instaladora Brasil',
    'ação marketing digital solar campanha publicidade influencer parceria',
    'marketing energia renovável evento campanha publicidade concorrente Brasil',
    'publicidade solar patrocínio evento marca campanha concorrente 2025',
  ],
  bebidas_alcoolicas: [
    'campanha marketing Ambev Heineken Diageo concorrente publicidade Brasil',
    'ação marketing digital cerveja destilado campanha influencer parceria',
    'patrocínio evento cerveja spirits marca campanha concorrente Brasil',
    'publicidade bebida alcoólica campanha TV digital mídia concorrente',
  ],
  bebidas_alcoolicas_vinho: [
    'campanha marketing vinho vinícola importadora concorrente publicidade Brasil',
    'ação marketing digital vinho influencer sommelier campanha',
    'evento enogastronomia vinho marketing campanha concorrente Brasil',
    'publicidade vinho digital TV marketing marca concorrente Brasil 2025',
  ],
};

const COMPETITOR_MKT_QUERIES_WORLD: string[] = [
  'competitor marketing campaign automotive luxury brand 2025',
  'brand activation event experiential marketing competitor',
  'competitor digital marketing campaign social media influencer',
  'advertising campaign competitor brand strategy launch 2025',
];

const COMPETITOR_MKT_FALLBACK_BR = [
  'campanha marketing concorrente publicidade ação marca Brasil 2025',
  'ação marketing digital concorrente campanha publicidade influencer',
  'ativação evento branding concorrente campanha mídia Brasil',
  'publicidade concorrente TV digital redes sociais campanha 2025',
];

export async function fetchCompetitorMarketingNews(segment: string, geo: NewsGeo = 'brasil'): Promise<NewsItem[]> {
  const cKey = `${CACHE_KEY}_concorrentes_${segment}_${geo}`;
  try {
    const raw = localStorage.getItem(cKey);
    if (raw) {
      const entry = JSON.parse(raw) as CacheEntry;
      if (Date.now() - entry.ts < CACHE_TTL) return entry.items;
    }
  } catch { /* ignore */ }

  const queries = geo === 'mundo'
    ? COMPETITOR_MKT_QUERIES_WORLD
    : (COMPETITOR_MKT_QUERIES[segment] || COMPETITOR_MKT_FALLBACK_BR);

  const selected = queries.slice(0, 4);
  const results = await Promise.all(selected.map(q => fetchFromGoogleNews(q, 8, geo)));
  const all = dedupeByTitle(results.flat());
  const sorted = sortByDate(all).slice(0, 25);

  try {
    localStorage.setItem(cKey, JSON.stringify({ ts: Date.now(), items: sorted }));
  } catch { /* ignore */ }

  return sorted;
}

// Queries de marketing específicas por segmento — eventos, mídia e parcerias do setor
const SEGMENT_MARKETING_QUERIES: Partial<Record<string, string[]>> = {
  automotivo: [
    'evento automotivo ativação lançamento concessionária Brasil 2025',
    'campanha mídia TV digital veiculação carro anúncio Brasil',
    'parceria patrocínio marca carro esporte collab influencer Brasil',
    'marketing digital concessionária redes sociais lead geração',
    'tendência marketing automotivo experiência cliente showroom Brasil',
  ],
  automotivo_luxo: [
    'evento ativação luxury car brand experiência showroom lançamento Brasil 2025',
    'campanha mídia veiculação TV digital luxury automotive premium Brasil',
    'parceria patrocínio marca luxo arte esporte collab influencer premium Brasil',
    'experiência cliente luxury CX concessionária premium premium brand',
    'marketing digital luxury brand social media content Land Rover BMW Porsche',
  ],
  varejo: [
    'evento varejo feira consumidor lançamento Brasil 2025',
    'campanha mídia digital TV varejo publicidade anúncio',
    'parceria marca varejo co-branding patrocínio influencer Brasil',
    'tendência marketing varejo omnichannel digital experiência',
  ],
  financeiro: [
    'evento fórum financeiro fintech congresso marketing 2025',
    'campanha mídia seguro banco financeiro veiculação digital TV',
    'parceria patrocínio marca financeira collab influencer',
    'marketing digital financeiro redes sociais lead conversão',
  ],
  imobiliario: [
    'evento lançamento imóvel ativação stand feira imobiliária Brasil',
    'campanha mídia digital TV imóvel publicidade anúncio Brasil',
    'parceria patrocínio construtora incorporadora collab influencer',
    'marketing digital imobiliário conteúdo Instagram lead geração',
  ],
};

export async function fetchMarketingNews(geo: NewsGeo = 'brasil', segment?: string): Promise<NewsItem[]> {
  const cKey = `${CACHE_KEY}_marketing_${segment || 'generic'}_${geo}`;
  try {
    const raw = localStorage.getItem(cKey);
    if (raw) {
      const entry = JSON.parse(raw) as CacheEntry;
      if (Date.now() - entry.ts < CACHE_TTL) return entry.items;
    }
  } catch { /* ignore */ }

  let queries: string[];
  if (geo === 'mundo') {
    queries = MARKETING_QUERIES_WORLD;
  } else if (segment && SEGMENT_MARKETING_QUERIES[segment]) {
    // Blend segment-specific with generic queries for better coverage
    const segQueries = SEGMENT_MARKETING_QUERIES[segment]!;
    const genericExtra = MARKETING_QUERIES_BR.filter((_, i) => i >= 6); // last 5 (tendências)
    queries = [...segQueries, ...genericExtra].slice(0, 8);
  } else {
    queries = MARKETING_QUERIES_BR;
  }

  const selected = queries.slice(0, 6);
  const results = await Promise.all(selected.map(q => fetchFromGoogleNews(q, 8, geo)));
  const all = dedupeByTitle(results.flat());
  const sorted = sortByDate(all).slice(0, 25);

  try {
    localStorage.setItem(cKey, JSON.stringify({ ts: Date.now(), items: sorted }));
  } catch { /* ignore */ }

  return sorted;
}

// Cache local para não martelar API
const CACHE_KEY = 'gss_news_cache_v5'; // bump version to clear old generic queries
const CACHE_TTL = 20 * 60 * 1000; // 20 min — notícias ao vivo

interface CacheEntry {
  ts: number;
  items: NewsItem[];
}

// Termos base globais (sem "Brasil") para notícias mundiais
const SEGMENT_BASE_WORLD: Record<string, string> = {
  farmaceutico:           '(pharmaceutical OR drug launch OR FDA OR EMA OR clinical trial)',
  automotivo:             '(BYD OR GWM OR Chery OR MG OR Changan OR GAC OR Jaecoo OR electric vehicle EV launch OR automotive OR car market trends)',
  automotivo_luxo:        '(luxury car OR premium automotive OR Porsche OR BMW OR Ferrari launch)',
  tecnologia:             '(technology OR SaaS OR AI software OR startup OR platform)',
  varejo:                 '(retail OR e-commerce OR consumer trends OR shopping)',
  imobiliario:            '(real estate OR property market OR construction trends)',
  financeiro:             '(banking OR fintech OR investment OR financial markets)',
  industria:              '(manufacturing OR industry OR production trends)',
  saude:                  '(healthcare OR medical OR health trends OR pharma)',
  educacao:               '(education OR edtech OR learning OR university)',
  servicos:               '(consulting OR business services OR outsourcing)',
  agro:                   '(agribusiness OR agriculture OR crop OR commodities)',
  energia:                '(solar energy OR renewable OR photovoltaic OR clean energy)',
  bebidas_alcoolicas:     '(beer OR spirits OR alcoholic beverages OR drinks industry)',
  bebidas_alcoolicas_vinho: '(wine OR winery OR viticulture OR wine market)',
};

// Queries base por segmento — orientadas ao vendedor, não ao setor genérico
// Foco: o que afeta o fechamento, o que o cliente está lendo, o que o concorrente está fazendo
const SEGMENT_BASE: Record<string, string> = {
  farmaceutico:
    '(novo medicamento aprovado ANVISA OR genérico lançamento OR farmácia campanha promoção OR medicamento similar preço OR OTC automedicação Brasil)',
  automotivo:
    'lançamento carro Brasil 2026 OR emplacamentos OR BYD Fiat Volkswagen Toyota oferta',
  automotivo_luxo:
    '(carro luxo lançamento Brasil OR BMW OR Mercedes OR Porsche OR Audi OR Land Rover OR test drive OR importado câmbio)',
  tecnologia:
    '(software empresa lançamento OR SaaS preço OR transformação digital PME OR contrato tecnologia OR licença software Brasil)',
  varejo:
    '(promoção varejo Brasil OR consumidor compra OR crediário juros OR comércio vendas OR lojista campanha OR Black Friday OR liquidação)',
  imobiliario:
    '(lançamento imóvel OR Selic impacto financiamento imóvel OR MCMV OR construtora condições OR FGTS imóvel OR permuta imóvel OR VGV)',
  financeiro:
    '(seguro novo produto OR plano capitalização OR consórcio OR taxa corretagem OR sinistro OR seguradora campanha OR fundo investimento lançamento)',
  industria:
    '(insumo industrial preço OR matéria-prima custo OR contrato fornecimento OR licitação OR importação insumo OR prazo entrega indústria)',
  saude:
    '(tratamento estético lançamento OR procedimento novo clínica OR plano saúde cobertura OR equipamento médico homologado OR odontologia implante preço)',
  educacao:
    '(bolsa estudo OR financiamento educacional OR curso novo lançamento OR ENEM matrícula OR mensalidade escola OR edtech plataforma)',
  servicos:
    '(contrato consultoria OR outsourcing demanda OR terceirização tendência OR RH empresa serviços OR licita serviços OR contrato serviço renovação)',
  agro:
    '(defensivo agrícola lançamento OR semente nova tecnologia OR safra previsão OR crédito rural condições OR cotação commodities OR insumo agro preço)',
  energia:
    '(energia solar instalação OR painéis fotovoltaicos preço OR financiamento solar OR distribuidora energia tarifa OR desconto energia renovável OR crédito BNDES)',
  bebidas_alcoolicas:
    '(cerveja lançamento Brasil OR destilado nova marca OR distribuidora bebidas PDV OR promoção bebidas supermercado OR bar restaurante consumo OR gin cachaça whisky)',
  bebidas_alcoolicas_vinho:
    '(vinho importado lançamento OR vinícola nova safra OR importadora vinho promoção OR vinho nacional premiado OR harmonização restaurante OR enoturismo)',
};

// Queries específicas por segmento+categoria — voltadas ao dia a dia do vendedor
const SEGMENT_CATEGORY_OVERRIDES: Partial<Record<string, Partial<Record<NewsCategory, string[]>>>> = {
  automotivo: {
    lancamentos: [
      'BYD GWM "Caoa Chery" "MG Motor" Changan GAC Jaecoo lançamento novo modelo Brasil 2025',
      'Fiat Volkswagen Chevrolet Toyota Renault Honda Hyundai novo modelo lançamento Brasil',
      'elétrico híbrido lançamento preço concessionária Brasil',
      'SUV pickup sedan novo Brasil montadora',
      'Nissan Jeep Toyota Renault facelift nova versão Brasil',
    ],
    mercado: [
      'BYD GWM "Caoa Chery" "MG Motor" Changan GAC Jaecoo chinês mercado automotivo Brasil emplacamentos crescimento',
      'financiamento veículo Selic taxa juros impacto vendas 2025',
      'emplacamentos carros Brasil ranking marcas crescimento queda',
      'consumidor intenção compra carro pesquisa Brasil',
      'seminovos usados mercado preço tabela fipe',
      'elétrico híbrido incentivo isenção IPVA Brasil',
    ],
  },
  automotivo_luxo: {
    lancamentos: [
      'BMW Mercedes Porsche Audi lançamento Brasil 2025',
      'importado luxo novo modelo preço Brasil',
      'SUV luxo estreia concessionária Brasil',
      'elétrico premium lançamento Tesla Volvo Land Rover',
    ],
    mercado: [
      'câmbio dólar impacto carro importado',
      'alto padrão consumo luxo Brasil tendência',
      'IPTU IPVA isenção carro elétrico 2025',
      'milionários Brasil consumo premium pesquisa',
    ],
  },
  farmaceutico: {
    lancamentos: [
      'medicamento aprovado ANVISA 2025',
      'genérico similar lançamento laboratório Brasil',
      'produto farmacêutico OTC novo lançamento',
      'suplemento vitamina lançamento farmácia',
    ],
    mercado: [
      'automedicação crescimento Brasil pesquisa',
      'dermocosméticos suplementos tendência vendas',
      'farmácia popular crescimento mercado',
      'prescrição digital receita eletrônica impacto',
    ],
  },
  tecnologia: {
    lancamentos: [
      'software SaaS lançamento novidade Brasil',
      'plataforma digital nova PME empresas',
      'ferramenta produtividade lançamento empresa',
      'ERP CRM novo sistema lançamento Brasil',
    ],
    mercado: [
      'transformação digital PME investimento 2025',
      'LGPD conformidade empresa software demanda',
      'inteligência artificial adoção empresa Brasil',
      'corte custo tecnologia empresa tendência',
    ],
  },
  varejo: {
    lancamentos: [
      'marca produto novo varejo Brasil lançamento',
      'linha produto nova franquia loja Brasil',
      'produto exclusivo loja parceria novidade',
    ],
    mercado: [
      'consumidor renda intenção compra índice',
      'crediário parcelamento juros varejo tendência',
      'e-commerce varejo físico omnichannel Brasil',
      'Black Friday data 2025 varejo expectativa',
    ],
  },
  imobiliario: {
    lancamentos: [
      'lançamento imóvel empreendimento novo Brasil',
      'construtora incorporadora lançamento VGV',
      'MCMV programa habitacional novo',
      'apartamento casa lançamento planta novo',
    ],
    mercado: [
      'Selic queda alta impacto financiamento imóvel',
      'FGTS regras compra imóvel 2025',
      'aluguel preço alta baixa Brasil',
      'comprador imóvel perfil pesquisa tendência',
    ],
  },
  financeiro: {
    lancamentos: [
      'seguro produto novo lançamento Brasil',
      'consórcio nova carta crédito condição',
      'investimento plano novo lançamento banco',
      'fintech produto financeiro novo Brasil',
    ],
    mercado: [
      'Selic taxa juros decisão impacto',
      'inadimplência crédito pessoa física tendência',
      'seguro vida saúde crescimento demanda Brasil',
      'renda variável fixa comportamento investidor',
    ],
  },
  agro: {
    lancamentos: [
      'defensivo agrícola novo produto lançamento',
      'semente tecnologia nova safra 2025',
      'máquina agrícola equipamento novo lançamento',
      'fertilizante biológico novo produto',
    ],
    mercado: [
      'safra previsão produção grãos Brasil 2025',
      'crédito rural Plano Safra condições',
      'cotação soja milho boi preço hoje',
      'insumo agro preço custo produção',
    ],
  },
  energia: {
    lancamentos: [
      'painel solar novo modelo eficiência lançamento',
      'bateria armazenamento energia novo produto',
      'solução energia solar residencial comercial novo',
      'inversor solar novo lançamento Brasil',
    ],
    mercado: [
      'tarifa energia elétrica aumento 2025',
      'payback energia solar prazo retorno',
      'financiamento BNDES solar condições 2025',
      'desconto conta luz solar instalação',
    ],
  },
  saude: {
    lancamentos: [
      'equipamento estético novo aprovado ANVISA',
      'tratamento procedimento novo clínica',
      'aparelho odontológico implante novo',
      'plano saúde novo produto cobertura',
    ],
    mercado: [
      'consumidor saúde gasto tendência pesquisa',
      'plano saúde mensalidade reajuste impacto',
      'estética saúde preventiva crescimento demanda',
      'odontologia implante mercado crescimento',
    ],
  },
  educacao: {
    lancamentos: [
      'curso novo lançamento escola faculdade EAD',
      'plataforma edtech novo produto Brasil',
      'programa educacional novo parceria',
      'graduação pós-graduação novo curso 2025',
    ],
    mercado: [
      'matrícula evasão tendência ensino',
      'ENEM vestibular impacto inscrições',
      'bolsa ProUni FIES condições 2025',
      'educação corporativa treinamento demanda empresa',
    ],
  },
  servicos: {
    lancamentos: [
      'serviço empresa novo contrato lançamento',
      'consultoria produto novo oferta',
      'outsourcing serviço novo pacote empresa',
    ],
    mercado: [
      'terceirização tendência empresa Brasil 2025',
      'contrato serviço renovação empresa corte',
      'RH folha pagamento gestão demanda',
      'compliance auditoria empresa demanda crescimento',
    ],
  },
  industria: {
    lancamentos: [
      'máquina equipamento industrial novo lançamento',
      'insumo material novo produto indústria',
      'automação robótica industrial novo Brasil',
    ],
    mercado: [
      'matéria-prima custo aço plástico tendência',
      'prazo entrega frete logística indústria',
      'importação exportação industrial câmbio',
      'indústria pedidos demanda crescimento queda',
    ],
  },
  bebidas_alcoolicas: {
    lancamentos: [
      'cerveja nova marca lançamento Brasil',
      'gin cachaça whisky novo produto lançamento',
      'bebida alcoólica nova embalagem sabor',
      'craft artesanal cerveja lançamento',
    ],
    mercado: [
      'bar restaurante consumo bebida tendência',
      'supermercado bebida alcoólica vendas volume',
      'imposto bebida alcoólica tributação 2025',
      'consumidor bebida alcoólica pesquisa hábito',
    ],
  },
  bebidas_alcoolicas_vinho: {
    lancamentos: [
      'vinho novo rótulo lançamento Brasil',
      'vinícola nova safra premiada',
      'importadora vinho novo produto portfólio',
      'espumante prosecco novo lançamento',
    ],
    mercado: [
      'consumo vinho Brasil crescimento pesquisa',
      'importação vinho câmbio preço impacto',
      'sommelier mercado vinho tendência',
      'restaurante adega carta vinhos tendência',
    ],
  },
};

// RSS feeds diretos por segmento+categoria
// Usados EM VEZ das queries Google News quando definidos
const SEGMENT_RSS_FEEDS: Partial<Record<string, Partial<Record<NewsCategory, string[]>>>> = {
  farmaceutico: {
    tudo: [
      'https://www.panoramafarmaceutico.com.br/feed/',
      'https://www.saudebusiness.com/feed/',
    ],
    lancamentos: [
      'https://www.panoramafarmaceutico.com.br/feed/',
      // Google News query via RSS — aprovações e novos produtos ANVISA
      'https://news.google.com/rss/search?q=medicamento+aprovado+ANVISA+2025&hl=pt-BR&gl=BR&ceid=BR:pt-419',
      'https://news.google.com/rss/search?q=novo+medicamento+laborat%C3%B3rio+Brasil+lan%C3%A7a&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    ],
    mercado: [
      'https://www.saudebusiness.com/feed/',
      'https://www.panoramafarmaceutico.com.br/feed/',
    ],
  },
};

// Queries genéricas por categoria — usadas como fallback quando não há override por segmento
const CATEGORY_QUERIES: Record<NewsCategory, string[]> = {
  tudo: [''],
  lancamentos: [
    'lançamento novo produto Brasil 2025',
    'estreia novo modelo versão Brasil',
    'novidade produto mercado apresenta',
  ],
  ofertas: [
    'condições especiais promoção campanha',
    'desconto oferta cashback cliente',
    'campanha comercial incentivo compra',
  ],
  mercado: [
    'tendência consumidor compra comportamento',
    'mercado crescimento queda demanda 2025',
    'economia impacto vendas setor Brasil',
  ],
  marketing: [
    'marketing digital tendência 2025 Brasil',
    'branding campanha marca premium',
  ],
  concorrentes: [
    'campanha marketing concorrente publicidade ação Brasil',
    'ativação evento branding concorrente campanha mídia',
  ],
};

function cacheKey(segment: string, cat: NewsCategory, geo: NewsGeo): string {
  return `${CACHE_KEY}_${segment}_${cat}_${geo}`;
}

function getCached(segment: string, cat: NewsCategory, geo: NewsGeo): NewsItem[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(segment, cat, geo));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts > CACHE_TTL) return null;
    return entry.items;
  } catch {
    return null;
  }
}

function setCached(segment: string, cat: NewsCategory, geo: NewsGeo, items: NewsItem[]): void {
  try {
    const entry: CacheEntry = { ts: Date.now(), items };
    localStorage.setItem(cacheKey(segment, cat, geo), JSON.stringify(entry));
  } catch { /* storage cheio, ignore */ }
}

// Normaliza links que podem ser quebrados (Google News redirect URLs intermediárias)
// Substitui por URL de busca no Google News, que sempre funciona
function normalizeNewsLink(title: string, link: string, geo: NewsGeo): string {
  if (!link || !link.startsWith('http')) {
    const q = encodeURIComponent(title);
    return geo === 'mundo'
      ? `https://news.google.com/search?q=${q}&hl=en&gl=US&ceid=US:en`
      : `https://news.google.com/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  }
  // URLs de redirect interno do Google News RSS (/rss/rd/, /rss/articles/) são instáveis
  if (link.includes('news.google.com/rss/') || link.includes('/rss/rd/articles')) {
    const q = encodeURIComponent(title);
    return geo === 'mundo'
      ? `https://news.google.com/search?q=${q}&hl=en&gl=US&ceid=US:en`
      : `https://news.google.com/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  }
  return link;
}

async function fetchFromGoogleNews(query: string, limit: number, geo: NewsGeo = 'brasil'): Promise<NewsItem[]> {
  const encoded = encodeURIComponent(query);
  const geoParams = geo === 'mundo'
    ? 'hl=en&gl=US&ceid=US:en'
    : 'hl=pt-BR&gl=BR&ceid=BR:pt-419';
  const rssUrl = `https://news.google.com/rss/search?q=${encoded}&${geoParams}`;
  // rss2json free não aceita 'count' — limitamos no cliente
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) return [];
    return data.items.slice(0, limit).map((item: { title: string; link: string; pubDate: string; description: string }) => ({
      title: item.title,
      link: normalizeNewsLink(item.title, item.link, geo),
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

export async function fetchNewsByCategory(segment: Segment, category: NewsCategory, geo: NewsGeo = 'brasil'): Promise<NewsItem[]> {
  if (!segment) return [];

  // Cache local de 30 min (evita refetch a cada navegação, mas mantém frescor)
  const cached = getCached(segment, category, geo);
  if (cached) return cached;

  // Notícias AO VIVO do Google News — grátis e sempre frescas, atualizando sozinhas.
  // (Banco central do Firestore é usado só para ofertas, que custam via Gemini.)
  const items = await fetchRawNews(segment, category, geo);
  if (items.length > 0) setCached(segment, category, geo, items);
  return items;
}

/**
 * Busca notícias DIRETO do RSS/Google News, ignorando cache e banco central.
 * Usado pelo admin (/noticias-admin) para alimentar o banco do Firestore.
 * NÃO use no fluxo normal do usuário — isso faria cada usuário puxar notícias.
 */
export async function fetchRawNews(segment: Segment, category: NewsCategory, geo: NewsGeo = 'brasil'): Promise<NewsItem[]> {
  if (!segment) return [];

  const base = SEGMENT_BASE[segment] || segment;
  const baseWorld = SEGMENT_BASE_WORLD[segment] || base;
  const effectiveBase = geo === 'mundo' ? baseWorld : base;

  // 1 ── RSS diretos por segmento+categoria — skip for 'mundo'
  if (geo !== 'mundo') {
    const rssFeeds = SEGMENT_RSS_FEEDS[segment]?.[category];
    if (rssFeeds && rssFeeds.length > 0) {
      const promises = rssFeeds.map(url => fetchFromGoogleNews(url, 12, geo));
      const results = await Promise.all(promises);
      const allItems = results.flat();
      const deduped = dedupeByTitle(allItems);
      const sorted = sortByDate(deduped).slice(0, 25);
      if (sorted.length >= 3) return sorted;
      // fallback se feeds diretos vieram vazios
    }
  }

  // 2 ── Google News queries (genéricas ou override por segmento)
  const overrides = SEGMENT_CATEGORY_OVERRIDES[segment];
  const categoryQueries = (overrides?.[category]) ?? CATEGORY_QUERIES[category];

  // Para "tudo", faz uma query ampla
  if (category === 'tudo') {
    const items = await fetchFromGoogleNews(effectiveBase, 25, geo);
    return sortByDate(dedupeByTitle(items));
  }

  // Para categorias específicas, faz 3-4 queries em paralelo e junta
  const hasOverride = !!overrides?.[category];
  const selectedQueries = categoryQueries.slice(0, 4);
  const promises = selectedQueries.map(q =>
    fetchFromGoogleNews(hasOverride ? q : `${effectiveBase} ${q}`, 8, geo)
  );

  const results = await Promise.all(promises);
  const allItems = results.flat();
  const deduped = dedupeByTitle(allItems);
  const sorted = sortByDate(deduped).slice(0, 20);

  // Se veio pouco, faz fallback pra query base
  if (sorted.length < 3) {
    const fallback = await fetchFromGoogleNews(effectiveBase, 20, geo);
    return sortByDate(dedupeByTitle([...sorted, ...fallback])).slice(0, 20);
  }

  return sorted;
}

// Limpa cache quando usuário quer forçar refresh
export function clearNewsCache(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY));
    keys.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

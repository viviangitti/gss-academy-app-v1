import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, AlertCircle, Sparkles, Tag, TrendingUp, Globe, Search, X, MapPin, Calendar, ShieldCheck, Megaphone, Swords } from 'lucide-react';
import { fetchNewsByCategory, fetchMarketingNews, fetchCompetitorMarketingNews, clearNewsCache } from '../services/news';
import { searchSegmentOffers, getCachedOffers, setCachedOffers, clearOffersCache } from '../services/competitorScraper';
import { loadData, KEYS } from '../services/storage';
import { SEGMENTS } from '../types';
import type { NewsItem, UserProfile } from '../types';
import type { NewsCategory, NewsGeo } from '../services/news';
import type { ScrapedOffer } from '../services/competitorScraper';
import './News.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Brand → domain for logo lookup (Clearbit Logo API)
const BRAND_DOMAINS: Record<string, string> = {
  honda: 'honda.com.br', volkswagen: 'volkswagen.com.br', vw: 'volkswagen.com.br',
  fiat: 'fiat.com.br', chevrolet: 'chevrolet.com.br', hyundai: 'hyundai.com.br',
  nissan: 'nissan.com.br', jeep: 'jeep.com.br', renault: 'renault.com.br',
  toyota: 'toyota.com.br', mitsubishi: 'mitsubishi.com.br', ford: 'ford.com.br',
  // Chinesas
  byd: 'byd.com.br', gwm: 'gwmbrasil.com.br',
  'caoa chery': 'caoa-chery.com.br', chery: 'caoa-chery.com.br',
  jac: 'jacmotors.com.br', 'jac motors': 'jacmotors.com.br',
  haval: 'gwmbrasil.com.br', ora: 'gwmbrasil.com.br',
  'gac motor': 'gac-motor.com.br', gac: 'gac-motor.com.br',
  jaecoo: 'omodajaecoo.com.br', omoda: 'omodajaecoo.com.br', 'omoda & jaecoo': 'omodajaecoo.com.br',
  'mg motor': 'mgbrasil.com.br', mg: 'mgbrasil.com.br',
  changan: 'changandobrasil.com.br',
  kia: 'kia.com/br',
  // Luxo
  bmw: 'bmw.com.br', mercedes: 'mercedes-benz.com.br', 'mercedes-benz': 'mercedes-benz.com.br',
  audi: 'audi.com.br', porsche: 'porsche.com/brazil', volvo: 'volvocars.com/br',
  'land rover': 'landrover.com.br', jaguar: 'jaguar.com.br',
  // Outros
  ambev: 'ambev.com.br', heineken: 'heineken.com.br',
  miolo: 'miolo.com.br', aurora: 'vinicolaaurora.com.br',
  'magazine luiza': 'magazineluiza.com.br', magazineluiza: 'magazineluiza.com.br',
  americanas: 'americanas.com.br', shopee: 'shopee.com.br',
  mrv: 'mrv.com.br', cyrela: 'cyrela.com.br',
  nubank: 'nubank.com.br', itaú: 'itau.com.br', bradesco: 'bradesco.com.br',
  xp: 'xpi.com.br', hapvida: 'hapvida.com.br', unimed: 'unimed.com.br',
  totvs: 'totvs.com', syngenta: 'syngenta.com.br',
};

function getBrandLogo(name: string): string | null {
  const key = name.toLowerCase().trim();
  const domain = BRAND_DOMAINS[key] || BRAND_DOMAINS[key.replace(/[^a-záàãéêíóôõúüç\s]/gi, '').trim()];
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

const CATEGORIES: { value: NewsCategory; label: string; icon: React.ComponentType<{ size?: number }>; desc: string; marketingOnly?: boolean }[] = [
  { value: 'tudo',        label: 'Tudo',        icon: Globe,      desc: 'Todas as notícias do segmento' },
  { value: 'lancamentos', label: 'Lançamentos',  icon: Sparkles,   desc: 'Novos produtos, inovações e estreias' },
  { value: 'ofertas',     label: 'Ofertas',      icon: Tag,        desc: 'Promoções e condições dos concorrentes agora' },
  { value: 'mercado',     label: 'Tendências',   icon: TrendingUp, desc: 'Análises e movimentos do mercado' },
  { value: 'marketing',    label: 'Marketing',     icon: Megaphone,  desc: 'Tendências de marketing, branding e campanhas luxury', marketingOnly: true },
  { value: 'concorrentes', label: 'Concorrentes',  icon: Swords,     desc: 'O que os concorrentes estão fazendo em marketing e campanhas', marketingOnly: true },
];

function relativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMin < 60) return `Há ${Math.max(1, diffMin)} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch { return ''; }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch { return dateStr; }
}

function groupByDate(items: NewsItem[]): { label: string; items: NewsItem[] }[] {
  const today: NewsItem[] = [], yesterday: NewsItem[] = [], thisWeek: NewsItem[] = [], older: NewsItem[] = [];
  const now = new Date(); now.setHours(0,0,0,0);
  const yDay = new Date(now); yDay.setDate(yDay.getDate() - 1);
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);

  items.forEach(item => {
    try {
      const d = new Date(item.pubDate); d.setHours(0,0,0,0);
      if (d >= now) today.push(item);
      else if (d.getTime() === yDay.getTime()) yesterday.push(item);
      else if (d >= weekAgo) thisWeek.push(item);
      else older.push(item);
    } catch { older.push(item); }
  });

  const groups: { label: string; items: NewsItem[] }[] = [];
  if (today.length)    groups.push({ label: 'Hoje', items: today });
  if (yesterday.length) groups.push({ label: 'Ontem', items: yesterday });
  if (thisWeek.length) groups.push({ label: 'Essa semana', items: thisWeek });
  if (older.length)    groups.push({ label: 'Mais antigas', items: older });
  return groups;
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [offers, setOffers] = useState<ScrapedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState('');
  const [segment, setSegment] = useState('');
  const [userAccessType, setUserAccessType] = useState<string>('vendas');
  const [category, setCategory] = useState<NewsCategory>('tudo');
  const [geo, setGeo] = useState<NewsGeo>('brasil');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const isMarketingUser = userAccessType === 'marketing' || userAccessType === 'ambos';

  const loadNews = async (seg: string, cat: NewsCategory, g: NewsGeo, force = false) => {
    setLoading(true);
    if (force) { clearNewsCache(); setRefreshing(true); }
    let items: NewsItem[];
    if (cat === 'marketing') {
      items = await fetchMarketingNews(g);
    } else if (cat === 'concorrentes') {
      items = await fetchCompetitorMarketingNews(seg, g);
    } else {
      items = await fetchNewsByCategory(seg as UserProfile['segment'], cat, g);
    }
    setNews(items);
    setLoading(false);
    setRefreshing(false);
  };

  const loadOffers = async (seg: string, force = false) => {
    if (force) clearOffersCache(seg);
    if (!force) {
      const cached = getCachedOffers(seg);
      if (cached !== null) { setOffers(cached); return; }
    }
    setOffersLoading(true);
    setOffersError('');
    try {
      const result = await searchSegmentOffers(seg, API_KEY);
      setOffers(result);
      if (result.length > 0) setCachedOffers(seg, result); // não cacheia array vazio
    } catch (e) {
      setOffersError(e instanceof Error ? e.message : 'Erro ao buscar ofertas.');
      setOffers([]);
    }
    setOffersLoading(false);
  };

  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    setSegment(profile.segment);
    setUserAccessType(profile.userAccessType || 'vendas');
    if (profile.segment) {
      loadNews(profile.segment, 'tudo', 'brasil');
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCategoryChange = (cat: NewsCategory) => {
    setCategory(cat);
    setSearch('');
    if (cat === 'ofertas') {
      loadOffers(segment);
    } else if (segment) {
      loadNews(segment, cat, geo);
    }
  };

  const handleGeoChange = (g: NewsGeo) => {
    setGeo(g);
    if (segment && category !== 'ofertas') loadNews(segment, category, g);
  };

  const handleForceRefresh = () => {
    if (category === 'ofertas') {
      loadOffers(segment, true);
    } else if (segment) {
      loadNews(segment, category, geo, true);
    }
  };

  const segmentLabel = SEGMENTS.find(s => s.value === segment)?.label || '';
  const currentCategory = CATEGORIES.find(c => c.value === category);
  const q = search.trim().toLowerCase();
  const filtered = q ? news.filter(n => n.title.toLowerCase().includes(q) || (n.description||'').toLowerCase().includes(q)) : news;
  const groups = groupByDate(filtered);

  if (!segment) {
    return (
      <div className="news-page">
        <div className="news-empty card">
          <AlertCircle size={32} />
          <h3>Configure seu segmento</h3>
          <p>Vá em <strong>Perfil</strong> e selecione seu segmento para receber notícias personalizadas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page">
      <div className="news-header">
        <div>
          <h3 className="section-title"><Newspaper size={16} /> Notícias</h3>
          <span className="news-segment">{segmentLabel}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleForceRefresh} disabled={loading || refreshing || offersLoading}>
          <RefreshCw size={14} className={loading || refreshing || offersLoading ? 'spinning' : ''} />
          {refreshing || offersLoading ? ' Buscando...' : ''}
        </button>
      </div>

      {/* Category tabs */}
      <div className="news-categories">
        {CATEGORIES.filter(cat => !cat.marketingOnly || isMarketingUser).map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              className={`news-cat-chip ${category === cat.value ? 'active' : ''} ${cat.marketingOnly ? 'news-cat-marketing' : ''}`}
              onClick={() => handleCategoryChange(cat.value)}
            >
              <Icon size={13} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Brasil / Mundo toggle — oculto na aba Ofertas */}
      {category !== 'ofertas' && (
        <div className="news-geo-toggle">
          <button
            className={`news-geo-btn ${geo === 'brasil' ? 'active' : ''}`}
            onClick={() => handleGeoChange('brasil')}
          >
            <MapPin size={12} /> Brasil
          </button>
          <button
            className={`news-geo-btn ${geo === 'mundo' ? 'active' : ''}`}
            onClick={() => handleGeoChange('mundo')}
          >
            <Globe size={12} /> Mundo
          </button>
        </div>
      )}

      {/* Busca — oculta na aba Ofertas */}
      {category !== 'ofertas' && (
        <div className="news-search">
          <Search size={14} className="news-search-icon" />
          <input
            type="text"
            placeholder="Pesquisar notícias…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="news-search-clear" onClick={() => setSearch('')} aria-label="Limpar">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {currentCategory && (
        <p className="news-cat-desc">{currentCategory.desc}</p>
      )}

      {/* ── OFERTAS TAB ── */}
      {category === 'ofertas' ? (
        offersLoading ? (
          <div className="news-offers-loading">
            <div className="news-offers-loading-inner">
              <RefreshCw size={24} className="spinning" />
              <p>Consultando ofertas dos concorrentes…</p>
              <span>Pode levar alguns segundos</span>
            </div>
          </div>
        ) : offersError ? (
          <div className="news-empty card">
            <AlertCircle size={32} />
            <p>{offersError}</p>
            <button className="btn btn-outline btn-sm" onClick={() => loadOffers(segment, true)}>
              <RefreshCw size={14} /> Tentar de novo
            </button>
          </div>
        ) : offers.length === 0 ? (
          <div className="news-empty card">
            <Tag size={32} />
            <h3>Nenhuma oferta encontrada</h3>
            <p>Toque em atualizar para buscar novamente com os dados mais recentes.</p>
            <button className="btn btn-primary btn-sm" onClick={() => loadOffers(segment, true)}>
              <RefreshCw size={14} /> Atualizar ofertas
            </button>
          </div>
        ) : (
          <>
            {/* ── Resumo comparativo agrupado por marca ── */}
            {(() => {
              // Group offers by brand
              const groups: Record<string, ScrapedOffer[]> = {};
              offers.forEach(o => {
                const k = o.competitor || 'Outros';
                if (!groups[k]) groups[k] = [];
                groups[k].push(o);
              });
              const brands = Object.keys(groups);
              if (brands.length < 2) return null;
              return (
                <div className="offers-summary card">
                  <p className="offers-summary-title">📊 Resumo do mês</p>
                  <div className="offers-summary-scroll">
                    {brands.map(brand => {
                      const logo = getBrandLogo(brand);
                      const initial = brand[0].toUpperCase();
                      const brandOffers = groups[brand];
                      return (
                        <div key={brand} className="offers-summary-brand-card">
                          <div className="offers-summary-brand-header">
                            <div className="offers-summary-avatar">
                              <span className="offers-summary-initial">{initial}</span>
                              {logo && <img src={logo} alt={brand} className="offers-summary-logo" onError={e => (e.currentTarget.style.display = 'none')} />}
                            </div>
                            <span className="offers-summary-brand-name">{brand}</span>
                          </div>
                          <div className="offers-summary-models">
                            {brandOffers.map((o, i) => {
                              const hl = o.highlights?.[0] || '';
                              const modelName = o.model || o.title;
                              return o.sourceUrl && o.sourceUrl.startsWith('http')
                                ? <a key={i} href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="offers-summary-model-row">
                                    <div className="offers-summary-model-info">
                                      <span className="offers-summary-model-name">{modelName}</span>
                                      {hl && <span className="offers-summary-model-hl">{hl}</span>}
                                    </div>
                                    <ExternalLink size={11} className="offers-summary-link-icon" />
                                  </a>
                                : <div key={i} className="offers-summary-model-row offers-summary-model-row--nolink">
                                    <div className="offers-summary-model-info">
                                      <span className="offers-summary-model-name">{modelName}</span>
                                      {hl && <span className="offers-summary-model-hl">{hl}</span>}
                                    </div>
                                  </div>;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── Cards individuais ── */}
            <div className="offers-list">
              {offers.map((offer, i) => {
                const logo = getBrandLogo(offer.competitor || '');
                const hasFooter = !!(offer.legalText || offer.sourceUrl);
                return (
                  <div key={i} className="offer-card card">
                    <div className="offer-card-inner">
                      <div className="offer-header">
                        <div className="offer-brand-row">
                          {offer.competitor && (
                            <div className="offer-brand-avatar">
                              <span className="offer-brand-initial">{offer.competitor[0].toUpperCase()}</span>
                              {logo && <img src={logo} alt={offer.competitor} className="offer-brand-logo" onError={e => (e.currentTarget.style.display = 'none')} />}
                            </div>
                          )}
                          {offer.competitor && (
                            <span className="offer-competitor">{offer.competitor}</span>
                          )}
                        </div>
                        {offer.validTo && (
                          <span className="offer-valid">
                            <Calendar size={11} /> Até {formatDate(offer.validTo)}
                          </span>
                        )}
                      </div>
                      {offer.model && (
                        <p className="offer-model">{offer.model}</p>
                      )}
                      <h4 className="offer-title">{offer.title}</h4>
                      {offer.description && (
                        <p className="offer-desc">{offer.description}</p>
                      )}
                      {offer.highlights && offer.highlights.length > 0 && (
                        <div className="offer-highlights">
                          {offer.highlights.map((h, j) => (
                            <span key={j} className="offer-highlight">{h}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {hasFooter && (
                      <div className="offer-footer">
                        {offer.legalText && (
                          <p className="offer-legal">{offer.legalText}</p>
                        )}
                        {offer.sourceUrl && offer.sourceUrl.startsWith('http') && (
                          <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer" className="offer-source-link">
                            <ShieldCheck size={12} /> Fonte <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        <>
          {loading ? (
            <div className="news-loading">
              {[1,2,3,4].map(i => <div key={i} className="news-skeleton card" />)}
            </div>
          ) : news.length === 0 ? (
            <div className="news-empty card">
              <Newspaper size={32} />
              <p>Nenhuma notícia nesta categoria agora. Tente outra aba ou atualize.</p>
              <button className="btn btn-outline btn-sm" onClick={handleForceRefresh}>
                <RefreshCw size={14} /> Atualizar
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="news-empty card">
              <Search size={32} />
              <p>Nenhuma notícia encontrada para "<strong>{search}</strong>".</p>
              <button className="btn btn-outline btn-sm" onClick={() => setSearch('')}>
                <X size={14} /> Limpar busca
              </button>
            </div>
          ) : (
            <div className="news-groups">
              {groups.map(group => (
                <div key={group.label} className="news-group">
                  <h4 className="news-group-label">{group.label}</h4>
                  <div className="news-list">
                    {group.items.map((item, i) => {
                      const hasLink = !!item.link && item.link.startsWith('http');
                      const Tag = hasLink ? 'a' : 'div';
                      return (
                        <Tag
                          key={i}
                          {...(hasLink ? { href: item.link, target: '_blank', rel: 'noopener noreferrer' } : {})}
                          className="news-card card"
                        >
                          <h4 className="news-title">{item.title}</h4>
                          {item.description && <p className="news-desc">{item.description}</p>}
                          <div className="news-footer">
                            <span className="news-date">{relativeTime(item.pubDate)}</span>
                            {hasLink && <ExternalLink size={12} />}
                          </div>
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, AlertCircle, Sparkles, TrendingUp, Globe, Search, X, MapPin, Megaphone, Swords } from 'lucide-react';
import { fetchNewsByCategory, fetchMarketingNews, fetchCompetitorMarketingNews, clearNewsCache } from '../services/news';
import { loadData, KEYS } from '../services/storage';
import { SEGMENTS } from '../types';
import type { NewsItem, UserProfile } from '../types';
import type { NewsCategory, NewsGeo } from '../services/news';
import './News.css';

const CATEGORIES: { value: NewsCategory; label: string; icon: React.ComponentType<{ size?: number }>; desc: string; marketingOnly?: boolean }[] = [
  { value: 'tudo',        label: 'Tudo',        icon: Globe,      desc: 'Todas as notícias do segmento' },
  { value: 'lancamentos', label: 'Lançamentos',  icon: Sparkles,   desc: 'Novos produtos, inovações e estreias' },
  { value: 'mercado',     label: 'Tendências',   icon: TrendingUp, desc: 'Análises e movimentos do mercado' },
  { value: 'marketing',    label: 'Marketing',     icon: Megaphone,  desc: 'Eventos do setor, veiculação de mídia, parcerias e tendências de marketing', marketingOnly: true },
  { value: 'concorrentes', label: 'Concorrentes',  icon: Swords,     desc: 'Movimentos, lançamentos e novidades das marcas concorrentes', marketingOnly: true },
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
  const [loading, setLoading] = useState(true);
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
      items = await fetchMarketingNews(g, seg);
    } else if (cat === 'concorrentes') {
      items = await fetchCompetitorMarketingNews(seg, g);
    } else {
      items = await fetchNewsByCategory(seg as UserProfile['segment'], cat, g);
    }
    setNews(items);
    setLoading(false);
    setRefreshing(false);
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
    if (segment) loadNews(segment, cat, geo);
  };

  const handleGeoChange = (g: NewsGeo) => {
    setGeo(g);
    if (segment) loadNews(segment, category, g);
  };

  const handleForceRefresh = () => {
    if (segment) loadNews(segment, category, geo, true);
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
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={handleForceRefresh} disabled={loading || refreshing}>
            <RefreshCw size={14} className={loading || refreshing ? 'spinning' : ''} />
            {refreshing ? ' Buscando...' : ''}
          </button>
        </div>
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

      {/* Brasil / Mundo toggle */}
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

      {/* Busca */}
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

      {currentCategory && (
        <p className="news-cat-desc">{currentCategory.desc}</p>
      )}

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
                  // Sempre clicável: link real abre a matéria; sem link, cai numa busca no Google.
                  const href = hasLink
                    ? item.link
                    : `https://www.google.com/search?q=${encodeURIComponent(item.title)}`;
                  return (
                    <a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-card card"
                    >
                      <h4 className="news-title">{item.title}</h4>
                      {item.description && <p className="news-desc">{item.description}</p>}
                      <div className="news-footer">
                        <span className="news-date">{relativeTime(item.pubDate)}</span>
                        {hasLink
                          ? <span className="news-link-cta"><ExternalLink size={12} /> ler matéria</span>
                          : <span className="news-link-cta"><Search size={12} /> pesquisar</span>}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Swords, ExternalLink, RefreshCw, Shield, AlertTriangle, SlidersHorizontal, X, Clock, Search } from 'lucide-react';
import { getBrandLogo, buildOfferLink } from '../utils/offerLinks';
import { getActiveCompetitorOffers } from '../services/firestore/competitorOffers';
import { getActiveOffers } from '../services/firestore/offers';
import { getCachedOffers, getStaleCachedOffers, isOffersCacheStale, setCachedOffers, searchSegmentOffers } from '../services/competitorScraper';
import type { ScrapedOffer } from '../services/competitorScraper';
import { loadData, saveData, KEYS } from '../services/storage';
import { PRICE_RANGES, getUserPriceRanges } from '../types';
import type { CompetitorOffer, Offer, UserProfile, PriceRange, Segment } from '../types';
import './CompetitorIntel.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/** Converte uma oferta da web (aba Notícias) no formato da Concorrência. */
function scrapedToCompetitor(o: ScrapedOffer, segs: Segment[]): CompetitorOffer {
  return {
    id: `web-${(o.competitor || 'x')}-${(o.model || o.title || '')}`.toLowerCase().slice(0, 140),
    competitor: o.competitor || 'Concorrente',
    model: o.model,
    title: o.title || o.model || 'Oferta',
    description: o.description || '',
    legalText: o.legalText,
    sourceUrl: o.sourceUrl,
    highlights: o.highlights || [],
    ourAdvantages: [],
    validFrom: o.validFrom || '',
    validTo: o.validTo || '',
    segments: segs,
    active: true,
  };
}

/** Mescla cadastradas + web, sem duplicar por marca+título. */
function mergeOffers(cadastered: CompetitorOffer[], web: CompetitorOffer[]): CompetitorOffer[] {
  const seen = new Set(cadastered.map(o => `${o.competitor}|${o.title}`.toLowerCase()));
  const extra = web.filter(o => !seen.has(`${o.competitor}|${o.title}`.toLowerCase()));
  return [...cadastered, ...extra];
}


// Mapeamento de marca → faixas de preço (fallback quando o doc não tem priceRanges)
const COMPETITOR_RANGES: Record<string, PriceRange[]> = {
  'fiat':          ['ate-80k'],
  'chevrolet':     ['ate-80k'],
  'renault':       ['ate-80k'],
  'peugeot':       ['ate-80k'],
  'citroën':       ['ate-80k'],
  'citroen':       ['ate-80k'],
  'honda':         ['ate-80k'],
  'hyundai':       ['ate-80k'],
  'nissan':        ['ate-80k'],
  'toyota':        ['ate-80k', '80k-200k'],
  'volkswagen':    ['ate-80k', '80k-200k'],
  'jeep':          ['ate-80k', '80k-200k'],
  'ford':          ['ate-80k', '80k-200k'],
  'mitsubishi':    ['80k-200k'],
  'volvo':         ['80k-200k'],
  'bmw':           ['80k-200k', '200k-500k'],
  'mercedes-benz': ['80k-200k', '200k-500k'],
  'mercedes':      ['80k-200k', '200k-500k'],
  'audi':          ['80k-200k', '200k-500k'],
  'land rover':    ['80k-200k', '200k-500k'],
  'jaguar':        ['80k-200k', '200k-500k'],
  'lexus':         ['80k-200k', '200k-500k'],
  'porsche':       ['200k-500k', 'acima-500k'],
  'maserati':      ['200k-500k', 'acima-500k'],
  'bentley':       ['acima-500k'],
  'ferrari':       ['acima-500k'],
  'lamborghini':   ['acima-500k'],
  'rolls-royce':   ['acima-500k'],
  'mclaren':       ['acima-500k'],
  'aston martin':  ['acima-500k'],
  // Marcas chinesas e demais comuns no mercado BR
  'byd':           ['80k-200k', '200k-500k'],
  'gwm':           ['80k-200k', '200k-500k'],
  'great wall':    ['80k-200k', '200k-500k'],
  'chery':         ['80k-200k', '200k-500k'],
  'caoa chery':    ['80k-200k', '200k-500k'],
  'caoa':          ['80k-200k', '200k-500k'],
  'jac':           ['ate-80k', '80k-200k'],
  'kia':           ['80k-200k', '200k-500k'],
  'suzuki':        ['80k-200k'],
  'subaru':        ['200k-500k'],
  'mini':          ['200k-500k'],
  'ram':           ['200k-500k', 'acima-500k'],
  'mg':            ['80k-200k', '200k-500k'],
  'mg motor':      ['80k-200k', '200k-500k'],
};

function competitorMatchesRange(offer: CompetitorOffer, range: PriceRange): boolean {
  // 1. Usa priceRanges do doc quando disponível
  if (offer.priceRanges && offer.priceRanges.length > 0) {
    return offer.priceRanges.includes(range);
  }
  // 2. Fallback: mapeamento por nome da marca
  const key = offer.competitor.toLowerCase().trim();
  const ranges = COMPETITOR_RANGES[key];
  if (ranges) return ranges.includes(range);
  // 3. Marca desconhecida → mostra em todas as faixas
  return true;
}

export default function CompetitorIntel() {
  const [allCompetitorOffers, setAllCompetitorOffers] = useState<CompetitorOffer[]>([]);
  const [ourOffers, setOurOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRanges, setUserRanges] = useState<PriceRange[]>([]);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [modelQuery, setModelQuery] = useState('');
  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    setUserRanges(getUserPriceRanges(profile));
    const seg = profile.segment || '';
    const segs: Segment[] = profile.segment ? [profile.segment] : [];

    Promise.all([
      getActiveCompetitorOffers(seg || undefined),
      getActiveOffers(seg || undefined),
    ]).then(([comp, ours]) => {
      setOurOffers(ours);
      // Mescla as cadastradas com as ofertas da web (mesma fonte da aba Notícias).
      const cached = getCachedOffers(seg) || getStaleCachedOffers(seg) || [];
      setAllCompetitorOffers(mergeOffers(comp, cached.map(o => scrapedToCompetitor(o, segs))));
      setFetchedAt(new Date());

      // Cache vazio ou velho → busca em background e atualiza a lista.
      if (seg && (getCachedOffers(seg) === null || isOffersCacheStale(seg))) {
        searchSegmentOffers(seg, API_KEY)
          .then(res => {
            if (res.length > 0) {
              setCachedOffers(seg, res);
              setAllCompetitorOffers(mergeOffers(comp, res.map(o => scrapedToCompetitor(o, segs))));
              setFetchedAt(new Date());
            }
          })
          .catch(() => { /* silencioso — mantém o que já tem */ });
      }
    }).finally(() => setLoading(false));
  }, []);

  // Filtra em tempo real: mostra ofertas que casam com QUALQUER faixa selecionada
  const competitorOffers = userRanges.length
    ? allCompetitorOffers.filter(o => userRanges.some(r => competitorMatchesRange(o, r)))
    : allCompetitorOffers;

  const handleSelectRange = (range: PriceRange) => {
    const next = userRanges.includes(range)
      ? userRanges.filter(v => v !== range)   // toggle off
      : [...userRanges, range];               // toggle on
    setUserRanges(next);
    // Persiste no perfil
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    saveData(KEYS.PROFILE, { ...profile, priceRanges: next, priceRange: next[0] || '' });
  };

  // Marcas presentes (após o filtro de faixa) e filtros de marca + modelo
  const offerBrands = [...new Set(competitorOffers.map(o => o.competitor || 'Outros'))].sort();
  const toggleBrand = (b: string) =>
    setBrandFilter(prev => (prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]));
  const mq = modelQuery.trim().toLowerCase();
  const tableOffers = competitorOffers
    .filter(o =>
      (brandFilter.length === 0 || brandFilter.includes(o.competitor || 'Outros')) &&
      (!mq || `${o.model || ''} ${o.title || ''} ${(o.highlights || []).join(' ')}`.toLowerCase().includes(mq))
    )
    .sort((a, b) => (a.competitor || '').localeCompare(b.competitor || ''));

  if (loading) {
    return (
      <div className="ci-page">
        <div className="ci-loading">
          <RefreshCw size={22} className="ci-spin" />
          <span>Carregando inteligência competitiva...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ci-page">

      {/* Hero */}
      <div className="ci-hero card">
        <Swords size={22} />
        <div className="ci-hero-text">
          <h2>Inteligência Competitiva</h2>
          <p>As ofertas da concorrência no seu radar — toque pra ver a fonte</p>
        </div>
      </div>

      {/* Last updated indicator */}
      {fetchedAt && (
        <div className="ci-updated-bar">
          <Clock size={11} />
          Atualizado {fetchedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {allCompetitorOffers.length} oferta{allCompetitorOffers.length !== 1 ? 's' : ''} no radar
        </div>
      )}

      {/* Chips de faixa de preço — sempre visíveis */}
      <div className="ci-range-bar card">
        <div className="ci-range-bar-label">
          <SlidersHorizontal size={13} />
          Sua faixa de atuação:
        </div>
        <div className="ci-range-chips">
          {PRICE_RANGES.map(r => (
            <button
              key={r.value}
              className={`ci-range-chip ${userRanges.includes(r.value) ? 'active' : ''}`}
              onClick={() => handleSelectRange(r.value)}
            >
              {r.icon} {r.label}
              {userRanges.includes(r.value) && <X size={11} className="ci-range-chip-x" />}
            </button>
          ))}
        </div>
      </div>

      {/* Nossas ofertas — resumo */}
      {ourOffers.length > 0 && (
        <div className="ci-our-card card">
          <div className="ci-our-header">
            <Shield size={16} /> <strong>Nossas ofertas ativas</strong>
          </div>
          {ourOffers.map(o => (
            <div key={o.id} className="ci-our-item">
              <span className="ci-our-title">{o.title}</span>
              <div className="ci-our-chips">
                {o.highlights.slice(0, 3).map((h, i) => (
                  <span key={i} className="ci-chip-green">• {h}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ofertas da concorrência */}
      {allCompetitorOffers.length === 0 ? (
        <div className="ci-empty card">
          <AlertTriangle size={28} />
          <p>Nenhuma oferta da concorrência cadastrada.</p>
          <p className="ci-empty-hint">As ofertas são atualizadas automaticamente toda segunda-feira.</p>
        </div>
      ) : (
        <>
          {/* Filtro por marca + modelo */}
          <div className="offers-filter card">
            {offerBrands.length > 1 && (
              <div className="offers-filter-brands">
                <button
                  className={`offers-brand-chip ${brandFilter.length === 0 ? 'active' : ''}`}
                  onClick={() => setBrandFilter([])}
                >
                  Todas
                </button>
                {offerBrands.map(b => (
                  <button
                    key={b}
                    className={`offers-brand-chip ${brandFilter.includes(b) ? 'active' : ''}`}
                    onClick={() => toggleBrand(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
            <div className="offers-model-search">
              <Search size={14} className="offers-model-icon" />
              <input
                type="text"
                placeholder="Filtrar por modelo…"
                value={modelQuery}
                onChange={e => setModelQuery(e.target.value)}
              />
              {modelQuery && (
                <button className="offers-model-clear" onClick={() => setModelQuery('')} aria-label="Limpar">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tabela Marca × Modelo × Oferta */}
          <div className="offers-table card">
            <div className="offers-table-head">
              <span>Marca</span>
              <span>Modelo</span>
              <span>Oferta</span>
              <span aria-hidden />
            </div>
            {tableOffers.length === 0 ? (
              <div className="offers-table-empty">Nenhuma oferta com esses filtros.</div>
            ) : (
              tableOffers.map((o, i) => {
                const link = buildOfferLink(o);
                const logo = getBrandLogo(o.competitor || '');
                return (
                  <a
                    key={o.id || i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="offers-table-row"
                    title={link.official ? `Abrir: ${link.label}` : `Pesquisar: ${o.competitor || ''} ${o.model || ''}`}
                  >
                    <span className="otr-brand">
                      <span className="otr-avatar">
                        {(o.competitor || '?')[0].toUpperCase()}
                        {logo && <img src={logo} alt="" className="otr-logo" onError={e => (e.currentTarget.style.display = 'none')} />}
                      </span>
                      <span className="otr-brand-name">{o.competitor || 'Outros'}</span>
                    </span>
                    <span className="otr-model">{o.model || '—'}</span>
                    <span className="otr-offer">
                      <span className="otr-offer-title">{o.title}</span>
                      {o.highlights?.[0] && <span className="otr-offer-hl">{o.highlights[0]}</span>}
                    </span>
                    <span className="otr-link">
                      {link.official ? <ExternalLink size={14} /> : <Search size={14} />}
                    </span>
                  </a>
                );
              })
            )}
          </div>

          <p className="offers-table-note">{tableOffers.length} oferta{tableOffers.length !== 1 ? 's' : ''} · toque pra abrir a fonte</p>
        </>
      )}
    </div>
  );
}

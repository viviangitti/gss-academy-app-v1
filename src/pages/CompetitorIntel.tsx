import { useState, useEffect } from 'react';
import { Swords, Bot, ExternalLink, RefreshCw, Shield, AlertTriangle, Zap, SlidersHorizontal, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveCompetitorOffers } from '../services/firestore/competitorOffers';
import { getActiveOffers } from '../services/firestore/offers';
import { loadData, saveData, KEYS } from '../services/storage';
import { PRICE_RANGES } from '../types';
import type { CompetitorOffer, Offer, UserProfile, PriceRange } from '../types';
import './CompetitorIntel.css';

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function groupByCompetitor(offers: CompetitorOffer[]): Record<string, CompetitorOffer[]> {
  return offers.reduce((acc, o) => {
    if (!acc[o.competitor]) acc[o.competitor] = [];
    acc[o.competitor].push(o);
    return acc;
  }, {} as Record<string, CompetitorOffer[]>);
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
  const navigate = useNavigate();
  const [allCompetitorOffers, setAllCompetitorOffers] = useState<CompetitorOffer[]>([]);
  const [ourOffers, setOurOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRange, setUserRange] = useState<PriceRange>('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    setUserRange(profile.priceRange || '');
    Promise.all([
      getActiveCompetitorOffers(profile.segment || undefined),
      getActiveOffers(profile.segment || undefined),
    ]).then(([comp, ours]) => {
      setAllCompetitorOffers(comp);
      setOurOffers(ours);
      setFetchedAt(new Date());
    }).finally(() => setLoading(false));
  }, []);

  // Filtra em tempo real conforme userRange muda
  const competitorOffers = userRange
    ? allCompetitorOffers.filter(o => competitorMatchesRange(o, userRange))
    : allCompetitorOffers;

  const handleSelectRange = (range: PriceRange) => {
    const newRange = userRange === range ? '' : range; // toggle off
    setUserRange(newRange);
    setVisibleCount(12); // reset pagination on filter change
    // Persiste no perfil
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    saveData(KEYS.PROFILE, { ...profile, priceRange: newRange });
  };

  const handleRebater = (offer: CompetitorOffer) => {
    const ourOffersSummary = ourOffers.length > 0
      ? `\n\nNossas ofertas ativas:\n${ourOffers.map(o =>
          `• ${o.title}: ${o.description}${o.highlights.length ? ' | ' + o.highlights.join(', ') : ''}`
        ).join('\n')}`
      : '';

    const prompt = [
      `Um cliente mencionou a seguinte oferta da concorrência:`,
      ``,
      `🏢 Concorrente: ${offer.competitor}`,
      `📢 Oferta: ${offer.title}`,
      `📋 ${offer.description}`,
      offer.highlights.length ? `Destaques deles: ${offer.highlights.join(', ')}` : '',
      offer.legalText ? `Texto jurídico: ${offer.legalText}` : '',
      ourOffersSummary,
      ``,
      `Como devo responder ao cliente para mostrar as vantagens do que temos e contornar essa objeção? Me dê argumentos práticos para usar no showroom agora.`,
    ].filter(Boolean).join('\n');

    navigate('/ia-coach', { state: { prefill: prompt } });
  };

  const handleComparar = () => {
    if (competitorOffers.length === 0 && ourOffers.length === 0) return;

    const comp = competitorOffers.map(o =>
      `• ${o.competitor}: ${o.title} — ${o.highlights.join(', ')}`
    ).join('\n');

    const ours = ourOffers.map(o =>
      `• ${o.title} — ${o.highlights.join(', ')}`
    ).join('\n');

    const prompt = [
      `Faça uma análise competitiva completa:`,
      ``,
      `🏁 CONCORRÊNCIA:`,
      comp || '(nenhuma registrada)',
      ``,
      `✅ NOSSAS OFERTAS:`,
      ours || '(nenhuma registrada)',
      ``,
      `Identifique: onde temos vantagem, onde estamos em desvantagem, e quais argumentos o vendedor deve usar com clientes que mencionam a concorrência. Seja direto e prático.`,
    ].join('\n');

    navigate('/ia-coach', { state: { prefill: prompt } });
  };

  const grouped = groupByCompetitor(competitorOffers);
  const competitors = Object.keys(grouped).sort();

  // Flat ordered list: all offers sorted by competitor then title
  const flatOffers = competitors.flatMap(comp => grouped[comp]);
  const visibleOffers = flatOffers.slice(0, visibleCount);

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
          <p>O que a concorrência está fazendo — e como rebater</p>
        </div>
      </div>

      {/* Last updated indicator */}
      {fetchedAt && (
        <div className="ci-updated-bar">
          <Clock size={11} />
          Atualizado {fetchedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {allCompetitorOffers.length} oferta{allCompetitorOffers.length !== 1 ? 's' : ''} cadastrada{allCompetitorOffers.length !== 1 ? 's' : ''}
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
              className={`ci-range-chip ${userRange === r.value ? 'active' : ''}`}
              onClick={() => handleSelectRange(r.value)}
            >
              {r.icon} {r.label}
              {userRange === r.value && <X size={11} className="ci-range-chip-x" />}
            </button>
          ))}
        </div>
      </div>

      {/* Botão análise geral */}
      {(competitorOffers.length > 0 || ourOffers.length > 0) && (
        <button className="btn btn-primary ci-analyze-btn" onClick={handleComparar}>
          <Zap size={16} /> Analisar tudo com a IA
        </button>
      )}

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

      {/* Ofertas da concorrência — feed plano */}
      {flatOffers.length === 0 ? (
        <div className="ci-empty card">
          <AlertTriangle size={28} />
          <p>Nenhuma oferta da concorrência cadastrada.</p>
          <p className="ci-empty-hint">As ofertas são atualizadas automaticamente toda segunda-feira.</p>
        </div>
      ) : (
        <>
          {visibleOffers.map(offer => (
            <div key={offer.id} className="ci-offer-card card">
              <div className="ci-offer-brand">
                <AlertTriangle size={13} className="ci-alert-icon" />
                {offer.competitor}
                <span className="ci-offer-validity">até {formatDate(offer.validTo)}</span>
                {offer.sourceUrl && offer.sourceUrl.startsWith('http') && (
                  <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer" className="ci-source-link">
                    <ExternalLink size={11} /> ver
                  </a>
                )}
              </div>

              <div className="ci-offer-title">{offer.title}</div>

              {offer.highlights.length > 0 && (
                <div className="ci-chips" style={{ marginBottom: 6 }}>
                  {offer.highlights.map((h, i) => <span key={i} className="ci-chip-red">{h}</span>)}
                </div>
              )}

              {offer.ourAdvantages.length > 0 && (
                <div className="ci-chips" style={{ marginBottom: 6 }}>
                  {offer.ourAdvantages.map((h, i) => <span key={i} className="ci-chip-green">{h}</span>)}
                </div>
              )}

              {offer.description && (
                <p className="ci-offer-desc">{offer.description}</p>
              )}

              <button className="btn ci-rebater-btn" onClick={() => handleRebater(offer)}>
                <Bot size={14} /> Como rebater com a IA
              </button>
            </div>
          ))}
          {flatOffers.length > visibleCount && (
            <button className="ci-load-more" onClick={() => setVisibleCount(v => v + 12)}>
              Ver mais {Math.min(12, flatOffers.length - visibleCount)} ofertas
            </button>
          )}
        </>
      )}
    </div>
  );
}

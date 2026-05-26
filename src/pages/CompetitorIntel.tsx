import { useState, useEffect } from 'react';
import { Swords, Bot, ChevronDown, ChevronUp, ExternalLink, RefreshCw, Shield, AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveCompetitorOffers } from '../services/firestore/competitorOffers';
import { getActiveOffers } from '../services/firestore/offers';
import { loadData, KEYS } from '../services/storage';
import type { CompetitorOffer, Offer, UserProfile } from '../types';
import './CompetitorIntel.css';

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Agrupa ofertas da concorrência por competidor
function groupByCompetitor(offers: CompetitorOffer[]): Record<string, CompetitorOffer[]> {
  return offers.reduce((acc, o) => {
    if (!acc[o.competitor]) acc[o.competitor] = [];
    acc[o.competitor].push(o);
    return acc;
  }, {} as Record<string, CompetitorOffer[]>);
}

export default function CompetitorIntel() {
  const navigate = useNavigate();
  const [competitorOffers, setCompetitorOffers] = useState<CompetitorOffer[]>([]);
  const [ourOffers, setOurOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    Promise.all([
      getActiveCompetitorOffers(profile.segment || undefined),
      getActiveOffers(profile.segment || undefined),
    ]).then(([comp, ours]) => {
      setCompetitorOffers(comp);
      setOurOffers(ours);
    }).finally(() => setLoading(false));
  }, []);

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
        <div>
          <h2>Inteligência Competitiva</h2>
          <p>O que a concorrência está fazendo — e como rebater</p>
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

      {/* Concorrentes */}
      {competitors.length === 0 ? (
        <div className="ci-empty card">
          <AlertTriangle size={28} />
          <p>Nenhuma oferta da concorrência cadastrada.</p>
          <p className="ci-empty-hint">O marketing pode cadastrar via Painel Marketing → Concorrência.</p>
        </div>
      ) : (
        competitors.map(comp => (
          <div key={comp} className="ci-competitor card">
            {/* Competitor header */}
            <div className="ci-comp-header" onClick={() => setExpanded(expanded === comp ? null : comp)}>
              <div className="ci-comp-name">
                <AlertTriangle size={15} className="ci-alert-icon" />
                <strong>{comp}</strong>
                <span className="ci-count">{grouped[comp].length} oferta{grouped[comp].length > 1 ? 's' : ''}</span>
              </div>
              {expanded === comp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {/* Offers list */}
            {(expanded === comp ? grouped[comp] : grouped[comp].slice(0, 1)).map(offer => (
              <div key={offer.id} className="ci-offer-item">
                <div className="ci-offer-title">{offer.title}</div>
                <div className="ci-offer-meta">
                  Válido até {formatDate(offer.validTo)}
                  {offer.sourceUrl && offer.sourceUrl.startsWith('http') && (
                    <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer" className="ci-source-link">
                      <ExternalLink size={11} /> ver oferta
                    </a>
                  )}
                </div>

                {/* Destaques deles */}
                {offer.highlights.length > 0 && (
                  <div className="ci-highlight-row">
                    <span className="ci-label-red">🔴 Deles:</span>
                    <div className="ci-chips">
                      {offer.highlights.map((h, i) => <span key={i} className="ci-chip-red">{h}</span>)}
                    </div>
                  </div>
                )}

                {/* Nossas vantagens */}
                {offer.ourAdvantages.length > 0 && (
                  <div className="ci-highlight-row">
                    <span className="ci-label-green">✅ Nossas vantagens:</span>
                    <div className="ci-chips">
                      {offer.ourAdvantages.map((h, i) => <span key={i} className="ci-chip-green">{h}</span>)}
                    </div>
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

            {grouped[comp].length > 1 && expanded !== comp && (
              <button className="ci-see-more" onClick={() => setExpanded(comp)}>
                Ver mais {grouped[comp].length - 1} oferta{grouped[comp].length - 1 > 1 ? 's' : ''} →
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Tag, Copy, Check, ChevronDown, ChevronUp, Megaphone, Bot, RefreshCw, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveOffers } from '../services/firestore/offers';
import { loadData, KEYS } from '../services/storage';
import type { Offer, UserProfile } from '../types';
import './Offers.css';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function isExpiringSoon(validTo: string) {
  const end = new Date(validTo + 'T23:59:59');
  const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 5;
}

export default function Offers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    getActiveOffers(profile.segment || undefined)
      .then(setOffers)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (offer: Offer) => {
    const text = [
      `📢 ${offer.title}`,
      ``,
      offer.pitch,
      ``,
      offer.highlights.map(h => `• ${h}`).join('\n'),
      ``,
      `⏰ Válido até ${formatDate(offer.validTo)}`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(offer.id!);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  const handleAsk = (offer: Offer) => {
    const q = `Me ajude a apresentar essa oferta para um cliente no showroom: "${offer.title}". ${offer.description}`;
    navigate('/ia-coach', { state: { prefill: q } });
  };

  if (loading) {
    return (
      <div className="offers-page">
        <div className="offers-loading">
          <RefreshCw size={22} className="offers-spin" />
          <span>Carregando ofertas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="offers-page">
      {/* Hero */}
      <div className="offers-hero card">
        <Megaphone size={22} />
        <div>
          <h2>Ofertas do Mês</h2>
          <p>Tudo que está sendo veiculado — use com seus clientes</p>
        </div>
      </div>

      {offers.length === 0 && (
        <div className="offers-empty card">
          <Tag size={32} />
          <p>Nenhuma oferta ativa no momento.</p>
          <p className="offers-empty-hint">O marketing ainda não cadastrou campanhas para este período.</p>
        </div>
      )}

      {offers.map(offer => {
        const open = expanded === offer.id;
        const soon = isExpiringSoon(offer.validTo);

        return (
          <div key={offer.id} className={`offer-card card ${soon ? 'offer-expiring' : ''}`}>
            {/* Header */}
            <div className="offer-header" onClick={() => setExpanded(open ? null : offer.id!)}>
              <div className="offer-title-row">
                <h3>{offer.title}</h3>
                {soon && <span className="offer-badge-soon">Encerra em breve</span>}
              </div>
              <div className="offer-meta">
                <Calendar size={12} />
                <span>{formatDate(offer.validFrom)} → {formatDate(offer.validTo)}</span>
              </div>
              <div className="offer-highlights-preview">
                {offer.highlights.slice(0, 2).map((h, i) => (
                  <span key={i} className="offer-chip">• {h}</span>
                ))}
                {offer.highlights.length > 2 && (
                  <span className="offer-chip-more">+{offer.highlights.length - 2}</span>
                )}
              </div>
              <button className="offer-toggle">
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {open ? 'Menos detalhes' : 'Ver completo'}
              </button>
            </div>

            {/* Expanded */}
            {open && (
              <div className="offer-body">
                <div className="offer-section">
                  <label>📋 Descritivo da campanha</label>
                  <p>{offer.description}</p>
                </div>

                <div className="offer-section">
                  <label>✅ Destaques</label>
                  <ul className="offer-bullets">
                    {offer.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>

                {offer.pitch && (
                  <div className="offer-section offer-pitch-box">
                    <label>💬 Argumento para o cliente</label>
                    <p className="offer-pitch-text">"{offer.pitch}"</p>
                  </div>
                )}

                <div className="offer-actions">
                  <button
                    className={`btn offer-copy-btn ${copied === offer.id ? 'copied' : ''}`}
                    onClick={() => handleCopy(offer)}
                  >
                    {copied === offer.id
                      ? <><Check size={15} /> Copiado!</>
                      : <><Copy size={15} /> Copiar pitch</>}
                  </button>
                  <button className="btn btn-primary offer-ai-btn" onClick={() => handleAsk(offer)}>
                    <Bot size={15} /> Pedir à IA
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

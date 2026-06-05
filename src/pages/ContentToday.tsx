import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Flame, Trophy, Sparkles, MessageCircle } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getActiveOffers } from '../services/firestore/offers';
import {
  buildDailyContent, logShare, hasSharedToday, getContentStats,
} from '../services/socialContent';
import type { ContentSuggestion, ContentStats } from '../services/socialContent';
import type { UserProfile } from '../types';
import './ContentToday.css';

export default function ContentToday() {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [items, setItems] = useState<ContentSuggestion[]>([]);
  const [stats, setStats] = useState<ContentStats>({ totalPoints: 0, totalShares: 0, sharesToday: 0, streak: 0 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedTick, setSharedTick] = useState(0); // força re-render após compartilhar

  useEffect(() => {
    setStats(getContentStats());
    getActiveOffers(profile.segment || undefined)
      .then(offers => setItems(buildDailyContent(profile.segment, offers)))
      .catch(() => setItems(buildDailyContent(profile.segment, [])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerShare = (content: ContentSuggestion) => {
    if (!hasSharedToday(content.id)) {
      logShare(content);
      setStats(getContentStats());
      setSharedTick(t => t + 1);
    }
  };

  const handleShare = async (content: ContentSuggestion) => {
    // Tenta o compartilhamento nativo (abre WhatsApp, Instagram, etc.)
    if (navigator.share) {
      try {
        await navigator.share({ text: content.caption });
        registerShare(content);
        return;
      } catch { /* usuário cancelou — não conta */ return; }
    }
    // Fallback: WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(content.caption)}`, '_blank');
    registerShare(content);
  };

  const handleWhatsApp = (content: ContentSuggestion) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(content.caption)}`, '_blank');
    registerShare(content);
  };

  const handleCopy = (content: ContentSuggestion) => {
    // Tenta a API moderna; fallback pra textarea se falhar (registra os pontos de qualquer forma)
    const done = () => {
      setCopiedId(content.id);
      setTimeout(() => setCopiedId(null), 2000);
      registerShare(content);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(content.caption).then(done).catch(() => {
        fallbackCopy(content.caption);
        done();
      });
    } else {
      fallbackCopy(content.caption);
      done();
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch { /* ignora */ }
  };

  return (
    <div className="ct-page">
      {/* Hero + stats */}
      <div className="ct-hero card">
        <div className="ct-hero-top">
          <Sparkles size={22} />
          <div>
            <h2>Conteúdo do Dia</h2>
            <p>Poste nas suas redes e atraia clientes</p>
          </div>
        </div>
        <div className="ct-stats">
          <div className="ct-stat">
            <Trophy size={16} />
            <span className="ct-stat-val">{stats.totalPoints}</span>
            <span className="ct-stat-lbl">pontos</span>
          </div>
          <div className="ct-stat">
            <Flame size={16} className={stats.streak > 0 ? 'ct-flame' : ''} />
            <span className="ct-stat-val">{stats.streak}</span>
            <span className="ct-stat-lbl">dias seguidos</span>
          </div>
          <div className="ct-stat">
            <Share2 size={16} />
            <span className="ct-stat-val">{stats.sharesToday}</span>
            <span className="ct-stat-lbl">hoje</span>
          </div>
        </div>
      </div>

      {/* Cards de conteúdo */}
      {items.map(content => {
        const shared = hasSharedToday(content.id);
        return (
          <div key={`${content.id}-${sharedTick}`} className={`ct-card card ${shared ? 'ct-card--done' : ''}`}>
            <div className="ct-card-head">
              <span className="ct-card-emoji">{content.emoji}</span>
              <span className="ct-card-title">{content.title}</span>
              {content.type === 'oferta' && <span className="ct-badge">Oferta</span>}
              {shared && <span className="ct-done-badge"><Check size={12} /> Postado</span>}
            </div>

            <p className="ct-card-caption">{content.caption}</p>

            <div className="ct-card-actions">
              <button className="ct-btn ct-btn-share" onClick={() => handleShare(content)}>
                <Share2 size={15} /> Compartilhar
              </button>
              <button className="ct-btn ct-btn-wpp" onClick={() => handleWhatsApp(content)}>
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button className="ct-btn ct-btn-copy" onClick={() => handleCopy(content)}>
                {copiedId === content.id ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}
              </button>
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="ct-empty card">
          <Sparkles size={28} />
          <p>Preparando o conteúdo do dia…</p>
        </div>
      )}

      <p className="ct-foot">Cada conteúdo compartilhado vale <strong>10 pontos</strong>. Poste todo dia e mantenha sua sequência! 🔥</p>
    </div>
  );
}

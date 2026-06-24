import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Flame, Trophy, Sparkles, MessageCircle, Medal, Camera } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getActiveOffers } from '../services/firestore/offers';
import {
  buildDailyContent, logShare, hasSharedToday, getContentStats,
  getMonthlyStats, currentMonthKey,
} from '../services/socialContent';
import type { ContentSuggestion, ContentStats } from '../services/socialContent';
import { saveMyContentScore, getTeamRanking } from '../services/firestore/contentScores';
import { saveContentProof } from '../services/firestore/contentProofs';
import type { RankRow } from '../services/firestore/contentScores';
import type { UserProfile } from '../types';
import './ContentToday.css';

export default function ContentToday() {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [items, setItems] = useState<ContentSuggestion[]>([]);
  const [stats, setStats] = useState<ContentStats>({ totalPoints: 0, totalShares: 0, sharesToday: 0, streak: 0 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedTick, setSharedTick] = useState(0); // força re-render após compartilhar
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [proofError, setProofError] = useState('');

  const loadRanking = () => {
    if (!profile.uid) return;
    getTeamRanking(profile.uid, profile.company || '', profile.segment, currentMonthKey())
      .then(setRanking)
      .catch(() => {});
  };

  // Sincroniza o placar do mês no Firestore e recarrega o ranking
  const syncScore = () => {
    if (!profile.uid) return;
    const m = getMonthlyStats();
    const s = getContentStats();
    saveMyContentScore({
      uid: profile.uid,
      name: profile.name || 'Vendedor',
      company: profile.company || '',
      segment: profile.segment || '',
      teamId: profile.teamId ?? null,
      monthKey: currentMonthKey(),
      points: m.points,
      shares: m.shares,
      streak: s.streak,
    }).then(loadRanking).catch(() => {});
  };

  useEffect(() => {
    setStats(getContentStats());
    loadRanking();
    getActiveOffers(profile.segment || undefined)
      .then(offers => setItems(buildDailyContent(profile.segment, offers)))
      .catch(() => setItems(buildDailyContent(profile.segment, [])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Só pontua e entra no painel do gestor quando o vendedor anexa o PRINT do post.
  const registerScore = (content: ContentSuggestion) => {
    if (!hasSharedToday(content.id)) {
      logShare(content);
      setStats(getContentStats());
      setSharedTick(t => t + 1);
      syncScore(); // atualiza o ranking da equipe
    }
  };

  const handleProof = async (content: ContentSuggestion, file: File) => {
    if (!profile.uid) {
      setProofError('Faça login para comprovar seus posts.');
      return;
    }
    setProofError('');
    setUploadingId(content.id);
    setUploadPct(0);
    try {
      const url = await saveContentProof({
        uid: profile.uid,
        name: profile.name || 'Vendedor',
        company: profile.company || '',
        segment: profile.segment || '',
        monthKey: currentMonthKey(),
        contentId: content.id,
        caption: content.caption,
        file,
        onProgress: setUploadPct,
      });
      setProofUrls(m => ({ ...m, [content.id]: url }));
      registerScore(content); // só agora pontua
    } catch {
      setProofError('Não consegui enviar o print. Tenta de novo.');
    } finally {
      setUploadingId(null);
    }
  };

  // Compartilhar/Copiar agora só ajudam a postar — NÃO pontuam (o print é que conta).
  const handleShare = async (content: ContentSuggestion) => {
    if (navigator.share) {
      try {
        await navigator.share({ text: content.caption });
        return;
      } catch { return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(content.caption)}`, '_blank');
  };

  const handleWhatsApp = (content: ContentSuggestion) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(content.caption)}`, '_blank');
  };

  const handleCopy = (content: ContentSuggestion) => {
    const done = () => {
      setCopiedId(content.id);
      setTimeout(() => setCopiedId(null), 2000);
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
              {shared && <span className="ct-done-badge"><Check size={12} /> Comprovado</span>}
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

            {/* Comprovação obrigatória: só pontua com o print do post publicado */}
            {shared ? (
              <div className="ct-proof ct-proof--done">
                <Check size={14} /> Post comprovado · +10 pontos
                {proofUrls[content.id] && (
                  <a href={proofUrls[content.id]} target="_blank" rel="noopener noreferrer" className="ct-proof-thumb">
                    <img src={proofUrls[content.id]} alt="Print do post" />
                  </a>
                )}
              </div>
            ) : (
              <label className={`ct-btn ct-btn-proof ${uploadingId === content.id ? 'is-loading' : ''}`}>
                <Camera size={15} />
                {uploadingId === content.id ? `Enviando print… ${uploadPct}%` : 'Anexar print do post pra pontuar'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingId !== null}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleProof(content, f);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        );
      })}

      {proofError && <div className="ct-proof-error card">{proofError}</div>}

      {items.length === 0 && (
        <div className="ct-empty card">
          <Sparkles size={28} />
          <p>Preparando o conteúdo do dia…</p>
        </div>
      )}

      {/* Ranking da equipe */}
      {ranking.length > 0 && (
        <div className="ct-rank card">
          <div className="ct-rank-head">
            <Medal size={18} />
            <span>Ranking da equipe — {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</span>
          </div>
          {ranking.slice(0, 8).map(r => (
            <div key={r.uid} className={`ct-rank-row ${r.isMe ? 'ct-rank-row--me' : ''}`}>
              <span className={`ct-rank-pos ct-rank-pos--${r.position <= 3 ? r.position : 'n'}`}>
                {r.position <= 3 ? ['🥇', '🥈', '🥉'][r.position - 1] : r.position}
              </span>
              <span className="ct-rank-name">{r.isMe ? `${r.name} (você)` : r.name}</span>
              {r.streak > 0 && <span className="ct-rank-streak"><Flame size={11} /> {r.streak}</span>}
              <span className="ct-rank-pts">{r.points} pts</span>
            </div>
          ))}
        </div>
      )}

      <p className="ct-foot">Poste o conteúdo na sua rede e <strong>anexe o print</strong> pra ganhar <strong>10 pontos</strong> — só assim entra no painel do gestor. Poste todo dia e mantenha a sequência! 🔥</p>
    </div>
  );
}

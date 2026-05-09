import { useState } from 'react';
import { MessageCircle, Send, Check, Star, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loadData, KEYS } from '../services/storage';
import { saveFeedback } from '../services/firestore/feedback';
import type { UserProfile } from '../types';
import './Feedback.css';

// Número do WhatsApp para receber notificação de feedback (só números, com DDI)
const WHATSAPP_NUMBER = '5511956590973';

export default function Feedback() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [mostUsed, setMostUsed] = useState('');
  const [whatMissing, setWhatMissing] = useState('');
  const [bug, setBug] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!rating && !mostUsed.trim() && !whatMissing.trim() && !bug.trim() && !suggestion.trim()) {
      setError('Preencha pelo menos um campo antes de enviar.');
      return;
    }
    setError('');
    setSending(true);

    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });

    try {
      // 1. Salva no Firestore
      await saveFeedback({
        uid: user?.uid,
        name: profile.name || user?.displayName || 'Anônimo',
        email: user?.email || '',
        rating,
        mostUsed,
        whatMissing,
        bug,
        suggestion,
      });
    } catch {
      // Firestore offline — continua mesmo assim
    }

    // 2. Abre WhatsApp com o feedback formatado
    const stars = rating ? `${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)` : 'não informada';
    const lines = [
      `🌟 *Feedback GSS Academy*`,
      `👤 ${profile.name || user?.email || 'Anônimo'}`,
      ``,
      `Nota: ${stars}`,
      mostUsed    ? `\n✅ *Feature mais útil:*\n${mostUsed}` : '',
      whatMissing ? `\n❓ *O que está faltando:*\n${whatMissing}` : '',
      bug         ? `\n🐛 *Bug encontrado:*\n${bug}` : '',
      suggestion  ? `\n💡 *Sugestão:*\n${suggestion}` : '',
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank');

    // Marca que feedback foi enviado — reseta timer do lembrete semanal
    localStorage.setItem('gss_feedback_last_action', String(Date.now()));

    setSending(false);
    setSent(true);
  };

  const handleReset = () => {
    setSent(false);
    setRating(0);
    setMostUsed('');
    setWhatMissing('');
    setBug('');
    setSuggestion('');
    setError('');
  };

  if (sent) {
    return (
      <div className="feedback-page">
        <div className="feedback-success card">
          <div className="feedback-success-icon"><Check size={40} /></div>
          <h2>Obrigado pelo feedback!</h2>
          <p>Sua mensagem foi aberta no WhatsApp. Envie para confirmar — sua opinião ajuda a melhorar o app para toda a equipe.</p>
          <button className="btn btn-outline" onClick={handleReset}>
            Enviar outro feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <div className="feedback-hero card">
        <MessageCircle size={24} />
        <div>
          <h2>Seu feedback importa</h2>
          <p>Ajude a melhorar o app. Leva menos de 2 minutos.</p>
        </div>
      </div>

      {/* Rating */}
      <div className="feedback-section card">
        <label>Nota geral do app</label>
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              className={`rating-star ${rating >= n ? 'active' : ''}`}
              onClick={() => setRating(n)}
            >
              <Star size={34} fill={rating >= n ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="rating-label">
            {['', 'Muito ruim 😞', 'Ruim 😕', 'Ok 😐', 'Bom 😊', 'Excelente! 🤩'][rating]}
          </p>
        )}
      </div>

      {/* Most used */}
      <div className="feedback-section card">
        <label>Qual parte você usou MAIS?</label>
        <textarea
          rows={3}
          value={mostUsed}
          onChange={e => setMostUsed(e.target.value)}
          placeholder="Ex: Uso muito a IA para responder objeções antes das reuniões..."
        />
      </div>

      {/* What's missing */}
      <div className="feedback-section card">
        <label>O que está faltando?</label>
        <textarea
          rows={3}
          value={whatMissing}
          onChange={e => setWhatMissing(e.target.value)}
          placeholder="Ex: Faltaria um módulo de acompanhamento de metas por vendedor..."
        />
      </div>

      {/* Bug */}
      <div className="feedback-section card">
        <label>Encontrou algum problema técnico?</label>
        <textarea
          rows={3}
          value={bug}
          onChange={e => setBug(e.target.value)}
          placeholder="Ex: Ao gravar áudio e tocar o botão verde, a mensagem sumiu..."
        />
      </div>

      {/* Suggestion */}
      <div className="feedback-section card">
        <label>Sugestão livre</label>
        <textarea
          rows={3}
          value={suggestion}
          onChange={e => setSuggestion(e.target.value)}
          placeholder="Ex: Seria incrível se tivesse integração com o Google Calendar..."
        />
      </div>

      {error && <p className="feedback-error">{error}</p>}

      <button
        className="btn btn-primary feedback-send"
        onClick={handleSend}
        disabled={sending}
      >
        {sending
          ? <><Loader2 size={16} className="spinning" /> Enviando...</>
          : <><Send size={16} /> Enviar feedback</>}
      </button>

      <p className="feedback-hint">
        Seu feedback é salvo automaticamente e enviado via WhatsApp para a equipe GSS.
      </p>
    </div>
  );
}

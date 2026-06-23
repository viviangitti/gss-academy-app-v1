import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { saveQuickFeedback, addFeedbackReason } from '../services/firestore/feedback';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './AIFeedback.css';

interface Props {
  feature: string;       // 'coach' | 'boost' | 'boost-debrief'
  context?: string;      // pergunta/situação
  response?: string;     // resposta da IA
}

export default function AIFeedback({ feature, context, response }: Props) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reasonSent, setReasonSent] = useState(false);

  const pick = (v: 'up' | 'down') => {
    if (vote) return;
    setVote(v);
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    saveQuickFeedback({
      uid: profile.uid,
      name: profile.name,
      email: profile.email,
      feature,
      vote: v,
      context: context?.slice(0, 500),
      response: response?.slice(0, 800),
    })
      .then(id => setDocId(id))
      .catch(() => {});
  };

  const sendReason = () => {
    const r = reason.trim();
    if (r && docId) addFeedbackReason(docId, r).catch(() => {});
    setReasonSent(true);
  };

  if (vote === 'up') {
    return <div className="aifb-done">Valeu pelo retorno! 🙌</div>;
  }

  if (vote === 'down') {
    if (reasonSent) return <div className="aifb-done">Valeu! Vou melhorar isso. 🙏</div>;
    return (
      <div className="aifb-reason">
        <input
          className="aifb-reason-input"
          placeholder="O que faltou? (opcional)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendReason()}
          autoFocus
        />
        <button className="aifb-reason-send" onClick={sendReason}>Enviar</button>
      </div>
    );
  }

  return (
    <div className="aifb">
      <span className="aifb-label">Ajudou?</span>
      <button className="aifb-btn" onClick={() => pick('up')} aria-label="Ajudou">
        <ThumbsUp size={13} />
      </button>
      <button className="aifb-btn" onClick={() => pick('down')} aria-label="Não ajudou">
        <ThumbsDown size={13} />
      </button>
    </div>
  );
}

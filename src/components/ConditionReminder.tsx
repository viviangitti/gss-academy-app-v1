import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ArrowRight, X } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getActiveConditionsForMonth } from '../services/firestore/commercialConditions';
import type { UserProfile } from '../types';
import './ConditionReminder.css';

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const DISMISS_KEY = 'gss_cond_reminder_dismissed';

/**
 * Lembrete pro Marketing: quando vira o mês e ainda não há condição comercial
 * publicada, mostra um aviso pra subir a do mês. Some ao publicar ou ao dispensar
 * (dispensa vale só para o mês atual — no mês seguinte volta a lembrar).
 */
export default function ConditionReminder() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const isMarketing = profile.userAccessType === 'marketing' || profile.userAccessType === 'ambos' || profile.isAdmin === true;

  useEffect(() => {
    if (!isMarketing) return;
    const mk = monthKey();
    if (localStorage.getItem(DISMISS_KEY) === mk) return;
    getActiveConditionsForMonth(mk, profile.segment || undefined, profile.company || '')
      .then(conds => { if (!conds.length) setShow(true); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(DISMISS_KEY, monthKey());
    setShow(false);
  };

  return (
    <button className="cond-reminder" onClick={() => navigate('/condicoes-admin')}>
      <div className="cond-reminder-icon"><Megaphone size={18} /></div>
      <div className="cond-reminder-text">
        <strong>Hora de subir a condição do mês 📣</strong>
        <span>O time de vendas ainda não tem as condições deste mês. Publique agora.</span>
      </div>
      <ArrowRight size={16} className="cond-reminder-arrow" />
      <span className="cond-reminder-x" onClick={dismiss} role="button" aria-label="Dispensar"><X size={14} /></span>
    </button>
  );
}

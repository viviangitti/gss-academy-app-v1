import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Check, ArrowRight } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { buildPlan, getDonePlan, togglePlanItem } from '../services/gestorPlan';
import { getTeamSummary } from '../services/firestore/contentScores';
import { currentMonthKey } from '../services/socialContent';
import type { PlanItem } from '../services/gestorPlan';
import type { UserProfile } from '../types';
import './GestorWeekPlan.css';

/** Plano da semana do gestor — ações concretas (do time) pra aplicar e marcar feito. */
export default function GestorWeekPlan() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [plan, setPlan] = useState<PlanItem[]>(() => buildPlan(null, profile.name));
  const [done, setDone] = useState<string[]>(() => getDonePlan());

  useEffect(() => {
    getTeamSummary(profile.company || '', profile.segment || '', currentMonthKey())
      .then(s => setPlan(buildPlan(s, profile.name)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => { togglePlanItem(id); setDone(getDonePlan()); };
  const doneCount = plan.filter(p => done.includes(p.id)).length;
  const pct = plan.length ? Math.round((doneCount / plan.length) * 100) : 0;

  return (
    <div className="day-section">
      <div className="gwp-head">
        <h3 className="section-title"><ClipboardList size={15} /> Plano da semana com o time</h3>
        <span className="gwp-count">{doneCount}/{plan.length}</span>
      </div>
      <div className="gwp-bar"><i style={{ width: `${pct}%` }} /></div>
      <div className="gwp-list">
        {plan.map(item => {
          const isDone = done.includes(item.id);
          return (
            <div key={item.id} className={`gwp-item card ${isDone ? 'done' : ''}`}>
              <button className={`gwp-check ${isDone ? 'on' : ''}`} onClick={() => toggle(item.id)} aria-label="Marcar feito">
                {isDone && <Check size={14} />}
              </button>
              <div className="gwp-text" onClick={() => toggle(item.id)}>
                <strong>{item.text}</strong>
                {item.detail && <span>{item.detail}</span>}
              </div>
              {item.link && (
                <button className="gwp-go" onClick={() => navigate(item.link!)} aria-label="Abrir">
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {doneCount === plan.length && plan.length > 0 && (
        <p className="gwp-done-msg">🏆 Semana completa com o time. Consistência é o que constrói cultura.</p>
      )}
    </div>
  );
}

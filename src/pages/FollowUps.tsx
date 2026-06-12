import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Phone, CalendarClock, CheckCircle2, TrendingDown,
  Flame, Snowflake, MessageCircle, Users,
} from 'lucide-react';
import {
  getOpenFollowUps, addFollowUp, updateFollowUp, closeFollowUp,
  getDueFollowUps, getPipelineValue, STAGE_LABELS,
} from '../services/followups';
import type { FollowUp, FollowUpStage } from '../services/followups';
import { addSale } from '../services/goal';
import { addWin } from '../services/wins';
import './FollowUps.css';

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

function todayStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateLabel(iso: string): string {
  if (iso === todayStr()) return 'Hoje';
  if (iso === todayStr(1)) return 'Amanhã';
  if (iso < todayStr()) {
    const days = Math.round((new Date(todayStr()).getTime() - new Date(iso).getTime()) / 86400000);
    return `Atrasado ${days}d`;
  }
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

const EMPTY_FORM = {
  clientName: '', interest: '', stage: 'novo' as FollowUpStage,
  note: '', nextAction: 'Ligar', nextDate: todayStr(1), estValue: '', estCommission: '',
};

const ACTIONS = ['Ligar', 'WhatsApp', 'Mandar proposta', 'Visita / test-drive', 'Cobrar resposta'];

export default function FollowUps() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FollowUp[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rescheduling, setRescheduling] = useState<string | null>(null);

  const refresh = useCallback(() => setItems(getOpenFollowUps()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const { today, overdue } = getDueFollowUps();
  const pipeline = getPipelineValue();
  const dueIds = new Set([...today, ...overdue].map(f => f.id));
  const upcoming = items.filter(f => !dueIds.has(f.id));

  const handleAdd = () => {
    if (!form.clientName.trim()) return;
    addFollowUp({
      clientName: form.clientName.trim(),
      interest: form.interest.trim(),
      stage: form.stage,
      note: form.note.trim() || undefined,
      nextAction: form.nextAction,
      nextDate: form.nextDate,
      estValue: form.estValue ? Number(form.estValue) : undefined,
      estCommission: form.estCommission ? Number(form.estCommission) : undefined,
      lastTouchAt: Date.now(),
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    refresh();
  };

  /** "Feito" → marca contato e reagenda */
  const handleDone = (f: FollowUp, nextDate: string) => {
    updateFollowUp(f.id, { lastTouchAt: Date.now(), nextDate });
    setRescheduling(null);
    refresh();
  };

  const handleWon = (f: FollowUp) => {
    closeFollowUp(f.id, 'won');
    addWin('fuWon', f.estCommission || 0);
    if (f.estValue || f.estCommission) {
      addSale(f.estValue || 0, f.estCommission || 0, f.clientName, `Follow-up: ${f.interest}`);
    }
    refresh();
  };

  const handleLost = (f: FollowUp) => {
    closeFollowUp(f.id, 'lost');
    refresh();
    navigate('/vendas-perdidas');
  };

  const renderCard = (f: FollowUp, urgent: boolean) => (
    <div key={f.id} className={`fu-card card ${urgent ? 'fu-card--due' : ''}`}>
      <div className="fu-card-top">
        <div className="fu-card-info">
          <strong>{f.clientName}</strong>
          {f.interest && <span className="fu-interest">{f.interest}</span>}
        </div>
        <span className={`fu-date ${f.nextDate < todayStr() ? 'fu-date--late' : ''}`}>
          {dateLabel(f.nextDate)}
        </span>
      </div>
      <div className="fu-card-mid">
        <span className="fu-stage">{STAGE_LABELS[f.stage]}</span>
        <span className="fu-action"><Phone size={12} /> {f.nextAction}</span>
        {f.estCommission ? <span className="fu-comm">{formatBRL(f.estCommission)} comissão</span> : null}
      </div>
      {f.note && <p className="fu-note">{f.note}</p>}

      {rescheduling === f.id ? (
        <div className="fu-resched">
          <span>Próximo contato:</span>
          <button onClick={() => handleDone(f, todayStr(1))}>Amanhã</button>
          <button onClick={() => handleDone(f, todayStr(3))}>3 dias</button>
          <button onClick={() => handleDone(f, todayStr(7))}>1 semana</button>
          <button className="fu-resched-cancel" onClick={() => setRescheduling(null)}><X size={14} /></button>
        </div>
      ) : (
        <div className="fu-card-actions">
          <button className="fu-btn fu-btn-done" onClick={() => setRescheduling(f.id)}>
            <CheckCircle2 size={14} /> Feito
          </button>
          <button className="fu-btn fu-btn-won" onClick={() => handleWon(f)}>
            <Flame size={14} /> Fechou!
          </button>
          {(f.nextDate < todayStr() || f.stage === 'esfriou') ? (
            <button className="fu-btn fu-btn-rescue" onClick={() => navigate('/rescue', {
              state: {
                clientName: f.clientName,
                interest: f.interest,
                context: `Cliente esfriou (${STAGE_LABELS[f.stage]}). ${f.note || ''}`.trim(),
                daysSince: Math.max(1, Math.round((Date.now() - (f.lastTouchAt || f.updatedAt)) / 86400000)),
              },
            })}>
              🎯 Rescue
            </button>
          ) : (
            <button className="fu-btn fu-btn-lost" onClick={() => handleLost(f)}>
              <TrendingDown size={14} /> Perdi
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fu-page">
      {/* Pipeline: quanto vale a carteira */}
      {pipeline.count > 0 && (
        <div className="fu-stats card">
          <div className="fu-stat">
            <span className="fu-stat-value">{pipeline.count}</span>
            <span className="fu-stat-label">Clientes ativos</span>
          </div>
          <div className="fu-stat-divider" />
          <div className="fu-stat">
            <span className="fu-stat-value">{formatBRL(pipeline.totalCommission)}</span>
            <span className="fu-stat-label">Comissão em jogo</span>
          </div>
        </div>
      )}

      <button className="btn btn-primary fu-add-btn" onClick={() => setShowForm(true)}>
        <Plus size={16} /> Novo follow-up
      </button>

      {/* Atrasados */}
      {overdue.length > 0 && (
        <section className="fu-section">
          <h4 className="fu-section-title fu-late"><Snowflake size={14} /> Atrasados — resgate antes que esfrie</h4>
          {overdue.map(f => renderCard(f, true))}
        </section>
      )}

      {/* Hoje */}
      {today.length > 0 && (
        <section className="fu-section">
          <h4 className="fu-section-title"><CalendarClock size={14} /> Hoje</h4>
          {today.map(f => renderCard(f, true))}
        </section>
      )}

      {/* Próximos */}
      {upcoming.length > 0 && (
        <section className="fu-section">
          <h4 className="fu-section-title"><Users size={14} /> Próximos</h4>
          {upcoming.map(f => renderCard(f, false))}
        </section>
      )}

      {items.length === 0 && (
        <div className="fu-empty card">
          <MessageCircle size={28} />
          <h4>Nenhum cliente em acompanhamento</h4>
          <p>Registre cada atendimento com o próximo passo. O app te lembra na hora certa — retorno é onde a venda acontece.</p>
        </div>
      )}

      {/* Form (bottom sheet) */}
      {showForm && (
        <div className="fu-overlay" onClick={() => setShowForm(false)}>
          <div className="fu-sheet" onClick={e => e.stopPropagation()}>
            <div className="fu-sheet-handle" />
            <div className="fu-sheet-header">
              <h3><Users size={18} /> Novo follow-up</h3>
              <button className="fu-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="fu-form">
              <div className="fu-field">
                <label>Cliente <span className="req">*</span></label>
                <input type="text" placeholder="Ex: João Mendes" value={form.clientName}
                  onChange={e => setForm({ ...form, clientName: e.target.value })} autoFocus />
              </div>
              <div className="fu-field">
                <label>Interesse</label>
                <input type="text" placeholder="Ex: XC60 2024 branco" value={form.interest}
                  onChange={e => setForm({ ...form, interest: e.target.value })} />
              </div>
              <div className="fu-field">
                <label>Em que pé está?</label>
                <div className="fu-chips">
                  {(Object.keys(STAGE_LABELS) as FollowUpStage[]).map(s => (
                    <button key={s} className={`fu-chip ${form.stage === s ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, stage: s })}>{STAGE_LABELS[s]}</button>
                  ))}
                </div>
              </div>
              <div className="fu-field">
                <label>Próximo passo</label>
                <div className="fu-chips">
                  {ACTIONS.map(a => (
                    <button key={a} className={`fu-chip ${form.nextAction === a ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, nextAction: a })}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="fu-field">
                <label>Quando?</label>
                <div className="fu-chips">
                  <button className={`fu-chip ${form.nextDate === todayStr() ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, nextDate: todayStr() })}>Hoje</button>
                  <button className={`fu-chip ${form.nextDate === todayStr(1) ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, nextDate: todayStr(1) })}>Amanhã</button>
                  <button className={`fu-chip ${form.nextDate === todayStr(3) ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, nextDate: todayStr(3) })}>3 dias</button>
                  <input type="date" value={form.nextDate}
                    onChange={e => setForm({ ...form, nextDate: e.target.value })} className="fu-date-input" />
                </div>
              </div>
              <div className="fu-row">
                <div className="fu-field">
                  <label>Valor estimado R$</label>
                  <input type="number" inputMode="numeric" placeholder="250000" value={form.estValue}
                    onChange={e => setForm({ ...form, estValue: e.target.value })} />
                </div>
                <div className="fu-field">
                  <label>Sua comissão R$</label>
                  <input type="number" inputMode="numeric" placeholder="2500" value={form.estCommission}
                    onChange={e => setForm({ ...form, estCommission: e.target.value })} />
                </div>
              </div>
              <div className="fu-field">
                <label>Observação</label>
                <input type="text" placeholder="Ex: esposa precisa aprovar, quer taxa menor" value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
              <button className="btn btn-primary fu-confirm" onClick={handleAdd} disabled={!form.clientName.trim()}>
                Salvar follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, Plus, Trash2, Lightbulb, BookOpen, ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  getLostSales, addLostSale, removeLostSale, getLostStats,
  REASON_LABELS, STAGE_LABELS, REASON_OBJECTION_LINK,
} from '../services/lostSales';
import type { LostSale, LostReason, LostStage } from '../services/lostSales';
import './LostSales.css';

function formatBRL(v: number) {
  if (!v) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const REASONS: LostReason[] = ['preco', 'concorrente', 'timing', 'sem_orcamento', 'sem_decisao', 'relacionamento', 'produto', 'outro'];
const STAGES: LostStage[] = ['prospeccao', 'proposta', 'negociacao', 'fechamento'];

export default function LostSales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<LostSale[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    opportunity: '',
    value: '',
    reason: 'preco' as LostReason,
    stage: 'proposta' as LostStage,
    notes: '',
    learning: '',
  });

  const refresh = () => setSales(getLostSales());

  useEffect(() => { refresh(); }, []);

  const stats = getLostStats();

  const handleAdd = () => {
    if (!form.opportunity.trim()) return;
    addLostSale({
      opportunity: form.opportunity.trim(),
      value: Number(form.value) || 0,
      reason: form.reason,
      stage: form.stage,
      notes: form.notes.trim(),
      learning: form.learning.trim(),
    });
    setForm({ opportunity: '', value: '', reason: 'preco', stage: 'proposta', notes: '', learning: '' });
    setShowForm(false);
    refresh();
  };

  const handleRemove = (id: string) => {
    if (confirm('Remover este registro?')) {
      removeLostSale(id);
      refresh();
    }
  };

  return (
    <div className="lost-page">

      {/* Stats */}
      {stats.total > 0 && (
        <div className="lost-stats card">
          <div className="lost-stat">
            <span className="lost-stat-value">{stats.total}</span>
            <span className="lost-stat-label">Perdidas</span>
          </div>
          <div className="lost-stat-divider" />
          <div className="lost-stat">
            <span className="lost-stat-value">{formatBRL(stats.totalValue)}</span>
            <span className="lost-stat-label">Em oportunidades</span>
          </div>
          {stats.topReason && (
            <>
              <div className="lost-stat-divider" />
              <div className="lost-stat">
                <span className="lost-stat-value lost-stat-small">
                  {REASON_LABELS[stats.topReason].split(' ')[0]}
                </span>
                <span className="lost-stat-label">Motivo #1</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Insight */}
      {stats.topReason && REASON_OBJECTION_LINK[stats.topReason] && (
        <div className="lost-insight card" onClick={() => navigate('/objecoes')}>
          <Lightbulb size={16} />
          <div>
            <strong>Você perde muito por {REASON_LABELS[stats.topReason].toLowerCase()}.</strong>
            <span> Pratique as respostas na Biblioteca de Objeções.</span>
          </div>
          <BookOpen size={16} className="lost-insight-arrow" />
        </div>
      )}

      {/* Add button */}
      <button className="btn btn-primary lost-add-btn" onClick={() => setShowForm(true)}>
        <Plus size={16} /> Registrar venda perdida
      </button>

      {/* Form modal */}
      {showForm && (
        <div className="lost-overlay" onClick={() => setShowForm(false)}>
          <div className="lost-sheet" onClick={e => e.stopPropagation()}>
            <div className="lost-sheet-handle" />
            <div className="lost-sheet-header">
              <h3><TrendingDown size={18} /> Nova venda perdida</h3>
              <button className="lost-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>

            <div className="lost-form">
              <div className="lost-field">
                <label>Oportunidade <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: Contrato anual de software"
                  value={form.opportunity}
                  onChange={e => setForm({ ...form, opportunity: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="lost-field">
                <label>Valor estimado R$</label>
                <input
                  type="number"
                  placeholder="Ex: 15000"
                  value={form.value}
                  onChange={e => setForm({ ...form, value: e.target.value })}
                  inputMode="numeric"
                />
              </div>

              <div className="lost-field">
                <label>Etapa em que perdeu</label>
                <div className="lost-chips-select">
                  {STAGES.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`lost-chip ${form.stage === s ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, stage: s })}
                    >
                      {STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lost-field">
                <label>Principal motivo</label>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value as LostReason })}>
                  {REASONS.map(r => (
                    <option key={r} value={r}>{REASON_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              <div className="lost-field">
                <label>O que aconteceu?</label>
                <textarea
                  rows={2}
                  placeholder="Descreva brevemente como a venda foi perdida..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="lost-field highlight">
                <label><Lightbulb size={13} /> O que faria diferente?</label>
                <textarea
                  rows={2}
                  placeholder="Este é o aprendizado mais valioso. Seja honesto..."
                  value={form.learning}
                  onChange={e => setForm({ ...form, learning: e.target.value })}
                />
              </div>

              <button className="btn btn-primary lost-confirm" onClick={handleAdd}>
                Salvar registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {sales.length === 0 ? (
        <div className="lost-empty card">
          <TrendingDown size={36} />
          <h3>Nenhuma venda perdida registrada</h3>
          <p>Registre suas perdas para identificar padrões e melhorar a cada ciclo.</p>
        </div>
      ) : (
        <div className="lost-list">
          {sales.map(sale => (
            <div key={sale.id} className="lost-item card">
              <div className="lost-item-header" onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}>
                <div className="lost-item-info">
                  <div className="lost-item-top">
                    <span className="lost-item-reason">{REASON_LABELS[sale.reason]}</span>
                    <span className="lost-item-stage">{STAGE_LABELS[sale.stage]}</span>
                  </div>
                  <p className="lost-item-opp">{sale.opportunity}</p>
                  <div className="lost-item-meta">
                    <span>{formatDate(sale.date)}</span>
                    {sale.value > 0 && <span>{formatBRL(sale.value)}</span>}
                  </div>
                </div>
                <div className="lost-item-actions">
                  {expandedId === sale.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expandedId === sale.id && (
                <div className="lost-item-body">
                  {sale.notes && (
                    <div className="lost-item-section">
                      <label>O que aconteceu</label>
                      <p>{sale.notes}</p>
                    </div>
                  )}
                  {sale.learning && (
                    <div className="lost-item-section learning">
                      <label><Lightbulb size={12} /> Aprendizado</label>
                      <p>{sale.learning}</p>
                    </div>
                  )}
                  <div className="lost-item-footer">
                    {REASON_OBJECTION_LINK[sale.reason] && (
                      <button className="btn btn-outline btn-sm" onClick={() => navigate('/objecoes')}>
                        <BookOpen size={12} /> Ver objeções
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm lost-delete" onClick={() => handleRemove(sale.id)}>
                      <Trash2 size={12} /> Remover
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

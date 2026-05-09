import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, Megaphone, Edit3, RefreshCw, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllOffers, createOffer, updateOffer, deleteOffer } from '../services/firestore/offers';
import { SEGMENTS } from '../types';
import type { Offer, Segment } from '../types';
import './OffersAdmin.css';

const EMPTY_OFFER: Omit<Offer, 'id'> = {
  title: '',
  description: '',
  highlights: [''],
  pitch: '',
  validFrom: new Date().toISOString().split('T')[0],
  validTo: '',
  segments: [],
  active: true,
};

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function OffersAdmin() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<Offer, 'id'>>(EMPTY_OFFER);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setOffers(await getAllOffers()); } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (o: Offer) => {
    setForm({ ...o });
    setEditingId(o.id!);
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNew = () => {
    setForm({ ...EMPTY_OFFER });
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.validTo) {
      setError('Preencha o título e a data de validade.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const clean = {
        ...form,
        highlights: form.highlights.filter(h => h.trim()),
      };
      if (editingId) {
        await updateOffer(editingId, clean);
      } else {
        await createOffer(clean, user?.uid || '');
      }
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch {
      setError('Erro ao salvar. Verifique sua conexão.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;
    await deleteOffer(id);
    await load();
  };

  const handleToggle = async (o: Offer) => {
    await updateOffer(o.id!, { active: !o.active });
    await load();
  };

  const addHighlight = () => setForm(f => ({ ...f, highlights: [...f.highlights, ''] }));
  const updateHighlight = (i: number, v: string) =>
    setForm(f => ({ ...f, highlights: f.highlights.map((h, idx) => idx === i ? v : h) }));
  const removeHighlight = (i: number) =>
    setForm(f => ({ ...f, highlights: f.highlights.filter((_, idx) => idx !== i) }));

  const toggleSegment = (seg: Segment) => {
    if (!seg) return;
    setForm(f => ({
      ...f,
      segments: f.segments.includes(seg)
        ? f.segments.filter(s => s !== seg)
        : [...f.segments, seg],
    }));
  };

  return (
    <div className="oa-page">
      {/* Hero */}
      <div className="oa-hero card">
        <Megaphone size={22} />
        <div>
          <h2>Painel Marketing</h2>
          <p>Cadastre as ofertas e campanhas do mês</p>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="oa-form card">
          <div className="oa-form-header">
            <h3>{editingId ? 'Editar oferta' : 'Nova oferta'}</h3>
            <button className="oa-close" onClick={handleCancel}><X size={16} /></button>
          </div>

          <div className="oa-field">
            <label>Título da campanha *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Feirão de Maio — Entrada Zero"
            />
          </div>

          <div className="oa-field">
            <label>Descritivo completo</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Explique a campanha em detalhes — a IA vai usar esse texto para ajudar o vendedor com o cliente..."
            />
          </div>

          <div className="oa-field">
            <label>Argumento para o cliente (pitch)</label>
            <textarea
              rows={3}
              value={form.pitch}
              onChange={e => setForm(f => ({ ...f, pitch: e.target.value }))}
              placeholder='Ex: "Essa semana você leva o modelo X com entrada zero e parcelas que cabem no bolso. Poucos disponíveis!"'
            />
          </div>

          <div className="oa-field">
            <label>Destaques (bullets)</label>
            {form.highlights.map((h, i) => (
              <div key={i} className="oa-bullet-row">
                <input
                  value={h}
                  onChange={e => updateHighlight(i, e.target.value)}
                  placeholder={`Destaque ${i + 1}`}
                />
                <button className="oa-remove-bullet" onClick={() => removeHighlight(i)}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <button className="oa-add-bullet" onClick={addHighlight}>
              <Plus size={13} /> Adicionar destaque
            </button>
          </div>

          <div className="oa-row">
            <div className="oa-field">
              <label>Válido de *</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
              />
            </div>
            <div className="oa-field">
              <label>Válido até *</label>
              <input
                type="date"
                value={form.validTo}
                onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))}
              />
            </div>
          </div>

          <div className="oa-field">
            <label>Segmentos (vazio = todos)</label>
            <div className="oa-segments">
              {SEGMENTS.filter(s => s.value).map(s => (
                <button
                  key={s.value}
                  className={`oa-seg-chip ${form.segments.includes(s.value) ? 'active' : ''}`}
                  onClick={() => toggleSegment(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="oa-field oa-toggle-row">
            <span>Oferta ativa</span>
            <label className="oa-toggle">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              />
              <span className="oa-toggle-track" />
            </label>
          </div>

          {error && <p className="oa-error">{error}</p>}

          <div className="oa-form-actions">
            <button className="btn btn-outline" onClick={handleCancel}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><RefreshCw size={14} className="oa-spin" /> Salvando...</> : <><Save size={14} /> Salvar</>}
            </button>
          </div>
        </div>
      )}

      {/* Botão nova */}
      {!showForm && (
        <button className="btn btn-primary oa-new-btn" onClick={handleNew}>
          <Plus size={16} /> Nova oferta
        </button>
      )}

      {/* Lista */}
      {loading ? (
        <div className="oa-loading">
          <RefreshCw size={20} className="oa-spin" />
          <span>Carregando...</span>
        </div>
      ) : offers.length === 0 ? (
        <div className="oa-empty card">
          <p>Nenhuma oferta cadastrada.</p>
        </div>
      ) : (
        offers.map(o => (
          <div key={o.id} className={`oa-offer-row card ${!o.active ? 'oa-inactive' : ''}`}>
            <div className="oa-offer-info">
              <strong>{o.title}</strong>
              <span>{formatDate(o.validFrom)} → {formatDate(o.validTo)}</span>
              {o.segments.length > 0 && (
                <span className="oa-seg-label">{o.segments.slice(0,2).join(', ')}{o.segments.length > 2 ? '...' : ''}</span>
              )}
            </div>
            <div className="oa-offer-actions">
              <button
                className={`oa-toggle-btn ${o.active ? 'on' : 'off'}`}
                onClick={() => handleToggle(o)}
                title={o.active ? 'Desativar' : 'Ativar'}
              >
                {o.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
              <button className="oa-icon-btn" onClick={() => handleEdit(o)} title="Editar">
                <Edit3 size={16} />
              </button>
              <button className="oa-icon-btn oa-danger" onClick={() => handleDelete(o.id!, o.title)} title="Excluir">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

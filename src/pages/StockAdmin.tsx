import { useState, useEffect, useCallback } from 'react';
import { Car, Plus, Trash2, Edit3, Save, X, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import {
  getAllStock, createStockVehicle, updateStockVehicle, deleteStockVehicle,
} from '../services/firestore/stock';
import type { StockVehicle } from '../services/firestore/stock';
import './StockAdmin.css';

type Form = Omit<StockVehicle, 'id'>;

export default function StockAdmin() {
  const { user } = useAuth();
  const me = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const company = me.company || '';

  const EMPTY: Form = { model: '', year: '', color: '', price: '', note: '', company, active: true };

  const [items, setItems] = useState<StockVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getAllStock(company)); } catch { /* offline */ }
    setLoading(false);
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const handleNew = () => { setForm(EMPTY); setEditingId(null); setError(''); setShowForm(true); };
  const handleEdit = (v: StockVehicle) => {
    setForm({ model: v.model, year: v.year || '', color: v.color || '', price: v.price || '', note: v.note || '', company: v.company || company, active: v.active });
    setEditingId(v.id); setError(''); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleCancel = () => { setShowForm(false); setEditingId(null); setError(''); };

  const handleSave = async () => {
    if (!form.model.trim()) { setError('Informe o modelo do veículo.'); return; }
    setSaving(true); setError('');
    try {
      const clean: Form = { ...form, model: form.model.trim(), company };
      if (editingId) await updateStockVehicle(editingId, clean);
      else await createStockVehicle(clean, user?.uid || '');
      setShowForm(false); setEditingId(null);
      await load();
    } catch {
      setError('Erro ao salvar. Verifique sua conexão.');
    }
    setSaving(false);
  };

  const handleToggle = async (v: StockVehicle) => { await updateStockVehicle(v.id, { active: !v.active }); await load(); };
  const handleDelete = async (v: StockVehicle) => {
    if (!confirm(`Remover "${v.model}" do estoque? Não pode ser desfeito.`)) return;
    await deleteStockVehicle(v.id); await load();
  };

  return (
    <div className="sa-page">
      <div className="sa-hero card">
        <Car size={22} />
        <div>
          <h2>Estoque parado</h2>
          <p>Cadastre os veículos antigos pro time priorizar a venda</p>
        </div>
      </div>

      {showForm && (
        <div className="sa-form card">
          <div className="sa-form-header">
            <h3>{editingId ? 'Editar veículo' : 'Novo veículo'}</h3>
            <button className="sa-close" onClick={handleCancel}><X size={16} /></button>
          </div>

          <div className="sa-field">
            <label>Modelo *</label>
            <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Ex: Corolla Cross XRE" />
          </div>
          <div className="sa-row">
            <div className="sa-field">
              <label>Ano</label>
              <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="Ex: 2024/2025" />
            </div>
            <div className="sa-field">
              <label>Cor</label>
              <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Ex: Prata" />
            </div>
          </div>
          <div className="sa-field">
            <label>Preço / condição</label>
            <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Ex: R$ 159.900 ou Bônus de R$ 8 mil" />
          </div>
          <div className="sa-field">
            <label>Observação pro time</label>
            <textarea rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Ex: Único, parado há 90 dias — prioridade do mês" />
          </div>

          {error && <p className="sa-error">{error}</p>}

          <div className="sa-form-actions">
            <button className="btn btn-outline" onClick={handleCancel}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><RefreshCw size={14} className="sa-spin" /> Salvando…</> : <><Save size={14} /> Salvar</>}
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="btn btn-primary sa-new-btn" onClick={handleNew}>
          <Plus size={15} /> Cadastrar veículo
        </button>
      )}

      <div className="sa-list-title"><strong>Veículos cadastrados</strong></div>

      {loading ? (
        <div className="sa-loading"><RefreshCw size={18} className="sa-spin" /> Carregando…</div>
      ) : items.length === 0 ? (
        <div className="sa-empty card"><p>Nenhum veículo cadastrado ainda.</p></div>
      ) : (
        items.map(v => (
          <div key={v.id} className={`sa-item card ${!v.active ? 'sa-inactive' : ''}`}>
            <div className="sa-item-info">
              <strong>{v.model}</strong>
              <span className="sa-item-meta">
                {[v.year, v.color, v.price].filter(Boolean).join(' • ')}
              </span>
              {v.note && <span className="sa-item-note">{v.note}</span>}
            </div>
            <div className="sa-item-actions">
              <button className={`sa-toggle ${v.active ? 'on' : 'off'}`} onClick={() => handleToggle(v)} title={v.active ? 'Ativo (visível ao time)' : 'Inativo'}>
                {v.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
              <button className="sa-icon-btn" onClick={() => handleEdit(v)} title="Editar"><Edit3 size={16} /></button>
              <button className="sa-icon-btn sa-danger" onClick={() => handleDelete(v)} title="Remover"><Trash2 size={16} /></button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

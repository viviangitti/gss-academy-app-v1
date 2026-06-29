import { useState, useEffect, useCallback, useRef } from 'react';
import { Car, Plus, Trash2, Edit3, Save, X, RefreshCw, ToggleLeft, ToggleRight, Sparkles, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import {
  getAllStock, createStockVehicle, updateStockVehicle, deleteStockVehicle,
} from '../services/firestore/stock';
import type { StockVehicle, StockCategory } from '../services/firestore/stock';
import { extractVehicleFromFile } from '../services/stockExtract';
import './StockAdmin.css';

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Form = Omit<StockVehicle, 'id'>;

const CATEGORIES: { value: StockCategory; label: string }[] = [
  { value: 'antigo', label: 'Antigo em estoque' },
  { value: 'premiacao', label: 'Com premiação' },
];

export default function StockAdmin() {
  const { user } = useAuth();
  const me = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const company = me.company || '';

  const EMPTY: Form = { model: '', year: '', color: '', price: '', note: '', category: 'antigo', company, active: true };

  const [items, setItems] = useState<StockVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getAllStock(company)); } catch { /* offline */ }
    setLoading(false);
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const handleNew = () => { setForm(EMPTY); setEditingId(null); setError(''); setExtracted(false); setShowForm(true); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) e.target.value = ''; // permite reenviar o mesmo arquivo
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError('Arquivo muito grande (máx. 8MB).'); return; }
    setExtracting(true); setError(''); setExtracted(false);
    if (!showForm) { setForm(EMPTY); setEditingId(null); setShowForm(true); }
    try {
      const base64 = await readFileAsBase64(file);
      const v = await extractVehicleFromFile(base64, file.type || 'image/jpeg');
      setForm(f => ({
        ...f,
        model: v.model || f.model,
        year: v.year || f.year,
        color: v.color || f.color,
        price: v.price || f.price,
        note: v.note || f.note,
      }));
      setExtracted(true);
    } catch {
      setError('Não consegui ler o arquivo. Preencha manualmente ou tente outra foto.');
    }
    setExtracting(false);
  };
  const handleEdit = (v: StockVehicle) => {
    setForm({ model: v.model, year: v.year || '', color: v.color || '', price: v.price || '', note: v.note || '', category: v.category || 'antigo', company: v.company || company, active: v.active });
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
          <h2>Veículos em destaque</h2>
          <p>Cadastre os antigos em estoque e os com premiação pro time priorizar</p>
        </div>
      </div>

      {showForm && (
        <div className="sa-form card">
          <div className="sa-form-header">
            <h3>{editingId ? 'Editar veículo' : 'Novo veículo'}</h3>
            <button className="sa-close" onClick={handleCancel}><X size={16} /></button>
          </div>

          {/* Ler de foto/PDF com IA — preenche os campos pro gestor conferir */}
          <button className="sa-ai-btn" onClick={() => fileRef.current?.click()} disabled={extracting}>
            {extracting
              ? <><RefreshCw size={15} className="sa-spin" /> Lendo o arquivo…</>
              : <><Sparkles size={15} /> Ler de foto ou PDF</>}
          </button>
          {extracted && !extracting && (
            <p className="sa-ai-hint"><Camera size={13} /> Li o arquivo e preenchi abaixo — confira e ajuste antes de salvar.</p>
          )}

          <div className="sa-field">
            <label>Categoria</label>
            <div className="sa-cat-chips">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`sa-cat-chip ${(form.category || 'antigo') === c.value ? 'on' : ''}`}
                  onClick={() => setForm(f => ({ ...f, category: c.value }))}
                >
                  {c.label}
                </button>
              ))}
            </div>
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

      {/* input escondido — usado pelo botão de IA */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {!showForm && (
        <div className="sa-new-actions">
          <button className="btn btn-primary sa-new-btn" onClick={handleNew}>
            <Plus size={15} /> Cadastrar veículo
          </button>
          <button className="btn btn-outline sa-new-btn" onClick={() => fileRef.current?.click()} disabled={extracting}>
            {extracting ? <><RefreshCw size={15} className="sa-spin" /> Lendo…</> : <><Sparkles size={15} /> Ler de foto/PDF</>}
          </button>
        </div>
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
              <div className="sa-item-top">
                <strong>{v.model}</strong>
                <span className={`sa-cat-badge ${v.category === 'premiacao' ? 'premiacao' : 'antigo'}`}>
                  {v.category === 'premiacao' ? 'Premiação' : 'Antigo'}
                </span>
              </div>
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

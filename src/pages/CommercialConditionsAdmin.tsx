import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Plus, Trash2, Save, Edit3, ToggleLeft, ToggleRight,
  X, Link, Check, ChevronDown, ChevronUp, Upload, Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getCommercialConditions, createCommercialCondition,
  updateCommercialCondition, deleteCommercialCondition,
} from '../services/firestore/commercialConditions';
import type { CommercialCondition } from '../services/firestore/commercialConditions';
import { uploadConditionPdf } from '../services/uploadPdf';
import { SEGMENTS } from '../types';
import './CommercialConditionsAdmin.css';

const currentMonth = new Date().toISOString().slice(0, 7); // "2026-05"

function monthLabel(m: string) {
  const [y, mon] = m.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[Number(mon) - 1]}/${y}`;
}

const EMPTY: Omit<CommercialCondition, 'id'> = {
  title: '',
  brand: '',
  type: 'Tabela',
  segment: '',
  month: currentMonth,
  pdfUrl: '',
  description: '',
  highlights: [''],
  active: true,
};

const TYPES = ['Tabela', 'Campanha', 'Financiamento', 'Bonificação', 'Kit', 'Outro'];

export default function CommercialConditionsAdmin() {
  const { user } = useAuth();
  const [conditions, setConditions] = useState<CommercialCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<CommercialCondition, 'id'>>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null); // null = idle
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setConditions(await getCommercialConditions()); } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setError('');
    setShowForm(false);
  };

  const handleEdit = (c: CommercialCondition) => {
    setForm({
      title: c.title,
      brand: c.brand,
      type: c.type,
      segment: c.segment,
      month: c.month,
      pdfUrl: c.pdfUrl,
      description: c.description,
      highlights: c.highlights?.length ? c.highlights : [''],
      active: c.active,
    });
    setEditingId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Selecione um arquivo PDF.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Arquivo muito grande. Limite: 20 MB.');
      return;
    }
    setError('');
    setUploadPct(0);
    try {
      const url = await uploadConditionPdf(file, pct => setUploadPct(pct));
      setForm(f => ({ ...f, pdfUrl: url }));
      setUploadPct(null);
    } catch (err) {
      setError('Erro no upload: ' + (err instanceof Error ? err.message : 'tente novamente'));
      setUploadPct(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Título é obrigatório.');
      return;
    }
    if (form.pdfUrl.trim() && !form.pdfUrl.trim().startsWith('http')) {
      setError('Link do PDF inválido. Use uma URL que comece com https://');
      return;
    }
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        highlights: form.highlights.filter(h => h.trim()),
      };
      if (editingId) {
        await updateCommercialCondition(editingId, payload);
      } else {
        await createCommercialCondition(payload, user.uid);
      }
      await load();
      resetForm();
    } catch {
      setError('Erro ao salvar. Verifique a conexão.');
    }
    setSaving(false);
  };

  const handleToggleActive = async (c: CommercialCondition) => {
    await updateCommercialCondition(c.id, { active: !c.active });
    setConditions(prev => prev.map(x => x.id === c.id ? { ...x, active: !x.active } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir essa condição?')) return;
    await deleteCommercialCondition(id);
    setConditions(prev => prev.filter(c => c.id !== id));
  };

  const setHighlight = (i: number, val: string) => {
    setForm(f => {
      const h = [...f.highlights];
      h[i] = val;
      return { ...f, highlights: h };
    });
  };

  const addHighlight = () => setForm(f => ({ ...f, highlights: [...f.highlights, ''] }));
  const removeHighlight = (i: number) => setForm(f => ({
    ...f,
    highlights: f.highlights.filter((_, idx) => idx !== i),
  }));

  return (
    <div className="cca-page">
      <div className="cca-hero card">
        <FileText size={22} />
        <div>
          <h2>Campanhas e Condições</h2>
          <p>Publique ofertas, tabelas, promoções e PDFs para os vendedores</p>
        </div>
      </div>

      {/* CTA novo */}
      {!showForm && (
        <button className="btn btn-primary cca-new-btn" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nova condição
        </button>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="cca-form card">
          <div className="cca-form-header">
            <h3>{editingId ? 'Editar condição' : 'Nova condição'}</h3>
            <button className="cca-close-btn" onClick={resetForm}><X size={18} /></button>
          </div>

          <div className="cca-fields">
            <div className="cca-field">
              <label>Título *</label>
              <input
                type="text"
                placeholder="Ex: Tabela Maio — Toyota Corolla"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="cca-row">
              <div className="cca-field">
                <label>Marca / Fornecedor</label>
                <input
                  type="text"
                  placeholder="Ex: Toyota"
                  value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                />
              </div>
              <div className="cca-field">
                <label>Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="cca-row">
              <div className="cca-field">
                <label>Mês</label>
                <input
                  type="month"
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                />
              </div>
              <div className="cca-field">
                <label>Segmento</label>
                <select value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value as CommercialCondition['segment'] }))}>
                  <option value="">Todos</option>
                  {SEGMENTS.filter(s => s.value).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cca-field">
              <label>PDF</label>

              {/* Upload direto — recomendado */}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={handleUploadPdf}
              />
              <button
                type="button"
                className="cca-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPct !== null}
              >
                {uploadPct !== null
                  ? <><Loader2 size={15} className="cca-spin" /> Enviando {uploadPct}%...</>
                  : <><Upload size={15} /> Fazer upload do PDF</>
                }
              </button>

              {form.pdfUrl && form.pdfUrl.includes('firebasestorage.googleapis.com') && (
                <span className="cca-hint cca-hint-ok">
                  <Check size={12} /> PDF salvo no Storage — link permanente ✓
                </span>
              )}

              {/* Cole URL externa como alternativa */}
              <details className="cca-url-details">
                <summary>Ou colar URL externa (Google Drive, etc.)</summary>
                <div className="cca-url-row" style={{ marginTop: 8 }}>
                  <Link size={14} className="cca-url-icon" />
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/.../view"
                    value={form.pdfUrl}
                    onChange={e => setForm(f => ({ ...f, pdfUrl: e.target.value }))}
                  />
                  {form.pdfUrl && form.pdfUrl.startsWith('http') && (
                    <a
                      href={form.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cca-test-link"
                      title="Testar link"
                    >
                      Testar
                    </a>
                  )}
                </div>
              </details>

              {form.pdfUrl && !form.pdfUrl.includes('drive.google.com') && !form.pdfUrl.includes('firebasestorage') && form.pdfUrl.startsWith('http') && (
                <span className="cca-hint cca-hint-warn">
                  ⚠️ URL externa pode quebrar. Prefira fazer upload direto.
                </span>
              )}
              {form.pdfUrl && form.pdfUrl.includes('drive.google.com') && !form.pdfUrl.includes('/view') && !form.pdfUrl.includes('uc?') && (
                <span className="cca-hint cca-hint-warn">
                  ⚠️ Use o link de <strong>visualização</strong>: abra o arquivo no Drive → Compartilhar → "Qualquer pessoa com o link" → copie o link de visualização (<code>/view</code>).
                </span>
              )}
              {!form.pdfUrl && (
                <span className="cca-hint">Opcional — Use o link de visualização pública do Google Drive</span>
              )}
            </div>

            <div className="cca-field">
              <label>Descrição resumida</label>
              <textarea
                placeholder="Descreva o que muda nessa condição..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="cca-field">
              <label>Destaques</label>
              {form.highlights.map((h, i) => (
                <div key={i} className="cca-highlight-row">
                  <input
                    type="text"
                    placeholder={`Ex: Taxa 0,99% ao mês`}
                    value={h}
                    onChange={e => setHighlight(i, e.target.value)}
                  />
                  {form.highlights.length > 1 && (
                    <button className="cca-rm-highlight" onClick={() => removeHighlight(i)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button className="cca-add-highlight" onClick={addHighlight}>
                <Plus size={13} /> Adicionar destaque
              </button>
            </div>
          </div>

          {error && <p className="cca-error">{error}</p>}

          <div className="cca-form-actions">
            <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : <><Save size={14} /> Salvar</>}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="cca-loading">Carregando...</div>
      ) : conditions.length === 0 ? (
        <div className="cca-empty card">
          <FileText size={32} />
          <p>Nenhuma condição cadastrada ainda.</p>
        </div>
      ) : (
        <div className="cca-list">
          {conditions.map(c => (
            <div key={c.id} className={`cca-item card ${!c.active ? 'cca-item--inactive' : ''}`}>
              <div className="cca-item-header">
                <div className="cca-item-meta">
                  <span className="cca-item-month">{monthLabel(c.month)}</span>
                  <span className="cca-item-type">{c.type}</span>
                  {c.brand && <span className="cca-item-brand">{c.brand}</span>}
                </div>
                <div className="cca-item-actions">
                  <button
                    className="cca-action-btn"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    title="Expandir"
                  >
                    {expandedId === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button className="cca-action-btn" onClick={() => handleToggleActive(c)} title={c.active ? 'Desativar' : 'Ativar'}>
                    {c.active
                      ? <ToggleRight size={20} style={{ color: 'var(--accent)' }} />
                      : <ToggleLeft size={20} style={{ color: 'var(--text-soft)' }} />}
                  </button>
                  <button className="cca-action-btn" onClick={() => handleEdit(c)} title="Editar">
                    <Edit3 size={16} />
                  </button>
                  <button className="cca-action-btn cca-action-btn--danger" onClick={() => handleDelete(c.id)} title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="cca-item-title">{c.title}</p>

              {expandedId === c.id && (
                <div className="cca-item-expanded">
                  {c.description && <p className="cca-item-desc">{c.description}</p>}
                  {c.highlights?.filter(h => h).length > 0 && (
                    <div className="cca-item-highlights">
                      {c.highlights.filter(h => h).map((h, i) => (
                        <span key={i} className="cca-highlight-chip"><Check size={11} />{h}</span>
                      ))}
                    </div>
                  )}
                  {c.pdfUrl && c.pdfUrl.startsWith('http') ? (
                    <div className="cca-item-link-row">
                      <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" className="cca-item-link">
                        <Link size={13} /> Ver PDF
                      </a>
                      {!c.pdfUrl.includes('/view') && !c.pdfUrl.includes('uc?') && (
                        <span className="cca-link-warn" title="Link pode não ser de visualização pública">⚠️ verificar</span>
                      )}
                    </div>
                  ) : (
                    <span className="cca-item-link cca-item-link--missing">
                      <Link size={13} /> Sem PDF — clique em Editar para adicionar
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Bot, Trash2, Plus, X, Search } from 'lucide-react';
import { getCopyReviews, addCopyReview, removeCopyReview, COPY_TYPE_LABELS } from '../services/copyReview';
import type { CopyReview as CR, CopyType } from '../services/copyReview';
import './CopyReview.css';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function buildPrompt(r: CR): string {
  return [
    `Revise este texto de marketing:`,
    ``,
    `Tipo: ${COPY_TYPE_LABELS[r.type]}`,
    ``,
    `---`,
    r.text,
    `---`,
    ``,
    `Avalie e sugira melhorias em:`,
    `1. Clareza e objetividade`,
    `2. Chamada para ação (CTA)`,
    `3. Tom e linguagem para o público`,
    `4. Pontos que podem ser melhorados`,
  ].join('\n');
}

const TYPES: CopyType[] = ['anuncio', 'legenda', 'email', 'sms', 'outro'];

export default function CopyReview() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<CR[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<CopyType>('anuncio');
  const [text, setText] = useState('');

  const [search, setSearch] = useState('');

  const refresh = () => setReviews(getCopyReviews());
  useEffect(() => { refresh(); }, []);

  const reset = () => { setText(''); setType('anuncio'); setShowForm(false); };

  const filtered = search.trim()
    ? reviews.filter(r => r.text.toLowerCase().includes(search.toLowerCase()) || COPY_TYPE_LABELS[r.type].toLowerCase().includes(search.toLowerCase()))
    : reviews;

  const handleSave = () => {
    if (!text.trim()) return;
    const entry = addCopyReview({ type, text: text.trim(), date: todayStr() });
    reset();
    refresh();
    navigate('/ia-coach', { state: { prefill: buildPrompt(entry), aiMode: 'marketing' } });
  };

  const handleRemove = (id: string) => {
    if (confirm('Remover esta revisão?')) { removeCopyReview(id); refresh(); }
  };

  return (
    <div className="cv-page">

      {/* Hero */}
      <div className="cv-header card">
        <FileEdit size={22} />
        <div className="cv-header-text">
          <h2>Revisar Copy</h2>
          <p>Cole um texto e a IA avalia e melhora</p>
        </div>
        <button className="cv-header-add" onClick={() => setShowForm(s => !s)} title="Nova revisão">
          {showForm ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="cv-form-card card">

          {/* Type chips */}
          <div className="cv-type-row">
            {TYPES.map(t => (
              <button
                key={t}
                className={`cv-type-chip${type === t ? ' cv-type-chip--active' : ''}`}
                onClick={() => setType(t)}
              >
                {COPY_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <textarea
            className="cv-input-text"
            rows={6}
            placeholder="Cole aqui o texto para revisar..."
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
          />

          <div className="cv-form-actions">
            <button className="cv-btn-cancel" onClick={reset}>Cancelar</button>
            <button className="cv-btn-save" onClick={handleSave} disabled={!text.trim()}>
              <Bot size={15} /> Salvar e revisar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {reviews.length > 2 && !showForm && (
        <div className="cv-search">
          <Search size={14} className="cv-search-icon" />
          <input
            type="text"
            placeholder="Buscar revisões..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="cv-search-clear" onClick={() => setSearch('')}><X size={13} /></button>}
        </div>
      )}

      {/* Empty */}
      {reviews.length === 0 && !showForm && (
        <div className="cv-empty card">
          <div className="cv-empty-icon"><FileEdit size={28} /></div>
          <h3>Nenhuma revisão registrada</h3>
          <p>Cole um anúncio, legenda ou e-mail e a IA avalia e sugere melhorias.</p>
          <button className="cv-empty-btn" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Nova revisão
          </button>
        </div>
      )}

      {/* History */}
      {filtered.length === 0 && reviews.length > 0 && search && (
        <div className="cv-empty card" style={{ padding: '24px' }}>
          <p style={{ margin: 0, fontSize: 14 }}>Nenhuma revisão encontrada para "<strong>{search}</strong>".</p>
        </div>
      )}
      {filtered.map(r => (
        <div key={r.id} className="cv-item card">
          <div className="cv-item-header">
            <span className="cv-item-type-chip">{COPY_TYPE_LABELS[r.type]}</span>
            <span className="cv-item-date">{fmtDate(r.date)}</span>
          </div>
          <p className="cv-item-text">{r.text}</p>
          <div className="cv-item-actions">
            <button className="cv-btn-delete" onClick={() => handleRemove(r.id)}><Trash2 size={14} /></button>
            <button className="cv-btn-analyze" onClick={() => navigate('/ia-coach', { state: { prefill: buildPrompt(r), aiMode: 'marketing' } })}>
              <Bot size={13} /> Revisar com IA
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

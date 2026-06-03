import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Bot, Trash2, Plus, Camera, X, Search } from 'lucide-react';
import { getCampaignReviews, addCampaignReview, removeCampaignReview } from '../services/campaignReview';
import type { CampaignReview as CR } from '../services/campaignReview';
import './CampaignReview.css';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function buildPrompt(r: CR): string {
  return [
    `Analise esta campanha de marketing e extraia aprendizados:`,
    ``,
    `📢 Campanha: ${r.name} — ${fmtDate(r.date)}`,
    ``,
    r.notes,
    ``,
    `Por favor:`,
    `1. Liste os 3 principais aprendizados`,
    `2. O que replicar na próxima campanha`,
    `3. O que corrigir ou evitar`,
    `4. Uma sugestão prática de melhoria`,
  ].join('\n');
}

// Resize image to max 600px and return base64
function resizeImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 600;
      let { width, height } = img;
      if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = url;
  });
}

export default function CampaignReview() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [reviews, setReviews] = useState<CR[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();

  const [search, setSearch] = useState('');

  const refresh = () => setReviews(getCampaignReviews());
  useEffect(() => { refresh(); }, []);

  const reset = () => { setName(''); setNotes(''); setPhoto(undefined); setShowForm(false); };

  const filtered = search.trim()
    ? reviews.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.notes.toLowerCase().includes(search.toLowerCase()))
    : reviews;

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await resizeImage(file);
    setPhoto(b64);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const entry = addCampaignReview({ name: name.trim(), notes: notes.trim(), date: todayStr(), photo });
    reset();
    refresh();
    navigate('/ia-coach', { state: { prefill: buildPrompt(entry), aiMode: 'marketing' } });
  };

  const handleRemove = (id: string) => {
    if (confirm('Remover esta campanha?')) { removeCampaignReview(id); refresh(); }
  };

  return (
    <div className="cr-page">

      {/* Hero */}
      <div className="cr-header card">
        <BarChart2 size={22} />
        <div className="cr-header-text">
          <h2>Pós-campanha</h2>
          <p>Registre e aprenda com cada ação</p>
        </div>
        <button className="cr-header-add" onClick={() => { setShowForm(s => !s); }} title="Nova campanha">
          {showForm ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="cr-form-card card">

          <input
            className="cr-input-name"
            type="text"
            placeholder="Nome da campanha *"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />

          <textarea
            className="cr-input-notes"
            rows={4}
            placeholder="Descreva em poucas frases: o que foi a campanha, o que funcionou, o que não funcionou, e os números (alcance, leads, vendas…)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          {/* Photo area */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          {photo ? (
            <div className="cr-photo-preview">
              <img src={photo} alt="preview" />
              <button className="cr-photo-remove" onClick={() => setPhoto(undefined)}><X size={14} /></button>
            </div>
          ) : (
            <button className="cr-photo-btn" onClick={() => fileRef.current?.click()}>
              <Camera size={16} /> Anexar foto (métricas, print, resultado...)
            </button>
          )}

          <div className="cr-form-actions">
            <button className="cr-btn-cancel" onClick={reset}>Cancelar</button>
            <button className="cr-btn-save" onClick={handleSave} disabled={!name.trim()}>
              <Bot size={15} /> Salvar e analisar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {reviews.length > 2 && !showForm && (
        <div className="cr-search">
          <Search size={14} className="cr-search-icon" />
          <input
            type="text"
            placeholder="Buscar campanhas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="cr-search-clear" onClick={() => setSearch('')}><X size={13} /></button>}
        </div>
      )}

      {/* Empty */}
      {reviews.length === 0 && !showForm && (
        <div className="cr-empty card">
          <div className="cr-empty-icon"><BarChart2 size={28} /></div>
          <h3>Nenhuma campanha registrada</h3>
          <p>Registre sua primeira campanha e a IA extrai os aprendizados para você.</p>
          <button className="cr-empty-btn" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Registrar campanha
          </button>
        </div>
      )}

      {/* History */}
      {filtered.length === 0 && reviews.length > 0 && search && (
        <div className="cr-empty card" style={{ padding: '24px' }}>
          <p style={{ margin: 0, fontSize: 14 }}>Nenhuma campanha encontrada para "<strong>{search}</strong>".</p>
        </div>
      )}
      {filtered.map(r => (
        <div key={r.id} className="cr-item card">

          {r.photo && <img className="cr-item-photo" src={r.photo} alt="" />}
          <div className="cr-item-title">{r.name}</div>
          <div className="cr-item-date">{fmtDate(r.date)}</div>
          {r.notes && <p className="cr-item-notes">{r.notes}</p>}
          <div className="cr-item-actions">
            <button className="cr-btn-delete" onClick={() => handleRemove(r.id)}><Trash2 size={14} /></button>
            <button className="cr-btn-analyze" onClick={() => navigate('/ia-coach', { state: { prefill: buildPrompt(r), aiMode: 'marketing' } })}>
              <Bot size={13} /> Analisar com IA
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

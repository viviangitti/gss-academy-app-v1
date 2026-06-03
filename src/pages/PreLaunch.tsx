import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Bot, Trash2, Plus, X, Search } from 'lucide-react';
import { getPreLaunches, addPreLaunch, removePreLaunch } from '../services/preLaunch';
import type { PreLaunch as PL } from '../services/preLaunch';
import './PreLaunch.css';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function buildPrompt(r: PL): string {
  return [
    `Vou lançar uma campanha. Aqui está o briefing inicial:`,
    ``,
    `📢 Campanha: ${r.name}`,
    ``,
    r.brief,
    ``,
    `Com base nisso:`,
    `1. Faça as perguntas que preciso responder antes de publicar (público-alvo, objetivo, canais, CTA, prazo, verba, riscos)`,
    `2. Aponte o que está bem definido e o que está vago`,
    `3. Sugira ajustes para tornar a campanha mais eficaz`,
  ].join('\n');
}

export default function PreLaunch() {
  const navigate = useNavigate();
  const [launches, setLaunches] = useState<PL[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [brief, setBrief] = useState('');

  const [search, setSearch] = useState('');

  const refresh = () => setLaunches(getPreLaunches());
  useEffect(() => { refresh(); }, []);

  const reset = () => { setName(''); setBrief(''); setShowForm(false); };

  const filtered = search.trim()
    ? launches.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.brief.toLowerCase().includes(search.toLowerCase()))
    : launches;

  const handleSave = () => {
    if (!name.trim()) return;
    const entry = addPreLaunch({ name: name.trim(), brief: brief.trim(), date: todayStr() });
    reset();
    refresh();
    navigate('/ia-coach', { state: { prefill: buildPrompt(entry), aiMode: 'marketing' } });
  };

  const handleRemove = (id: string) => {
    if (confirm('Remover este briefing?')) { removePreLaunch(id); refresh(); }
  };

  return (
    <div className="pl-page">

      {/* Hero */}
      <div className="pl-header card">
        <Rocket size={22} />
        <div className="pl-header-text">
          <h2>Pré-lançamento</h2>
          <p>Prepare sua campanha antes de publicar</p>
        </div>
        <button className="pl-header-add" onClick={() => setShowForm(s => !s)} title="Nova campanha">
          {showForm ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="pl-form-card card">

          <input
            className="pl-input-name"
            type="text"
            placeholder="Nome da campanha *"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />

          <textarea
            className="pl-input-brief"
            rows={4}
            placeholder="Descreva a campanha: objetivo, público, canais, prazo, verba..."
            value={brief}
            onChange={e => setBrief(e.target.value)}
          />

          <div className="pl-form-actions">
            <button className="pl-btn-cancel" onClick={reset}>Cancelar</button>
            <button className="pl-btn-save" onClick={handleSave} disabled={!name.trim()}>
              <Bot size={15} /> Salvar e planejar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {launches.length > 2 && !showForm && (
        <div className="pl-search">
          <Search size={14} className="pl-search-icon" />
          <input
            type="text"
            placeholder="Buscar campanhas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="pl-search-clear" onClick={() => setSearch('')}><X size={13} /></button>}
        </div>
      )}

      {/* Empty */}
      {launches.length === 0 && !showForm && (
        <div className="pl-empty card">
          <div className="pl-empty-icon"><Rocket size={28} /></div>
          <h3>Nenhuma campanha registrada</h3>
          <p>Registre sua campanha e a IA faz as perguntas certas antes de publicar.</p>
          <button className="pl-empty-btn" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Nova campanha
          </button>
        </div>
      )}

      {/* History */}
      {filtered.length === 0 && launches.length > 0 && search && (
        <div className="pl-empty card" style={{ padding: '24px' }}>
          <p style={{ margin: 0, fontSize: 14 }}>Nenhuma campanha encontrada para "<strong>{search}</strong>".</p>
        </div>
      )}
      {filtered.map(r => (
        <div key={r.id} className="pl-item card">
          <div className="pl-item-title">{r.name}</div>
          <div className="pl-item-date">{fmtDate(r.date)}</div>
          {r.brief && <p className="pl-item-brief">{r.brief}</p>}
          <div className="pl-item-actions">
            <button className="pl-btn-delete" onClick={() => handleRemove(r.id)}><Trash2 size={14} /></button>
            <button className="pl-btn-analyze" onClick={() => navigate('/ia-coach', { state: { prefill: buildPrompt(r), aiMode: 'marketing' } })}>
              <Bot size={13} /> Planejar com IA
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

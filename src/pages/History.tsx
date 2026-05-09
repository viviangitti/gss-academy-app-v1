import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Wand2, Mic, Swords, Trash2, Clock, Search } from 'lucide-react';
import { getAllHistory, removeHistory, clearHistory } from '../services/history';
import type { HistoryEntry, HistoryType } from '../services/history';
import './History.css';

const TYPE_CONFIG: Record<HistoryType, { label: string; icon: React.ComponentType<{ size?: number }>; color: string; route: string }> = {
  message_review: { label: 'Mensagem', icon: Wand2, color: '#10b981', route: '/coach-mensagem' },
  meeting_analysis: { label: 'Pós-reunião', icon: Mic, color: '#ef4444', route: '/analise-reuniao' },
  simulator_session: { label: 'Simulador', icon: Swords, color: '#8b5cf6', route: '/treino' },
};

const FILTERS: { value: HistoryType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'message_review', label: 'Mensagens' },
  { value: 'meeting_analysis', label: 'Reuniões' },
  { value: 'simulator_session', label: 'Simulador' },
];

function formatDate(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - ts;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return 'Agora há pouco';
  if (diffHours < 24) return `Há ${Math.floor(diffHours)}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function History() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<HistoryType | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setEntries(getAllHistory());
  }, []);

  const handleDelete = (id: string) => {
    removeHistory(id);
    setEntries(getAllHistory());
  };

  const handleClearAll = () => {
    if (confirm('Apagar todo o histórico? Essa ação não pode ser desfeita.')) {
      clearHistory();
      setEntries([]);
    }
  };

  const handleOpen = (entry: HistoryEntry) => {
    const cfg = TYPE_CONFIG[entry.type];
    // Salvar no sessionStorage para a feature abrir com o dado
    sessionStorage.setItem('gss_history_open', JSON.stringify(entry));
    navigate(cfg.route);
  };

  const filtered = entries
    .filter(e => filter === 'all' || e.type === filter)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.preview?.toLowerCase().includes(search.toLowerCase()));

  if (entries.length === 0) {
    return (
      <div className="history-page">
        <div className="history-empty card">
          <HistoryIcon size={40} />
          <h3>Sem histórico ainda</h3>
          <p>Tudo que você fizer com a IA (revisar mensagens, analisar reuniões, treinar no simulador) vai aparecer aqui automaticamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-filters">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`history-chip ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="search-bar">
        <Search size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar no histórico..."
        />
      </div>

      <div className="history-list">
        {filtered.map(entry => {
          const cfg = TYPE_CONFIG[entry.type];
          const Icon = cfg.icon;
          return (
            <div key={entry.id} className="history-item card" onClick={() => handleOpen(entry)}>
              <div className="history-icon" style={{ background: `${cfg.color}15`, color: cfg.color }}>
                <Icon size={18} />
              </div>
              <div className="history-body">
                <div className="history-head">
                  <span className="history-type">{cfg.label}</span>
                  <span className="history-date"><Clock size={11} /> {formatDate(entry.createdAt)}</span>
                </div>
                <h4>{entry.title}</h4>
                {entry.subtitle && <span className="history-subtitle">{entry.subtitle}</span>}
                {entry.preview && <p className="history-preview">{entry.preview}</p>}
              </div>
              <button
                className="history-delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {entries.length > 0 && (
        <button className="btn btn-outline history-clear" onClick={handleClearAll}>
          <Trash2 size={14} /> Limpar tudo
        </button>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle, Clock, Layers } from 'lucide-react';
import { fetchRawNews } from '../services/news';
import {
  saveSegmentNews, deleteOldSegmentNews,
  newsItemsToSegmentDocs, getSegmentNewsRefreshedAt,
} from '../services/firestore/segmentNews';
import { loadData, KEYS } from '../services/storage';
import { SEGMENTS } from '../types';
import type { UserProfile, Segment } from '../types';
import type { NewsCategory } from '../services/news';
import './NewsAdmin.css';

const CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: 'tudo',        label: 'Tudo' },
  { value: 'lancamentos', label: 'Lançamentos' },
  { value: 'mercado',     label: 'Tendências / Mercado' },
];

const GEO_OPTIONS: { value: 'brasil' | 'mundo'; label: string }[] = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'mundo',  label: 'Mundo' },
];

/** Segmentos reais (sem o item vazio) */
const REAL_SEGMENTS = SEGMENTS.filter(s => s.value !== '');

type ItemStatus = 'wait' | 'busy' | 'ok' | 'fail';

interface AllStatus {
  segment: string;
  label: string;
  status: ItemStatus;
  count?: number;
  error?: string;
}

function formatTs(ts: number | null): string {
  if (!ts) return 'nunca atualizado';
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function NewsAdmin() {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });

  const [segment, setSegment] = useState<Segment>(
    profile.segment ? (profile.segment as Segment) : 'farmaceutico',
  );
  const [category, setCategory] = useState<NewsCategory>('tudo');
  const [geo, setGeo] = useState<'brasil' | 'mundo'>('brasil');

  const [loading, setLoading]   = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [resultError, setResultError] = useState('');
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);
  const [loadingTs, setLoadingTs] = useState(false);

  // "Atualizar Todos"
  const [runningAll, setRunningAll] = useState(false);
  const [allStatuses, setAllStatuses] = useState<AllStatus[]>([]);

  // Carrega refreshedAt ao mudar seleção
  useEffect(() => {
    let cancelled = false;
    setLoadingTs(true);
    getSegmentNewsRefreshedAt(segment, category, geo).then(ts => {
      if (!cancelled) { setRefreshedAt(ts); setLoadingTs(false); }
    });
    return () => { cancelled = true; };
  }, [segment, category, geo]);

  async function handleUpdate() {
    setLoading(true);
    setResultMsg('');
    setResultError('');
    setResultCount(null);
    try {
      // Busca via RSS/Google News (force = ignora cache)
      const items = await fetchRawNews(segment, category, geo);
      if (items.length === 0) {
        setResultError('Nenhuma notícia encontrada via RSS/Google News.');
        setLoading(false);
        return;
      }
      const docs = newsItemsToSegmentDocs(items, segment, category, geo);
      await deleteOldSegmentNews(segment, category, geo);
      await saveSegmentNews(docs);

      setResultCount(docs.length);
      setResultMsg(`${docs.length} notícias salvas com sucesso!`);
      setRefreshedAt(Date.now());
    } catch (e) {
      setResultError(e instanceof Error ? e.message : 'Erro ao salvar notícias.');
    }
    setLoading(false);
  }

  async function handleUpdateAll() {
    setRunningAll(true);
    setResultMsg('');
    setResultError('');
    setResultCount(null);

    const initialStatuses: AllStatus[] = REAL_SEGMENTS.map(s => ({
      segment: s.value,
      label: s.label,
      status: 'wait',
    }));
    setAllStatuses(initialStatuses);

    for (let i = 0; i < REAL_SEGMENTS.length; i++) {
      const seg = REAL_SEGMENTS[i];
      setAllStatuses(prev =>
        prev.map((s, idx) => idx === i ? { ...s, status: 'busy' } : s),
      );
      try {
        const items = await fetchRawNews(seg.value, category, geo);
        if (items.length > 0) {
          const docs = newsItemsToSegmentDocs(items, seg.value, category, geo);
          await deleteOldSegmentNews(seg.value, category, geo);
          await saveSegmentNews(docs);
          setAllStatuses(prev =>
            prev.map((s, idx) => idx === i ? { ...s, status: 'ok', count: docs.length } : s),
          );
        } else {
          setAllStatuses(prev =>
            prev.map((s, idx) => idx === i ? { ...s, status: 'ok', count: 0 } : s),
          );
        }
      } catch (e) {
        setAllStatuses(prev =>
          prev.map((s, idx) => idx === i
            ? { ...s, status: 'fail', error: e instanceof Error ? e.message : 'Erro' }
            : s,
          ),
        );
      }
    }
    setRunningAll(false);
  }

  const busy = loading || runningAll;

  // Guard: só admin (depois dos hooks para respeitar Rules of Hooks)
  if (!profile.isAdmin) return null;

  return (
    <div className="na-page">
      {/* Hero */}
      <div className="na-hero card">
        <Database size={28} />
        <div>
          <h2>Central de Notícias</h2>
          <p>Admin: atualiza o banco do Firestore uma vez, todos os usuários leem automaticamente.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="na-controls card">
        <h3>Configurar atualização</h3>

        <div className="na-row">
          <div className="na-field">
            <label>Segmento</label>
            <select
              value={segment}
              onChange={e => setSegment(e.target.value as Segment)}
              disabled={busy}
            >
              {REAL_SEGMENTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="na-field">
            <label>Categoria</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as NewsCategory)}
              disabled={busy}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="na-field">
          <label>Geo</label>
          <select
            value={geo}
            onChange={e => setGeo(e.target.value as 'brasil' | 'mundo')}
            disabled={busy}
          >
            {GEO_OPTIONS.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        {/* Último update */}
        <div className="na-refreshed">
          <Clock size={12} />
          {loadingTs ? 'Verificando…' : `Último update: ${formatTs(refreshedAt)}`}
        </div>

        <hr className="na-divider" />

        <div className="na-actions">
          <button
            className="na-btn-primary"
            onClick={handleUpdate}
            disabled={busy}
          >
            {loading
              ? <><RefreshCw size={16} className="spinning" /> Buscando e salvando…</>
              : <><RefreshCw size={16} /> Atualizar seleção</>
            }
          </button>

          <button
            className="na-btn-secondary"
            onClick={handleUpdateAll}
            disabled={busy}
          >
            {runningAll
              ? <><Layers size={16} className="spinning" /> Atualizando todos…</>
              : <><Layers size={16} /> Atualizar Todos os Segmentos</>
            }
          </button>
        </div>
      </div>

      {/* Resultado da atualização individual */}
      {(resultMsg || resultError) && (
        <div className="na-result card">
          {resultMsg && (
            <div className="na-result-success">
              <CheckCircle size={18} />
              {resultMsg}
            </div>
          )}
          {resultError && (
            <div className="na-result-error">
              <AlertCircle size={18} />
              {resultError}
            </div>
          )}
          {resultCount !== null && resultCount > 0 && (
            <p className="na-result-info">
              {resultCount} notícias salvas para <strong>{SEGMENTS.find(s => s.value === segment)?.label}</strong> — {category} / {geo}
            </p>
          )}
        </div>
      )}

      {/* Resultado do "Atualizar Todos" */}
      {allStatuses.length > 0 && (
        <div className="na-controls card">
          <h3>Progresso — {CATEGORIES.find(c => c.value === category)?.label} / {geo}</h3>
          <div className="na-all-list">
            {allStatuses.map(s => (
              <div
                key={s.segment}
                className={`na-all-item ${s.status === 'ok' ? 'done' : s.status === 'fail' ? 'error' : s.status === 'busy' ? 'active' : ''}`}
              >
                <span>{s.label}</span>
                <span className={`na-all-status ${s.status === 'ok' ? 'ok' : s.status === 'fail' ? 'fail' : s.status === 'busy' ? 'busy' : 'wait'}`}>
                  {s.status === 'wait' && 'Aguardando'}
                  {s.status === 'busy' && <><RefreshCw size={12} className="spinning" /> Buscando…</>}
                  {s.status === 'ok'   && `${s.count ?? 0} notícias`}
                  {s.status === 'fail' && `Erro: ${s.error}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

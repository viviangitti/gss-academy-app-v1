import { useState, useEffect, useCallback } from 'react';
import {
  Swords, Plus, Trash2, Save, Edit3, RefreshCw, ToggleLeft,
  ToggleRight, X, Globe, Sparkles, AlertTriangle, Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllCompetitorOffers, createCompetitorOffer,
  updateCompetitorOffer, deleteCompetitorOffer,
} from '../services/firestore/competitorOffers';
import { extractOffersFromUrl, searchCompetitorOffers, TOYOTA_COMPETITORS } from '../services/competitorScraper';
import type { ScrapedOffer } from '../services/competitorScraper';
import { SEGMENTS, PRICE_RANGES } from '../types';
import type { CompetitorOffer, Segment, PriceRange } from '../types';
import './CompetitorAdmin.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const today = new Date().toISOString().split('T')[0];
const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  .toISOString().split('T')[0];

const EMPTY_FORM: Omit<CompetitorOffer, 'id'> = {
  competitor: '',
  title: '',
  description: '',
  legalText: '',
  sourceUrl: '',
  highlights: [''],
  ourAdvantages: [''],
  validFrom: today,
  validTo: endOfMonth,
  segments: [],
  priceRanges: [],
  active: true,
};

export default function CompetitorAdmin() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<CompetitorOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<CompetitorOffer, 'id'>>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // URL importer state
  const [importUrl, setImportUrl] = useState('');
  const [importCompetitor, setImportCompetitor] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedOffers, setImportedOffers] = useState<ScrapedOffer[]>([]);
  const [savedFlags, setSavedFlags] = useState<boolean[]>([]);

  // Auto-scan state
  interface ScanResult {
    competitor: string;
    offers: ScrapedOffer[];
    savedFlags: boolean[];
    error: string;
    done: boolean;
  }
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    TOYOTA_COMPETITORS.map(c => c.id),
  );
  // Marcas personalizadas adicionadas pelo usuário (ex: BMW, Mercedes, Porsche) — persistidas
  const [customBrands, setCustomBrands] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('gss_custom_competitors') || '[]'); } catch { return []; }
  });
  const [newBrand, setNewBrand] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanCurrent, setScanCurrent] = useState('');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanDone, setScanDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setOffers(await getAllCompetitorOffers()); } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── URL import ──────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importUrl.trim() || !importCompetitor.trim()) {
      setImportError('Informe o nome da marca e a URL da página de ofertas.');
      return;
    }
    setImporting(true);
    setImportError('');
    setImportedOffers([]);
    setSavedFlags([]);
    try {
      const results = await extractOffersFromUrl(importUrl.trim(), importCompetitor.trim(), API_KEY);
      if (results.length === 0) {
        setImportError('A IA não encontrou ofertas nesta página. Tente outra URL ou cadastre manualmente.');
      } else {
        setImportedOffers(results);
        setSavedFlags(new Array(results.length).fill(false));
      }
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : 'Erro desconhecido ao importar.');
    }
    setImporting(false);
  };

  // ── Auto scan ───────────────────────────────────────────────────────────────
  const toggleBrand = (id: string) => {
    setSelectedBrands(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id],
    );
  };

  const persistCustom = (list: string[]) => {
    setCustomBrands(list);
    localStorage.setItem('gss_custom_competitors', JSON.stringify(list));
  };

  const addCustomBrand = () => {
    const name = newBrand.trim();
    if (!name) return;
    // evita duplicar (case-insensitive) com fixas ou já adicionadas
    const exists = [...TOYOTA_COMPETITORS.map(c => c.label), ...customBrands]
      .some(b => b.toLowerCase() === name.toLowerCase());
    if (!exists) {
      persistCustom([...customBrands, name]);
      setSelectedBrands(prev => [...prev, 'custom:' + name]); // já entra selecionada
    }
    setNewBrand('');
  };

  const removeCustomBrand = (name: string) => {
    persistCustom(customBrands.filter(b => b !== name));
    setSelectedBrands(prev => prev.filter(id => id !== 'custom:' + name));
  };

  const handleAutoScan = async () => {
    if (selectedBrands.length === 0) return;
    setScanning(true);
    setScanResults([]);
    setScanDone(false);

    const fixedLabels = TOYOTA_COMPETITORS
      .filter(c => selectedBrands.includes(c.id))
      .map(c => c.label);
    const customLabels = customBrands.filter(b => selectedBrands.includes('custom:' + b));
    const brands = [...fixedLabels, ...customLabels].map(label => ({ label }));
    const results: ScanResult[] = [];

    for (const brand of brands) {
      setScanCurrent(brand.label);
      let offers: ScrapedOffer[] = [];
      let error = '';
      try {
        offers = await searchCompetitorOffers(brand.label, API_KEY);
      } catch (e: unknown) {
        error = e instanceof Error ? e.message : 'Erro desconhecido';
      }
      results.push({
        competitor: brand.label,
        offers,
        savedFlags: new Array(offers.length).fill(false),
        error,
        done: true,
      });
      setScanResults([...results]);
    }

    setScanCurrent('');
    setScanDone(true);
    setScanning(false);
  };

  const handleSaveScanOffer = async (resultIdx: number, offerIdx: number) => {
    const r = scanResults[resultIdx];
    const o = r.offers[offerIdx];
    const offer: Omit<CompetitorOffer, 'id'> = {
      competitor: r.competitor,
      title: o.title,
      description: o.description,
      highlights: o.highlights.filter(Boolean),
      legalText: o.legalText || '',
      sourceUrl: '',
      ourAdvantages: [],
      validFrom: o.validFrom || today,
      validTo: o.validTo || endOfMonth,
      segments: [],
      active: true,
    };
    try {
      await createCompetitorOffer(offer, user?.uid || '');
      setScanResults(prev => prev.map((res, ri) => {
        if (ri !== resultIdx) return res;
        const flags = [...res.savedFlags];
        flags[offerIdx] = true;
        return { ...res, savedFlags: flags };
      }));
      await load();
    } catch {
      // silent
    }
  };

  const handleSaveAllFromScan = async (resultIdx: number) => {
    const r = scanResults[resultIdx];
    for (let i = 0; i < r.offers.length; i++) {
      if (!r.savedFlags[i]) await handleSaveScanOffer(resultIdx, i);
    }
  };

  const handleSaveImported = async (idx: number) => {
    const o = importedOffers[idx];
    const offer: Omit<CompetitorOffer, 'id'> = {
      competitor: importCompetitor.trim(),
      title: o.title,
      description: o.description,
      highlights: o.highlights.filter(Boolean),
      legalText: o.legalText || '',
      sourceUrl: importUrl.trim(),
      ourAdvantages: [],
      validFrom: o.validFrom || today,
      validTo: o.validTo || endOfMonth,
      segments: [],
      active: true,
    };
    try {
      await createCompetitorOffer(offer, user?.uid || '');
      setSavedFlags(prev => prev.map((v, i) => (i === idx ? true : v)));
      await load();
    } catch {
      setImportError('Erro ao salvar. Verifique sua conexão.');
    }
  };

  const handleEditImported = (o: ScrapedOffer) => {
    setForm({
      ...EMPTY_FORM,
      competitor: importCompetitor.trim(),
      title: o.title,
      description: o.description,
      highlights: o.highlights.length ? o.highlights : [''],
      legalText: o.legalText || '',
      sourceUrl: importUrl.trim(),
      validFrom: o.validFrom || today,
      validTo: o.validTo || endOfMonth,
    });
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Manual CRUD ─────────────────────────────────────────────────────────────
  const handleEdit = (o: CompetitorOffer) => {
    setForm({ ...o });
    setEditingId(o.id!);
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNew = () => {
    setForm({ ...EMPTY_FORM });
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
    if (!form.competitor.trim() || !form.title.trim() || !form.validTo) {
      setError('Preencha concorrente, título e validade.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const clean = {
        ...form,
        highlights: form.highlights.filter(h => h.trim()),
        ourAdvantages: form.ourAdvantages.filter(h => h.trim()),
      };
      if (editingId) {
        await updateCompetitorOffer(editingId, clean);
      } else {
        await createCompetitorOffer(clean, user?.uid || '');
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
    if (!confirm(`Excluir "${title}"? Não pode ser desfeito.`)) return;
    await deleteCompetitorOffer(id);
    await load();
  };

  const handleToggle = async (o: CompetitorOffer) => {
    await updateCompetitorOffer(o.id!, { active: !o.active });
    await load();
  };

  // helpers for list fields
  const updArr = (field: 'highlights' | 'ourAdvantages', i: number, v: string) =>
    setForm(f => ({ ...f, [field]: f[field].map((x, idx) => idx === i ? v : x) }));
  const addArr = (field: 'highlights' | 'ourAdvantages') =>
    setForm(f => ({ ...f, [field]: [...f[field], ''] }));
  const remArr = (field: 'highlights' | 'ourAdvantages', i: number) =>
    setForm(f => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }));

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
    <div className="ca-page">
      {/* Hero */}
      <div className="ca-hero card">
        <Swords size={22} />
        <div>
          <h2>Concorrência</h2>
          <p>Importe ofertas dos sites da concorrência com IA</p>
        </div>
      </div>

      {/* ── Auto Scan ── */}
      <div className="ca-import card">
        <div className="ca-import-title">
          <Sparkles size={15} /> <strong>Scan automático com IA + Google</strong>
        </div>
        <p className="ca-import-hint">
          Selecione as marcas e a IA pesquisa as ofertas atuais no Google — sem precisar de URL.
        </p>
        <div className="ca-brand-chips">
          {TOYOTA_COMPETITORS.map(c => (
            <button
              key={c.id}
              type="button"
              className={`ca-brand-chip ${selectedBrands.includes(c.id) ? 'active' : ''}`}
              onClick={() => toggleBrand(c.id)}
              disabled={scanning}
            >
              {c.label}
            </button>
          ))}
          {customBrands.map(b => (
            <span key={b} className={`ca-brand-chip ca-brand-custom ${selectedBrands.includes('custom:' + b) ? 'active' : ''}`}>
              <button type="button" className="ca-brand-custom-label" onClick={() => toggleBrand('custom:' + b)} disabled={scanning}>
                {b}
              </button>
              <button type="button" className="ca-brand-custom-x" onClick={() => removeCustomBrand(b)} disabled={scanning} aria-label={`Remover ${b}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        {/* Adicionar marca personalizada (ex: BMW, Mercedes, Porsche) */}
        <div className="ca-add-brand">
          <input
            type="text"
            placeholder="Outra marca (ex: BMW, Mercedes, Porsche...)"
            value={newBrand}
            onChange={e => setNewBrand(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomBrand()}
            disabled={scanning}
          />
          <button type="button" className="ca-add-brand-btn" onClick={addCustomBrand} disabled={!newBrand.trim() || scanning}>
            <Plus size={16} /> Adicionar
          </button>
        </div>

        {scanning && (
          <div className="ca-scan-progress">
            <RefreshCw size={14} className="ca-spin" />
            <span>Buscando: <strong>{scanCurrent}</strong>…</span>
          </div>
        )}

        {!scanning && (
          <button
            className="btn btn-primary ca-import-btn"
            onClick={handleAutoScan}
            disabled={selectedBrands.length === 0}
          >
            <Sparkles size={15} /> Buscar ofertas das marcas selecionadas
          </button>
        )}

        {/* Scan results */}
        {scanResults.map((r, ri) => (
          <div key={ri} className="ca-scan-result">
            <div className="ca-scan-result-header">
              <strong>{r.competitor}</strong>
              {r.error ? (
                <span className="ca-scan-error"><AlertTriangle size={12} /> {r.error}</span>
              ) : (
                <span className="ca-scan-count">{r.offers.length} oferta(s)</span>
              )}
              {r.offers.length > 0 && (
                <button className="ca-btn-save-all" onClick={() => handleSaveAllFromScan(ri)}>
                  <Save size={11} /> Salvar todas
                </button>
              )}
            </div>
            {r.offers.map((o, oi) => (
              <div key={oi} className={`ca-extracted-item ${r.savedFlags[oi] ? 'saved' : ''}`}>
                <div className="ca-extracted-header">
                  <strong>{o.title}</strong>
                  {r.savedFlags[oi] && <span className="ca-saved-badge"><Check size={11} /> Salvo</span>}
                </div>
                {o.description && <p className="ca-extracted-desc">{o.description.slice(0, 100)}…</p>}
                {o.highlights.length > 0 && (
                  <div className="ca-extracted-chips">
                    {o.highlights.slice(0, 3).map((h, i) => (
                      <span key={i} className="ca-chip-red">{h}</span>
                    ))}
                  </div>
                )}
                {!r.savedFlags[oi] && (
                  <button className="ca-btn-save" onClick={() => handleSaveScanOffer(ri, oi)}>
                    <Save size={12} /> Salvar
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}

        {scanDone && (
          <p className="ca-scan-done">
            ✅ Scan concluído — {scanResults.reduce((s, r) => s + r.offers.length, 0)} ofertas encontradas.
          </p>
        )}
      </div>

      {/* ── URL Importer ── */}
      <div className="ca-import card">
        <div className="ca-import-title">
          <Globe size={15} /> <strong>Importar da web com IA</strong>
        </div>
        <p className="ca-import-hint">
          Cole a URL da página de ofertas do concorrente. A IA vai ler a página e extrair as ofertas automaticamente.
        </p>
        <div className="ca-import-fields">
          <input
            className="ca-input"
            value={importCompetitor}
            onChange={e => setImportCompetitor(e.target.value)}
            placeholder="Nome da marca (ex: Ford, Chevrolet...)"
          />
          <input
            className="ca-input"
            value={importUrl}
            onChange={e => setImportUrl(e.target.value)}
            placeholder="URL da página de ofertas (ex: https://www.ford.com.br/ofertas)"
            type="url"
          />
        </div>
        {importError && (
          <div className="ca-import-error">
            <AlertTriangle size={13} /> {importError}
          </div>
        )}
        <button
          className="btn btn-primary ca-import-btn"
          onClick={handleImport}
          disabled={importing}
        >
          {importing
            ? <><RefreshCw size={15} className="ca-spin" /> Buscando com IA...</>
            : <><Sparkles size={15} /> Buscar e extrair com IA</>}
        </button>

        {/* Extracted results */}
        {importedOffers.length > 0 && (
          <div className="ca-extracted">
            <p className="ca-extracted-title">
              ✅ {importedOffers.length} oferta{importedOffers.length > 1 ? 's' : ''} encontrada{importedOffers.length > 1 ? 's' : ''}
            </p>
            {importedOffers.map((o, idx) => (
              <div key={idx} className={`ca-extracted-item ${savedFlags[idx] ? 'saved' : ''}`}>
                <div className="ca-extracted-header">
                  <strong>{o.title || '(sem título)'}</strong>
                  {savedFlags[idx] && (
                    <span className="ca-saved-badge"><Check size={11} /> Salvo</span>
                  )}
                </div>
                {o.description && <p className="ca-extracted-desc">{o.description.slice(0, 120)}…</p>}
                {o.highlights.length > 0 && (
                  <div className="ca-extracted-chips">
                    {o.highlights.slice(0, 4).map((h, i) => (
                      <span key={i} className="ca-chip-red">{h}</span>
                    ))}
                  </div>
                )}
                {!savedFlags[idx] && (
                  <div className="ca-extracted-actions">
                    <button className="ca-btn-save" onClick={() => handleSaveImported(idx)}>
                      <Save size={12} /> Salvar direto
                    </button>
                    <button className="ca-btn-edit" onClick={() => handleEditImported(o)}>
                      <Edit3 size={12} /> Editar antes
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Manual Form ── */}
      {showForm && (
        <div className="ca-form card">
          <div className="ca-form-header">
            <h3>{editingId ? 'Editar oferta' : 'Nova oferta manual'}</h3>
            <button className="ca-close" onClick={handleCancel}><X size={16} /></button>
          </div>

          <div className="ca-field">
            <label>Concorrente *</label>
            <input className="ca-input" value={form.competitor}
              onChange={e => setForm(f => ({ ...f, competitor: e.target.value }))}
              placeholder="Ex: Ford, Chevrolet, Toyota" />
          </div>

          <div className="ca-field">
            <label>Título da oferta *</label>
            <input className="ca-input" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Ranger — Taxa 0% até julho" />
          </div>

          <div className="ca-field">
            <label>Descritivo</label>
            <textarea className="ca-input" rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descreva a oferta do concorrente..." />
          </div>

          <div className="ca-field">
            <label>URL da oferta</label>
            <input className="ca-input" type="url" value={form.sourceUrl || ''}
              onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
              placeholder="https://..." />
          </div>

          <div className="ca-field">
            <label>Destaques deles 🔴</label>
            {form.highlights.map((h, i) => (
              <div key={i} className="ca-bullet-row">
                <input className="ca-input" value={h}
                  onChange={e => updArr('highlights', i, e.target.value)}
                  placeholder={`Destaque ${i + 1} (ex: Taxa 0%)`} />
                <button className="ca-remove-bullet" onClick={() => remArr('highlights', i)}><X size={14} /></button>
              </div>
            ))}
            <button className="ca-add-bullet" onClick={() => addArr('highlights')}>
              <Plus size={13} /> Adicionar destaque
            </button>
          </div>

          <div className="ca-field">
            <label>Nossas vantagens ✅</label>
            {form.ourAdvantages.map((h, i) => (
              <div key={i} className="ca-bullet-row">
                <input className="ca-input" value={h}
                  onChange={e => updArr('ourAdvantages', i, e.target.value)}
                  placeholder={`Vantagem ${i + 1} (ex: Preço R$5k menor)`} />
                <button className="ca-remove-bullet" onClick={() => remArr('ourAdvantages', i)}><X size={14} /></button>
              </div>
            ))}
            <button className="ca-add-bullet" onClick={() => addArr('ourAdvantages')}>
              <Plus size={13} /> Adicionar vantagem
            </button>
          </div>

          <div className="ca-field">
            <label>Texto jurídico (asterisco)</label>
            <textarea className="ca-input" rows={2} value={form.legalText || ''}
              onChange={e => setForm(f => ({ ...f, legalText: e.target.value }))}
              placeholder="Cole o texto legal se existir..." />
          </div>

          <div className="ca-row">
            <div className="ca-field">
              <label>Válido de</label>
              <input className="ca-input" type="date" value={form.validFrom}
                onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
            </div>
            <div className="ca-field">
              <label>Válido até *</label>
              <input className="ca-input" type="date" value={form.validTo}
                onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} />
            </div>
          </div>

          <div className="ca-field">
            <label>Faixas de preço (vazio = todas)</label>
            <div className="ca-segments">
              {PRICE_RANGES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`ca-seg-chip ${(form.priceRanges || []).includes(r.value) ? 'active' : ''}`}
                  onClick={() => setForm(f => {
                    const current = f.priceRanges || [];
                    return {
                      ...f,
                      priceRanges: current.includes(r.value)
                        ? current.filter((p: PriceRange) => p !== r.value)
                        : [...current, r.value],
                    };
                  })}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ca-field">
            <label>Segmentos (vazio = todos)</label>
            <div className="ca-segments">
              {SEGMENTS.filter(s => s.value).map(s => (
                <button key={s.value}
                  className={`ca-seg-chip ${form.segments.includes(s.value) ? 'active' : ''}`}
                  onClick={() => toggleSegment(s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ca-field ca-toggle-row">
            <span>Oferta ativa</span>
            <label className="ca-toggle">
              <input type="checkbox" checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              <span className="ca-toggle-track" />
            </label>
          </div>

          {error && <p className="ca-error">{error}</p>}

          <div className="ca-form-actions">
            <button className="btn btn-outline" onClick={handleCancel}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving
                ? <><RefreshCw size={14} className="ca-spin" /> Salvando...</>
                : <><Save size={14} /> Salvar</>}
            </button>
          </div>
        </div>
      )}

      {/* New manual offer button */}
      {!showForm && (
        <button className="btn btn-outline ca-new-btn" onClick={handleNew}>
          <Plus size={15} /> Cadastrar manualmente
        </button>
      )}

      {/* ── Offer list ── */}
      <div className="ca-list-title">
        <strong>Ofertas cadastradas</strong>
      </div>

      {loading ? (
        <div className="ca-loading"><RefreshCw size={18} className="ca-spin" /> Carregando...</div>
      ) : offers.length === 0 ? (
        <div className="ca-empty card">
          <p>Nenhuma oferta da concorrência cadastrada.</p>
        </div>
      ) : (
        offers.map(o => (
          <div key={o.id} className={`ca-offer-row card ${!o.active ? 'ca-inactive' : ''}`}>
            <div className="ca-offer-info">
              <span className="ca-offer-competitor">{o.competitor}</span>
              <strong>{o.title}</strong>
              <span className="ca-offer-dates">{formatDate(o.validFrom)} → {formatDate(o.validTo)}</span>
              {o.highlights.length > 0 && (
                <span className="ca-offer-pills">
                  {o.highlights.slice(0, 2).map((h, i) => (
                    <span key={i} className="ca-chip-red-sm">{h}</span>
                  ))}
                </span>
              )}
            </div>
            <div className="ca-offer-actions">
              <button
                className={`ca-toggle-btn ${o.active ? 'on' : 'off'}`}
                onClick={() => handleToggle(o)}
                title={o.active ? 'Desativar' : 'Ativar'}
              >
                {o.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
              <button className="ca-icon-btn" onClick={() => handleEdit(o)} title="Editar">
                <Edit3 size={16} />
              </button>
              <button className="ca-icon-btn ca-danger" onClick={() => handleDelete(o.id!, o.title)} title="Excluir">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

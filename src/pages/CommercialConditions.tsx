import { useState, useEffect, useRef } from 'react';
import { FileText, ExternalLink, Check, RefreshCw, Calendar, Upload, Sparkles, X, Image, AlertCircle, Share2, ImageDown } from 'lucide-react';
import { generateText, isOverloaded } from '../services/ai';
import { loadData, KEYS } from '../services/storage';
import { getActiveConditionsForMonth } from '../services/firestore/commercialConditions';
import type { CommercialCondition } from '../services/firestore/commercialConditions';
import { SEGMENTS } from '../types';
import type { UserProfile, Segment } from '../types';
import './CommercialConditions.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface ParsedCondition {
  brand: string;
  model?: string;
  title: string;
  highlights: string[];
  validTo?: string;
  description?: string;
}

function monthLabel(m: string) {
  const [y, mon] = m.split('-');
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[Number(mon) - 1]} ${y}`;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function prevMonth(m: string) {
  const [y, mon] = m.split('-').map(Number);
  if (mon === 1) return `${y - 1}-12`;
  return `${y}-${String(mon - 1).padStart(2, '0')}`;
}

function nextMonth(m: string) {
  const [y, mon] = m.split('-').map(Number);
  if (mon === 12) return `${y + 1}-01`;
  return `${y}-${String(mon + 1).padStart(2, '0')}`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CommercialConditions() {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [month, setMonth] = useState(currentMonth());
  const [conditions, setConditions] = useState<CommercialCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Upload / AI state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [parsed, setParsed] = useState<ParsedCondition[] | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const segmentLabel = profile.segment ? SEGMENTS.find(s => s.value === profile.segment)?.label : '';

  const load = async (m: string) => {
    setLoading(true);
    setError(false);
    try {
      const data = await getActiveConditionsForMonth(m, profile.segment as Segment, profile.company || '');
      const sorted = [...data].sort((a, b) => {
        if (a.segment === profile.segment && b.segment !== profile.segment) return -1;
        if (b.segment === profile.segment && a.segment !== profile.segment) return 1;
        return a.title.localeCompare(b.title);
      });
      setConditions(sorted);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(month); }, [month]);

  const goToPrev = () => setMonth(prevMonth(month));
  const goToNext = () => { const n = nextMonth(month); if (n <= currentMonth()) setMonth(n); };
  const isCurrentMonth = month === currentMonth();

  const byType = conditions.reduce<Record<string, CommercialCondition[]>>((acc, c) => {
    (acc[c.type] = acc[c.type] || []).push(c);
    return acc;
  }, {});

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await analyzeFile(file);
  };

  const analyzeFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Formato não suportado. Use JPG, PNG, WEBP ou PDF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Arquivo muito grande. Máximo 15 MB.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setParsed(null);
    setFileName(file.name);

    try {
      const base64 = await readFileAsBase64(file);

      const prompt = `Você é um especialista em análise de condições comerciais do mercado brasileiro.
Analise este documento e extraia TODAS as ofertas, condições e promoções encontradas.

Para cada condição/oferta, retorne um objeto JSON com:
- "brand": marca ou fornecedor (string)
- "model": produto/modelo específico se mencionado (string ou "")
- "title": título curto da condição (ex: "Taxa Zero 24x", "Bônus de R$5.000 no Usado")
- "highlights": array de até 5 bullets com as condições principais (ex: ["Taxa 0%", "Entrada 20%", "Válido até 31/05"])
- "validTo": data de validade se encontrada (ex: "31/05/2026"), senão ""
- "description": frase curta descrevendo a oferta, ou ""

Retorne APENAS um JSON array válido, sem markdown, sem texto extra.
Se não encontrar condições claras, retorne [].`;

      const raw = (await generateText(API_KEY, [
        { text: prompt },
        { inlineData: { data: base64, mimeType: file.type } },
      ], { models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'], retries: 2 })).trim();
      const match = raw.match(/\[[\s\S]*\]/);
      const data = JSON.parse(match ? match[0] : raw) as ParsedCondition[];

      if (Array.isArray(data) && data.length > 0) {
        setParsed(data);
      } else {
        setUploadError('Não encontrei condições neste documento. Tente com outra imagem ou PDF com mais detalhes.');
      }
    } catch (e) {
      setUploadError(isOverloaded(e) ? 'A IA está congestionada agora — tenta de novo em alguns segundos.' : 'Erro ao processar. Verifique sua conexão e tente novamente.');
    }

    setUploading(false);
  };

  const shareOnWhatsApp = (title: string, highlights: string[], brand?: string, model?: string, validTo?: string) => {
    const lines: string[] = [];
    const header = [brand, model].filter(Boolean).join(' · ');
    if (header) lines.push(header);
    lines.push(`*${title}*`);
    lines.push('');
    highlights.filter(Boolean).forEach(h => lines.push(`✅ ${h}`));
    if (validTo) lines.push(`📅 Válido até: ${validTo}`);
    lines.push('');
    lines.push('_Enviado via MAESTR.IA_');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const generateOfferCard = (title: string, highlights: string[], brand?: string, validTo?: string) => {
    const W = 600;
    const lineH = 38;
    const H = 200 + Math.max(highlights.filter(Boolean).length, 1) * lineH + (validTo ? 40 : 0);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0d1526';
    ctx.fillRect(0, 0, W, H);

    // Gold top bar
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(0, 0, W, 7);

    // Brand pill
    if (brand) {
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#c9a84c';
      ctx.fillText(brand.toUpperCase(), 32, 48);
    }

    // Title — word wrap
    ctx.font = `bold 26px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#ffffff';
    const words = title.split(' ');
    let line = '';
    let ty = brand ? 82 : 60;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > W - 64 && line) {
        ctx.fillText(line, 32, ty);
        line = word; ty += 34;
      } else { line = test; }
    }
    ctx.fillText(line, 32, ty);
    ty += 44;

    // Highlights
    ctx.font = `17px -apple-system, BlinkMacSystemFont, sans-serif`;
    highlights.filter(Boolean).forEach(h => {
      ctx.fillStyle = '#10b981';
      ctx.fillText('✓', 32, ty);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText(h, 56, ty);
      ty += lineH;
    });

    // Valid to
    if (validTo) {
      ty += 6;
      ctx.font = `15px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = '#c9a84c';
      ctx.fillText(`📅 Válido até: ${validTo}`, 32, ty);
      ty += 36;
    }

    // Footer line
    ctx.fillStyle = 'rgba(201,168,76,0.25)';
    ctx.fillRect(32, H - 38, W - 64, 1);
    ctx.font = `13px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Enviado via MAESTR.IA', 32, H - 16);

    const dataUrl = canvas.toDataURL('image/png');

    // Try Web Share API first (mobile), fallback to download
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'oferta.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: title });
          return;
        } catch { /* user cancelled or error → fallback */ }
      }
      // Fallback: download
      const a = document.createElement('a');
      a.href = dataUrl; a.download = 'oferta-maestria.png'; a.click();
    });
  };

  const clearParsed = () => {
    setParsed(null);
    setFileName('');
    setUploadError('');
  };

  // Group parsed by brand
  const parsedByBrand = parsed?.reduce<Record<string, ParsedCondition[]>>((acc, c) => {
    const key = c.brand || 'Geral';
    (acc[key] = acc[key] || []).push(c);
    return acc;
  }, {}) ?? {};

  const showUploadZone = !parsed && !uploading;
  const hasFirestoreContent = !loading && !error && conditions.length > 0;

  return (
    <div className="cc-page">
      {/* Cabeçalho com mês */}
      <div className="cc-header card">
        <div className="cc-header-top">
          <div className="cc-header-icon">
            <FileText size={20} />
          </div>
          <div>
            <h2>Condições Comerciais</h2>
            {segmentLabel && <p className="cc-segment">{segmentLabel}</p>}
            <p className="cc-source">📣 Publicadas pelo Marketing</p>
          </div>
        </div>

        <div className="cc-month-nav">
          <button className="cc-month-btn" onClick={goToPrev}>‹</button>
          <div className="cc-month-label">
            <Calendar size={14} />
            {monthLabel(month)}
          </div>
          <button className="cc-month-btn" onClick={goToNext} disabled={isCurrentMonth}>›</button>
        </div>
      </div>

      {/* ── UPLOAD / AI SECTION ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        capture={undefined}
      />

      {/* Upload zone — aparece quando não há resultado */}
      {showUploadZone && (
        <div className="cc-upload-zone" onClick={() => fileInputRef.current?.click()}>
          <div className="cc-upload-icon">
            <Upload size={22} />
          </div>
          <div className="cc-upload-text">
            <span className="cc-upload-title">Consultar um documento (só pra você)</span>
            <span className="cc-upload-hint">Foto ou PDF — a IA resume pra você. Não publica pro time: quem publica é o Marketing.</span>
          </div>
          <div className="cc-upload-badges">
            <span className="cc-upload-badge"><Image size={11} /> Foto</span>
            <span className="cc-upload-badge"><FileText size={11} /> PDF</span>
          </div>
        </div>
      )}

      {/* Erro de upload */}
      {uploadError && (
        <div className="cc-upload-error card">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
          <button className="cc-upload-retry" onClick={() => fileInputRef.current?.click()}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Processando */}
      {uploading && (
        <div className="cc-ai-loading card">
          <div className="cc-ai-loading-inner">
            <Sparkles size={22} className="cc-ai-sparkle" />
            <div>
              <p className="cc-ai-loading-title">Analisando com IA…</p>
              <p className="cc-ai-loading-sub">Lendo {fileName}</p>
            </div>
          </div>
          <div className="cc-ai-progress">
            <div className="cc-ai-progress-bar" />
          </div>
        </div>
      )}

      {/* Resultado da IA */}
      {parsed && (
        <>
          <div className="cc-ai-header">
            <div className="cc-ai-badge">
              <Sparkles size={12} /> Extraído pela IA
            </div>
            <div className="cc-ai-meta">
              <span className="cc-ai-filename">{fileName}</span>
              <button className="cc-ai-clear" onClick={clearParsed}>
                <X size={14} /> Limpar
              </button>
            </div>
          </div>

          {Object.entries(parsedByBrand).map(([brand, items]) => (
            <div key={brand} className="cc-group">
              <div className="cc-group-label">{brand}</div>
              <div className="cc-group-list">
                {items.map((c, i) => (
                  <div key={i} className="cc-card cc-card-ai card">
                    <div className="cc-card-top">
                      <div className="cc-card-info">
                        {c.model && <span className="cc-card-brand">{c.model}</span>}
                        <h4 className="cc-card-title">{c.title}</h4>
                        {c.description && <p className="cc-card-desc">{c.description}</p>}
                      </div>
                      {c.validTo && (
                        <span className="cc-card-valid">
                          <Calendar size={11} /> {c.validTo}
                        </span>
                      )}
                    </div>

                    {c.highlights?.length > 0 && (
                      <div className="cc-card-highlights">
                        {c.highlights.filter(h => h).map((h, j) => (
                          <span key={j} className="cc-highlight"><Check size={11} />{h}</span>
                        ))}
                      </div>
                    )}

                    <div className="cc-card-actions">
                      <button
                        className="cc-share-btn"
                        onClick={() => shareOnWhatsApp(c.title, c.highlights || [], c.brand, c.model, c.validTo)}
                      >
                        <Share2 size={13} /> WhatsApp
                      </button>
                      <button
                        className="cc-card-btn"
                        onClick={() => generateOfferCard(c.title, c.highlights || [], c.brand, c.validTo)}
                      >
                        <ImageDown size={13} /> Card
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Botão para novo upload */}
          <button className="cc-upload-new" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Enviar outro documento
          </button>
        </>
      )}

      {/* Divisor quando tem Firestore + upload */}
      {hasFirestoreContent && parsed && (
        <div className="cc-divider">
          <span>Publicadas pelo Marketing</span>
        </div>
      )}

      {/* Estado de carregamento Firestore */}
      {loading && (
        <div className="cc-loading">
          <RefreshCw size={20} className="cc-spinning" />
          <span>Carregando condições...</span>
        </div>
      )}

      {error && !loading && (
        <div className="cc-error card">
          <p>Erro ao carregar. Verifique sua conexão.</p>
          <button className="btn btn-outline btn-sm" onClick={() => load(month)}>Tentar novamente</button>
        </div>
      )}

      {!loading && !error && conditions.length === 0 && !parsed && (
        <div className="cc-empty card">
          <FileText size={40} />
          <h3>Nenhuma condição para {monthLabel(month)}</h3>
          <p>O marketing ainda não publicou condições para este mês.<br />Use o upload acima para analisar seu próprio documento.</p>
        </div>
      )}

      {/* Lista Firestore agrupada por tipo */}
      {!loading && !error && Object.entries(byType).map(([type, items]) => (
        <div key={type} className="cc-group">
          <div className="cc-group-label">{type}</div>
          <div className="cc-group-list">
            {items.map(c => {
              const hasPdf = !!c.pdfUrl && c.pdfUrl.startsWith('http');
              const [y, mon] = c.month ? c.month.split('-') : ['', ''];
              const validTo = mon && y ? `${mon}/${y}` : undefined;
              return (
                <div key={c.id} className="cc-card card">
                  <div className="cc-card-top">
                    <div className="cc-card-info">
                      {c.brand && <span className="cc-card-brand">{c.brand}</span>}
                      <h4 className="cc-card-title">{c.title}</h4>
                      {c.description && <p className="cc-card-desc">{c.description}</p>}
                    </div>
                    {hasPdf && <ExternalLink size={16} className="cc-card-icon" />}
                  </div>

                  {c.highlights?.filter(h => h).length > 0 && (
                    <div className="cc-card-highlights">
                      {c.highlights.filter(h => h).map((h, i) => (
                        <span key={i} className="cc-highlight"><Check size={11} />{h}</span>
                      ))}
                    </div>
                  )}

                  <div className="cc-card-footer">
                    {hasPdf ? (
                      <a
                        href={c.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cc-card-cta"
                      >
                        Abrir PDF
                      </a>
                    ) : (
                      <span className="cc-card-cta cc-card-cta-muted">Sem PDF</span>
                    )}
                    <div className="cc-card-actions">
                      <button
                        className="cc-share-btn"
                        onClick={() => shareOnWhatsApp(c.title, c.highlights || [], c.brand, undefined, validTo)}
                      >
                        <Share2 size={13} /> WhatsApp
                      </button>
                      <button
                        className="cc-card-btn"
                        onClick={() => generateOfferCard(c.title, c.highlights || [], c.brand, validTo)}
                      >
                        <ImageDown size={13} /> Card
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

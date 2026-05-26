import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PenLine, Sparkles, Copy, Share2, RefreshCw, CheckCircle, BookOpen, AlertCircle } from 'lucide-react';
import { useOnline } from '../hooks/useOnline';
import OfflineState from '../components/OfflineState';
import './CopyGenerator.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GUIDE_KEY = 'gss_brand_guide_v1';

interface StoredGuide {
  id: string;
  name: string;
  type: 'text' | 'file';
  content: string;
  mimeType?: string;
  savedAt: number;
}

interface CopyVersion {
  title: string;
  body: string;
}

function loadGuide(): StoredGuide | null {
  // Tenta o formato novo (BrandGuide)
  try {
    const raw = localStorage.getItem(GUIDE_KEY);
    if (raw) return JSON.parse(raw) as StoredGuide;
  } catch { /* ignore */ }

  // Fallback: formato do MarketingChat (array de guides com base64)
  try {
    const raw = localStorage.getItem('gss_brand_guides');
    if (raw) {
      const guides = JSON.parse(raw) as Array<{ id: string; name: string; base64: string; mimeType: string; savedAt: number }>;
      if (guides.length > 0) {
        const latest = [...guides].sort((a, b) => b.savedAt - a.savedAt)[0];
        return { id: latest.id, name: latest.name, type: 'file', content: latest.base64, mimeType: latest.mimeType, savedAt: latest.savedAt };
      }
    }
  } catch { /* ignore */ }

  return null;
}

function parseCopies(text: string): CopyVersion[] {
  const lines = text.split('\n');
  const versions: CopyVersion[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) versions.push({ title: current.title, body: current.lines.join('\n').trim() });
      current = { title: line.replace(/^## /, '').trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) versions.push({ title: current.title, body: current.lines.join('\n').trim() });
  return versions;
}

const OBJETIVOS = ['Gerar lead', 'Vender', 'Engajar', 'Awareness'];
const FORMATOS = ['Post feed', 'Stories', 'WhatsApp', 'Legenda longa', 'E-mail'];

export default function CopyGenerator() {
  const isOnline = useOnline();
  const guide = loadGuide();

  const [produto, setProduto] = useState('');
  const [publico, setPublico] = useState('');
  const [objetivo, setObjetivo] = useState('Gerar lead');
  const [formatos, setFormatos] = useState<string[]>(['Post feed']);
  const [contexto, setContexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [copies, setCopies] = useState<CopyVersion[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  const toggleFormato = (f: string) => {
    setFormatos(prev =>
      prev.includes(f) ? (prev.length > 1 ? prev.filter(x => x !== f) : prev) : [...prev, f]
    );
  };

  const handleGenerate = async () => {
    if (!produto.trim() || loading) return;
    setLoading(true);
    setError('');
    setCopies([]);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);

      const guideBlock = guide && guide.type === 'text'
        ? `\n\nGUIA DE MARCA DA EMPRESA:\n"""\n${guide.content}\n"""\nMantenha o tom de voz, identidade e valores definidos no guia em TODAS as versões.`
        : guide
          ? '\n\nA empresa possui um Guia de Marca cadastrado. Mantenha um tom profissional, moderno e alinhado à identidade de uma concessionária premium.'
          : '';

      const systemPrompt = `Você é especialista em copywriting para concessionárias e varejo automotivo brasileiro.${guideBlock}

Gere 3 versões de copy com abordagens DIFERENTES (ex: urgência, benefício emocional, dados/racional). Cada versão deve ter identidade própria mas todas devem ser prontas para uso imediato.

ESTRUTURE EXATAMENTE ASSIM (use ## para cada versão):

## Versão 1 — [Nome da abordagem]
[Copy completa, pronta para uso]

## Versão 2 — [Nome da abordagem]
[Copy completa, pronta para uso]

## Versão 3 — [Nome da abordagem]
[Copy completa, pronta para uso]

DIRETRIZES:
- Adapte o comprimento ao formato: Stories = curto e direto; Legenda longa = completo; WhatsApp = conversacional; E-mail = estruturado com assunto
- Use emojis quando o formato pedir (Stories, WhatsApp, Post feed)
- Inclua CTA claro em cada versão
- Escreva em português brasileiro
- Não inclua explicações, apenas as copies prontas`;

      const userPrompt = `Crie 3 copies para:
- Produto/Oferta: ${produto}
- Público-alvo: ${publico || 'Compradores de veículos'}
- Objetivo: ${objetivo}
- Formato: ${formatos.join(', ')}${contexto.trim() ? `\n- Contexto adicional: ${contexto}` : ''}`;

      const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [];

      if (guide?.type === 'file' && guide.mimeType) {
        parts.push({ inlineData: { data: guide.content, mimeType: guide.mimeType } });
      }
      parts.push({ text: userPrompt });

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      });

      const response = await model.generateContent(parts);
      const text = response.response.text();
      const parsed = parseCopies(text);

      if (parsed.length === 0) {
        setError('Não consegui gerar as copies. Tente novamente com mais detalhes.');
      } else {
        setCopies(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleNew = () => {
    setCopies([]);
    setError('');
  };

  if (!isOnline) return <OfflineState feature="o Gerador de Copy" />;
  if (!API_KEY) return <OfflineState feature="o Gerador de Copy" subtitle="Serviço indisponível. Fale com o suporte." />;

  return (
    <div className="cg-page">

      {/* Hero */}
      <div className="cg-hero card">
        <div className="cg-hero-icon">
          <PenLine size={22} />
        </div>
        <div>
          <h2 className="cg-hero-title">Gerador de Copy</h2>
          <p className="cg-hero-sub">Descreva a oferta e a IA cria 3 versões prontas para usar</p>
        </div>
        {guide && (
          <div className="cg-guide-badge">
            <BookOpen size={12} /> Guia de marca ativo
          </div>
        )}
      </div>

      {/* Form */}
      {copies.length === 0 && !loading && (
        <div className="cg-form card">
          <div className="cg-field">
            <label className="cg-label">Produto ou oferta *</label>
            <input
              className="cg-input"
              placeholder="Ex: Novo Corolla com taxa zero 24x"
              value={produto}
              onChange={e => setProduto(e.target.value)}
            />
          </div>

          <div className="cg-field">
            <label className="cg-label">Público-alvo</label>
            <input
              className="cg-input"
              placeholder="Ex: Famílias classe B, 35–50 anos"
              value={publico}
              onChange={e => setPublico(e.target.value)}
            />
          </div>

          <div className="cg-field">
            <label className="cg-label">Objetivo</label>
            <div className="cg-chips">
              {OBJETIVOS.map(o => (
                <button
                  key={o}
                  className={`cg-chip${objetivo === o ? ' cg-chip--active' : ''}`}
                  onClick={() => setObjetivo(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div className="cg-field">
            <label className="cg-label">Formato</label>
            <div className="cg-chips">
              {FORMATOS.map(f => (
                <button
                  key={f}
                  className={`cg-chip${formatos.includes(f) ? ' cg-chip--active' : ''}`}
                  onClick={() => toggleFormato(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="cg-field">
            <label className="cg-label">Contexto adicional <span className="cg-optional">(opcional)</span></label>
            <textarea
              className="cg-textarea"
              rows={2}
              placeholder="Ex: Campanha de fim de mês, estoque limitado, público vindo de Google Ads"
              value={contexto}
              onChange={e => setContexto(e.target.value)}
            />
          </div>

          {error && (
            <div className="cg-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="cg-generate-btn"
            onClick={handleGenerate}
            disabled={!produto.trim() || loading}
          >
            {loading
              ? <><RefreshCw size={16} className="cg-spin" /> Gerando copies...</>
              : <><Sparkles size={16} /> Gerar 3 versões</>
            }
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="cg-loading card">
          <Sparkles size={22} className="cg-spin" />
          <div>
            <p>Criando 3 versões de copy...</p>
            <span>Urgência · Emocional · Racional</span>
          </div>
        </div>
      )}

      {/* Results */}
      {copies.length > 0 && !loading && (
        <>
          <div className="cg-result-header">
            <span className="cg-result-label">3 versões geradas</span>
            <button className="cg-new-btn" onClick={handleNew}>
              <RefreshCw size={13} /> Nova copy
            </button>
          </div>

          {copies.map((copy, i) => (
            <div key={i} className="cg-copy-card card">
              <div className="cg-copy-top">
                <span className="cg-copy-title">{copy.title}</span>
              </div>
              <p className="cg-copy-body">{copy.body}</p>
              <div className="cg-copy-actions">
                <button className="cg-copy-btn" onClick={() => handleCopy(copy.body, i)}>
                  {copied === i
                    ? <><CheckCircle size={13} /> Copiado!</>
                    : <><Copy size={13} /> Copiar</>
                  }
                </button>
                <button className="cg-wpp-btn" onClick={() => handleWhatsApp(copy.body)}>
                  <Share2 size={13} /> WhatsApp
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

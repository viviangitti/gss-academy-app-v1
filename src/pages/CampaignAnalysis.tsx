import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Upload, FileText, X, Sparkles, Download,
  BarChart2, RefreshCw, ImageIcon, AlertCircle,
} from 'lucide-react';
import { useOnline } from '../hooks/useOnline';
import OfflineState from '../components/OfflineState';
import './CampaignAnalysis.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const HISTORY_KEY = 'gss_campaign_analysis_last';

const SYSTEM_PROMPT = `Você é um especialista em growth e análise de campanhas de marketing. Analise os dados apresentados (imagem de dashboard, relatório, planilha ou print de resultados) e gere uma análise completa em português brasileiro.

ESTRUTURE SUA RESPOSTA EXATAMENTE ASSIM:

## 📊 Dados Identificados
Descreva o que você está vendo: métricas, período, plataforma, tipo de campanha e objetivo aparente.

## ✅ O que Funcionou
Liste os pontos positivos, o que teve bom desempenho e por quê funcionou.

## ⚠️ O que Pode Melhorar
Liste os pontos de atenção, o que teve desempenho abaixo do esperado e possíveis causas.

## 💡 Insights Principais
Os 3 a 5 insights mais importantes extraídos diretamente dos dados.

## 🎯 Recomendações para a Próxima Campanha
Ações concretas, práticas e priorizadas para melhorar os resultados na próxima campanha.

## 📌 Takeaways
3 frases curtas e objetivas que resumem o aprendizado mais importante dessa campanha.

DIRETRIZES:
- Seja específico com os números que aparecem nos dados
- Use benchmarks de mercado quando relevante (ex: CTR médio, CPL esperado)
- Priorize recomendações que podem ser implementadas imediatamente
- Escreva em português brasileiro claro e direto
- Se os dados forem insuficientes para alguma seção, diga o que está faltando para uma análise mais completa`;

interface AttachedFile {
  base64: string;
  mimeType: string;
  preview: string | null;
  name: string;
}

interface StoredResult {
  result: string;
  context: string;
  fileName: string;
  analyzedAt: number;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadLastResult(): StoredResult | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveResult(r: StoredResult) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(r)); } catch { /* ignore */ }
}

function downloadText(text: string, filename = 'analise-campanha.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Parse sections from the markdown result for structured display
function parseSections(text: string): { heading: string; content: string }[] {
  const lines = text.split('\n');
  const sections: { heading: string; content: string }[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push({ heading: current.heading, content: current.lines.join('\n').trim() });
      current = { heading: line.replace(/^## /, ''), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push({ heading: current.heading, content: current.lines.join('\n').trim() });
  return sections;
}

function formatContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>(\n<li>[\s\S]*?<\/li>)*)/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function CampaignAnalysis() {
  const isOnline = useOnline();

  const [file, setFile] = useState<AttachedFile | null>(null);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([]);
  const [error, setError] = useState('');
  const [lastResult] = useState<StoredResult | null>(loadLastResult);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) {
      alert('Arquivo muito grande. O limite é 15 MB.');
      e.target.value = '';
      return;
    }
    const base64 = await readFileAsBase64(f);
    const preview = f.type.startsWith('image/') ? await readFileAsDataURL(f) : null;
    setFile({ base64, mimeType: f.type, preview, name: f.name });
    setResult('');
    setSections([]);
    setError('');
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError('');
    setResult('');
    setSections([]);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      });

      const contextText = context.trim()
        || 'Analise os resultados dessa campanha de marketing e gere insights, o que funcionou, o que pode melhorar e recomendações.';

      const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [
        { inlineData: { data: file.base64, mimeType: file.mimeType } },
        { text: contextText },
      ];

      const response = await model.generateContent(parts);
      const text = response.response.text();
      setResult(text);
      setSections(parseSections(text));
      saveResult({ result: text, context: contextText, fileName: file.name, analyzedAt: Date.now() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setFile(null);
    setContext('');
    setResult('');
    setSections([]);
    setError('');
  };

  if (!isOnline) return <OfflineState feature="a Análise de Campanhas" />;
  if (!API_KEY) return <OfflineState feature="a Análise de Campanhas" subtitle="Serviço indisponível. Fale com o suporte." />;

  const isPdf = file?.mimeType === 'application/pdf';

  return (
    <div className="ca-page">

      {/* ── Header card ── */}
      <div className="ca-hero card">
        <div className="ca-hero-icon">
          <BarChart2 size={22} />
        </div>
        <div>
          <h2 className="ca-hero-title">Análise de Campanhas</h2>
          <p className="ca-hero-sub">Envie um print ou relatório — a IA analisa os resultados e gera insights</p>
        </div>
      </div>

      {/* ── Upload area ── */}
      {!result && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {!file ? (
            <button className="ca-upload-zone card" onClick={() => fileInputRef.current?.click()}>
              <div className="ca-upload-icon">
                <Upload size={28} />
              </div>
              <p className="ca-upload-title">Enviar print ou relatório</p>
              <p className="ca-upload-sub">
                Aceita capturas de tela de Google Analytics, Meta Ads, Instagram Insights, TikTok, planilhas e PDFs
              </p>
              <span className="ca-upload-types">
                <ImageIcon size={12} /> Imagem &nbsp;·&nbsp; <FileText size={12} /> PDF &nbsp;·&nbsp; Até 15 MB
              </span>
            </button>
          ) : (
            <div className="ca-file-preview card">
              <div className="ca-file-row">
                {file.preview
                  ? <img src={file.preview} className="ca-file-thumb" alt="preview" />
                  : <div className="ca-file-pdf-icon"><FileText size={24} /></div>
                }
                <div className="ca-file-meta">
                  <span className="ca-file-name">{file.name}</span>
                  <span className="ca-file-type">{isPdf ? 'PDF' : 'Imagem'} · pronto para análise</span>
                </div>
                <button className="ca-file-remove" onClick={handleNew}><X size={16} /></button>
              </div>

              {/* Context input */}
              <div className="ca-context">
                <label className="ca-context-label">Contexto da campanha (opcional)</label>
                <textarea
                  className="ca-context-input"
                  rows={3}
                  placeholder="Ex: Campanha de maio no Instagram para lançamento do Novo Corolla. Objetivo: gerar leads. Verba: R$ 3.000."
                  value={context}
                  onChange={e => setContext(e.target.value)}
                />
              </div>

              <button
                className="ca-analyze-btn"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading
                  ? <><RefreshCw size={16} className="ca-spin" /> Analisando...</>
                  : <><Sparkles size={16} /> Analisar resultados</>
                }
              </button>

              {error && (
                <div className="ca-error">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="ca-loading">
          <div className="ca-loading-inner">
            <Sparkles size={22} className="ca-spin" />
            <p>Analisando os resultados da campanha...</p>
            <span>Identificando métricas, insights e recomendações</span>
          </div>
          {[1, 2, 3].map(i => <div key={i} className="ca-skeleton" />)}
        </div>
      )}

      {/* ── Results ── */}
      {sections.length > 0 && !loading && (
        <>
          <div className="ca-result-header">
            <span className="ca-result-label">Análise gerada</span>
            <div className="ca-result-actions">
              <button className="ca-action-btn" onClick={() => downloadText(result)}>
                <Download size={14} /> Baixar
              </button>
              <button className="ca-action-btn ca-action-btn--outline" onClick={handleNew}>
                <RefreshCw size={14} /> Nova análise
              </button>
            </div>
          </div>

          {sections.map((sec, i) => (
            <div key={i} className="ca-section card">
              <h3 className="ca-section-heading">{sec.heading}</h3>
              <div
                className="ca-section-content"
                dangerouslySetInnerHTML={{ __html: formatContent(sec.content) }}
              />
            </div>
          ))}

        </>
      )}

      {/* Fallback: IA retornou texto sem headers ## */}
      {sections.length === 0 && result && !loading && (
        <div className="ca-section card">
          <div
            className="ca-section-content"
            dangerouslySetInnerHTML={{ __html: formatContent(result) }}
          />
        </div>
      )}

      {/* ── Last analysis teaser (no file selected, no current result) ── */}
      {!file && !result && lastResult && (
        <div className="ca-last card">
          <div className="ca-last-header">
            <span className="ca-last-label">Última análise</span>
            <span className="ca-last-date">
              {new Date(lastResult.analyzedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="ca-last-file">{lastResult.fileName}</p>
          <button className="ca-last-view" onClick={() => {
            setResult(lastResult.result);
            setSections(parseSections(lastResult.result));
          }}>
            Ver análise <Sparkles size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

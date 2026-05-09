import { useState, useEffect } from 'react';
import { Wand2, Sparkles, Copy, Check, RotateCcw, AlertTriangle, ThumbsUp, MessageSquare, Lightbulb } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addHistory } from '../services/history';
import ShareButton from '../components/ShareButton';
import SpeakButton from '../components/SpeakButton';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './MessageCoach.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const CONTEXTS = [
  { value: '', label: 'Qualquer mensagem' },
  { value: 'primeiro_contato', label: 'Primeiro contato' },
  { value: 'apos_reuniao', label: 'Após uma reunião' },
  { value: 'follow_up', label: 'Acompanhamento' },
  { value: 'reativacao', label: 'Reativar cliente sumido' },
  { value: 'proposta', label: 'Envio de proposta' },
  { value: 'fechamento', label: 'Tentativa de fechamento' },
  { value: 'indicacao', label: 'Abordagem por indicação' },
];

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'linkedin', label: 'LinkedIn' },
];

interface Analysis {
  score: number;
  strengths: string[];
  problems: string[];
  tone: string;
  improved: string;
  whyBetter: string;
}

const ANALYSIS_PROMPT = (message: string, context: string, channel: string) => `Você é um coach de vendas especialista. Analise esta mensagem comercial que o vendedor vai enviar para o cliente.

CANAL: ${channel}
CONTEXTO: ${context || 'não especificado'}

MENSAGEM DO VENDEDOR:
"""
${message}
"""

Responda EXATAMENTE neste formato JSON (sem markdown, sem crases), em português brasileiro:

{
  "score": <nota de 1 a 10>,
  "tone": "<descrição curta do tom, ex: 'Genérico e passivo'>",
  "strengths": ["<1-3 pontos fortes em frases curtas>"],
  "problems": ["<1-4 problemas específicos em frases diretas>"],
  "improved": "<mensagem reescrita do zero, MUITO MELHOR, pronta para copiar e enviar. Mantenha o canal escolhido. Para WhatsApp seja curto e direto. Para e-mail seja estruturado. Não use formalidades exageradas>",
  "whyBetter": "<1 frase explicando por que a versão melhorada funciona melhor>"
}

Seja honesto: se a mensagem for ruim, dê nota baixa. Se for excelente, dê nota alta.
NÃO inclua nenhum texto antes ou depois do JSON.`;

interface SavedAnalysis {
  message: string;
  context: string;
  channel: string;
  analysis: Analysis;
}

export default function MessageCoach() {
  const isOnline = useOnline();
  const [message, setMessage] = useState('');
  const [context, setContext] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('gss_history_open');
    if (saved) {
      try {
        const entry = JSON.parse(saved);
        if (entry.type === 'message_review' && entry.data) {
          const data = entry.data as SavedAnalysis;
          setMessage(data.message);
          setContext(data.context);
          setChannel(data.channel);
          setAnalysis(data.analysis);
        }
      } catch { /* ignore */ }
      sessionStorage.removeItem('gss_history_open');
    }
  }, []);

  const handleExample = () => {
    setChannel('whatsapp');
    setContext('follow_up');
    setMessage('Olá João, tudo bem? Gostaria de saber se teve tempo de analisar a proposta que enviei. Qualquer dúvida estou à disposição. Abraços.');
  };

  const handleAnalyze = async () => {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const contextLabel = CONTEXTS.find(c => c.value === context)?.label || '';
      const channelLabel = CHANNELS.find(c => c.value === channel)?.label || channel;

      const result = await model.generateContent(ANALYSIS_PROMPT(message, contextLabel, channelLabel));
      const text = result.response.text().trim();
      // Remove possíveis crases de markdown
      const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned) as Analysis;
      setAnalysis(parsed);

      // Salvar no histórico
      addHistory({
        type: 'message_review',
        title: `${channelLabel} — Nota ${parsed.score}/10`,
        subtitle: parsed.tone,
        preview: message.slice(0, 140),
        data: { message, context, channel, analysis: parsed } as SavedAnalysis,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(`A análise ficou indisponível. ${msg ? `(${msg})` : ''} Toque para tentar de novo.`);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setMessage('');
    setAnalysis(null);
    setError('');
  };

  const handleCopyImproved = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis.improved);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const scoreColor = analysis
    ? analysis.score >= 8 ? 'excellent'
    : analysis.score >= 6 ? 'good'
    : analysis.score >= 4 ? 'ok'
    : 'bad'
    : '';

  if (!isOnline) return <OfflineState feature="o Coach de Mensagem" />;
  if (!API_KEY) return <OfflineState feature="o Coach de Mensagem" subtitle="Configuração de IA indisponível. Fale com o suporte." />;

  return (
    <div className="msgcoach-page">
      {!analysis ? (
        <>
          <div className="msgcoach-hero card">
            <Wand2 size={26} />
            <div>
              <h3>Coach de Mensagem</h3>
              <p>Cole o que vai enviar. A IA avalia e reescreve melhor em segundos.</p>
            </div>
          </div>

          {/* Canal */}
          <div className="msgcoach-channels">
            {CHANNELS.map(c => (
              <button
                key={c.value}
                className={`channel-chip ${channel === c.value ? 'active' : ''}`}
                onClick={() => setChannel(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Contexto */}
          <div className="form-group">
            <label className="msgcoach-label">Contexto (opcional)</label>
            <select value={context} onChange={e => setContext(e.target.value)}>
              {CONTEXTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Mensagem */}
          <div className="form-group">
            <label className="msgcoach-label">Sua mensagem</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={8}
              placeholder="Cole aqui o que você ia mandar para o cliente..."
              className="msgcoach-textarea"
            />
            <span className="msgcoach-hint">{message.length} caracteres</span>
          </div>

          {!message && (
            <button className="msgcoach-example" onClick={handleExample}>
              <Lightbulb size={14} /> Ver exemplo de mensagem
            </button>
          )}

          <button
            className="btn btn-primary msgcoach-analyze"
            onClick={handleAnalyze}
            disabled={!message.trim() || loading}
          >
            {loading ? (
              <>
                <Sparkles size={16} className="spinning" /> Analisando...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Analisar mensagem
              </>
            )}
          </button>

          {error && <div className="msgcoach-error card" onClick={handleAnalyze}>{error}</div>}
        </>
      ) : (
        <>
          {/* Score */}
          <div className={`msgcoach-score card ${scoreColor}`}>
            <div className="score-circle">
              <span className="score-value">{analysis.score}</span>
              <span className="score-total">/10</span>
            </div>
            <div className="score-info">
              <span className="score-label">
                {analysis.score >= 8 ? 'Excelente' : analysis.score >= 6 ? 'Boa' : analysis.score >= 4 ? 'Precisa ajustar' : 'Reescreva'}
              </span>
              <span className="score-tone"><MessageSquare size={12} /> {analysis.tone}</span>
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div className="msgcoach-section card">
              <h4><ThumbsUp size={15} /> O que está funcionando</h4>
              <ul className="msgcoach-list strengths">
                {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Problems */}
          {analysis.problems.length > 0 && (
            <div className="msgcoach-section card">
              <h4><AlertTriangle size={15} /> O que pode melhorar</h4>
              <ul className="msgcoach-list problems">
                {analysis.problems.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {/* Improved */}
          <div className="msgcoach-improved card">
            <div className="improved-header">
              <Sparkles size={15} />
              <h4>Versão melhorada</h4>
            </div>
            <p className="improved-text">{analysis.improved}</p>
            <div className="improved-actions">
              <button className={`btn btn-sm ${copied ? 'btn-copied' : 'btn-primary'}`} onClick={handleCopyImproved}>
                {copied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar</>}
              </button>
              <ShareButton text={analysis.improved} title="Mensagem" size={16} />
              <SpeakButton text={analysis.improved} size={16} />
            </div>
            <p className="improved-why">💡 {analysis.whyBetter}</p>
          </div>

          <button className="btn btn-outline msgcoach-reset" onClick={handleReset}>
            <RotateCcw size={14} /> Analisar outra mensagem
          </button>
        </>
      )}
    </div>
  );
}

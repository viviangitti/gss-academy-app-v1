import { useState, useRef, useEffect } from 'react';
import { Mic, Sparkles, RotateCcw, Users, Shield, ArrowRight, AlertTriangle, Target, Edit3, Trash2, CheckSquare, Lightbulb, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addHistory } from '../services/history';
import { addTask } from '../services/day';
import ShareButton from '../components/ShareButton';
import SpeakButton from '../components/SpeakButton';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './MeetingAnalysis.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface Analysis {
  summary: string;
  quality: number;
  participants: string[];
  objections: string[];
  nextSteps: string[];
  warnings: string[];
  nextAction: string;
}

const ANALYSIS_PROMPT = (transcript: string) => `Você é um coach de vendas sênior. O vendedor acabou de sair de uma reunião e está te contando como foi. Analise o relato e extraia os pontos importantes.

RELATO DO VENDEDOR:
"""
${transcript}
"""

Responda EXATAMENTE neste formato JSON (sem markdown, sem crases), em português brasileiro:

{
  "summary": "<resumo da reunião em 1-2 frases, objetivo>",
  "quality": <qualidade da reunião de 1 a 5>,
  "participants": ["<pessoas mencionadas com papel se houver, ex: 'João (decisor)', 'Maria (compradora)'>"],
  "objections": ["<objeções que surgiram na reunião, em frases diretas>"],
  "nextSteps": ["<próximos passos acordados - ações concretas com prazo se houver>"],
  "warnings": ["<pontos de atenção ou sinais de alerta, ex: 'comprou de concorrente antes'>"],
  "nextAction": "<sua recomendação mais importante em 1-2 frases: o que o vendedor deve fazer agora para avançar o negócio>"
}

Se o relato não tiver informação para um campo, retorne array vazio [].
Seja DIRETO e PRÁTICO. Nada de generalidades.
NÃO inclua nenhum texto antes ou depois do JSON.`;

interface SpeechRecognitionAPI extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
  };
}

interface SavedMeeting {
  transcript: string;
  analysis: Analysis;
}

// Delays pseudo-aleatórios para a waveform
const BAR_DELAYS = [0, 0.15, 0.3, 0.08, 0.45, 0.22, 0.6, 0.38, 0.52, 0.12,
                    0.7, 0.28, 0.18, 0.55, 0.42, 0.65, 0.05, 0.35, 0.48, 0.75];
const BAR_DURS   = [0.8, 1.1, 0.7, 0.95, 1.2, 0.85, 0.75, 1.05, 0.9, 1.15,
                    0.8, 0.7, 1.0, 0.88, 0.78, 1.1, 0.95, 0.82, 1.0, 0.72];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type RecState = 'idle' | 'recording' | 'done';

export default function MeetingAnalysis() {
  const navigate = useNavigate();
  const isOnline = useOnline();
  const [recState, setRecState] = useState<RecState>('idle');
  const recStateRef = useRef<RecState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordSec, setRecordSec] = useState(0);
  const [manualEdit, setManualEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [hasSupport, setHasSupport] = useState(true);
  const [tasksCreated, setTasksCreated] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionAPI | null>(null);
  const finalTranscriptRef = useRef('');
  const interimTextRef = useRef(''); // captura interim ao tocar ✅
  const restartScheduledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setRecStateBoth = (s: RecState) => {
    recStateRef.current = s;
    setRecState(s);
  };

  useEffect(() => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionAPI }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionAPI }).webkitSpeechRecognition;
    if (!SpeechRec) setHasSupport(false);

    const saved = sessionStorage.getItem('gss_history_open');
    if (saved) {
      try {
        const entry = JSON.parse(saved);
        if (entry.type === 'meeting_analysis' && entry.data) {
          const data = entry.data as SavedMeeting;
          setTranscript(data.transcript);
          finalTranscriptRef.current = data.transcript;
          setAnalysis(data.analysis);
        }
      } catch { /* ignore */ }
      sessionStorage.removeItem('gss_history_open');
    }
  }, []);

  const handleExample = () => {
    setManualEdit(true);
    const ex = 'A reunião com a Alpha foi interessante. O João é o diretor e pareceu bem interessado. Já a Maria, que é a compradora, bateu muito na questão do preço, disse que temos que melhorar. Eles já viram 3 propostas de concorrentes. Combinamos que eu vou enviar o comparativo com nosso concorrente principal até sexta e marcar nova reunião na segunda.';
    setTranscript(ex);
    finalTranscriptRef.current = ex;
  };

  const handleCreateTasks = () => {
    if (!analysis) return;
    analysis.nextSteps.forEach(step => addTask(step));
    setTasksCreated(true);
    setTimeout(() => navigate('/'), 1500);
  };

  // ── Recorder ──────────────────────────────────────────────────────────────

  const getSpeechRec = () =>
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionAPI }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionAPI }).webkitSpeechRecognition;

  const startSession = () => {
    const SpeechRec = getSpeechRec();
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'pt-BR';

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalTranscriptRef.current += r[0].transcript + ' ';
          interimTextRef.current = '';
          setTranscript(finalTranscriptRef.current);
          setInterimText('');
        } else {
          interim += r[0].transcript;
        }
      }
      if (interim) {
        interimTextRef.current = interim;
        setInterimText(interim);
      }
    };

    rec.onerror = () => { /* onend cuidará */ };

    rec.onend = () => {
      setInterimText('');
      // Se recState já não é 'recording', stopRecording/cancelRecording já agiu — ignora
      if (recStateRef.current !== 'recording') return;
      // Auto-reinicia para gravação contínua
      if (!restartScheduledRef.current) {
        restartScheduledRef.current = true;
        setTimeout(() => {
          restartScheduledRef.current = false;
          if (recStateRef.current === 'recording') startSession();
        }, 150);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* */ }
  };

  const startRecording = () => {
    if (!getSpeechRec()) {
      setError('Seu navegador não suporta gravação de voz. Use o campo de texto.');
      setManualEdit(true);
      return;
    }
    setError('');
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimText('');
    setRecordSec(0);
    setRecStateBoth('recording');
    timerRef.current = setInterval(() => setRecordSec(s => s + 1), 1000);
    startSession();
  };

  const stopRecording = () => {
    // Captura final + interim (caso toque ✅ enquanto ainda está falando)
    const text = (finalTranscriptRef.current + ' ' + interimTextRef.current).trim();
    if (timerRef.current) clearInterval(timerRef.current);
    // Atualiza transcript com o texto completo antes de mudar estado
    if (text) {
      finalTranscriptRef.current = text;
      setTranscript(text);
    }
    setRecStateBoth(text ? 'done' : 'idle');
    interimTextRef.current = '';
    setInterimText('');
    setRecordSec(0);
    try { recognitionRef.current?.stop(); } catch { /* */ }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecStateBoth('idle');
    finalTranscriptRef.current = '';
    interimTextRef.current = '';
    setTranscript('');
    setInterimText('');
    setRecordSec(0);
    try { recognitionRef.current?.abort(); } catch { /* */ }
  };

  const handleReset = () => {
    cancelRecording();
    setAnalysis(null);
    setError('');
    setManualEdit(false);
  };

  // ──────────────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    const fullText = transcript.trim();
    if (!fullText || loading) return;
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const result = await model.generateContent(ANALYSIS_PROMPT(fullText));
      const text = result.response.text().trim();
      const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned) as Analysis;
      setAnalysis(parsed);

      addHistory({
        type: 'meeting_analysis',
        title: parsed.summary.slice(0, 60),
        subtitle: `Qualidade ${parsed.quality}/5`,
        preview: fullText.slice(0, 140),
        data: { transcript: fullText, analysis: parsed } as SavedMeeting,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(`A análise ficou indisponível. ${msg ? `(${msg})` : ''} Toque para tentar de novo.`);
    }
    setLoading(false);
  };

  const handleTranscriptChange = (v: string) => {
    setTranscript(v);
    finalTranscriptRef.current = v;
  };

  const buildShareText = () => {
    if (!analysis) return '';
    const parts = [`📋 RESUMO DA REUNIÃO`, analysis.summary, ''];
    if (analysis.participants.length) { parts.push('👥 Participantes:'); analysis.participants.forEach(p => parts.push(`• ${p}`)); parts.push(''); }
    if (analysis.objections.length)  { parts.push('💬 Objeções:'); analysis.objections.forEach(o => parts.push(`• ${o}`)); parts.push(''); }
    if (analysis.nextSteps.length)   { parts.push('✅ Próximos passos:'); analysis.nextSteps.forEach(s => parts.push(`• ${s}`)); parts.push(''); }
    if (analysis.nextAction)          { parts.push(`🎯 Próxima ação recomendada: ${analysis.nextAction}`); }
    return parts.join('\n');
  };

  const qualityLabel = (q: number) => {
    if (q >= 5) return { text: 'Excelente', color: 'excellent' };
    if (q >= 4) return { text: 'Boa', color: 'good' };
    if (q >= 3) return { text: 'Razoável', color: 'ok' };
    if (q >= 2) return { text: 'Difícil', color: 'bad' };
    return { text: 'Muito difícil', color: 'bad' };
  };

  // ── Resultado da análise ────────────────────────────────────────────────
  if (analysis) {
    const q = qualityLabel(analysis.quality);
    return (
      <div className="manalysis-page">
        <div className={`manalysis-quality card ${q.color}`}>
          <div className="quality-stars">
            {[1,2,3,4,5].map(i => <span key={i} className={`star ${i <= analysis.quality ? 'filled' : ''}`}>★</span>)}
          </div>
          <div className="quality-info">
            <span className="quality-label">{q.text}</span>
            <p className="quality-summary">{analysis.summary}</p>
          </div>
        </div>

        {analysis.participants.length > 0 && (
          <div className="manalysis-section card">
            <h4><Users size={15} /> Participantes</h4>
            <ul className="manalysis-list">{analysis.participants.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
        )}

        {analysis.objections.length > 0 && (
          <div className="manalysis-section card">
            <h4><Shield size={15} /> Objeções que surgiram</h4>
            <ul className="manalysis-list obj">{analysis.objections.map((o, i) => <li key={i}>{o}</li>)}</ul>
          </div>
        )}

        {analysis.nextSteps.length > 0 && (
          <div className="manalysis-section card">
            <h4><ArrowRight size={15} /> Próximos passos combinados</h4>
            <ul className="manalysis-list steps">{analysis.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}

        {analysis.warnings.length > 0 && (
          <div className="manalysis-section card warning">
            <h4><AlertTriangle size={15} /> Pontos de atenção</h4>
            <ul className="manalysis-list">{analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        )}

        {analysis.nextAction && (
          <div className="manalysis-next-action card">
            <Target size={18} />
            <div>
              <h4>Próxima ação recomendada</h4>
              <p>{analysis.nextAction}</p>
            </div>
          </div>
        )}

        {analysis.nextSteps.length > 0 && (
          <button
            className={`btn ${tasksCreated ? 'btn-copied' : 'btn-primary'} manalysis-create-tasks`}
            onClick={handleCreateTasks}
            disabled={tasksCreated}
          >
            {tasksCreated
              ? <><CheckSquare size={16} /> Tarefas criadas! Indo para o Dia...</>
              : <><CheckSquare size={16} /> Virar próximos passos em tarefas do dia</>}
          </button>
        )}

        <div className="manalysis-result-actions">
          <ShareButton text={buildShareText()} title="Resumo da reunião" size={16} />
          <SpeakButton text={buildShareText().replace(/[📋👥💬✅🎯•]/g, '')} size={16} />
        </div>

        <button className="btn btn-outline manalysis-reset" onClick={handleReset}>
          <RotateCcw size={14} /> Analisar outra reunião
        </button>
      </div>
    );
  }

  if (!isOnline) return <OfflineState feature="a Análise de Reunião" />;
  if (!API_KEY) return <OfflineState feature="a Análise de Reunião" subtitle="Configuração de IA indisponível. Fale com o suporte." />;

  // ── Tela de gravação ────────────────────────────────────────────────────
  return (
    <div className="manalysis-page">
      <div className="manalysis-hero card">
        <Mic size={26} />
        <div>
          <h3>Análise pós-reunião</h3>
          <p>Conte como foi a reunião em 1-2 minutos. A IA extrai resumo, objeções e próximos passos.</p>
        </div>
      </div>

      {!manualEdit ? (
        <>
          {/* Transcrição ao vivo / feita */}
          {(recState === 'recording' || recState === 'done') && (
            <div className="recorder-live-transcript card">
              <p>{transcript}<span className="interim">{interimText}</span></p>
            </div>
          )}

          {/* Se concluído: botões de editar/apagar */}
          {recState === 'done' && (
            <div className="recorder-done-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setManualEdit(true)}>
                <Edit3 size={12} /> Editar
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleReset}>
                <Trash2 size={12} /> Apagar
              </button>
            </div>
          )}

          {/* ── Barra do recorder estilo WhatsApp ── */}
          {recState === 'recording' ? (
            <div className="ma-wa-bar">
              {/* Cancelar */}
              <button className="ma-wa-cancel" onClick={cancelRecording} aria-label="Cancelar gravação">
                <Trash2 size={22} />
              </button>

              {/* Timer + Waveform */}
              <div className="ma-wa-center">
                <div className="ma-wa-timer">
                  <span className="ma-wa-dot" />
                  {formatTime(recordSec)}
                </div>
                <div className="ma-wa-bars" aria-hidden>
                  {BAR_DELAYS.map((delay, i) => (
                    <div
                      key={i}
                      className="ma-wa-bar"
                      style={{ animationDelay: `${delay}s`, animationDuration: `${BAR_DURS[i]}s` }}
                    />
                  ))}
                </div>
              </div>

              {/* Parar e confirmar */}
              <button className="ma-wa-stop" onClick={stopRecording} aria-label="Parar gravação">
                <Check size={24} strokeWidth={3} />
              </button>
            </div>
          ) : (
            /* Idle / Done — botão de mic grande */
            <div className="ma-mic-area">
              {recState === 'idle' && (
                <button className="manalysis-example" onClick={handleExample}>
                  <Lightbulb size={12} /> Ver exemplo
                </button>
              )}
              {recState === 'idle' && !manualEdit && (
                <button className="btn btn-outline btn-sm" onClick={() => setManualEdit(true)}>
                  <Edit3 size={12} /> Digitar
                </button>
              )}
              {hasSupport && recState === 'idle' && (
                <button className="ma-mic-btn" onClick={startRecording} aria-label="Iniciar gravação">
                  <Mic size={32} />
                  <span>Toque para gravar</span>
                </button>
              )}
              {!hasSupport && (
                <p className="ma-no-support">Gravação de voz não disponível neste navegador.</p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="form-group">
          <label className="manalysis-label">Relato da reunião</label>
          <textarea
            value={transcript}
            onChange={e => handleTranscriptChange(e.target.value)}
            rows={10}
            placeholder="Escreva aqui como foi a reunião..."
            className="manalysis-textarea"
          />
          <button className="btn btn-outline btn-sm mt-8" onClick={() => setManualEdit(false)}>
            ← Voltar
          </button>
        </div>
      )}

      <button
        className="btn btn-primary manalysis-analyze"
        onClick={handleAnalyze}
        disabled={!transcript.trim() || loading || recState === 'recording'}
      >
        {loading
          ? <><Sparkles size={16} className="spinning" /> Analisando...</>
          : <><Sparkles size={16} /> Analisar reunião</>}
      </button>

      {error && (
        <div className="manalysis-error card" onClick={handleAnalyze}>{error}</div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RotateCcw, Mic, Swords, Trash2, Check, Paperclip, X, FileText, Copy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendMessage, resetChat } from '../services/gemini';
import type { ImageAttachment, PriorMessage } from '../services/gemini';
import { loadData, saveData, KEYS } from '../services/storage';
import type { ChatMessage, UserProfile } from '../types';
import SpeakButton from '../components/SpeakButton';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import { getActiveOffers } from '../services/firestore/offers';
import { getActiveCompetitorOffers } from '../services/firestore/competitorOffers';
import './AICoach.css';

const QUICK_PROMPTS_VENDAS = [
  'Como responder à objeção de preço?',
  'Roteiro para ligação fria',
  'Técnicas de fechamento',
  'Como manter minha energia e foco durante o mês?',
  'Roteiro de reunião de vendas',
  'Como qualificar um cliente potencial?',
];

const QUICK_PROMPTS_MARKETING = [
  'Como criar uma campanha alinhada com a marca?',
  'Como avaliar se uma ação está no tom certo?',
  'Ideias para campanha de lançamento de produto',
  'Como fazer benchmark da concorrência?',
  'Estratégias para aumentar engajamento nas redes',
  'Como medir o ROI de uma ação de marketing?',
];

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function parseSuggestions(text: string): { clean: string; suggestions: string[] } {
  const match = text.match(/\[SUGESTÕES?:\s*(.+?)\]/i);
  if (!match) return { clean: text, suggestions: [] };
  const suggestions = match[1].split('|').map(s => s.trim()).filter(Boolean);
  const clean = text.replace(/\[SUGESTÕES?:\s*.+?\]/i, '').trim();
  return { clean, suggestions };
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Delays pseudo-aleatórios para a waveform
const BAR_DELAYS = [0, 0.15, 0.3, 0.08, 0.45, 0.22, 0.6, 0.38, 0.52, 0.12,
                    0.7, 0.28, 0.18, 0.55, 0.42, 0.65, 0.05, 0.35, 0.48, 0.75];
const BAR_DURS   = [0.8, 1.1, 0.7, 0.95, 1.2, 0.85, 0.75, 1.05, 0.9, 1.15,
                    0.8, 0.7, 1.0, 0.88, 0.78, 1.1, 0.95, 0.82, 1.0, 0.72];

export default function AICoach() {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnline();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const offersContextRef = useRef<string>('');
  // Histórico salvo — usado apenas na primeira mensagem da sessão para restaurar contexto na IA
  const priorHistoryRef = useRef<PriorMessage[]>(
    loadData<ChatMessage[]>(KEYS.CHAT_HISTORY, [])
      .filter(m => !m.attachmentName && !m.imagePreview) // só texto
      .slice(-40) // últimas 40 = 20 pares
      .map(m => ({ role: m.role, content: m.content }))
  );

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const accessType = profile.userAccessType || 'vendas';
  const locationState = location.state as { prefill?: string; aiMode?: 'vendas' | 'marketing' } | null;
  const defaultMode: 'vendas' | 'marketing' =
    locationState?.aiMode || (accessType === 'marketing' ? 'marketing' : 'vendas');
  const [aiMode, setAiMode] = useState<'vendas' | 'marketing'>(defaultMode);

  const isAmbos = accessType === 'ambos';
  const QUICK_PROMPTS = aiMode === 'marketing' ? QUICK_PROMPTS_MARKETING : QUICK_PROMPTS_VENDAS;

  // File attachment (image or PDF)
  const [attachedFile, setAttachedFile] = useState<{
    attachment: ImageAttachment;
    preview: string | null; // null for PDFs
    name: string;
    isPdf: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_MB = 15;

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`Arquivo muito grande. O limite é ${MAX_FILE_MB} MB.`);
      e.target.value = '';
      return;
    }
    const isPdf = file.type === 'application/pdf';
    const base64 = await readFileAsBase64(file);
    const preview = isPdf ? null : await readFileAsDataURL(file);
    setAttachedFile({ attachment: { base64, mimeType: file.type }, preview, name: file.name, isPdf });
    e.target.value = '';
  };

  // Recorder
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordSec, setRecordSec] = useState(0);
  const liveTranscriptRef = useRef('');
  const interimTextRef = useRef(''); // para capturar interim ao tocar ✅
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<(SpeechRecognition & { abort?: () => void }) | null>(null);
  const restartScheduledRef = useRef(false);

  const setRecordingBoth = (v: boolean) => {
    isRecordingRef.current = v;
    setIsRecording(v);
  };

  const handleModeSwitch = (mode: 'vendas' | 'marketing') => {
    if (mode === aiMode) return;
    setAiMode(mode);
    setMessages([]);
    setSuggestions([]);
    priorHistoryRef.current = [];
    saveData(KEYS.CHAT_HISTORY, []);
    resetChat();
  };

  useEffect(() => {
    setMessages(loadData(KEYS.CHAT_HISTORY, []));

    // Carrega ofertas ativas + concorrência para retroalimentar a IA
    Promise.all([
      getActiveOffers(profile.segment || undefined).catch(() => []),
      getActiveCompetitorOffers(profile.segment || undefined).catch(() => []),
    ]).then(([offers, compOffers]) => {
      const parts: string[] = [];
      if (offers.length > 0) {
        parts.push([
          '📢 NOSSAS OFERTAS ATIVAS DO MÊS (use para ajudar o vendedor com clientes):',
          ...offers.map(o => [
            `• ${o.title} (válido até ${o.validTo})`,
            `  ${o.description}`,
            o.highlights.length ? `  Destaques: ${o.highlights.join(' | ')}` : '',
            o.pitch ? `  Pitch sugerido: "${o.pitch}"` : '',
          ].filter(Boolean).join('\n')),
        ].join('\n'));
      }
      if (compOffers.length > 0) {
        parts.push([
          '🔴 OFERTAS DA CONCORRÊNCIA ATIVAS (use para preparar contra-argumentos):',
          ...compOffers.map(o => [
            `• ${o.competitor}: ${o.title} (válido até ${o.validTo})`,
            `  ${o.description}`,
            o.highlights.length ? `  Destaques deles: ${o.highlights.join(' | ')}` : '',
            o.ourAdvantages.length ? `  Nossas vantagens: ${o.ourAdvantages.join(' | ')}` : '',
          ].filter(Boolean).join('\n')),
        ].join('\n'));
      }
      if (parts.length > 0) {
        offersContextRef.current = parts.join('\n\n');
      }
    });

    // Prefill vindo de Ofertas ou do TrainingHub de Marketing
    const prefill = locationState?.prefill;
    if (prefill) setInput(prefill);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    const file = text ? null : attachedFile; // quick prompts / voice don't use attachment
    if ((!msg && !file) || loading) return;

    // Clear attachment before async work
    if (!text) setAttachedFile(null);

    const displayMsg = msg || (file ? `📎 ${file.name}` : '');
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: displayMsg,
      timestamp: Date.now(),
      imagePreview: file?.preview ?? undefined,
      attachmentName: file?.name,
      attachmentMime: file?.attachment.mimeType,
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setSuggestions([]);
    setLoading(true);

    // Injeta contexto das ofertas na primeira mensagem
    const effectiveMsg = msg || (file?.isPdf ? 'Analise esse documento PDF e me dê sua avaliação.' : 'Analise essa imagem e me dê sua avaliação.');
    const offerCtx = offersContextRef.current;
    const withOffers = offerCtx && messages.length === 0
      ? `${offerCtx}\n\n---\n${effectiveMsg}`
      : effectiveMsg;
    const sugLabel = aiMode === 'marketing'
      ? '(Ao final da resposta, inclua exatamente neste formato: [SUGESTÕES: pergunta 1 | pergunta 2 | pergunta 3] com 2-3 perguntas de acompanhamento sobre marketing, branding ou campanhas)'
      : '(Ao final da resposta, inclua exatamente neste formato: [SUGESTÕES: pergunta 1 | pergunta 2 | pergunta 3] com 2-3 perguntas que o vendedor poderia fazer ao cliente em seguida)';
    const withSuggestions = withOffers + '\n\n' + sugLabel;

    try {
      // Passa histórico anterior apenas na primeira mensagem da sessão (restaura contexto)
      const prior = priorHistoryRef.current;
      priorHistoryRef.current = []; // limpa após primeira chamada — Gemini já tem o contexto
      const response = await sendMessage(withSuggestions, API_KEY, aiMode, file?.attachment ?? undefined, prior);
      const { clean, suggestions: newSug } = parseSuggestions(response);
      setSuggestions(newSug);

      const assistantMsg: ChatMessage = { id: generateId(), role: 'assistant', content: clean, timestamp: Date.now() };
      const final = [...updated, assistantMsg];
      setMessages(final);
      saveData(KEYS.CHAT_HISTORY, final);

      if (autoSpeak && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(clean.replace(/\*\*/g, '').replace(/\*/g, ''));
        utterance.lang = 'pt-BR';
        utterance.rate = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang.startsWith('pt'));
        if (ptVoice) utterance.voice = ptVoice;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Erro ao processar';
      const errorMsg: ChatMessage = { id: generateId(), role: 'assistant', content: `Desculpe, ocorreu um erro: ${errMsg}`, timestamp: Date.now() };
      const final = [...updated, errorMsg];
      setMessages(final);
      saveData(KEYS.CHAT_HISTORY, final);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setSuggestions([]);
    priorHistoryRef.current = [];
    saveData(KEYS.CHAT_HISTORY, []);
    resetChat();
  };

  const handleCopy = (msg: ChatMessage) => {
    const plain = msg.content.replace(/\*\*/g, '').replace(/\*/g, '');
    navigator.clipboard.writeText(plain).then(() => {
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      // fallback: criar textarea temporário
      const ta = document.createElement('textarea');
      ta.value = plain;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Recorder ──────────────────────────────────────────────────────────────

  const startRecognitionSession = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          liveTranscriptRef.current += event.results[i][0].transcript + ' ';
          interimTextRef.current = '';
          setLiveTranscript(liveTranscriptRef.current);
          setInterimText('');
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (interim) {
        interimTextRef.current = interim;
        setInterimText(interim);
      }
    };

    rec.onerror = () => { /* onend will handle */ };

    rec.onend = () => {
      setInterimText('');
      // Se isRecordingRef já é false, foi o stopAndSend/cancelRecording que agiu — ignora
      if (!isRecordingRef.current) return;
      // Auto-reinicia para gravação contínua
      if (!restartScheduledRef.current) {
        restartScheduledRef.current = true;
        setTimeout(() => {
          restartScheduledRef.current = false;
          if (isRecordingRef.current) startRecognitionSession();
        }, 150);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* já em execução */ }
  };

  const startRecording = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    liveTranscriptRef.current = '';
    setLiveTranscript('');
    setInterimText('');
    setRecordSec(0);
    setRecordingBoth(true);

    timerRef.current = setInterval(() => setRecordSec(s => s + 1), 1000);
    startRecognitionSession();
  };

  const stopAndSend = () => {
    // Captura final + interim (caso o usuário toque ✅ enquanto ainda está falando)
    const text = (liveTranscriptRef.current + ' ' + interimTextRef.current).trim();
    // Marca como "não gravando" — onend não vai reiniciar
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingBoth(false);
    liveTranscriptRef.current = '';
    interimTextRef.current = '';
    setLiveTranscript('');
    setInterimText('');
    setRecordSec(0);
    try { recognitionRef.current?.stop(); } catch { /* */ }
    if (text) {
      setAutoSpeak(true);
      handleSend(text);
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingBoth(false);
    liveTranscriptRef.current = '';
    interimTextRef.current = '';
    setLiveTranscript('');
    setInterimText('');
    setRecordSec(0);
    try { recognitionRef.current?.abort?.(); } catch { /* */ }
  };

  // ──────────────────────────────────────────────────────────────────────────

  const formatMessage = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

  const hasSpeechRecognition = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  if (!isOnline) return <OfflineState feature="o Consultor" />;
  if (!API_KEY) return <OfflineState feature="o Consultor" subtitle="Serviço indisponível no momento. Fale com o suporte." />;

  const modeSwitcher = isAmbos ? (
    <div className="ai-mode-toggle">
      <button
        className={`ai-mode-btn ${aiMode === 'vendas' ? 'active' : ''}`}
        onClick={() => handleModeSwitch('vendas')}
      >
        Consultor de Vendas
      </button>
      <button
        className={`ai-mode-btn ${aiMode === 'marketing' ? 'active' : ''}`}
        onClick={() => handleModeSwitch('marketing')}
      >
        Consultor de Marketing
      </button>
    </div>
  ) : null;

  return (
    <div className="ai-coach-page">
      {messages.length === 0 ? (
        <div className="ai-welcome">
          {modeSwitcher}
          <div className="ai-welcome-icon"><Sparkles size={40} /></div>
          <h3>{aiMode === 'marketing' ? 'Consultor de Marketing' : 'Consultor de Vendas'}</h3>
          <p>{aiMode === 'marketing'
            ? 'Tire dúvidas sobre campanhas, branding, benchmarks e estratégia de marketing.'
            : 'Tire dúvidas sobre vendas, negociação e liderança comercial.'
          }</p>

          {aiMode === 'vendas' && (
            <button className="roleplay-cta" onClick={() => navigate('/treino')}>
              <Swords size={18} />
              <span>Treinar objeções com simulação</span>
            </button>
          )}

          <div className="quick-prompts">
            <p className="quick-label">Sugestões rápidas:</p>
            {QUICK_PROMPTS.map(prompt => (
              <button key={prompt} className="quick-btn" onClick={() => handleSend(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages">
          {modeSwitcher}
          <button className="clear-chat" onClick={handleClear}>
            <RotateCcw size={12} /> Nova conversa
          </button>
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role}`}>
              {msg.role === 'assistant' && <div className="msg-avatar"><Sparkles size={14} /></div>}
              <div className="msg-bubble">
                {msg.imagePreview && (
                  <img className="coach-msg-img" src={msg.imagePreview} alt={msg.attachmentName || 'imagem'} />
                )}
                {!msg.imagePreview && msg.attachmentMime === 'application/pdf' && (
                  <div className="coach-pdf-badge">
                    <FileText size={14} />
                    <span>{msg.attachmentName}</span>
                  </div>
                )}
                <div
                  className="msg-content"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                {msg.role === 'assistant' && (
                  <div className="msg-actions">
                    <SpeakButton text={msg.content.replace(/\*\*/g, '').replace(/\*/g, '')} size={14} />
                    <button
                      className={`msg-copy-btn${copiedId === msg.id ? ' copied' : ''}`}
                      onClick={() => handleCopy(msg)}
                      title="Copiar resposta"
                    >
                      {copiedId === msg.id
                        ? <><Check size={12} /> Copiado</>
                        : <><Copy size={12} /> Copiar</>
                      }
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {suggestions.length > 0 && !loading && (
            <div className="suggestions">
              {suggestions.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="message assistant">
              <div className="msg-avatar"><Sparkles size={14} /></div>
              <div className="msg-content typing">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ── Barra de gravação estilo WhatsApp ── */}
      {isRecording ? (
        <>
          {/* Prévia da transcrição ao vivo */}
          {(liveTranscript || interimText) && (
            <div className="wa-live-preview">
              {liveTranscript}
              <span className="wa-interim">{interimText}</span>
            </div>
          )}

          <div className="wa-recorder-bar">
            {/* Cancelar */}
            <button className="wa-cancel-btn" onClick={cancelRecording} aria-label="Cancelar gravação">
              <Trash2 size={22} />
            </button>

            {/* Timer + Waveform */}
            <div className="wa-rec-center">
              <div className="wa-timer">
                <span className="wa-rec-dot" />
                {formatTime(recordSec)}
              </div>
              <div className="wa-bars" aria-hidden>
                {BAR_DELAYS.map((delay, i) => (
                  <div
                    key={i}
                    className="wa-bar"
                    style={{ animationDelay: `${delay}s`, animationDuration: `${BAR_DURS[i]}s` }}
                  />
                ))}
              </div>
            </div>

            {/* Enviar */}
            <button className="wa-send-btn" onClick={stopAndSend} aria-label="Parar e enviar">
              <Check size={24} strokeWidth={3} />
            </button>
          </div>
        </>
      ) : (
        <div className="input-area">
          {/* File attachment preview */}
          {attachedFile && (
            <div className="coach-attach-preview">
              {attachedFile.isPdf
                ? <div className="coach-attach-pdf-icon"><FileText size={20} /></div>
                : <img src={attachedFile.preview!} alt="anexo" className="coach-attach-thumb" />
              }
              <span className="coach-attach-name">{attachedFile.name}</span>
              <button className="coach-attach-remove" onClick={() => setAttachedFile(null)} aria-label="Remover arquivo">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="input-wrapper">
            {/* Hidden file input — images + PDFs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileAttach}
            />
            {/* Attach button */}
            <button
              className="coach-img-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Anexar imagem ou PDF"
              disabled={loading}
            >
              <Paperclip size={18} />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={aiMode === 'marketing' ? 'Pergunte sobre marketing...' : 'Pergunte sobre vendas...'}
              disabled={loading}
            />
            {/* Mic quando sem texto e sem arquivo; Send caso contrário */}
            {!input.trim() && !attachedFile && hasSpeechRecognition ? (
              <button className="mic-btn" onClick={startRecording} aria-label="Gravar mensagem de voz">
                <Mic size={20} />
              </button>
            ) : (
              <button className="send-btn" onClick={() => handleSend()} disabled={(!input.trim() && !attachedFile) || loading} aria-label="Enviar mensagem">
                <Send size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

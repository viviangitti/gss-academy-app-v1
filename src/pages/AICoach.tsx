import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RotateCcw, Mic, Swords, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendMessage, resetChat } from '../services/gemini';
import { loadData, saveData, KEYS } from '../services/storage';
import type { ChatMessage } from '../types';
import SpeakButton from '../components/SpeakButton';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './AICoach.css';

const QUICK_PROMPTS = [
  'Como responder à objeção de preço?',
  'Roteiro para ligação fria',
  'Técnicas de fechamento',
  'Como manter minha energia e foco durante o mês?',
  'Roteiro de reunião de vendas',
  'Como qualificar um cliente potencial?',
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

// Delays pseudo-aleatórios para a waveform
const BAR_DELAYS = [0, 0.15, 0.3, 0.08, 0.45, 0.22, 0.6, 0.38, 0.52, 0.12,
                    0.7, 0.28, 0.18, 0.55, 0.42, 0.65, 0.05, 0.35, 0.48, 0.75];
const BAR_DURS   = [0.8, 1.1, 0.7, 0.95, 1.2, 0.85, 0.75, 1.05, 0.9, 1.15,
                    0.8, 0.7, 1.0, 0.88, 0.78, 1.1, 0.95, 0.82, 1.0, 0.72];

export default function AICoach() {
  const navigate = useNavigate();
  const isOnline = useOnline();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setMessages(loadData(KEYS.CHAT_HISTORY, []));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: msg, timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setSuggestions([]);
    setLoading(true);

    const withSuggestions = msg + '\n\n(Ao final da resposta, inclua exatamente neste formato: [SUGESTÕES: pergunta 1 | pergunta 2 | pergunta 3] com 2-3 perguntas que o vendedor poderia fazer ao cliente em seguida)';

    try {
      const response = await sendMessage(withSuggestions, API_KEY);
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
    saveData(KEYS.CHAT_HISTORY, []);
    resetChat();
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

  if (!isOnline) return <OfflineState feature="o Coach de IA" />;
  if (!API_KEY) return <OfflineState feature="o Coach de IA" subtitle="Configuração de IA indisponível. Fale com o suporte." />;

  return (
    <div className="ai-coach-page">
      {messages.length === 0 ? (
        <div className="ai-welcome">
          <div className="ai-welcome-icon"><Sparkles size={40} /></div>
          <h3>Pergunte ao Especialista</h3>
          <p>Tire dúvidas sobre vendas, negociação e liderança comercial.</p>

          <button className="roleplay-cta" onClick={() => navigate('/treino')}>
            <Swords size={18} />
            <span>Treinar objeções com simulação</span>
          </button>

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
          <button className="clear-chat" onClick={handleClear}>
            <RotateCcw size={12} /> Nova conversa
          </button>
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role}`}>
              {msg.role === 'assistant' && <div className="msg-avatar"><Sparkles size={14} /></div>}
              <div className="msg-bubble">
                <div
                  className="msg-content"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                {msg.role === 'assistant' && (
                  <div className="msg-actions">
                    <SpeakButton text={msg.content.replace(/\*\*/g, '').replace(/\*/g, '')} size={14} />
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
          <div className="input-wrapper">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre vendas..."
              disabled={loading}
            />
            {/* Mic aparece quando não há texto; Send aparece quando há texto */}
            {!input.trim() && hasSpeechRecognition ? (
              <button className="mic-btn" onClick={startRecording} aria-label="Gravar mensagem de voz">
                <Mic size={20} />
              </button>
            ) : (
              <button className="send-btn" onClick={() => handleSend()} disabled={!input.trim() || loading}>
                <Send size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

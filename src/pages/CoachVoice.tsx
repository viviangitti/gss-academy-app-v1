import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Type } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendMessage } from '../services/gemini';
import type { PriorMessage } from '../services/gemini';
import { loadData, saveData, KEYS } from '../services/storage';
import { buildMemoryContext, remember, refreshTeamCases } from '../services/memory';
import type { UserProfile } from '../types';
import './CoachVoice.css';

interface ThreadMsg { id: string; role: 'user' | 'assistant'; content: string; timestamp: number; }
const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

const HINTS: Record<OrbState, string> = {
  idle: 'Toque para falar',
  listening: 'Ouvindo… toque para enviar',
  thinking: 'Pensando…',
  speaking: 'Toque para parar',
};

export default function CoachVoice() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const aiMode: 'vendas' | 'marketing' =
    profile.userAccessType === 'marketing' ? 'marketing' : 'vendas';

  const [state, setState] = useState<OrbState>('idle');
  const [heard, setHeard] = useState('');      // o que o usuário falou (interim/final)
  const [reply, setReply] = useState('');      // resposta da IA (texto pequeno)

  const recognitionRef = useRef<(SpeechRecognition & { abort?: () => void }) | null>(null);
  const finalRef = useRef('');
  const stateRef = useRef<OrbState>('idle');
  const setOrb = (s: OrbState) => { stateRef.current = s; setState(s); };

  // Continua o MESMO fio do Coach de texto (memória compartilhada): carrega o histórico salvo
  const priorHistoryRef = useRef<PriorMessage[]>(
    loadData<ThreadMsg[]>(KEYS.CHAT_HISTORY, []).map(m => ({ role: m.role, content: m.content }))
  );

  const hasSpeech = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // ── Fala (TTS) ──
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) { setOrb('idle'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*_#]/g, ''));
    u.lang = 'pt-BR';
    u.rate = 1.0;
    const v = window.speechSynthesis.getVoices().find(x => x.lang.startsWith('pt'));
    if (v) u.voice = v;
    u.onend = () => setOrb('idle');
    u.onerror = () => setOrb('idle');
    setOrb('speaking');
    window.speechSynthesis.speak(u);
  }, []);

  // ── Envia o texto pra IA ──
  const ask = useCallback(async (text: string) => {
    if (!text.trim()) { setOrb('idle'); return; }
    setOrb('thinking');
    setReply('');
    try {
      // memória + continuidade: injeta o que o app sabe e o fio anterior (1ª chamada)
      const memCtx = buildMemoryContext();
      remember(text, 'voz');
      const prior = priorHistoryRef.current;
      priorHistoryRef.current = [];
      const raw = await sendMessage(text, API_KEY, aiMode, undefined, prior, memCtx);
      const clean = raw.replace(/\[SUGEST[ÕO]ES?:.*?\]/is, '').trim();
      // persiste no MESMO histórico do Coach de texto (fio único)
      const thread = loadData<ThreadMsg[]>(KEYS.CHAT_HISTORY, []);
      thread.push({ id: newId(), role: 'user', content: text, timestamp: Date.now() });
      thread.push({ id: newId(), role: 'assistant', content: clean, timestamp: Date.now() });
      saveData(KEYS.CHAT_HISTORY, thread.slice(-60));
      setReply(clean);
      speak(clean);
    } catch {
      const err = 'Tive um problema pra responder. Tenta de novo.';
      setReply(err);
      speak(err);
    }
  }, [aiMode, speak]);

  // ── Ouvir (Speech Recognition) ──
  const startListening = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    window.speechSynthesis?.cancel();
    finalRef.current = '';
    setHeard('');
    setReply('');
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setHeard((finalRef.current + interim).trim());
    };
    rec.onerror = () => {};
    recognitionRef.current = rec;
    try { rec.start(); setOrb('listening'); } catch { /* já rodando */ }
  };

  const stopAndSend = () => {
    try { recognitionRef.current?.stop(); } catch { /* */ }
    const text = (finalRef.current || heard).trim();
    ask(text);
  };

  // ── Toque no orb: alterna estado ──
  const handleTap = () => {
    if (state === 'idle') startListening();
    else if (state === 'listening') stopAndSend();
    else if (state === 'speaking') { window.speechSynthesis?.cancel(); setOrb('idle'); }
    // thinking: ignora toque
  };

  // Pré-carrega vozes (alguns navegadores precisam)
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    refreshTeamCases(); // cérebro coletivo em background
    return () => {
      try { recognitionRef.current?.abort?.(); } catch { /* */ }
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!hasSpeech) {
    return (
      <div className="cv-page">
        <div className="cv-fallback">
          <p>Seu navegador não suporta voz. Use o Coaching por texto.</p>
          <button onClick={() => navigate('/ia-coach')}>Ir para o Coaching</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`cv-page cv-${state}`}>
      <div className="cv-mode">{aiMode === 'marketing' ? 'Coach de Marketing' : 'Coach de Vendas'}</div>

      {/* Orb */}
      <button className={`cv-orb cv-orb--${state}`} onClick={handleTap} aria-label={HINTS[state]}>
        <span className="cv-orb-core">
          {state === 'thinking'
            ? <span className="cv-dots"><i /><i /><i /></span>
            : state === 'listening'
              ? <Square size={26} fill="currentColor" />
              : <Mic size={32} />}
        </span>
        {(state === 'listening' || state === 'speaking') && (
          <>
            <span className="cv-ring cv-ring-1" />
            <span className="cv-ring cv-ring-2" />
            <span className="cv-ring cv-ring-3" />
          </>
        )}
      </button>

      <p className="cv-hint">{HINTS[state]}</p>

      {/* Transcrição mínima */}
      {heard && state !== 'speaking' && (
        <p className="cv-heard">"{heard}"</p>
      )}
      {reply && (state === 'speaking' || state === 'idle') && (
        <div className="cv-reply"><p>{reply}</p></div>
      )}

      {/* Alternar para texto */}
      <button className="cv-text-btn" onClick={() => navigate('/ia-coach')}>
        <Type size={14} /> Prefiro digitar
      </button>
    </div>
  );
}

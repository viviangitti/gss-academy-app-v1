import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Swords, Star, RotateCcw, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getObjections } from '../services/content';
import { loadData, KEYS } from '../services/storage';
import { addHistory } from '../services/history';
import type { UserProfile } from '../types';
import type { Objection } from '../services/content';
import './CoachVoice.css';
import './RolePlayVoice.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const ROLEPLAY_PROMPT = `Você é um cliente DIFÍCIL em uma simulação de vendas por voz. Seu papel:
1. Você recebeu uma objeção para simular. MANTENHA essa objeção.
2. Quando o vendedor responder, NÃO aceite fácil. Complique, questione, insista.
3. Seja realista — aja como um cliente real agiria numa conversa falada.
4. Após 3-4 trocas, aceite gradualmente se o vendedor for convincente.
5. NUNCA quebre o personagem. Você é o cliente, não um assistente.
6. Fale em português brasileiro, de forma natural e CURTA (1-2 frases), como numa conversa real.
7. Não use asteriscos, emojis nem formatação — é fala.
IMPORTANTE: Não dê dicas ao vendedor durante a simulação.`;

const EVALUATOR_PROMPT = `Você é um avaliador de vendas da MAESTR.IA. Analise a conversa de treino do vendedor (que tentou contornar a objeção do cliente) e devolva uma análise CLARA e ACIONÁVEL, em português brasileiro, EXATAMENTE neste formato (sem texto fora dele):

**Nota: X/10**
(1 frase dizendo o porquê da nota)

**Você foi bem em:**
• ... (2 pontos concretos, citando o que o vendedor realmente falou)

**Onde dava pra ir melhor — e como:**
• ... (2 pontos: aponte o MOMENTO da conversa e diga exatamente o que dizer/fazer no lugar)

**A virada que faltou:**
"..." (a melhor resposta pra essa objeção, pronta pra falar — defendendo valor, não desconto)

**Próximo foco:**
... (1 frase do que treinar na próxima)

Seja específico e direto, baseado no que REALMENTE aconteceu na conversa — nada genérico.`;

type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';
const HINTS: Record<OrbState, string> = {
  idle: 'Toque e responda ao cliente',
  listening: 'Ouvindo… toque para enviar',
  thinking: 'O cliente está pensando…',
  speaking: 'Cliente falando…',
};

export default function RolePlayVoice() {
  const navigate = useNavigate();
  const [objections, setObjections] = useState<Objection[]>([]);
  const [selected, setSelected] = useState<Objection | null>(null);
  const [state, setState] = useState<OrbState>('idle');
  const [heard, setHeard] = useState('');         // sua última fala
  const [clientLine, setClientLine] = useState(''); // última fala do cliente
  const [exchanges, setExchanges] = useState(0);
  const [evaluation, setEvaluation] = useState<string | null>(null);

  const chatRef = useRef<ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['startChat']> | null>(null);
  const recognitionRef = useRef<(SpeechRecognition & { abort?: () => void }) | null>(null);
  const finalRef = useRef('');
  const transcriptRef = useRef<{ role: 'user' | 'client'; content: string }[]>([]);
  const exchangesRef = useRef(0);
  const evaluatedRef = useRef(false);

  const setOrb = (s: OrbState) => setState(s);

  const hasSpeech = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    setObjections(getObjections(profile.segment).filter(o => !o.stage));
    window.speechSynthesis?.getVoices();
    return () => {
      try { recognitionRef.current?.abort?.(); } catch { /* */ }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = useCallback((text: string, after?: () => void) => {
    if (!('speechSynthesis' in window)) { setOrb('idle'); after?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*_#"]/g, ''));
    u.lang = 'pt-BR';
    u.rate = 1.02;
    const v = window.speechSynthesis.getVoices().find(x => x.lang.startsWith('pt'));
    if (v) u.voice = v;
    u.onend = () => { setOrb('idle'); after?.(); };
    u.onerror = () => { setOrb('idle'); after?.(); };
    setOrb('speaking');
    window.speechSynthesis.speak(u);
  }, []);

  const startTraining = async (obj: Objection) => {
    setSelected(obj);
    setHeard(''); setClientLine(''); setEvaluation(null);
    setExchanges(0); exchangesRef.current = 0;
    transcriptRef.current = [];
    evaluatedRef.current = false;
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    chatRef.current = model.startChat({
      history: [
        { role: 'user', parts: [{ text: ROLEPLAY_PROMPT + `\n\nA objeção que você deve simular é: ${obj.objection}` }] },
        { role: 'model', parts: [{ text: `Entendido. Sou o cliente. Vou levantar a objeção e dificultar.` }] },
      ],
    });
    setOrb('thinking');
    try {
      const r = await chatRef.current.sendMessage(`Comece. Diga a objeção "${obj.objection}" de forma natural, como um cliente real falaria.`);
      const line = r.response.text();
      transcriptRef.current.push({ role: 'client', content: line });
      setClientLine(line);
      speak(line);
    } catch {
      const line = `Olha, ${obj.objection.replace(/"/g, '')}. Não sei se faz sentido pra mim agora.`;
      setClientLine(line);
      speak(line);
    }
  };

  const evaluate = async () => {
    if (evaluatedRef.current) return;       // evita avaliar 2x (auto + botão + fallback)
    evaluatedRef.current = true;
    try { recognitionRef.current?.stop(); } catch { /* */ }
    window.speechSynthesis?.cancel();
    setOrb('thinking');
    setClientLine('');
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const conversation = transcriptRef.current
        .map(m => `${m.role === 'user' ? 'Vendedor' : 'Cliente'}: ${m.content}`).join('\n');
      const r = await model.generateContent(`${EVALUATOR_PROMPT}\n\nObjeção: ${selected?.objection}\n\nConversa:\n${conversation}`);
      const text = r.response.text();
      setEvaluation(text);
      setOrb('idle');
      const score = text.match(/Nota:?\s*(\d+)\s*\/\s*10/i)?.[1];
      addHistory({
        type: 'simulator_session',
        title: `Treino por voz: ${selected?.objection || ''}`,
        subtitle: score ? `Nota ${score}/10` : 'Treino concluído',
        preview: conversation.slice(0, 140),
        data: { score: score ? parseInt(score) : null, evaluation: text, conversation, objection: selected?.objection },
      });
    } catch {
      setEvaluation('A avaliação ficou indisponível. Tente treinar de novo.');
      setOrb('idle');
    }
  };

  const sendToClient = async (text: string) => {
    if (!text.trim() || !chatRef.current) { setOrb('idle'); return; }
    transcriptRef.current.push({ role: 'user', content: text });
    const n = exchangesRef.current + 1;
    exchangesRef.current = n; setExchanges(n);
    setOrb('thinking');
    try {
      const r = await chatRef.current.sendMessage(text);
      const line = r.response.text();
      transcriptRef.current.push({ role: 'client', content: line });
      if (n >= 4) {
        // cliente dá a última fala, depois avalia.
        // Fallback: se o "fim da fala" (TTS) não disparar (comum no celular),
        // a avaliação acontece mesmo assim em alguns segundos.
        setClientLine(line);
        speak(line, () => evaluate());
        setTimeout(() => evaluate(), 12000);
      } else {
        setClientLine(line);
        speak(line);
      }
    } catch {
      const line = 'Hmm, não me convenceu ainda. Tem algo mais concreto?';
      setClientLine(line);
      speak(line);
    }
  };

  const startListening = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    window.speechSynthesis?.cancel();
    finalRef.current = ''; setHeard('');
    const rec = new SpeechRec();
    rec.lang = 'pt-BR'; rec.continuous = true; rec.interimResults = true;
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
    try { rec.start(); setOrb('listening'); } catch { /* */ }
  };

  const handleTap = () => {
    if (evaluation) return;
    if (state === 'idle') startListening();
    else if (state === 'listening') {
      try { recognitionRef.current?.stop(); } catch { /* */ }
      sendToClient((finalRef.current || heard).trim());
    } else if (state === 'speaking') {
      window.speechSynthesis?.cancel(); setOrb('idle');
    }
  };

  const reset = () => {
    window.speechSynthesis?.cancel();
    setSelected(null); setEvaluation(null); setClientLine(''); setHeard('');
    setExchanges(0); exchangesRef.current = 0; chatRef.current = null;
    evaluatedRef.current = false;
  };

  const fmt = (t: string) => t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  if (!hasSpeech) {
    return (
      <div className="cv-page"><div className="cv-fallback">
        <p>Seu navegador não suporta voz. Use o Treino por texto.</p>
        <button onClick={() => navigate('/treino')}>Ir para o Treino</button>
      </div></div>
    );
  }

  // Tela de seleção de objeção
  if (!selected) {
    return (
      <div className="rpv-select">
        <div className="rpv-hero"><Swords size={26} /><div>
          <h3>Treino falado</h3>
          <p>O cliente vai te desafiar por voz. Responda falando.</p>
        </div></div>
        <h4 className="rpv-label">Escolha a objeção pra treinar:</h4>
        <div className="rpv-list">
          {objections.map(o => (
            <button key={o.id} className="rpv-obj card" onClick={() => startTraining(o)}>
              <span>{o.objection}</span><Mic size={16} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Tela de avaliação
  if (evaluation) {
    return (
      <div className="rpv-eval-page">
        <div className="evaluation-card card">
          <div className="eval-header"><Star size={20} /><h4>Avaliação do treino</h4></div>
          <div className="eval-content" dangerouslySetInnerHTML={{ __html: fmt(evaluation) }} />
          <button className="btn btn-primary" onClick={reset} style={{ marginTop: 14, width: '100%' }}>
            <RotateCcw size={16} /> Treinar outra objeção
          </button>
        </div>
      </div>
    );
  }

  // Tela do orb (cliente falando)
  return (
    <div className={`cv-page cv-${state}`}>
      <button className="rpv-back" onClick={reset}><ChevronLeft size={16} /> Trocar objeção</button>
      <div className="cv-mode">Cliente · objeção: {selected.objection}</div>
      <div className="rpv-progress">Rodada {Math.min(exchanges + 1, 4)} de 4</div>

      <button className={`cv-orb cv-orb--${state}`} onClick={handleTap} aria-label={HINTS[state]}>
        <span className="cv-orb-core rpv-client-core">
          {state === 'thinking'
            ? <span className="cv-dots"><i /><i /><i /></span>
            : state === 'listening'
              ? <Square size={26} fill="currentColor" />
              : <span className="rpv-face">🙎</span>}
        </span>
        {(state === 'listening' || state === 'speaking') && (
          <><span className="cv-ring cv-ring-1" /><span className="cv-ring cv-ring-2" /><span className="cv-ring cv-ring-3" /></>
        )}
      </button>

      <p className="cv-hint">{HINTS[state]}</p>
      {clientLine && state !== 'listening' && <p className="cv-heard">Cliente: "{clientLine}"</p>}
      {heard && state === 'listening' && <p className="cv-heard">Você: "{heard}"</p>}

      {exchanges >= 1 && state !== 'thinking' && (
        <button className="rpv-finish" onClick={evaluate}>
          <Star size={15} /> Encerrar e ver análise
        </button>
      )}

      <button className="cv-text-btn" onClick={() => navigate('/treino')}>Prefiro treinar por texto</button>
    </div>
  );
}

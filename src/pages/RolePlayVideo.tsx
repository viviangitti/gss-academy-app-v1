import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Square, Star, RotateCcw, Camera } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getObjections } from '../services/content';
import { loadData, KEYS } from '../services/storage';
import { addHistory } from '../services/history';
import type { UserProfile } from '../types';
import type { Objection } from '../services/content';
import './RolePlayVoice.css';
import './RolePlayVideo.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MAX_SEC = 60;

const EVAL_PROMPT = `Você é um coach de vendas da MAESTR.IA avaliando um VÍDEO de treino. O vendedor aparece e FALA respondendo a uma objeção de cliente. Analise tanto a ENTREGA (ritmo, clareza, vícios de linguagem como "né/tipo/então/aham", confiança, energia, postura/olhar) quanto a MENSAGEM (qualidade do argumento; se defende VALOR em vez de apelar pro desconto).

Responda EXATAMENTE neste formato, em português brasileiro, sem texto fora dele:

**Nota: X/10**
(1 frase do porquê)

**Você foi bem em:**
• ... (2 pontos concretos do que viu/ouviu)

**Entrega — pra melhorar:**
• ... (2 pontos específicos: ritmo, vícios, confiança, postura)

**Mensagem — pra melhorar:**
• ... (1-2 pontos do argumento)

**A virada que faltou:**
"..." (a melhor resposta pra essa objeção, pronta pra falar — defendendo valor)

**Próximo foco:**
... (1 frase)

Seja específico e direto, baseado no que realmente aconteceu no vídeo.`;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

type Phase = 'select' | 'ready' | 'recording' | 'analyzing' | 'done';

export default function RolePlayVideo() {
  const navigate = useNavigate();
  const [objections, setObjections] = useState<Objection[]>([]);
  const [selected, setSelected] = useState<Objection | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [sec, setSec] = useState(0);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef('video/webm');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
    && typeof window !== 'undefined' && 'MediaRecorder' in window;

  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    setObjections(getObjections(profile.segment).filter(o => !o.stage));
    return () => stopStream();
  }, []);

  const stopStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { /* */ }
    streamRef.current = null;
  };

  const pickObjection = async (obj: Objection) => {
    setSelected(obj);
    setError('');
    setEvaluation(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; videoRef.current.play().catch(() => {}); }
      setPhase('ready');
    } catch {
      setError('Não consegui acessar a câmera/microfone. Verifique a permissão do navegador.');
      setPhase('select'); setSelected(null);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    const mime = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
    mimeRef.current = mime || 'video/webm';
    const rec = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => analyze();
    recRef.current = rec;
    rec.start();
    setSec(0); setPhase('recording');
    timerRef.current = setInterval(() => {
      setSec(s => {
        if (s + 1 >= MAX_SEC) stopRecording();
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try { recRef.current?.state !== 'inactive' && recRef.current?.stop(); } catch { /* */ }
  };

  const analyze = async () => {
    setPhase('analyzing');
    stopStream();
    try {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current });
      if (blob.size > 18 * 1024 * 1024) {
        setError('O vídeo ficou grande demais. Grave um trecho mais curto.');
        setPhase('done'); return;
      }
      const base64 = await blobToBase64(blob);
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const r = await model.generateContent([
        { text: `${EVAL_PROMPT}\n\nObjeção que o vendedor está respondendo: ${selected?.objection}` },
        { inlineData: { data: base64, mimeType: mimeRef.current.split(';')[0] } },
      ]);
      const text = r.response.text();
      setEvaluation(text);
      const score = text.match(/Nota:?\s*(\d+)\s*\/\s*10/i)?.[1];
      addHistory({
        type: 'simulator_session',
        title: `Treino em vídeo: ${selected?.objection || ''}`,
        subtitle: score ? `Nota ${score}/10` : 'Treino em vídeo',
        preview: text.replace(/\*\*/g, '').slice(0, 140),
        data: { score: score ? parseInt(score) : null, evaluation: text, objection: selected?.objection },
      });
      setPhase('done');
    } catch {
      setError('Não consegui analisar o vídeo agora. Tente de novo.');
      setPhase('done');
    }
  };

  const reset = () => {
    stopStream();
    setSelected(null); setEvaluation(null); setError(''); setSec(0); setPhase('select');
  };

  const fmt = (t: string) => t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  if (!supported) {
    return (
      <div className="cv-page"><div className="cv-fallback">
        <p>Seu navegador não suporta gravação de vídeo. Use o treino por voz ou texto.</p>
        <button onClick={() => navigate('/treino-voz')}>Treino falado</button>
      </div></div>
    );
  }

  // Seleção
  if (phase === 'select') {
    return (
      <div className="rpv-select">
        <div className="rpv-hero rpvid-hero"><Video size={26} /><div>
          <h3>Treino em vídeo</h3>
          <p>Grave-se respondendo a objeção. A IA analisa sua entrega e a mensagem.</p>
        </div></div>
        {error && <p className="rpvid-error">{error}</p>}
        <h4 className="rpv-label">Escolha a objeção pra treinar:</h4>
        <div className="rpv-list">
          {objections.map(o => (
            <button key={o.id} className="rpv-obj card" onClick={() => pickObjection(o)}>
              <span>{o.objection}</span><Camera size={16} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Análise
  if (phase === 'done' && evaluation) {
    return (
      <div className="rpv-eval-page">
        <div className="evaluation-card card">
          <div className="eval-header"><Star size={20} /><h4>Análise do seu vídeo</h4></div>
          <div className="eval-content" dangerouslySetInnerHTML={{ __html: fmt(evaluation) }} />
          <button className="btn btn-primary" onClick={reset} style={{ marginTop: 14, width: '100%' }}>
            <RotateCcw size={16} /> Treinar de novo
          </button>
        </div>
      </div>
    );
  }

  // Gravação / preview
  return (
    <div className="rpvid-page">
      <div className="rpvid-obj">Responda: {selected?.objection}</div>
      <div className="rpvid-frame">
        <video ref={videoRef} className="rpvid-video" playsInline muted />
        {phase === 'recording' && <div className="rpvid-rec"><span className="rpvid-dot" /> {sec}s / {MAX_SEC}s</div>}
        {phase === 'analyzing' && <div className="rpvid-overlay">Analisando seu vídeo…</div>}
      </div>
      {error && <p className="rpvid-error">{error}</p>}
      {phase === 'ready' && (
        <button className="rpvid-btn rpvid-btn-rec" onClick={startRecording}>
          <Video size={18} /> Gravar resposta (até {MAX_SEC}s)
        </button>
      )}
      {phase === 'recording' && (
        <button className="rpvid-btn rpvid-btn-stop" onClick={stopRecording}>
          <Square size={16} fill="currentColor" /> Parar e analisar
        </button>
      )}
      <button className="cv-text-btn" onClick={reset}>Trocar objeção</button>
    </div>
  );
}

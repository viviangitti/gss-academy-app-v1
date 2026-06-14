// Botão de microfone reutilizável: dita por voz e preenche um campo (controlado).
// Anexa o texto reconhecido ao valor atual — o vendedor pode falar em vez de digitar.
import { useRef, useState, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import './MicButton.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string; // rótulo curto opcional ("Ditar")
}

export default function MicButton({ value, onChange, label }: Props) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<(SpeechRecognition & { abort?: () => void }) | null>(null);
  const baseRef = useRef('');
  const finalRef = useRef('');

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => () => { try { recRef.current?.abort?.(); } catch { /* */ } }, []);

  const stop = () => {
    try { recRef.current?.stop(); } catch { /* */ }
    setListening(false);
  };

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    baseRef.current = value ? value.trim() + ' ' : '';
    finalRef.current = '';
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      onChange((baseRef.current + finalRef.current + interim).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { /* já rodando */ }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`mic-btn ${listening ? 'mic-btn--on' : ''}`}
      onClick={() => (listening ? stop() : start())}
      aria-label={listening ? 'Parar' : 'Falar'}
    >
      {listening ? <Square size={13} fill="currentColor" /> : <Mic size={14} />}
      <span>{listening ? 'Ouvindo…' : (label || 'Falar')}</span>
    </button>
  );
}

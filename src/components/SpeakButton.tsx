import { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import './SpeakButton.css';

interface Props {
  text: string;
  size?: number;
}

export default function SpeakButton({ text, size = 16 }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSpeaking = () =>
    speakingRef.current ||
    window.speechSynthesis.speaking ||
    window.speechSynthesis.pending;

  const forceStop = () => {
    // Cancela tudo — pause() primeiro torna o cancel() mais confiável no iOS
    window.speechSynthesis.pause();
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    speakingRef.current = false;
    setSpeaking(false);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Se está falando (pelo ref OU pelo estado real do speechSynthesis), para
    if (isSpeaking()) {
      forceStop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onend = () => {
      if (utteranceRef.current === utterance) {
        speakingRef.current = false;
        setSpeaking(false);
        utteranceRef.current = null;
      }
    };

    utterance.onerror = () => {
      if (utteranceRef.current === utterance) {
        speakingRef.current = false;
        setSpeaking(false);
        utteranceRef.current = null;
      }
    };

    utteranceRef.current = utterance;

    // Limpa qualquer fala anterior
    window.speechSynthesis.pause();
    window.speechSynthesis.cancel();

    // Marca como falando imediatamente (onstart não dispara no iOS)
    speakingRef.current = true;
    setSpeaking(true);

    // iOS exige delay após cancel() para aceitar um novo speak()
    setTimeout(() => {
      // Só fala se ainda for a mesma utterance (usuário não cancelou entre os 100ms)
      if (utteranceRef.current === utterance) {
        window.speechSynthesis.speak(utterance);
      }
    }, 100);
  };

  if (!('speechSynthesis' in window)) return null;

  return (
    <button
      className={`speak-btn ${speaking ? 'speaking' : ''}`}
      onClick={handleSpeak}
      title={speaking ? 'Parar leitura' : 'Ouvir resposta'}
    >
      {speaking ? <VolumeX size={size} /> : <Volume2 size={size} />}
    </button>
  );
}

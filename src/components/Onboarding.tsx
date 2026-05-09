import { useState } from 'react';
import { Shield, CalendarCheck, Factory, ChevronRight } from 'lucide-react';
import { SEGMENTS } from '../types';
import { saveData, KEYS } from '../services/storage';
import type { Segment } from '../types';
import './Onboarding.css';

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [segment, setSegment] = useState<Segment>('');

  const handleFinish = () => {
    if (segment) {
      const profile = { name: '', role: '', company: '', segment };
      saveData(KEYS.PROFILE, profile);
    }
    localStorage.setItem('gss_onboarding_done', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('gss_onboarding_done', 'true');
    onComplete();
  };

  const screens = [
    {
      icon: <Shield size={48} />,
      title: 'Domine a resposta certa para cada objeção',
      description: 'Respostas prontas, treino com IA e técnicas comprovadas para você brilhar em cada negociação.',
    },
    {
      icon: <CalendarCheck size={48} />,
      title: 'Organize suas reuniões e entre sempre com confiança',
      description: 'Use o modo pré-reunião para entrar preparado em cada encontro com cliente.',
    },
  ];

  return (
    <div className="onboarding-overlay">
      <button className="onboarding-skip" onClick={handleSkip}>Pular</button>

      {step < 2 ? (
        <div className="onboarding-screen">
          <div className="onboarding-icon">{screens[step].icon}</div>
          <h2>{screens[step].title}</h2>
          <p>{screens[step].description}</p>

          <div className="onboarding-dots">
            {[0, 1, 2].map(i => (
              <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>

          <button className="onboarding-next" onClick={() => setStep(step + 1)}>
            Próximo <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        <div className="onboarding-screen">
          <div className="onboarding-icon"><Factory size={48} /></div>
          <h2>Qual é o seu segmento?</h2>
          <p>Vamos personalizar objeções, roteiros e notícias para o seu mercado.</p>

          <select
            className="onboarding-select"
            value={segment}
            onChange={e => setSegment(e.target.value as Segment)}
          >
            {SEGMENTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <div className="onboarding-dots">
            {[0, 1, 2].map(i => (
              <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>

          <button className="onboarding-next onboarding-finish" onClick={handleFinish}>
            Começar
          </button>
        </div>
      )}
    </div>
  );
}

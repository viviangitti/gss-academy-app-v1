import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './AppTour.css';

interface Step {
  sel: string | null;   // seletor do elemento alvo (null = passo centralizado)
  title: string;        // {name} é substituído pelo primeiro nome
  body: string;
}

const STEPS: Step[] = [
  { sel: null, title: 'Bem-vindo{name}! 👋', body: 'Esse é o seu copiloto de vendas. Em 30 segundos eu te mostro onde fica cada coisa.' },
  { sel: '[data-tour="briefing"]', title: 'Seu dia começa aqui', body: 'Resumo do dia: quanto falta pra meta e os follow-ups que te esperam hoje.' },
  { sel: '[data-tour="outcome"]', title: 'Registre cada atendimento', body: 'Acabou um atendimento? Marque Vendi ou Não fechou — a IA aprende com os dois.' },
  { sel: '[data-tour="boost"]', title: 'Travou? Use o Boost', body: 'Cliente travou numa objeção? O Boost te dá 3 caminhos prontos em segundos.' },
  { sel: '[data-tour="nav-noticias"]', title: 'Notícias & mercado', body: 'Munição na mão: notícias do seu mercado, lançamentos e ofertas dos concorrentes.' },
  { sel: '[data-tour="nav-painel"]', title: 'Painel', body: 'Follow-ups, treino, playbook e o seu Raio-X de competências ficam aqui.' },
  { sel: '[data-tour="nav-coaching"]', title: 'Coaching', body: 'Seu coach de vendas por texto e voz — sempre no bolso.' },
  { sel: null, title: 'É só começar 🚀', body: 'Pronto! Explore à vontade. Você pode rever isso quando quiser no Mapa do app.' },
];

const CARD_W = 320;
const EST_H = 200; // estimativa de altura do card p/ decidir acima/abaixo

interface Props { onClose: () => void; }

export default function AppTour({ onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tick, setTick] = useState(0); // força recálculo de posição do card

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const firstName = profile.name ? profile.name.split(' ')[0] : '';

  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;

  const findEl = useCallback(
    () => (step.sel ? (document.querySelector(step.sel) as HTMLElement | null) : null),
    [step.sel]
  );

  // Ao mudar de passo: rola o alvo pra vista e mede após acomodar.
  useEffect(() => {
    const el = findEl();
    if (!el) { setRect(null); return; }
    // rolagem instantânea (sem animação) pra medir o alvo já no lugar final —
    // rolagem suave fazia o spotlight medir uma posição intermediária.
    try { el.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch { /* noop */ }
    const measure = () => setRect(el.getBoundingClientRect());
    const raf = requestAnimationFrame(measure);
    const t = window.setTimeout(measure, 120); // reforço caso o layout assente um tick depois
    return () => { cancelAnimationFrame(raf); window.clearTimeout(t); };
  }, [idx, findEl]);

  // Re-mede em resize/scroll sem re-rolar.
  useEffect(() => {
    const onUpd = () => {
      const el = findEl();
      setRect(el ? el.getBoundingClientRect() : null);
      setTick(t => t + 1);
    };
    window.addEventListener('resize', onUpd);
    window.addEventListener('scroll', onUpd, true);
    return () => {
      window.removeEventListener('resize', onUpd);
      window.removeEventListener('scroll', onUpd, true);
    };
  }, [findEl]);

  const next = () => (isLast ? onClose() : setIdx(i => i + 1));
  const back = () => setIdx(i => Math.max(0, i - 1));

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(CARD_W, vw - 24);

  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { left: (vw - cardW) / 2, top: Math.max(80, (vh - EST_H) / 2), width: cardW };
  } else {
    const fitsBelow = rect.bottom + 14 + EST_H < vh;
    const top = fitsBelow ? rect.bottom + 14 : Math.max(14, rect.top - 14 - EST_H);
    let left = rect.left + rect.width / 2 - cardW / 2;
    left = Math.max(12, Math.min(left, vw - cardW - 12));
    cardStyle = { left, top, width: cardW };
  }

  const spotPad = 8;

  return createPortal(
    <div data-tick={tick}>
      <div className="tour-block" />
      {rect ? (
        <div
          className="tour-spot"
          style={{
            left: rect.left - spotPad,
            top: rect.top - spotPad,
            width: rect.width + spotPad * 2,
            height: rect.height + spotPad * 2,
          }}
        />
      ) : (
        <div className="tour-dim" />
      )}

      <div className="tour-card" style={cardStyle}>
        <h3>{step.title.replace('{name}', firstName ? `, ${firstName}` : '')}</h3>
        <p>{step.body}</p>
        <div className="tour-foot">
          <div className="tour-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={`tour-dot${i === idx ? ' on' : ''}`} />
            ))}
          </div>
          {idx === 0 ? (
            <button className="tour-skip" onClick={onClose}>Pular</button>
          ) : (
            <button className="tour-back" onClick={back}>Voltar</button>
          )}
          <button className="tour-next" onClick={next}>
            {isLast ? 'Começar' : 'Próximo'} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

import { useState, useRef } from 'react';
import { Rocket, Copy, Check, ThumbsUp, RotateCcw, Zap } from 'lucide-react';
import { getBoost, reportBoostWin } from '../services/boost';
import type { BoostPath } from '../services/boost';
import { remember } from '../services/memory';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './Boost.css';

const QUICK_SITUATIONS = [
  'Disse que tá caro e travou',
  'Falou "vou pensar" e quer ir embora',
  'Concorrente ofereceu mais barato',
  'Precisa da aprovação do cônjuge',
  'Sumiu, não responde mais no WhatsApp',
  'Quer desconto que não posso dar',
];

export default function Boost() {
  const isOnline = useOnline();
  const [situation, setSituation] = useState('');
  const [paths, setPaths] = useState<BoostPath[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [wonIdx, setWonIdx] = useState<number | null>(null);
  const askedRef = useRef('');

  const fire = async (text: string) => {
    const sit = text.trim();
    if (!sit || loading) return;
    setLoading(true);
    setError('');
    setPaths(null);
    setWonIdx(null);
    askedRef.current = sit;
    remember(`Travou com cliente: ${sit}`, 'boost');
    try {
      setPaths(await getBoost(sit));
    } catch {
      setError('Não consegui gerar agora. Tenta de novo em segundos.');
    }
    setLoading(false);
  };

  const handleCopy = async (p: BoostPath, i: number) => {
    try {
      await navigator.clipboard.writeText(p.say);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch { /* clipboard bloqueado */ }
  };

  const handleWon = (p: BoostPath, i: number) => {
    reportBoostWin(askedRef.current, p);
    setWonIdx(i);
  };

  if (!isOnline) return <OfflineState feature="o Boost" />;

  return (
    <div className="boost-page">
      {!paths && !loading && (
        <>
          <div className="boost-hero">
            <div className="boost-hero-icon"><Rocket size={26} /></div>
            <h3>Travou? Bora destravar.</h3>
            <p>Descreva em 1 frase o que o cliente disse — você recebe 3 caminhos prontos pra falar agora.</p>
          </div>

          <textarea
            className="boost-input"
            placeholder='Ex: "ele quer levar o do concorrente por 20 mil a menos"'
            value={situation}
            onChange={e => setSituation(e.target.value)}
            rows={3}
          />
          <button className="boost-fire" onClick={() => fire(situation)} disabled={!situation.trim()}>
            <Zap size={18} /> Boost
          </button>

          <p className="boost-quick-label">Ou toque na situação:</p>
          <div className="boost-quick">
            {QUICK_SITUATIONS.map(q => (
              <button key={q} className="boost-quick-chip" onClick={() => fire(q)}>{q}</button>
            ))}
          </div>
          {error && <p className="boost-error">{error}</p>}
        </>
      )}

      {loading && (
        <div className="boost-loading">
          <div className="boost-loading-orb"><Rocket size={28} /></div>
          <p>Montando seus 3 caminhos…</p>
        </div>
      )}

      {paths && (
        <div className="boost-results">
          <p className="boost-situation">"{askedRef.current}"</p>
          {paths.map((p, i) => (
            <div key={i} className="boost-card card">
              <div className="boost-card-head">
                <span className="boost-card-num">{i + 1}</span>
                <h4>{p.title}</h4>
              </div>
              <p className="boost-say">"{p.say}"</p>
              <div className="boost-card-actions">
                <button className="boost-act" onClick={() => handleCopy(p, i)}>
                  {copiedIdx === i ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                </button>
                <button
                  className={`boost-act boost-act-won ${wonIdx === i ? 'done' : ''}`}
                  onClick={() => handleWon(p, i)}
                  disabled={wonIdx !== null}
                >
                  <ThumbsUp size={14} /> {wonIdx === i ? 'Registrado!' : 'Funcionou!'}
                </button>
              </div>
            </div>
          ))}
          {wonIdx !== null && (
            <p className="boost-won-note">💪 Boa! Esse caso agora ajuda toda a equipe — a IA aprendeu com você.</p>
          )}
          <button className="boost-again" onClick={() => { setPaths(null); setSituation(''); }}>
            <RotateCcw size={15} /> Outra situação
          </button>
        </div>
      )}
    </div>
  );
}

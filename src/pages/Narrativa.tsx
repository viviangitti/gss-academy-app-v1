import { useState } from 'react';
import { Sparkles, Copy, Check, RotateCcw, Heart, Anchor, Shield } from 'lucide-react';
import { getAspirationalPitch, VALORIZA_OPTIONS } from '../services/aspirationalPitch';
import type { AspirationalPitch } from '../services/aspirationalPitch';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './Narrativa.css';

export default function Narrativa() {
  const isOnline = useOnline();
  const [carro, setCarro] = useState('');
  const [valoriza, setValoriza] = useState<string[]>([]);
  const [pitch, setPitch] = useState<AspirationalPitch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const toggle = (v: string) =>
    setValoriza(s => (s.includes(v) ? s.filter(x => x !== v) : [...s, v]));

  const fire = async () => {
    if (loading) return;
    setLoading(true); setError(''); setPitch(null);
    try {
      setPitch(await getAspirationalPitch(carro.trim(), valoriza));
    } catch {
      setError('Não consegui montar agora. Tenta de novo.');
    }
    setLoading(false);
  };

  const copy = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 1500); } catch { /* */ }
  };

  if (!isOnline) return <OfflineState feature="a Narrativa" />;

  return (
    <div className="narr-page">
      {!pitch && !loading && (
        <>
          <div className="narr-hero">
            <div className="narr-hero-icon"><Heart size={24} /></div>
            <h3>Venda o sonho, não o preço</h3>
            <p>A IA monta uma narrativa aspiracional pra esse cliente — pra você defender valor em vez de dar desconto.</p>
          </div>
          <div className="narr-form">
            <label className="narr-label">Carro</label>
            <input className="narr-input" placeholder="Ex: Corolla Cross XRE"
              value={carro} onChange={e => setCarro(e.target.value)} />
            <label className="narr-label">O que o cliente valoriza</label>
            <div className="narr-chips">
              {VALORIZA_OPTIONS.map(v => (
                <button key={v} type="button" className={`narr-chip ${valoriza.includes(v) ? 'on' : ''}`} onClick={() => toggle(v)}>{v}</button>
              ))}
            </div>
            <button className="narr-fire" onClick={fire} disabled={!carro.trim() && !valoriza.length}>
              <Sparkles size={17} /> Montar a narrativa
            </button>
            {error && <p className="narr-error">{error}</p>}
          </div>
        </>
      )}

      {loading && (
        <div className="narr-loading"><div className="narr-loading-orb"><Heart size={26} /></div><p>Montando a narrativa…</p></div>
      )}

      {pitch && (
        <div className="narr-result">
          <div className="narr-block card">
            <div className="narr-block-head"><Sparkles size={15} /> Abertura — pinte o cenário</div>
            <p className="narr-text">{pitch.abertura}</p>
            <button className="narr-copy" onClick={() => copy(pitch.abertura, 'ab')}>
              {copied === 'ab' ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
            </button>
          </div>

          <div className="narr-block card">
            <div className="narr-block-head"><Anchor size={15} /> Ancore o valor</div>
            {pitch.caminhos.map((c, i) => (
              <p key={i} className="narr-say">"{c.replace(/^["']+|["']+$/g, '')}"</p>
            ))}
          </div>

          <div className="narr-block card narr-block-defense">
            <div className="narr-block-head"><Shield size={15} /> Quando pedir desconto</div>
            <p className="narr-text">{pitch.defesaPreco}</p>
            <button className="narr-copy" onClick={() => copy(pitch.defesaPreco, 'def')}>
              {copied === 'def' ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
            </button>
          </div>

          {pitch.frase && <p className="narr-frase">"{pitch.frase.replace(/^["']+|["']+$/g, '')}"</p>}

          <button className="narr-again" onClick={() => setPitch(null)}>
            <RotateCcw size={15} /> Outra narrativa
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Copy, Check, ThumbsUp, RotateCcw, Zap, ClipboardCheck, Dumbbell, LifeBuoy } from 'lucide-react';
import { getBoost, reportBoostWin, getDebrief } from '../services/boost';
import type { BoostPath, DebriefResult } from '../services/boost';
import { remember } from '../services/memory';
import MicButton from '../components/MicButton';
import AIFeedback from '../components/AIFeedback';
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
  const navigate = useNavigate();
  const [mode, setMode] = useState<'sos' | 'debrief'>('sos');
  const [situation, setSituation] = useState('');
  const [paths, setPaths] = useState<BoostPath[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [wonIdx, setWonIdx] = useState<number | null>(null);
  const askedRef = useRef('');

  // Debrief pós-atendimento
  const [deb, setDeb] = useState({ situacao: '', motivos: '', autocritica: '' });
  const [debriefRes, setDebriefRes] = useState<DebriefResult | null>(null);

  const fireDebrief = async () => {
    if (!deb.situacao.trim() || !deb.motivos.trim() || loading) return;
    setLoading(true);
    setError('');
    remember(`Pós-atendimento: cliente não fechou (${deb.motivos}). Autocrítica: ${deb.autocritica}`.slice(0, 250), 'debrief');
    try {
      setDebriefRes(await getDebrief({
        situacao: deb.situacao.trim(),
        motivos: deb.motivos.trim(),
        autocritica: deb.autocritica.trim() || 'não informou',
      }));
    } catch {
      setError('Não consegui analisar agora. Tenta de novo.');
    }
    setLoading(false);
  };

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
      {/* Seletor de modo */}
      {!paths && !debriefRes && !loading && (
        <div className="boost-modes">
          <button className={`boost-mode ${mode === 'sos' ? 'active' : ''}`} onClick={() => setMode('sos')}>
            <Zap size={15} /> Travei AGORA
          </button>
          <button className={`boost-mode ${mode === 'debrief' ? 'active' : ''}`} onClick={() => setMode('debrief')}>
            <ClipboardCheck size={15} /> Pós-atendimento
          </button>
        </div>
      )}

      {mode === 'debrief' && !debriefRes && !loading && (
        <>
          <div className="boost-hero">
            <div className="boost-hero-icon boost-hero-debrief"><ClipboardCheck size={26} /></div>
            <h3>Quer afiar a sua argumentação?</h3>
            <p>Conte como foi — você recebe a leitura honesta do que faltou, 2 falas pra próxima vez e como treinar.</p>
          </div>
          <div className="boost-debrief-form">
            <div className="boost-label-row">
              <label>Como foi a situação?</label>
              <MicButton value={deb.situacao} onChange={v => setDeb(d => ({ ...d, situacao: v }))} />
            </div>
            <textarea rows={2} placeholder='Ex: "cliente veio decidido, fez test-drive, gostou, mas no fim não fechou"'
              value={deb.situacao} onChange={e => setDeb({ ...deb, situacao: e.target.value })} />
            <div className="boost-label-row">
              <label>Motivos que o cliente alegou pra não fechar</label>
              <MicButton value={deb.motivos} onChange={v => setDeb(d => ({ ...d, motivos: v }))} />
            </div>
            <textarea rows={2} placeholder='Ex: "disse que a parcela ficou alta e que vai ver com o banco dele"'
              value={deb.motivos} onChange={e => setDeb({ ...deb, motivos: e.target.value })} />
            <div className="boost-label-row">
              <label>Autocrítica: o que você sente que faltou em VOCÊ?</label>
              <MicButton value={deb.autocritica} onChange={v => setDeb(d => ({ ...d, autocritica: v }))} />
            </div>
            <textarea rows={2} placeholder='Ex: "acho que não defendi o valor, fui direto pro desconto"'
              value={deb.autocritica} onChange={e => setDeb({ ...deb, autocritica: e.target.value })} />
            <button className="boost-fire" onClick={fireDebrief} disabled={!deb.situacao.trim() || !deb.motivos.trim()}>
              <Rocket size={18} /> Analisar meu atendimento
            </button>
            <p className="boost-debrief-note">Seu relato alimenta o seu Raio-X e ajuda a equipe toda — a IA aprende com cada caso.</p>
          </div>
          {error && <p className="boost-error">{error}</p>}
        </>
      )}

      {mode === 'sos' && !paths && !loading && (
        <>
          <div className="boost-hero">
            <div className="boost-hero-icon"><Rocket size={26} /></div>
            <h3>Travou? Bora destravar.</h3>
            <p>Descreva em 1 frase o que o cliente disse — você recebe 3 caminhos prontos pra falar agora.</p>
          </div>

          <div className="boost-label-row">
            <label className="boost-input-label">Fala ou digita o que rolou:</label>
            <MicButton value={situation} onChange={setSituation} />
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

      {debriefRes && (
        <div className="boost-results">
          <div className="boost-card card">
            <div className="boost-card-head"><span className="boost-card-num">👁</span><h4>A leitura honesta</h4></div>
            <p className="boost-deb-text">{debriefRes.leitura}</p>
          </div>
          <div className="boost-card card">
            <div className="boost-card-head"><span className="boost-card-num">🎯</span><h4>O que de fato faltou</h4></div>
            <p className="boost-deb-text">{debriefRes.oQueFaltou}</p>
          </div>
          <div className="boost-card card">
            <div className="boost-card-head"><span className="boost-card-num">💬</span><h4>Na próxima vez, fale assim</h4></div>
            {debriefRes.falas.map((f, i) => <p key={i} className="boost-say">"{f.replace(/^["']+|["']+$/g, '')}"</p>)}
          </div>
          <div className="boost-card card">
            <div className="boost-card-head"><span className="boost-card-num">🏋️</span><h4>Treino de 5 minutos</h4></div>
            <p className="boost-deb-text">{debriefRes.exercicio}</p>
            <button className="boost-act" style={{ marginTop: 10, width: '100%' }} onClick={() => navigate('/treino-voz')}>
              <Dumbbell size={14} /> Treinar agora por voz
            </button>
          </div>
          {debriefRes.aindaDaTempo && (
            <div className="boost-card card boost-deb-rescue">
              <div className="boost-card-head"><span className="boost-card-num">🛟</span><h4>Esse cliente ainda dá</h4></div>
              <p className="boost-deb-text">{debriefRes.aindaDaTempo}</p>
              <button className="boost-act" style={{ marginTop: 10, width: '100%' }}
                onClick={() => navigate('/rescue', { state: { context: `${deb.situacao}. Cliente alegou: ${deb.motivos}` } })}>
                <LifeBuoy size={14} /> Montar o resgate
              </button>
            </div>
          )}
          <p className="boost-won-note">✅ Registrado! Isso alimentou seu Raio-X e o cérebro da equipe.</p>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 12px' }}><AIFeedback feature="boost-debrief" context={deb.situacao} response={debriefRes.leitura} /></div>
          <button className="boost-again" onClick={() => { setDebriefRes(null); setDeb({ situacao: '', motivos: '', autocritica: '' }); }}>
            <RotateCcw size={15} /> Outro atendimento
          </button>
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
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 12px' }}><AIFeedback feature="boost" context={askedRef.current} response={paths.map(p => `${p.title}: ${p.say}`).join(' | ')} /></div>
          <button className="boost-again" onClick={() => { setPaths(null); setSituation(''); }}>
            <RotateCcw size={15} /> Outra situação
          </button>
        </div>
      )}
    </div>
  );
}

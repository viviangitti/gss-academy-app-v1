import { useState } from 'react';
import { Target, X, Sparkles } from 'lucide-react';
import {
  extractNegotiationContext, missingCritical, buildNegotiationPrompt,
  VALORIZA_OPTIONS, ETAPA_OPTIONS,
} from '../services/negotiationCoach';
import type { NegotiationContext } from '../services/negotiationCoach';
import './NegotiationSheet.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

const FIELD_LABEL: Record<string, string> = {
  carro: 'Qual carro ele tá olhando?',
  travou: 'O que travou / a objeção?',
  valoriza: 'O que o cliente mais valoriza?',
  etapa: 'Em que etapa está?',
};

export default function NegotiationSheet({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<'desc' | 'ficha'>('desc');
  const [free, setFree] = useState('');
  const [ctx, setCtx] = useState<NegotiationContext>({ etapa: '', carro: '', valoriza: [], travou: '', pagamento: '', falou: '' });
  const [missing, setMissing] = useState<(keyof NegotiationContext)[]>([]);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => {
    setStep('desc'); setFree(''); setMissing([]); setLoading(false);
    setCtx({ etapa: '', carro: '', valoriza: [], travou: '', pagamento: '', falou: '' });
  };
  const close = () => { reset(); onClose(); };

  const handleContinue = async () => {
    if (!free.trim() || loading) return;
    setLoading(true);
    const extracted = await extractNegotiationContext(free.trim());
    const miss = missingCritical(extracted);
    setLoading(false);
    if (miss.length === 0) {
      onSubmit(buildNegotiationPrompt(extracted, free.trim()));
      close();
      return;
    }
    setCtx(extracted);
    setMissing(miss);
    setStep('ficha');
  };

  const handleGenerate = () => {
    onSubmit(buildNegotiationPrompt(ctx, free.trim()));
    close();
  };

  const toggleValoriza = (v: string) => {
    setCtx(c => ({ ...c, valoriza: c.valoriza.includes(v) ? c.valoriza.filter(x => x !== v) : [...c.valoriza, v] }));
  };

  // só dá pra gerar quando os campos faltantes foram preenchidos
  const fichaOk = missing.every(f => {
    const v = ctx[f];
    return Array.isArray(v) ? v.length > 0 : !!String(v || '').trim();
  });

  return (
    <div className="ns-overlay" onClick={close}>
      <div className="ns-sheet" onClick={e => e.stopPropagation()}>
        <div className="ns-head">
          <div className="ns-head-title"><Target size={18} /> Me ajuda numa negociação</div>
          <button className="ns-close" onClick={close} aria-label="Fechar"><X size={18} /></button>
        </div>

        {step === 'desc' ? (
          <>
            <p className="ns-hint">Conta do seu jeito: qual cliente, qual carro, o que travou. Quanto mais real, melhor o plano.</p>
            <textarea
              className="ns-textarea"
              value={free}
              onChange={e => setFree(e.target.value)}
              placeholder="Ex: Casal com 2 filhos olhando o Corolla Cross. Gostaram, mas acharam caro e foram ver o HR-V do concorrente..."
              rows={5}
              autoFocus
            />
            <button className="ns-btn" onClick={handleContinue} disabled={!free.trim() || loading}>
              {loading ? 'Lendo a situação…' : <>Continuar <Sparkles size={15} /></>}
            </button>
          </>
        ) : (
          <>
            <p className="ns-hint">Só falta isso pra eu montar um plano sob medida (já aproveitei o que você contou):</p>

            {missing.includes('carro') && (
              <div className="ns-field">
                <label>{FIELD_LABEL.carro}</label>
                <input
                  className="ns-input"
                  value={ctx.carro}
                  onChange={e => setCtx(c => ({ ...c, carro: e.target.value }))}
                  placeholder="Ex: Corolla Cross XRE 0km"
                  autoFocus
                />
              </div>
            )}

            {missing.includes('travou') && (
              <div className="ns-field">
                <label>{FIELD_LABEL.travou}</label>
                <input
                  className="ns-input"
                  value={ctx.travou}
                  onChange={e => setCtx(c => ({ ...c, travou: e.target.value }))}
                  placeholder="Ex: achou caro / foi ver a concorrência"
                />
              </div>
            )}

            {missing.includes('valoriza') && (
              <div className="ns-field">
                <label>{FIELD_LABEL.valoriza}</label>
                <div className="ns-chips">
                  {VALORIZA_OPTIONS.map(v => (
                    <button
                      type="button"
                      key={v}
                      className={`ns-chip ${ctx.valoriza.includes(v) ? 'on' : ''}`}
                      onClick={() => toggleValoriza(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* etapa é "bom ter" — mostra se ela não veio, mas não bloqueia */}
            {!ctx.etapa && (
              <div className="ns-field">
                <label>{FIELD_LABEL.etapa} <span className="ns-opt">(opcional)</span></label>
                <div className="ns-chips">
                  {ETAPA_OPTIONS.map(e => (
                    <button
                      type="button"
                      key={e}
                      className={`ns-chip ${ctx.etapa === e ? 'on' : ''}`}
                      onClick={() => setCtx(c => ({ ...c, etapa: c.etapa === e ? '' : e }))}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="ns-btn" onClick={handleGenerate} disabled={!fichaOk}>
              Gerar meu plano <Sparkles size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

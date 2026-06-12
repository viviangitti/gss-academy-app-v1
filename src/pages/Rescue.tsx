import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Target, Copy, Check, MessageCircle, Clock, Anchor, LifeBuoy, RotateCcw } from 'lucide-react';
import { getRescuePlan } from '../services/rescue';
import type { RescueTarget, RescuePlan } from '../services/rescue';
import { remember } from '../services/memory';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './Rescue.css';

export default function Rescue() {
  const isOnline = useOnline();
  const navigate = useNavigate();
  const location = useLocation();
  const target = (location.state || null) as RescueTarget | null;

  const [manual, setManual] = useState({ clientName: '', interest: '', context: '' });
  const [plan, setPlan] = useState<RescuePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fire = useCallback(async (t: RescueTarget) => {
    setLoading(true);
    setError('');
    remember(`Resgatando cliente: ${t.clientName || ''} — ${t.context}`.slice(0, 200), 'rescue');
    try {
      setPlan(await getRescuePlan(t));
    } catch {
      setError('Não consegui montar o plano agora. Tenta de novo.');
    }
    setLoading(false);
  }, []);

  // Se veio de uma venda perdida / follow-up esfriado, dispara direto
  useEffect(() => {
    if (target?.context) fire(target);
  }, [target, fire]);

  const handleCopy = async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(plan.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  const handleWhatsApp = () => {
    if (!plan) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(plan.message)}`, '_blank');
  };

  if (!isOnline) return <OfflineState feature="o Rescue" />;

  return (
    <div className="rescue-page">
      {!plan && !loading && (
        <>
          <div className="rescue-hero">
            <div className="rescue-hero-icon"><Target size={26} /></div>
            <h3>Resgatar cliente</h3>
            <p>Cliente sumiu ou desistiu? A IA monta a mensagem certa, na hora certa, com o gancho certo.</p>
          </div>
          <div className="rescue-form">
            <input type="text" placeholder="Nome do cliente (opcional)" value={manual.clientName}
              onChange={e => setManual({ ...manual, clientName: e.target.value })} />
            <input type="text" placeholder="O que ele queria? Ex: XC60 usado" value={manual.interest}
              onChange={e => setManual({ ...manual, interest: e.target.value })} />
            <textarea rows={3} placeholder='Por que esfriou/desistiu? Ex: "achou caro e disse que ia pesquisar"'
              value={manual.context} onChange={e => setManual({ ...manual, context: e.target.value })} />
            <button className="rescue-fire" disabled={!manual.context.trim()}
              onClick={() => fire(manual)}>
              <LifeBuoy size={18} /> Montar plano de resgate
            </button>
          </div>
          {error && <p className="rescue-error">{error}</p>}
        </>
      )}

      {loading && (
        <div className="rescue-loading">
          <div className="rescue-loading-orb"><Target size={28} /></div>
          <p>Montando o plano de resgate…</p>
        </div>
      )}

      {plan && (
        <div className="rescue-result">
          <div className="rescue-block card">
            <h4><MessageCircle size={15} /> Mensagem pronta</h4>
            <p className="rescue-msg">{plan.message}</p>
            <div className="rescue-actions">
              <button className="rescue-act" onClick={handleCopy}>
                {copied ? <><Check size={14} /> Copiada</> : <><Copy size={14} /> Copiar</>}
              </button>
              <button className="rescue-act rescue-act-wa" onClick={handleWhatsApp}>
                <MessageCircle size={14} /> Abrir no WhatsApp
              </button>
            </div>
          </div>

          <div className="rescue-block card">
            <h4><Clock size={15} /> Quando mandar</h4>
            <p>{plan.timing}</p>
          </div>
          <div className="rescue-block card">
            <h4><Anchor size={15} /> O gancho</h4>
            <p>{plan.hook}</p>
          </div>
          <div className="rescue-block card">
            <h4><LifeBuoy size={15} /> Se não responder em 3 dias</h4>
            <p>{plan.fallback}</p>
          </div>

          <button className="rescue-again" onClick={() => { setPlan(null); navigate('/rescue', { replace: true, state: null }); }}>
            <RotateCcw size={15} /> Outro cliente
          </button>
        </div>
      )}
    </div>
  );
}

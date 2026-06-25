import { useState } from 'react';
import { TrendingUp, Check } from 'lucide-react';
import { addSale } from '../services/goal';
import '../pages/Home.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegistered?: () => void;
}

/** Folha de registro rápido de venda — usada na Início (FAB) e em Negociações. */
export default function QuickSaleSheet({ open, onClose, onRegistered }: Props) {
  const [form, setForm] = useState({ amount: '', commission: '', client: '' });
  const [error, setError] = useState(false);

  if (!open) return null;

  const confirm = () => {
    if (!form.commission) {
      setError(true);
      return;
    }
    const commission = Number(form.commission);
    const amount = Number(form.amount) || commission;
    addSale(amount, commission, form.client || 'Venda');
    setForm({ amount: '', commission: '', client: '' });
    setError(false);
    onRegistered?.();
    onClose();
  };

  return (
    <div className="quick-sale-overlay" onClick={onClose}>
      <div className="quick-sale-sheet" onClick={e => e.stopPropagation()}>
        <div className="quick-sale-handle" />
        <h3 className="quick-sale-title"><TrendingUp size={18} /> Registrar venda</h3>
        <div className="quick-sale-fields">
          <div className="quick-sale-field">
            <label>Vendas R$ <span className="required">*</span></label>
            <input
              type="number"
              placeholder={error && !form.commission ? 'Obrigatório!' : 'Ex: 800'}
              value={form.commission}
              onChange={e => { setForm({ ...form, commission: e.target.value }); setError(false); }}
              autoFocus
              inputMode="numeric"
              className={error && !form.commission ? 'input-error' : undefined}
            />
          </div>
          <div className="quick-sale-field">
            <label>Valor da venda R$</label>
            <input
              type="number"
              placeholder="Ex: 10000"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              inputMode="numeric"
            />
          </div>
          <div className="quick-sale-field">
            <label>Cliente</label>
            <input
              type="text"
              placeholder="Nome do cliente"
              value={form.client}
              onChange={e => setForm({ ...form, client: e.target.value })}
            />
          </div>
        </div>
        <button className="btn btn-primary quick-sale-btn" onClick={confirm}>
          <Check size={16} /> Confirmar venda
        </button>
      </div>
    </div>
  );
}

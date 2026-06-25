import { useState } from 'react';
import { TrendingUp, Check } from 'lucide-react';
import { addSale } from '../services/goal';
import '../pages/Home.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegistered?: () => void;
}

const DETERMINANTES = [
  'Preço', 'Parcela / financiamento', 'Atendimento', 'Test-drive',
  'Espaço / porta-malas', 'Consumo', 'Prazo de entrega', 'Confiança na marca', 'Bônus na troca',
];

/** Folha de registro rápido de venda — usada na Início (FAB) e em Negociações. */
export default function QuickSaleSheet({ open, onClose, onRegistered }: Props) {
  const [form, setForm] = useState({ amount: '', commission: '', client: '' });
  const [determinante, setDeterminante] = useState('');
  const [error, setError] = useState<'' | 'commission' | 'determinante'>('');

  if (!open) return null;

  const confirm = () => {
    if (!form.commission) { setError('commission'); return; }
    if (!determinante) { setError('determinante'); return; }
    const commission = Number(form.commission);
    const amount = Number(form.amount) || commission;
    addSale(amount, commission, form.client || 'Venda', `Determinante pra venda: ${determinante}`);
    setForm({ amount: '', commission: '', client: '' });
    setDeterminante('');
    setError('');
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
              placeholder={error === 'commission' ? 'Obrigatório!' : 'Ex: 800'}
              value={form.commission}
              onChange={e => { setForm({ ...form, commission: e.target.value }); setError(''); }}
              autoFocus
              inputMode="numeric"
              className={error === 'commission' ? 'input-error' : undefined}
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
          <div className="quick-sale-field">
            <label>O que foi determinante pra venda? <span className="required">*</span></label>
            <div className="qs-chips">
              {DETERMINANTES.map(d => (
                <button
                  type="button"
                  key={d}
                  className={`qs-chip ${determinante === d ? 'on' : ''}`}
                  onClick={() => { setDeterminante(d); setError(''); }}
                >
                  {d}
                </button>
              ))}
            </div>
            {error === 'determinante' && <span className="qs-err">Escolha o que pesou pra fechar.</span>}
          </div>
        </div>
        <button className="btn btn-primary quick-sale-btn" onClick={confirm}>
          <Check size={16} /> Confirmar venda
        </button>
      </div>
    </div>
  );
}

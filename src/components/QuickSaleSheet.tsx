import { useState } from 'react';
import { TrendingUp, Check } from 'lucide-react';
import { addSale, BUSINESS_AREAS } from '../services/goal';
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
  const [form, setForm] = useState({ amount: '', model: '', client: '' });
  const [determinante, setDeterminante] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<'' | 'model' | 'determinante'>('');

  if (!open) return null;

  const confirm = () => {
    if (!form.model.trim()) { setError('model'); return; }
    if (!determinante) { setError('determinante'); return; }
    addSale({
      amount: Number(form.amount) || 0,
      model: form.model.trim(),
      client: form.client || 'Venda',
      notes: `Determinante pra venda: ${determinante}`,
      area: area || undefined,
    });
    setForm({ amount: '', model: '', client: '' });
    setDeterminante('');
    setArea('');
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
            <label>Modelo vendido <span className="required">*</span></label>
            <span className="qs-hint">Qual carro você vendeu</span>
            <input
              type="text"
              placeholder={error === 'model' ? 'Obrigatório!' : 'Ex: Corolla Cross XRE'}
              value={form.model}
              onChange={e => { setForm({ ...form, model: e.target.value }); setError(''); }}
              autoFocus
              className={error === 'model' ? 'input-error' : undefined}
            />
          </div>
          <div className="quick-sale-field">
            <label>Valor da venda R$ <span style={{ fontWeight: 400, color: 'var(--text-soft)' }}>(opcional)</span></label>
            <span className="qs-hint">Valor total do carro/negócio</span>
            <input
              type="number"
              placeholder="Ex: 50000"
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
          <div className="quick-sale-field">
            <label>Área de negócio <span style={{ fontWeight: 400, color: 'var(--text-soft)' }}>(opcional)</span></label>
            <div className="qs-chips">
              {BUSINESS_AREAS.map(a => (
                <button
                  type="button"
                  key={a}
                  className={`qs-chip ${area === a ? 'on' : ''}`}
                  onClick={() => setArea(area === a ? '' : a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className="btn btn-primary quick-sale-btn" onClick={confirm}>
          <Check size={16} /> Confirmar venda
        </button>
      </div>
    </div>
  );
}

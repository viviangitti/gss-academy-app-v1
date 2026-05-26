import { useState } from 'react';
import { TrendingUp, Megaphone, Layers } from 'lucide-react';
import { loadData, saveData, KEYS } from '../services/storage';
import { saveRemoteProfile } from '../services/firestore/profile';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';
import './AccessTypeSelector.css';

interface Props {
  onComplete: () => void;
}

const OPTIONS = [
  {
    value: 'vendas' as const,
    icon: TrendingUp,
    label: 'Time de Vendas',
    desc: 'Objeções, roteiros, metas, concorrência e notícias do seu mercado.',
    color: '#10b981',
  },
  {
    value: 'marketing' as const,
    icon: Megaphone,
    label: 'Time de Marketing',
    desc: 'Publique condições, gerencie ofertas e use o copiloto de retail marketing.',
    color: '#c9a84c',
  },
  {
    value: 'ambos' as const,
    icon: Layers,
    label: 'Vendas + Marketing',
    desc: 'Acesso completo aos dois painéis — ideal para quem acumula funções.',
    color: '#6366f1',
  },
];

export default function AccessTypeSelector({ onComplete }: Props) {
  const { user, firebaseEnabled } = useAuth();
  const [selected, setSelected] = useState<'vendas' | 'marketing' | 'ambos' | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);

    const current = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    const updated: UserProfile = {
      ...current,
      userAccessType: selected,
      isMarketing: selected === 'marketing' || selected === 'ambos',
    };

    saveData(KEYS.PROFILE, updated);
    if (user && firebaseEnabled) {
      await saveRemoteProfile(user.uid, updated);
    }

    onComplete();
  };

  return (
    <div className="ats-page">
      <div className="ats-logo">GSS</div>
      <h1 className="ats-title">Como você usa o MAESTR.IA?</h1>
      <p className="ats-subtitle">Escolha seu perfil de acesso. Você pode mudar depois em Configurações.</p>

      <div className="ats-options">
        {OPTIONS.map(opt => {
          const Icon = opt.icon;
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              className={`ats-option${active ? ' active' : ''}`}
              onClick={() => setSelected(opt.value)}
              style={active ? { borderColor: opt.color, background: `${opt.color}12` } : {}}
            >
              <div className="ats-option-icon" style={{ background: `${opt.color}18`, color: opt.color }}>
                <Icon size={24} />
              </div>
              <div className="ats-option-text">
                <strong>{opt.label}</strong>
                <span>{opt.desc}</span>
              </div>
              <div className={`ats-radio${active ? ' active' : ''}`} style={active ? { background: opt.color, borderColor: opt.color } : {}} />
            </button>
          );
        })}
      </div>

      <button
        className="ats-confirm"
        disabled={!selected || saving}
        onClick={handleConfirm}
      >
        {saving ? 'Salvando…' : 'Confirmar e entrar'}
      </button>
    </div>
  );
}

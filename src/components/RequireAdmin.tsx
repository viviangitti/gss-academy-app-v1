import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';

interface Props {
  children: ReactNode;
  /**
   * Se true, também permite acesso a usuários de marketing E vendas
   * (userAccessType === 'marketing' | 'vendas' | 'ambos' ou isMarketing === true).
   * Use para páginas de gestão de campanhas, condições e promoções.
   */
  allowMarketing?: boolean;
}

function isCampaignManager(profile: UserProfile): boolean {
  return (
    profile.isMarketing === true ||
    profile.userAccessType === 'marketing' ||
    profile.userAccessType === 'vendas' ||
    profile.userAccessType === 'ambos'
  );
}

export default function RequireAdmin({ children, allowMarketing = false }: Props) {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });

  const hasAccess =
    profile.isAdmin === true ||
    (allowMarketing && isCampaignManager(profile));

  if (!hasAccess) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', padding: '32px',
        textAlign: 'center', gap: 16,
      }}>
        <ShieldOff size={48} color="#ef4444" />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Acesso restrito</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#666', maxWidth: 260, lineHeight: 1.5 }}>
          {allowMarketing
            ? 'Esta área é exclusiva para administradores e gestores de vendas/marketing.'
            : 'Esta área é exclusiva para administradores. Entre em contato com o gestor da sua conta.'}
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '11px 22px', background: '#7c6af7', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

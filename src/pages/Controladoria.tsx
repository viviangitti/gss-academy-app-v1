import { useState, useEffect, useCallback } from 'react';
import { Users, Target, Save, RefreshCw, Car, CreditCard, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loadData, KEYS } from '../services/storage';
import { getTeamMembers, updateMemberGoals } from '../services/firestore/team';
import { isAutomotive } from '../types';
import type { UserProfile } from '../types';
import './Controladoria.css';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

interface MemberRow {
  profile: UserProfile;
  goal: string;
  financing: string;
  accessories: string;
  saving: boolean;
  saved: boolean;
  error: string;
}

export default function Controladoria() {
  useAuth(); // garante contexto de autenticação
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noTeam, setNoTeam] = useState(false);

  const loadMembers = useCallback(async () => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, {
      name: '', role: '', company: '', segment: '',
    });
    setMyProfile(profile);

    if (!profile.teamId) {
      setNoTeam(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const list = await getTeamMembers(profile.teamId);
      setMembers(list.map(p => ({
        profile: p,
        goal: String(p.monthlyGoal || ''),
        financing: String(p.monthlyGoalFinancing || ''),
        accessories: String(p.monthlyGoalAccessories || ''),
        saving: false,
        saved: false,
        error: '',
      })));
    } catch {
      // offline
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleSave = async (idx: number) => {
    const row = members[idx];
    if (!row.profile.uid) return;

    setMembers(prev => prev.map((r, i) =>
      i === idx ? { ...r, saving: true, saved: false, error: '' } : r
    ));

    try {
      const goals: Parameters<typeof updateMemberGoals>[1] = {
        monthlyGoal: Number(row.goal) || 0,
      };
      if (isAutomotive(row.profile.segment)) {
        goals.monthlyGoalFinancing = Number(row.financing) || 0;
        goals.monthlyGoalAccessories = Number(row.accessories) || 0;
      }
      await updateMemberGoals(row.profile.uid, goals);
      setMembers(prev => prev.map((r, i) =>
        i === idx ? { ...r, saving: false, saved: true } : r
      ));
      setTimeout(() => setMembers(prev => prev.map((r, i) =>
        i === idx ? { ...r, saved: false } : r
      )), 2500);
    } catch {
      setMembers(prev => prev.map((r, i) =>
        i === idx ? { ...r, saving: false, error: 'Erro ao salvar. Tente novamente.' } : r
      ));
    }
  };

  const updateField = (idx: number, field: 'goal' | 'financing' | 'accessories', val: string) => {
    setMembers(prev => prev.map((r, i) =>
      i === idx ? { ...r, [field]: val, saved: false } : r
    ));
  };

  if (loading) {
    return (
      <div className="ctrl-page">
        <div className="ctrl-loading">
          <RefreshCw size={24} className="ctrl-spin" />
          <span>Carregando equipe...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ctrl-page">
      {/* Header */}
      <div className="ctrl-hero card">
        <Users size={22} />
        <div>
          <h2>Gestão de Metas</h2>
          <p>Defina as metas mensais de cada vendedor da equipe</p>
        </div>
      </div>

      {/* Sem teamId */}
      {noTeam && (
        <div className="ctrl-alert card">
          <AlertCircle size={18} />
          <div>
            <strong>Configure seu Team ID</strong>
            <p>Vá em Perfil e preencha o campo "Team ID" com o código da sua equipe. Os vendedores precisam ter o mesmo código para aparecer aqui.</p>
          </div>
        </div>
      )}

      {/* Lista vazia */}
      {!noTeam && !loading && members.length === 0 && (
        <div className="ctrl-empty card">
          <Users size={32} />
          <p>Nenhum vendedor encontrado com o Team ID <strong>{myProfile?.teamId}</strong>.</p>
          <p className="ctrl-empty-hint">Certifique-se de que os vendedores configuraram o mesmo Team ID no perfil deles.</p>
          <button className="btn btn-outline" onClick={loadMembers}>
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
      )}

      {/* Vendedores */}
      {members.map((row, idx) => {
        const auto = isAutomotive(row.profile.segment);
        return (
          <div key={row.profile.uid} className="ctrl-member card">
            <div className="ctrl-member-header">
              <div className="ctrl-avatar">
                {(row.profile.name || '?')[0].toUpperCase()}
              </div>
              <div className="ctrl-member-info">
                <strong>{row.profile.name || 'Sem nome'}</strong>
                <span>{row.profile.role || 'Vendedor'} · {row.profile.company || '—'}</span>
              </div>
            </div>

            <div className="ctrl-goals">
              {/* Meta de vendas */}
              <div className="ctrl-goal-row">
                <label><Target size={13} /> Meta de vendas (R$)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Ex: 150000"
                  value={row.goal}
                  onChange={e => updateField(idx, 'goal', e.target.value)}
                />
                {row.goal && <span className="ctrl-preview">{formatBRL(Number(row.goal))}</span>}
              </div>

              {/* Automotivo: financiamento + acessórios */}
              {auto && (
                <>
                  <div className="ctrl-goal-row">
                    <label><CreditCard size={13} /> Meta de financiamento (R$)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Ex: 80000"
                      value={row.financing}
                      onChange={e => updateField(idx, 'financing', e.target.value)}
                    />
                    {row.financing && <span className="ctrl-preview">{formatBRL(Number(row.financing))}</span>}
                  </div>
                  <div className="ctrl-goal-row">
                    <label><Package size={13} /> Meta de acessórios (R$)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Ex: 20000"
                      value={row.accessories}
                      onChange={e => updateField(idx, 'accessories', e.target.value)}
                    />
                    {row.accessories && <span className="ctrl-preview">{formatBRL(Number(row.accessories))}</span>}
                  </div>
                  <div className="ctrl-auto-badge"><Car size={12} /> Segmento automotivo</div>
                </>
              )}
            </div>

            {row.error && <p className="ctrl-error">{row.error}</p>}

            <button
              className={`btn ctrl-save-btn ${row.saved ? 'ctrl-saved' : ''}`}
              onClick={() => handleSave(idx)}
              disabled={row.saving}
            >
              {row.saving ? (
                <><RefreshCw size={14} className="ctrl-spin" /> Salvando...</>
              ) : row.saved ? (
                <><Save size={14} /> Salvo ✓</>
              ) : (
                <><Save size={14} /> Salvar metas</>
              )}
            </button>
          </div>
        );
      })}

      {members.length > 0 && (
        <button className="btn btn-outline ctrl-refresh" onClick={loadMembers}>
          <RefreshCw size={14} /> Atualizar lista
        </button>
      )}
    </div>
  );
}

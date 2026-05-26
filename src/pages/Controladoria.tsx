import { useState, useEffect, useCallback } from 'react';
import { Users, Target, Save, RefreshCw, Car, CreditCard, Package, AlertCircle, Plus, X } from 'lucide-react';
import CurrencyInput from '../components/CurrencyInput';
import { useAuth } from '../contexts/AuthContext';
import { loadData, KEYS } from '../services/storage';
import { getTeamMembers, updateMemberGoals } from '../services/firestore/team';
import { isAutomotive } from '../types';
import type { UserProfile } from '../types';
import './Controladoria.css';


interface MemberRow {
  profile: UserProfile;
  goal: string;
  financing: string;
  accessories: string;
  customGoals: Array<{ label: string; target: string }>;
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

    if (!profile.company) {
      setNoTeam(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const list = await getTeamMembers(profile.company);
      setMembers(list.map(p => ({
        profile: p,
        goal: String(p.monthlyGoal || ''),
        financing: String(p.monthlyGoalFinancing || ''),
        accessories: String(p.monthlyGoalAccessories || ''),
        customGoals: (p.customGoals || []).map(g => ({ label: g.label, target: String(g.target || '') })),
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
      goals.customGoals = row.customGoals
        .map(g => ({ label: g.label, target: Number(g.target) || 0 }))
        .filter(g => g.label.trim() !== '');
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

  const updateCustomGoal = (memberIdx: number, goalIdx: number, field: 'label' | 'target', val: string) => {
    setMembers(prev => prev.map((r, i) => {
      if (i !== memberIdx) return r;
      const updated = [...r.customGoals];
      updated[goalIdx] = { ...updated[goalIdx], [field]: val };
      return { ...r, customGoals: updated, saved: false };
    }));
  };

  const addCustomGoal = (memberIdx: number) => {
    setMembers(prev => prev.map((r, i) =>
      i === memberIdx ? { ...r, customGoals: [...r.customGoals, { label: '', target: '' }], saved: false } : r
    ));
  };

  const removeCustomGoal = (memberIdx: number, goalIdx: number) => {
    setMembers(prev => prev.map((r, i) =>
      i === memberIdx ? { ...r, customGoals: r.customGoals.filter((_, j) => j !== goalIdx), saved: false } : r
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

      {/* Sem empresa configurada */}
      {noTeam && (
        <div className="ctrl-alert card">
          <AlertCircle size={18} />
          <div>
            <strong>Empresa não configurada</strong>
            <p>Vá em Perfil e preencha o campo "Empresa". Os vendedores da mesma empresa aparecem aqui automaticamente.</p>
          </div>
        </div>
      )}

      {/* Lista vazia */}
      {!noTeam && !loading && members.length === 0 && (
        <div className="ctrl-empty card">
          <Users size={32} />
          <p>Nenhum vendedor encontrado em <strong>{myProfile?.company}</strong>.</p>
          <p className="ctrl-empty-hint">Os vendedores precisam cadastrar o mesmo nome de empresa no perfil deles.</p>
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
              <div className="ctrl-goal-field">
                <label><Target size={13} /> {auto ? 'Vendas — Carros' : 'Meta de vendas'}</label>
                <CurrencyInput
                  value={Number(row.goal) || 0}
                  onChange={v => updateField(idx, 'goal', String(v))}
                />
              </div>

              {/* Automotivo: financiamento + acessórios */}
              {auto && (
                <>
                  <div className="ctrl-goal-field">
                    <label><CreditCard size={13} /> Financiamento</label>
                    <CurrencyInput
                      value={Number(row.financing) || 0}
                      onChange={v => updateField(idx, 'financing', String(v))}
                      presets={[30_000, 50_000, 80_000, 100_000, 150_000, 200_000]}
                    />
                  </div>
                  <div className="ctrl-goal-field">
                    <label><Package size={13} /> Acessórios</label>
                    <CurrencyInput
                      value={Number(row.accessories) || 0}
                      onChange={v => updateField(idx, 'accessories', String(v))}
                      presets={[5_000, 10_000, 15_000, 20_000, 30_000, 50_000]}
                    />
                  </div>
                  <div className="ctrl-auto-badge"><Car size={12} /> Segmento automotivo</div>
                </>
              )}

              {/* Metas personalizadas */}
              {row.customGoals.map((cg, cgIdx) => (
                <div key={cgIdx} className="ctrl-goal-field ctrl-custom-goal-field">
                  <div className="ctrl-custom-goal-header">
                    <input
                      type="text"
                      placeholder="Nome da meta"
                      value={cg.label}
                      onChange={e => updateCustomGoal(idx, cgIdx, 'label', e.target.value)}
                      className="ctrl-custom-label-input"
                    />
                    <button
                      type="button"
                      className="ctrl-remove-goal"
                      onClick={() => removeCustomGoal(idx, cgIdx)}
                      aria-label="Remover meta"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <CurrencyInput
                    value={Number(cg.target) || 0}
                    onChange={v => updateCustomGoal(idx, cgIdx, 'target', String(v))}
                    presets={[20_000, 50_000, 80_000, 100_000, 150_000, 200_000]}
                  />
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline btn-sm ctrl-add-goal"
                onClick={() => addCustomGoal(idx)}
              >
                <Plus size={12} /> Adicionar meta
              </button>
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

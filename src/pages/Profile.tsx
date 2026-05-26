import { useState, useEffect } from 'react';
import { User, Building2, Briefcase, Save, ExternalLink, Factory, Moon, Sun, Target, Shield, Download, MessageCircle, LogOut, Megaphone, Plus, X, Sparkles } from 'lucide-react';
import CurrencyInput from '../components/CurrencyInput';
import { Link } from 'react-router-dom';
import { loadData, saveData, KEYS } from '../services/storage';
import { SEGMENTS, SEGMENT_GOAL_PRESETS } from '../types';
import type { UserProfile, GoalItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../services/auth';
import { saveRemoteProfile } from '../services/firestore/profile';
import './Profile.css';

type Theme = 'light' | 'dark' | 'auto';

export default function Profile() {
  const { user, firebaseEnabled } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ name: '', role: '', company: '', segment: '', monthlyGoal: 0 });
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('gss_theme') as Theme) || 'auto');

  useEffect(() => {
    const p = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '', monthlyGoal: 0 });
    // Migrate legacy automotive fields into customGoals
    const existing = p.customGoals || [];
    const migrated: GoalItem[] = [...existing];
    if (p.monthlyGoalFinancing && p.monthlyGoalFinancing > 0 && !migrated.find(g => g.label === 'Financiamento')) {
      migrated.unshift({ label: 'Financiamento', icon: '💳', target: p.monthlyGoalFinancing });
    }
    if (p.monthlyGoalAccessories && p.monthlyGoalAccessories > 0 && !migrated.find(g => g.label === 'Acessórios')) {
      migrated.push({ label: 'Acessórios', icon: '📦', target: p.monthlyGoalAccessories });
    }
    setProfile({ ...p, customGoals: migrated });
  }, []);

  const handleSave = async () => {
    saveData(KEYS.PROFILE, profile);
    if (user && firebaseEnabled) {
      try { await saveRemoteProfile(user.uid, profile); } catch { /* offline, sync depois */ }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    if (confirm('Sair da sua conta? Seus dados continuam salvos na nuvem.')) {
      await signOut();
    }
  };

  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('gss_theme', t);
    const root = document.documentElement;
    if (t === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', t);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-avatar">
        <div className="avatar-circle">
          <User size={36} />
        </div>
      </div>

      <div className="profile-form card">
        <div className="form-group">
          <label><User size={14} /> Nome</label>
          <input
            value={profile.name}
            onChange={e => setProfile({ ...profile, name: e.target.value })}
            placeholder="Seu nome completo"
          />
        </div>
        <div className="form-group">
          <label><Briefcase size={14} /> Cargo</label>
          <input
            value={profile.role}
            onChange={e => setProfile({ ...profile, role: e.target.value })}
            placeholder="Ex: Líder Comercial"
          />
        </div>
        <div className="form-group">
          <label><Building2 size={14} /> Empresa</label>
          <input
            value={profile.company}
            onChange={e => setProfile({ ...profile, company: e.target.value })}
            placeholder="Nome da empresa"
          />
        </div>
        <div className="form-group">
          <label><Factory size={14} /> Segmento</label>
          <select
            value={profile.segment}
            onChange={e => setProfile({ ...profile, segment: e.target.value as UserProfile['segment'] })}
          >
            {SEGMENTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <span className="form-hint">Personaliza objeções, roteiros e notícias do seu mercado</span>
        </div>
        <div className="form-group">
          <label><Target size={14} /> Meta principal mensal</label>
          <CurrencyInput
            value={profile.monthlyGoal || 0}
            onChange={v => setProfile({ ...profile, monthlyGoal: v })}
          />
          <span className="form-hint">Exibida com barra de progresso na Home</span>
        </div>

        {/* Metas adicionais — modulares para todos os segmentos */}
        <div className="form-group form-group-auto">
          <div className="form-auto-badge"><Target size={12} /> Metas adicionais</div>
        </div>

        {(profile.customGoals || []).map((cg, i) => (
          <div key={i} className="form-group custom-goal-block">
            <div className="custom-goal-header">
              <span className="custom-goal-emoji">{cg.icon || '🎯'}</span>
              <input
                type="text"
                placeholder="Nome (ex: Financiamento, Seguro…)"
                value={cg.label}
                onChange={e => {
                  const updated = [...(profile.customGoals || [])];
                  updated[i] = { ...updated[i], label: e.target.value };
                  setProfile({ ...profile, customGoals: updated });
                }}
                className="custom-goal-label-input"
              />
              <button
                type="button"
                className="custom-goal-remove"
                onClick={() => {
                  const updated = (profile.customGoals || []).filter((_, j) => j !== i);
                  setProfile({ ...profile, customGoals: updated });
                }}
              >
                <X size={14} />
              </button>
            </div>
            <CurrencyInput
              value={cg.target || 0}
              onChange={v => {
                const updated = [...(profile.customGoals || [])];
                updated[i] = { ...updated[i], target: v };
                setProfile({ ...profile, customGoals: updated });
              }}
            />
          </div>
        ))}

        {/* Sugestões rápidas por segmento */}
        {(() => {
          const presets = SEGMENT_GOAL_PRESETS[profile.segment] || [];
          const existingLabels = (profile.customGoals || []).map(g => g.label.toLowerCase());
          const suggestions = presets.filter(p => !existingLabels.includes(p.label.toLowerCase()));
          if (suggestions.length === 0) return null;
          return (
            <div className="form-group">
              <span className="form-hint" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <Sparkles size={12} /> Sugestões para seu segmento:
              </span>
              <div className="goal-presets">
                {suggestions.map(s => (
                  <button
                    key={s.label}
                    type="button"
                    className="goal-preset-chip"
                    onClick={() => setProfile({
                      ...profile,
                      customGoals: [...(profile.customGoals || []), { label: s.label, icon: s.icon, target: 0 }],
                    })}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="form-group">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setProfile({ ...profile, customGoals: [...(profile.customGoals || []), { label: '', icon: '🎯', target: 0 }] })}
          >
            <Plus size={13} /> Adicionar meta personalizada
          </button>
        </div>


        {/* Controladoria toggle */}
        <div className="form-group form-toggle-row">
          <div>
            <strong>Acesso Controladoria</strong>
            <p className="form-hint">Ativa a visão de gestão de metas — somente quem define metas da equipe</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={!!profile.isControladoria}
              onChange={e => setProfile({ ...profile, isControladoria: e.target.checked })}
            />
            <span className="toggle-track" />
          </label>
        </div>

        {/* Tipo de acesso */}
        <div className="form-group">
          <label className="form-label">Tipo de acesso</label>
          <div className="access-type-selector">
            {(['vendas', 'marketing', 'ambos'] as const).map(type => (
              <button
                key={type}
                type="button"
                className={`access-type-option${(profile.userAccessType || 'vendas') === type ? ' active' : ''}`}
                onClick={() => setProfile({
                  ...profile,
                  userAccessType: type,
                  isMarketing: type === 'marketing' || type === 'ambos',
                })}
              >
                {type === 'vendas' && 'Vendas'}
                {type === 'marketing' && 'Marketing'}
                {type === 'ambos' && 'Ambos'}
              </button>
            ))}
          </div>
        </div>

        <button className={`btn btn-primary save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
          <Save size={16} /> {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {/* Theme switcher */}
      <div className="theme-section card">
        <h3 className="section-title">Aparência</h3>
        <div className="theme-options">
          <button className={`theme-opt ${theme === 'light' ? 'active' : ''}`} onClick={() => applyTheme('light')}>
            <Sun size={16} /> Claro
          </button>
          <button className={`theme-opt ${theme === 'dark' ? 'active' : ''}`} onClick={() => applyTheme('dark')}>
            <Moon size={16} /> Escuro
          </button>
          <button className={`theme-opt ${theme === 'auto' ? 'active' : ''}`} onClick={() => applyTheme('auto')}>
            Auto
          </button>
        </div>
      </div>

      {(profile.userAccessType === 'ambos') && (
        <div className="card" style={{ padding: '16px' }}>
          <h3 className="section-title" style={{ marginBottom: 10 }}>Painel Marketing</h3>
          <Link to="/marketing-hub" className="link-card card" style={{ marginBottom: 0 }}>
            <div className="link-info">
              <h4><Megaphone size={14} /> Acessar Marketing Hub</h4>
              <p>Ofertas, concorrência e copiloto de marketing</p>
            </div>
            <ExternalLink size={16} />
          </Link>
        </div>
      )}

      <div className="profile-links">
        <h3 className="section-title">MAESTR.IA em Vendas</h3>
        <Link to="/ofertas" className="link-card card">
          <div className="link-info">
            <h4><Megaphone size={14} /> Ofertas do Mês</h4>
            <p>Campanhas ativas para usar com clientes</p>
          </div>
          <ExternalLink size={16} />
        </Link>
        <a href="https://gssacademy.vercel.app" target="_blank" rel="noopener noreferrer" className="link-card card">
          <div className="link-info">
            <h4>GSS Academy</h4>
            <p>Acesse o curso completo</p>
          </div>
          <ExternalLink size={16} />
        </a>
        <Link to="/instalar" className="link-card card">
          <div className="link-info">
            <h4><Download size={14} /> Instalar no celular</h4>
            <p>Passo a passo para iPhone ou Android</p>
          </div>
          <ExternalLink size={16} />
        </Link>
        <Link to="/feedback" className="link-card card">
          <div className="link-info">
            <h4><MessageCircle size={14} /> Enviar Feedback</h4>
            <p>Ajude a melhorar o app</p>
          </div>
          <ExternalLink size={16} />
        </Link>
        <Link to="/privacidade" className="link-card card">
          <div className="link-info">
            <h4><Shield size={14} /> Política de Privacidade</h4>
            <p>Como tratamos seus dados</p>
          </div>
          <ExternalLink size={16} />
        </Link>
      </div>

      {user && firebaseEnabled && (
        <button className="btn btn-outline signout-btn" onClick={handleSignOut}>
          <LogOut size={14} /> Sair da conta
        </button>
      )}

      <div className="app-info">
        <p>MAESTR.IA em Vendas</p>
        <p>Versão 4.0.0</p>
        {user && <p style={{ marginTop: 4, fontSize: 11 }}>{user.email}</p>}
      </div>
    </div>
  );
}

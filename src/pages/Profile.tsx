import { useState, useEffect } from 'react';
import { User, Building2, Briefcase, Save, ExternalLink, Factory, Moon, Sun, Target, Shield, Download, MessageCircle, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadData, saveData, KEYS } from '../services/storage';
import { SEGMENTS } from '../types';
import type { UserProfile } from '../types';
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
    setProfile(loadData(KEYS.PROFILE, { name: '', role: '', company: '', segment: '', monthlyGoal: 0 }));
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
          <label><Target size={14} /> Meta de comissão mensal (R$)</label>
          <input
            type="number"
            value={profile.monthlyGoal || ''}
            onChange={e => setProfile({ ...profile, monthlyGoal: Number(e.target.value) || 0 })}
            placeholder="Ex: 10000"
          />
          <span className="form-hint">Quanto você quer ganhar de comissão este mês — acompanhe na Home</span>
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

      <div className="profile-links">
        <h3 className="section-title">MAESTR.IA em Vendas</h3>
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

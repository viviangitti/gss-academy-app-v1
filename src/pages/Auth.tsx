import { useState } from 'react';
import { Mail, Lock, User as UserIcon, Briefcase, Building2, Factory, Target, Eye, EyeOff, ArrowRight, Globe } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, resetPassword, translateAuthError } from '../services/auth';
import { saveRemoteProfile } from '../services/firestore/profile';
import { saveData, loadData, KEYS } from '../services/storage';
import { SEGMENTS } from '../types';
import type { UserProfile, Segment } from '../types';
import './Auth.css';

type Mode = 'login' | 'signup' | 'reset';
type SignupStep = 1 | 2;

export default function Auth() {
  const [mode, setMode] = useState<Mode>('signup');
  const [step, setStep] = useState<SignupStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Credenciais (passo 1)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Perfil (passo 2)
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [segment, setSegment] = useState<Segment>('');
  const [monthlyGoal, setMonthlyGoal] = useState('');
  // Pré-carrega do localStorage se existir (migração)
  const existing = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '', monthlyGoal: 0 });

  const handleEmailSignup = async () => {
    setError('');
    if (!email || !password || !name) {
      setError('Preencha nome, email e senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    // Pré-preenche passo 2 com dados locais se houver
    if (existing.role) setRole(existing.role);
    if (existing.company) setCompany(existing.company);
    if (existing.segment) setSegment(existing.segment);
    if (existing.monthlyGoal) setMonthlyGoal(String(existing.monthlyGoal));
    if (!name && existing.name) setName(existing.name);
    setStep(2);
  };

  const handleFinishSignup = async () => {
    setError('');
    if (!role.trim() || !company.trim() || !segment) {
      setError('Preencha cargo, empresa e segmento.');
      return;
    }
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password, name);
      const profile: UserProfile = {
        name,
        role: role.trim(),
        company: company.trim(),
        segment,
        monthlyGoal: Number(monthlyGoal) || 0,
        email: user.email || email,
        uid: user.uid,
        teamId: null,
        isAdmin: false,
        createdAt: Date.now(),
      };

      await saveRemoteProfile(user.uid, profile);
      saveData(KEYS.PROFILE, profile);
    } catch (e) {
      const code = (e as { code?: string })?.code || '';
      setError(translateAuthError(code));
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Preencha email e senha.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      // AuthContext vai detectar e o App vai mudar de tela
    } catch (e) {
      const code = (e as { code?: string })?.code || '';
      setError(translateAuthError(code));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      // Se for signup e for novo usuário, vamos pro passo 2 pra coletar perfil
      // Detectamos "novo" tentando buscar perfil no firestore (feito pelo App depois)
      // Por enquanto, salvamos o básico e deixamos o App redirecionar pro perfil
      const minimal: UserProfile = {
        name: user.displayName || '',
        role: existing.role || '',
        company: existing.company || '',
        segment: existing.segment || '',
        monthlyGoal: existing.monthlyGoal || 0,
        email: user.email || '',
        uid: user.uid,
        teamId: null,
        isAdmin: false,
        createdAt: Date.now(),
      };
      saveData(KEYS.PROFILE, minimal);
      await saveRemoteProfile(user.uid, minimal);
    } catch (e) {
      const code = (e as { code?: string })?.code || '';
      setError(translateAuthError(code));
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError('');
    if (!email) {
      setError('Digite seu email.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (e) {
      const code = (e as { code?: string })?.code || '';
      setError(translateAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-logo">GSS</div>
        <h1>MAESTR.IA</h1>
        <p>em Vendas</p>
      </div>

      <div className="auth-card card">
        {mode === 'signup' && step === 1 && (
          <>
            <h2>Criar conta</h2>
            <p className="auth-subtitle">Seu copiloto de vendas no bolso.</p>

            <button className="btn btn-google" onClick={handleGoogle} disabled={loading}>
              <Globe size={18} /> Entrar com Google
            </button>

            <div className="auth-divider"><span>ou</span></div>

            <div className="auth-field">
              <UserIcon size={14} />
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="auth-field">
              <Mail size={14} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="auth-field">
              <Lock size={14} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Senha (mín. 6 caracteres)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button className="auth-eye" onClick={() => setShowPass(!showPass)} type="button">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn btn-primary auth-submit" onClick={handleEmailSignup} disabled={loading}>
              Continuar <ArrowRight size={16} />
            </button>

            <p className="auth-switch">
              Já tem conta? <button className="link-btn" onClick={() => { setMode('login'); setError(''); }}>Entrar</button>
            </p>
          </>
        )}

        {mode === 'signup' && step === 2 && (
          <>
            <h2>Seu perfil profissional</h2>
            <p className="auth-subtitle">Personaliza objeções, roteiros e notícias do seu mercado.</p>

            <div className="auth-field">
              <Briefcase size={14} />
              <input
                type="text"
                placeholder="Cargo (ex: Líder Comercial)"
                value={role}
                onChange={e => setRole(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <Building2 size={14} />
              <input
                type="text"
                placeholder="Empresa"
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <Factory size={14} />
              <select value={segment} onChange={e => setSegment(e.target.value as Segment)}>
                {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="auth-field">
              <Target size={14} />
              <input
                type="number"
                placeholder="Meta de comissão mensal (R$) — opcional"
                value={monthlyGoal}
                onChange={e => setMonthlyGoal(e.target.value)}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn btn-primary auth-submit" onClick={handleFinishSignup} disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'} <ArrowRight size={16} />
            </button>

            <p className="auth-switch">
              <button className="link-btn" onClick={() => { setStep(1); setError(''); }}>← Voltar</button>
            </p>
          </>
        )}

        {mode === 'login' && (
          <>
            <h2>Entrar</h2>
            <p className="auth-subtitle">Acesse seus dados sincronizados.</p>

            <button className="btn btn-google" onClick={handleGoogle} disabled={loading}>
              <Globe size={18} /> Entrar com Google
            </button>

            <div className="auth-divider"><span>ou</span></div>

            <div className="auth-field">
              <Mail size={14} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="auth-field">
              <Lock size={14} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button className="auth-eye" onClick={() => setShowPass(!showPass)} type="button">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn btn-primary auth-submit" onClick={handleLogin} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'} <ArrowRight size={16} />
            </button>

            <p className="auth-switch">
              <button className="link-btn" onClick={() => { setMode('reset'); setError(''); setResetSent(false); }}>
                Esqueci minha senha
              </button>
            </p>
            <p className="auth-switch">
              Novo aqui? <button className="link-btn" onClick={() => { setMode('signup'); setStep(1); setError(''); }}>Criar conta</button>
            </p>
          </>
        )}

        {mode === 'reset' && (
          <>
            <h2>Recuperar senha</h2>
            <p className="auth-subtitle">Enviaremos um link de redefinição para seu email.</p>

            {resetSent ? (
              <>
                <div className="auth-success">
                  ✓ Email enviado! Confira sua caixa de entrada (e spam).
                </div>
                <button className="btn btn-primary auth-submit" onClick={() => { setMode('login'); setResetSent(false); }}>
                  Voltar ao login
                </button>
              </>
            ) : (
              <>
                <div className="auth-field">
                  <Mail size={14} />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button className="btn btn-primary auth-submit" onClick={handleReset} disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>

                <p className="auth-switch">
                  <button className="link-btn" onClick={() => { setMode('login'); setError(''); }}>← Voltar ao login</button>
                </p>
              </>
            )}
          </>
        )}
      </div>

      <p className="auth-footer">
        Ao continuar você aceita a <a href="/privacidade">política de privacidade</a>.
      </p>
    </div>
  );
}

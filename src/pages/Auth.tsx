import { useState } from 'react';
import { Mail, Lock, User as UserIcon, Building2, Factory, Eye, EyeOff, ArrowRight, TrendingUp, Megaphone, Users, Tag } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, resetPassword, translateAuthError } from '../services/auth';
import { saveRemoteProfile } from '../services/firestore/profile';
import { claimDealershipManager } from '../services/firestore/dealership';
import { saveData, loadData, KEYS } from '../services/storage';
import { SEGMENTS, VEHICLE_BRANDS } from '../types';
import type { UserProfile, Segment } from '../types';
import './Auth.css';

type Mode = 'login' | 'signup' | 'reset';
type SignupStep = 1 | 2;

interface AuthProps {
  sessionExpired?: boolean;
}

export default function Auth({ sessionExpired = false }: AuthProps) {
  const [mode, setMode] = useState<Mode>(sessionExpired ? 'login' : 'signup');
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
  const [company, setCompany] = useState('');
  const [brand, setBrand] = useState('');
  const [segment, setSegment] = useState<Segment>('');
  // Papel escolhido no cadastro — define acesso e se é gestor. Travado depois (só admin ajusta).
  const [papel, setPapel] = useState<'executivo' | 'gerente' | 'marketing'>('executivo');
  // Pré-carrega do localStorage se existir (migração)
  const existing = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });

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
    if (existing.brand) setBrand(existing.brand);
    if (existing.company) setCompany(existing.company);
    if (existing.segment) setSegment(existing.segment);
    if (!name && existing.name) setName(existing.name);
    setStep(2);
  };

  const handleFinishSignup = async () => {
    setError('');
    if (!company.trim() || !segment) {
      setError('Preencha concessionária e segmento.');
      return;
    }
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password, name);
      // Papel é escolhido no cadastro (não muda depois)
      const isGestor = papel === 'gerente';
      const userAccessType: 'vendas' | 'marketing' = papel === 'marketing' ? 'marketing' : 'vendas';
      // Cargo deriva do papel (campo removido do cadastro)
      const role = papel === 'gerente' ? 'Gerente de vendas' : papel === 'marketing' ? 'Responsável de marketing' : 'Executivo de vendas';
      // Gerente também é registrado como gestor da concessionária (best-effort)
      if (isGestor) { try { await claimDealershipManager(company.trim(), user.uid, name); } catch { /* ignora */ } }
      const profile: UserProfile = {
        name,
        role,
        brand: brand.trim(),
        company: company.trim(),
        segment,
        email: user.email || email,
        uid: user.uid,
        teamId: null,
        isAdmin: false,
        isGestor,
        isMarketing: papel === 'marketing',
        userAccessType,
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
        {sessionExpired && (
          <div className="auth-session-expired-banner">
            ⚠️ Sua sessão expirou. Faça login novamente para continuar.
          </div>
        )}

        {mode === 'signup' && step === 1 && (
          <>
            <h2>Criar conta</h2>
            <p className="auth-subtitle">Seu assistente na palma da mão.</p>

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

            <div className="auth-access-selector auth-roles">
              <button
                type="button"
                className={`auth-access-option${papel === 'executivo' ? ' active' : ''}`}
                onClick={() => setPapel('executivo')}
              >
                <TrendingUp size={18} />
                <span>Executivo de vendas</span>
              </button>
              <button
                type="button"
                className={`auth-access-option${papel === 'gerente' ? ' active' : ''}`}
                onClick={() => setPapel('gerente')}
              >
                <Users size={18} />
                <span>Gerente de vendas</span>
              </button>
              <button
                type="button"
                className={`auth-access-option${papel === 'marketing' ? ' active' : ''}`}
                onClick={() => setPapel('marketing')}
              >
                <Megaphone size={18} />
                <span>Responsável de marketing</span>
              </button>
            </div>
            <p className="auth-role-note">Escolha o seu papel — isso define seu acesso e não muda depois.</p>

            <div className="auth-field">
              <Tag size={14} />
              <select value={brand} onChange={e => setBrand(e.target.value)}>
                <option value="">Marca (ex: Toyota)</option>
                {VEHICLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="auth-field">
              <Building2 size={14} />
              <input
                type="text"
                placeholder="Concessionária (ex: Ramasa)"
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

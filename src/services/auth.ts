// Autenticação com Firebase: email/senha + Google
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  type User,
} from 'firebase/auth';
import { auth, firebaseEnabled } from './firebase';

// No celular/PWA o popup do Google costuma ser bloqueado — usamos redirect.
function prefersRedirect(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isStandalone =
    (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return isMobile || Boolean(isStandalone);
}

export type AuthUser = User;

export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  if (!firebaseEnabled || !auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<AuthUser> {
  if (!auth) throw new Error('Firebase não configurado');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await fbUpdateProfile(cred.user, { displayName: name });
  }
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  if (!auth) throw new Error('Firebase não configurado');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Login com Google. No desktop usa popup; no celular/PWA usa redirect (popup é bloqueado).
 * Quando vai por redirect, a página navega e a função retorna null — o login é concluído
 * no carregamento seguinte via completeGoogleRedirect() + onAuthChange.
 */
export async function signInWithGoogle(): Promise<AuthUser | null> {
  if (!auth) throw new Error('Firebase não configurado');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  if (prefersRedirect()) {
    await signInWithRedirect(auth, provider);
    return null; // navega para o Google; conclui no retorno
  }

  try {
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  } catch (e) {
    const code = (e as { code?: string })?.code || '';
    // Popup bloqueado/não suportado → cai pro redirect
    if (/popup|operation-not-supported|cancelled-popup|web-storage-unsupported/.test(code)) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw e;
  }
}

/** Conclui um login Google feito por redirect (chamar no boot). Retorna o usuário ou null. */
export async function completeGoogleRedirect(): Promise<AuthUser | null> {
  if (!auth) return null;
  try {
    const res = await getRedirectResult(auth);
    return res?.user ?? null;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  await fbSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase não configurado');
  await sendPasswordResetEmail(auth, email, {
    url: window.location.origin,   // redireciona de volta ao app após redefinir
    handleCodeInApp: false,
  });
}

export function getCurrentUser(): AuthUser | null {
  return auth?.currentUser ?? null;
}

// Mensagens de erro em português
export function translateAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Este email já está cadastrado. Tente entrar.',
    'auth/invalid-email': 'Email inválido.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/user-not-found': 'Email não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Email ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
    'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
    'auth/popup-closed-by-user': 'Login cancelado.',
    'auth/popup-blocked': 'O navegador bloqueou o popup do Google. Libere e tente novamente.',
    'auth/unauthorized-domain': 'Domínio não autorizado no Firebase. Peça ao administrador para adicionar este domínio no Console do Firebase.',
    'auth/missing-android-pkg-name': 'Configuração inválida de reset.',
    'auth/missing-continue-uri': 'URL de retorno não configurada.',
  };
  return map[code] || 'Não foi possível completar a operação. Tente novamente.';
}

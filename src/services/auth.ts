// Autenticação com Firebase: email/senha + Google
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  type User,
} from 'firebase/auth';
import { auth, firebaseEnabled } from './firebase';

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

export async function signInWithGoogle(): Promise<AuthUser> {
  if (!auth) throw new Error('Firebase não configurado');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  await fbSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase não configurado');
  await sendPasswordResetEmail(auth, email);
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
  };
  return map[code] || 'Não foi possível completar a operação. Tente novamente.';
}

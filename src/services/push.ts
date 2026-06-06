// Notificações push (Firebase Cloud Messaging)
// Cliente: pede permissão, obtém o token do dispositivo e salva no Firestore.
// Envio: feito pela função serverless /api/send-push (firebase-admin).

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseApp, db } from './firebase';
import type { UserProfile } from '../types';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
const TOKEN_FLAG = 'gss_push_token';

export function pushConfigured(): boolean {
  return Boolean(VAPID_KEY);
}

export async function pushSupported(): Promise<boolean> {
  try {
    return pushConfigured() && 'Notification' in window && (await isSupported());
  } catch {
    return false;
  }
}

export function pushPermission(): NotificationPermission {
  return typeof Notification !== 'undefined' ? Notification.permission : 'default';
}

/** Pede permissão, obtém o token e salva no Firestore. Retorna true se ativou. */
export async function enablePush(profile: UserProfile): Promise<boolean> {
  if (!(await pushSupported()) || !db) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const app = getFirebaseApp();
  if (!app) return false;

  // garante que o SW de cache já está registrado; o FCM registra o seu próprio
  const swReg = await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope')
    .catch(() => undefined);

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  }).catch(() => '');

  if (!token) return false;

  // 1 doc por token (mesmo usuário em vários aparelhos = vários docs)
  await setDoc(doc(db, 'pushTokens', token), {
    token,
    uid: profile.uid || '',
    name: profile.name || '',
    company: (profile.company || '').trim().toLowerCase(),
    segment: profile.segment || '',
    userAccessType: profile.userAccessType || 'vendas',
    updatedAt: serverTimestamp(),
  }, { merge: true });

  localStorage.setItem(TOKEN_FLAG, token);
  return true;
}

export function pushEnabledLocally(): boolean {
  return Boolean(localStorage.getItem(TOKEN_FLAG)) && pushPermission() === 'granted';
}

/** Dispara um aviso para a equipe (chama a função serverless). Best-effort. */
export async function notifyTeam(opts: {
  title: string;
  body: string;
  url?: string;
  company: string;
  segment?: string;
  audience?: 'vendas' | 'marketing' | 'all';
}): Promise<void> {
  try {
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: opts.title,
        body: opts.body,
        url: opts.url || '/',
        company: (opts.company || '').trim().toLowerCase(),
        segment: opts.segment || '',
        audience: opts.audience || 'vendas',
      }),
    });
  } catch {
    /* silencioso — não trava o fluxo de quem cadastrou */
  }
}

// Sync genérico de coleções para o Firestore
// Cada coleção é um documento com { items: T[], updatedAt }
// Leitura sempre do localStorage (rápido), escrita em background

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function ref(uid: string, name: string) {
  return doc(db!, 'users', uid, 'data', name);
}

export async function pushData(uid: string, name: string, items: unknown[]): Promise<void> {
  if (!db) return;
  try {
    await setDoc(ref(uid, name), { items, updatedAt: serverTimestamp() });
  } catch {
    // Offline ou sem permissão — ignora silenciosamente
  }
}

export async function pullData<T>(uid: string, name: string): Promise<T[] | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(ref(uid, name));
    if (!snap.exists()) return null;
    const data = snap.data();
    return Array.isArray(data.items) ? (data.items as T[]) : null;
  } catch {
    return null;
  }
}

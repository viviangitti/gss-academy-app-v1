import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface FeedbackData {
  uid?: string;
  name?: string;
  email?: string;
  rating: number;
  mostUsed: string;
  whatMissing: string;
  bug: string;
  suggestion: string;
}

export async function saveFeedback(data: FeedbackData): Promise<void> {
  if (!db) return;
  await addDoc(collection(db, 'feedbacks'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

/** Feedback rápido (👍/👎) numa resposta da IA — Boost, Coach etc. */
export interface QuickFeedback {
  uid?: string;
  name?: string;
  email?: string;
  feature: string;            // 'coach' | 'boost' | 'boost-debrief'
  vote: 'up' | 'down';
  context?: string;           // pergunta/situação que gerou a resposta
  response?: string;          // trecho da resposta da IA
  reason?: string;            // motivo opcional (no 👎)
}

/** Grava o voto e devolve o id do doc (pra depois anexar o motivo). */
export async function saveQuickFeedback(data: QuickFeedback): Promise<string | null> {
  if (!db) return null;
  // Firestore rejeita campos undefined — remove antes de gravar.
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  const ref = await addDoc(collection(db, 'aiFeedback'), {
    ...clean,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Anexa o motivo a um feedback já gravado (no mesmo doc). */
export async function addFeedbackReason(id: string, reason: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'aiFeedback', id), { reason });
}

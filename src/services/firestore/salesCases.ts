// Cérebro coletivo: casos reais ANÔNIMOS da empresa.
// Cada venda fechada/perdida (e objeção contornada) vira um caso compartilhado.
// A IA consome esses casos pra responder com o que funcionou DE VERDADE na equipe.
import {
  collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export type CaseKind = 'won' | 'lost' | 'objection_won';

export interface SalesCase {
  kind: CaseKind;
  company: string;        // chave da empresa (minúsculo)
  segment: string;
  objection?: string;     // objeção enfrentada (ex: "está caro")
  approach?: string;      // o que foi feito/falado (anônimo)
  reason?: string;        // motivo da perda (label legível)
  learning?: string;      // o que faria diferente
  stage?: string;
  value?: number;
  createdAt?: unknown;
}

const COLLECTION = 'salesCases';

/** Registra um caso (fire-and-forget — nunca trava o fluxo de quem registrou). */
export function logCase(c: SalesCase): void {
  if (!db || !c.company) return;
  addDoc(collection(db, COLLECTION), {
    ...c,
    company: c.company.trim().toLowerCase(),
    createdAt: serverTimestamp(),
  }).catch(() => { /* offline/permissão — silencioso */ });
}

/** Últimos casos da empresa (mais recentes primeiro). */
export async function fetchRecentCases(company: string, max = 30): Promise<SalesCase[]> {
  if (!db || !company) return [];
  try {
    const q = query(
      collection(db, COLLECTION),
      where('company', '==', company.trim().toLowerCase()),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SalesCase);
  } catch {
    return [];
  }
}

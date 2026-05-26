import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Segment } from '../../types';

export interface CommercialCondition {
  id: string;
  title: string;
  brand: string;          // ex: "Toyota", "GSS", "Própria"
  type: string;           // ex: "Tabela", "Campanha", "Financiamento"
  segment: Segment | '';  // '' = todos os segmentos
  month: string;          // "2026-05" — YYYY-MM
  pdfUrl: string;         // Google Drive link direto
  description: string;
  highlights: string[];
  active: boolean;
  createdAt?: unknown;
  createdBy?: string;
}

const COL = 'commercialConditions';

export async function getCommercialConditions(): Promise<CommercialCondition[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, COL), orderBy('month', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommercialCondition));
}

export async function getActiveConditionsForMonth(month: string, segment?: Segment): Promise<CommercialCondition[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, COL), orderBy('month', 'desc')));
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommercialCondition));
  return all.filter(c =>
    c.active &&
    c.month === month &&
    (!segment || c.segment === '' || c.segment === segment)
  );
}

export async function createCommercialCondition(
  data: Omit<CommercialCondition, 'id'>,
  uid: string,
): Promise<string> {
  if (!db) throw new Error('offline');
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCommercialCondition(
  id: string,
  data: Partial<CommercialCondition>,
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COL, id), { ...data });
}

export async function deleteCommercialCondition(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COL, id));
}

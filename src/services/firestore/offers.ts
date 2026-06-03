import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Offer, Segment } from '../../types';

const COL = 'offers';

/** Busca ofertas ativas hoje (para vendedor e para IA) */
export async function getActiveOffers(segment?: Segment): Promise<Offer[]> {
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  const snap = await getDocs(collection(db, COL));
  let all = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Offer))
    .filter(o => o.active && o.validTo >= today)
    .sort((a, b) => a.validTo.localeCompare(b.validTo));
  if (!segment) return all;
  return all.filter(o => !o.segments || o.segments.length === 0 || o.segments.includes(segment));
}

/** Busca todas as ofertas (para painel marketing) */
export async function getAllOffers(): Promise<Offer[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, COL), orderBy('validTo', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer));
}

/** Cria oferta nova */
export async function createOffer(offer: Omit<Offer, 'id'>, uid: string): Promise<string> {
  if (!db) throw new Error('offline');
  const ref = await addDoc(collection(db, COL), {
    ...offer,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Atualiza oferta existente */
export async function updateOffer(id: string, data: Partial<Offer>): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COL, id), { ...data });
}

/** Remove oferta */
export async function deleteOffer(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COL, id));
}

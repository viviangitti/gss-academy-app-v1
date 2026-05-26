import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { CompetitorOffer, Segment } from '../../types';

const COL = 'competitorOffers';

export async function getActiveCompetitorOffers(segment?: Segment): Promise<CompetitorOffer[]> {
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  const snap = await getDocs(
    query(
      collection(db, COL),
      where('active', '==', true),
      where('validTo', '>=', today),
      orderBy('validTo', 'asc'),
    )
  );
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as CompetitorOffer));
  if (!segment) return all;
  return all.filter(o => o.segments.length === 0 || o.segments.includes(segment));
}

export async function getAllCompetitorOffers(): Promise<CompetitorOffer[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, COL), orderBy('competitor', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompetitorOffer));
}

export async function createCompetitorOffer(offer: Omit<CompetitorOffer, 'id'>, uid: string): Promise<string> {
  if (!db) throw new Error('offline');
  const ref = await addDoc(collection(db, COL), {
    ...offer,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCompetitorOffer(id: string, data: Partial<CompetitorOffer>): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COL, id), { ...data });
}

export async function deleteCompetitorOffer(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COL, id));
}

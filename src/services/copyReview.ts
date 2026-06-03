import { loadData, saveData } from './storage';
import { auth } from './firebase';
import { pushData } from './firestore/sync';

function syncReviews(items: CopyReview[]) {
  const uid = auth?.currentUser?.uid;
  if (uid) pushData(uid, 'copyReviews', items).catch(() => {});
}

const KEY = 'gss_copy_reviews';

export type CopyType = 'anuncio' | 'legenda' | 'email' | 'sms' | 'outro';
export const COPY_TYPE_LABELS: Record<CopyType, string> = {
  anuncio: 'Anúncio',
  legenda: 'Legenda / Post',
  email: 'E-mail',
  sms: 'SMS / WhatsApp',
  outro: 'Outro',
};

export interface CopyReview {
  id: string;
  date: string;   // YYYY-MM-DD
  type: CopyType;
  text: string;   // the copy text
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getCopyReviews(): CopyReview[] {
  return loadData<CopyReview[]>(KEY, []);
}

export function addCopyReview(data: Omit<CopyReview, 'id'>): CopyReview {
  const all = getCopyReviews();
  const entry: CopyReview = { ...data, id: generateId() };
  const updated = [entry, ...all];
  saveData(KEY, updated);
  syncReviews(updated);
  return entry;
}

export function removeCopyReview(id: string) {
  const updated = getCopyReviews().filter(r => r.id !== id);
  saveData(KEY, updated);
  syncReviews(updated);
}

import { loadData, saveData } from './storage';
import { auth } from './firebase';
import { pushData } from './firestore/sync';

function syncReviews(items: CampaignReview[]) {
  const uid = auth?.currentUser?.uid;
  if (uid) pushData(uid, 'campaignReviews', items).catch(() => {});
}

const KEY = 'gss_campaign_reviews';

export interface CampaignReview {
  id: string;
  date: string;    // YYYY-MM-DD
  name: string;
  notes: string;   // texto livre — o que aconteceu, números, etc.
  photo?: string;  // base64 data URL (thumbnail)
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getCampaignReviews(): CampaignReview[] {
  return loadData<CampaignReview[]>(KEY, []);
}

export function addCampaignReview(data: Omit<CampaignReview, 'id'>): CampaignReview {
  const all = getCampaignReviews();
  const entry: CampaignReview = { ...data, id: generateId() };
  const updated = [entry, ...all];
  saveData(KEY, updated);
  syncReviews(updated);
  return entry;
}

export function removeCampaignReview(id: string) {
  const updated = getCampaignReviews().filter(r => r.id !== id);
  saveData(KEY, updated);
  syncReviews(updated);
}

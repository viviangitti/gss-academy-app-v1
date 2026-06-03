import { loadData, saveData } from './storage';
import { auth } from './firebase';
import { pushData } from './firestore/sync';

function syncPreLaunches(items: PreLaunch[]) {
  const uid = auth?.currentUser?.uid;
  if (uid) pushData(uid, 'preLaunches', items).catch(() => {});
}

const KEY = 'gss_pre_launches';

export interface PreLaunch {
  id: string;
  date: string;   // YYYY-MM-DD
  name: string;   // campaign name
  brief: string;  // free text: describe the campaign
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getPreLaunches(): PreLaunch[] {
  return loadData<PreLaunch[]>(KEY, []);
}

export function addPreLaunch(data: Omit<PreLaunch, 'id'>): PreLaunch {
  const all = getPreLaunches();
  const entry: PreLaunch = { ...data, id: generateId() };
  const updated = [entry, ...all];
  saveData(KEY, updated);
  syncPreLaunches(updated);
  return entry;
}

export function removePreLaunch(id: string) {
  const updated = getPreLaunches().filter(r => r.id !== id);
  saveData(KEY, updated);
  syncPreLaunches(updated);
}

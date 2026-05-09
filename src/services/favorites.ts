import { auth } from './firebase';
import { pushData } from './firestore/sync';

const KEY = 'gss_favorites';

export type FavoriteType = 'objection' | 'script' | 'technique' | 'urgency';

export interface Favorite {
  id: string;
  type: FavoriteType;
  label: string;
  addedAt: number;
}

function syncFavs(items: Favorite[]) {
  const uid = auth?.currentUser?.uid;
  if (uid) pushData(uid, 'favorites', items).catch(() => {});
}

export function getFavorites(): Favorite[] {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isFavorite(type: FavoriteType, id: string): boolean {
  return getFavorites().some(f => f.type === type && f.id === id);
}

export function toggleFavorite(type: FavoriteType, id: string, label: string): boolean {
  const favs = getFavorites();
  const existing = favs.findIndex(f => f.type === type && f.id === id);
  if (existing >= 0) {
    favs.splice(existing, 1);
    localStorage.setItem(KEY, JSON.stringify(favs));
    syncFavs(favs);
    return false;
  }
  favs.push({ id, type, label, addedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(favs));
  syncFavs(favs);
  return true;
}

export function getFavoritesByType(type: FavoriteType): Favorite[] {
  return getFavorites().filter(f => f.type === type);
}

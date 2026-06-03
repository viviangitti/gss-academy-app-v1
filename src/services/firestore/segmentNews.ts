import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type { NewsItem } from '../../types';
import type { NewsCategory } from '../news';

export interface SegmentNewsDoc {
  segment: string;
  category: NewsCategory;
  geo: 'brasil' | 'mundo';
  tag: string;
  title: string;
  description: string;
  pubDate: string;
  source: string;
  link: string;
  active: boolean;
  refreshedAt: number;
}

export async function fetchSegmentNews(
  segment: string,
  category: NewsCategory,
  geo: 'brasil' | 'mundo' = 'brasil',
): Promise<NewsItem[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'segmentNews'),
      where('segment', '==', segment),
      where('geo', '==', geo),
      where('active', '==', true),
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => d.data() as SegmentNewsDoc);

    // Filter by category: 'tudo' gets everything, others filter by matching category
    const filtered = category === 'tudo'
      ? docs
      : docs.filter(d => d.category === category);

    return filtered.map(d => ({
      title: d.tag ? `${d.tag} ${d.title}` : d.title,
      description: d.description,
      pubDate: d.pubDate,
      link: d.link || '',
    }));
  } catch {
    return [];
  }
}

/** Extrai o domínio de uma URL para usar como source */
function extractSource(link: string): string {
  try {
    const url = new URL(link);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Salva um lote de notícias no Firestore (batch write, máx 500 por batch) */
export async function saveSegmentNews(items: SegmentNewsDoc[]): Promise<void> {
  if (!db || items.length === 0) return;
  const BATCH_SIZE = 499;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(item => {
      const ref = doc(collection(db!, 'segmentNews'));
      batch.set(ref, item);
    });
    await batch.commit();
  }
}

/** Deleta todos os docs de um segment+category+geo antes de salvar novos */
export async function deleteOldSegmentNews(
  segment: string,
  category: NewsCategory,
  geo: 'brasil' | 'mundo',
): Promise<void> {
  if (!db) return;
  const q = query(
    collection(db, 'segmentNews'),
    where('segment', '==', segment),
    where('category', '==', category),
    where('geo', '==', geo),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const BATCH_SIZE = 499;
  const allDocs = snap.docs;
  for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
    const chunk = allDocs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

/** Converte NewsItem[] em SegmentNewsDoc[] prontos para salvar */
export function newsItemsToSegmentDocs(
  items: NewsItem[],
  segment: string,
  category: NewsCategory,
  geo: 'brasil' | 'mundo',
): SegmentNewsDoc[] {
  const now = Date.now();
  return items.map(item => ({
    segment,
    category,
    geo,
    tag: '',
    title: item.title,
    description: item.description,
    pubDate: item.pubDate,
    source: extractSource(item.link),
    link: item.link,
    active: true,
    refreshedAt: now,
  }));
}

/** Retorna o refreshedAt mais recente para um segment+category+geo */
export async function getSegmentNewsRefreshedAt(
  segment: string,
  category: NewsCategory,
  geo: 'brasil' | 'mundo',
): Promise<number | null> {
  if (!db) return null;
  try {
    const q = query(
      collection(db, 'segmentNews'),
      where('segment', '==', segment),
      where('category', '==', category),
      where('geo', '==', geo),
      where('active', '==', true),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const timestamps = snap.docs.map(d => (d.data() as SegmentNewsDoc).refreshedAt || 0);
    return Math.max(...timestamps);
  } catch {
    return null;
  }
}

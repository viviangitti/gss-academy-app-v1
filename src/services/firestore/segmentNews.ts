import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { NewsItem } from '../../types';
import type { NewsCategory } from '../news';

export interface SegmentNewsDoc {
  segment: string;
  category: NewsCategory;
  tag: string;
  title: string;
  description: string;
  pubDate: string;
  source: string;
  link: string;
  active: boolean;
}

export async function fetchSegmentNews(
  segment: string,
  category: NewsCategory,
): Promise<NewsItem[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'segmentNews'),
      where('segment', '==', segment),
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

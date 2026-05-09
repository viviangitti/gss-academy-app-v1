import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface FeedbackData {
  uid?: string;
  name?: string;
  email?: string;
  rating: number;
  mostUsed: string;
  whatMissing: string;
  bug: string;
  suggestion: string;
}

export async function saveFeedback(data: FeedbackData): Promise<void> {
  if (!db) return;
  await addDoc(collection(db, 'feedbacks'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

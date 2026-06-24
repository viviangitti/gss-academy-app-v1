import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../../types';

/** Lista todos os vendedores da mesma empresa */
export async function getTeamMembers(company: string): Promise<UserProfile[]> {
  if (!db || !company) return [];
  const q = query(
    collection(db, 'users'),
    where('company', '==', company),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
}

/** Atualiza metas de um vendedor pelo uid */
export async function updateMemberGoals(
  uid: string,
  goals: {
    monthlyGoal?: number;
    monthlyGoalFinancing?: number;
    monthlyGoalAccessories?: number;
    customGoals?: Array<{ label: string; target: number }>;
  }
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), { ...goals });
}

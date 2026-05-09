import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../../types';

/** Lista todos os vendedores do mesmo teamId (exclui a própria controladoria) */
export async function getTeamMembers(teamId: string): Promise<UserProfile[]> {
  if (!db || !teamId) return [];
  const q = query(
    collection(db, 'users'),
    where('teamId', '==', teamId),
    where('isControladoria', '!=', true),
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
  }
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), { ...goals });
}

// Sync de perfil do usuário no Firestore
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../../types';

export async function getRemoteProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function saveRemoteProfile(uid: string, profile: UserProfile): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid),
    {
      ...profile,
      uid,
      updatedAt: serverTimestamp(),
      createdAt: profile.createdAt || Date.now(),
    },
    { merge: true }
  );
}

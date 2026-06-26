// Status ao vivo — quem da equipe está "em atendimento" agora.
// 1 doc por vendedor (id = uid). O gestor lê os status recentes da empresa.

import { collection, doc, setDoc, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../../types';

const COL = 'liveStatus';
const STALE_MS = 90 * 60 * 1000; // status com +90min sem atualizar é ignorado (vendedor esqueceu de desmarcar)

export interface LiveStatus {
  uid: string;
  name: string;
  company: string;
  emAtendimento: boolean;
  clientHint?: string;   // opcional: nome/ref do cliente
  updatedAt?: unknown;   // serverTimestamp
}

export interface LiveMember {
  uid: string;
  name: string;
  clientHint?: string;
  since?: Date;
}

/** Marca/desmarca o vendedor logado como "em atendimento agora". */
export async function setMyLiveStatus(
  profile: UserProfile,
  emAtendimento: boolean,
  clientHint?: string,
): Promise<void> {
  if (!db || !profile.uid) return;
  try {
    await setDoc(
      doc(db, COL, profile.uid),
      {
        uid: profile.uid,
        name: profile.name || '',
        company: profile.company || '',
        emAtendimento,
        clientHint: clientHint || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch { /* offline — ignora */ }
}

/** Lista quem da equipe está em atendimento agora (status recente e ativo). */
export async function getTeamLiveStatus(company: string): Promise<LiveMember[]> {
  if (!db || !company) return [];
  try {
    const snap = await getDocs(collection(db, COL));
    const now = Date.now();
    return snap.docs
      .map(d => d.data() as LiveStatus)
      .filter(s => s.company === company && s.emAtendimento)
      .filter(s => {
        const t = (s.updatedAt as Timestamp | undefined)?.toMillis?.() ?? 0;
        return t > 0 && now - t < STALE_MS;
      })
      .map(s => ({
        uid: s.uid,
        name: s.name,
        clientHint: s.clientHint || undefined,
        since: (s.updatedAt as Timestamp | undefined)?.toDate?.(),
      }))
      .sort((a, b) => (b.since?.getTime() || 0) - (a.since?.getTime() || 0));
  } catch {
    return [];
  }
}

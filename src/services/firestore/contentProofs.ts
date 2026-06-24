// Comprovação de posts (print do conteúdo publicado).
// O vendedor anexa um screenshot do post; vira prova no painel do gestor.
// Imagem vai pro Storage; metadados pra coleção `contentProofs`.

import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const COL = 'contentProofs';

export interface ContentProof {
  uid: string;
  name: string;
  company: string;
  segment: string;
  monthKey: string;     // "2026-06"
  contentId: string;
  caption: string;
  imageUrl: string;
  createdAt?: unknown;
}

export interface TeamProof extends ContentProof {
  id: string;
}

/**
 * Faz upload do print pro Storage e registra a comprovação no Firestore.
 * Caminho: contentProofs/{uid}/{monthKey}/{contentId}_{timestamp}.{ext}
 * @returns URL pública da imagem
 */
export async function saveContentProof(params: {
  uid: string;
  name: string;
  company: string;
  segment: string;
  monthKey: string;
  contentId: string;
  caption: string;
  file: File;
  onProgress?: (pct: number) => void;
}): Promise<string> {
  if (!storage || !db) throw new Error('Firebase não configurado.');
  const { uid, file, monthKey, contentId } = params;

  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
  const path = `contentProofs/${uid}/${monthKey}/${contentId}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);

  const url: string = await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public,max-age=31536000',
    });
    task.on(
      'state_changed',
      s => params.onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      err => reject(err),
      async () => resolve(await getDownloadURL(task.snapshot.ref)),
    );
  });

  await addDoc(collection(db, COL), {
    uid,
    name: params.name,
    company: params.company,
    segment: params.segment,
    monthKey,
    contentId,
    caption: params.caption,
    imageUrl: url,
    createdAt: serverTimestamp(),
  });

  return url;
}

/** Comprovações da equipe no mês (galeria do painel do gestor). */
export async function getTeamProofs(company: string, monthKey: string, max = 60): Promise<TeamProof[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, COL));
    return snap.docs
      .map(d => ({ id: d.id, ...(d.data() as ContentProof) }))
      .filter(p => p.monthKey === monthKey)
      .filter(p => (company ? p.company === company : true))
      .sort((a, b) => {
        const ta = (a.createdAt as { seconds?: number } | undefined)?.seconds || 0;
        const tb = (b.createdAt as { seconds?: number } | undefined)?.seconds || 0;
        return tb - ta;
      })
      .slice(0, max);
  } catch {
    return [];
  }
}

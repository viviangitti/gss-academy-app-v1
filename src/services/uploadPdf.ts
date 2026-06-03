// Upload de PDF para Firebase Storage
// Retorna a URL de download permanente (nunca quebra enquanto o arquivo existir no Storage)

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgress {
  percent: number;  // 0–100
  done: boolean;
  url?: string;
  error?: string;
}

/**
 * Faz upload de um arquivo PDF para Firebase Storage.
 * Caminho: pdfs/conditions/{timestamp}-{sanitizedName}
 *
 * @param file   Arquivo PDF selecionado pelo usuário
 * @param onProgress  Callback chamado com % de progresso
 * @returns URL de download pública e permanente
 */
export async function uploadConditionPdf(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (!storage) throw new Error('Firebase Storage não configurado.');

  const sanitized = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `pdfs/conditions/${Date.now()}-${sanitized}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: 'application/pdf',
      cacheControl: 'public,max-age=31536000',
    });

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(pct);
      },
      err => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      },
    );
  });
}

/**
 * Remove um arquivo do Storage a partir da URL de download.
 * Usado ao deletar uma condição com PDF salvo no Storage.
 */
export async function deletePdfByUrl(url: string): Promise<void> {
  if (!storage) return;
  try {
    // URL do Storage tem o formato: https://firebasestorage.googleapis.com/v0/b/...
    if (!url.includes('firebasestorage.googleapis.com')) return; // URL externa, não deletar
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Ignorar — arquivo pode já ter sido removido
  }
}

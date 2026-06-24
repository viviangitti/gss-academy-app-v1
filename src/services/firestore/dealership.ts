// Regra "primeiro acesso da concessionária = gerente".
// Como as regras do Firestore não deixam um usuário consultar outros por empresa,
// usamos um registro próprio (coleção `dealerships`) com "primeiro a registrar ganha":
// o 1º cadastro de uma empresa cria o doc e vira gestor; os próximos só leem e entram comuns.
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/** Chave estável da concessionária a partir do nome da empresa. */
export function dealershipKey(company: string): string {
  return company
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[/\\.#$[\]]/g, '-')   // caracteres proibidos em id de doc
    .slice(0, 300);
}

/**
 * Tenta reivindicar a concessionária para este usuário.
 * @returns true se ESTE é o primeiro cadastro da loja (vira gerente/gestor); false caso contrário.
 */
export async function claimDealershipManager(company: string, uid: string, name = ''): Promise<boolean> {
  if (!db || !company.trim()) return false;
  const ref = doc(db, 'dealerships', dealershipKey(company));
  try {
    return await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (snap.exists()) return false;            // loja já tem gerente
      tx.set(ref, {
        company: company.trim(),
        managerId: uid,
        managerName: name,
        createdAt: serverTimestamp(),
      });
      return true;                                // primeiro acesso → gerente
    });
  } catch {
    return false;   // em erro, não promove a gerente (seguro)
  }
}

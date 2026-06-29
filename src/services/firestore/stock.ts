import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Categoria do veículo destacado na Home (o gestor cadastra ambos).
export type StockCategory = 'antigo' | 'premiacao';

// Veículo destacado — o gestor cadastra, o time vê na tela inicial.
export interface StockVehicle {
  id: string;
  model: string;        // ex: "Corolla Cross XRE"
  year?: string;        // ex: "2024/2025"
  color?: string;       // ex: "Prata"
  price?: string;       // texto livre, ex: "R$ 159.900"
  note?: string;        // ex: "Único, parado há 90 dias" / "Premiação: R$ 2 mil pro vendedor"
  category?: StockCategory; // 'antigo' (padrão) ou 'premiacao'. Ausente = 'antigo' (retrocompat).
  isExample?: boolean;  // placeholder de demonstração — some quando há veículo real na categoria
  company?: string;     // concessionária dona (isolamento por loja)
  active: boolean;
  createdAt?: unknown;
  createdBy?: string;
}

const COL = 'stockVehicles';

/** Veículos ATIVOS visíveis pro time da loja (globais '' + a própria concessionária). */
export async function getStockForCompany(company?: string): Promise<StockVehicle[]> {
  if (!db) return [];
  const companies = company ? [company, ''] : [''];
  const snap = await getDocs(query(collection(db, COL), where('company', 'in', companies)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as StockVehicle))
    .filter(v => v.active)
    .sort((a, b) => (a.model || '').localeCompare(b.model || ''));
}

/** Todos os veículos da loja (inclui inativos) — pra tela de gestão. */
export async function getAllStock(company?: string): Promise<StockVehicle[]> {
  if (!db) return [];
  const companies = company ? [company, ''] : [''];
  const snap = await getDocs(query(collection(db, COL), where('company', 'in', companies)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as StockVehicle))
    .sort((a, b) => Number(b.active) - Number(a.active) || (a.model || '').localeCompare(b.model || ''));
}

export async function createStockVehicle(data: Omit<StockVehicle, 'id'>, uid: string): Promise<string> {
  if (!db) throw new Error('offline');
  const ref = await addDoc(collection(db, COL), { ...data, createdBy: uid, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateStockVehicle(id: string, data: Partial<StockVehicle>): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COL, id), { ...data });
}

export async function deleteStockVehicle(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COL, id));
}

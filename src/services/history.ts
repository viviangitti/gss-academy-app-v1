// Histórico unificado de todas as interações com a IA
// Salva análises de mensagens, análises pós-reunião e sessões do simulador
import { auth } from './firebase';
import { pushData } from './firestore/sync';

function syncHistory(items: HistoryEntry[]) {
  const uid = auth?.currentUser?.uid;
  if (uid) pushData(uid, 'history', items).catch(() => {});
}

export type HistoryType = 'message_review' | 'meeting_analysis' | 'simulator_session';

export interface HistoryEntry {
  id: string;
  type: HistoryType;
  title: string; // ex: "Magazine Luiza", "Mensagem WhatsApp", "Reunião Alpha", "Simulação - Está caro"
  subtitle?: string; // metadado ex: "Varejo" ou "Nota 8/10"
  preview?: string; // 1-2 linhas do conteúdo
  data: unknown; // o payload completo (dossiê, análise, etc) para reabrir
  createdAt: number;
}

const KEY = 'gss_history';
const MAX_ENTRIES = 100;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getAllHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): HistoryEntry {
  const newEntry: HistoryEntry = {
    ...entry,
    id: generateId(),
    createdAt: Date.now(),
  };
  const all = getAllHistory();
  all.unshift(newEntry);
  const trimmed = all.slice(0, MAX_ENTRIES);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  syncHistory(trimmed);
  return newEntry;
}

export function getHistoryById(id: string): HistoryEntry | null {
  return getAllHistory().find(h => h.id === id) || null;
}

export function removeHistory(id: string): void {
  const all = getAllHistory().filter(h => h.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  syncHistory(all);
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
  syncHistory([]);
}

export function getHistoryByType(type: HistoryType): HistoryEntry[] {
  return getAllHistory().filter(h => h.type === type);
}

// Estatísticas da semana atual para card de progresso
export interface WeekStats {
  messages: number;
  meetings: number;
  simulations: number;
  averageSimScore: number | null;
  totalInteractions: number;
}

export function getWeekStats(): WeekStats {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const all = getAllHistory().filter(h => h.createdAt >= weekAgo);

  const messages = all.filter(h => h.type === 'message_review').length;
  const meetings = all.filter(h => h.type === 'meeting_analysis').length;
  const sims = all.filter(h => h.type === 'simulator_session');

  let averageSimScore: number | null = null;
  if (sims.length > 0) {
    const scores = sims
      .map(s => {
        const data = s.data as { score?: number } | undefined;
        return data?.score;
      })
      .filter((n): n is number => typeof n === 'number');
    if (scores.length > 0) {
      averageSimScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }

  return {
    messages,
    meetings,
    simulations: sims.length,
    averageSimScore,
    totalInteractions: all.length,
  };
}

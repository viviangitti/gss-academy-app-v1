// Placar de conteúdo (social selling) — sincroniza pontos de cada vendedor
// para montar o ranking da equipe.

import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const COL = 'contentScores';

export interface ContentScore {
  uid: string;
  name: string;
  company: string;
  segment: string;
  teamId?: string | null;
  monthKey: string;     // "2026-06"
  points: number;       // pontos do mês
  shares: number;       // posts do mês
  streak: number;
  updatedAt?: unknown;
}

export interface RankRow extends ContentScore {
  position: number;
  isMe: boolean;
}

/** Salva (sobrescreve) o placar do mês do vendedor logado. */
export async function saveMyContentScore(score: Omit<ContentScore, 'updatedAt'>): Promise<void> {
  if (!db || !score.uid) return;
  // 1 doc por usuário+mês → id estável (não duplica)
  const id = `${score.uid}_${score.monthKey}`;
  try {
    await setDoc(doc(db, COL, id), { ...score, updatedAt: serverTimestamp() }, { merge: true });
  } catch { /* offline — ignora */ }
}

/**
 * Ranking da equipe no mês atual. Agrupa por empresa (ou segmento se não houver empresa).
 * Retorna ordenado por pontos, com posição e marcação do próprio usuário.
 */
export async function getTeamRanking(
  myUid: string,
  company: string,
  segment: string,
  monthKey: string,
): Promise<RankRow[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, COL));
    const scores = snap.docs
      .map(d => d.data() as ContentScore)
      .filter(s => s.monthKey === monthKey)
      // mesma empresa (ou mesmo segmento, se a empresa não estiver definida)
      .filter(s => (company ? s.company === company : s.segment === segment))
      .filter(s => (s.points || 0) > 0)
      .sort((a, b) => (b.points || 0) - (a.points || 0));

    return scores.map((s, i) => ({
      ...s,
      position: i + 1,
      isMe: s.uid === myUid,
    }));
  } catch {
    return [];
  }
}

export interface TeamSummary {
  totalPosts: number;
  totalPoints: number;
  activeMembers: number;   // membros com pelo menos 1 post no mês
  members: ContentScore[]; // todos os membros com placar, ordenados por pontos
}

/**
 * Resumo da equipe para o painel do gestor (mês atual).
 * Mostra total de posts, membros ativos e o placar de cada um.
 */
export async function getTeamSummary(
  company: string,
  segment: string,
  monthKey: string,
): Promise<TeamSummary> {
  if (!db) return { totalPosts: 0, totalPoints: 0, activeMembers: 0, members: [] };
  try {
    const snap = await getDocs(collection(db, COL));
    const members = snap.docs
      .map(d => d.data() as ContentScore)
      .filter(s => s.monthKey === monthKey)
      .filter(s => (company ? s.company === company : s.segment === segment))
      .sort((a, b) => (b.points || 0) - (a.points || 0));

    return {
      totalPosts: members.reduce((s, m) => s + (m.shares || 0), 0),
      totalPoints: members.reduce((s, m) => s + (m.points || 0), 0),
      activeMembers: members.filter(m => (m.shares || 0) > 0).length,
      members,
    };
  } catch {
    return { totalPosts: 0, totalPoints: 0, activeMembers: 0, members: [] };
  }
}

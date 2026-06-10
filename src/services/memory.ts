// Camada de MEMÓRIA do Coach.
// Junta tudo que o app sabe sobre o vendedor (perfil + metas + atividades em todas as
// telas + o que ele fala/escreve) num bloco de contexto que é injetado no Coach (texto e voz).
// Assim a IA "se retroalimenta" e lembra do usuário ao longo do tempo.

import { loadData, saveData, KEYS } from './storage';
import { getAllHistory } from './history';
import type { UserProfile, GoalItem } from '../types';

const FACTS_KEY = 'gss_memory_facts';
const MAX_FACTS = 40;

export interface MemoryFact {
  t: number;        // timestamp
  source: string;   // 'coach' | 'voz' | 'treino' | 'pre-reuniao' | ...
  text: string;
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  if (d < 30) return `há ${d} dias`;
  const mo = Math.floor(d / 30);
  return `há ${mo} ${mo === 1 ? 'mês' : 'meses'}`;
}

/** Registra algo que o usuário falou/escreveu (ou um evento) na memória de longo prazo. */
export function remember(text: string, source = 'coach'): void {
  const clean = (text || '').trim();
  if (clean.length < 6) return; // ignora ruído curto
  const facts = loadData<MemoryFact[]>(FACTS_KEY, []);
  // evita duplicar a última fala idêntica
  if (facts.length && facts[facts.length - 1].text === clean) return;
  facts.push({ t: Date.now(), source, text: clean.slice(0, 280) });
  saveData(FACTS_KEY, facts.slice(-MAX_FACTS));
}

export function getFacts(): MemoryFact[] {
  return loadData<MemoryFact[]>(FACTS_KEY, []);
}

export function clearMemory(): void {
  saveData(FACTS_KEY, []);
}

function goalsLine(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.monthlyGoal) parts.push(`meta principal R$ ${profile.monthlyGoal.toLocaleString('pt-BR')}`);
  (profile.customGoals || []).forEach((g: GoalItem) => {
    if (g.target) parts.push(`${g.label} R$ ${g.target.toLocaleString('pt-BR')}`);
  });
  return parts.join(' · ');
}

/**
 * Monta o bloco de memória que vai no contexto do Coach.
 * Compacto de propósito (controle de tokens): perfil + atividades recentes + falas recentes.
 */
export function buildMemoryContext(): string {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const history = getAllHistory().slice(0, 8);
  const facts = getFacts().slice(-12);

  const lines: string[] = [];
  lines.push('MEMÓRIA — o que você já sabe sobre este vendedor (use para personalizar de forma natural; NÃO repita isso de forma robótica):');

  // Perfil
  const id: string[] = [];
  if (profile.name) id.push(profile.name);
  if (profile.role) id.push(profile.role);
  if (profile.company) id.push(profile.company);
  if (profile.segment) id.push(`segmento ${profile.segment}`);
  if (id.length) lines.push(`• Perfil: ${id.join(' · ')}`);
  const goals = goalsLine(profile);
  if (goals) lines.push(`• Metas do mês: ${goals}`);

  // Atividades em outras telas do app
  if (history.length) {
    lines.push('• Atividades recentes no app:');
    history.forEach(h => {
      const meta = h.subtitle ? ` (${h.subtitle})` : '';
      lines.push(`   - ${h.title}${meta} — ${relTime(h.createdAt)}`);
    });
  }

  // Falas/escritas recentes do usuário
  if (facts.length) {
    lines.push('• O vendedor comentou recentemente:');
    facts.forEach(f => lines.push(`   - "${f.text}" (${relTime(f.t)})`));
  }

  // Se não há nada além do nome, não vale injetar
  if (lines.length <= 2) return '';
  return lines.join('\n');
}

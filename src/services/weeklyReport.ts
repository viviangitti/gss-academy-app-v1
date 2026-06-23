// Relatório de segunda do gestor: resumo da semana pronto pra colar no grupo,
// com destaque da semana e elogio pronto. O app faz o trabalho chato do gestor.
import { generateText } from './ai';
import { fetchRecentCases } from './firestore/salesCases';
import { getTeamSummary } from './firestore/contentScores';
import { loadData, KEYS } from './storage';
import type { UserProfile } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface WeeklyReport {
  mensagemGrupo: string;   // pronta pra colar no WhatsApp da equipe
  destaque: string;        // nome do destaque da semana
  elogio: string;          // elogio pronto, pessoal, pro gestor mandar
  focoSemana: string;      // 1 frase: onde a equipe deve focar
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function getWeeklyReport(): Promise<WeeklyReport> {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const company = (profile.company || '').trim().toLowerCase();

  const [cases, content] = await Promise.all([
    fetchRecentCases(company, 60).catch(() => []),
    getTeamSummary(profile.company || '', profile.segment || '', monthKey()).catch(() => null),
  ]);

  const weekAgo = Date.now() - 7 * 86400000;
  const recent = cases.filter(c => {
    const ts = (c.createdAt as { seconds?: number } | undefined)?.seconds;
    return ts ? ts * 1000 >= weekAgo : true;
  });

  if (!recent.length && !content?.members?.length) throw new Error('sem dados');

  const caseLines = recent.slice(0, 30).map(c => {
    const who = c.authorName || '?';
    if (c.kind === 'won') return `• ${who} FECHOU${c.value ? ` R$ ${Math.round((c.value || 0) / 1000)}k` : ''}`;
    if (c.kind === 'objection_won') return `• ${who} contornou "${c.objection}"`;
    return `• ${who} perdeu (${c.reason || '?'})`;
  });

  const contentLines = (content?.members || []).slice(0, 10)
    .map(m => `• ${m.name}: ${m.shares} posts, ${m.points} pts`);

  const prompt = `Você ajuda um GESTOR de vendas a abrir a semana. Com base na atividade real da equipe, monte o resumo de segunda-feira.

Responda APENAS com JSON válido:
{"mensagemGrupo":"...","destaque":"...","elogio":"...","focoSemana":"..."}

Regras:
- "mensagemGrupo": mensagem pronta pro grupo de WhatsApp da equipe (4-7 linhas, com emojis moderados): resultado da semana, destaque, e o foco da semana. Tom de líder que reconhece e puxa pra cima — sem corporativês.
- "destaque": o nome do vendedor destaque (quem mais fechou/contornou; se empate, quem mais postou conteúdo).
- "elogio": 1-2 frases pessoais e específicas pro gestor mandar EM PRIVADO pro destaque (cite o que ele fez).
- "focoSemana": 1 frase com o foco (baseado no padrão de perdas, se houver).
- Português brasileiro. Não invente números nem nomes.

ATIVIDADE DA SEMANA (vendas/perdas/objeções):
${caseLines.join('\n') || '(nenhum caso registrado)'}

CONTEÚDO/ENGAJAMENTO DO MÊS:
${contentLines.join('\n') || '(sem dados)'}`;

  const text = (await generateText(API_KEY, prompt)).trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(text) as WeeklyReport;
}

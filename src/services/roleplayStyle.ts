// Estilo do cliente no role-play — persona + nível de dificuldade.
// Usado no treino por texto, voz e vídeo pra variar os cenários.

export interface Persona { id: string; label: string; desc: string }

export const PERSONAS: Persona[] = [
  { id: 'apressado',   label: 'Apressado',        desc: 'sem tempo, quer objetividade' },
  { id: 'desconfiado', label: 'Desconfiado',      desc: 'acha que tá sendo enrolado' },
  { id: 'pechincha',   label: 'Pechinchador',     desc: 'só quer desconto' },
  { id: 'comparando',  label: 'Comparando',       desc: 'cita o concorrente toda hora' },
  { id: 'familia',     label: 'Decide em família', desc: 'precisa do cônjuge/filhos' },
  { id: 'frio',        label: 'Frio',             desc: 'pouco interessado, respostas curtas' },
];

export const DIFFICULTIES = [
  { id: 'facil',   label: 'Fácil' },
  { id: 'medio',   label: 'Médio' },
  { id: 'dificil', label: 'Difícil' },
];

/** Fragmento de prompt que injeta persona + dificuldade no cliente do role-play. */
export function buildClientStyle(personaId?: string, difficultyId?: string): string {
  const lines: string[] = [];
  const p = PERSONAS.find(x => x.id === personaId);
  if (p) lines.push(`PERFIL DO CLIENTE: ${p.label} — ${p.desc}. Aja assim o tempo todo, de forma natural.`);
  const d = difficultyId || 'medio';
  if (d === 'facil') lines.push('NÍVEL: Fácil — resista pouco e ceda se o vendedor for razoável.');
  else if (d === 'dificil') lines.push('NÍVEL: Difícil — resista bastante, traga contra-argumentos fortes e só ceda se o vendedor for muito bom.');
  else lines.push('NÍVEL: Médio — resista de forma realista.');
  return lines.join('\n');
}

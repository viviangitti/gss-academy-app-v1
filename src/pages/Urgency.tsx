import { useState } from 'react';
import { Zap, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import SpeakButton from '../components/SpeakButton';
import ShareButton from '../components/ShareButton';
import type { UserProfile } from '../types';
import './Urgency.css';

interface Trigger {
  text: string;
  segments?: string[]; // se vazio = todos
}

interface Category {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  triggers: Trigger[];
}

const CATEGORIES: Category[] = [
  {
    id: 'prazo',
    icon: '⏰',
    title: 'Prazo',
    subtitle: 'Crie urgência com limite de tempo',
    color: '#ef4444',
    triggers: [
      { text: 'Essa condição é válida só até sexta-feira — depois os juros voltam ao normal.' },
      { text: 'Temos vagas abertas só até o fim do mês. Depois disso a próxima turma começa em 3 meses.' },
      { text: 'O preço especial vence na próxima semana. Posso garantir ele para você se fecharmos agora.' },
      { text: 'A campanha encerra na virada do mês. Se deixar para depois, saímos dessa condição.' },
      { text: 'Essa taxa promocional foi negociada com validade até amanhã. Não depende de mim prorrogar.' },
    ],
  },
  {
    id: 'exclusividade',
    icon: '🔒',
    title: 'Exclusividade',
    subtitle: 'Mostre que nem todos têm acesso',
    color: '#8b5cf6',
    triggers: [
      { text: 'Isso não está disponível para todo mundo — é uma condição que conseguimos para clientes que fecham direto conosco.' },
      { text: 'Esse modelo está reservado para quem quer tirar o licenciamento ainda esse mês. Tenho apenas uma unidade separada.' },
      { text: 'Esse plano não aparece no site. Eu consigo para quem fecha pessoalmente comigo.' },
      { text: 'A maioria dos clientes não tem acesso a essa condição — estou te oferecendo porque vejo fit aqui.' },
      { text: 'Essa é uma oferta que fizemos para os 10 primeiros clientes do mês. Ainda temos 2 vagas.' },
    ],
  },
  {
    id: 'perda',
    icon: '📉',
    title: 'Perda',
    subtitle: 'O custo de não decidir agora',
    color: '#f97316',
    triggers: [
      { text: 'Cada semana que passa sem isso é uma semana que seu concorrente está na frente.' },
      { text: 'Se você deixar para o próximo mês, já vai ter perdido 4 semanas de resultado.' },
      { text: 'O que você está perdendo hoje, enquanto ainda está avaliando, já não volta.' },
      { text: 'O preço vai subir na próxima tabela — você pagaria mais pelo mesmo produto.' },
      { text: 'Todo mês que passa sem resolver isso custa [X] para o seu negócio. Faz sentido esperar?' },
    ],
  },
  {
    id: 'comparacao',
    icon: '⚖️',
    title: 'Comparação',
    subtitle: 'Contextualize o valor da decisão',
    color: '#3b82f6',
    triggers: [
      { text: 'O quanto você gasta por mês com [problema que resolve]? Esse investimento é menor do que isso.' },
      { text: 'Clientes que esperaram 6 meses me disseram que o único arrependimento foi não ter fechado antes.' },
      { text: 'Pense assim: quanto vale uma venda a mais por mês para você? Isso resolve isso.' },
      { text: 'O custo de não tomar essa decisão é maior do que o custo de tomar.' },
      { text: 'Três meses atrás, um cliente tinha a mesma dúvida. Hoje ele está colhendo resultado. O que mudou? Ele decidiu.' },
    ],
  },
  {
    id: 'prova',
    icon: '🏆',
    title: 'Prova Social',
    subtitle: 'Mostre que outros já decidiram',
    color: '#16a34a',
    triggers: [
      { text: 'Dois clientes do seu segmento fecharam essa semana. Os dois me disseram que queriam ter fechado antes.' },
      { text: 'Temos X clientes ativos. A média de retorno no primeiro mês é de [resultado].' },
      { text: 'O [nome genérico do setor] aqui do bairro fechou mês passado. Já está vendo resultado.' },
      { text: 'Essa semana já confirmamos 3 contratos. As vagas do mês estão quase no limite.' },
      { text: 'Posso te apresentar um cliente nosso que estava na mesma situação que você — para você ouvir diretamente como foi.' },
    ],
  },
];

export default function Urgency() {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [expandedId, setExpandedId] = useState<string | null>('prazo');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* fallback */ }
  };

  const visibleCategories = CATEGORIES.map(cat => ({
    ...cat,
    triggers: cat.triggers.filter(t =>
      !t.segments || t.segments.length === 0 || t.segments.includes(profile.segment || '')
    ),
  }));

  return (
    <div className="urgency-page">
      <div className="urgency-hero card">
        <Zap size={22} />
        <div>
          <h2>Gatilhos de Urgência</h2>
          <p>Frases prontas para acelerar a decisão do cliente</p>
        </div>
      </div>

      <p className="urgency-intro">
        Use com naturalidade — adapte ao contexto da conversa. Gatilhos forçados quebram confiança. Escolha o que faz sentido para o seu cliente agora.
      </p>

      {visibleCategories.map(cat => {
        const isOpen = expandedId === cat.id;
        return (
          <div key={cat.id} className="urgency-category card">
            <div
              className="urgency-cat-header"
              onClick={() => setExpandedId(isOpen ? null : cat.id)}
              style={{ borderLeft: `4px solid ${cat.color}` }}
            >
              <div className="urgency-cat-title">
                <span className="urgency-cat-icon">{cat.icon}</span>
                <div>
                  <strong>{cat.title}</strong>
                  <p>{cat.subtitle}</p>
                </div>
              </div>
              <div className="urgency-cat-right">
                <span className="urgency-count" style={{ color: cat.color }}>{cat.triggers.length}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {isOpen && (
              <div className="urgency-triggers">
                {cat.triggers.map((t, i) => {
                  const uid = `${cat.id}-${i}`;
                  return (
                    <div key={i} className="urgency-trigger">
                      <p>"{t.text}"</p>
                      <div className="urgency-trigger-actions">
                        <button
                          className="urgency-copy"
                          onClick={() => handleCopy(t.text, uid)}
                          title="Copiar"
                        >
                          {copiedId === uid ? <Check size={13} /> : <Copy size={13} />}
                          {copiedId === uid ? 'Copiado' : 'Copiar'}
                        </button>
                        <SpeakButton text={t.text} size={14} />
                        <ShareButton text={t.text} title="Gatilho de urgência" size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

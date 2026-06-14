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

const AUTO = ['automotivo', 'automotivo_luxo'];

const CATEGORIES: Category[] = [
  {
    id: 'prazo',
    icon: '⏰',
    title: 'Prazo',
    subtitle: 'Crie urgência com limite de tempo',
    color: '#ef4444',
    triggers: [
      // Automotivo
      { text: 'Essa taxa de financiamento é válida só até sexta — depois volta pra tabela normal.', segments: AUTO },
      { text: 'A condição desse mês fecha na virada. No próximo lote o preço já sobe.', segments: AUTO },
      { text: 'Tenho essa unidade, na cor que você quer, reservada até amanhã. Depois ela volta pro estoque.', segments: AUTO },
      { text: 'O bônus na sua troca vale só essa semana — não depende de mim prorrogar.', segments: AUTO },
      { text: 'Se emplacar ainda esse mês, você pega o ano-modelo atual pelo preço de hoje.', segments: AUTO },
      // Genérico (outros segmentos)
      { text: 'Essa condição é válida só até sexta-feira — depois volta ao normal.' },
      { text: 'O preço especial vence na próxima semana. Posso garantir ele para você se fecharmos agora.' },
      { text: 'A campanha encerra na virada do mês. Se deixar para depois, saímos dessa condição.' },
      { text: 'Essa condição foi negociada com validade até amanhã. Não depende de mim prorrogar.' },
    ],
  },
  {
    id: 'exclusividade',
    icon: '🔒',
    title: 'Exclusividade',
    subtitle: 'Mostre que nem todos têm acesso',
    color: '#8b5cf6',
    triggers: [
      // Automotivo
      { text: 'Essa condição eu consigo pra quem fecha direto comigo — não está no anúncio.', segments: AUTO },
      { text: 'Tenho só uma unidade dessa versão separada. Reservo pra você se decidirmos hoje.', segments: AUTO },
      { text: 'Esse valor na sua troca não é pra todo mundo — consegui aprovar pro seu caso.', segments: AUTO },
      { text: 'Essa taxa eu negociei com o banco pra fechamentos dessa semana. Não é a de balcão.', segments: AUTO },
      // Genérico
      { text: 'Isso não está disponível para todo mundo — é uma condição para quem fecha direto comigo.' },
      { text: 'Essa condição não aparece no anúncio. Eu consigo para quem fecha pessoalmente comigo.' },
      { text: 'A maioria dos clientes não tem acesso a essa condição — estou te oferecendo porque vejo fit aqui.' },
      { text: 'Essa é uma oferta para os primeiros clientes do mês. Ainda restam poucas vagas.' },
    ],
  },
  {
    id: 'perda',
    icon: '📉',
    title: 'Perda',
    subtitle: 'O custo de não decidir agora',
    color: '#f97316',
    triggers: [
      // Automotivo
      { text: 'Cada mês que passa, seu carro atual desvaloriza — quanto mais espera, menos ele vale na troca.', segments: AUTO },
      { text: 'Se deixar pra próxima tabela, você paga mais caro pelo mesmo modelo.', segments: AUTO },
      { text: 'Enquanto você decide, essa unidade pode sair pra outro cliente — é a última nessa cor.', segments: AUTO },
      { text: 'Adiar a troca é continuar gastando com manutenção de um carro que já te dá dor de cabeça.', segments: AUTO },
      // Genérico
      { text: 'O que você está perdendo hoje, enquanto ainda está avaliando, já não volta.' },
      { text: 'O preço vai subir na próxima tabela — você pagaria mais pelo mesmo produto.' },
      { text: 'Cada semana que passa sem decidir é uma semana a mais com o problema que isso resolve.' },
    ],
  },
  {
    id: 'comparacao',
    icon: '⚖️',
    title: 'Comparação',
    subtitle: 'Contextualize o valor da decisão',
    color: '#3b82f6',
    triggers: [
      // Automotivo
      { text: 'Pensa na parcela como o que você já gasta hoje com combustível e manutenção — quase se paga.', segments: AUTO },
      { text: 'A diferença pra versão de cima sai por poucos reais na parcela, mas muda toda a experiência.', segments: AUTO },
      { text: 'O que você economiza esperando é menos do que perde na desvalorização do seu carro atual.', segments: AUTO },
      { text: 'Clientes que adiaram a troca me disseram que só se arrependeram de não ter feito antes.', segments: AUTO },
      // Genérico
      { text: 'O quanto você gasta por mês com isso hoje? Esse investimento é menor do que isso.' },
      { text: 'Pense assim: quanto vale resolver isso de vez para você? A conta fecha.' },
      { text: 'O custo de não tomar essa decisão é maior do que o custo de tomar.' },
    ],
  },
  {
    id: 'prova',
    icon: '🏆',
    title: 'Prova Social',
    subtitle: 'Mostre que outros já decidiram',
    color: '#16a34a',
    triggers: [
      // Automotivo
      { text: 'Dois clientes fecharam esse mesmo modelo essa semana — saiu rápido nessa condição.', segments: AUTO },
      { text: 'Essa versão é a que mais vende aqui. Quem leva, volta elogiando.', segments: AUTO },
      { text: 'Acabei de entregar um aqui do seu bairro. Posso te conectar pra ele te contar como foi.', segments: AUTO },
      { text: 'As unidades dessa cor estão acabando — foi a mais procurada do mês.', segments: AUTO },
      // Genérico
      { text: 'Dois clientes parecidos com você fecharam essa semana. Os dois disseram que queriam ter fechado antes.' },
      { text: 'Posso te apresentar um cliente nosso que estava na mesma situação — para você ouvir diretamente como foi.' },
      { text: 'Essa semana já confirmamos vários fechamentos. As condições do mês estão quase no limite.' },
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

  const seg = profile.segment || '';
  const visibleCategories = CATEGORIES.map(cat => {
    const specific = cat.triggers.filter(t => t.segments?.includes(seg));
    const generic = cat.triggers.filter(t => !t.segments || t.segments.length === 0);
    // Se o segmento tem gatilhos próprios, mostra só eles; senão, os genéricos
    return { ...cat, triggers: specific.length ? specific : generic };
  });

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

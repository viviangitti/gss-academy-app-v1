import { useState, useRef, useEffect } from 'react';
import { Users, Send, RotateCcw, Star, Sparkles } from 'lucide-react';
import { generateText, aiErrorMessage } from '../services/ai';
import { addHistory } from '../services/history';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './RolePlay.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface Scenario {
  id: string;
  title: string;
  desc: string;
  persona: string;     // como a IA (vendedor) deve agir
  opening: string;     // 1ª fala do vendedor (fallback)
}

const SCENARIOS: Scenario[] = [
  {
    id: 'feedback', title: 'Dar um feedback duro', desc: 'Vendedor caiu de produção e está na defensiva',
    persona: 'Você é um vendedor que caiu de produção nas últimas semanas. Está meio na defensiva e tende a justificar com fatores externos (mercado, leads ruins). Não aceite o feedback de primeira; mas se o gestor for justo, específico e mostrar que acredita em você, vá baixando a guarda.',
    opening: 'Oi, queria falar comigo? Olha, eu sei que o mês tá fraco, mas tá difícil pra todo mundo, os leads que chegaram esse mês foram horríveis.',
  },
  {
    id: 'motivar', title: 'Motivar quem está atrás da meta', desc: 'Vendedor desanimado, achando que não vai bater',
    persona: 'Você é um vendedor desanimado, atrás da meta no meio do mês. Está meio sem energia e acha que não dá mais pra virar. Responda meio pra baixo; se o gestor te der um plano concreto e confiança, anime-se aos poucos.',
    opening: 'Pra ser sincero, acho que esse mês já era. Tô longe da meta e não tô vendo como virar.',
  },
  {
    id: 'talento', title: 'Segurar um talento', desc: 'Seu melhor vendedor recebeu proposta de concorrente',
    persona: 'Você é o melhor vendedor da loja e recebeu uma proposta de um concorrente com salário um pouco maior. Está considerando sair. Você gosta da equipe, mas se sente pouco reconhecido. Seja honesto sobre os motivos; ouça o que o gestor oferece (não é só dinheiro).',
    opening: 'Preciso ser transparente com você: recebi uma proposta de outra concessionária. Tô pensando seriamente em aceitar.',
  },
  {
    id: 'cobrar', title: 'Cobrar sem desmotivar', desc: 'Vendedor que não cumpre o processo e arruma desculpa',
    persona: 'Você é um vendedor simpático mas que não segue o processo (não registra follow-up, não preenche o CRM, atrasa retorno a cliente). Sempre tem uma desculpa. Resista um pouco; se o gestor conectar o processo ao seu resultado/comissão, aceite.',
    opening: 'Pode deixar que eu resolvo, chefe. Esse negócio de ficar preenchendo sistema só toma meu tempo de vender, né?',
  },
  {
    id: 'conflito', title: 'Mediar um conflito', desc: 'Dois vendedores brigando por cliente/comissão',
    persona: 'Você é um vendedor irritado porque um colega "pegou" um cliente que você considera seu, e a comissão foi pra ele. Está exaltado e quer justiça. Se o gestor ouvir, for justo e propor uma regra clara, acalme-se.',
    opening: 'Isso não tá certo! Aquele cliente era MEU, eu que atendi primeiro, e o João fechou e levou a comissão. Assim não dá pra trabalhar.',
  },
];

const EVAL_PROMPT = `Você é um mentor de liderança comercial de alta performance. Avalie como o GESTOR conduziu esta conversa difícil com um vendedor. Critérios:
- Ouviu antes de julgar? (perguntou, deixou a pessoa falar)
- Foi específico e baseado em fatos, sem atacar a pessoa?
- Manteve firmeza no padrão E respeito/empatia com a pessoa?
- Saiu com um combinado claro e próximo passo?
- Reforçou confiança ("eu acredito em você")?

Dê a resposta EXATAMENTE neste formato (português brasileiro, direto):
**Nota: X/10**

**Você conduziu bem:**
• ponto 1
• ponto 2

**Onde dava pra ir melhor:**
• ponto 1
• ponto 2

**Como um líder excelente conduziria:**
"1-2 frases de exemplo, na prática"`;

interface Msg { role: 'user' | 'vendedor'; content: string }

export default function LeadershipTraining() {
  const isOnline = useOnline();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, evaluation]);

  const REGRAS = 'Regras: fale em português brasileiro, natural, 1-3 frases curtas, como uma pessoa real falaria. NUNCA use colchetes nem placeholders como [Nome] — você não sabe o nome do gestor, então fale direto sem citar nome. NUNCA quebre o personagem nem dê dicas ao gestor. Você é o vendedor, não um assistente.';

  const turnPrompt = (sc: Scenario, convo: Msg[]) =>
    `${sc.persona}\n\n${REGRAS}\n\nConversa até agora:\n${convo.map(m => `${m.role === 'user' ? 'Gestor' : 'Vendedor'}: ${m.content}`).join('\n')}\n\nResponda como o Vendedor:`;

  const start = async (sc: Scenario) => {
    setScenario(sc);
    setMessages([]);
    setEvaluation(null);
    setExchanges(0);
    setLoading(true);
    try {
      const opening = (await generateText(API_KEY, `${sc.persona}\n\nComece a conversa com o gestor com UMA fala curta e natural (português brasileiro), no espírito desta situação: ${sc.desc}. Só a fala, sem aspas. NÃO use colchetes nem placeholders como [Nome] — fale direto, sem citar o nome do gestor.`, { retries: 1 })).trim();
      setMessages([{ role: 'vendedor', content: opening || sc.opening }]);
    } catch {
      setMessages([{ role: 'vendedor', content: sc.opening }]);
    }
    setLoading(false);
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading || !scenario) return;
    const next = [...messages, { role: 'user' as const, content: msg }];
    const n = exchanges + 1;
    setMessages(next);
    setInput('');
    setExchanges(n);
    setLoading(true);
    try {
      if (n >= 4) {
        await evaluate(next);
      } else {
        const reply = (await generateText(API_KEY, turnPrompt(scenario, next), { retries: 1 })).trim();
        setMessages([...next, { role: 'vendedor', content: reply }]);
      }
    } catch {
      setMessages([...next, { role: 'vendedor', content: 'Tá... e o que você sugere então?' }]);
    }
    setLoading(false);
  };

  const evaluate = async (convo: Msg[]) => {
    try {
      const conversation = convo.map(m => `${m.role === 'user' ? 'Gestor' : 'Vendedor'}: ${m.content}`).join('\n');
      const text = await generateText(API_KEY, `${EVAL_PROMPT}\n\nSituação: ${scenario?.title}\n\nConversa:\n${conversation}`, { retries: 2 });
      setEvaluation(text);
      const score = text.match(/Nota:?\s*(\d+)\s*\/\s*10/i)?.[1];
      addHistory({
        type: 'leadership_session',
        title: `Liderança: ${scenario?.title || ''}`,
        subtitle: score ? `Nota ${score}/10` : 'Treino concluído',
        preview: conversation.slice(0, 140),
        data: { score: score ? Number(score) : null, evaluation: text, conversation },
      });
    } catch (e) {
      setEvaluation(aiErrorMessage(e));
    }
  };

  const reset = () => { setScenario(null); setMessages([]); setEvaluation(null); setExchanges(0); };

  const fmt = (c: string) => c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  if (!isOnline) return <OfflineState feature="o Treino de liderança" />;
  if (!API_KEY) return <OfflineState feature="o Treino de liderança" subtitle="Serviço indisponível no momento." />;

  if (!scenario) {
    return (
      <div className="roleplay-page">
        <div className="roleplay-hero card">
          <Users size={28} />
          <div>
            <h3>Treino de liderança</h3>
            <p>Pratique conversas difíceis com a IA fazendo o papel do vendedor</p>
          </div>
        </div>
        <h4 className="section-title">Escolha a situação:</h4>
        <div className="roleplay-objection-list">
          {SCENARIOS.map(sc => (
            <button key={sc.id} className="roleplay-objection-btn card" onClick={() => start(sc)}>
              <span><strong>{sc.title}</strong><br /><span style={{ fontSize: 12, color: 'var(--text-soft)' }}>{sc.desc}</span></span>
              <Users size={16} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="roleplay-page">
      <div className="roleplay-session-header">
        <span className="roleplay-change" style={{ pointerEvents: 'none' }}>{scenario.title}</span>
        <button className="btn btn-outline btn-sm" onClick={reset}><RotateCcw size={12} /> Novo</button>
      </div>

      {!evaluation && (
        <div className="roleplay-progress">
          <span>Rodada {Math.min(exchanges + 1, 4)} de 4</span>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${(exchanges / 4) * 100}%` }} /></div>
        </div>
      )}

      <div className="roleplay-messages">
        {messages.map((m, i) => (
          <div key={i} className={`roleplay-msg ${m.role === 'user' ? 'user' : 'client'}`}>
            {m.role === 'vendedor' && <div className="msg-avatar client-avatar">V</div>}
            <div className="msg-content"><p>{m.content}</p></div>
          </div>
        ))}

        {loading && !evaluation && (
          <div className="roleplay-msg client">
            <div className="msg-avatar client-avatar">V</div>
            <div className="msg-content typing"><span className="dot" /><span className="dot" /><span className="dot" /></div>
          </div>
        )}

        {evaluation && (
          <div className="evaluation-card card">
            <div className="eval-header"><Star size={20} /><h4>Como você liderou</h4></div>
            <div className="eval-content" dangerouslySetInnerHTML={{ __html: fmt(evaluation) }} />
            <button className="btn btn-primary" onClick={reset} style={{ marginTop: 12, width: '100%' }}>
              <Users size={16} /> Treinar outra situação
            </button>
          </div>
        )}

        {loading && evaluation === null && exchanges >= 4 && (
          <div className="evaluation-loading card"><Sparkles size={20} /><p>Analisando sua condução...</p></div>
        )}

        <div ref={endRef} />
      </div>

      {!evaluation && (
        <div className="input-area">
          <div className="input-wrapper">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="O que você diria ao vendedor..."
              disabled={loading}
            />
            <button className="send-btn" onClick={send} disabled={!input.trim() || loading}><Send size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

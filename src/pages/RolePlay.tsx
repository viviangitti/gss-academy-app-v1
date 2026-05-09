import { useState, useRef, useEffect } from 'react';
import { Swords, Send, RotateCcw, Star, ChevronDown, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getObjections } from '../services/content';
import { loadData, KEYS } from '../services/storage';
import { addHistory } from '../services/history';
import type { UserProfile } from '../types';
import type { Objection } from '../services/content';
import SpeakButton from '../components/SpeakButton';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './RolePlay.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const ROLEPLAY_PROMPT = `Você é um cliente DIFÍCIL em uma simulação de vendas. Seu papel:

1. Você recebeu uma objeção para simular. MANTENHA essa objeção.
2. Quando o vendedor responder, NÃO aceite fácil. Complique, questione, insista.
3. Seja realista — aja como um cliente real agiria.
4. Após 3-4 trocas, aceite gradualmente se o vendedor for convincente.
5. NUNCA quebre o personagem. Você é o cliente, não um assistente.
6. Fale em português brasileiro, de forma natural.
7. Respostas curtas (1-3 frases), como um cliente real falaria.

IMPORTANTE: Não dê dicas ao vendedor durante a simulação.`;

const EVALUATOR_PROMPT = `Você é um avaliador de vendas da MAESTR.IA em Vendas, especialista em alta performance comercial. Avalie com base nestes critérios:
- O vendedor fez perguntas antes de argumentar? (perguntar mais, falar menos)
- Usou conexão emocional ou ficou só no racional?
- Antecipou a objeção ou foi pego de surpresa?
- Focou no valor/retorno ou entrou em guerra de preço?
- Propôs próximo passo concreto?

Analise a conversa de treino e dê:

1. Uma NOTA de 1 a 10
2. O que o vendedor fez BEM (2-3 pontos)
3. O que poderia MELHORAR (2-3 pontos, com linguagem positiva e transformacional)
4. Uma RESPOSTA MODELO ideal para essa objeção

Formato da resposta:
**Nota: X/10**

**O que você fez bem:**
• ponto 1
• ponto 2

**O que melhorar:**
• ponto 1
• ponto 2

**Resposta modelo:**
"resposta ideal aqui"

Seja direto e prático. Fale em português brasileiro.`;

interface TrainingMessage {
  role: 'user' | 'client';
  content: string;
}

export default function RolePlay() {
  const isOnline = useOnline();
  const [objections, setObjections] = useState<Objection[]>([]);
  const [selectedObjection, setSelectedObjection] = useState<Objection | null>(null);
  const [messages, setMessages] = useState<TrainingMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['startChat']> | null>(null);

  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    const all = getObjections(profile.segment).filter(o => !o.stage);
    setObjections(all);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, evaluation]);

  const startTraining = async (obj: Objection) => {
    setSelectedObjection(obj);
    setMessages([]);
    setEvaluation(null);
    setExchangeCount(0);
    setShowSelector(false);

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    chatRef.current = model.startChat({
      history: [
        { role: 'user', parts: [{ text: ROLEPLAY_PROMPT + `\n\nA objeção que você deve simular é: ${obj.objection}` }] },
        { role: 'model', parts: [{ text: `Entendido. Sou o cliente. Minha objeção é ${obj.objection}. Vou dificultar a negociação.` }] },
      ],
    });

    setLoading(true);
    try {
      const result = await chatRef.current.sendMessage(`Comece a simulação. Diga a objeção ${obj.objection} de forma natural, como um cliente real diria.`);
      setMessages([{ role: 'client', content: result.response.text() }]);
    } catch {
      setMessages([{ role: 'client', content: `Olha, ${obj.objection.replace(/"/g, '')}. Não sei se faz sentido para nós agora.` }]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading || !chatRef.current) return;

    const newExchanges = exchangeCount + 1;
    setExchangeCount(newExchanges);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);

    try {
      if (newExchanges >= 4) {
        // End training and evaluate
        await chatRef.current.sendMessage(msg);
        await evaluateTraining([...messages, { role: 'user', content: msg }]);
      } else {
        const result = await chatRef.current.sendMessage(msg);
        setMessages(prev => [...prev, { role: 'client', content: result.response.text() }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'client', content: 'Hmm, não me convenceu ainda. Tem algo mais concreto?' }]);
    }
    setLoading(false);
  };

  const evaluateTraining = async (allMessages: TrainingMessage[]) => {
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

      const conversation = allMessages
        .map(m => `${m.role === 'user' ? 'Vendedor' : 'Cliente'}: ${m.content}`)
        .join('\n');

      const result = await model.generateContent(
        `${EVALUATOR_PROMPT}\n\nObjeção treinada: ${selectedObjection?.objection}\n\nConversa:\n${conversation}`
      );
      const text = result.response.text();
      setEvaluation(text);

      // Extrair nota (formato "Nota: X/10") e salvar no histórico
      const scoreMatch = text.match(/Nota:?\s*(\d+)\s*\/\s*10/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
      addHistory({
        type: 'simulator_session',
        title: `Treino: ${selectedObjection?.objection || ''}`,
        subtitle: score ? `Nota ${score}/10` : 'Treino concluído',
        preview: conversation.slice(0, 140),
        data: { score, evaluation: text, conversation, objection: selectedObjection?.objection },
      });
    } catch {
      setEvaluation('A avaliação ficou indisponível. Toque para tentar de novo.');
    }
    setLoading(false);
  };

  const handleReset = () => {
    setSelectedObjection(null);
    setMessages([]);
    setEvaluation(null);
    setExchangeCount(0);
    chatRef.current = null;
  };

  const formatText = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  if (!isOnline) return <OfflineState feature="o Simulador de Treino" />;
  if (!API_KEY) return <OfflineState feature="o Simulador de Treino" subtitle="Configuração de IA indisponível. Fale com o suporte." />;

  // Selection screen
  if (!selectedObjection) {
    return (
      <div className="roleplay-page">
        <div className="roleplay-hero card">
          <Swords size={28} />
          <div>
            <h3>Simulador de Treino</h3>
            <p>Pratique responder objeções com um cliente virtual realista</p>
          </div>
        </div>

        <h4 className="section-title">Escolha uma objeção para treinar:</h4>
        <div className="roleplay-objection-list">
          {objections.map(obj => (
            <button key={obj.id} className="roleplay-objection-btn card" onClick={() => startTraining(obj)}>
              <span>{obj.objection}</span>
              <Swords size={16} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="roleplay-page">
      {/* Header */}
      <div className="roleplay-session-header">
        <button className="roleplay-change" onClick={() => setShowSelector(!showSelector)}>
          <span>Treinando: {selectedObjection.objection}</span>
          <ChevronDown size={14} />
        </button>
        <button className="btn btn-outline btn-sm" onClick={handleReset}>
          <RotateCcw size={12} /> Novo
        </button>
      </div>

      {showSelector && (
        <div className="roleplay-selector">
          {objections.map(obj => (
            <button key={obj.id} className="selector-item" onClick={() => startTraining(obj)}>
              {obj.objection}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      {!evaluation && (
        <div className="roleplay-progress">
          <span>Rodada {Math.min(exchangeCount + 1, 4)} de 4</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(exchangeCount / 4) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="roleplay-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`roleplay-msg ${msg.role}`}>
            {msg.role === 'client' && <div className="msg-avatar client-avatar">C</div>}
            <div className="msg-content">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && !evaluation && (
          <div className="roleplay-msg client">
            <div className="msg-avatar client-avatar">C</div>
            <div className="msg-content typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        {/* Evaluation */}
        {evaluation && (
          <div className="evaluation-card card">
            <div className="eval-header">
              <Star size={20} />
              <h4>Avaliação do Treino</h4>
            </div>
            <div
              className="eval-content"
              dangerouslySetInnerHTML={{ __html: formatText(evaluation) }}
            />
            <SpeakButton text={evaluation.replace(/\*\*/g, '').replace(/•/g, '')} size={16} />
            <button className="btn btn-primary" onClick={handleReset} style={{ marginTop: 12, width: '100%' }}>
              <Swords size={16} /> Treinar outra objeção
            </button>
          </div>
        )}

        {loading && evaluation === null && exchangeCount >= 4 && (
          <div className="evaluation-loading card">
            <Sparkles size={20} />
            <p>Analisando seu desempenho...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!evaluation && (
        <div className="input-area">
          <div className="input-wrapper">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Sua resposta ao cliente..."
              disabled={loading}
            />
            <button className="send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

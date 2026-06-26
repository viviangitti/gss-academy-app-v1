import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PenSquare, Video, Camera, Briefcase, MessageCircle, Sparkles,
  ChevronDown, Copy, Check, ArrowRight, Wand2,
} from 'lucide-react';
import { getPostFeedback } from '../services/postFeedback';
import type { PostFeedback } from '../services/postFeedback';
import './Home.css';
import './CriarConteudo.css';

interface Plataforma {
  id: string;
  nome: string;
  tipo: string;
  icon: typeof Video;
  estrutura: string[];
  exemplo: string;
}

const PLATAFORMAS: Plataforma[] = [
  {
    id: 'reels',
    nome: 'Reels',
    tipo: 'Vídeo curto — alcance',
    icon: Video,
    estrutura: [
      'Gancho nos 3 primeiros segundos (uma dor ou curiosidade).',
      'Entregue 1 dica rápida — mostre, não só fale.',
      'Feche com um convite: "me chama no direct".',
    ],
    exemplo:
      'POV: você vai trocar de carro e não sabe se compra 0km ou seminovo. 🚗\n' +
      '3 perguntas que eu faço pro meu cliente antes de decidir:\n' +
      '1) Quanto você roda por mês? 2) Vai usar na cidade ou estrada? 3) Pensa em trocar de novo em quanto tempo?\n' +
      'Responde aqui que eu monto a conta pro seu caso. Comenta "EU" 👇',
  },
  {
    id: 'insta',
    nome: 'Instagram',
    tipo: 'Post / carrossel — relacionamento',
    icon: Camera,
    estrutura: [
      'Capa com promessa clara (número + benefício).',
      '3 a 5 slides, 1 ideia por slide.',
      'Último slide: chamada pra ação + sua assinatura.',
    ],
    exemplo:
      'Capa: "5 coisas que ninguém te conta antes de financiar um carro"\n' +
      'Slide 1: A parcela baixa pode esconder um custo maior lá na frente.\n' +
      'Slide 2: Entrada maior nem sempre é o melhor negócio — te explico.\n' +
      'Slide 3: Seu usado vale mais na troca do que num site de anúncio.\n' +
      'Último: "Quer simular sem compromisso? Me chama no direct 🚗 — [seu nome]"',
  },
  {
    id: 'linkedin',
    nome: 'LinkedIn',
    tipo: 'Autoridade — profissional',
    icon: Briefcase,
    estrutura: [
      'Abra com uma situação real (história curta).',
      'Traga o aprendizado / o insight.',
      'Convite sutil, sem parecer vendedor.',
    ],
    exemplo:
      'Semana passada um cliente quase desistiu do carro que ele queria por causa da parcela.\n\n' +
      'Em vez de sair dando desconto, eu mostrei o custo real de manter o carro antigo dele por mais um ano. ' +
      'Ele fechou — e ainda indicou dois amigos.\n\n' +
      'A lição: na maioria das vezes o cliente não quer o menor preço. Quer ter certeza de que está fazendo um bom negócio.\n\n' +
      'É disso que eu cuido todo dia. 🚗',
  },
];

interface Modelo {
  titulo: string;
  quando: string;
  msg: string;
}

const WHATSAPP: Modelo[] = [
  {
    titulo: 'Primeiro contato (prospecção)',
    quando: 'Lead novo / indicação',
    msg: 'Oi [Nome], tudo bem? Aqui é o [seu nome], da [loja]. Vi que você demonstrou interesse no [modelo]. Posso te mandar as condições desse mês e tirar suas dúvidas por aqui, sem compromisso?',
  },
  {
    titulo: 'Reativar cliente frio',
    quando: 'Sumiu há semanas',
    msg: 'Oi [Nome]! Lembrei de você 😊 Saiu uma condição nova no [modelo] que combina com o que você procurava. Quer que eu te mande os números atualizados?',
  },
  {
    titulo: 'Resgate — não fechou',
    quando: 'Cliente desistiu / achou caro',
    msg: 'Oi [Nome], fiquei pensando no nosso papo. Consegui revisar a proposta e acho que dá pra deixar mais perto do que você precisa. Posso te ligar 5 min hoje pra te mostrar?',
  },
  {
    titulo: 'Follow-up pós test-drive',
    quando: 'Logo após o test-drive',
    msg: 'Oi [Nome]! Que bom ter te recebido hoje 🚗 E aí, o que achou do [modelo]? Qualquer dúvida que ficou, me chama — tô aqui pra te ajudar a decidir com tranquilidade.',
  },
];

export default function CriarConteudo() {
  const navigate = useNavigate();
  const [openPlat, setOpenPlat] = useState<string | null>('reels');
  const [copied, setCopied] = useState<string | null>(null);

  // Monte o seu post → feedback da IA
  const [draft, setDraft] = useState('');
  const [fbPlat, setFbPlat] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState('');
  const [feedback, setFeedback] = useState<PostFeedback | null>(null);

  const pedirFeedback = async () => {
    if (!draft.trim() || fbLoading) return;
    setFbLoading(true);
    setFbError('');
    setFeedback(null);
    try {
      setFeedback(await getPostFeedback(draft.trim(), fbPlat));
    } catch {
      setFbError('Não consegui analisar agora. Tenta de novo em segundos.');
    }
    setFbLoading(false);
  };

  const copy = (id: string, text: string) => {
    const clean = text.replace(/\n/g, '\n');
    navigator.clipboard?.writeText(clean).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="home">
      {/* Hero */}
      <div className="cc-hero card">
        <div className="cc-hero-icon"><PenSquare size={24} /></div>
        <div>
          <h2>Criar conteúdo</h2>
          <p>Atraia clientes postando — roteiros e modelos prontos pra adaptar</p>
        </div>
      </div>

      {/* Roteiros por plataforma */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Roteiros por plataforma</h3></div>
        {PLATAFORMAS.map(p => {
          const Icon = p.icon;
          const isOpen = openPlat === p.id;
          return (
            <div key={p.id} className={`cc-plat card ${isOpen ? 'open' : ''}`}>
              <button className="cc-plat-head" onClick={() => setOpenPlat(isOpen ? null : p.id)}>
                <div className={`cc-plat-icon cc-${p.id}`}><Icon size={18} /></div>
                <div className="cc-plat-text">
                  <strong>{p.nome}</strong>
                  <span>{p.tipo}</span>
                </div>
                <ChevronDown size={18} className="cc-chevron" />
              </button>
              {isOpen && (
                <div className="cc-plat-body">
                  <p className="cc-label">Estrutura</p>
                  <ol className="cc-steps">
                    {p.estrutura.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                  <p className="cc-label">Exemplo (carro)</p>
                  <div className="cc-example">{p.exemplo}</div>
                  <button className="cc-copy" onClick={() => copy(p.id, p.exemplo)}>
                    {copied === p.id ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar exemplo</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Monte o seu post → feedback da IA */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Monte o seu post → feedback da IA</h3></div>
        <div className="cc-fb-form card">
          <div className="cc-fb-plats">
            {['Reels', 'Instagram', 'LinkedIn'].map(p => (
              <button key={p} type="button" className={`cc-fb-chip ${fbPlat === p ? 'on' : ''}`}
                onClick={() => setFbPlat(fbPlat === p ? '' : p)}>{p}</button>
            ))}
          </div>
          <textarea className="cc-fb-input" rows={4}
            placeholder="Cole ou escreva o seu rascunho de post aqui…"
            value={draft} onChange={e => setDraft(e.target.value)} />
          <button className="cc-fb-btn" onClick={pedirFeedback} disabled={!draft.trim() || fbLoading}>
            {fbLoading ? 'Analisando…' : <><Wand2 size={15} /> Pedir feedback</>}
          </button>
          {fbError && <p className="cc-fb-err">{fbError}</p>}
        </div>

        {feedback && (
          <div className="cc-fb-result card">
            <div className="cc-fb-score"><Sparkles size={14} /> Nota {feedback.nota}/10</div>
            {feedback.pontosFortes.length > 0 && (
              <>
                <p className="cc-label cc-label-win">Pontos fortes</p>
                <ul className="cc-fb-list">{feedback.pontosFortes.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </>
            )}
            {feedback.melhorias.length > 0 && (
              <>
                <p className="cc-label cc-label-lose">A melhorar</p>
                <ul className="cc-fb-list">{feedback.melhorias.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </>
            )}
            <p className="cc-label">Versão melhorada</p>
            <div className="cc-example">{feedback.versaoMelhorada}</div>
            <button className="cc-copy" onClick={() => copy('fb', feedback.versaoMelhorada)}>
              {copied === 'fb' ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar versão melhorada</>}
            </button>
          </div>
        )}
      </div>

      {/* Modelos de WhatsApp */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">WhatsApp & prospecção</h3></div>
        {WHATSAPP.map((m, i) => (
          <div key={i} className="cc-msg card">
            <div className="cc-msg-head">
              <MessageCircle size={16} className="cc-msg-icon" />
              <div className="cc-msg-titles">
                <strong>{m.titulo}</strong>
                <span>{m.quando}</span>
              </div>
            </div>
            <div className="cc-msg-text">{m.msg}</div>
            <button className="cc-copy" onClick={() => copy(`wpp-${i}`, m.msg)}>
              {copied === `wpp-${i}` ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar mensagem</>}
            </button>
          </div>
        ))}
      </div>

      {/* Sugestões prontas */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Quer ideia pronta de hoje?</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/conteudo-dia')}>
          <div className="home-content-icon"><Sparkles size={20} /></div>
          <div className="home-content-text">
            <strong>Sugestões de post do dia</strong>
            <span>Conteúdo pronto do seu segmento pra postar agora</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>
    </div>
  );
}

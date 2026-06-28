import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PenSquare, Video, Layers, Clock, Briefcase, Sparkles,
  ChevronDown, Copy, Check, ArrowRight, Wand2,
  BookOpen, Camera, Star, Tag, Trophy, Flame,
} from 'lucide-react';
import { getPostFeedback } from '../services/postFeedback';
import type { PostFeedback } from '../services/postFeedback';
import { hasBrandGuide } from '../services/brandGuide';
import {
  getWeeklyMissions, getWeeklyMissionProgress, isMissionDone, completeMission,
  getContentStats, getMonthlyStats, currentMonthKey, currentWeekKey,
} from '../services/socialContent';
import type { WeeklyMission } from '../services/socialContent';
import { saveContentProof } from '../services/firestore/contentProofs';
import { saveMyContentScore } from '../services/firestore/contentScores';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './Home.css';
import './CriarConteudo.css';

interface Pilar { id: string; nome: string; desc: string; icon: typeof BookOpen; ideias: string[] }

// O que postar (a base de uma estratégia de agência: pilares, não posts soltos)
const PILARES: Pilar[] = [
  { id: 'educar', nome: 'Educar', desc: 'Dicas que ajudam — gera autoridade e salvamento', icon: BookOpen, ideias: [
    '3 erros de quem vai financiar o primeiro carro',
    '0km x seminovo: como decidir em 3 perguntas',
    'O que olhar num test-drive que ninguém te conta',
  ] },
  { id: 'bastidores', nome: 'Bastidores', desc: 'O seu dia a dia — gera conexão', icon: Camera, ideias: [
    'A entrega de hoje (cliente saindo de carro novo)',
    'Como eu preparo um atendimento antes do cliente chegar',
    'Um dia na loja em 30 segundos',
  ] },
  { id: 'prova', nome: 'Prova social', desc: 'Clientes felizes — gera confiança', icon: Star, ideias: [
    'Depoimento de quem comprou com você',
    'Antes e depois: a busca do cliente até achar o carro certo',
    'Print de uma conversa de cliente satisfeito (com permissão)',
  ] },
  { id: 'oferta', nome: 'Novidade & oferta', desc: 'Lançamento / condição — gera conversão (use com parcimônia)', icon: Tag, ideias: [
    'Chegou o [modelo] — 3 motivos pra conhecer',
    'A condição do mês explicada em 15 segundos',
    'Estoque chegando: o que tem de novo na loja',
  ] },
  { id: 'marca', nome: 'Sua marca pessoal', desc: 'Por que confiar em você — gera autoridade', icon: PenSquare, ideias: [
    'Por que eu escolhi trabalhar com carros',
    'Como eu cuido do cliente depois da venda',
    'Um valor que eu não abro mão no atendimento',
  ] },
];

interface Formato { id: string; nome: string; tipo: string; icon: typeof Video; estrutura: string[]; exemplo: string }

const FORMATOS: Formato[] = [
  {
    id: 'reels', nome: 'Reels', tipo: 'Vídeo curto — traz ALCANCE (novos seguidores)', icon: Video,
    estrutura: [
      'Gancho nos 3 primeiros segundos (uma dor ou curiosidade).',
      'Entregue 1 ideia rápida — mostre, não só fale.',
      'Feche com convite: "comenta EU" ou "me chama no direct".',
    ],
    exemplo:
      'POV: você vai trocar de carro e não sabe se compra 0km ou seminovo. 🚗\n' +
      '3 perguntas que eu faço antes de decidir:\n' +
      '1) Quanto você roda por mês? 2) Cidade ou estrada? 3) Pensa em trocar de novo em quanto tempo?\n' +
      'Comenta "EU" que eu monto a conta pro seu caso 👇',
  },
  {
    id: 'carrossel', nome: 'Carrossel', tipo: 'Vários slides — traz AUTORIDADE (salvamentos)', icon: Layers,
    estrutura: [
      'Capa com promessa clara (número + benefício).',
      '3 a 6 slides, 1 ideia por slide, fácil de deslizar.',
      'Último slide: chamada pra ação + sua assinatura.',
    ],
    exemplo:
      'Capa: "5 coisas que ninguém te conta antes de financiar"\n' +
      'Slide 1: Parcela baixa pode esconder um custo maior lá na frente.\n' +
      'Slide 2: Entrada maior nem sempre é o melhor negócio.\n' +
      'Slide 3: Seu usado vale mais na troca do que num site.\n' +
      'Último: "Quer simular sem compromisso? Me chama 🚗 — [seu nome]"',
  },
  {
    id: 'stories', nome: 'Stories', tipo: 'Diário — traz RELACIONAMENTO (quem já te segue)', icon: Clock,
    estrutura: [
      'Mostre o bastidor do dia (real, sem produção).',
      'Use enquete/caixinha pra puxar resposta.',
      'Feche com link ou "responde aqui".',
    ],
    exemplo:
      'Story 1 (vídeo): "Olha a entrega de hoje 🎉" (cliente pegando o carro)\n' +
      'Story 2 (enquete): "Seu próximo carro vai ser? 🚗 0km / Seminovo"\n' +
      'Story 3: "Quer que eu veja uma condição pro modelo que você quer? Responde aqui 👇"',
  },
  {
    id: 'linkedin', nome: 'LinkedIn', tipo: 'Texto — AUTORIDADE profissional', icon: Briefcase,
    estrutura: [
      'Abra com uma situação real (história curta).',
      'Traga o aprendizado / o insight.',
      'Convite sutil, sem parecer vendedor.',
    ],
    exemplo:
      'Semana passada um cliente quase desistiu do carro por causa da parcela.\n\n' +
      'Em vez de dar desconto, mostrei o custo real de manter o carro antigo por mais um ano. ' +
      'Ele fechou — e ainda indicou dois amigos.\n\n' +
      'Na maioria das vezes o cliente não quer o menor preço. Quer ter certeza de que está fazendo um bom negócio. 🚗',
  },
];

export default function CriarConteudo() {
  const navigate = useNavigate();
  const brandGuideOn = hasBrandGuide();
  const [openPilar, setOpenPilar] = useState<string | null>(null);
  const [openFmt, setOpenFmt] = useState<string | null>('reels');
  const [copied, setCopied] = useState<string | null>(null);

  // Missões da semana (social selling pontuado — mesmo fluxo de print/score do Conteúdo do Dia)
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [, setTick] = useState(0);
  const [upMissionId, setUpMissionId] = useState<string | null>(null);
  const [upPct, setUpPct] = useState(0);
  const [missionError, setMissionError] = useState('');
  const missions = getWeeklyMissions();
  const prog = getWeeklyMissionProgress();
  const stats = getContentStats();

  // Sincroniza o placar do mês no Firestore (mesmo do Conteúdo do Dia → ranking + painel do gestor)
  const syncMissionScore = () => {
    if (!profile.uid) return;
    const m = getMonthlyStats();
    const s = getContentStats();
    saveMyContentScore({
      uid: profile.uid, name: profile.name || 'Vendedor', company: profile.company || '',
      segment: profile.segment || '', teamId: profile.teamId ?? null, monthKey: currentMonthKey(),
      points: m.points, shares: m.shares, streak: s.streak,
    }).catch(() => {});
  };

  // Só pontua quando anexa o print (vira prova no painel do gestor)
  const handleMissionProof = async (m: WeeklyMission, file: File) => {
    if (!profile.uid) { setMissionError('Faça login para comprovar a missão.'); return; }
    setMissionError(''); setUpMissionId(m.id); setUpPct(0);
    try {
      await saveContentProof({
        uid: profile.uid, name: profile.name || 'Vendedor', company: profile.company || '',
        segment: profile.segment || '', monthKey: currentMonthKey(),
        contentId: `mission-${currentWeekKey()}-${m.id}`, caption: `[Missão] ${m.title}`,
        file, onProgress: setUpPct,
      });
      completeMission(m);
      syncMissionScore();
      setTick(t => t + 1);
    } catch {
      setMissionError('Não consegui enviar o print. Tenta de novo.');
    } finally {
      setUpMissionId(null);
    }
  };

  const [draft, setDraft] = useState('');
  const [fbPlat, setFbPlat] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState('');
  const [feedback, setFeedback] = useState<PostFeedback | null>(null);

  const pedirFeedback = async () => {
    if (!draft.trim() || fbLoading) return;
    setFbLoading(true); setFbError(''); setFeedback(null);
    try { setFeedback(await getPostFeedback(draft.trim(), fbPlat)); }
    catch { setFbError('Não consegui analisar agora. Tenta de novo em segundos.'); }
    setFbLoading(false);
  };

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="home">
      <div className="cc-hero card">
        <div className="cc-hero-icon"><PenSquare size={24} /></div>
        <div>
          <h2>Conteúdo pra redes</h2>
          <p>Atraia clientes postando — o que postar, como postar e feedback da IA</p>
        </div>
      </div>

      {/* Missões da semana — social selling pontuado (ref. Socialis) */}
      <div className="day-section">
        <div className="cc-miss-head">
          <h3 className="section-title">Missões da semana</h3>
          <div className="cc-miss-stats">
            <span title="pontos no total"><Trophy size={13} /> {stats.totalPoints}</span>
            <span title="dias seguidos postando"><Flame size={13} className={stats.streak > 0 ? 'cc-flame' : ''} /> {stats.streak}</span>
          </div>
        </div>
        <div className="cc-miss-prog card">
          <div className="cc-miss-prog-top">
            <strong>{prog.done}/{prog.total} feitas</strong>
            <span>{prog.earned}/{prog.points} pts</span>
          </div>
          <div className="cc-miss-bar"><i style={{ width: `${prog.total ? (prog.done / prog.total) * 100 : 0}%` }} /></div>
          <p className="cc-miss-sub">{prog.done >= prog.total ? '🏆 Semana completa! Mandou bem.' : 'Complete as missões e suba no ranking do time.'}</p>
        </div>
        {missions.map(m => {
          const done = isMissionDone(m.id);
          const uploading = upMissionId === m.id;
          return (
            <div key={m.id} className={`cc-miss card ${done ? 'done' : ''}`}>
              <div className="cc-miss-emoji">{m.emoji}</div>
              <div className="cc-miss-text">
                <strong>{m.title}</strong>
                <span>{m.how}</span>
                <span className="cc-miss-tag">{m.pilar} · +{m.points} pts</span>
              </div>
              {done ? (
                <span className="cc-miss-btn done"><Check size={15} /> Feito</span>
              ) : (
                <label className={`cc-miss-btn cc-miss-proof ${uploading ? 'is-loading' : ''}`}>
                  <Camera size={14} /> {uploading ? `${upPct}%` : 'Print'}
                  <input type="file" accept="image/*" hidden disabled={upMissionId !== null}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleMissionProof(m, f); e.target.value = ''; }} />
                </label>
              )}
            </div>
          );
        })}
        {missionError && <p className="cc-miss-err">{missionError}</p>}
        <p className="cc-miss-foot">Anexe o <strong>print do post</strong> pra pontuar — só assim entra no ranking e no painel do gestor.</p>
      </div>

      {/* 1. O que postar — pilares */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">1. O que postar</h3></div>
        <p className="cc-intro">Não poste solto. Gire entre estes pilares — é assim que se constrói marca:</p>
        {PILARES.map(p => {
          const Icon = p.icon;
          const isOpen = openPilar === p.id;
          return (
            <div key={p.id} className={`cc-plat card ${isOpen ? 'open' : ''}`}>
              <button className="cc-plat-head" onClick={() => setOpenPilar(isOpen ? null : p.id)}>
                <div className={`cc-plat-icon cc-pilar-${p.id}`}><Icon size={18} /></div>
                <div className="cc-plat-text">
                  <strong>{p.nome}</strong>
                  <span>{p.desc}</span>
                </div>
                <ChevronDown size={18} className="cc-chevron" />
              </button>
              {isOpen && (
                <div className="cc-plat-body">
                  <p className="cc-label">Ideias pra postar</p>
                  <ul className="cc-ideas">{p.ideias.map((d, i) => <li key={i}>{d}</li>)}</ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Como postar — formatos */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">2. Como postar (formato)</h3></div>
        {FORMATOS.map(f => {
          const Icon = f.icon;
          const isOpen = openFmt === f.id;
          return (
            <div key={f.id} className={`cc-plat card ${isOpen ? 'open' : ''}`}>
              <button className="cc-plat-head" onClick={() => setOpenFmt(isOpen ? null : f.id)}>
                <div className={`cc-plat-icon cc-${f.id}`}><Icon size={18} /></div>
                <div className="cc-plat-text">
                  <strong>{f.nome}</strong>
                  <span>{f.tipo}</span>
                </div>
                <ChevronDown size={18} className="cc-chevron" />
              </button>
              {isOpen && (
                <div className="cc-plat-body">
                  <p className="cc-label">Estrutura</p>
                  <ol className="cc-steps">{f.estrutura.map((s, i) => <li key={i}>{s}</li>)}</ol>
                  <p className="cc-label">Exemplo (carro)</p>
                  <div className="cc-example">{f.exemplo}</div>
                  <button className="cc-copy" onClick={() => copy(f.id, f.exemplo)}>
                    {copied === f.id ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar exemplo</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Feedback da IA no seu post */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">3. Já escreveu? Peça feedback</h3></div>
        {brandGuideOn
          ? <p className="cc-guide-note cc-guide-on">✓ Seguindo o seu Guia de Marca (tom e identidade)</p>
          : <button className="cc-guide-note cc-guide-off" onClick={() => navigate('/guia-marca')}>＋ Cadastre seu Guia de Marca pra alinhar tom, cores e identidade</button>}
        <div className="cc-fb-form card">
          <div className="cc-fb-plats">
            {['Reels', 'Carrossel', 'Stories', 'LinkedIn'].map(p => (
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

      {/* Atalho: ideia pronta do dia */}
      <div className="day-section">
        <button className="home-content-card card" onClick={() => navigate('/conteudo-dia')}>
          <div className="home-content-icon"><Sparkles size={20} /></div>
          <div className="home-content-text">
            <strong>Sem tempo? Pega a ideia do dia</strong>
            <span>Post pronto do seu segmento pra publicar agora</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>
    </div>
  );
}

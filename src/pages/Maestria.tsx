import { useNavigate } from 'react-router-dom';
import { Swords, Mic, MessageCircle, Sparkles, BookOpen, Flame, PenSquare, ClipboardCheck, Users, Wand2, Share2, Video, Heart, GraduationCap, ArrowRight } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getMaestriaProgress, getTreinoDoDia } from '../services/maestriaProgress';
import { getTeamCasesRaw } from '../services/memory';
import type { Objection } from '../services/content';
import type { UserProfile } from '../types';

const REASON_LINE: Record<string, string> = {
  preco: 'Achei muito caro', concorrente: 'O concorrente está mais barato',
  timing: 'Não é o momento agora', sem_orcamento: 'Não tenho orçamento',
  sem_decisao: 'Preciso falar com outra pessoa', relacionamento: 'Prefiro meu fornecedor atual',
  produto: 'Não é bem o que procuro', outro: 'Vou pensar melhor',
};

function getCaseObjection(): Objection | null {
  const cases = getTeamCasesRaw();
  const withObj = cases.find(c => c.objection && c.objection.trim().length > 3);
  if (withObj) return { id: 'case', objection: withObj.objection, responses: [] };
  const lost = cases.find(c => c.kind === 'lost' && c.reason);
  if (lost) return { id: 'case', objection: `"${REASON_LINE[lost.reason] || 'Vou pensar'}"`, responses: [] };
  return null;
}
import './Home.css';
import './Maestria.css';

export default function Maestria() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const isGestor = profile.isGestor === true || profile.isAdmin === true;
  const isSales = profile.userAccessType !== 'marketing';
  const progress = getMaestriaProgress();
  const treinoDoDia = getTreinoDoDia(profile.segment);
  const caseObj = isSales ? getCaseObjection() : null;

  return (
    <div className="home">

      {/* Sua evolução — nível, ofensiva e treino do dia (só vendas) */}
      {isSales && (
        <div className="mae-evo card">
          <div className="mae-evo-top">
            <div className="mae-evo-level">
              <div className="mae-evo-badge"><GraduationCap size={18} /></div>
              <div>
                <span className="mae-evo-label">Nível: {progress.levelLabel}</span>
                <div className="mae-evo-bar"><i style={{ width: `${progress.pct}%` }} /></div>
              </div>
            </div>
            <div className="mae-evo-streak" title="dias seguidos treinando">
              <Flame size={15} /> {progress.streak}
            </div>
          </div>
          {treinoDoDia && (
            <button
              className="mae-evo-today"
              onClick={() => navigate('/treino', { state: { startObjection: treinoDoDia.objection } })}
            >
              <div className="mae-evo-today-text">
                <strong>Treine isto hoje: {treinoDoDia.objection.objection.replace(/^"|"$/g, '')}</strong>
                <span>{treinoDoDia.reason}</span>
              </div>
              <span className="mae-evo-today-cta">Treinar <ArrowRight size={15} /></span>
            </button>
          )}
        </div>
      )}

      {/* Para o gestor — rotinas e rituais com o time */}
      {isGestor && (
        <div className="day-section">
          <div className="day-section-header"><h3 className="section-title">Para o gestor</h3></div>
          <button className="home-content-card card" onClick={() => navigate('/rituais-gestor')}>
            <div className="home-content-icon mae-gestor-icon"><Users size={20} /></div>
            <div className="home-content-text">
              <strong>Rotinas & rituais com o time</strong>
              <span>Cadência diária, semanal e mensal pra aplicar de forma simples</span>
            </div>
            <ArrowRight size={16} className="home-train-arrow" />
          </button>
        </div>
      )}

      {/* Treino & simulação */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Treino & simulação</h3></div>
        <div className="home-dual-grid">
          <button className="home-dual-card card" onClick={() => navigate('/treino')}>
            <div className="home-dual-icon"><Swords size={18} /></div>
            <strong>Simular atendimento</strong>
            <span>Atendimento, financiamento e objeções — como cliente real</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/treino-voz')}>
            <div className="home-dual-icon"><Mic size={18} /></div>
            <strong>Treino falado</strong>
            <span>Treine por voz com o cliente difícil</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/treino-video')}>
            <div className="home-dual-icon"><Video size={18} /></div>
            <strong>Treino em vídeo</strong>
            <span>Grave-se e receba feedback de entrega e mensagem</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/coach-mensagem')}>
            <div className="home-dual-icon"><Wand2 size={18} /></div>
            <strong>Revisar mensagem</strong>
            <span>Cole seu WhatsApp e melhore antes de enviar</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/analise-reuniao')}>
            <div className="home-dual-icon"><ClipboardCheck size={18} /></div>
            <strong>Pós-atendimento</strong>
            <span>Fale 1 min sobre como foi e receba o resumo</span>
          </button>
        </div>
        {caseObj && (
          <button className="home-content-card card" style={{ marginTop: 10 }}
            onClick={() => navigate('/treino', { state: { startObjection: caseObj } })}>
            <div className="home-content-icon mae-case-icon"><Users size={20} /></div>
            <div className="home-content-text">
              <strong>Treinar um caso real da equipe</strong>
              <span>O cliente disse: "{caseObj.objection.replace(/^"|"$/g, '')}"</span>
            </div>
            <ArrowRight size={16} className="home-train-arrow" />
          </button>
        )}
      </div>

      {/* Vender por valor — narrativa aspiracional + biblioteca */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Vender por valor</h3></div>
        <button className="home-content-card card mae-aspira-card" onClick={() => navigate('/narrativa')}>
          <div className="home-content-icon mae-aspira-icon"><Heart size={20} /></div>
          <div className="home-content-text">
            <strong>Narrativa aspiracional</strong>
            <span>Venda o sonho, não o preço — a IA monta o pitch e defende valor</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
        <div className="home-dual-grid" style={{ marginTop: 10 }}>
          <button className="home-dual-card card" onClick={() => navigate('/objecoes')}>
            <div className="home-dual-icon"><MessageCircle size={18} /></div>
            <strong>Contornar objeções</strong>
            <span>Respostas prontas pras mais comuns</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/tecnicas')}>
            <div className="home-dual-icon"><Sparkles size={18} /></div>
            <strong>Técnicas de venda</strong>
            <span>Narrativa que inspira, menos desconto</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/scripts')}>
            <div className="home-dual-icon"><BookOpen size={18} /></div>
            <strong>Roteiros prontos</strong>
            <span>Aberturas e fechamentos que convertem</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/gatilhos')}>
            <div className="home-dual-icon"><Flame size={18} /></div>
            <strong>Gatilhos de urgência</strong>
            <span>Oportunidade sem apelar pro desconto</span>
          </button>
          <button className="home-dual-card card" onClick={() => navigate('/pre-reuniao')}>
            <div className="home-dual-icon"><ClipboardCheck size={18} /></div>
            <strong>Pré-atendimento</strong>
            <span>Chegue pronto pro test-drive</span>
          </button>
        </div>
      </div>

      {/* Criar conteúdo (creators) */}
      <div className="day-section">
        <div className="day-section-header"><h3 className="section-title">Criar conteúdo</h3></div>
        <button className="home-content-card card" onClick={() => navigate('/criar-conteudo')}>
          <div className="home-content-icon mae-content-icon"><PenSquare size={20} /></div>
          <div className="home-content-text">
            <strong>Aprenda a criar conteúdo</strong>
            <span>Roteiros pra Reels, Insta e LinkedIn + modelos de WhatsApp</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
        <button className="home-content-card card" onClick={() => navigate('/conteudo-dia')}>
          <div className="home-content-icon mae-conteudodia-icon"><Share2 size={20} /></div>
          <div className="home-content-text">
            <strong>Conteúdo do Dia</strong>
            <span>Poste nas suas redes e ganhe pontos</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import {
  Home, Newspaper, LayoutGrid, MessageCircle, Users, Brain,
  ChevronRight,
} from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './AppMap.css';

interface MapItem { label: string; desc?: string; to?: string; }
interface MapSection { title: string; icon: typeof Home; color: string; items: MapItem[]; }

const SECTIONS: MapSection[] = [
  {
    title: 'Painel Controle', icon: Home, color: '#185FA5',
    items: [
      { label: 'Resumo do dia', desc: 'Meta, follow-ups e munição do dia', to: '/' },
      { label: 'Vendi / Não fechou', desc: 'Registro rápido do atendimento', to: '/' },
      { label: 'Boost', desc: 'Destrave a argumentação', to: '/boost' },
      { label: 'Coach por voz', desc: 'Converse falando', to: '/coach-voz' },
      { label: 'Meta e vendas', desc: 'Acompanhe suas vendas', to: '/vendas' },
      { label: 'Tarefas do dia', desc: 'Organize e marque o que fez', to: '/' },
    ],
  },
  {
    title: 'Notícias', icon: Newspaper, color: '#0F6E56',
    items: [
      { label: 'Tudo / Lançamentos / Tendências', desc: 'Do seu segmento, ao vivo', to: '/noticias' },
      { label: 'Ofertas dos concorrentes', desc: 'Inteligência competitiva', to: '/noticias' },
      { label: 'Concorrentes', desc: 'Movimentos das marcas', to: '/noticias' },
      { label: 'Brasil e Mundo + busca', desc: 'Filtro por faixa de preço', to: '/noticias' },
    ],
  },
  {
    title: 'Painel', icon: LayoutGrid, color: '#534AB7',
    items: [
      { label: 'Meu Raio-X', desc: 'Suas competências e gaps', to: '/meu-raiox' },
      { label: 'Condição comercial do mês', desc: 'Tabelas e campanhas do mês', to: '/condicoes' },
      { label: 'Concorrência', desc: 'O que estão fazendo', to: '/concorrencia' },
      { label: 'Playbook · Objeções · Gatilhos', desc: 'Munição de venda', to: '/objecoes' },
      { label: 'Treino', desc: 'Simulação, voz, pré/pós-reunião', to: '/treino-hub' },
      { label: 'Vendas perdidas', desc: 'Aprenda com cada perda', to: '/vendas-perdidas' },
      { label: 'Conteúdo do dia', desc: 'Poste e ganhe pontos', to: '/conteudo-dia' },
      { label: 'Histórico', desc: 'Tudo que você fez', to: '/historico' },
    ],
  },
  {
    title: 'Coaching', icon: MessageCircle, color: '#993C1D',
    items: [
      { label: 'Coach de Vendas', desc: 'Por texto, com memória', to: '/ia-coach' },
      { label: 'Coach por Voz', desc: 'O orb que escuta e fala', to: '/coach-voz' },
      { label: 'Boost', desc: 'SOS + pós-atendimento', to: '/boost' },
      { label: 'Rescue', desc: 'Resgate de cliente perdido', to: '/rescue' },
    ],
  },
];

const GESTOR_SECTION: MapSection = {
  title: 'Gestor', icon: Users, color: '#854F0B',
  items: [
    { label: 'Mapa de gaps da equipe', desc: 'Quem perde por quê', to: '/painel-gestor' },
    { label: 'Resumo da semana', desc: 'Pronto pra colar no grupo', to: '/painel-gestor' },
    { label: 'Ranking de conteúdo', desc: 'Engajamento da equipe', to: '/painel-gestor' },
  ],
};

const IA_LAYER: MapItem[] = [
  { label: 'Memória do coach', desc: 'Lembra de você' },
  { label: 'Cérebro coletivo', desc: 'Casos reais da empresa' },
  { label: 'Assistente personalizado', desc: 'Dê nome e tom', to: '/perfil' },
  { label: 'Playbook vivo', desc: 'Objeções que aprendem' },
  { label: 'Notificações push', desc: 'Avisos no celular' },
];

export default function AppMap() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const isGestor = profile.isGestor === true || profile.isAdmin === true;

  const sections = isGestor ? [...SECTIONS, GESTOR_SECTION] : SECTIONS;

  const renderItem = (it: MapItem, color: string) => (
    <button
      key={it.label}
      className={`am-item ${it.to ? '' : 'am-item--static'}`}
      onClick={() => it.to && navigate(it.to)}
      style={{ ['--am-accent' as string]: color }}
    >
      <span className="am-dot" />
      <span className="am-item-text">
        <strong>{it.label}</strong>
        {it.desc && <span>{it.desc}</span>}
      </span>
      {it.to && <ChevronRight size={15} className="am-arrow" />}
    </button>
  );

  return (
    <div className="am-page">
      <div className="am-hero">
        <h2>Mapa do app</h2>
        <p>Tudo que existe no MAESTR.IA — toque pra ir direto.</p>
      </div>

      {sections.map(sec => {
        const Icon = sec.icon;
        return (
          <div key={sec.title} className="am-section card" style={{ ['--am-accent' as string]: sec.color }}>
            <div className="am-section-head">
              <Icon size={18} />
              <span>{sec.title}</span>
            </div>
            <div className="am-items">
              {sec.items.map(it => renderItem(it, sec.color))}
            </div>
          </div>
        );
      })}

      {/* Camada de IA */}
      <div className="am-section card am-ia" style={{ ['--am-accent' as string]: '#5F5E5A' }}>
        <div className="am-section-head">
          <Brain size={18} />
          <span>Camada de IA</span>
        </div>
        <p className="am-ia-sub">Conecta tudo acima — quanto mais a equipe usa, mais inteligente fica.</p>
        <div className="am-items">
          {IA_LAYER.map(it => renderItem(it, '#5F5E5A'))}
        </div>
      </div>
    </div>
  );
}

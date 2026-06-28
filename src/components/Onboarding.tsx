import { useState } from 'react';
import {
  Sparkles, Target, Dumbbell, FileText,
  PenLine, BarChart2, BookOpen, Factory, ChevronRight, Zap, MessageSquare,
  Users, Handshake, CalendarCheck, Megaphone, Wand2,
} from 'lucide-react';
import { saveData, loadData, KEYS } from '../services/storage';
import type { Segment, UserProfile } from '../types';
import './Onboarding.css';

const SEGMENT_OPTIONS: { value: Segment; emoji: string; label: string }[] = [
  { value: 'automotivo',             emoji: '🚗', label: 'Automotivo' },
  { value: 'automotivo_luxo',        emoji: '🏎️', label: 'Auto Luxo' },
  { value: 'varejo',                 emoji: '🛍️', label: 'Varejo' },
  { value: 'tecnologia',             emoji: '💻', label: 'Tecnologia' },
  { value: 'imobiliario',            emoji: '🏠', label: 'Imobiliário' },
  { value: 'financeiro',             emoji: '💰', label: 'Financeiro' },
  { value: 'industria',              emoji: '🏭', label: 'Indústria' },
  { value: 'saude',                  emoji: '❤️', label: 'Saúde' },
  { value: 'educacao',               emoji: '📚', label: 'Educação' },
  { value: 'servicos',               emoji: '🤝', label: 'Serviços' },
  { value: 'agro',                   emoji: '🌾', label: 'Agronegócio' },
  { value: 'energia',                emoji: '⚡', label: 'Energia' },
  { value: 'farmaceutico',           emoji: '💊', label: 'Farmacêutico' },
  { value: 'bebidas_alcoolicas',     emoji: '🍺', label: 'Bebidas' },
  { value: 'bebidas_alcoolicas_vinho', emoji: '🍷', label: 'Vinhos' },
];

type Role = 'vendedor' | 'gerente' | 'marketing';
type Feature = { icon: typeof Target; title: string; desc: string };

// Slide do tour por papel — só aparece o que faz sentido pro acesso escolhido.
const ROLE_SLIDE: Record<Role, { icon: typeof Target; iconClass: string; title: string; subtitle: string; features: Feature[] }> = {
  vendedor: {
    icon: Target, iconClass: 'onboarding-icon-vendas',
    title: 'Ferramentas para vender mais',
    subtitle: 'Tudo que um vendedor de alta performance precisa, na palma da mão.',
    features: [
      { icon: Dumbbell, title: 'Treino com IA', desc: 'Simulação, pré-atendimento e análise pós-venda' },
      { icon: MessageSquare, title: 'Objeções & Roteiros', desc: 'Respostas prontas para cada situação' },
      { icon: FileText, title: 'Condições Comerciais', desc: 'Ofertas do mês com card visual para compartilhar' },
      { icon: Zap, title: 'IA Coach & Gatilhos', desc: 'Coaching pessoal e gatilhos de fechamento' },
    ],
  },
  gerente: {
    icon: Users, iconClass: 'onboarding-icon-vendas',
    title: 'Gestão do time com IA',
    subtitle: 'Acompanhe a equipe, atue nos gaps e lidere com método.',
    features: [
      { icon: BarChart2, title: 'Raio X do Time', desc: 'Performance, gaps e pontos fortes da equipe' },
      { icon: Handshake, title: 'Negociações do time', desc: 'Quem está em atendimento e o que foi concluído' },
      { icon: Dumbbell, title: 'Treino de liderança', desc: 'Pratique conversas difíceis com a IA' },
      { icon: CalendarCheck, title: 'Plano da semana', desc: 'Rotinas, rituais e foco da equipe' },
    ],
  },
  marketing: {
    icon: Megaphone, iconClass: 'onboarding-icon-mkt',
    title: 'Marketing com IA integrada',
    subtitle: 'Crie, confira e meça suas campanhas — sempre dentro da marca.',
    features: [
      { icon: BookOpen, title: 'Guia de Marca', desc: 'Cores, fontes e tom guiam todas as criações' },
      { icon: PenLine, title: 'Gerador de Copy', desc: 'Versões prontas para posts, Stories e WhatsApp' },
      { icon: Wand2, title: 'Copiloto de Marketing', desc: 'Confira peças e ações dentro do guia' },
      { icon: BarChart2, title: 'Raio X do Marketing', desc: 'Envie um print — IA gera insights e realocação de verba' },
    ],
  },
};

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const existing = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });

  // Papel escolhido no cadastro (Auth) — define qual slide o tour mostra.
  const role: Role = existing.isGestor ? 'gerente' : existing.userAccessType === 'marketing' ? 'marketing' : 'vendedor';
  const slide = ROLE_SLIDE[role];
  const RoleIcon = slide.icon;

  const [step, setStep] = useState(0);
  const [segment, setSegment] = useState<Segment>(existing.segment || '');

  // O segmento já vem do cadastro. Só pede aqui se faltar (fallback).
  const needSegment = !existing.segment;
  const TOTAL_STEPS = needSegment ? 3 : 2;

  const handleFinish = () => {
    const profile: UserProfile = { ...existing, segment: segment || existing.segment };
    saveData(KEYS.PROFILE, profile);
    localStorage.setItem('gss_onboarding_done', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('gss_onboarding_done', 'true');
    onComplete();
  };

  const Dots = () => (
    <div className="onboarding-dots">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
      ))}
    </div>
  );

  return (
    <div className="onboarding-overlay">
      <button className="onboarding-skip" onClick={handleSkip}>Pular</button>

      {/* Step 0 — Boas-vindas */}
      {step === 0 && (
        <div className="onboarding-screen">
          <div className="onboarding-logo-wrap">
            <span className="onboarding-gss">GSS</span>
          </div>
          <div className="onboarding-icon">
            <Sparkles size={44} />
          </div>
          <h2>Bem-vindo ao<br />MAESTR.IA</h2>
          <p><strong>Um assistente na palma da mão</strong>. Vamos te mostrar o essencial pra começar.</p>
          <Dots />
          <button className="onboarding-next" onClick={() => setStep(1)}>
            Próximo <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Step 1 — Slide do papel */}
      {step === 1 && (
        <div className="onboarding-screen">
          <div className={`onboarding-icon ${slide.iconClass}`}>
            <RoleIcon size={44} />
          </div>
          <h2>{slide.title}</h2>
          <p>{slide.subtitle}</p>
          <div className="onboarding-features">
            {slide.features.map((f, i) => {
              const FIcon = f.icon;
              return (
                <div className="onboarding-feature" key={i}>
                  <div className={`onboarding-feature-icon ${role === 'marketing' ? 'onboarding-fi-mkt' : ''}`}><FIcon size={18} /></div>
                  <div>
                    <strong>{f.title}</strong>
                    <span>{f.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Dots />
          <button
            className={`onboarding-next ${needSegment ? '' : 'onboarding-finish'}`}
            onClick={() => needSegment ? setStep(2) : handleFinish()}
          >
            {needSegment ? <>Próximo <ChevronRight size={18} /></> : <>Começar <Sparkles size={16} /></>}
          </button>
        </div>
      )}

      {/* Step 2 — Segmento (fallback, só se não veio do cadastro) */}
      {step === 2 && needSegment && (
        <div className="onboarding-screen">
          <div className="onboarding-icon">
            <Factory size={44} />
          </div>
          <h2>Qual é o seu segmento?</h2>
          <p>Vamos personalizar objeções, roteiros e notícias para o seu mercado.</p>
          <div className="onboarding-segments">
            {SEGMENT_OPTIONS.map(s => (
              <button
                key={s.value}
                className={`onboarding-segment ${segment === s.value ? 'active' : ''}`}
                onClick={() => setSegment(s.value)}
              >
                <span className="onboarding-segment-emoji">{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          <Dots />
          <button className="onboarding-next onboarding-finish" onClick={handleFinish}>
            Começar <Sparkles size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

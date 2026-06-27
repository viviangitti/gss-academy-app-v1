import { useState } from 'react';
import {
  Sparkles, Target, Dumbbell, FileText,
  PenLine, BarChart2, BookOpen, Factory, ChevronRight, Zap, MessageSquare, ImageDown,
  TrendingUp, Megaphone, LayoutGrid,
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

interface Props {
  onComplete: () => void;
}

type AccessType = 'vendas' | 'marketing' | 'ambos';

export default function Onboarding({ onComplete }: Props) {
  const existing = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });

  const [step, setStep] = useState(0);

  // Pre-fill from profile (set during Auth signup step 2)
  const [segment, setSegment] = useState<Segment>(existing.segment || '');
  const [accessType, setAccessType] = useState<AccessType>((existing.userAccessType as AccessType) || 'vendas');

  // If profile already has both segment and accessType, skip steps 3 & 4
  const alreadyConfigured = !!(existing.segment && existing.userAccessType);

  // Total dots depend on whether config steps are needed
  const TOTAL_STEPS = alreadyConfigured ? 3 : 5;

  const handleFinish = () => {
    const profile: UserProfile = {
      ...existing,
      segment: segment || existing.segment,
      userAccessType: accessType,
    };
    saveData(KEYS.PROFILE, profile);
    localStorage.setItem('gss_onboarding_done', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('gss_onboarding_done', 'true');
    onComplete();
  };

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
          <p>Seu copiloto de IA para <strong>Vendas</strong> e <strong>Marketing</strong>. Tudo que você precisa para vender mais e comunicar melhor.</p>
          <div className="onboarding-dots">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>
          <button className="onboarding-next" onClick={() => setStep(1)}>
            Próximo <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Step 1 — Vendas */}
      {step === 1 && (
        <div className="onboarding-screen">
          <div className="onboarding-icon onboarding-icon-vendas">
            <Target size={44} />
          </div>
          <h2>Ferramentas para vender mais</h2>
          <p>Tudo que um vendedor de alta performance precisa, na palma da mão.</p>
          <div className="onboarding-features">
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon"><Dumbbell size={18} /></div>
              <div>
                <strong>Treino com IA</strong>
                <span>Simulação, pré-reunião e análise pós-venda</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon"><MessageSquare size={18} /></div>
              <div>
                <strong>Objeções & Roteiros</strong>
                <span>Respostas prontas para cada situação</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon"><FileText size={18} /></div>
              <div>
                <strong>Condições Comerciais</strong>
                <span>Ofertas do mês com card visual para compartilhar</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon"><Zap size={18} /></div>
              <div>
                <strong>IA Coach & Gatilhos</strong>
                <span>Coaching pessoal e gatilhos de fechamento</span>
              </div>
            </div>
          </div>
          <div className="onboarding-dots">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>
          <button className="onboarding-next" onClick={() => setStep(2)}>
            Próximo <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Step 2 — Marketing */}
      {step === 2 && (
        <div className="onboarding-screen">
          <div className="onboarding-icon onboarding-icon-mkt">
            <PenLine size={44} />
          </div>
          <h2>Marketing com IA integrada</h2>
          <p>Crie, analise e refine suas campanhas em segundos com inteligência artificial.</p>
          <div className="onboarding-features">
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon onboarding-fi-mkt"><PenLine size={18} /></div>
              <div>
                <strong>Gerador de Copy</strong>
                <span>3 versões prontas para posts, Stories e WhatsApp</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon onboarding-fi-mkt"><BarChart2 size={18} /></div>
              <div>
                <strong>Análise de Campanhas</strong>
                <span>Envie um print — IA gera insights e recomendações</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon onboarding-fi-mkt"><BookOpen size={18} /></div>
              <div>
                <strong>Guia de Marca</strong>
                <span>Tom de voz e identidade sempre acessíveis</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon onboarding-fi-mkt"><ImageDown size={18} /></div>
              <div>
                <strong>Cards Visuais</strong>
                <span>Gere e compartilhe cards de ofertas no WhatsApp</span>
              </div>
            </div>
          </div>
          <div className="onboarding-dots">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>
          <button
            className={`onboarding-next ${alreadyConfigured ? 'onboarding-finish' : ''}`}
            onClick={() => alreadyConfigured ? handleFinish() : setStep(3)}
          >
            {alreadyConfigured ? <>Começar <Sparkles size={16} /></> : <>Próximo <ChevronRight size={18} /></>}
          </button>
        </div>
      )}

      {/* Step 3 — Escolha de perfil */}
      {step === 3 && (
        <div className="onboarding-screen">
          <div className="onboarding-icon">
            <LayoutGrid size={44} />
          </div>
          <h2>Qual é o seu perfil?</h2>
          <p>Vamos configurar o app para mostrar as ferramentas certas para você.</p>

          <div className="onboarding-roles">
            <button
              className={`onboarding-role ${accessType === 'vendas' ? 'active' : ''}`}
              onClick={() => setAccessType('vendas')}
            >
              <div className="onboarding-role-icon onboarding-ri-vendas">
                <TrendingUp size={22} />
              </div>
              <strong>Vendas</strong>
              <span>Treino, objeções, condições e coach de IA</span>
            </button>

            <button
              className={`onboarding-role ${accessType === 'marketing' ? 'active' : ''}`}
              onClick={() => setAccessType('marketing')}
            >
              <div className="onboarding-role-icon onboarding-ri-mkt">
                <Megaphone size={22} />
              </div>
              <strong>Marketing</strong>
              <span>Copy, análise de campanhas e guia de marca</span>
            </button>

            <button
              className={`onboarding-role ${accessType === 'ambos' ? 'active' : ''}`}
              onClick={() => setAccessType('ambos')}
            >
              <div className="onboarding-role-icon onboarding-ri-ambos">
                <Sparkles size={22} />
              </div>
              <strong>Vendas & Marketing</strong>
              <span>Acesso completo a todas as ferramentas</span>
            </button>
          </div>

          <div className="onboarding-dots">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>
          <button className="onboarding-next" onClick={() => setStep(4)}>
            Próximo <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Step 4 — Segmento */}
      {step === 4 && (
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

          <div className="onboarding-dots">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>

          <button className="onboarding-next onboarding-finish" onClick={handleFinish}>
            Começar <Sparkles size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

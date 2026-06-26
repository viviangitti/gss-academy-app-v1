export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imagePreview?: string;   // data URL — only for images
  attachmentName?: string; // filename shown in bubble (images & PDFs)
  attachmentMime?: string; // e.g. 'application/pdf' | 'image/jpeg'
}

export type Segment =
  | 'farmaceutico'
  | 'automotivo'
  | 'automotivo_luxo'
  | 'tecnologia'
  | 'varejo'
  | 'imobiliario'
  | 'financeiro'
  | 'industria'
  | 'saude'
  | 'educacao'
  | 'servicos'
  | 'agro'
  | 'energia'
  | 'bebidas_alcoolicas'
  | 'bebidas_alcoolicas_vinho'
  | '';

export const SEGMENTS: { value: Segment; label: string }[] = [
  { value: '', label: 'Selecione seu segmento' },
  { value: 'bebidas_alcoolicas', label: 'Bebidas Alcoólicas - Geral' },
  { value: 'bebidas_alcoolicas_vinho', label: 'Bebidas Alcoólicas - Vinho' },
  { value: 'farmaceutico', label: 'Farmacêutico' },
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'automotivo_luxo', label: 'Automotivo de Luxo' },
  { value: 'tecnologia', label: 'Tecnologia / Software' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'imobiliario', label: 'Imobiliário' },
  { value: 'financeiro', label: 'Financeiro / Seguros' },
  { value: 'industria', label: 'Indústria / Manufatura' },
  { value: 'saude', label: 'Saúde / Estética' },
  { value: 'educacao', label: 'Educação' },
  { value: 'servicos', label: 'Serviços / Consultoria' },
  { value: 'agro', label: 'Agronegócio' },
  { value: 'energia', label: 'Energia / Sustentabilidade' },
];

export interface GoalItem {
  label: string;   // ex: "Financiamento", "Acessórios", "Seguro"
  target: number;  // valor mensal em R$
  icon?: string;   // emoji opcional
}

export interface UserProfile {
  name: string;
  role: string;
  company: string;
  segment: Segment;
  monthlyGoal?: number;             // meta principal (ex: vendas de carros / faturamento)
  /** @deprecated use customGoals */
  monthlyGoalFinancing?: number;
  /** @deprecated use customGoals */
  monthlyGoalAccessories?: number;
  customGoals?: GoalItem[];         // metas adicionais modulares (todos os segmentos)
  email?: string;
  teamId?: string | null;
  isAdmin?: boolean;
  isGestor?: boolean;          // gestor de equipe — vê o painel do gestor (definido externamente)
  isMarketing?: boolean;
  assistantName?: string;      // nome que o vendedor deu ao assistente de IA
  assistantTone?: 'direto' | 'motivador' | 'tecnico';  // tom de fala do assistente
  introSeen?: boolean;         // já viu a tela de boas-vindas (controle por conta, no Firestore)
  userAccessType?: 'vendas' | 'marketing' | 'ambos';
  priceRange?: PriceRange;        // legado (faixa única) — mantido p/ migração
  priceRanges?: PriceRange[];     // faixas de atuação (multi-seleção)
  uid?: string;
  createdAt?: number;
}

export type PriceRange = 'ate-80k' | '80k-200k' | '200k-500k' | 'acima-500k' | '';

/** Faixas de atuação do usuário. Prefere o array; migra do campo único legado. */
export function getUserPriceRanges(profile: { priceRanges?: PriceRange[]; priceRange?: PriceRange }): PriceRange[] {
  if (Array.isArray(profile.priceRanges)) return profile.priceRanges.filter(Boolean);
  return profile.priceRange ? [profile.priceRange] : [];
}

export interface PriceRangeConfig {
  value: PriceRange;
  label: string;
  description: string;
  icon: string;
  brands: string[];  // typical brands in this range (for display only)
}

export const PRICE_RANGES: PriceRangeConfig[] = [
  {
    value: 'ate-80k',
    label: 'Até R$ 80 mil',
    description: 'Entrada e popular premium',
    icon: '💰',
    brands: ['Jeep', 'VW', 'Toyota', 'Honda', 'Hyundai'],
  },
  {
    value: '80k-200k',
    label: 'R$ 80k – R$ 200k',
    description: 'Premium e SUVs de luxo',
    icon: '💎',
    brands: ['BMW', 'Mercedes', 'Volvo', 'Audi', 'Jeep'],
  },
  {
    value: '200k-500k',
    label: 'R$ 200k – R$ 500k',
    description: 'Ultra premium e importados',
    icon: '👑',
    brands: ['BMW', 'Mercedes', 'Porsche', 'Jaguar', 'Lexus'],
  },
  {
    value: 'acima-500k',
    label: 'Acima de R$ 500k',
    description: 'Supercarros e edições especiais',
    icon: '🚀',
    brands: ['Ferrari', 'Lamborghini', 'Bentley', 'Rolls-Royce'],
  },
];

/** Sugestões de metas adicionais por segmento */
export const SEGMENT_GOAL_PRESETS: Partial<Record<Segment, { label: string; icon: string }[]>> = {
  automotivo: [
    { label: 'Financiamento', icon: '💳' },
    { label: 'Acessórios',    icon: '📦' },
    { label: 'Seguro',        icon: '🛡️' },
    { label: 'Consórcio',     icon: '🤝' },
    { label: 'Seminovos',     icon: '🔄' },
    { label: 'Revisão/Peças', icon: '🔧' },
  ],
  automotivo_luxo: [
    { label: 'Financiamento', icon: '💳' },
    { label: 'Acessórios',    icon: '📦' },
    { label: 'Seguro',        icon: '🛡️' },
    { label: 'Consórcio',     icon: '🤝' },
    { label: 'Blindagem',     icon: '🔒' },
  ],
  farmaceutico: [
    { label: 'OTC / Genérico',    icon: '💊' },
    { label: 'Dermocosméticos',   icon: '✨' },
    { label: 'Suplementos',       icon: '🌿' },
    { label: 'Higiene/Beleza',    icon: '🧴' },
  ],
  imobiliario: [
    { label: 'Financiamentos',  icon: '🏠' },
    { label: 'Permuta',         icon: '🔄' },
    { label: 'Locação',         icon: '🔑' },
  ],
  financeiro: [
    { label: 'Seguro de Vida',  icon: '🛡️' },
    { label: 'Capitalização',   icon: '💰' },
    { label: 'Consórcio',       icon: '🤝' },
    { label: 'Previdência',     icon: '📈' },
  ],
  varejo: [
    { label: 'Cartão Próprio',  icon: '💳' },
    { label: 'Garantia Extendida', icon: '🔒' },
    { label: 'Fidelidade',      icon: '⭐' },
  ],
  tecnologia: [
    { label: 'Implantação',     icon: '⚙️' },
    { label: 'Suporte/SLA',     icon: '🔧' },
    { label: 'Treinamento',     icon: '📚' },
  ],
  saude: [
    { label: 'Pacotes',         icon: '📋' },
    { label: 'Manutenção',      icon: '🔧' },
    { label: 'Plano de Saúde',  icon: '🏥' },
  ],
  agro: [
    { label: 'Defensivos',      icon: '🌱' },
    { label: 'Fertilizantes',   icon: '🧪' },
    { label: 'Maquinário',      icon: '🚜' },
  ],
  energia: [
    { label: 'Manutenção O&M',  icon: '🔧' },
    { label: 'Monitoramento',   icon: '📡' },
    { label: 'Seguro Solar',    icon: '🛡️' },
  ],
};

/** @deprecated kept for backward compat only */
export const AUTOMOTIVE_SEGMENTS: Segment[] = ['automotivo', 'automotivo_luxo'];
export const isAutomotive = (seg: Segment) => AUTOMOTIVE_SEGMENTS.includes(seg);

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export interface Offer {
  id?: string;
  title: string;               // ex: "Feirão de Julho — Juros Zero"
  description: string;         // texto completo para a IA e para o vendedor
  highlights: string[];        // bullets: ["12x sem juros", "Frete grátis", ...]
  pitch: string;               // argumento pronto para usar com o cliente
  validFrom: string;           // "2026-07-01"
  validTo: string;             // "2026-07-31"
  segments: Segment[];         // quais segmentos (vazio = todos)
  active: boolean;
  createdAt?: number;
  createdBy?: string;
}

export interface CompetitorOffer {
  id?: string;
  competitor: string;          // ex: "Ford", "Chevrolet", "Toyota"
  model?: string;              // ex: "Ranger", "Corolla Cross"
  title: string;               // ex: "Ranger — Taxa 0% até julho"
  description: string;         // texto completo da oferta
  legalText?: string;          // texto jurídico copiado do site
  sourceUrl?: string;          // link da oferta no site da concorrência
  highlights: string[];        // ex: ["Taxa 0%", "Emplacamento grátis"]
  ourAdvantages: string[];     // ex: ["Preço R$8k menor", "IPVA pago"]
  validFrom: string;
  validTo: string;
  segments: Segment[];
  priceRanges?: PriceRange[];
  active: boolean;
  createdAt?: number;
  createdBy?: string;
}

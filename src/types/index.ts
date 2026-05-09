export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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

export interface UserProfile {
  name: string;
  role: string;
  company: string;
  segment: Segment;
  monthlyGoal?: number;          // meta de vendas
  monthlyGoalFinancing?: number; // meta de financiamento (só automotivo)
  monthlyGoalAccessories?: number; // meta de acessórios (só automotivo)
  email?: string;
  teamId?: string | null;
  isAdmin?: boolean;
  isControladoria?: boolean;     // acesso especial: só inputa metas
  uid?: string;
  createdAt?: number;
}

/** Segmentos automotivos que têm metas extras (financiamento + acessórios) */
export const AUTOMOTIVE_SEGMENTS: Segment[] = ['automotivo', 'automotivo_luxo'];
export const isAutomotive = (seg: Segment) => AUTOMOTIVE_SEGMENTS.includes(seg);

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

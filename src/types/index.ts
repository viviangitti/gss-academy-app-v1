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
  monthlyGoal?: number;
  email?: string;
  teamId?: string | null;
  isAdmin?: boolean;
  uid?: string;
  createdAt?: number;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

import { useNavigate } from 'react-router-dom';
import { Swords, Zap, Wand2, Mic, TrendingDown, FileEdit, Rocket, BarChart2 } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import './Content.css';

const BASE_ITEMS = [
  { path: '/vendas-perdidas', icon: TrendingDown, label: 'Vendas Perdidas',   desc: 'Registre por que perdeu e aprenda com cada caso', color: '#ef4444' },
  { path: '/pre-reuniao',    icon: Zap,          label: 'Pré-reunião',        desc: 'Prepare-se em 2 minutos antes de cada encontro', color: '#c9a84c' },
  { path: '/coach-mensagem', icon: Wand2,         label: 'Revisar Mensagem',  desc: 'Cole seu WhatsApp ou e-mail e melhore antes de enviar', color: '#10b981' },
  { path: '/analise-reuniao',icon: Mic,           label: 'Pós-reunião',       desc: 'Fale 1 minuto sobre como foi — você recebe o resumo', color: '#8b5cf6' },
  { path: '/treino',         icon: Swords,        label: 'Treino',             desc: 'Pratique objeções como se fosse um cliente real', color: '#f59e0b' },
];

const MARKETING_ITEMS = [
  {
    icon: FileEdit,
    label: 'Revisar Copy',
    desc: 'Cole um anúncio, legenda ou e-mail e a IA avalia tom, clareza e alinhamento com a marca',
    color: '#10b981',
    prefill: 'Vou compartilhar um texto de marketing para você analisar. Avalie:\n1. Alinhamento com identidade de marca\n2. Clareza e objetividade\n3. CTA (chamada para ação)\n4. Tom e linguagem\n\nAguardo o texto:',
  },
  {
    icon: Rocket,
    label: 'Pré-lançamento',
    desc: 'Antes de publicar uma campanha, a IA faz as perguntas certas para você não esquecer nada',
    color: '#c9a84c',
    prefill: 'Vou lançar uma campanha ou ação de marketing. Me faça as perguntas certas para eu estruturar tudo antes de publicar: público-alvo, objetivo, canais, CTA, prazo, verba e possíveis riscos.',
  },
  {
    icon: BarChart2,
    label: 'Pós-campanha',
    desc: 'Registre o que funcionou e o que não funcionou — a IA extrai aprendizados e melhorias',
    color: '#8b5cf6',
    prefill: 'Acabei de encerrar uma campanha ou ação de marketing. Vou descrever o que aconteceu e preciso que você me ajude a extrair aprendizados e sugestões de melhoria para a próxima vez.',
  },
];

// Overrides de label/desc por segmento
const SEGMENT_OVERRIDES: Record<string, Partial<Record<string, { label: string; desc: string }>>> = {
  farmaceutico: {
    '/pre-reuniao':     { label: 'Pré-atendimento',      desc: 'Prepare-se em 2 min antes do turno ou de um atendimento importante' },
    '/analise-reuniao': { label: 'Pós-atendimento',      desc: 'Fale 1 min sobre o atendimento — você recebe os pontos de melhoria' },
    '/vendas-perdidas': { label: 'Atendimentos Perdidos', desc: 'Registre por que o cliente não levou e aprenda com cada caso' },
  },
  varejo: {
    '/pre-reuniao':     { label: 'Pré-atendimento',      desc: 'Prepare-se antes de abordar um cliente importante' },
    '/analise-reuniao': { label: 'Pós-atendimento',      desc: 'Fale 1 min sobre o atendimento — você recebe os pontos de melhoria' },
    '/vendas-perdidas': { label: 'Vendas Perdidas',       desc: 'Registre por que o cliente não comprou e aprenda com cada caso' },
  },
  saude: {
    '/pre-reuniao':     { label: 'Pré-consulta',         desc: 'Prepare-se em 2 min antes de cada consulta ou sessão' },
    '/analise-reuniao': { label: 'Pós-consulta',         desc: 'Fale 1 min sobre a consulta — você vê o que evoluir' },
    '/vendas-perdidas': { label: 'Pacientes Perdidos',   desc: 'Registre por que o paciente não fechou e aprenda com cada caso' },
  },
  educacao: {
    '/pre-reuniao':     { label: 'Pré-apresentação',     desc: 'Prepare-se para reunião com responsável ou candidato' },
    '/analise-reuniao': { label: 'Pós-apresentação',     desc: 'Fale 1 min sobre a apresentação — você recebe os pontos de melhoria' },
    '/vendas-perdidas': { label: 'Matrículas Perdidas',  desc: 'Registre por que o aluno não matriculou e aprenda com cada caso' },
  },
  imobiliario: {
    '/pre-reuniao':     { label: 'Pré-visita',           desc: 'Prepare-se em 2 min antes de cada visita ao imóvel' },
    '/analise-reuniao': { label: 'Pós-visita',           desc: 'Fale 1 min sobre a visita — você vê o que trabalhar' },
    '/vendas-perdidas': { label: 'Negócios Perdidos',    desc: 'Registre por que o cliente não fechou e aprenda com cada caso' },
  },
  automotivo: {
    '/pre-reuniao':     { label: 'Pré-test drive',       desc: 'Prepare-se em 2 min antes de cada test drive ou visita à loja' },
    '/analise-reuniao': { label: 'Pós-test drive',       desc: 'Fale 1 min sobre o test drive — você vê o que trabalhar' },
    '/vendas-perdidas': { label: 'Vendas Perdidas',      desc: 'Registre por que o cliente não fechou e aprenda com cada caso' },
  },
  automotivo_luxo: {
    '/pre-reuniao':     { label: 'Pré-test drive',       desc: 'Prepare-se em 2 min antes de cada test drive ou visita à loja' },
    '/analise-reuniao': { label: 'Pós-test drive',       desc: 'Fale 1 min sobre o test drive — você vê o que trabalhar' },
    '/vendas-perdidas': { label: 'Negócios Perdidos',    desc: 'Registre por que o cliente não fechou e aprenda com cada caso' },
  },
  tecnologia: {
    '/pre-reuniao':     { label: 'Pré-demo',             desc: 'Prepare-se em 2 min antes de cada demo ou call de vendas' },
    '/analise-reuniao': { label: 'Pós-demo',             desc: 'Fale 1 min sobre a demo — você recebe os próximos passos' },
    '/vendas-perdidas': { label: 'Oportunidades Perdidas', desc: 'Registre por que o lead não avançou e aprenda com cada caso' },
  },
  bebidas_alcoolicas: {
    '/pre-reuniao':     { label: 'Pré-visita',           desc: 'Prepare-se em 2 min antes de cada visita ao PDV ou cliente' },
    '/analise-reuniao': { label: 'Pós-visita',           desc: 'Fale 1 min sobre a visita — você recebe o que melhorar' },
    '/vendas-perdidas': { label: 'Visitas Perdidas',     desc: 'Registre PDVs que não fecharam pedido e aprenda com cada caso' },
  },
  bebidas_alcoolicas_vinho: {
    '/pre-reuniao':     { label: 'Pré-degustação',       desc: 'Prepare-se em 2 min antes de cada visita ou degustação' },
    '/analise-reuniao': { label: 'Pós-degustação',       desc: 'Fale 1 min sobre a visita — você recebe o que melhorar' },
    '/vendas-perdidas': { label: 'Vendas Perdidas',      desc: 'Registre por que o cliente não fechou e aprenda com cada caso' },
  },
  agro: {
    '/pre-reuniao':     { label: 'Pré-visita',           desc: 'Prepare-se em 2 min antes de cada visita à propriedade ou cliente' },
    '/analise-reuniao': { label: 'Pós-visita',           desc: 'Fale 1 min sobre a visita — você vê o que evoluir' },
    '/vendas-perdidas': { label: 'Negócios Perdidos',    desc: 'Registre por que o produtor não fechou e aprenda com cada caso' },
  },
  energia: {
    '/pre-reuniao':     { label: 'Pré-visita técnica',   desc: 'Prepare-se em 2 min antes de visita ou proposta técnica' },
    '/analise-reuniao': { label: 'Pós-visita',           desc: 'Fale 1 min sobre a visita — você recebe o que melhorar' },
    '/vendas-perdidas': { label: 'Projetos Perdidos',    desc: 'Registre por que o projeto não foi aprovado e aprenda com cada caso' },
  },
};

export default function TrainingHub() {
  const navigate = useNavigate();
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const overrides = SEGMENT_OVERRIDES[profile.segment] || {};
  const accessType = profile.userAccessType || 'vendas';

  const salesItems = BASE_ITEMS.map(item => ({
    ...item,
    ...(overrides[item.path] || {}),
  }));

  const showSales = accessType !== 'marketing';
  const showMarketing = accessType === 'marketing' || accessType === 'ambos';

  return (
    <div className="content-page">
      {/* Vendas */}
      {showSales && (
        <>
          {showMarketing && <p className="hub-section-label">Vendas</p>}
          <div className="content-grid">
            {salesItems.map(item => (
              <button key={item.path} className="content-item card" onClick={() => navigate(item.path)}>
                <div className="content-icon" style={{ background: `${item.color}15`, color: item.color }}>
                  <item.icon size={22} />
                </div>
                <h4>{item.label}</h4>
                <p>{item.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Marketing */}
      {showMarketing && (
        <>
          {showSales && <p className="hub-section-label hub-section-label--mkt">Marketing</p>}
          <div className="content-grid">
            {MARKETING_ITEMS.map(item => (
              <button
                key={item.label}
                className="content-item card"
                onClick={() => navigate('/ia-coach', { state: { prefill: item.prefill, aiMode: 'marketing' } })}
              >
                <div className="content-icon" style={{ background: `${item.color}15`, color: item.color }}>
                  <item.icon size={22} />
                </div>
                <h4>{item.label}</h4>
                <p>{item.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

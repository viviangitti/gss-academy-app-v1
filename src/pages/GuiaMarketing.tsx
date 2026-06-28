import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ChevronDown, Target, Users, Rocket, CalendarDays, Palette, BarChart3, Sparkles, Wrench, ArrowRight } from 'lucide-react';
import './Home.css';
import './GestaoComercial.css';

interface Aula {
  id: string; titulo: string; tag: string; icon: typeof Target; cor: string;
  ideia: string; passos: string[]; metrica: string;
}

// Guia de performance marketing — vire expert: cada bloco guia a AÇÃO.
const AULAS: Aula[] = [
  {
    id: 'publico', titulo: 'Saiba pra quem você fala', tag: 'Base', icon: Users, cor: '#7c3aed',
    ideia: 'Marketing que fala com todo mundo não fala com ninguém. Defina o público e o momento de compra.',
    passos: [
      'Liste 2-3 perfis reais (ex: primeiro carro, família, troca premium).',
      'Pra cada um: o que ele teme e o que ele deseja no carro.',
      'Fale a língua dele em cada peça — não a sua.',
    ],
    metrica: 'Acompanhe: quais públicos mais respondem (salvam, comentam, chamam no direct).',
  },
  {
    id: 'conteudo', titulo: 'Conteúdo que atrai e converte', tag: 'Conteúdo', icon: Sparkles, cor: '#ec4899',
    ideia: 'Gire entre educar, bastidores, prova social e oferta. Gancho nos 3 primeiros segundos, CTA no fim.',
    passos: [
      'Escolha o pilar da semana (educar / bastidor / prova / oferta).',
      'Abra com uma dor ou pergunta; feche com "me chama 👇".',
      'Reels pra alcance, carrossel pra autoridade, stories pra relacionamento.',
    ],
    metrica: 'Acompanhe: alcance (capa/gancho) e salvamentos (valor do conteúdo).',
  },
  {
    id: 'trafego', titulo: 'Alcance: orgânico e pago', tag: 'Tráfego', icon: Rocket, cor: '#f59e0b',
    ideia: 'Orgânico constrói marca; o impulsionamento certo acelera. Impulsione o que JÁ performou bem.',
    passos: [
      'Poste com consistência (orgânico) antes de pagar.',
      'Impulsione só posts que já tiveram bom engajamento orgânico.',
      'Comece com verba pequena, públicos da região, e leia o resultado em 3-5 dias.',
    ],
    metrica: 'Acompanhe: custo por conversa/lead — não só curtidas.',
  },
  {
    id: 'calendario', titulo: 'Planeje a semana e o mês', tag: 'Ritmo', icon: CalendarDays, cor: '#10b981',
    ideia: 'Consistência vence inspiração. Um calendário simples evita o "o que posto hoje?".',
    passos: [
      'Defina a frequência realista (ex: 4 posts + stories diários).',
      'Encaixe a campanha/condição do mês no calendário.',
      'Deixe 1 dia pra produzir lote de conteúdo da semana.',
    ],
    metrica: 'Acompanhe: % do calendário cumprido na semana.',
  },
  {
    id: 'marca', titulo: 'Marca forte e consistente', tag: 'Marca', icon: Palette, cor: '#0ea5e9',
    ideia: 'Tom de voz, cores e identidade iguais em tudo criam reconhecimento e confiança.',
    passos: [
      'Use o Guia de Marca como referência em toda peça.',
      'Padronize abertura, hashtags e assinatura.',
      'Revise: "isso parece da nossa marca?" antes de publicar.',
    ],
    metrica: 'Acompanhe: crescimento de seguidores e menções à marca.',
  },
  {
    id: 'metricas', titulo: 'Meça o que importa', tag: 'Dados', icon: BarChart3, cor: '#6366f1',
    ideia: 'Vaidade (curtidas) ≠ resultado. Olhe alcance → engajamento → leads → vendas.',
    passos: [
      'Defina 3 números do mês (ex: alcance, leads no direct, vendas atribuídas).',
      'Compare semana a semana, não post a post.',
      'Dobre no que traz lead; corte o que só dá curtida.',
    ],
    metrica: 'Acompanhe: leads gerados e quantos viraram venda (com o time).',
  },
  {
    id: 'campanha', titulo: 'Campanha do mês ponta a ponta', tag: 'Campanha', icon: Target, cor: '#ef4444',
    ideia: 'Toda condição/oferta merece uma campanha pensada: objetivo, peças, canais e medição.',
    passos: [
      'Defina o objetivo (lead, test-drive, giro de estoque).',
      'Monte as peças (copy + criativo) e o calendário de disparos.',
      'No fim, faça o pós-campanha: o que funcionou e o que repetir.',
    ],
    metrica: 'Acompanhe: resultado da campanha vs objetivo definido.',
  },
  {
    id: 'time', titulo: 'Ative o time como criadores', tag: 'Social selling', icon: Megaphone, cor: '#f97316',
    ideia: 'O alcance da loja explode quando os vendedores também postam. Você orquestra, eles criam.',
    passos: [
      'Dê pauta pronta e fácil pro time (o "Conteúdo do Dia").',
      'Reconheça quem posta — engajamento se contagia.',
      'Acompanhe no painel quem está ativo e quem está parado.',
    ],
    metrica: 'Acompanhe: nº de vendedores postando e alcance somado.',
  },
];

// Ferramentas operacionais (as de criar/conferir ficam na Maestria)
const TOOLS = [
  { label: 'Concorrência', desc: 'O que estão fazendo agora', to: '/concorrencia' },
  { label: 'Campanhas e Condições', desc: 'Publicar oferta/condição pro time', to: '/condicoes-admin' },
];

export default function GuiaMarketing() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(AULAS[0].id);

  return (
    <div className="home">
      <div className="gc-hero card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(124,58,237,0.03))', borderColor: 'rgba(124,58,237,0.3)' }}>
        <div className="gc-hero-icon" style={{ background: 'rgba(124,58,237,0.2)', color: '#7c3aed' }}><Megaphone size={24} /></div>
        <div>
          <h2>Guia de Marketing</h2>
          <p>Vire expert em performance — o passo a passo que guia suas ações</p>
        </div>
      </div>

      {AULAS.map(a => {
        const Icon = a.icon;
        const isOpen = open === a.id;
        return (
          <div key={a.id} className={`gc-aula card ${isOpen ? 'open' : ''}`}>
            <button className="gc-aula-head" onClick={() => setOpen(isOpen ? null : a.id)}>
              <div className="gc-aula-icon" style={{ background: `${a.cor}22`, color: a.cor }}><Icon size={18} /></div>
              <div className="gc-aula-titles">
                <strong>{a.titulo}</strong>
                <span className="gc-tag">{a.tag}</span>
              </div>
              <ChevronDown size={18} className="gc-chevron" />
            </button>
            {isOpen && (
              <div className="gc-aula-body">
                <p className="gc-ideia">{a.ideia}</p>
                <p className="gc-label">Como aplicar</p>
                <ol className="gc-passos">{a.passos.map((p, i) => <li key={i}>{p}</li>)}</ol>
                <div className="gc-frase" style={{ borderColor: a.cor }}>📊 {a.metrica}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Ferramentas — executar agora */}
      <div className="day-section" style={{ marginTop: 8 }}>
        <div className="day-section-header"><h3 className="section-title"><Wrench size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Ferramentas pra executar</h3></div>
        {TOOLS.map(t => (
          <button key={t.to} className="home-content-card card" onClick={() => navigate(t.to)}>
            <div className="home-content-icon mae-guia-icon"><Sparkles size={18} /></div>
            <div className="home-content-text">
              <strong>{t.label}</strong>
              <span>{t.desc}</span>
            </div>
            <ArrowRight size={16} className="home-train-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Users, Sun, CalendarDays, Trophy, Repeat, ArrowRight } from 'lucide-react';
import './Home.css';
import './RotinasGestor.css';

interface Ritual {
  titulo: string;
  tempo: string;
  icon: typeof Sun;
  cor: string;
  itens: string[];
  atalho?: { label: string; to: string };
}

const RITUAIS: Ritual[] = [
  {
    titulo: 'Ritual diário', tempo: '5–15 min', icon: Sun, cor: '#f59e0b',
    itens: [
      'Bom dia com foco: alinhe a meta do dia e 1 prioridade por vendedor.',
      'Olhe o painel: quem está atrás da meta? quem tem follow-up atrasado?',
      'Dê 1 reconhecimento público (venda, esforço ou atitude).',
    ],
  },
  {
    titulo: 'Ritual semanal', tempo: '30–45 min', icon: CalendarDays, cor: '#818cf8',
    itens: [
      'Abra com o Resumo da semana do time.',
      'Revise o Mapa de gaps: qual o gap nº1? defina 1 treino pra ele.',
      'Faça 1 simulação coletiva de uma objeção que está pegando.',
      'Combine o foco da próxima semana — claro e medível.',
    ],
    atalho: { label: 'Abrir Painel do Gestor', to: '/painel-gestor' },
  },
  {
    titulo: 'Ritual mensal', tempo: '~1 hora', icon: Trophy, cor: '#34d399',
    itens: [
      'Feche metas por vendedor e por área de negócio.',
      'Raio X de cada um: pontos fortes e gaps → plano individual.',
      'Celebre o destaque do mês — torne visível pra todos.',
    ],
  },
];

export default function RotinasGestor() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="rg-hero card">
        <div className="rg-hero-icon"><Users size={24} /></div>
        <div>
          <h2>Rotinas & rituais do gestor</h2>
          <p>Cadência simples pra você aplicar com o time toda semana</p>
        </div>
      </div>

      {RITUAIS.map(r => {
        const Icon = r.icon;
        return (
          <div key={r.titulo} className="rg-block card">
            <div className="rg-block-head">
              <div className="rg-block-icon" style={{ background: `${r.cor}22`, color: r.cor }}><Icon size={18} /></div>
              <div className="rg-block-titles">
                <strong>{r.titulo}</strong>
                <span>{r.tempo}</span>
              </div>
            </div>
            <ul className="rg-list">
              {r.itens.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
            {r.atalho && (
              <button className="rg-shortcut" onClick={() => navigate(r.atalho!.to)}>
                {r.atalho.label} <ArrowRight size={15} />
              </button>
            )}
          </div>
        );
      })}

      <div className="rg-block card rg-principios">
        <div className="rg-block-head">
          <div className="rg-block-icon" style={{ background: 'rgba(201,168,76,0.16)', color: 'var(--accent)' }}><Repeat size={18} /></div>
          <div className="rg-block-titles">
            <strong>Os 3 Rs da alta performance</strong>
            <span>O que sustenta tudo isso</span>
          </div>
        </div>
        <ul className="rg-list">
          <li><strong>Ritmo</strong> — cadência constante. Some um dia e o time relaxa.</li>
          <li><strong>Rotina</strong> — processos diários simples que não dependem de inspiração.</li>
          <li><strong>Ritual</strong> — momentos coletivos que criam cultura e pertencimento.</li>
        </ul>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { GraduationCap, ChevronDown, Target, Repeat, Users, BarChart3, Award, UserPlus, MessageSquare } from 'lucide-react';
import './Home.css';
import './GestaoComercial.css';

interface Aula {
  id: string;
  titulo: string;
  tag: string;
  icon: typeof Target;
  cor: string;
  ideia: string;
  passos: string[];
  frase: string;
}

// Aulas objetivas de gestão comercial — inspiradas em quem vive disso na prática
// (cultura pró-venda, ritmo e reconhecimento). Tudo aplicável já na próxima semana.
const AULAS: Aula[] = [
  {
    id: 'cultura', titulo: 'Vendas é o motor — e começa em você', tag: 'Cultura', icon: Repeat, cor: '#f59e0b',
    ideia: 'A área comercial é o coração da operação. O time copia a energia do líder: se você respira meta e cliente, eles também respiram.',
    passos: [
      'Comece o dia falando de venda — não de problema.',
      'Esteja perto: acompanhe um atendimento, entre numa negociação difícil.',
      'Seja o exemplo do padrão que você cobra.',
    ],
    frase: 'Sem venda, não existe empresa.',
  },
  {
    id: 'reuniao', titulo: 'Reunião comercial de 15 minutos', tag: 'Ritual', icon: Repeat, cor: '#818cf8',
    ideia: 'Reunião longa mata energia. A diária curta alinha o foco e cria ritmo no time.',
    passos: [
      'De pé, no mesmo horário, no máximo 15 min — todo dia.',
      'Cada um diz: o que fechei ontem, o que vou fechar hoje, onde travei.',
      'Feche com 1 prioridade clara pro dia.',
    ],
    frase: 'Ritmo constante vale mais que reunião perfeita.',
  },
  {
    id: 'um-a-um', titulo: '1:1 com cada vendedor', tag: 'Coaching', icon: Users, cor: '#34d399',
    ideia: 'É no individual que o vendedor evolui. Cobrança em grupo humilha; no 1:1, desenvolve.',
    passos: [
      'A cada 15 dias, 20 min com cada um.',
      'Olhe o Raio-X dele: 1 ponto forte pra elogiar, 1 gap pra trabalhar.',
      'Saia com 1 combinado medível até o próximo encontro.',
    ],
    frase: 'Elogie em público, corrija no particular.',
  },
  {
    id: 'indicadores', titulo: 'Cobre os números certos', tag: 'Gestão', icon: BarChart3, cor: '#60a5fa',
    ideia: 'Não precisa de planilha gigante. Três números dizem quase tudo do seu time.',
    passos: [
      'Atendimentos: quantos clientes cada um tocou.',
      'Conversão: quantos viraram venda.',
      'Ticket e mix: valor e o que está saindo.',
      'Olhe todo dia e aja na hora — não espere fechar o mês.',
    ],
    frase: 'O que não é medido vira desculpa.',
  },
  {
    id: 'reconhecimento', titulo: 'Reconhecimento todo dia', tag: 'Cultura', icon: Award, cor: '#f472b6',
    ideia: 'Reconhecer é o combustível mais barato e o mais esquecido. Gente repete o que é celebrado.',
    passos: [
      'Todo dia, 1 reconhecimento público (venda, esforço ou atitude).',
      'Seja específico: diga exatamente o que a pessoa fez bem.',
      'Crie um destaque da semana visível pra todos.',
    ],
    frase: 'Quem é reconhecido, repete. Quem é ignorado, desiste.',
  },
  {
    id: 'meta', titulo: 'Meta clara, simples e visível', tag: 'Gestão', icon: Target, cor: '#fbbf24',
    ideia: 'Meta confusa não engaja. Cada um tem que saber de cabeça onde está e quanto falta.',
    passos: [
      'Quebre a meta do mês em meta da semana e do dia.',
      'Deixe o placar à vista — mural, grupo ou tela.',
      'Conecte a meta ao ganho da pessoa: meritocracia clara.',
    ],
    frase: 'Se o time não sabe o placar, não está no jogo.',
  },
  {
    id: 'rampa', titulo: 'Os primeiros 90 dias do novo vendedor', tag: 'Time', icon: UserPlus, cor: '#22d3ee',
    ideia: 'Vendedor novo que é largado, afunda. O acompanhamento de perto no começo define quem fica.',
    passos: [
      'Semana 1: produto, processo e sombra de um veterano.',
      'Até 30 dias: metas menores e feedback diário.',
      '30 a 90 dias: 1:1 semanal e primeiras metas cheias.',
    ],
    frase: 'Contratar é fácil; rampar bem é o que segura talento.',
  },
  {
    id: 'feedback', titulo: 'Feedback duro sem desmotivar', tag: 'Coaching', icon: MessageSquare, cor: '#a78bfa',
    ideia: 'Firmeza no padrão, respeito pela pessoa. Dá pra cobrar forte sem quebrar a confiança.',
    passos: [
      'Fale do comportamento e do resultado — nunca do caráter.',
      'Mostre o impacto e o caminho, não só o erro.',
      'Termine com confiança: "sei que você dá conta".',
    ],
    frase: 'Exigente com o padrão, gentil com a pessoa.',
  },
];

export default function GestaoComercial() {
  const [open, setOpen] = useState<string | null>(AULAS[0].id);

  return (
    <div className="home">
      <div className="gc-hero card">
        <div className="gc-hero-icon"><GraduationCap size={24} /></div>
        <div>
          <h2>Gestão comercial</h2>
          <p>Aulas curtas e direto ao ponto pra liderar o time — aplique já na próxima semana</p>
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
                <div className="gc-frase" style={{ borderColor: a.cor }}>“{a.frase}”</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

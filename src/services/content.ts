import type { Segment } from '../types';

export type Stage = 'prospeccao' | 'qualificacao' | 'apresentacao' | 'negociacao' | 'fechamento';

export const STAGES: { value: Stage | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'prospeccao', label: 'Prospecção' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'apresentacao', label: 'Apresentação' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'fechamento', label: 'Fechamento' },
];

export interface Objection {
  id: string;
  objection: string;
  responses: string[];
  quickResponses?: string[];
  commonMistake?: string;
  stage?: Stage;
  segment?: Segment | 'geral';
}

export interface Script {
  id: string;
  title: string;
  context: string;
  script: string;
  segment?: Segment | 'geral';
}

export interface Technique {
  id: string;
  name: string;
  icon: string;
  summary: string;
  steps: string[];
  whenToUse: string;
}

export interface UrgencyTrigger {
  id: string;
  category: string;
  icon: string;
  phrases: string[];
}

// ==================== OBJEÇÕES ====================

const GENERAL_OBJECTIONS: Objection[] = [
  {
    id: 'g1', objection: '"Está muito caro"', segment: 'geral',
    quickResponses: [
      'Caro é perder R$ X por mês sem essa solução.',
      'Quanto te custa NÃO resolver esse problema?',
      'Nosso cliente Y achava o mesmo. Hoje o retorno dele é 3x.',
    ],
    commonMistake: 'Dar desconto imediato sem explorar o valor. Isso desvaloriza seu produto e treina o cliente a sempre pedir desconto.',
    responses: [
      'Entendo sua preocupação com o investimento. Vamos olhar pelo lado do retorno: quanto você perde hoje sem essa solução? O custo de não agir geralmente é maior que o investimento.',
      'Caro comparado a quê? Vamos comparar não o preço, mas o valor entregue. Nosso cliente X tinha a mesma percepção e hoje tem retorno de 3x o investimento.',
      'Posso ajustar as condições de pagamento para caber melhor no seu orçamento. O importante é não perder o timing da oportunidade.',
    ],
  },
  {
    id: 'g1-prosp', objection: '"Está muito caro"', segment: 'geral', stage: 'prospeccao',
    quickResponses: [
      'Ainda nem mostrei o valor. Me dá 5 minutos?',
      'Você está comparando com o quê exatamente?',
    ],
    responses: [
      'Entendo, mas você está avaliando o preço antes de ver o retorno. Me dá 5 minutos para mostrar o que nossos clientes estão conseguindo?',
    ],
  },
  {
    id: 'g1-neg', objection: '"Está muito caro"', segment: 'geral', stage: 'negociacao',
    quickResponses: [
      'O valor reflete o resultado. Posso ajustar as condições.',
      'Qual valor faria sentido considerando o retorno?',
    ],
    responses: [
      'Nessa fase você já viu o valor que entregamos. O preço reflete esse resultado. Posso ajustar condições de pagamento para viabilizar.',
    ],
  },
  {
    id: 'g2', objection: '"Vou pensar"', segment: 'geral',
    quickResponses: [
      'Pensar sobre qual ponto especificamente?',
      'O que falta para você decidir hoje?',
      'Posso te ajudar a pensar — qual é a maior dúvida?',
    ],
    commonMistake: 'Aceitar passivamente e ir embora. "Vou pensar" geralmente significa que algum ponto não ficou claro ou existe uma objeção escondida.',
    responses: [
      'Perfeito, pensar é importante. Para eu te ajudar a pensar melhor: qual é o ponto principal que te gera dúvida? Assim posso enviar informações focadas.',
      'Entendo! Normalmente quando alguém diz "vou pensar" é porque algum ponto não ficou 100% claro. O que posso esclarecer agora?',
      'Claro! Vamos agendar uma conversa rápida de 15 min na quinta para eu tirar qualquer dúvida que surgir? Assim você decide com mais segurança.',
    ],
  },
  {
    id: 'g2-prosp', objection: '"Vou pensar"', segment: 'geral', stage: 'prospeccao',
    quickResponses: [
      'Claro! O que te chamou mais atenção até aqui?',
      'Posso enviar um material resumido para ajudar na reflexão?',
    ],
    responses: [
      'Entendo, estamos no início. O que te chamou mais atenção até aqui? Posso enviar um material focado para te ajudar a decidir se vale uma conversa mais profunda.',
    ],
  },
  {
    id: 'g3', objection: '"Já tenho fornecedor"', segment: 'geral',
    quickResponses: [
      'Ótimo! Está 100% satisfeito ou tem pontos a melhorar?',
      'Não é trocar, é comparar. 15 minutos resolvem.',
      'Ter referência é bom. Que tal uma segunda opinião?',
    ],
    commonMistake: 'Falar mal do concorrente. Isso gera desconfiança e faz o cliente defender o fornecedor atual.',
    responses: [
      'Ótimo, isso mostra que você valoriza esse tipo de solução. Muitos dos nossos melhores clientes já tinham fornecedor. A pergunta é: você está 100% satisfeito ou há pontos que gostaria de melhorar?',
      'Não estou pedindo para trocar, mas sim para comparar. Se em 15 minutos eu mostrar algo que complemente o que você já tem, valeu a pena. Se não, você confirma que fez a melhor escolha.',
      'Ter referência é ótimo! Nosso diferencial está em [X]. Que tal uma demonstração sem compromisso para você ter uma segunda opinião?',
    ],
  },
  {
    id: 'g4', objection: '"Não é o momento"', segment: 'geral',
    quickResponses: [
      'Quando seria? Seus concorrentes estão agindo agora.',
      'O custo de esperar é maior que o de agir.',
      'Que tal um piloto pequeno para não perder a janela?',
    ],
    commonMistake: 'Insistir agressivamente ou desistir rápido demais. O ideal é plantar uma semente e agendar retorno.',
    responses: [
      'Entendo que o timing é importante. Qual seria o momento ideal? Pergunto porque muitos clientes que esperaram acabaram perdendo [vantagem específica].',
      'Quando seria o melhor momento para você? Enquanto isso, posso te enviar um material que vai te ajudar a se preparar para quando chegar a hora.',
      'O mercado não espera o momento perfeito. Seus concorrentes estão se movendo agora. Que tal começarmos com um piloto pequeno para não perder a janela?',
    ],
  },
  {
    id: 'g5', objection: '"Preciso falar com meu sócio/diretor"', segment: 'geral',
    quickResponses: [
      'Posso preparar um resumo de 1 página para ele.',
      'Que tal uma ligação rápida com ele? 15 minutos.',
      'Quais critérios ele avalia? Preparo os argumentos.',
    ],
    commonMistake: 'Não pedir para falar direto com o decisor. Você fica dependendo de alguém vender por você.',
    responses: [
      'Claro! Para facilitar a conversa dele, posso preparar um resumo executivo de 1 página com os pontos principais e o retorno esperado. O que acha?',
      'Perfeito. Que tal agendarmos uma ligação de 15 minutos com ele? Assim tiro as dúvidas dele diretamente e agilizamos o processo.',
      'Entendo. Quais são os critérios que ele costuma avaliar? Assim posso preparar os argumentos certos para vocês dois.',
    ],
  },
  {
    id: 'g6', objection: '"Me envia uma proposta por email"', segment: 'geral',
    quickResponses: [
      'Envio! Mas 10 min juntos valem mais que um email.',
      '80% das propostas se perdem no email. Revisamos juntos?',
      'Posso fazer 2 perguntas antes para personalizar?',
    ],
    commonMistake: 'Enviar a proposta e esperar o cliente responder. Proposta sem apresentação é documento perdido.',
    responses: [
      'Envio sim! Mas antes, quero garantir que a proposta esteja 100% personalizada. Posso fazer mais 2 perguntas rápidas sobre suas necessidades?',
      'Claro! Vou enviar hoje. Posso te ligar quinta às 10h para passar pelos pontos principais juntos? Email sozinho não transmite todo o valor.',
      'Envio agora. Mas por experiência, propostas por email têm 80% de chance de se perder na caixa de entrada. Que tal 10 minutos amanhã para revisarmos juntos?',
    ],
  },
  {
    id: 'g7', objection: '"O concorrente é mais barato"', segment: 'geral',
    quickResponses: [
      'Mais barato com as mesmas entregas? Vamos comparar.',
      'O barato pode sair caro. Pergunte sobre o resultado.',
      'Preço menor = escopo menor. Quer ver lado a lado?',
    ],
    commonMistake: 'Entrar em guerra de preço. Você nunca vai ganhar competindo só por preço — compete por valor.',
    responses: [
      'É uma comparação justa. Mas você está comparando exatamente as mesmas entregas? Geralmente o mais barato não inclui [diferencial]. No final, o barato pode sair caro.',
      'Preço menor muitas vezes significa escopo menor. Vamos colocar lado a lado o que cada um entrega? Tenho certeza que o custo-benefício vai te surpreender.',
      'Nosso preço reflete o resultado que entregamos. O cliente X estava com o concorrente mais barato e migrou para nós porque o resultado não vinha. Posso conectar vocês para conversar.',
    ],
  },
  {
    id: 'g8', objection: '"Não tenho orçamento"', segment: 'geral',
    quickResponses: [
      'Se pagasse em 3 meses, realocaria orçamento?',
      'Quanto esse problema te custa hoje? Compare.',
      'Comece pequeno. O resultado paga a expansão.',
    ],
    commonMistake: 'Aceitar que não tem orçamento e ir embora. Muitas vezes "não tenho orçamento" significa "não vi valor suficiente para priorizar".',
    responses: [
      'Entendo. Mas me diz: se o investimento se pagasse em 3 meses, faria sentido realocar orçamento? Vamos olhar o retorno antes de decidir.',
      'Orçamento é prioridade. A pergunta é: quanto esse problema te custa hoje? Muitas vezes o "não investir" sai mais caro que o investimento.',
      'Podemos começar com um plano menor e escalar conforme os resultados aparecem. Assim o próprio resultado paga a expansão.',
    ],
  },
  {
    id: 'g9', objection: '"Preciso pensar melhor sobre isso"', segment: 'geral',
    quickResponses: [
      'O que especificamente te deixa em dúvida?',
      'Posso esclarecer alguma parte agora?',
      'Que tal marcarmos 10 minutos amanhã para finalizar?',
    ],
    commonMistake: 'Deixar o cliente ir sem agendar um próximo passo concreto com data e hora.',
    responses: [
      'Claro! Para eu te ajudar a pensar melhor, qual é a parte que ainda não ficou 100% clara? Assim posso te enviar as informações focadas.',
      'Entendo. Só para garantir: posso te mandar um resumo dos pontos principais para ajudar a decisão? E marco 10 minutos amanhã para concluirmos?',
    ],
  },
  {
    id: 'g10', objection: '"Seu produto não tem [feature específica]"', segment: 'geral',
    quickResponses: [
      'O que você precisa resolver com essa feature?',
      'Temos uma forma diferente de resolver isso.',
      'Vamos olhar o todo, não uma função isolada.',
    ],
    commonMistake: 'Prometer o que não tem só para fechar. Isso volta como problema pós-venda.',
    responses: [
      'Me conta mais: o que você precisa resolver com essa funcionalidade? Muitas vezes temos uma forma diferente (e melhor) de chegar no mesmo resultado.',
      'Essa funcionalidade específica está no nosso roadmap. Mas antes de decidir por ela isoladamente, vamos olhar o conjunto — o que importa é o resultado final.',
    ],
  },
  {
    id: 'g11', objection: '"Já tentei algo parecido e não funcionou"', segment: 'geral',
    quickResponses: [
      'O que exatamente não funcionou da última vez?',
      'Nosso diferencial é justamente [X].',
      'Te mostro um case de alguém que disse o mesmo e hoje tem resultado.',
    ],
    commonMistake: 'Ignorar a experiência anterior. Você precisa entender o que falhou para não prometer a mesma coisa.',
    responses: [
      'Entendo perfeitamente. Me conta: o que especificamente não funcionou? Assim consigo te mostrar em que somos diferentes e se faz sentido tentar de novo.',
      'Frustração com tentativa anterior é comum. Mas há diferenças importantes no nosso método: [X, Y, Z]. Posso te conectar com um cliente que passou pela mesma situação.',
    ],
  },
  {
    id: 'g12', objection: '"Me liga daqui a 6 meses"', segment: 'geral',
    quickResponses: [
      'O que muda em 6 meses para viabilizar?',
      'Vou te mandar conteúdo útil até lá.',
      'Posso reservar sua condição atual por 30 dias?',
    ],
    commonMistake: 'Sumir 6 meses e aparecer de novo do zero. Mantenha contato útil (sem pressão) nesse período.',
    responses: [
      'Combinado. Só para eu entender: o que você espera que mude em 6 meses? Assim consigo te ajudar a chegar lá mais rápido.',
      'Posso te mandar conteúdo útil sobre o tema nesse período, sem pressão. Quando chegar a hora, você já estará informado e podemos fechar rápido.',
    ],
  },
  {
    id: 'g13', objection: '"Preciso de descontos maiores"', segment: 'geral',
    quickResponses: [
      'Qual valor faz esse negócio acontecer hoje?',
      'Posso trocar preço por condições melhores.',
      'Desconto maior implica escopo menor. Prefere?',
    ],
    commonMistake: 'Ceder desconto sem contrapartida. Cada ponto de desconto precisa vir com algo em troca (volume, prazo, exclusividade).',
    responses: [
      'Entendo. Antes de falarmos de desconto: qual valor exato faz esse negócio acontecer hoje? Prefiro fechar com condições criativas do que só baixar preço.',
      'Posso ajustar as condições: mais prazo para pagamento, entrega parcelada, bônus de implementação. O que ajuda mais: preço menor ou condições melhores?',
    ],
  },
  {
    id: 'g14', objection: '"Minha equipe não vai aceitar mudança"', segment: 'geral',
    quickResponses: [
      'Temos onboarding que reduz a resistência.',
      'A equipe sofre mais com o problema atual.',
      'Posso falar com os usuários-chave?',
    ],
    commonMistake: 'Tratar resistência à mudança como barreira técnica. É emocional — precisa de comunicação e envolvimento, não só treinamento.',
    responses: [
      'Resistência à mudança é natural. Temos um programa de onboarding que reduz essa barreira: envolvemos os usuários-chave desde o início e a adoção fica acima de 80% em 30 dias.',
      'A equipe já sofre com o problema atual — a diferença é que ela se acostumou. Posso conversar com os usuários-chave para entender o contexto e criar uma transição mais suave?',
    ],
  },
  {
    id: 'g15', objection: '"Estamos em um momento de corte de custos"', segment: 'geral',
    quickResponses: [
      'Exatamente por isso vale a conversa.',
      'Nossa solução reduz custos em [X].',
      'Podemos estruturar como investimento com retorno rápido.',
    ],
    commonMistake: 'Ir embora na primeira objeção. Momento de corte de custos é exatamente quando soluções que geram economia são mais atraentes.',
    responses: [
      'Entendo o momento. Paradoxalmente, é o cenário ideal para nós: nossa solução reduz custos em [X%] e o retorno vem no [prazo]. Posso te mostrar a análise?',
      'Se conseguirmos provar que o investimento gera economia maior que o próprio custo em 6 meses, faz sentido continuarmos essa conversa?',
    ],
  },
];

const SEGMENT_OBJECTIONS: Record<string, Objection[]> = {
  farmaceutico: [
    { id: 'f1', objection: '"Não temos aprovação regulatória para trocar"', segment: 'farmaceutico',
      quickResponses: ['Nosso time acompanha todo o processo regulatório.', 'Comece agora para estar pronto quando a janela abrir.'],
      responses: [
        'Entendo a questão regulatória. Nosso time de assuntos regulatórios pode acompanhar todo o processo de adequação. Já fizemos isso com [laboratório X] em tempo recorde.',
        'A aprovação regulatória é um passo necessário. Podemos começar o processo agora para que quando a janela de compras abrir, vocês já estejam prontos.',
      ]},
    { id: 'f2', objection: '"O médico já está acostumado a prescrever outra marca"', segment: 'farmaceutico',
      quickResponses: ['Os estudos clínicos mostram vantagens claras.', 'Que tal amostras grátis para o médico testar?'],
      responses: [
        'A familiaridade é importante, mas os estudos clínicos mostram [dados]. Podemos organizar um simpósio com líderes de opinião para apresentar as evidências?',
        'Entendo. Que tal um programa de amostras grátis para que o médico possa testar com alguns pacientes e comparar os resultados?',
      ]},
  ],
  automotivo: [
    { id: 'a1', objection: '"Vou esperar o novo modelo"', segment: 'automotivo',
      quickResponses: ['Condições atuais não se repetem no modelo novo.', 'Preço de entrada sobe Y%. Compre agora.'],
      responses: [
        'O modelo atual tem condições que não se repetem: [bônus de fábrica/taxa zero/estoque limitado]. Quando o novo chegar, essas condições acabam e o preço sobe.',
        'O novo modelo vai demorar X meses e o preço de entrada será Y% maior. Comprando agora, você aproveita as condições e ainda pega um bom valor de revenda.',
      ]},
    { id: 'a2', objection: '"O seguro está muito caro"', segment: 'automotivo',
      quickResponses: ['Parceria com corretoras: até 30% de desconto.', 'Olhe o custo total mensal, não só o seguro.'],
      responses: [
        'Temos parceria com corretoras que conseguem até 30% de desconto. Posso incluir isso na proposta e mostrar o custo total real mensal.',
        'Vamos olhar o custo total de propriedade: consumo, manutenção, seguro. Comparando com o concorrente, nosso custo mensal é mais competitivo.',
      ]},
  ],
  automotivo_luxo: [
    { id: 'al1', objection: '"Por esse preço compro um importado"', segment: 'automotivo_luxo',
      quickResponses: ['Nosso pós-venda e exclusividade não se comparam.', 'Importado tem custo de manutenção até 3x maior.'],
      responses: [
        'Entendo a comparação. Mas considere: nosso pós-venda é premium, peças originais com entrega rápida e a exclusividade da marca no Brasil. Importado paralelo não tem nada disso.',
        'O custo de manutenção de importado pode ser até 3x maior. Quando você soma seguro, peças e revenda, nosso custo total é mais competitivo — com experiência muito superior.',
      ]},
    { id: 'al2', objection: '"Vou comprar no exterior, sai mais barato"', segment: 'automotivo_luxo',
      quickResponses: ['Garantia, emplacamento e impostos tornam equivalente.', 'A experiência de compra premium é só aqui.'],
      responses: [
        'Quando você soma frete, impostos de importação, emplacamento e perda de garantia de fábrica, o preço fica muito próximo. E sem a experiência de compra personalizada que oferecemos.',
        'Nossos clientes valorizam a consultoria premium, test-drive exclusivo e acompanhamento pós-venda. Isso não existe comprando no exterior.',
      ]},
    { id: 'al3', objection: '"Preciso ver a cor/versão pessoalmente"', segment: 'automotivo_luxo',
      quickResponses: ['Agendamos uma experiência exclusiva no showroom.', 'Podemos levar o carro até você para test-drive.'],
      responses: [
        'Com certeza! Posso agendar uma experiência exclusiva no nosso showroom, com champagne e atendimento personalizado. Qual o melhor horário para você?',
        'Podemos ir até você. Nosso serviço de test-drive em domicílio permite que você veja o carro no seu ambiente. Quando seria ideal?',
      ]},
    { id: 'al4', objection: '"Minha esposa/marido precisa aprovar"', segment: 'automotivo_luxo',
      quickResponses: ['Vamos fazer um test-drive em casal.', 'Posso preparar uma apresentação especial para os dois.'],
      responses: [
        'Perfeito! Nada melhor que os dois vivenciarem a experiência juntos. Posso agendar um test-drive especial para o casal, com nosso consultor dedicado.',
        'Entendo. Posso preparar um material exclusivo com configurações e opcionais para vocês decidirem juntos. E se quiserem, fazemos uma visita ao showroom no horário mais conveniente.',
      ]},
  ],
  tecnologia: [
    { id: 't1', objection: '"Já temos uma solução interna"', segment: 'tecnologia',
      quickResponses: ['Custo oculto alto: manutenção, atualizações, equipe.', 'Custo total interno é 3x maior. Posso provar.'],
      responses: [
        'Soluções internas têm custo oculto alto: manutenção, atualizações, equipe dedicada. Nossa plataforma elimina tudo isso e tem garantia de disponibilidade.',
        'Quanto custa manter essa solução por ano? Geralmente o custo total interno é 3x maior que uma plataforma especializada. Posso fazer essa análise com vocês.',
      ]},
    { id: 't2', objection: '"Preciso de integração com nossos sistemas"', segment: 'tecnologia',
      quickResponses: ['Integrações nativas prontas. Configuração em X dias.', 'Teste piloto de 2 semanas para validar.'],
      responses: [
        'Temos integração aberta e conexões nativas com [principais ferramentas]. Nosso time de implementação configura tudo em até X dias.',
        'Entendo que integração é crítica. Que tal um teste piloto de 2 semanas onde validamos todas as integrações antes de fechar?',
      ]},
  ],
  varejo: [
    { id: 'v1', objection: '"As vendas estão fracas, não posso investir agora"', segment: 'varejo',
      quickResponses: ['Vendas fracas = hora de se diferenciar.', 'Comece com uma loja piloto, risco mínimo.'],
      responses: [
        'Exatamente por isso precisa agir. Quando as vendas estão fracas é hora de investir em [solução] para se diferenciar e conquistar participação de mercado.',
        'Entendo o momento. Que tal começarmos com uma loja piloto? Assim você valida o resultado com risco mínimo antes de escalar.',
      ]},
    { id: 'v2', objection: '"Meu público não vai aceitar/usar"', segment: 'varejo',
      quickResponses: ['Adesão de X% em público similar. Dados reais.', 'Teste em uma loja antes de escalar.'],
      responses: [
        'Fizemos testes com perfil de público similar e a adesão foi de X%. Posso compartilhar o caso de sucesso? O público se adapta rápido quando percebe valor.',
        'Podemos fazer um teste A/B em uma loja antes de implementar na rede toda. Dados reais são melhores que suposições.',
      ]},
  ],
  imobiliario: [
    { id: 'i1', objection: '"O mercado está parado"', segment: 'imobiliario',
      quickResponses: ['Mercado parado = oportunidade de compra.', 'Menos concorrência, mais poder de negociação.'],
      responses: [
        'Mercado parado é oportunidade de compra. Taxa de juros, FGTS, condições especiais - tudo favorece quem compra agora. Quando aquecer, o preço sobe.',
        'Para quem está pronto, mercado parado = menos concorrência e mais poder de negociação. Você pode escolher as melhores unidades.',
      ]},
    { id: 'i2', objection: '"Preciso vender meu imóvel antes"', segment: 'imobiliario',
      quickResponses: ['Congelamos condições enquanto você vende.', 'Trabalhamos com permuta e entrada parcelada.'],
      responses: [
        'Temos parceria com imobiliárias que podem ajudar na venda do seu atual. E podemos congelar as condições por X dias enquanto isso acontece.',
        'Trabalhamos com permuta e entrada parcelada. Assim você pode garantir este imóvel sem precisar vender o atual primeiro.',
      ]},
  ],
  financeiro: [
    { id: 'fi1', objection: '"Já tenho meu banco/corretora"', segment: 'financeiro',
      quickResponses: ['Não é trocar, é diversificar.', 'Análise gratuita pode revelar oportunidades.'],
      responses: [
        'Não precisa trocar, pode diversificar. Muitos clientes mantêm 2-3 instituições para comparar taxas e ter mais opções. Vamos fazer uma simulação sem compromisso?',
        'Ótimo que você já investe. A pergunta é: você está no melhor produto para seu perfil? Uma análise gratuita da sua carteira pode revelar oportunidades.',
      ]},
    { id: 'fi2', objection: '"Não confio em investimentos, prefiro poupança"', segment: 'financeiro',
      quickResponses: ['Poupança perde para a inflação. Vou te mostrar os números.', 'Temos opções com mesma segurança e rendimento melhor.'],
      responses: [
        'Entendo a preocupação. Mas poupança hoje rende menos que a inflação — ou seja, seu dinheiro perde poder de compra. Existem opções tão seguras quanto (como Tesouro Direto) com rendimento muito melhor.',
        'Segurança é prioridade, concordo. Mas segurança não precisa custar rentabilidade. Posso te mostrar 3 opções com a mesma garantia da poupança e retorno de 2-3x?',
      ]},
    { id: 'fi3', objection: '"Taxas são muito altas"', segment: 'financeiro',
      quickResponses: ['Vamos olhar o retorno líquido, não só taxa.', 'Minha taxa cai com volume. Vamos ver seu caso.'],
      responses: [
        'Taxa isolada não diz nada. O que importa é o retorno líquido. Muitas vezes uma taxa um pouco maior vem com gestão melhor e retorno maior. Posso fazer a comparação para você.',
        'Nossas taxas são competitivas e caem conforme o volume. Me conta seu perfil de investimento que eu faço uma simulação transparente, sem compromisso.',
      ]},
  ],
  saude: [
    { id: 's1', objection: '"Meus pacientes não vão pagar isso"', segment: 'saude',
      quickResponses: ['Quando entendem o valor, preço vira investimento.', 'Parcelamento torna acessível.'],
      responses: [
        'Quando o paciente entende o valor do resultado, o preço deixa de ser barreira. Posso ajudar a criar uma comunicação de valor que mude essa percepção.',
        'Temos planos de parcelamento que tornam o tratamento acessível. O valor por sessão fica menor que [comparação do dia a dia].',
      ]},
    { id: 's2', objection: '"O plano de saúde já cobre"', segment: 'saude',
      quickResponses: ['Plano tem rede limitada e espera longa.', 'O que cobre é básico. O resultado completo não.'],
      responses: [
        'Plano de saúde cobre o básico e tem rede limitada. Para quem quer resultado mais rápido, personalização e profissional específico, vale o investimento particular.',
        'Entendo. Só considere: qual o tempo de espera no plano? E a liberdade de escolher profissional? Muitos pacientes preferem pagar e resolver rápido que esperar meses.',
      ]},
    { id: 's3', objection: '"Vou pensar e volto a te procurar"', segment: 'saude',
      quickResponses: ['Posso segurar essa condição por 7 dias.', 'O problema que te trouxe aqui não espera.'],
      responses: [
        'Claro! Posso segurar essa condição especial por 7 dias. Mas te pergunto: o desconforto que te trouxe aqui vai esperar também? Quanto antes começarmos, antes resolve.',
        'Pensar é importante. Mas me diz o que falta pra ter certeza agora? Se for dúvida técnica, eu esclareço. Se for valor, vejo o que posso fazer.',
      ]},
  ],
  educacao: [
    { id: 'e1', objection: '"O aluno pode aprender isso de graça online"', segment: 'educacao',
      quickResponses: ['Gratuito tem 3% de conclusão. Nós temos X%.', 'Sem suporte, rede de contatos nem certificação.'],
      responses: [
        'Conteúdo gratuito existe, mas sem metodologia, acompanhamento e certificação. Nossa taxa de conclusão é X% vs 3% dos cursos gratuitos. Resultado custa investimento.',
        'Gratuito não tem suporte, rede de contatos nem empregabilidade. Nossos alunos têm X% de colocação no mercado em Y meses.',
      ]},
    { id: 'e2', objection: '"A mensalidade é alta demais"', segment: 'educacao',
      quickResponses: ['Divida o investimento pelas aulas: R$ X por aula.', 'Bolsas e parcelamento tornam viável.'],
      responses: [
        'Se você dividir o investimento pelo número de aulas e horas de conteúdo, dá menos de R$ X por aula. É mais barato que muitos cursos pontuais.',
        'Temos bolsas por mérito, desconto por indicação e parcelamento. Vamos ver qual formato cabe melhor pra você?',
      ]},
    { id: 'e3', objection: '"Não tenho tempo para estudar"', segment: 'educacao',
      quickResponses: ['Nosso formato é 100% flexível, estuda quando quiser.', 'Basta 30 min por dia para completar.'],
      responses: [
        'Esse é o principal medo de quem começa. Por isso nosso formato é 100% online e assíncrono. Nossos alunos completam com 30-45 min por dia nos horários que conseguem.',
        'Tempo não é questão de ter, é de priorizar. Com o quanto você ganharia ao dominar isso em X meses, vale o tempo investido?',
      ]},
  ],
  servicos: [
    { id: 'sv1', objection: '"Posso fazer internamente"', segment: 'servicos',
      quickResponses: ['Quanto custa em tempo e oportunidade?', 'Some tudo: contratação, treinamento, gestão.'],
      responses: [
        'Pode, mas quanto custa em tempo e oportunidade? Enquanto sua equipe faz isso, deixa de focar no negócio principal. Nosso time especializado entrega em metade do tempo.',
        'Internalizar parece econômico, mas some: contratação, treinamento, ferramentas, gestão. Terceirizar é custo variável sem dor de cabeça.',
      ]},
    { id: 'sv2', objection: '"Como saber se o trabalho vai ser de qualidade?"', segment: 'servicos',
      quickResponses: ['Começamos com um piloto pequeno.', 'Temos cases de clientes similares. Posso conectar.'],
      responses: [
        'Ótima pergunta. Começamos com um escopo pequeno de validação — você vê a qualidade antes de comprometer mais. Se não gostar, paramos sem problema.',
        'Posso te conectar com 2-3 clientes do seu mesmo porte/setor. Eles contam como é trabalhar conosco na prática. Quer que eu envie as referências?',
      ]},
    { id: 'sv3', objection: '"Já contratei consultoria antes e não funcionou"', segment: 'servicos',
      quickResponses: ['O que não funcionou? Quero entender antes de propor.', 'Nosso método é hands-on, não relatório.'],
      responses: [
        'Entendo a frustração. Me conta o que não funcionou da última vez? Isso vai me ajudar a mostrar em que somos diferentes e se faz sentido tentar.',
        'A maioria das consultorias entrega relatório. Nós trabalhamos junto com sua equipe, mão na massa, até o resultado sair. Essa diferença muda muito o jogo.',
      ]},
  ],
  agro: [
    { id: 'ag1', objection: '"Vou esperar a safra para decidir"', segment: 'agro',
      quickResponses: ['Na safra, demanda sobe e condições pioram.', 'Trave o preço agora, pague pós-safra.'],
      responses: [
        'Entendo o ciclo. Mas preparar agora garante as melhores condições e disponibilidade. Na safra, a demanda sobe e as condições pioram.',
        'Os insumos têm prazo de entrega. Quem compra antecipado garante preço e disponibilidade. Podemos travar o preço agora e ajustar o pagamento para pós-safra.',
      ]},
  ],
  industria: [
    { id: 'in1', objection: '"Precisamos validar com a engenharia"', segment: 'industria',
      quickResponses: ['Levo nossa engenharia para uma reunião técnica.', 'Nossas especificações atendem norma [X].'],
      responses: [
        'Claro! Nossa engenharia pode participar de uma reunião técnica com o time de vocês. Resolvemos dúvidas rapidamente e vocês já saem com proposta técnica validada.',
        'Tenho todas as especificações e normas atendidas. Posso te enviar a ficha técnica completa e marcar uma call com nossa engenharia para validação conjunta.',
      ]},
    { id: 'in2', objection: '"O lead time da entrega é longo demais"', segment: 'industria',
      quickResponses: ['Posso priorizar sua ordem na produção.', 'Temos estoque parcial disponível.'],
      responses: [
        'Entendo a urgência. Posso conversar com a produção para priorizar sua ordem. Em casos estratégicos, conseguimos reduzir o prazo em [X%].',
        'Temos estoque parcial disponível para início imediato e o restante em produção. Assim vocês já começam a operar sem esperar 100% da entrega.',
      ]},
    { id: 'in3', objection: '"Já tenho um fornecedor homologado"', segment: 'industria',
      quickResponses: ['Ótimo! Podemos ser o segundo fornecedor.', 'Ter backup reduz risco de supply chain.'],
      responses: [
        'Ótimo que já tem um fornecedor homologado. Muitas indústrias grandes têm política de dual-sourcing para reduzir risco de supply chain. Podemos ser o segundo fornecedor estratégico.',
        'Entendo. Nosso processo de homologação é rápido — fazemos juntos e em paralelo com o atual. Vocês ganham segurança e negociação melhor com os dois.',
      ]},
  ],
  bebidas_alcoolicas: [
    { id: 'ba1', objection: '"O preço está acima do que pago hoje"', segment: 'bebidas_alcoolicas',
      quickResponses: [
        'O giro compensa a diferença. Vamos olhar o lucro por caixa.',
        'Qual é o preço que você paga hoje e por qual volume?',
        'Nosso prazo de pagamento muda a conta — veja o custo real.',
      ],
      commonMistake: 'Entrar em guerra de preço sem entender o mix atual. O que importa é a margem e o giro, não o preço unitário.',
      responses: [
        'Entendo. Mas vamos olhar pelo ângulo certo: qual é a sua margem atual nessa categoria? Nosso produto tem giro alto e markup compatível — muitas vezes o lucro por caixa é maior mesmo com preço diferente.',
        'Preço isolado não diz nada. Me conta: qual o volume que você compra hoje e qual o prazo? Com essas informações, faço uma simulação real de custo versus rentabilidade.',
        'Nosso prazo de pagamento e o volume de giro no PDV geralmente compensam. Posso te mostrar comparativo de resultado líquido?',
      ]},
    { id: 'ba2', objection: '"Meu cliente não conhece essa marca"', segment: 'bebidas_alcoolicas',
      quickResponses: [
        'Exatamente — quem apresenta primeiro vende mais e com margem melhor.',
        'Vou te apoiar com material de PDV e degustação.',
        'Novo produto = sem pressão de preço do concorrente.',
      ],
      commonMistake: 'Tentar convencer pelo histórico da marca sem oferecer suporte de ativação no ponto de venda.',
      responses: [
        'Você está certo — por isso é uma oportunidade. Marca nova no PDV não tem concorrente de preço com o consumidor. Quem apresenta primeiro cria o hábito de compra.',
        'Vou te apoiar com material de PDV, stopper, e se precisar, degustação para o consumidor experimentar. Minha função é ajudar você a vender.',
        'Marcas consolidadas têm margens espremidas porque todo concorrente pressiona no preço. Aqui você tem exclusividade de posicionamento.',
      ]},
    { id: 'ba3', objection: '"Já tenho muitos fornecedores de bebidas"', segment: 'bebidas_alcoolicas',
      quickResponses: [
        'Não é para substituir — é para complementar com uma categoria nova.',
        'Quantos te geram 80% da receita? Esse pode ser um deles.',
        'Um SKU extra de alto giro muda o resultado do mês.',
      ],
      commonMistake: 'Brigar por espaço com o mix atual. Posicione seu produto como adição de receita, não troca.',
      responses: [
        'Faz sentido. Não estou aqui para substituir ninguém — quero mostrar uma categoria que você ainda não explora ou que tem gap no seu mix atual.',
        'Me conta: dos seus fornecedores atuais, quantos te geram de verdade 80% da receita? O restante está ocupando espaço sem resultado. Posso mostrar onde me encaixo melhor.',
        'Você não precisa de mais um fornecedor do mesmo. Nosso diferencial é [categoria/posicionamento]. É incremental à sua receita atual.',
      ]},
    { id: 'ba4', objection: '"O giro está fraco nessa categoria"', segment: 'bebidas_alcoolicas',
      quickResponses: [
        'Giro fraco = exposição errada. Deixa eu te mostrar como ativar.',
        'Posição de gôndola, preço ao consumidor e frio fazem diferença.',
        'Posso trazer case de PDV similar que reverteu isso.',
      ],
      commonMistake: 'Aceitar o argumento e oferecer desconto. Primeiro investigue por que o giro está fraco antes de mexer no preço.',
      responses: [
        'Antes de concluirmos que o produto não vende, me conta: como está a exposição? Temperatura, posição de gôndola, preço ao consumidor — esses três fatores respondem por 70% do giro.',
        'Posso te ajudar a ativar o produto corretamente: material de PDV, posicionamento e uma ação de degustação. Deixa eu te mostrar um case de resultado em PDV similar ao seu.',
        'Fraco hoje não significa fraco sempre. O que já fizemos juntos para impulsionar as vendas nessa categoria?',
      ]},
    { id: 'ba5', objection: '"Preciso falar com meu sócio/dono"', segment: 'bebidas_alcoolicas',
      quickResponses: [
        'Quando ele está? Quero apresentar pessoalmente.',
        'Posso deixar um comparativo de margem para mostrar pra ele.',
        'Me diz o que ele prioriza — preparo a argumentação certa.',
      ],
      commonMistake: 'Depender de um intermediário sem saber o que convence o decisor real.',
      responses: [
        'Claro! Quando ele está na loja? Prefiro apresentar pessoalmente em 10 minutos do que depender de repasse.',
        'Posso te deixar um comparativo de margem e giro versus o que vocês já vendem — facilita a conversa com ele.',
        'Me conta: o que ele costuma priorizar quando avalia um produto novo — é a margem, o prazo de pagamento, ou o suporte de ativação?',
      ]},
    { id: 'ba6', objection: '"Não tenho espaço na gôndola"', segment: 'bebidas_alcoolicas',
      quickResponses: [
        'Posso ajudar a reorganizar para destacar o que mais vende.',
        'Esse produto substitui um de baixo giro — ganho líquido.',
        'Começa com 3 SKUs no frio — sem mexer na gôndola.',
      ],
      commonMistake: 'Insistir em shelf space sem entender o mix atual. Ofereça substituição estratégica de SKU.',
      responses: [
        'Entendo. Mas vamos fazer juntos uma análise da gôndola — quantos SKUs você tem hoje com baixo giro? Um swap estratégico libera espaço e aumenta receita.',
        'Posso começar apenas com 3 SKUs no expositor frio, sem mexer na gôndola. O consumidor decide por impulso na bebida gelada — é o menor risco para você.',
        'A reorganização da gôndola é parte do meu trabalho. Se você me der 20 minutos, eu mesmo monto a exposição e te mostro o resultado.',
      ]},
  ],
  bebidas_alcoolicas_vinho: [
    { id: 'bv1', objection: '"Meu cliente não entende de vinho e não compra"', segment: 'bebidas_alcoolicas_vinho',
      quickResponses: [
        'Quem não entende compra pelo preço e pela garrafa — temos os dois.',
        'Consumidor de vinho cresce 18% ao ano no Brasil.',
        'A venda começa na sua indicação. Eu te treino para isso.',
      ],
      commonMistake: 'Tentar vender vinho premium para um canal sem preparo. Comece com vinhos de entrada e construa junto com o cliente.',
      responses: [
        'Exatamente por isso existe oportunidade. Consumidor que não entende compra por preço e por rótulo bonito — e tem margem boa nesses dois critérios. Vamos começar por aí.',
        'O mercado de vinhos no Brasil cresceu 18% no último ano. Seu cliente está mudando, mesmo que você ainda não perceba. Quem posicionar antes vai capturar esse público.',
        'Te ofereço um mini-treinamento de 30 minutos para sua equipe indicar vinho com confiança. Quando o vendedor recomenda, a conversão triplica.',
      ]},
    { id: 'bv2', objection: '"Vinho estraga, não sei como conservar"', segment: 'bebidas_alcoolicas_vinho',
      quickResponses: [
        'Te monto um planograma para giro rápido — sem sobrar.',
        'Nosso portfólio tem vinhos de alto giro, não raridades.',
        'Faixa de preço certa + posição correta = giro garantido.',
      ],
      commonMistake: 'Empurrar variedade grande sem garantir giro. Comece com 5-8 SKUs de alto consumo.',
      responses: [
        'Entendo a preocupação. Por isso começo com 5-8 SKUs de alto giro — os que vendem com frequência e não sobram. Nada de raridade que fica parada.',
        'Posso te montar um planograma específico para o seu volume de vendas. A ideia é nunca sobrar — o vinho certo, no volume certo, com giro garantido.',
        'Vinhos de entrada e medianos têm vida útil longa — fácil de trabalhar. As garrafas sofisticadas ficam como vitrine e não precisam girar rápido.',
      ]},
    { id: 'bv3', objection: '"O preço por garrafa é alto para o meu público"', segment: 'bebidas_alcoolicas_vinho',
      quickResponses: [
        'Preço por garrafa é mais alto, mas margem por unidade também.',
        'Vinho de R$30 tem margem que cerveja de R$5 nunca vai ter.',
        'Comece com a faixa de R$25-40 — aceitação alta e margem boa.',
      ],
      commonMistake: 'Comparar vinho com bebida de volume. A comparação certa é com margem absoluta por venda.',
      responses: [
        'Preço alto por garrafa, mas margem absoluta por unidade é incomparável. Uma garrafa de R$35 com 40% de margem vale mais que uma caixa de cerveja.',
        'Vamos olhar para a faixa de R$25 a R$45 — essa é a sweet spot de aceitação e margem. Não estou falando de vinho de colecionador.',
        'Seu público gasta quanto por cabeça em cerveja numa sexta à noite? Uma garrafa de vinho para dois é R$30. É a mesma faixa, com percepção de valor muito maior.',
      ]},
    { id: 'bv4', objection: '"Já tenho um fornecedor de vinhos"', segment: 'bebidas_alcoolicas_vinho',
      quickResponses: [
        'Ótimo! Estou trazendo o que você ainda não tem.',
        'Um segundo fornecedor garante preço e disponibilidade.',
        'Me conta o que vende bem hoje — trago o complemento.',
      ],
      commonMistake: 'Tentar substituir o fornecedor atual de cara. Entre como complemento, não como substituto.',
      responses: [
        'Ótimo que você já trabalha com vinho. Estou trazendo o que você provavelmente ainda não tem: [país de origem diferente/faixa de preço nova/rótulo exclusivo]. É soma, não troca.',
        'Ter dois fornecedores é estratégico — garante preço competitivo e disponibilidade em alta temporada. Me mostra o que você já vende e te mostro onde tenho diferencial.',
        'Me conta os 3 vinhos que mais giram hoje. Vejo se consigo complementar o que falta no mix ou te oferecer uma alternativa mais rentável na mesma categoria.',
      ]},
    { id: 'bv5', objection: '"Não sei indicar vinho, vou perder venda se o cliente perguntar algo"', segment: 'bebidas_alcoolicas_vinho',
      quickResponses: [
        'Te dou um card de bolso com 5 respostas prontas.',
        'Treinamento de 30 min com sua equipe resolvemos isso.',
        'O segredo é 3 perguntas: ocasião, preço, preferência.',
      ],
      commonMistake: 'Deixar o cliente (varejista) sem suporte técnico. Você é a ponte entre o produto e o consumidor final.',
      responses: [
        'Te dou um card de bolso com as 5 situações mais comuns e o que recomendar em cada uma. Em 5 minutos sua equipe sabe indicar.',
        'Posso fazer um treinamento de 30 minutos com sua equipe — direto na loja. Ensinamos 3 perguntas simples que resolvem 90% das dúvidas do consumidor.',
        'A venda de vinho se resume a 3 perguntas: qual é a ocasião, quanto quer gastar e prefere tinto ou branco. Com isso, você fecha. Me deixa te mostrar como.',
      ]},
    { id: 'bv6', objection: '"Temporada de vinho é só no frio, não vale para o ano todo"', segment: 'bebidas_alcoolicas_vinho',
      quickResponses: [
        'Vinho branco e rosé vendem muito no verão.',
        'Datas comemorativas distribuem demanda o ano todo.',
        'Consumidor jovem não tem sazonalidade — bebe o ano todo.',
      ],
      commonMistake: 'Aceitar a sazonalidade sem mostrar o potencial fora do inverno.',
      responses: [
        'Isso muda quando você trabalha o portfólio certo. Vinho branco gelado e rosé são os que mais crescem no verão — exatamente quando todo mundo acha que não vende.',
        'Além das estações, temos datas fortes o ano todo: Dia das Mães, Dia dos Namorados, Natal, confraternizações. O consumidor de vinho tem razão para comprar sempre.',
        'O consumidor jovem que entrou na categoria não tem sazonalidade — ele bebe vinho em qualquer clima. E é esse público que mais cresce.',
      ]},
  ],
  energia: [
    { id: 'en1', objection: '"O prazo de retorno é muito longo"', segment: 'energia',
      quickResponses: ['Prazo real é menor que o projetado.', 'Valorização do imóvel + proteção contra aumentos.'],
      responses: [
        'Com as novas tarifas e o aumento constante da energia, o prazo de retorno real é menor que o projetado. Clientes que instalaram há 2 anos já recuperaram o investimento.',
        'Além do retorno financeiro, considere: valorização do imóvel, sustentabilidade como diferencial e proteção contra aumentos futuros. O retorno total é muito maior.',
      ]},
  ],
};

export function getObjections(segment: Segment): Objection[] {
  const segmentSpecific = segment ? (SEGMENT_OBJECTIONS[segment] || []) : [];
  return [...segmentSpecific, ...GENERAL_OBJECTIONS];
}

// ==================== ROTEIROS ====================

const GENERAL_SCRIPTS: Script[] = [
  {
    id: 'sc1', title: 'Ligação Fria - Primeira Abordagem', context: 'Ligação para cliente potencial que nunca ouviu falar de você', segment: 'geral',
    script: `"Olá [Nome], aqui é [Seu Nome] da [Empresa]. Eu sei que você está ocupado, então vou ser breve - 30 segundos.\n\nEstamos ajudando [perfil de empresa similar] a [resultado principal] e acredito que pode fazer sentido para vocês também.\n\nNão estou ligando para vender nada agora, mas gostaria de agendar 15 minutos para entender se podemos ajudar. Teria disponibilidade [dia] às [hora]?"`,
  },
  {
    id: 'sc2', title: 'WhatsApp - Acompanhamento Pós-reunião', context: 'Mensagem após primeira reunião de apresentação', segment: 'geral',
    script: `"Oi [Nome], tudo bem?\n\n[Seu Nome] da [Empresa] aqui. Foi um prazer conversar com você hoje!\n\nComo combinamos, segue o material que mencionei: [link]\n\nOs pontos principais que conversamos:\n✅ [Ponto 1]\n✅ [Ponto 2]\n✅ [Ponto 3]\n\nPróximo passo: [ação combinada] até [data].\n\nQualquer dúvida, estou à disposição! 🤝"`,
  },
  {
    id: 'sc3', title: 'Email - Proposta Comercial', context: 'Email enviando proposta formal', segment: 'geral',
    script: `"Assunto: Proposta [Empresa] - [Solução] para [Empresa do Cliente]\n\nOlá [Nome],\n\nConforme alinhado em nossa reunião, segue a proposta para [objetivo do cliente].\n\nResumo da solução:\n• [Entrega 1]\n• [Entrega 2]\n• [Entrega 3]\n\nInvestimento: R$ [valor]\nCondições: [condições]\nValidade: [data]\n\nEstou à disposição para alinharmos os próximos passos.\n\nAbraço,\n[Seu Nome]"`,
  },
  {
    id: 'sc4', title: 'Mensagem - Reativação de Cliente', context: 'Cliente que sumiu há mais de 30 dias', segment: 'geral',
    script: `"Oi [Nome], tudo bem?\n\nFaz um tempo que conversamos e queria saber como estão as coisas por aí.\n\nDesde nossa última conversa, [novidade relevante: novo produto/resultado de outro cliente/condição especial].\n\nAchei que poderia fazer sentido para você. Vale uma conversa rápida de 10 minutos essa semana?\n\nAbraço!"`,
  },
  {
    id: 'sc5', title: 'Abordagem - Indicação', context: 'Quando alguém indicou o cliente potencial', segment: 'geral',
    script: `"Olá [Nome], tudo bem?\n\nO [Nome de quem indicou] me falou muito bem de você e sugeriu que conversássemos.\n\nAjudamos a [empresa do indicador] com [resultado] e ele achou que poderia fazer sentido para vocês também.\n\nTem 15 minutos essa semana para uma conversa rápida?"`,
  },
];

const SEGMENT_SCRIPTS: Record<string, Script[]> = {
  farmaceutico: [
    { id: 'sc-f1', title: 'Abordagem — Visita médica', context: 'Primeira visita ao consultório médico', segment: 'farmaceutico',
      script: `"Doutor(a) [Nome], bom dia. Sou [Seu Nome], representante da [Laboratório]. Prometo 3 minutos.\n\nEstou aqui para apresentar [produto] — é indicado para pacientes com [perfil clínico] que não respondem bem a [alternativa atual].\n\nTenho estudo clínico recente comparativo e amostras para você testar. Posso deixar o material e voltar na próxima semana para saber sua impressão?"` },
  ],
  automotivo: [
    { id: 'sc-a1', title: 'Abordagem — Cliente no showroom', context: 'Cliente olhando o carro no showroom', segment: 'automotivo',
      script: `"Olá! Sou [Seu Nome]. Vi que você está interessado no [modelo]. Posso te mostrar algumas configurações que talvez você não tenha visto no site?\n\nMe conta: é para uso urbano, viagens, ou os dois? E quantas pessoas normalmente andam com você?\n\nCom essas informações eu já consigo te indicar a versão ideal e te mostrar as condições que temos essa semana."` },
    { id: 'sc-a2', title: 'WhatsApp — Pós test-drive', context: 'Cliente que fez test-drive mas não fechou', segment: 'automotivo',
      script: `"Oi [Nome], tudo bem?\n\n[Seu Nome] da [Concessionária]. Obrigado pelo test-drive de ontem! Como foi a experiência?\n\nConsegui uma condição especial com a gerência hoje: [benefício concreto]. Válida até [data].\n\nPosso te mandar a proposta personalizada para você avaliar?"` },
  ],
  automotivo_luxo: [
    { id: 'sc-al1', title: 'Abordagem — Cliente exigente', context: 'Primeira conversa com cliente premium', segment: 'automotivo_luxo',
      script: `"Olá [Nome]. Sou [Seu Nome], seu consultor exclusivo para o [modelo].\n\nAntes de falarmos do carro, me conta: qual é o momento na sua vida que este carro representa? É uma conquista, presente, realização?\n\nPergunto porque cada cliente vive essa compra de forma única. Quero preparar uma experiência à altura."` },
  ],
  tecnologia: [
    { id: 'sc-t1', title: 'Cold call — Cliente enterprise', context: 'Ligação para decisor de tecnologia', segment: 'tecnologia',
      script: `"Olá [Nome], aqui é [Seu Nome] da [Empresa].\n\nEstamos ajudando empresas do porte da sua a reduzir custo de [área] em [%] com nossa plataforma. Sei que vocês usam [concorrente/solução interna].\n\nNão estou ligando para vender — só para entender se faz sentido uma conversa de 20 minutos na próxima semana. Posso mandar um e-mail com case de [cliente similar]?"` },
  ],
  varejo: [
    { id: 'sc-v1', title: 'Visita — Loja do varejista', context: 'Visita no ponto de venda', segment: 'varejo',
      script: `"Oi [Nome], passando aqui para entender como está o giro do [produto] e se tem alguma oportunidade.\n\nTenho novidade: campanha de ativação com material de ponto de venda, desconto por volume e treinamento de equipe para a sua loja.\n\nVocê tem 10 minutos para me mostrar a gôndola e alinharmos uma ação?"` },
  ],
  imobiliario: [
    { id: 'sc-i1', title: 'WhatsApp — Lead aquecido', context: 'Cliente pediu informações e parou de responder', segment: 'imobiliario',
      script: `"Oi [Nome], aqui é [Seu Nome] da [Imobiliária].\n\nVocê se interessou pelo [imóvel] na semana passada. Sabia que saiu uma condição nova para entrada facilitada e taxa fixa por 3 anos?\n\nPosso te mandar a simulação personalizada para essa condição? Leva 5 minutos."` },
  ],
  financeiro: [
    { id: 'sc-fi1', title: 'Abordagem — Cliente investidor', context: 'Primeira conversa com cliente que já investe', segment: 'financeiro',
      script: `"Olá [Nome]. Obrigado pelo tempo. Me conta: como está distribuída sua carteira hoje?\n\nPergunto porque faço uma análise gratuita — aponto oportunidades sem custo e sem compromisso. Se fizer sentido depois, a gente conversa. Se não, você sai com informação valiosa.\n\nTopa marcar 30 minutos essa semana?"` },
  ],
  saude: [
    { id: 'sc-s1', title: 'Abordagem — Paciente na clínica', context: 'Conversa com paciente sobre tratamento', segment: 'saude',
      script: `"[Nome do paciente], analisei seu caso e temos duas opções.\n\nA primeira é o tratamento padrão: [descrição e preço]. Resolve o sintoma mas exige manutenção frequente.\n\nA segunda é o tratamento completo: [descrição], um pouco mais de investimento mas resolve de vez. Grande parte dos nossos pacientes escolhe essa.\n\nQual faz mais sentido para o seu momento?"` },
  ],
  educacao: [
    { id: 'sc-e1', title: 'Abordagem — Pai/mãe em visita à escola', context: 'Visita presencial à escola', segment: 'educacao',
      script: `"Obrigado por virem conhecer a escola! Antes do tour, me contam: o que é mais importante para vocês na educação do [filho/filha]?\n\nA resposta de vocês vai direcionar o que eu mostro aqui. Nossa escola tem diferenciais em [áreas], mas vocês sentem o que faz sentido ao ver na prática.\n\nVamos começar?"` },
  ],
  servicos: [
    { id: 'sc-sv1', title: 'Proposta — Reunião de fechamento', context: 'Apresentando proposta de serviço', segment: 'servicos',
      script: `"Antes de eu apresentar a proposta, quero confirmar que entendi o desafio de vocês: [resumir dor em 1 frase].\n\nNossa proposta resolve isso em 3 frentes: [A, B, C]. O investimento é de [R$] e o retorno esperado é [resultado em prazo].\n\nTem alguma dúvida antes de eu entrar nos detalhes?"` },
  ],
  agro: [
    { id: 'sc-ag1', title: 'Visita — Produtor rural', context: 'Visita técnica na propriedade', segment: 'agro',
      script: `"Seu [Nome], obrigado por receber. Vamos dar uma volta na lavoura para eu entender o manejo atual?\n\nMinha proposta é simples: entender o que você faz hoje, ver onde tem ganho real de produtividade com [produto/solução] e te mostrar cases de fazendas similares na região.\n\nDepois disso, se fizer sentido, a gente fecha condição."` },
  ],
  energia: [
    { id: 'sc-en1', title: 'Apresentação — Proposta solar', context: 'Reunião de apresentação do sistema solar', segment: 'energia',
      script: `"Sua conta de luz hoje é R$ [X] por mês — isso dá R$ [X × 12] por ano. Em 20 anos, R$ [total].\n\nCom nosso sistema, em 4-5 anos o investimento já se paga. Depois, você tem 15+ anos de energia praticamente gratuita.\n\nMais: o imóvel valoriza em [%]. Faz sentido continuarmos essa análise?"` },
  ],
  bebidas_alcoolicas: [
    { id: 'sc-ba1', title: 'Visita — Ponto de Venda (PDV)', context: 'Visita de rotina ao bar, restaurante ou mercado', segment: 'bebidas_alcoolicas',
      script: `"Oi [Nome], tudo bem? [Seu Nome] da [Distribuidora/Marca].\n\nPassando para ver como está o giro de [produto] e se tem alguma oportunidade na gôndola.\n\nTenho novidade esse mês: [produto novo ou condição especial] com [benefício: prazo melhor / brinde / material de PDV].\n\nTem 10 minutos para a gente olhar a exposição e alinhar o pedido?"` },
    { id: 'sc-ba2', title: 'WhatsApp — Reposição e oportunidade', context: 'Mensagem para cliente que não pediu na última semana', segment: 'bebidas_alcoolicas',
      script: `"Oi [Nome]! [Seu Nome] aqui da [Empresa].\n\nVi que faz alguns dias sem pedido e queria passar duas informações rápidas:\n\n1️⃣ [Produto A] está com condição especial até [data]: [desconto/prazo]\n2️⃣ [Produto B] teve alta no giro nos PDVs da região essa semana\n\nConsigo fechar o pedido hoje e entregar [prazo]. Topa?"` },
    { id: 'sc-ba3', title: 'Abordagem — Cliente novo (bar/restaurante)', context: 'Primeira visita a um estabelecimento potencial', segment: 'bebidas_alcoolicas',
      script: `"Olá, tudo bem? Sou [Seu Nome] da [Empresa], trabalho com [categoria de bebidas] na região.\n\nPassei aqui porque vi que vocês têm um público que combina com o perfil dos nossos produtos.\n\nNão vim para vender nada agora — queria entender como vocês trabalham a categoria de [bebidas] e ver se existe alguma oportunidade de parceria.\n\nTem 5 minutinhos?"` },
    { id: 'sc-ba4', title: 'Apresentação — Produto novo no portfólio', context: 'Apresentar um produto que o cliente ainda não conhece', segment: 'bebidas_alcoolicas',
      script: `"[Nome], trouxe algo para te mostrar que está performando bem nos PDVs da região.\n\nÉ o [produto] — [categoria]. O que me fez pensar em você:\n✅ Margem de [X]%\n✅ Giro médio de [Y] unidades/semana no perfil de PDV similar ao seu\n✅ Suporte de [material de PDV / degustação]\n\nQuero deixar [X unidades] como teste. Se não girar em 30 dias, a gente recolhe. Topa?"` },
  ],
  bebidas_alcoolicas_vinho: [
    { id: 'sc-bv1', title: 'Abordagem — PDV que ainda não vende vinho', context: 'Apresentar a categoria de vinhos para cliente novo', segment: 'bebidas_alcoolicas_vinho',
      script: `"Oi [Nome]! Sou [Seu Nome] da [Empresa/Importadora].\n\nEstou visitando os melhores pontos da região para expandir a categoria de vinhos.\n\nVi que vocês ainda não trabalham vinho e queria mostrar por que vale a pena: margem entre 40-60%, ticket médio maior por compra e consumidor que volta mais.\n\nPosso te mostrar um mix de entrada — 6 a 8 rótulos de alto giro, sem risco de sobrar?"` },
    { id: 'sc-bv2', title: 'Visita — Cliente que já vende vinho', context: 'Visita de rotina e oportunidade de ampliar mix', segment: 'bebidas_alcoolicas_vinho',
      script: `"[Nome], como estão girando os vinhos? Quais estão performando melhor?\n\nPergunto porque trouxe [novidade: novo rótulo / safra / faixa de preço] que está saindo bem nos PDVs da região.\n\nAlém disso, vi uma oportunidade na exposição de vocês: [melhoria na gôndola / temperatura / posição no frio].\n\nPodemos alinhar o pedido e ajustar a exposição hoje?"` },
    { id: 'sc-bv3', title: 'Treinamento — Equipe do PDV', context: 'Mini-treinamento de 20 minutos com a equipe de vendas do cliente', segment: 'bebidas_alcoolicas_vinho',
      script: `"Pessoal, vou ser rápido — 20 minutos e vocês saem sabendo indicar vinho para qualquer cliente.\n\nTrês perguntas que resolvem tudo:\n1️⃣ 'É para qual ocasião?' (jantar, presente, reunião?)\n2️⃣ 'Qual faixa de preço?' (entrada R$20-40, médio R$40-80)\n3️⃣ 'Prefere tinto, branco ou rosé?'\n\nCom essas 3 respostas, você indica com confiança. Vou passar pelas opções do estoque de vocês e mostrar o que recomendar em cada situação."` },
    { id: 'sc-bv4', title: 'WhatsApp — Datas comemorativas', context: 'Ativação antes de datas como Dia das Mães, Namorados, Natal', segment: 'bebidas_alcoolicas_vinho',
      script: `"Oi [Nome]! [Seu Nome] aqui.\n\n[Data] está chegando e vinho é o presente mais pedido da data. Quero garantir o estoque de vocês antes que falte.\n\nPreparei um kit especial para o período:\n🍷 [Rótulo A] — R$ [X] — ideal para presente\n🍷 [Rótulo B] — R$ [X] — mais popular\n🍷 [Rótulo C] — R$ [X] — premium\n\nEnvio uma arara/display de presente junto para ativar no PDV. Pedido mínimo: [X] unidades.\n\nFecho até hoje para garantir entrega antes da data?"` },
  ],
  industria: [
    { id: 'sc-in1', title: 'Abordagem — Compras industriais', context: 'Primeira conversa com comprador industrial', segment: 'industria',
      script: `"[Nome do comprador], aqui é [Seu Nome] da [Fornecedora]. Sei que vocês trabalham com [fornecedor atual] — não quero substituir, quero ser uma segunda opção estratégica.\n\nMuitas indústrias têm política de dual-sourcing para reduzir risco. Posso fazer uma cotação para vocês compararem? Leva 2 dias."` },
  ],
};

export function getScripts(segment: Segment): Script[] {
  const segmentSpecific = segment ? (SEGMENT_SCRIPTS[segment] || []) : [];
  return [...segmentSpecific, ...GENERAL_SCRIPTS];
}

// ==================== TÉCNICAS ====================

export const TECHNIQUES: Technique[] = [
  {
    id: 'tec1', name: 'Perguntas Estratégicas', icon: '🔄',
    summary: 'Método de perguntas que conduz o cliente a reconhecer sua própria necessidade. (Situação → Problema → Implicação → Necessidade)',
    steps: [
      'Situação: Perguntas sobre o contexto atual ("Como funciona hoje seu processo de X?")',
      'Problema: Identificar dores ("Quais dificuldades você enfrenta com isso?")',
      'Implicação: Aprofundar a dor ("O que acontece quando esse problema se repete?")',
      'Necessidade de Solução: Fazer o cliente verbalizar o valor ("Se resolvesse isso, qual seria o impacto?")',
    ],
    whenToUse: 'Vendas consultivas complexas, valores altos, múltiplos decisores.',
  },
  {
    id: 'tec2', name: 'Qualificação em 4 Passos', icon: '🎯',
    summary: 'Método para qualificar clientes potenciais rapidamente em 4 critérios.',
    steps: [
      'Orçamento: "Vocês já têm orçamento previsto para essa iniciativa?"',
      'Autoridade: "Quem mais participa da decisão?"',
      'Necessidade: "Qual o principal problema que querem resolver?"',
      'Prazo: "Para quando vocês precisam disso implementado?"',
    ],
    whenToUse: 'Qualificação de clientes potenciais, primeiras ligações, para decidir se vale investir tempo.',
  },
  {
    id: 'tec3', name: 'Venda Desafiadora', icon: '💡',
    summary: 'Ensine algo novo ao cliente, personalize a abordagem e assuma o controle.',
    steps: [
      'Ensinar: Traga informações que o cliente não sabia ("Você sabia que 70% das empresas do seu setor estão...")',
      'Personalizar: Conecte à realidade dele ("No seu caso específico, isso significa...")',
      'Controlar: Conduza a conversa com firmeza ("Com base nisso, o caminho mais inteligente seria...")',
    ],
    whenToUse: 'Quando o cliente acha que já sabe tudo, vendas entre empresas, diferenciação competitiva.',
  },
  {
    id: 'tec4', name: 'Conexão e Confiança', icon: '🤝',
    summary: 'Técnica de conexão emocional para criar confiança rapidamente.',
    steps: [
      'Espelhamento: Adapte tom de voz, velocidade e linguagem corporal ao cliente',
      'Interesses: Encontre pontos em comum ("Vi que você também...")',
      'Escuta Ativa: Repita o que ele disse com suas palavras ("Se entendi bem...")',
      'Validação: Reconheça sentimentos ("Faz total sentido você pensar assim")',
    ],
    whenToUse: 'Início de qualquer interação, reuniões presenciais, quando há resistência.',
  },
  {
    id: 'tec5', name: 'Fechamento Alternativo', icon: '🔐',
    summary: 'Ofereça duas opções em vez de sim/não para facilitar a decisão.',
    steps: [
      'Nunca pergunte "Vamos fechar?", dê opções: "Prefere o plano A ou o B?"',
      'Exemplos: "Começamos na segunda ou na quarta?", "Prefere pagar à vista com desconto ou parcelado?"',
      'Use após sinais de compra: cliente perguntando sobre prazo, implementação ou condições',
      'Se disser "nenhum dos dois", investigue: "O que precisaria mudar para fazer sentido?"',
    ],
    whenToUse: 'Momento de fechamento, quando o cliente está indeciso mas interessado.',
  },
  {
    id: 'tec6', name: 'Histórias que Vendem', icon: '📖',
    summary: 'Use histórias de clientes reais para criar identificação e provar resultados.',
    steps: [
      'Situação: "O cliente X, do mesmo segmento que vocês, enfrentava [problema]"',
      'Problema: "Isso causava [consequência negativa, com números se possível]"',
      'Solução: "Implementamos [solução] em [prazo]"',
      'Resultado: "Em X meses, eles alcançaram [resultado com números]"',
    ],
    whenToUse: 'Objeções de preço, ceticismo, quando dados sozinhos não convencem.',
  },
  {
    id: 'tec7', name: 'Método Sanduíche', icon: '🥪',
    summary: 'Apresente o preço entre dois benefícios fortes.',
    steps: [
      'Benefício forte: "Com nossa solução, vocês vão [resultado principal]"',
      'Preço: "O investimento para isso é de R$ X por mês"',
      'Benefício forte: "E além disso, vocês também terão [benefício adicional]"',
      'Nunca diga o preço sozinho - sempre com contexto de valor',
    ],
    whenToUse: 'Apresentação de preço, proposta comercial, quando o valor é alto.',
  },
  {
    id: 'tec8', name: 'Venda Consultiva', icon: '🔍',
    summary: 'Posicione-se como consultor, não vendedor. Diagnostique antes de prescrever.',
    steps: [
      'Diagnóstico: Faça mais perguntas do que apresentações nos primeiros 70% da reunião',
      'Prescrição: Só apresente a solução depois de entender 100% a dor',
      'Personalização: Adapte a apresentação para o contexto específico do cliente',
      'Acompanhamento: Monitore resultados e sugira melhorias proativamente',
    ],
    whenToUse: 'Vendas complexas, serviços, quando o cliente precisa de solução sob medida.',
  },
];

// ==================== GATILHOS DE URGÊNCIA ====================

export const URGENCY_TRIGGERS: UrgencyTrigger[] = [
  {
    id: 'urg1', category: 'Prazo', icon: '⏰',
    phrases: [
      'Essa condição é válida até sexta-feira.',
      'O preço atual muda no dia [data]. Depois disso, sobe X%.',
      'A tabela de preços atualiza no próximo mês.',
      'Essa promoção encerra quando bater [X unidades vendidas].',
    ],
  },
  {
    id: 'urg2', category: 'Exclusividade', icon: '👑',
    phrases: [
      'Só consigo essa condição para os 3 primeiros que fecharem.',
      'Essa é uma condição que eu negociei especialmente para você.',
      'Temos estoque limitado — só restam X unidades.',
      'Essa condição é para clientes indicados como você.',
    ],
  },
  {
    id: 'urg3', category: 'Perda', icon: '📉',
    phrases: [
      'Sem isso, vocês continuam perdendo R$ X por mês.',
      'Cada dia sem agir custa [valor] em oportunidade perdida.',
      'Seu concorrente já está usando isso. O gap só aumenta.',
      'O problema não vai se resolver sozinho — e vai custar mais depois.',
    ],
  },
  {
    id: 'urg4', category: 'Comparação temporal', icon: '📊',
    phrases: [
      'Daqui a 6 meses o preço será Y% maior.',
      'Se tivesse começado 3 meses atrás, já teria recuperado o investimento.',
      'Ano passado o valor era X. Hoje é Y. Ano que vem será Z.',
      'Quem fechou há 1 ano já está no retorno positivo.',
    ],
  },
  {
    id: 'urg5', category: 'Prova social', icon: '👥',
    phrases: [
      '3 empresas do seu setor fecharam essa semana.',
      'X% dos líderes do seu mercado já adotaram essa solução.',
      'Nosso cliente [nome similar] hesitou igual e hoje agradece que fechou.',
      'O mercado está migrando. Quem não se adaptar fica para trás.',
    ],
  },
];

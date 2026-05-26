/**
 * Vocabulário contextualizado por segmento para as páginas de pré/pós atendimento.
 * Centralizado aqui para manter consistência em toda a app.
 */

export interface SegmentLang {
  // Substantivos chave
  sessionNoun: string;       // "reunião" | "visita" | "test drive" | "demo" | "atendimento"
  clientNoun: string;        // "cliente" | "paciente" | "aluno" | "produtor"
  sessionNounPlural: string; // "reuniões" | "visitas" | etc.

  // Pré-sessão
  preTitle: string;          // "Modo Pré-reunião" | "Modo Pré-visita"
  preDesc: string;
  checklist: string[];
  notesPlaceholder: string;

  // Pós-sessão
  postTitle: string;
  postDesc: string;
  relatoLabel: string;       // "Relato da reunião"
  relatoPlaceholder: string;
  analyzeBtn: string;        // "Analisar reunião"
  resetBtn: string;          // "Analisar outra reunião"
  shareTitle: string;        // "RESUMO DA REUNIÃO"
  exampleRelato: string;
}

const LANG: Record<string, SegmentLang> = {
  // ── Automotivo ───────────────────────────────────────────────────────────
  automotivo: {
    sessionNoun: 'test drive',
    clientNoun: 'cliente',
    sessionNounPlural: 'test drives',
    preTitle: 'Modo Pré-test drive',
    preDesc: 'Prepare-se em 2 minutos antes de cada test drive',
    checklist: [
      'Revisei o histórico e interesse do cliente',
      'Conheço bem o modelo que vai ser testado',
      'Preparei simulação de financiamento',
      'Sei quais objeções esperar (preço, concorrente, troca)',
      'Tenho os diferenciais do modelo na ponta da língua',
      'Confirmei horário e dados do cliente',
    ],
    notesPlaceholder: 'Nome do cliente, modelo de interesse, veículo de troca, orçamento...',
    postTitle: 'Análise pós-test drive',
    postDesc: 'Conte como foi o test drive em 1-2 minutos. A IA extrai resumo, objeções e próximos passos.',
    relatoLabel: 'Relato do test drive',
    relatoPlaceholder: 'Escreva aqui como foi o test drive...',
    analyzeBtn: 'Analisar test drive',
    resetBtn: 'Analisar outro test drive',
    shareTitle: 'RESUMO DO TEST DRIVE',
    exampleRelato: 'O test drive com o Rafael foi muito positivo. Ele adorou o Corolla Cross, mas ficou em dúvida pelo preço. A mulher dele precisa aprovar. Tem um Civic 2021 para dar de troca. Combinamos de eu enviar a simulação com a avaliação do carro dele até amanhã.',
  },
  automotivo_luxo: {
    sessionNoun: 'test drive',
    clientNoun: 'cliente',
    sessionNounPlural: 'test drives',
    preTitle: 'Modo Pré-test drive',
    preDesc: 'Prepare-se em 2 minutos antes de cada test drive premium',
    checklist: [
      'Revisei o perfil e histórico de compras do cliente',
      'Conheço cada detalhe do modelo que vai ser testado',
      'Preparei comparativo com concorrentes premium',
      'Sei quais objeções esperar (prazo de entrega, personalização)',
      'Tenho opções de acessórios e pacotes prontas',
      'Confirmei horário e organização da experiência',
    ],
    notesPlaceholder: 'Nome do cliente, modelo de interesse, configuração desejada, veículo atual...',
    postTitle: 'Análise pós-test drive',
    postDesc: 'Conte como foi o test drive em 1-2 minutos. A IA extrai resumo, objeções e próximos passos.',
    relatoLabel: 'Relato do test drive',
    relatoPlaceholder: 'Escreva aqui como foi o test drive...',
    analyzeBtn: 'Analisar test drive',
    resetBtn: 'Analisar outro test drive',
    shareTitle: 'RESUMO DO TEST DRIVE',
    exampleRelato: 'O test drive com a Dra. Beatriz foi excelente. Ela ficou impressionada com o sistema de suspensão. O único ponto foi o prazo de entrega do modelo com a configuração que ela quer, que é 90 dias. Vou verificar se há um em estoque com configuração similar e retornar amanhã.',
  },

  // ── Farmacêutico ─────────────────────────────────────────────────────────
  farmaceutico: {
    sessionNoun: 'atendimento',
    clientNoun: 'cliente',
    sessionNounPlural: 'atendimentos',
    preTitle: 'Modo Pré-atendimento',
    preDesc: 'Prepare-se em 2 minutos antes do turno ou de um atendimento importante',
    checklist: [
      'Sei quais lançamentos e novidades chegaram essa semana',
      'Tenho em mente as metas do dia por categoria',
      'Preparei respostas para "genérico é igual"',
      'Conheço as promoções e condições vigentes',
      'Sei os produtos de maior margem em destaque',
      'Estou pronto para o turno',
    ],
    notesPlaceholder: 'Cliente, produto de interesse, histórico de compras, ponto de atenção...',
    postTitle: 'Análise pós-atendimento',
    postDesc: 'Conte como foi o atendimento em 1-2 minutos. A IA extrai o que aprender.',
    relatoLabel: 'Relato do atendimento',
    relatoPlaceholder: 'Escreva aqui como foi o atendimento...',
    analyzeBtn: 'Analisar atendimento',
    resetBtn: 'Analisar outro atendimento',
    shareTitle: 'RESUMO DO ATENDIMENTO',
    exampleRelato: 'O cliente veio pedir o genérico do Dorflex. Tentei mostrar o benefício do de referência mas ele insistiu no preço. No fim levou o genérico mas aproveitei para oferecer um vitamínico que estava em promoção e ele aceitou. Preciso melhorar a abordagem de upsell logo no início.',
  },

  // ── Varejo ───────────────────────────────────────────────────────────────
  varejo: {
    sessionNoun: 'atendimento',
    clientNoun: 'cliente',
    sessionNounPlural: 'atendimentos',
    preTitle: 'Modo Pré-atendimento',
    preDesc: 'Prepare-se antes de abordar um cliente importante',
    checklist: [
      'Sei as promoções e metas do dia',
      'Conheço os produtos em destaque e de maior margem',
      'Preparei abordagem para upsell e cross-sell',
      'Sei responder as principais objeções de preço',
      'O ambiente está organizado e o estoque conferido',
      'Estou pronto para o turno',
    ],
    notesPlaceholder: 'Cliente, produto de interesse, orçamento, histórico...',
    postTitle: 'Análise pós-atendimento',
    postDesc: 'Conte como foi o atendimento. A IA extrai o que melhorar.',
    relatoLabel: 'Relato do atendimento',
    relatoPlaceholder: 'Escreva aqui como foi o atendimento...',
    analyzeBtn: 'Analisar atendimento',
    resetBtn: 'Analisar outro atendimento',
    shareTitle: 'RESUMO DO ATENDIMENTO',
    exampleRelato: 'Cliente veio comprar só uma calça mas consegui mostrar uma camiseta que combina. No fim levou os dois. O ponto de atenção foi o tempo de espera no caixa que ele reclamou.',
  },

  // ── Saúde / Estética ──────────────────────────────────────────────────────
  saude: {
    sessionNoun: 'consulta',
    clientNoun: 'paciente',
    sessionNounPlural: 'consultas',
    preTitle: 'Modo Pré-consulta',
    preDesc: 'Prepare-se em 2 minutos antes de cada consulta ou sessão',
    checklist: [
      'Revisei o histórico do paciente',
      'Tenho o objetivo da consulta claro',
      'Preparei as perguntas de anamnese relevantes',
      'Sei quais objeções esperar (preço, prazo, resultado)',
      'Tenho o plano de tratamento pronto para apresentar',
      'Confirmei horário e dados do paciente',
    ],
    notesPlaceholder: 'Nome do paciente, histórico, objetivo, pontos de atenção...',
    postTitle: 'Análise pós-consulta',
    postDesc: 'Conte como foi a consulta em 1-2 minutos. A IA extrai resumo e próximos passos.',
    relatoLabel: 'Relato da consulta',
    relatoPlaceholder: 'Escreva aqui como foi a consulta...',
    analyzeBtn: 'Analisar consulta',
    resetBtn: 'Analisar outra consulta',
    shareTitle: 'RESUMO DA CONSULTA',
    exampleRelato: 'A paciente Maria veio para avaliação facial. Interessada em preenchimento mas ficou em dúvida pelo valor. Mostrei o antes/depois de casos similares e ela ficou mais confiante. Vou enviar uma proposta com parcelamento até sexta.',
  },

  // ── Educação ─────────────────────────────────────────────────────────────
  educacao: {
    sessionNoun: 'apresentação',
    clientNoun: 'responsável',
    sessionNounPlural: 'apresentações',
    preTitle: 'Modo Pré-apresentação',
    preDesc: 'Prepare-se antes de cada apresentação ou reunião com responsável',
    checklist: [
      'Revisei o perfil e interesse do aluno/responsável',
      'Tenho o objetivo da conversa claro',
      'Preparei os diferenciais da instituição para o perfil',
      'Sei quais objeções esperar (mensalidade, distância, concorrente)',
      'Tenho simulação de bolsa/parcelamento pronta',
      'Confirmei horário e participantes',
    ],
    notesPlaceholder: 'Nome do aluno, curso de interesse, orçamento, escola concorrente...',
    postTitle: 'Análise pós-apresentação',
    postDesc: 'Conte como foi a apresentação. A IA extrai próximos passos.',
    relatoLabel: 'Relato da apresentação',
    relatoPlaceholder: 'Escreva aqui como foi a apresentação...',
    analyzeBtn: 'Analisar apresentação',
    resetBtn: 'Analisar outra apresentação',
    shareTitle: 'RESUMO DA APRESENTAÇÃO',
    exampleRelato: 'O Carlos e a mãe vieram conhecer o curso de Engenharia. Ele gostou muito da infraestrutura do laboratório. A mãe ficou preocupada com o valor da mensalidade. Vou enviar a simulação com o FIES e o desconto de pontualidade até amanhã.',
  },

  // ── Imobiliário ───────────────────────────────────────────────────────────
  imobiliario: {
    sessionNoun: 'visita',
    clientNoun: 'cliente',
    sessionNounPlural: 'visitas',
    preTitle: 'Modo Pré-visita',
    preDesc: 'Prepare-se em 2 minutos antes de cada visita ao imóvel',
    checklist: [
      'Revisei o perfil e preferências do cliente',
      'Conheço bem o imóvel: metragem, condomínio, diferenciais',
      'Preparei comparativos de imóveis similares na região',
      'Sei quais objeções esperar (preço, localização, prazo)',
      'Tenho tabela de preços e condições de pagamento',
      'Confirmei horário e endereço',
    ],
    notesPlaceholder: 'Nome do cliente, perfil de imóvel desejado, orçamento, situação atual...',
    postTitle: 'Análise pós-visita',
    postDesc: 'Conte como foi a visita em 1-2 minutos. A IA extrai objeções e próximos passos.',
    relatoLabel: 'Relato da visita',
    relatoPlaceholder: 'Escreva aqui como foi a visita...',
    analyzeBtn: 'Analisar visita',
    resetBtn: 'Analisar outra visita',
    shareTitle: 'RESUMO DA VISITA',
    exampleRelato: 'A visita com o casal Silva foi boa. Gostaram muito da planta e da localização. O ponto que travou foi o valor do condomínio que ficou acima do esperado. Vou verificar se tem algum imóvel no mesmo bairro com condomínio menor para mostrar como alternativa.',
  },

  // ── Tecnologia ────────────────────────────────────────────────────────────
  tecnologia: {
    sessionNoun: 'demo',
    clientNoun: 'cliente',
    sessionNounPlural: 'demos',
    preTitle: 'Modo Pré-demo',
    preDesc: 'Prepare-se em 2 minutos antes de cada demo ou call de vendas',
    checklist: [
      'Revisei o stack atual e desafios do cliente',
      'Tenho o objetivo da demo claro (problema a resolver)',
      'Preparei os casos de uso mais relevantes para o segmento',
      'Sei quais objeções esperar (preço, integração, migração)',
      'Tenho proposta ou trial pronto para avançar',
      'Confirmei participantes e nível técnico na call',
    ],
    notesPlaceholder: 'Empresa, stack atual, problema principal, decisores na call...',
    postTitle: 'Análise pós-demo',
    postDesc: 'Conte como foi a demo em 1-2 minutos. A IA extrai próximos passos e sinais de compra.',
    relatoLabel: 'Relato da demo',
    relatoPlaceholder: 'Escreva aqui como foi a demo...',
    analyzeBtn: 'Analisar demo',
    resetBtn: 'Analisar outra demo',
    shareTitle: 'RESUMO DA DEMO',
    exampleRelato: 'A demo com a Fintech X foi ótima. O CTO adorou a integração via API. Mas o CFO travou no valor do contrato anual. Combinamos de eu enviar uma proposta com opção mensal e agendar uma call de fechamento para a próxima semana.',
  },

  // ── Financeiro ───────────────────────────────────────────────────────────
  financeiro: {
    sessionNoun: 'reunião',
    clientNoun: 'cliente',
    sessionNounPlural: 'reuniões',
    preTitle: 'Modo Pré-reunião',
    preDesc: 'Prepare-se em 2 minutos antes de cada reunião com o cliente',
    checklist: [
      'Revisei o perfil financeiro e histórico do cliente',
      'Tenho o objetivo da reunião claro',
      'Preparei simulações e propostas personalizadas',
      'Sei quais objeções esperar (taxa, carência, concorrente)',
      'Tenho documentação e compliance em ordem',
      'Confirmei horário e participantes',
    ],
    notesPlaceholder: 'Nome do cliente, produto de interesse, perfil de risco, situação atual...',
    postTitle: 'Análise pós-reunião',
    postDesc: 'Conte como foi a reunião em 1-2 minutos. A IA extrai resumo e próximos passos.',
    relatoLabel: 'Relato da reunião',
    relatoPlaceholder: 'Escreva aqui como foi a reunião...',
    analyzeBtn: 'Analisar reunião',
    resetBtn: 'Analisar outra reunião',
    shareTitle: 'RESUMO DA REUNIÃO',
    exampleRelato: 'A reunião com o cliente foi positiva. Ele está interessado no plano de previdência mas quer comparar com o concorrente antes. Combinamos de eu enviar o comparativo até quinta e ligar na sexta para fechar.',
  },

  // ── Bebidas Alcoólicas ───────────────────────────────────────────────────
  bebidas_alcoolicas: {
    sessionNoun: 'visita',
    clientNoun: 'cliente',
    sessionNounPlural: 'visitas',
    preTitle: 'Modo Pré-visita',
    preDesc: 'Prepare-se em 2 minutos antes de cada visita ao PDV ou cliente',
    checklist: [
      'Revisei o histórico de pedidos do PDV',
      'Tenho o objetivo da visita claro (volume, novo produto, cobrança)',
      'Sei as promoções e condições do mês',
      'Preparei argumentos para aumentar mix ou volume',
      'Tenho pedido mínimo e condições de pagamento na ponta da língua',
      'Confirmei horário com o responsável',
    ],
    notesPlaceholder: 'Nome do PDV, histórico de pedidos, objetivo da visita, responsável...',
    postTitle: 'Análise pós-visita',
    postDesc: 'Conte como foi a visita. A IA extrai o que acompanhar.',
    relatoLabel: 'Relato da visita',
    relatoPlaceholder: 'Escreva aqui como foi a visita ao PDV...',
    analyzeBtn: 'Analisar visita',
    resetBtn: 'Analisar outra visita',
    shareTitle: 'RESUMO DA VISITA',
    exampleRelato: 'Visita ao Bar do João. Ele topou entrar com o novo IPA mas pediu desconto na caixa. Negociei e fechamos 3 caixas com 5% de desconto. Não quis aumentar o volume de pilsen ainda, vou voltar daqui 15 dias.',
  },

  bebidas_alcoolicas_vinho: {
    sessionNoun: 'degustação',
    clientNoun: 'cliente',
    sessionNounPlural: 'degustações',
    preTitle: 'Modo Pré-degustação',
    preDesc: 'Prepare-se em 2 minutos antes de cada visita ou degustação',
    checklist: [
      'Revisei o perfil de preferência do cliente/PDV',
      'Conheço bem os vinhos que vou apresentar (safra, região, harmonização)',
      'Preparei a sequência da degustação',
      'Sei quais objeções esperar (preço, giro, importado vs. nacional)',
      'Tenho condições especiais e embalagem presenteável',
      'Confirmei horário e quem vai participar',
    ],
    notesPlaceholder: 'Nome do cliente, preferência de uva/região, orçamento, ocasião...',
    postTitle: 'Análise pós-degustação',
    postDesc: 'Conte como foi a degustação. A IA extrai o que acompanhar.',
    relatoLabel: 'Relato da degustação',
    relatoPlaceholder: 'Escreva aqui como foi a degustação...',
    analyzeBtn: 'Analisar degustação',
    resetBtn: 'Analisar outra degustação',
    shareTitle: 'RESUMO DA DEGUSTAÇÃO',
    exampleRelato: 'Degustação com o restaurante Bella Vista. O sommelier adorou o Malbec argentino mas o gerente reclamou do preço. Ficou de falar com o dono. Vou ligar na sexta para saber a decisão.',
  },

  // ── Indústria ─────────────────────────────────────────────────────────────
  industria: {
    sessionNoun: 'reunião',
    clientNoun: 'cliente',
    sessionNounPlural: 'reuniões',
    preTitle: 'Modo Pré-reunião',
    preDesc: 'Prepare-se em 2 minutos antes de cada reunião comercial',
    checklist: [
      'Revisei o histórico e volume do cliente',
      'Tenho o objetivo da reunião claro',
      'Preparei proposta técnica e comparativo',
      'Sei quais objeções esperar (prazo, qualidade, preço)',
      'Tenho amostras ou materiais prontos',
      'Confirmei horário e participantes da reunião',
    ],
    notesPlaceholder: 'Nome do cliente, produto de interesse, volume, decisores...',
    postTitle: 'Análise pós-reunião',
    postDesc: 'Conte como foi a reunião. A IA extrai próximos passos.',
    relatoLabel: 'Relato da reunião',
    relatoPlaceholder: 'Escreva aqui como foi a reunião...',
    analyzeBtn: 'Analisar reunião',
    resetBtn: 'Analisar outra reunião',
    shareTitle: 'RESUMO DA REUNIÃO',
    exampleRelato: 'A reunião com a fábrica foi bem. O gerente de compras quer aumentar o volume mas pediu prazo de entrega menor. Preciso verificar com o estoque e retornar até quarta.',
  },

  // ── Agronegócio ───────────────────────────────────────────────────────────
  agro: {
    sessionNoun: 'visita',
    clientNoun: 'produtor',
    sessionNounPlural: 'visitas',
    preTitle: 'Modo Pré-visita',
    preDesc: 'Prepare-se em 2 minutos antes de cada visita à propriedade',
    checklist: [
      'Revisei o histórico de compras do produtor',
      'Conheço a cultura e fase da safra atual',
      'Preparei recomendações técnicas para a realidade dele',
      'Sei quais objeções esperar (preço, crédito, concorrente)',
      'Tenho condições de pagamento e prazo alinhados',
      'Confirmei horário e como chegar à propriedade',
    ],
    notesPlaceholder: 'Nome do produtor, cultura, área, fase da safra, histórico...',
    postTitle: 'Análise pós-visita',
    postDesc: 'Conte como foi a visita. A IA extrai o que acompanhar.',
    relatoLabel: 'Relato da visita',
    relatoPlaceholder: 'Escreva aqui como foi a visita à propriedade...',
    analyzeBtn: 'Analisar visita',
    resetBtn: 'Analisar outra visita',
    shareTitle: 'RESUMO DA VISITA',
    exampleRelato: 'Visita ao Seu Antônio. A soja está em fase de floração e ele precisa de fungicida. Fechamos o pedido mas ele quer parcelamento em 3x. Combinei de confirmar a aprovação do crédito até segunda.',
  },

  // ── Energia ───────────────────────────────────────────────────────────────
  energia: {
    sessionNoun: 'visita técnica',
    clientNoun: 'cliente',
    sessionNounPlural: 'visitas técnicas',
    preTitle: 'Modo Pré-visita técnica',
    preDesc: 'Prepare-se antes de cada visita técnica ou apresentação de proposta',
    checklist: [
      'Revisei o consumo e perfil energético do cliente',
      'Tenho o dimensionamento do sistema pronto',
      'Preparei o retorno sobre investimento (ROI) estimado',
      'Sei quais objeções esperar (prazo de retorno, financiamento, telhado)',
      'Tenho proposta e condições de financiamento atualizadas',
      'Confirmei horário e endereço da visita',
    ],
    notesPlaceholder: 'Nome do cliente, consumo médio (kWh), tipo de telhado, interesse em financiamento...',
    postTitle: 'Análise pós-visita',
    postDesc: 'Conte como foi a visita técnica. A IA extrai próximos passos.',
    relatoLabel: 'Relato da visita técnica',
    relatoPlaceholder: 'Escreva aqui como foi a visita técnica...',
    analyzeBtn: 'Analisar visita',
    resetBtn: 'Analisar outra visita',
    shareTitle: 'RESUMO DA VISITA TÉCNICA',
    exampleRelato: 'Visita técnica na empresa do Sr. Paulo. O telhado é ideal para 24 painéis. Ele gostou muito do ROI de 4 anos mas quer financiar pelo banco dele. Vou enviar a proposta para o financiamento próprio e comparar com o nosso até quarta.',
  },

  // ── Serviços / Consultoria ─────────────────────────────────────────────────
  servicos: {
    sessionNoun: 'reunião',
    clientNoun: 'cliente',
    sessionNounPlural: 'reuniões',
    preTitle: 'Modo Pré-reunião',
    preDesc: 'Prepare-se em 2 minutos antes de cada reunião de consultoria',
    checklist: [
      'Revisei o diagnóstico e histórico do cliente',
      'Tenho o objetivo da reunião claro',
      'Preparei cases e resultados relevantes para o segmento',
      'Sei quais objeções esperar (valor, prazo, ROI)',
      'Tenho proposta de escopo pronta para avançar',
      'Confirmei horário e participantes',
    ],
    notesPlaceholder: 'Nome do cliente, desafio principal, decisores, orçamento disponível...',
    postTitle: 'Análise pós-reunião',
    postDesc: 'Conte como foi a reunião. A IA extrai próximos passos.',
    relatoLabel: 'Relato da reunião',
    relatoPlaceholder: 'Escreva aqui como foi a reunião...',
    analyzeBtn: 'Analisar reunião',
    resetBtn: 'Analisar outra reunião',
    shareTitle: 'RESUMO DA REUNIÃO',
    exampleRelato: 'A reunião com a empresa foi bem. O diretor quer o projeto mas o CFO quer reduzir o escopo para caber no orçamento. Vou montar uma proposta modular com fase 1 mais enxuta e enviar até quinta.',
  },
};

// Default para segmentos não mapeados
const DEFAULT_LANG: SegmentLang = {
  sessionNoun: 'reunião',
  clientNoun: 'cliente',
  sessionNounPlural: 'reuniões',
  preTitle: 'Modo Pré-reunião',
  preDesc: 'Prepare-se em 2 minutos antes de cada encontro',
  checklist: [
    'Revisei o histórico do cliente',
    'Tenho o objetivo da reunião claro',
    'Preparei perguntas de descoberta',
    'Sei quais objeções esperar',
    'Tenho proposta/material pronto',
    'Confirmei horário e participantes',
  ],
  notesPlaceholder: 'Nome do cliente, contexto, objetivo da reunião, pontos de atenção...',
  postTitle: 'Análise pós-reunião',
  postDesc: 'Conte como foi a reunião em 1-2 minutos. A IA extrai resumo, objeções e próximos passos.',
  relatoLabel: 'Relato da reunião',
  relatoPlaceholder: 'Escreva aqui como foi a reunião...',
  analyzeBtn: 'Analisar reunião',
  resetBtn: 'Analisar outra reunião',
  shareTitle: 'RESUMO DA REUNIÃO',
  exampleRelato: 'A reunião com a Alpha foi interessante. O João é o diretor e pareceu bem interessado. Já a Maria, que é a compradora, bateu muito na questão do preço. Combinamos que eu vou enviar o comparativo até sexta e marcar nova reunião na segunda.',
};

export function getSegmentLang(segment: string): SegmentLang {
  return LANG[segment] || DEFAULT_LANG;
}

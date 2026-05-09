# GSS Maestria em Vendas — Feature Spec v1.0

**Data:** 11/04/2026
**Plataforma:** Web (React + TypeScript + Vite)
**Deploy:** Vercel — https://gss-weld.vercel.app
**Repositório:** https://github.com/viviangitti/gss-academy-app

---

## Proposta de Valor

1. Ajudar vendedores e gerentes a **debater objeções com confiança**
2. Ajudar vendedores a **se organizarem antes e depois das reuniões**

---

## Estado Atual (já implementado)

- Calendário com eventos por categoria
- 5 listas pré-definidas (antes da reunião, ritual matinal, etc.)
- Biblioteca de objeções com respostas (geral + por segmento)
- Roteiros prontos (ligação fria, WhatsApp, e-mail, etc.)
- 8 técnicas de vendas com passo a passo
- Chat com IA (Gemini) especializado em vendas
- Notícias por segmento (Google News)
- Modo pré-reunião (checklist + objeções + técnicas numa tela)
- Personalização por segmento (12 segmentos)
- Dados salvos em localStorage

---

## Decisão Técnica Pendente: Backend

Atualmente o app usa **localStorage** (dados ficam no navegador). Para as features abaixo, várias precisam de **persistência real** (histórico por cliente, dados entre dispositivos, dashboard). Recomendação:

| Opção | Prós | Contras |
|-------|------|---------|
| **Firebase** (Firestore + Auth) | Rápido de implementar, tempo real, gratuito até 50k leituras/dia | Vendor lock-in, custos escalam |
| **Supabase** (Postgres + Auth) | SQL, open source, mais flexível | Mais setup inicial |
| **localStorage + exportação** | Zero custo, sem backend | Sem sync entre dispositivos, perde dados se limpar navegador |

**Recomendação:** Firebase para MVP (velocidade), migrar para Supabase se escalar.

---

## Módulo 1 — Debater Objeções

### F1.1 — Simulador de Treino com IA (Role-Play)

**O que é:** O vendedor treina rebater objeções conversando com a IA, que age como um cliente difícil.

**Fluxo:**
1. Vendedor escolhe uma objeção para treinar (ex: "Está caro")
2. IA assume papel de cliente difícil e complica a objeção
3. Vendedor digita sua resposta
4. IA responde como cliente (insiste, questiona, levanta novas objeções)
5. Após 3-5 trocas, IA encerra e mostra:
   - Nota de 1 a 10
   - O que o vendedor fez bem
   - O que poderia melhorar
   - Resposta modelo ideal

**Tela:** Nova seção dentro de "Pergunte à IA" com botão "Treinar Objeção"

**Dependências:** Gemini API (já integrado)

**Observações técnicas:**
- Usar system prompt específico para modo role-play
- Limitar a 5 trocas para não gastar tokens demais
- Salvar histórico de treinos para acompanhar evolução

---

### F1.2 — Cards de Resposta Rápida

**O que é:** Respostas curtas e impactantes (1 frase) para cada objeção. Diferente da biblioteca atual que tem parágrafos.

**Fluxo:**
1. Vendedor abre objeção
2. Vê 2-3 frases curtas de impacto (formato card, swipe horizontal)
3. Botão de ouvir (TTS) em cada card
4. Botão de copiar

**Exemplo:**
- Objeção: "Está caro"
- Card 1: "Caro é perder R$ X por mês sem essa solução."
- Card 2: "Quanto te custa NÃO resolver esse problema?"
- Card 3: "Nosso cliente Y achava o mesmo. Hoje o retorno dele é 3x."

**Observações técnicas:**
- Reformatar as respostas existentes para versão curta (1 frase de impacto)
- Manter as respostas longas na aba "Ver mais"
- Cards com swipe horizontal (CSS scroll-snap)

**O que muda do atual:** Hoje as respostas são parágrafos longos. Vendedor precisa de frase rápida antes de entrar na reunião, não textão.

---

### F1.3 — Objeções por Estágio do Funil

**O que é:** A mesma objeção tem respostas diferentes dependendo do momento da venda.

**Estágios:**
1. **Prospecção** — Primeiro contato, cliente não te conhece
2. **Qualificação** — Cliente conhece mas ainda não viu valor
3. **Apresentação** — Cliente viu a proposta
4. **Negociação** — Cliente quer fechar mas tenta condições melhores
5. **Fechamento** — Último empurrão

**Exemplo prático:**
- "Está caro" na **prospecção** → "Entendo, ainda nem mostrei o valor. Me dá 5 minutos?"
- "Está caro" na **negociação** → "O valor reflete o resultado. Posso ajustar as condições de pagamento."

**Observações técnicas:**
- Adicionar campo `stage` ao tipo Objection
- Filtro por estágio na tela de objeções
- As objeções por segmento também devem ter estágio

---

### F1.4 — "Erro Comum" por Objeção

**O que é:** Antes de mostrar a resposta ideal, exibir o que a maioria dos vendedores faz ERRADO.

**Formato:**
```
❌ O que NÃO fazer:
"Dar desconto imediato sem explorar o valor"

✅ O que fazer:
"Investigar o que está por trás do 'caro' antes de negociar preço"
```

**Observações técnicas:**
- Adicionar campo `commonMistake: string` ao tipo Objection
- Exibir como alerta vermelho antes das respostas
- Conteúdo pode ser gerado em lote pela IA e depois curado manualmente

---

### F1.5 — Áudio das Respostas (Texto para Fala)

**O que é:** Botão de play em cada resposta de objeção. Vendedor ouve no fone antes de entrar na reunião.

**Implementação:**
- Usar Web Speech API nativa do navegador (`speechSynthesis`)
- Sem custo de API externa
- Voz em português brasileiro
- Botão de play/pause em cada card de resposta

**Observações técnicas:**
- `speechSynthesis` é gratuito e funciona offline
- Qualidade da voz varia por dispositivo
- Alternativa premium: Google Cloud TTS ou ElevenLabs (custo por caractere)
- Para MVP, Web Speech API é suficiente

---

### F1.6 — Histórico de Objeções por Cliente

**O que é:** Após cada reunião, vendedor marca quais objeções o cliente trouxe. Com o tempo, IA detecta padrões.

**Fluxo:**
1. Após reunião, tela pergunta: "Quais objeções surgiram?"
2. Vendedor seleciona de uma lista
3. Dados ficam vinculados ao cliente
4. Dashboard mostra: "Você enfrentou 'Está caro' 5x esta semana"
5. IA sugere: "Parece que seu mercado está sensível a preço. Tente liderar pela dor."

**Dependências:** Backend (Firebase/Supabase) para persistir dados por cliente

**Observações técnicas:**
- Precisa de modelo de dados: Cliente → Reuniões → Objeções
- Pode começar simples: lista de clientes com tags de objeções
- Analytics básico pode rodar no frontend com os dados do localStorage (MVP)

---

### F1.7 — Gatilhos de Urgência

**O que é:** Biblioteca de frases que criam urgência legítima (sem ser apelativo).

**Categorias:**
- **Prazo:** "Essa condição é válida até sexta"
- **Exclusividade:** "Só consigo essa condição para os 3 primeiros"
- **Perda:** "Sem isso, vocês continuam perdendo R$ X por mês"
- **Comparação temporal:** "Daqui a 6 meses o preço será Y% maior"
- **Prova social:** "3 empresas do seu setor fecharam essa semana"

**Observações técnicas:**
- Conteúdo estático, sem dependência de backend
- Pode ser uma sub-seção da tela de Objeções ou card separado no hub de Conteúdo
- Personalizar por segmento (urgências diferentes para cada mercado)

---

## Módulo 2 — Se Organizar

### F2.1 — Lista de Pré-Reunião (já existe, melhorar)

**Melhorias sobre o atual:**
- Vincular ao evento do calendário (ao criar evento, já associar checklist)
- Itens dinâmicos baseados no tipo de reunião:
  - Primeira reunião → checklist de prospecção
  - Reunião de proposta → checklist de negociação
  - Reunião de fechamento → checklist de fechamento
- Mostrar objeções que o cliente já trouxe (se houver histórico)

---

### F2.2 — Agenda com Meta Diária

**O que é:** A agenda mostra não só os compromissos, mas quanto falta para bater a meta.

**Elementos:**
- Barra de progresso da meta mensal no topo
- Cada reunião mostra valor potencial da oportunidade
- Soma automática: "Hoje você tem R$ 45k em reuniões"
- Indicador: "Faltam R$ 120k para bater a meta"

**Dependências:**
- Campo de meta mensal no perfil do usuário
- Campo de valor estimado por evento no calendário

**Observações técnicas:**
- Adicionar `value: number` (opcional) ao tipo CalendarEvent
- Adicionar `monthlyGoal: number` ao tipo UserProfile
- Cálculo e exibição podem ser feitos no frontend

---

### F2.3 — Tarefas Automáticas Pós-Reunião

**Fluxo:**
1. Quando o horário do evento passa, notificação pergunta: "Como foi a reunião?"
2. Opções: "Fechei" / "Precisa de acompanhamento" / "Perdi"
3. Se "acompanhamento" → gera tarefa automática: "Enviar proposta até [data]"
4. Tarefa aparece no dashboard e na agenda

**Observações técnicas:**
- No MVP sem push notification: mostrar banner na Home quando houver reunião passada sem registro
- Criar modelo de Tarefa: `{ id, title, dueDate, linkedEventId, status }`
- Tarefas geradas pela IA com base no tipo de reunião

---

### F2.4 — Cronômetro de Reunião

**O que é:** Timer visível durante a reunião com alertas.

**Fluxo:**
1. Ao clicar "Vou entrar numa reunião" ou abrir evento, perguntar duração esperada (padrão: 30min)
2. Timer em tela cheia, visível durante a reunião
3. Alertas visuais: amarelo em 15min, vermelho em 5min
4. Ao encerrar, pergunta desfecho (vincula com F2.3)

**Observações técnicas:**
- Componente React simples com `setInterval`
- Vibração do celular nos alertas (`navigator.vibrate()`)
- Tela cheia com `document.fullscreenElement` (opcional)

---

### F2.5 — Resumo do Cliente (Briefing)

**O que é:** Resumo de 3 pontos antes da reunião.

**Formato:**
```
📋 Briefing — João da Silva (Empresa X)
• Última reunião: 15/03 — Apresentação de proposta
• Objeções citadas: "Está caro", "Preciso falar com o sócio"
• Última compra: R$ 12.000 em jan/2026
```

**Dependências:** Histórico de clientes (F1.6) e backend

**Observações técnicas:**
- No MVP, pode ser um campo de texto livre no evento do calendário (notas do cliente)
- Versão avançada: modelo de Cliente com histórico de interações
- IA pode gerar briefing automático baseado nas notas anteriores

---

### F2.6 — Notas por Reunião

**O que é:** Campo de anotações rápidas vinculado ao evento.

**Já parcialmente implementado:** O campo "Observações" no evento do calendário serve como notas. Melhorias:
- Aumentar o campo visualmente
- Permitir editar notas durante/após a reunião sem abrir modal
- Buscar em todas as notas (busca global)

---

### F2.7 — Painel Pessoal do Vendedor

**O que é:** Dashboard com métricas pessoais.

**Métricas:**
- Reuniões da semana (realizadas vs agendadas)
- Objeções mais frequentes (top 3)
- Progresso da meta mensal
- Dias consecutivos usando o app (sequência)
- Treinos de objeção realizados (F1.1)

**Dependências:** Backend para persistir dados históricos

**Observações técnicas:**
- MVP pode usar localStorage com dados do mês atual
- Gráficos simples com CSS (barras, donut) sem biblioteca externa
- Pode ser a nova Home ou uma sub-página do perfil

---

### F2.8 — Sugestão de Próximo Passo por Cliente

**O que é:** IA sugere ação para cada cliente com base no histórico.

**Exemplos:**
- "João não responde há 5 dias → Envie uma mensagem de reativação"
- "Maria pediu proposta há 3 dias → Ligue para acompanhar"
- "Pedro citou 'está caro' 3x → Prepare argumento de valor antes de ligar"

**Dependências:** Histórico de clientes + backend + IA

**Observações técnicas:**
- Feature avançada, depende de F1.6 e F2.3 implementados
- IA pode ser chamada 1x por dia para gerar sugestões em lote
- Exibir como cards na Home

---

## Módulo 3 — IA

### F3.1 — IA com Memória do Cliente

**O que é:** Ao perguntar à IA, ela já sabe o contexto do cliente específico.

**Exemplo:**
- "Como abordar o João?" → IA responde sabendo que João citou "está caro" e "preciso falar com sócio" nas últimas 2 reuniões.

**Dependências:** F1.6 (histórico por cliente) + backend

**Observações técnicas:**
- Injetar contexto do cliente no prompt do Gemini
- Formato: "O cliente João da Empresa X teve as seguintes interações: [lista]"
- Limitar contexto a últimas 5 interações para não estourar tokens

---

### F3.2 — Modo Áudio (Entrada e Saída)

**O que é:** Vendedor fala, IA responde com texto + áudio. Funciona no carro, no corredor, no táxi.

**Implementação:**
- **Entrada de voz:** Web Speech API (`SpeechRecognition`) — gratuito
- **Saída de voz:** Web Speech API (`speechSynthesis`) — gratuito
- Botão de microfone no campo de texto do chat
- Auto-play da resposta em áudio

**Observações técnicas:**
- `SpeechRecognition` funciona bem no Chrome/Android, limitado no iOS Safari
- Para iOS, alternativa: Whisper API da OpenAI (custo baixo, ~$0.006/min)
- MVP: implementar com Web Speech API e testar nos dispositivos dos usuários
- Fallback: se não suportar, esconder botão de microfone

**Compatibilidade:**
| Navegador | SpeechRecognition | speechSynthesis |
|-----------|-------------------|-----------------|
| Chrome Android | Sim | Sim |
| Safari iOS | Parcial (precisa interação) | Sim |
| Chrome Desktop | Sim | Sim |

---

### F3.3 — Sugestão de Próxima Pergunta

**O que é:** Durante o chat, IA sugere 2-3 perguntas que o vendedor pode fazer ao cliente.

**Implementação:**
- Após cada resposta da IA, exibir chips clicáveis com perguntas sugeridas
- Similar às "Sugestões rápidas" que já existem na tela inicial do chat
- Geradas dinamicamente com base no contexto da conversa

**Observações técnicas:**
- Pedir ao Gemini que inclua sugestões no formato: `[SUGESTÕES: pergunta1 | pergunta2 | pergunta3]`
- Parsear a resposta e exibir como chips separados
- Se não houver sugestões, não exibir

---

### F3.4 — Resumo Automático Pós-reunião

**O que é:** Após a reunião, IA gera resumo automático.

**Fluxo:**
1. Vendedor encerra reunião (F2.4)
2. Campo: "O que aconteceu? (voz ou texto)"
3. IA gera resumo em 3 pontos:
   - O que foi discutido
   - Próximo passo
   - Objeções levantadas
4. Resumo salvo no histórico do cliente

**Dependências:** F2.4 (timer), F1.6 (histórico), backend

---

## Módulo 4 — Experiência

### F4.1 — Onboarding em 3 Telas

**Telas:**
1. "Bem-vindo! Aqui você treina para rebater qualquer objeção" (ilustração de role-play)
2. "Organize suas reuniões e nunca entre despreparado" (ilustração de checklist)
3. "Configure seu segmento para conteúdo personalizado" (campo de seleção)

**Observações técnicas:**
- Exibir apenas no primeiro acesso (flag no localStorage)
- Swipe horizontal entre telas
- Botão "Pular" sempre visível
- Na tela 3, já salvar o segmento no perfil

---

### F4.2 — Pontuação e Nível

**Sistema de pontos:**
| Ação | Pontos |
|------|--------|
| Completar checklist pré-reunião | +10 |
| Treinar objeção no simulador | +20 |
| Registrar desfecho de reunião | +15 |
| Usar o app no dia (login diário) | +5 |
| Completar todos os itens de um ritual | +10 |

**Níveis:**
| Nível | Pontos | Título |
|-------|--------|--------|
| 1 | 0-50 | Iniciante |
| 2 | 51-150 | Vendedor |
| 3 | 151-350 | Especialista |
| 4 | 351-700 | Mestre |
| 5 | 701+ | Lenda |

**Exibição:** Badge no perfil + barra de progresso

**Observações técnicas:**
- Pontos salvos no localStorage (MVP) ou backend
- Calcular ao carregar app, não em tempo real
- Sequência de dias consecutivos (streak) como motivação extra

---

### F4.3 — Botão "Vou entrar numa reunião" (já existe)

**Melhorias:**
- Ao clicar, iniciar timer (F2.4) com duração padrão
- Mostrar briefing do cliente se houver (F2.5)
- Ao encerrar, perguntar desfecho (F2.3) e registrar objeções (F1.6)

---

## Ordem de Implementação Sugerida

### Fase 1 — Fundação (sem backend)
1. **F1.2** — Cards de resposta curta (reformatar conteúdo existente)
2. **F1.3** — Objeções por estágio do funil (adicionar campo + filtro)
3. **F1.4** — Erro comum por objeção (adicionar campo + visual)
4. **F1.5** — Áudio das respostas (Web Speech API, gratuito)
5. **F1.7** — Gatilhos de urgência (conteúdo estático)
6. **F4.1** — Onboarding 3 telas

### Fase 2 — IA Interativa (sem backend)
7. **F1.1** — Simulador de treino com IA (novo modo no chat Gemini)
8. **F3.3** — Sugestão de próxima pergunta (parser no chat)
9. **F3.2** — Modo áudio entrada + saída (Web Speech API)

### Fase 3 — Backend + Organização
10. Configurar **Firebase** (Auth + Firestore)
11. **F2.2** — Agenda com meta diária
12. **F2.4** — Cronômetro de reunião
13. **F2.3** — Tarefas automáticas pós-reunião
14. **F4.2** — Pontuação e nível

### Fase 4 — Inteligência
15. **F1.6** — Histórico de objeções por cliente
16. **F2.5** — Briefing do cliente
17. **F3.1** — IA com memória do cliente
18. **F3.4** — Resumo automático pós-reunião
19. **F2.7** — Painel pessoal
20. **F2.8** — Sugestão de próximo passo

---

## Notas Técnicas Gerais

**Stack atual:**
- React 19 + TypeScript + Vite
- CSS puro (sem framework CSS)
- Gemini 2.5 Flash (IA)
- localStorage (persistência)
- Vercel (deploy)
- lucide-react (ícones)

**Para adicionar:**
- Firebase Auth + Firestore (Fase 3)
- Web Speech API (Fases 1-2, nativo do navegador)
- PWA com Service Worker para funcionar offline (já tem manifest)

**Padrões do projeto:**
- Tudo em português (sem palavras em inglês nos textos visíveis)
- Mobile-first (max-width: 480px)
- Cores: azul escuro `#1a1a2e` + dourado `#c9a84c`
- Fonte base: 16px, mínima: 13px

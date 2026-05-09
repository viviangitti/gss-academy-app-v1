# 🚀 Pacote de Publicação — MAESTR.IA em Vendas

Bem-vindo ao guia completo de lançamento do app.

## 📂 O que tem nessa pasta

| Arquivo | Para quê |
|---------|----------|
| **README.md** | Este guia (checklist geral) |
| **PASSO-A-PASSO-PWABUILDER.md** | Como publicar na Google Play Store (detalhado) |
| **DESCRICAO-PLAY-STORE.md** | Textos prontos para ficha da loja |
| **MATERIAIS-DE-MARKETING.md** | Mensagens, posts, roteiros, slides |

---

## ✅ Checklist completo de lançamento

### 🏁 Antes de começar (o que já está pronto)

- [x] App funcionando em produção (https://gss-weld.vercel.app)
- [x] PWA configurado (manifest.json + service worker)
- [x] Política de privacidade (/privacidade)
- [x] Tutorial de instalação (/instalar)
- [x] Formulário de feedback (/feedback)
- [x] Gerador de ícones (/gerar-icones.html)
- [x] Gerador de QR code (/qrcode.html)

### 🔥 FASE 1 — Beta fechado (essa semana, 2 horas de trabalho)

#### Passo 1: Gerar QR Code
Abre no navegador:
```
https://gss-weld.vercel.app/qrcode.html
```
- Clica em "Baixar PNG (grande)" — vai baixar `qrcode-maestria-1024.png`
- Esse QR leva direto para `/instalar`

#### Passo 2: Convidar beta testers (5-10 pessoas)
- Use a mensagem do `MATERIAIS-DE-MARKETING.md` (seção 1 - curta)
- Anexe o QR code ou cole o link: `https://gss-weld.vercel.app/instalar`
- Escolha pessoas que vão USAR mesmo (não só abrir)

#### Passo 3: Criar grupo de feedback
- WhatsApp "MAESTR.IA Beta"
- Adicione os testers
- Combine 2 semanas de teste

#### Passo 4: Acompanhar uso
- Pedir pra usarem diariamente
- Coletar feedback pelo próprio app (tela /feedback → WhatsApp)
- Anotar todos os bugs e sugestões

### 🎨 FASE 2 — Preparar assets Play Store (1 dia de trabalho)

#### Passo 1: Gerar ícones PNG
```
https://gss-weld.vercel.app/gerar-icones.html
```
- Clica em "Baixar TODOS"
- Salva os 9 PNGs em pasta `icones-maestria/`

#### Passo 2: Fazer screenshots
No celular:
- Configure perfil completo (nome, segmento, meta R$ 100k)
- Registre 2-3 vendas fictícias (pra mostrar o gráfico)
- Use Pesquisar, Coach Mensagem, Pós-reunião pra ter conteúdo no histórico
- Tire prints de cada tela principal (lista no `DESCRICAO-PLAY-STORE.md`)

#### Passo 3: Criar Feature Graphic
- Use Canva.com (gratuito)
- Dimensão: 1024 x 500 px
- Template no `DESCRICAO-PLAY-STORE.md`

### 🏪 FASE 3 — Google Play Store (2-3 horas)

Siga o `PASSO-A-PASSO-PWABUILDER.md` do começo ao fim.

Resumo:
1. PWABuilder: gera o `.aab` (20 min)
2. Google Play Console: cria conta US$25 (10 min)
3. Cria ficha do app com os textos prontos (30 min)
4. Upload do .aab e preenche declarações (30 min)
5. Submete para revisão

**Aguarda 1-7 dias** para aprovação.

### 🎉 FASE 4 — Anúncio público (depois de aprovado)

- [ ] Publicar post LinkedIn (copy pronta em `MATERIAIS-DE-MARKETING.md`)
- [ ] Enviar e-mail para base de alunos (copy pronta)
- [ ] Anunciar no grupo WhatsApp (copy pronta)
- [ ] Gravar vídeo demo 30s (roteiro pronto)
- [ ] Postar no Instagram (Stories + Reels)
- [ ] Atualizar slides do curso com QR Code
- [ ] Opcional: card de visita com QR Code

---

## 🎯 Cronograma sugerido

| Semana | Atividade |
|--------|-----------|
| **Semana 1** | Beta fechado — testers usando e dando feedback |
| **Semana 2** | Corrigir feedback + preparar assets Play Store |
| **Semana 3** | Submeter pra Play Store + preparar marketing |
| **Semana 4** | Aprovado → anúncio público |

---

## 📊 Métricas importantes (acompanhar)

Depois do lançamento público:

1. **Downloads da Play Store** (ver no Play Console)
2. **Instalações PWA** (difícil de medir sem analytics — considere adicionar Plausible ou Mixpanel)
3. **Feedback enviado via app** (você recebe no WhatsApp)
4. **Avaliações e reviews** na Play Store
5. **Compartilhamentos via WhatsApp** (botão Compartilhar do app)

---

## ❓ Perguntas frequentes

### "Posso publicar só como PWA, sem Play Store?"
Sim! O app JÁ ESTÁ publicado como PWA e funciona perfeitamente. A Play Store é opcional, mas aumenta credibilidade e facilita descoberta.

### "Quanto custa manter o app?"
- Vercel: **R$ 0** (plano gratuito suporta até 100GB/mês de tráfego — suficiente para milhares de usuários)
- API do Google Gemini: **R$ 0** até ~1500 requests/dia no free tier. Se passar disso, ~$0.10 por 1000 requests (muito barato)
- Domínio próprio (se comprar): **~R$ 50/ano**
- Google Play Console (uma vez): **US$ 25**

### "E se a API do Gemini quebrar ou ficar paga?"
Temos fallback: se a IA falhar, o app continua funcionando com todo o conteúdo da biblioteca, histórico e organização. Só as features de IA pausam temporariamente.

### "Como atualizar o app depois?"
Cada push no GitHub → deploy automático na Vercel → usuários recebem atualização automaticamente ao abrir o app.

Para a versão Play Store, precisa:
1. Gerar novo `.aab` no PWABuilder (quando tiver mudança grande)
2. Upload no Play Console
3. Usar o MESMO signing key (por isso guarde bem)

### "Posso monetizar?"
Sim, várias formas:
- App gratuito como bônus do curso (atual)
- Plano Pro com features exclusivas (histórico ilimitado, mais segmentos, etc)
- White-label para outras consultorias (R$ X/mês por empresa)
- Integrações com CRMs (integração paga)

---

## 🆘 Precisa de ajuda?

Se travar em qualquer etapa:
1. Tira screenshot do erro
2. Me envia a dúvida
3. Retomo de onde você parou

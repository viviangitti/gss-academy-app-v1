# Passo a Passo — Publicar MAESTR.IA na Google Play Store

**Tempo total estimado:** 2-3 horas (sem contar aprovação da Google que leva 1-7 dias)
**Custo:** US$ 25 (pagamento único da conta Google Play Console)

---

## 🎯 FASE 1 — Preparar os assets (30 min)

### 1.1 — Gerar ícones PNG

Abra no navegador:
```
https://gss-weld.vercel.app/gerar-icones.html
```

Clique em "📥 Baixar TODOS os ícones".

Vai baixar 9 arquivos PNG:
- icon-72.png, icon-96.png, icon-128.png, icon-144.png
- icon-152.png, icon-192.png, icon-384.png, icon-512.png, icon-1024.png

**Guarde todos em uma pasta chamada "icones-maestria".**

### 1.2 — Fazer screenshots (5-8 imagens)

No celular:

1. Abra https://gss-weld.vercel.app no Chrome
2. Configure seu perfil (nome, segmento, meta)
3. Registre 2-3 vendas fictícias pra gerar o gráfico bonito
4. Faça uma pesquisa de cliente, uma análise de mensagem, etc (pra ter conteúdo)
5. Em cada tela principal, tire um print:
   - Home
   - Pesquisa de Cliente (com dossiê)
   - Coach de Mensagem (com análise)
   - Pós-reunião (com resultado)
   - Simulador (com avaliação)
   - Biblioteca → Objeções
   - IA → Chat
   - Histórico

**Guarde em pasta "screenshots-maestria".**

### 1.3 — Criar Feature Graphic (opcional, mas recomendado)

Banner de 1024 x 500 px. Use Canva (gratuito):

1. Acesse [canva.com](https://canva.com)
2. Criar design com tamanho personalizado 1024 x 500
3. Template sugerido:
   - Fundo: gradient de #0f0f1e para #252547
   - À esquerda: "MAESTR.IA em Vendas" em fonte Cinzel dourada (#c9a84c)
   - Subtítulo: "O app de bolso do vendedor de alta performance"
   - À direita: mockup de celular com screenshot da Home (Canva tem esse template)
4. Baixar como PNG

---

## 🎯 FASE 2 — PWABuilder (20 min)

### 2.1 — Acessar PWABuilder

1. Abra **https://www.pwabuilder.com**
2. No campo grande do topo, cole: `https://gss-weld.vercel.app`
3. Clique em **"Start"**
4. Espere o PWABuilder analisar seu app

### 2.2 — Verificar score do PWA

Você vai ver um dashboard com:
- **Manifest** (deve estar 100%) ✅
- **Service Worker** (deve estar 100%) ✅
- **Security** (HTTPS — deve estar 100%) ✅

Se algum estiver vermelho, me avisa que corrijo.

### 2.3 — Gerar pacote Android

1. Clique em **"Package for Stores"**
2. Selecione **"Android"**
3. Clique em **"Generate Package"**

Uma janela vai aparecer. Preencha:

**Package name (ID):**
```
br.com.gssacademy.maestria
```

**App name:**
```
MAESTR.IA em Vendas
```

**Launcher name:**
```
MAESTR.IA
```

**App version:**
```
1.0.0
```

**App version code:**
```
1
```

**Display mode:**
```
standalone
```

**Orientation:**
```
default
```

**Theme color:**
```
#1a1a2e
```

**Background color:**
```
#1a1a2e
```

**Start URL:**
```
/
```

**Host:**
```
gss-weld.vercel.app
```
(ou seu domínio customizado)

**Signing key:** ⚠️ IMPORTANTE
- Selecione **"Create new signing key"**
- Preencha os dados (nome, organização, cidade, país BR)
- **BAIXE e GUARDE em local SEGURO** — se perder, não consegue atualizar o app depois

4. Clique em **"Generate Zip"**

Vai baixar um arquivo `maestria.zip` com:
- `app-release-signed.aab` (o arquivo pra upload)
- `app-release-signed.apk` (pra testar)
- Documentação do signing

---

## 🎯 FASE 3 — Google Play Console (40 min)

### 3.1 — Criar conta (se não tiver)

1. Acesse **https://play.google.com/console**
2. Faça login com Gmail
3. Pague **US$ 25** (pagamento único vitalício)
4. Aceite os termos e complete o perfil

### 3.2 — Criar novo app

1. No Play Console, clique em **"Criar app"**
2. Preencha:
   - **Nome:** MAESTR.IA em Vendas
   - **Idioma padrão:** Português (Brasil) — pt-BR
   - **Tipo:** App
   - **É gratuito ou pago:** Gratuito
   - Marque as declarações obrigatórias

### 3.3 — Configurar ficha da loja

Use o arquivo `DESCRICAO-PLAY-STORE.md` (está na pasta publicacao/).

**Ficha da loja principal:**
- **Nome do app:** MAESTR.IA em Vendas
- **Descrição breve:** (copiar do arquivo)
- **Descrição completa:** (copiar do arquivo)
- **Ícone:** icon-512.png
- **Feature graphic:** o banner que você fez no Canva
- **Screenshots:** faça upload dos prints do celular (mínimo 2, ideal 4-8)
- **Site:** https://gssacademy.vercel.app
- **E-mail:** seu e-mail profissional
- **Política de privacidade:** https://gss-weld.vercel.app/privacidade

**Categoria:**
- Principal: **Negócios**
- Tag: **Produtividade**

**Classificação de conteúdo:**
- Preencha o questionário da Google (~5 min)
- Resultado: **Livre** (não tem conteúdo violento, sexual, etc)

### 3.4 — Upload do .aab

1. Menu lateral → **"Produção"** (ou "Teste interno" pra começar)
2. Clique em **"Criar nova versão"**
3. Faça upload do arquivo `.aab` (do pacote do PWABuilder)
4. **Release notes:**
```
Primeira versão do MAESTR.IA em Vendas:
• Pesquisa de cliente com IA
• Coach de mensagens para WhatsApp e e-mail
• Análise pós-reunião por voz
• Simulador de treino de objeções
• Organizador do dia com meta mensal
• Biblioteca completa de conteúdos de vendas
```

### 3.5 — Declarações obrigatórias

A Google vai pedir você preencher:
- **Declaração de anúncios:** Não (o app não tem anúncios)
- **Acesso ao app:** Livre (qualquer um acessa)
- **Avaliação de conteúdo:** responder questionário
- **Público-alvo:** Adultos (18+)
- **Segurança de dados:** Preencher com o que está na sua política de privacidade:
  - Coleta de dados: **sim** (nome, empresa, segmento — tudo opcional)
  - Criptografia em trânsito: **sim** (HTTPS)
  - Pode excluir dados: **sim** (usuário controla no dispositivo)
  - Compartilhamento com terceiros: **não**

### 3.6 — Enviar para revisão

1. Verifique a checklist no topo da página (tudo verde)
2. Clique em **"Revisar versão"**
3. Confirme
4. Clique em **"Iniciar lançamento para Produção"**

### 3.7 — Aguardar aprovação

- **Tempo médio:** 1-7 dias
- Primeira submissão costuma levar mais tempo
- Google envia e-mail quando aprovar
- Se rejeitar, ajusta o que pediram e reenvia

---

## 🎯 FASE 4 — Depois de aprovado (15 min)

### 4.1 — Compartilhar link

Sua URL oficial vai ser algo como:
```
https://play.google.com/store/apps/details?id=br.com.gssacademy.maestria
```

### 4.2 — QR Code

Gere QR do link da Play Store usando:
- https://www.qr-code-generator.com
- Imprima e cole nos slides do curso

### 4.3 — Anúncio
- Post no Instagram com vídeo demo
- E-mail para base
- Post LinkedIn do Gerson
- Aviso no grupo de WhatsApp dos alunos

---

## 📲 iPhone / App Store (próxima etapa)

A App Store é mais complexa. Envolve:
- Conta Apple Developer: US$ 99/ano
- Capacitor.js (wrapper nativo)
- Build no Xcode (Mac)
- Review mais rigorosa (1-3 semanas)

**Sugestão:** publica no Google Play primeiro. Depois de 50-100 usuários, avaliamos se vale a pena App Store. Enquanto isso, usuários iPhone podem "instalar" via PWA (página /instalar mostra como).

---

## ⚠️ Não esqueça

- [ ] Guardar o **signing key** em lugar SEGURO (backup no Google Drive / HD externo)
- [ ] Anotar a senha do signing key (você vai precisar para atualizações)
- [ ] Guardar o **package name** (`br.com.gssacademy.maestria`) — nunca muda
- [ ] Fazer backup da **conta da Play Console**

---

## 📞 Dúvidas durante o processo

Se algo der errado em QUALQUER etapa, me manda:
1. Screenshot do erro
2. Em que passo está
3. O que tinha acabado de fazer

Eu te ajudo a desbloquear.

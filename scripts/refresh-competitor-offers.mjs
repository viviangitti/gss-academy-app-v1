/**
 * refresh-competitor-offers.mjs
 *
 * Busca ofertas atuais dos concorrentes via Gemini + Google Search
 * e atualiza a coleção competitorOffers no Firestore.
 *
 * Uso: node scripts/refresh-competitor-offers.mjs
 */

import { readFileSync } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Config ──────────────────────────────────────────────────────────────────
// Lê a chave do ambiente — NUNCA hardcode chaves de API (vazam no git/público)
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error('Defina VITE_GEMINI_API_KEY no ambiente antes de rodar este script.');
  process.exit(1);
}
const PROJECT_ID = 'maestria-vendas';
const COLLECTION  = 'competitorOffers';

// Pega e renova o access_token do Firebase CLI automaticamente
async function getAccessToken() {
  const configPath = `${process.env.HOME}/.config/configstore/firebase-tools.json`;
  const fbConfig = JSON.parse(readFileSync(configPath, 'utf8'));
  const { access_token, refresh_token, expires_at } = fbConfig.tokens;

  // Renova se expirar em menos de 5 min
  if (Date.now() < (expires_at - 5 * 60 * 1000)) return access_token;

  console.log('🔄 Renovando token Firebase...');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token,
      client_id:     '563584335869-fgurikb0arvkgd8eqhnyl7ken9s0m6c4.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8sFxnDVjTGPgf-yTa',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Falha ao renovar token: ' + JSON.stringify(data));

  // Salva token renovado no config
  fbConfig.tokens.access_token = data.access_token;
  fbConfig.tokens.expires_at   = Date.now() + (data.expires_in * 1000);
  const { writeFileSync } = await import('fs');
  writeFileSync(configPath, JSON.stringify(fbConfig, null, 2));

  return data.access_token;
}

const ACCESS_TOKEN = await getAccessToken();

const today      = new Date().toISOString().split('T')[0];
const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  .toISOString().split('T')[0];
const monthYear  = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

// URLs oficiais por marca — homepage estável (nunca URL de campanha)
const BRAND_OFFER_URLS = {
  'porsche':        'https://www.porsche.com/brazil/pt/models/',
  'bmw':            'https://www.bmw.com.br/pt/home.html',
  'mercedes-benz':  'https://www.mercedes-benz.com.br/',
  'mercedes':       'https://www.mercedes-benz.com.br/',
  'audi':           'https://www.audi.com.br/',
  'land rover':     'https://www.landrover.com.br/',
  'volvo':          'https://www.volvocars.com/br/',
};

// Concorrentes do segmento automotivo_luxo
const LUXO_COMPETITORS = ['Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Land Rover', 'Volvo'];

// ── Firestore REST helpers ───────────────────────────────────────────────────
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function fsRequest(method, path, body) {
  const res = await fetch(`${FS_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore ${method} ${path} → ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

// Lê todos os documentos da coleção
async function getAllDocs(col) {
  const data = await fsRequest('GET', `/${col}?pageSize=200`);
  return data.documents || [];
}

// Cria um documento
async function createDoc(col, fields) {
  return fsRequest('POST', `/${col}`, { fields: toFs(fields) });
}

// Deleta um documento
async function deleteDoc(docPath) {
  const res = await fetch(`https://firestore.googleapis.com/v1/${docPath}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
  });
  if (!res.ok) console.warn(`  ⚠️ Delete failed: ${res.status}`);
}

// Converte objeto JS → Firestore fields format
function toFs(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string')  out[k] = { stringValue: v };
    else if (typeof v === 'boolean') out[k] = { booleanValue: v };
    else if (typeof v === 'number')  out[k] = { integerValue: String(Math.round(v)) };
    else if (Array.isArray(v)) {
      out[k] = { arrayValue: { values: v.map(i =>
        typeof i === 'string' ? { stringValue: i } :
        typeof i === 'boolean' ? { booleanValue: i } :
        { stringValue: String(i) }
      )}};
    }
  }
  return out;
}

// ── Gemini scraper ───────────────────────────────────────────────────────────
const GROUNDING_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-001'];

async function searchOffers(brands) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const prompt = `Pesquise quais são as ofertas, promoções e condições especiais VIGENTES em ${monthYear} no Brasil para estas marcas de automóveis de luxo: ${brands.join(', ')}.

Para cada modelo com oferta ativa, crie um JSON:
- "competitor": nome da marca (ex: "BMW", "Audi")
- "title": condição principal curta (ex: "X3 — Taxa 0,79% ao mês", "A3 — Bônus R$8.000")
- "description": descrição em 1-2 frases da oferta
- "highlights": array com até 4 pontos-chave (taxa, entrada, bônus, prazo)
- "legalText": ""
- "validFrom": "${today}"
- "validTo": data de validade YYYY-MM-DD ou "${endOfMonth}"

Até 3 modelos por marca. Retorne APENAS JSON array válido sem markdown.`;

  let lastErr = '';
  for (const modelName of GROUNDING_MODELS) {
    try {
      const model = genAI.getGenerativeModel(
        // @ts-ignore
        { model: modelName, tools: [{ googleSearch: {} }] }
      );
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('No JSON array found');
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      lastErr = e.message;
      console.log(`  ↻ modelo ${modelName} falhou (${e.message.slice(0, 60)}), tentando próximo...`);
    }
  }
  throw new Error(`Todos os modelos falharam: ${lastErr}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔍 Buscando ofertas atuais com Gemini + Google Search...\n');
  console.log(`   Concorrentes: ${LUXO_COMPETITORS.join(', ')}`);
  console.log(`   Período: ${monthYear}\n`);

  // 1. Busca ofertas frescas
  let freshOffers;
  try {
    freshOffers = await searchOffers(LUXO_COMPETITORS);
    console.log(`✅ ${freshOffers.length} oferta(s) encontrada(s) pela IA\n`);
  } catch (e) {
    console.error('❌ Falha ao buscar ofertas:', e.message);
    process.exit(1);
  }

  // 2. Lê ofertas antigas no Firestore
  console.log('📖 Lendo ofertas existentes no Firestore...');
  let existingDocs = [];
  try {
    existingDocs = await getAllDocs(COLLECTION);
    // Filtra apenas as de automotivo_luxo ou sem segmento
    const luxoCompetitorNames = LUXO_COMPETITORS.map(c => c.toLowerCase());
    existingDocs = existingDocs.filter(doc => {
      const competitor = doc.fields?.competitor?.stringValue?.toLowerCase() || '';
      return luxoCompetitorNames.some(c => competitor.includes(c));
    });
    console.log(`   ${existingDocs.length} oferta(s) de luxo encontrada(s) para substituir\n`);
  } catch (e) {
    console.error('❌ Falha ao ler Firestore:', e.message);
    process.exit(1);
  }

  // 3. Deleta as antigas
  if (existingDocs.length > 0) {
    console.log('🗑️  Removendo ofertas antigas...');
    for (const doc of existingDocs) {
      const name = doc.name.split('/').slice(-3).join('/');
      await deleteDoc(doc.name);
      console.log(`   ✓ deletado: ${doc.fields?.competitor?.stringValue} — ${doc.fields?.title?.stringValue?.slice(0, 50)}`);
    }
    console.log();
  }

  // 4. Insere as novas
  console.log('💾 Salvando novas ofertas no Firestore...\n');
  let saved = 0;
  for (const offer of freshOffers) {
    if (!offer.competitor || !offer.title) {
      console.log(`   ⚠️ Pulando oferta inválida: ${JSON.stringify(offer).slice(0, 80)}`);
      continue;
    }

    const competitorName = offer.competitor.trim();
    const sourceUrl = BRAND_OFFER_URLS[competitorName.toLowerCase()] || '';

    const doc = {
      competitor:    competitorName,
      title:         offer.title?.trim() || '',
      description:   offer.description?.trim() || '',
      highlights:    (offer.highlights || []).filter(Boolean),
      ourAdvantages: [],
      legalText:     offer.legalText || '',
      sourceUrl,           // sempre usa URL oficial estável, nunca URL de campanha
      validFrom:     offer.validFrom || today,
      validTo:       offer.validTo   || endOfMonth,
      segments:      ['automotivo_luxo'],
      active:        true,
      createdAt:     Date.now(),
      createdBy:     'auto-refresh',
    };

    try {
      await createDoc(COLLECTION, doc);
      console.log(`   ✅ ${competitorName} — ${doc.title}`);
      saved++;
    } catch (e) {
      console.log(`   ❌ Erro ao salvar ${competitorName}: ${e.message.slice(0, 80)}`);
    }
  }

  console.log(`\n✨ Concluído! ${saved} oferta(s) salva(s) no Firestore.\n`);
}

main().catch(e => { console.error(e); process.exit(1); });

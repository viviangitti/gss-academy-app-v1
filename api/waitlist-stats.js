// Vercel Serverless Function — Waitlist Stats via Resend API
// Endpoint: GET /api/waitlist-stats
//
// Conta os emails de boas-vindas enviados pelo Resend pra estimar
// quantas pessoas se cadastraram na Lista de Espera.
//
// Filtro: subject contém "Bem-vindo(a) à Lista de Espera"
// (esses são os welcome emails enviados ao próprio lead)
//
// LGPD: não armazenamos nem expomos dados pessoais.
// Apenas contagens agregadas (total, por dia, etc.)
//
// Cache em memória de 5 min pra não bater na API toda hora.

let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const SUBJECT_FILTER = 'Bem-vindo(a) à Lista de Espera';
const PAGE_SIZE = 100;
const MAX_PAGES = 20; // teto de segurança (2.000 emails)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'RESEND_API_KEY não configurada', useMock: true });
    }

    // Cache
    const now = Date.now();
    if (cache && now - cacheTimestamp < CACHE_TTL_MS) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cache);
    }

    // Pagination via Resend API (cursor based)
    const allWelcomeEmails = [];
    let cursor = null;
    let pages = 0;

    do {
      const url = new URL('https://api.resend.com/emails');
      url.searchParams.set('limit', String(PAGE_SIZE));
      if (cursor) url.searchParams.set('after', cursor);

      const upstream = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!upstream.ok) {
        const text = await upstream.text();
        throw new Error(`Resend API ${upstream.status}: ${text.slice(0, 200)}`);
      }

      const json = await upstream.json();
      const items = Array.isArray(json.data) ? json.data : [];

      // Filtro client-side (Resend API não tem search por subject)
      const welcome = items.filter((e) => {
        const subj = String(e.subject || '');
        return subj.startsWith(SUBJECT_FILTER) || subj.includes(SUBJECT_FILTER);
      });
      allWelcomeEmails.push(...welcome);

      cursor = json.has_more && items.length > 0 ? items[items.length - 1].id : null;
      pages++;
    } while (cursor && pages < MAX_PAGES);

    // ===== AGREGAÇÃO =====
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let total = 0;
    let last7Days = 0;
    let todayCount = 0;
    const dailyMap = {};
    const byDeliveryStatus = {};

    allWelcomeEmails.forEach((email) => {
      total++;

      const ts = new Date(email.created_at);
      if (isNaN(ts.getTime())) return;

      // Por status (delivered, bounced, etc.)
      const status = email.last_event || 'unknown';
      byDeliveryStatus[status] = (byDeliveryStatus[status] || 0) + 1;

      // Por dia
      const dayKey = formatDate(ts);
      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;

      // Hoje (zerar horário pra comparar)
      const tsDay = new Date(ts);
      tsDay.setHours(0, 0, 0, 0);
      if (tsDay.getTime() === today.getTime()) todayCount++;

      // Últimos 7 dias
      if (ts >= sevenDaysAgo) last7Days++;
    });

    // Últimos 30 dias em array ordenado (preenchendo com 0 onde não tem)
    const byDay = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = formatDate(d);
      byDay.push({ date: k, count: dailyMap[k] || 0 });
    }

    const result = {
      total,
      last7Days,
      today: todayCount,
      byDay,
      byDeliveryStatus,
      source: 'resend-api',
      pagesScanned: pages,
      updatedAt: new Date().toISOString(),
    };

    cache = result;
    cacheTimestamp = now;

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(result);
  } catch (err) {
    console.error('[waitlist-stats] erro:', err);
    return res.status(500).json({
      error: 'Erro ao buscar estatísticas',
      details: err?.message || 'unknown',
      useMock: true,
    });
  }
}

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

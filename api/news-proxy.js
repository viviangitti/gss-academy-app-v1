/**
 * GET /api/news-proxy?rss=<url do RSS do Google News>
 *
 * Proxy próprio que busca o RSS do Google News server-side e devolve JSON.
 * Substitui o rss2json (terceiro, grátis e com rate limit) — sem dependência externa,
 * sem limite de terceiros. Cacheia 10 min na borda do Vercel para reduzir chamadas ao Google.
 *
 * Resposta: { status: 'ok', items: [{ title, link, pubDate, description }] }
 */

/** Decodifica entidades HTML básicas e remove tags. */
function cleanText(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

/** Extrai o conteúdo de uma tag dentro de um bloco <item>. */
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? m[1] : '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { rss } = req.query;
  if (!rss || !rss.startsWith('https://news.google.com/')) {
    return res.status(400).json({ status: 'error', message: 'Parâmetro rss inválido ou não permitido.' });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    const upstream = await fetch(rss, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
    clearTimeout(timer);

    if (!upstream.ok) {
      return res.status(502).json({ status: 'error', message: `Google News retornou ${upstream.status}` });
    }

    const xml = await upstream.text();

    // Extrai cada <item> do RSS
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let m;
    while ((m = itemRegex.exec(xml)) !== null) {
      const block = m[1];
      const title = cleanText(tag(block, 'title'));
      const link = cleanText(tag(block, 'link'));
      const pubDate = cleanText(tag(block, 'pubDate'));
      const description = cleanText(tag(block, 'description')).slice(0, 150);
      if (title) items.push({ title, link, pubDate, description });
    }

    // Cache na borda do Vercel: 10 min fresco, 1h stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.json({ status: 'ok', items });
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    return res.status(isAbort ? 504 : 500).json({
      status: 'error',
      message: isAbort ? 'Timeout ao buscar o RSS.' : (err?.message || 'Erro desconhecido'),
    });
  }
}

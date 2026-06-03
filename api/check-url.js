/**
 * GET /api/check-url?url=https://...
 * Verifica o status HTTP de uma URL de forma server-side (evita CORS no browser).
 * Retorna { ok: true/false, status: 200|404|... }
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { url } = req.query;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ ok: false, error: 'URL inválida' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
    });

    clearTimeout(timeout);
    return res.json({ ok: response.ok, status: response.status, finalUrl: response.url });
  } catch (err) {
    // Timeout ou erro de rede — assume que o site existe mas bloqueia bots (403 é comum)
    const isAbort = err?.name === 'AbortError';
    return res.json({ ok: !isAbort, status: isAbort ? 408 : 0, error: err?.message });
  }
}

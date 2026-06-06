/**
 * POST /api/send-push
 * Envia notificação push para os dispositivos de uma empresa via Firebase Cloud Messaging.
 *
 * Body: { title, body, url?, company, segment?, audience? }
 *   - company: obrigatório (chave da empresa, minúsculo)
 *   - audience: 'vendas' | 'marketing' | 'all' (padrão 'vendas')
 *   - segment: se informado, só notifica quem é do segmento (ou de "todos")
 *
 * Requer a env FIREBASE_SERVICE_ACCOUNT (JSON da conta de serviço do Firebase) no Vercel.
 */
import admin from 'firebase-admin';

function getApp() {
  if (admin.apps.length) return admin.app();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT ausente');
  const cred = JSON.parse(raw);
  if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, '\n');
  return admin.initializeApp({ credential: admin.credential.cert(cred) });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const { title, body, url = '/', company, segment = '', audience = 'vendas' } = req.body || {};
    if (!title || !body || !company) {
      res.status(400).json({ error: 'title, body e company são obrigatórios' });
      return;
    }

    const app = getApp();
    const db = admin.firestore(app);

    // tokens da empresa
    let q = db.collection('pushTokens').where('company', '==', String(company).trim().toLowerCase());
    const snap = await q.get();

    const docs = snap.docs.filter((d) => {
      const t = d.data();
      // filtro de público
      if (audience !== 'all') {
        const acc = t.userAccessType || 'vendas';
        if (audience === 'vendas' && acc === 'marketing') return false;
        if (audience === 'marketing' && acc === 'vendas') return false;
      }
      // filtro de segmento (se informado): segmento igual ou "todos" ('')
      if (segment && t.segment && t.segment !== segment) return false;
      return true;
    });

    const tokens = docs.map((d) => d.data().token).filter(Boolean);
    if (!tokens.length) {
      res.status(200).json({ ok: true, sent: 0, note: 'nenhum dispositivo registrado' });
      return;
    }

    const message = {
      notification: { title, body },
      data: { url: String(url), title: String(title), body: String(body) },
      webpush: {
        notification: { icon: '/icon-192.png', badge: '/icon-192.png' },
        fcmOptions: { link: String(url) },
      },
    };

    // sendEachForMulticast aceita até 500 tokens por chamada
    const messaging = admin.messaging(app);
    let sent = 0;
    const dead = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const r = await messaging.sendEachForMulticast({ tokens: batch, ...message });
      sent += r.successCount;
      r.responses.forEach((resp, idx) => {
        const code = resp.error?.code || '';
        if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
          dead.push(batch[idx]);
        }
      });
    }

    // limpa tokens mortos
    await Promise.all(dead.map((tk) => db.collection('pushTokens').doc(tk).delete().catch(() => {})));

    res.status(200).json({ ok: true, sent, removed: dead.length, total: tokens.length });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

/**
 * GET /api/daily-brief — chamado pelo cron do Vercel todo dia útil às 8h (BRT).
 * Manda o push "seu briefing chegou" pra todos os aparelhos registrados.
 * O conteúdo personalizado (meta, follow-ups) é montado no app ao abrir.
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
  try {
    // domingo não tem briefing
    const brt = new Date(Date.now() - 3 * 3600000);
    if (brt.getUTCDay() === 0) {
      res.status(200).json({ ok: true, skipped: 'domingo' });
      return;
    }

    const app = getApp();
    const db = admin.firestore(app);
    const snap = await db.collection('pushTokens').get();
    const tokens = snap.docs.map(d => d.data().token).filter(Boolean);
    if (!tokens.length) {
      res.status(200).json({ ok: true, sent: 0 });
      return;
    }

    const messaging = admin.messaging(app);
    let sent = 0;
    const dead = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const r = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: '☀️ Seu resumo do dia chegou',
          body: 'Meta, follow-ups e a munição de hoje — 30 segundos e você sai na frente.',
        },
        data: { url: '/', title: 'Resumo do dia', body: '' },
        webpush: {
          notification: { icon: '/icon-192.png', badge: '/icon-192.png' },
          fcmOptions: { link: '/' },
        },
      });
      sent += r.successCount;
      r.responses.forEach((resp, idx) => {
        const code = resp.error?.code || '';
        if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
          dead.push(batch[idx]);
        }
      });
    }
    await Promise.all(dead.map(tk => db.collection('pushTokens').doc(tk).delete().catch(() => {})));
    res.status(200).json({ ok: true, sent, removed: dead.length });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

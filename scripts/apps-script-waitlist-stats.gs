/**
 * APPS SCRIPT — Waitlist Stats API (LGPD-friendly)
 *
 * Como usar:
 * 1. Abre a planilha da Lista de Espera
 * 2. Extensões → Apps Script
 * 3. Cola TODO esse código (substituindo o que tem ou adicionando uma nova função)
 * 4. Salva (Ctrl+S ou Cmd+S)
 * 5. Clica em "Deploy" → "New deployment"
 * 6. Tipo: "Web app"
 * 7. Execute as: "Me" (sua conta)
 * 8. Who has access: "Anyone" (NÃO expõe os dados pessoais — só os agregados)
 * 9. Deploy
 * 10. COPIA a URL que aparece (algo como https://script.google.com/macros/s/AKf.../exec)
 * 11. Manda essa URL pro Claude
 *
 * Importante: o endpoint só retorna AGREGADOS (totais, percentuais, contagens).
 * NUNCA retorna nome, email, WhatsApp ou qualquer dado pessoal.
 */

// ID da planilha (já preenchido com a sua)
const SHEET_ID = '16Kr0m9PxWzkaJsYYRFc6htmRjNFVqUWqQS7Vt-0wJc8';
const SHEET_NAME = 'Página1';

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      return jsonResponse({
        total: 0,
        last7Days: 0,
        today: 0,
        bySource: {},
        byInterest: {},
        byStatus: {},
        byDay: [],
        updatedAt: new Date().toISOString(),
      });
    }

    // Lê tudo de A2 até G{lastRow}
    const rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let total = 0;
    let last7Days = 0;
    let todayCount = 0;
    const bySource = {};
    const byInterest = {};
    const byStatus = {};
    const dailyMap = {};

    rows.forEach((row) => {
      const [data, _nome, _email, _whatsapp, interesse, origem, status] = row;

      // Pula linhas vazias
      if (!data) return;

      total++;

      const ts = new Date(data);
      if (isNaN(ts.getTime())) return;

      // Conta por dia
      const dayKey = formatDate(ts);
      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;

      // Hoje
      if (ts >= today) todayCount++;
      // Últimos 7 dias
      if (ts >= sevenDaysAgo) last7Days++;

      // Por interesse
      if (interesse) {
        const k = String(interesse).trim() || 'Não informado';
        byInterest[k] = (byInterest[k] || 0) + 1;
      }

      // Por origem (path da URL)
      if (origem) {
        const k = String(origem).trim() || 'Direto';
        bySource[k] = (bySource[k] || 0) + 1;
      }

      // Por status
      if (status) {
        const k = String(status).trim() || 'Pendente';
        byStatus[k] = (byStatus[k] || 0) + 1;
      }
    });

    // Últimos 30 dias em array ordenado
    const byDay = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = formatDate(d);
      byDay.push({ date: k, count: dailyMap[k] || 0 });
    }

    return jsonResponse({
      total,
      last7Days,
      today: todayCount,
      bySource,
      byInterest,
      byStatus,
      byDay,
      conversionTarget: 'mock', // pra preencher quando integrar com analytics
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return jsonResponse({ error: String(err.message || err) }, 500);
  }
}

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function jsonResponse(obj, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

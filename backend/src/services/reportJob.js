// Envio programado dos relatorios por WhatsApp (Fase 8.7). DESLIGADO por
// omissao: so arranca com REPORTS_WHATSAPP=true (decisao do fundador 11/10 —
// precisa de um numero WhatsApp Business com modelo de mensagem aprovado; ate
// la nada e enviado aos donos). Cada envio (ou falha) fica na auditoria com a
// chave do periodo, por isso um reinicio do servidor nao repete mensagens.
const prisma = require('../utils/prisma');
const { dueReports, buildReportMessage } = require('./reportSchedule');
const { dailyReport, weeklyReport, monthlyReport } = require('./reports');
const { sendWhatsAppAlert } = require('../utils/whatsapp');
const { waPhone } = require('./shoppingList');

const FIVE_MIN = 5 * 60 * 1000;
const enabled = () => String(process.env.REPORTS_WHATSAPP || 'false').toLowerCase() === 'true';

async function buildReport(tenantId, due) {
  if (due.kind === 'daily') return dailyReport(tenantId, due.end);
  if (due.kind === 'weekly') return weeklyReport(tenantId, due.start, due.end);
  return monthlyReport(tenantId, due.year, due.month);
}

async function runReportJob({ now = new Date(), send = sendWhatsAppAlert, tenantId } = {}) {
  const tenants = await prisma.tenant.findMany({
    where: { ...(tenantId ? { id: tenantId } : {}), status: { in: ['active', 'trial'] }, onboarding_completed: true },
    select: { id: true, name: true, phone: true, opening_time: true, month_close_day: true, daily_report_time: true, weekly_report_day: true, weekly_report_time: true, monthly_report_time: true },
  });
  const since = new Date(now.getTime() - 40 * 86400000);
  let sent = 0;
  for (const t of tenants) {
    try {
      const to = waPhone(t.phone);
      if (!to) continue;
      const done = await prisma.auditLog.findMany({ where: { tenant_id: t.id, action: { in: ['REPORT_SENT', 'REPORT_SEND_FAILED'] }, created_at: { gte: since } }, select: { entity_id: true } });
      const due = dueReports({ now, tenant: t, sentKeys: new Set(done.map((d) => d.entity_id)) });
      if (!due.length) continue;
      const owner = await prisma.user.findFirst({ where: { tenant_id: t.id, role: 'owner', is_active: true }, select: { id: true } });
      if (!owner) continue;
      for (const d of due) {
        const message = buildReportMessage({ due: d, report: await buildReport(t.id, d), storeName: t.name, appUrl: process.env.APP_URL || 'https://genesismz.com' });
        let action = 'REPORT_SENT'; let detail = {};
        try {
          const r = await send({ to: '+' + to, message, tenantName: t.name });
          if (!r || r.ok === false) { action = 'REPORT_SEND_FAILED'; detail = { reason: r?.reason || 'recusado' }; }
        } catch (err) { action = 'REPORT_SEND_FAILED'; detail = { reason: String(err.message || err).slice(0, 200) }; }
        await prisma.auditLog.create({ data: { tenant_id: t.id, user_id: owner.id, action, entity_type: 'report', entity_id: d.key, new_value: JSON.stringify({ kind: d.kind, to: '+' + to, ...detail }), ip_address: '0.0.0.0' } });
        if (action === 'REPORT_SENT') sent++;
      }
    } catch (err) { console.error('[relatorios] loja ' + t.id + ':', err.message); }
  }
  if (sent) console.log(`[relatorios] ${sent} relatorio(s) enviados por WhatsApp`);
  return sent;
}

function startReportJob() {
  if (!enabled()) return null;
  const run = () => runReportJob().catch((err) => console.error('[relatorios] falhou:', err.message));
  const first = setTimeout(run, 60 * 1000);
  const every = setInterval(run, FIVE_MIN);
  first.unref(); every.unref();
  return { first, every };
}

module.exports = { runReportJob, startReportJob, reportsWhatsappEnabled: enabled };

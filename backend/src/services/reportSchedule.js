// Horarios dos relatorios por WhatsApp (Fase 8.7, pedido do fundador 10/10/2026):
// o dono escolhe a hora do diario, o dia da semana + hora do semanal e a hora
// do mensal (no dia do "Fecho do mes"). Funcoes PURAS, pelo calendario de
// Maputo (testadas em tests/reportSchedule.test.js).
//
// Periodo de cada relatorio:
//  - diario: hora ANTES da abertura da loja (ex.: 00:00) -> o dia anterior
//    completo ("recebo a meia-noite, o de hoje ainda nao conta"); senao o dia
//    de hoje ate essa hora;
//  - semanal: 7 dias que acabam no mesmo dia que o diario acabaria;
//  - mensal: o mes anterior (como o fecho do mes).
// O envio em si fica DESLIGADO ate REPORTS_WHATSAPP=true (decisao 11/10).
const { dayInMaputo } = require('../utils/fefo');

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULTS = { daily_report_time: '21:00', weekly_report_day: 1, weekly_report_time: '08:00', monthly_report_time: '08:00' };
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

const MAPUTO_OFFSET_MS = 2 * 3600 * 1000;
const hhmmInMaputo = (d) => new Date(new Date(d).getTime() + MAPUTO_OFFSET_MS).toISOString().slice(11, 16);
const addDays = (day, n) => new Date(Date.parse(day + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const weekday = (day) => new Date(day + 'T00:00:00Z').getUTCDay();

function schedule(tenant = {}) {
  const pick = (k) => (tenant[k] ?? DEFAULTS[k]);
  return {
    daily_report_time: pick('daily_report_time'),
    weekly_report_day: pick('weekly_report_day'),
    weekly_report_time: pick('weekly_report_time'),
    monthly_report_time: pick('monthly_report_time'),
    month_close_day: tenant.month_close_day || 1,
    opening_time: tenant.opening_time || '08:00',
  };
}

// Ultimo dia que um relatorio enviado as `time` cobre (no dia `today`).
const coveredEnd = (today, time, opening) => (time < opening ? addDays(today, -1) : today);

// Que relatorios tocam agora? sentKeys: chaves ja enviadas (ou falhadas).
function dueReports({ now = new Date(), tenant, sentKeys = new Set() }) {
  const s = schedule(tenant);
  const today = dayInMaputo(now);
  const clock = hhmmInMaputo(now);
  const out = [];
  if (clock >= s.daily_report_time) {
    const end = coveredEnd(today, s.daily_report_time, s.opening_time);
    out.push({ kind: 'daily', key: 'daily:' + end, start: end, end, partial: end === today });
  }
  if (weekday(today) === Number(s.weekly_report_day) && clock >= s.weekly_report_time) {
    const end = coveredEnd(today, s.weekly_report_time, s.opening_time);
    out.push({ kind: 'weekly', key: 'weekly:' + end, start: addDays(end, -6), end, partial: end === today });
  }
  if (Number(today.slice(8, 10)) === Number(s.month_close_day) && clock >= s.monthly_report_time) {
    const y = Number(today.slice(0, 4)); const m = Number(today.slice(5, 7));
    const py = m === 1 ? y - 1 : y; const pm = m === 1 ? 12 : m - 1;
    out.push({ kind: 'monthly', key: `monthly:${py}-${String(pm).padStart(2, '0')}`, year: py, month: pm });
  }
  return out.filter((r) => !sentKeys.has(r.key));
}

// Texto da ajuda no ecra: o que o dono recebe a cada hora.
function describeDaily(time, opening = '08:00') {
  return time < opening ? `Às ${time} recebe o relatório de ontem, completo.` : `Às ${time} recebe o relatório de hoje, até essa hora.`;
}

const moneyText = (c) => (Number(c || 0) / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' }) + ' MT';
const dmy = (day) => `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

// Mensagem curta para o WhatsApp do dono (sem dados de clientes).
function buildReportMessage({ due, report, storeName, appUrl = 'https://genesismz.com' }) {
  const title = due.kind === 'daily' ? `Relatório diário ${dmy(due.end)}${due.partial ? ' (até agora)' : ''}`
    : due.kind === 'weekly' ? `Relatório semanal ${dmy(due.start)} a ${dmy(due.end)}`
    : `Relatório mensal ${String(due.month).padStart(2, '0')}/${due.year}`;
  const lines = [`Genesis · ${storeName}`, title, '',
    `Receita: ${moneyText(report.gross_revenue)} (${report.sales_count || 0} venda(s))`,
    `Lucro bruto: ${moneyText(report.gross_profit)}`];
  if (due.kind === 'monthly' && report.net_profit != null) lines.push(`Lucro líquido real: ${moneyText(report.net_profit)}`);
  if (report.losses_total) lines.push(`Perdas: ${moneyText(report.losses_total)}`);
  if (report.most_sold) lines.push(`Mais vendido: ${report.most_sold.name} (${report.most_sold.quantity} un.)`);
  const lost = (report.lost_demand || []).reduce((s, d) => s + (d.units || 0), 0);
  if (lost) lines.push(`Vendas perdidas: ${lost} un. pedidas e sem stock`);
  lines.push('', `Ver tudo: ${appUrl.replace(/\/$/, '')}/app/relatorios`);
  return lines.join('\n');
}

module.exports = { HHMM, DEFAULTS, WEEKDAYS, schedule, dueReports, describeDaily, buildReportMessage, moneyText };

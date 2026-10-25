// Relatorio diario/semanal/mensal em PDF (A4), gerado a partir dos mesmos
// dados que o ecra mostra. Substitui o window.print(), que nao faz nada na app
// do ecra principal do iPhone (teste do fundador, 10/10/2026).
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
// PDF sai sempre com os valores, mesmo no modo privado.
import { moneyExact as money, int, date, dateTime, PAYMENT_LABEL } from '../format';
import { lossReason, timelineDetail, timelineExtra, timelineTitle, timelineValueText, timelineWhen, timelineWho } from '../timelineText';
import { pdfText, safeFileName } from './text';
import { getLang, locale, t } from '../../i18n/core.js';

// 9.6: o PDF sai na lingua de quem o gera (t + locale); em portugues fica igual.

const M = 14;
const ACCENT = [11, 77, 59]; // verde do logotipo (tokens --accent)
const INK = [28, 25, 23];
const MUTED = [120, 113, 108];
const decimal = (v) => (getLang() === 'pt' ? String(v).replace('.', ',') : String(v));
const pctText = (v) => decimal(v) + '%';

function createDoc() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  let y = M;

  const ensure = (space) => { if (y + space > pageH - 16) { doc.addPage(); y = M + 4; } };

  const heading = (text) => {
    ensure(18);
    y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...INK);
    doc.text(pdfText(text), M, y);
    y += 2;
  };

  const note = (text) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(pdfText(text), pageW - 2 * M);
    ensure(lines.length * 4.2 + 2);
    y += 4;
    doc.text(lines, M, y);
    y += (lines.length - 1) * 4.2;
  };

  // right = indices das colunas numericas (alinhadas a direita)
  const table = (head, body, { right = [], empty = t('Nada a registar.'), widths = {} } = {}) => {
    const columnStyles = {};
    for (const i of right) columnStyles[i] = { halign: 'right' };
    for (const [i, w] of Object.entries(widths)) columnStyles[i] = { ...(columnStyles[i] || {}), cellWidth: w };
    autoTable(doc, {
      startY: y + 2,
      margin: { left: M, right: M, bottom: 16 },
      head: head ? [head.map(pdfText)] : undefined,
      body: body.length ? body.map((r) => r.map((c) => pdfText(c))) : [[{ content: pdfText(empty), colSpan: head ? head.length : 2, styles: { textColor: MUTED } }]],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 1.6, textColor: INK, lineColor: [231, 229, 228], lineWidth: 0.2, overflow: 'linebreak' },
      headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: 'bold' },
      columnStyles,
      // titulos das colunas de valores alinhados com os valores
      didParseCell: (d) => { if (d.section === 'head' && right.includes(d.column.index)) d.cell.styles.halign = 'right'; },
    });
    y = doc.lastAutoTable.finalY;
  };

  const header = ({ shopName, title, subtitle }) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...INK);
    doc.text(pdfText(shopName || 'Genesis'), M, y + 4);
    doc.setFontSize(12.5); doc.text(pdfText(title), M, y + 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...MUTED);
    doc.text(pdfText(subtitle), M, y + 16.5);
    doc.text(pdfText(t('Gerado em {when}', { when: new Date().toLocaleString(locale()) })), pageW - M, y + 4, { align: 'right' });
    doc.setDrawColor(...ACCENT); doc.setLineWidth(0.6); doc.line(M, y + 19.5, pageW - M, y + 19.5); doc.setLineWidth(0.2);
    y += 21;
  };

  const footer = () => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i += 1) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text(pdfText(t('Genesis · página {i} de {n}', { i, n })), pageW - M, pageH - 8, { align: 'right' });
    }
  };

  return { doc, heading, note, table, header, footer };
}

const rankRows = (rows) => rows.map((p) => [t('{n}.º', { n: p.rank }), p.name, int(p.quantity), money(p.revenue), money(p.profit)]);

function kpis(pdf, r) {
  pdf.heading(t('Resumo'));
  pdf.table(null, [
    [t('Receita'), `${money(r.gross_revenue)} · ${t('{n} venda(s)', { n: int(r.sales_count) })}`],
    [t('Ticket médio'), money(r.average_ticket)],
    [t('Custo dos produtos'), money(r.cost_of_goods)],
    [t('Lucro bruto'), money(r.gross_profit)],
    [t('Perdas (ao custo)'), r.losses_total ? '-' + money(r.losses_total) : money(0)],
    [t('Resultado (lucro bruto - perdas)'), money(r.gross_profit - r.losses_total)],
    ...(r.discounts_total ? [[t('Descontos concedidos'), '-' + money(r.discounts_total)]] : []),
    ...(r.compare?.revenue_change_pct != null ? [[t('Receita vs período anterior'), (r.compare.revenue_change_pct > 0 ? '+' : '') + pctText(r.compare.revenue_change_pct)]] : []),
  ], { right: [1], widths: { 0: 80 } });
}

function breakdown(pdf, r) {
  const rankHead = ['#', t('Produto'), t('Qtd.'), t('Receita'), t('Lucro')];
  pdf.heading(t('Mais vendidos (por quantidade)'));
  pdf.table(rankHead, rankRows(r.top_products || []), { right: [2, 3, 4], widths: { 0: 12 }, empty: t('Sem vendas.') });
  pdf.heading(t('Mais rentáveis (por lucro)'));
  pdf.table(rankHead, rankRows(r.top_profitable || []), { right: [2, 3, 4], widths: { 0: 12 }, empty: t('Sem vendas com lucro.') });

  pdf.heading(t('Por forma de pagamento'));
  pdf.table([t('Forma'), t('Valor')], Object.entries(r.by_payment).filter(([k, v]) => v > 0 || k !== 'mobile_money').map(([k, v]) => [PAYMENT_LABEL[k] || k, money(v)]), { right: [1] });

  pdf.heading(t('Por caixista'));
  pdf.table([t('Caixista'), t('Vendas'), t('Receita')], r.by_cashier.map((c) => [c.name, int(c.sales), money(c.revenue)]), { right: [1, 2], empty: t('Sem vendas.') });

  if (r.by_category.length) {
    pdf.heading(t('Por categoria'));
    pdf.table([t('Categoria'), t('Receita')], r.by_category.map((c) => [c.category, money(c.revenue)]), { right: [1] });
  }

  pdf.heading(t('Perdas') + (r.losses.length ? ' · ' + t('{value} ao custo', { value: money(r.losses_total) }) : ''));
  pdf.table([t('Data'), t('Produto'), t('Qtd.'), t('Motivo'), t('Valor')], r.losses.map((l) => [dateTime(l.recorded_at), l.name, int(l.quantity), lossReason(l.reason), '-' + money(l.value)]), { right: [2, 4], empty: t('Nenhuma perda registada.') });

  pdf.heading(t('Vendas perdidas (o que os clientes pediram e não havia)'));
  pdf.table([t('Produto'), t('Unid.'), t('Pedidos'), t('Valor estimado')], r.lost_demand.map((x) => [x.outside ? t('{name} (fora do catálogo)', { name: x.name }) : x.name, int(x.units ?? x.requests), int(x.requests), x.estimated_value != null ? money(x.estimated_value) : '—']), { right: [1, 2, 3], empty: t('Nenhum pedido registado.') });

  pdf.heading(t('Cancelamentos') + (r.cancellations.length ? ` · ${money(r.cancelled_total)}` : ''));
  pdf.table([t('Data'), t('Caixista'), t('Motivo'), t('Valor')], r.cancellations.map((c) => [dateTime(c.created_at), c.cashier, c.reason || t('sem motivo'), money(c.total_amount)]), { right: [3], empty: t('Nenhum.') });

  pdf.heading(t('Fechos de turno'));
  pdf.table([t('Caixista'), t('Fecho'), t('Contado'), t('Esperado'), t('Diferença')], r.shift_closings.map((s) => [s.cashier, dateTime(s.closed_at), money(s.counted_amount), money(s.expected_amount), s.difference === 0 ? t('Certo') : money(s.difference, { sign: true })]), { right: [2, 3, 4], empty: t('Nenhum.') });
}

function restock(pdf, data, title) {
  if (!data) return;
  pdf.heading(title + (data.items.length ? ` · ${money(data.total_investment)}` : ''));
  pdf.note(t('Ao ritmo das vendas dos últimos {w} dias, para {c} dias.', { w: data.window_days, c: data.cover_days }));
  pdf.table([t('Produto'), t('Stock'), t('Vende/dia'), t('Comprar'), t('Investimento')], data.items.map((i) => [i.name, int(i.stock), decimal(i.per_day), int(i.quantity), money(i.investment)]), { right: [1, 2, 3, 4], empty: t('O stock actual chega para este período.') });
  if (data.slow_movers.length) pdf.note(t('Não reforçar: {list}.', { list: data.slow_movers.map((s) => t('{name} ({n} em stock)', { name: s.name, n: int(s.stock) })).join(', ') }));
}

function timeline(pdf, tl, sameDay) {
  if (!tl) return;
  pdf.heading(t('Rastreio'));
  pdf.note(t('{gains} em vendas · {losses} em perdas · lucro do período {profit}', { gains: money(tl.totals.gains, { sign: true }), losses: money(tl.totals.losses), profit: money(tl.totals.profit) }) + (tl.rows.length < tl.total ? ' · ' + t('mostra os primeiros {n} de {total} movimentos', { n: tl.rows.length, total: tl.total }) : ''));
  pdf.table([sameDay ? t('Hora') : t('Data'), t('Movimento'), t('Quem'), t('Valor')], tl.rows.map((e) => [
    timelineWhen(e, sameDay),
    [timelineTitle(e), timelineDetail(e), timelineExtra(e)].filter(Boolean).join(' · '),
    timelineWho(e) || '',
    timelineValueText(e),
  ]), { right: [3], widths: { 0: sameDay ? 18 : 34, 2: 30, 3: 28 }, empty: t('Nada aconteceu neste período.') });
}

// kind: 'daily' | 'weekly' | 'monthly'
// labels: { title, subtitle, period (para o nome do ficheiro), dayLabel(iso) }
export function buildReportPdf({ kind, shopName, data, timeline: tl, labels }) {
  const pdf = createDoc();
  pdf.header({ shopName, title: labels.title, subtitle: labels.subtitle });

  if (kind === 'monthly') {
    const d = data.deductions;
    pdf.heading(t('Do que entrou ao que ficou'));
    pdf.table(null, [
      [t('Receita bruta'), money(data.gross_revenue)],
      [t('Custo dos produtos vendidos'), '-' + money(data.cost_of_goods)],
      [t('Lucro bruto'), money(data.gross_profit)],
      [t('Salários'), '-' + money(d.total_salaries)],
      [t('Renda'), '-' + money(d.total_rent)],
      [t('Outros custos fixos'), '-' + money(d.total_other_fixed)],
      [t('Entregas de fornecedores'), '-' + money(d.total_supplier_delivery)],
      [t('Despesas avulsas'), '-' + money(d.total_expenses || 0)],
      [t('Lucro líquido real'), money(data.net_profit)],
    ], { right: [1], widths: { 0: 80 } });
    if (data.losses_total > 0) pdf.note(t('Perdas do mês (quebras e validades): -{losses}. Depois das perdas ficariam {after}.', { losses: money(data.losses_total), after: money(data.net_profit - data.losses_total) }));
    pdf.note(data.goal ? t('Meta: {pct} ({achieved} de {target}).', { pct: pctText(data.goal.pct), achieved: money(data.goal.achieved), target: money(data.goal.target) }) : t('Sem meta neste mês.'));
    pdf.note(t('Mês anterior: receita {revenue}, lucro bruto {profit}.', { revenue: money(data.compare.previous_revenue), profit: money(data.compare.previous_gross_profit) }));
    if (data.expenses?.by_category.length) {
      pdf.heading(t('Despesas avulsas por categoria'));
      pdf.table([t('Categoria'), t('Valor')], data.expenses.by_category.map((c) => [c.category, '-' + money(c.amount)]), { right: [1] });
    }
    pdf.heading(t('Semanas do mês'));
    pdf.table([t('Semana'), t('Dias'), t('Receita'), t('Resultado')], data.weeks.map((w) => [String(w.week), `${w.from.slice(8)}-${w.to.slice(8)}`, money(w.revenue), money(w.gross_profit - w.losses)]), { right: [2, 3] });
    pdf.heading(t('A crescer / a cair (vs mês anterior)'));
    pdf.table([t('Produto'), t('Antes'), t('Agora'), t('Tendência')], [
      ...data.trends.growing.map((x) => [x.name, int(x.previous_quantity), int(x.quantity), t('a crescer')]),
      ...data.trends.declining.map((x) => [x.name, int(x.previous_quantity), int(x.quantity), t('a cair')]),
    ], { right: [1, 2], empty: t('Sem mudanças.') });
    pdf.heading(t('Txenekas'));
    pdf.note(t('Novas {new} · recebidas {received} · em aberto {open}', { new: money(data.debts.new_total), received: money(data.debts.received_total), open: money(data.debts.outstanding_total) }));
    pdf.table([t('Devedor'), t('Em aberto'), t('Estado')], data.debts.outstanding.map((x) => [x.debtor, money(x.remaining), x.overdue ? t('vencida') : '']), { right: [1], empty: t('Nada em dívida.') });
  }

  kpis(pdf, data);

  if (kind === 'daily' && data.goal_progress) {
    const g = data.goal_progress;
    pdf.note(t('Meta do mês {target} · este dia +{today} · acumulado {acc} ({accValue})', { target: money(g.target), today: pctText(g.today_pct), acc: pctText(g.accumulated_pct), accValue: money(g.accumulated) }));
  }

  if (kind === 'weekly') {
    pdf.heading(t('Dia a dia'));
    pdf.table([t('Dia'), t('Vendas'), t('Receita'), t('Lucro bruto'), t('Perdas'), t('Resultado')], data.by_day.map((d) => [labels.dayLabel(d.date), int(d.sales), money(d.revenue), money(d.gross_profit), d.losses ? '-' + money(d.losses) : '-', money(d.gross_profit - d.losses)]), { right: [1, 2, 3, 4, 5] });
    if (data.best_day) pdf.note(t('Melhor dia: {day}', { day: labels.dayLabel(data.best_day.date) }) + (data.worst_day && data.worst_day.date !== data.best_day.date ? ' · ' + t('pior dia: {day}', { day: labels.dayLabel(data.worst_day.date) }) : '') + '.');
  }

  breakdown(pdf, data);
  if (kind === 'weekly') restock(pdf, data.restock, t('O que comprar para a próxima semana'));
  if (kind === 'monthly') restock(pdf, data.restock, t('O que comprar para o próximo mês'));
  timeline(pdf, tl, kind === 'daily');
  pdf.footer();

  const kindName = { daily: t('Relatório diário'), weekly: t('Relatório semanal'), monthly: t('Relatório mensal') }[kind];
  return { blob: pdf.doc.output('blob'), filename: `${kindName} - ${safeFileName(shopName)} (${safeFileName(labels.period)}).pdf` };
}


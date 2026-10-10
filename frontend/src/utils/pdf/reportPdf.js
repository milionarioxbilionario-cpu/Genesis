// Relatorio diario/semanal/mensal em PDF (A4), gerado a partir dos mesmos
// dados que o ecra mostra. Substitui o window.print(), que nao faz nada na app
// do ecra principal do iPhone (teste do fundador, 10/10/2026).
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { money, int, date, dateTime, PAYMENT_LABEL } from '../format';
import { timelineExtra, timelineValueText, timelineWhen } from '../timelineText';
import { pdfText as t, safeFileName } from './text';

const M = 14;
const ACCENT = [4, 120, 87];
const INK = [28, 25, 23];
const MUTED = [120, 113, 108];
const pctText = (v) => String(v).replace('.', ',') + '%';

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
    doc.text(t(text), M, y);
    y += 2;
  };

  const note = (text) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(t(text), pageW - 2 * M);
    ensure(lines.length * 4.2 + 2);
    y += 4;
    doc.text(lines, M, y);
    y += (lines.length - 1) * 4.2;
  };

  // right = indices das colunas numericas (alinhadas a direita)
  const table = (head, body, { right = [], empty = 'Nada a registar.', widths = {} } = {}) => {
    const columnStyles = {};
    for (const i of right) columnStyles[i] = { halign: 'right' };
    for (const [i, w] of Object.entries(widths)) columnStyles[i] = { ...(columnStyles[i] || {}), cellWidth: w };
    autoTable(doc, {
      startY: y + 2,
      margin: { left: M, right: M, bottom: 16 },
      head: head ? [head.map(t)] : undefined,
      body: body.length ? body.map((r) => r.map((c) => t(c))) : [[{ content: t(empty), colSpan: head ? head.length : 2, styles: { textColor: MUTED } }]],
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
    doc.text(t(shopName || 'Genesis'), M, y + 4);
    doc.setFontSize(12.5); doc.text(t(title), M, y + 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...MUTED);
    doc.text(t(subtitle), M, y + 16.5);
    doc.text(t(`Gerado em ${new Date().toLocaleString('pt-PT')}`), pageW - M, y + 4, { align: 'right' });
    doc.setDrawColor(...ACCENT); doc.setLineWidth(0.6); doc.line(M, y + 19.5, pageW - M, y + 19.5); doc.setLineWidth(0.2);
    y += 21;
  };

  const footer = () => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i += 1) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text(t(`Genesis · página ${i} de ${n}`), pageW - M, pageH - 8, { align: 'right' });
    }
  };

  return { doc, heading, note, table, header, footer };
}

const rankRows = (rows) => rows.map((p) => [`${p.rank}.º`, p.name, int(p.quantity), money(p.revenue), money(p.profit)]);

function kpis(pdf, r) {
  pdf.heading('Resumo');
  pdf.table(null, [
    ['Receita', `${money(r.gross_revenue)} · ${int(r.sales_count)} venda(s)`],
    ['Ticket médio', money(r.average_ticket)],
    ['Custo dos produtos', money(r.cost_of_goods)],
    ['Lucro bruto', money(r.gross_profit)],
    ['Perdas (ao custo)', r.losses_total ? '-' + money(r.losses_total) : money(0)],
    ['Resultado (lucro bruto - perdas)', money(r.gross_profit - r.losses_total)],
    ...(r.discounts_total ? [['Descontos concedidos', '-' + money(r.discounts_total)]] : []),
    ...(r.compare?.revenue_change_pct != null ? [['Receita vs período anterior', (r.compare.revenue_change_pct > 0 ? '+' : '') + pctText(r.compare.revenue_change_pct)]] : []),
  ], { right: [1], widths: { 0: 80 } });
}

function breakdown(pdf, r) {
  const rankHead = ['#', 'Produto', 'Qtd.', 'Receita', 'Lucro'];
  pdf.heading('Mais vendidos (por quantidade)');
  pdf.table(rankHead, rankRows(r.top_products || []), { right: [2, 3, 4], widths: { 0: 12 }, empty: 'Sem vendas.' });
  pdf.heading('Mais rentáveis (por lucro)');
  pdf.table(rankHead, rankRows(r.top_profitable || []), { right: [2, 3, 4], widths: { 0: 12 }, empty: 'Sem vendas com lucro.' });

  pdf.heading('Por forma de pagamento');
  pdf.table(['Forma', 'Valor'], Object.entries(r.by_payment).filter(([k, v]) => v > 0 || k !== 'mobile_money').map(([k, v]) => [PAYMENT_LABEL[k] || k, money(v)]), { right: [1] });

  pdf.heading('Por caixista');
  pdf.table(['Caixista', 'Vendas', 'Receita'], r.by_cashier.map((c) => [c.name, int(c.sales), money(c.revenue)]), { right: [1, 2], empty: 'Sem vendas.' });

  if (r.by_category.length) {
    pdf.heading('Por categoria');
    pdf.table(['Categoria', 'Receita'], r.by_category.map((c) => [c.category, money(c.revenue)]), { right: [1] });
  }

  pdf.heading(`Perdas${r.losses.length ? ` · ${money(r.losses_total)} ao custo` : ''}`);
  pdf.table(['Data', 'Produto', 'Qtd.', 'Motivo', 'Valor'], r.losses.map((l) => [dateTime(l.recorded_at), l.name, int(l.quantity), l.reason_label, '-' + money(l.value)]), { right: [2, 4], empty: 'Nenhuma perda registada.' });

  pdf.heading('Oportunidades perdidas (pedidos quando não havia)');
  pdf.table(['Produto', 'Pedidos'], r.lost_demand.map((d) => [d.name, `${d.requests}x`]), { right: [1], empty: 'Nenhum pedido registado.' });

  pdf.heading(`Cancelamentos${r.cancellations.length ? ` · ${money(r.cancelled_total)}` : ''}`);
  pdf.table(['Data', 'Caixista', 'Motivo', 'Valor'], r.cancellations.map((c) => [dateTime(c.created_at), c.cashier, c.reason || 'sem motivo', money(c.total_amount)]), { right: [3], empty: 'Nenhum.' });

  pdf.heading('Fechos de turno');
  pdf.table(['Caixista', 'Fecho', 'Contado', 'Esperado', 'Diferença'], r.shift_closings.map((s) => [s.cashier, dateTime(s.closed_at), money(s.counted_amount), money(s.expected_amount), s.difference === 0 ? 'Certo' : money(s.difference, { sign: true })]), { right: [2, 3, 4], empty: 'Nenhum.' });
}

function restock(pdf, data, title) {
  if (!data) return;
  pdf.heading(title + (data.items.length ? ` · ${money(data.total_investment)}` : ''));
  pdf.note(`Ao ritmo das vendas dos últimos ${data.window_days} dias, para ${data.cover_days} dias.`);
  pdf.table(['Produto', 'Stock', 'Vende/dia', 'Comprar', 'Investimento'], data.items.map((i) => [i.name, int(i.stock), String(i.per_day).replace('.', ','), int(i.quantity), money(i.investment)]), { right: [1, 2, 3, 4], empty: 'O stock actual chega para este período.' });
  if (data.slow_movers.length) pdf.note('Não reforçar: ' + data.slow_movers.map((s) => `${s.name} (${int(s.stock)} em stock)`).join(', ') + '.');
}

function timeline(pdf, tl, sameDay) {
  if (!tl) return;
  pdf.heading('Rastreio');
  pdf.note(`${money(tl.totals.gains, { sign: true })} em vendas · ${money(tl.totals.losses)} em perdas · lucro do período ${money(tl.totals.profit)}${tl.rows.length < tl.total ? ` · mostra os primeiros ${tl.rows.length} de ${tl.total} movimentos` : ''}`);
  pdf.table([sameDay ? 'Hora' : 'Data', 'Movimento', 'Quem', 'Valor'], tl.rows.map((e) => [
    timelineWhen(e, sameDay),
    [e.title, e.detail, timelineExtra(e)].filter(Boolean).join(' · '),
    e.who || '',
    timelineValueText(e),
  ]), { right: [3], widths: { 0: sameDay ? 18 : 34, 2: 30, 3: 28 }, empty: 'Nada aconteceu neste período.' });
}

// kind: 'daily' | 'weekly' | 'monthly'
// labels: { title, subtitle, period (para o nome do ficheiro), dayLabel(iso) }
export function buildReportPdf({ kind, shopName, data, timeline: tl, labels }) {
  const pdf = createDoc();
  pdf.header({ shopName, title: labels.title, subtitle: labels.subtitle });

  if (kind === 'monthly') {
    const d = data.deductions;
    pdf.heading('Do que entrou ao que ficou');
    pdf.table(null, [
      ['Receita bruta', money(data.gross_revenue)],
      ['Custo dos produtos vendidos', '-' + money(data.cost_of_goods)],
      ['Lucro bruto', money(data.gross_profit)],
      ['Salários', '-' + money(d.total_salaries)],
      ['Renda', '-' + money(d.total_rent)],
      ['Outros custos fixos', '-' + money(d.total_other_fixed)],
      ['Entregas de fornecedores', '-' + money(d.total_supplier_delivery)],
      ['Despesas avulsas', '-' + money(d.total_expenses || 0)],
      ['Lucro líquido real', money(data.net_profit)],
    ], { right: [1], widths: { 0: 80 } });
    if (data.losses_total > 0) pdf.note(`Perdas do mês (quebras e validades): -${money(data.losses_total)}. Depois das perdas ficariam ${money(data.net_profit - data.losses_total)}.`);
    pdf.note(data.goal ? `Meta: ${pctText(data.goal.pct)} (${money(data.goal.achieved)} de ${money(data.goal.target)}).` : 'Sem meta neste mês.');
    pdf.note(`Mês anterior: receita ${money(data.compare.previous_revenue)}, lucro bruto ${money(data.compare.previous_gross_profit)}.`);
    if (data.expenses?.by_category.length) {
      pdf.heading('Despesas avulsas por categoria');
      pdf.table(['Categoria', 'Valor'], data.expenses.by_category.map((c) => [c.category, '-' + money(c.amount)]), { right: [1] });
    }
    pdf.heading('Semanas do mês');
    pdf.table(['Semana', 'Dias', 'Receita', 'Resultado'], data.weeks.map((w) => [String(w.week), `${w.from.slice(8)}-${w.to.slice(8)}`, money(w.revenue), money(w.gross_profit - w.losses)]), { right: [2, 3] });
    pdf.heading('A crescer / a cair (vs mês anterior)');
    pdf.table(['Produto', 'Antes', 'Agora', 'Tendência'], [
      ...data.trends.growing.map((x) => [x.name, int(x.previous_quantity), int(x.quantity), 'a crescer']),
      ...data.trends.declining.map((x) => [x.name, int(x.previous_quantity), int(x.quantity), 'a cair']),
    ], { right: [1, 2], empty: 'Sem mudanças.' });
    pdf.heading('Chenecas');
    pdf.note(`Novas ${money(data.debts.new_total)} · recebidas ${money(data.debts.received_total)} · em aberto ${money(data.debts.outstanding_total)}`);
    pdf.table(['Devedor', 'Em aberto', 'Estado'], data.debts.outstanding.map((x) => [x.debtor, money(x.remaining), x.overdue ? 'vencida' : '']), { right: [1], empty: 'Nada em dívida.' });
  }

  kpis(pdf, data);

  if (kind === 'daily' && data.goal_progress) {
    const g = data.goal_progress;
    pdf.note(`Meta do mês ${money(g.target)} · este dia +${pctText(g.today_pct)} · acumulado ${pctText(g.accumulated_pct)} (${money(g.accumulated)})`);
  }

  if (kind === 'weekly') {
    pdf.heading('Dia a dia');
    pdf.table(['Dia', 'Vendas', 'Receita', 'Lucro bruto', 'Perdas', 'Resultado'], data.by_day.map((d) => [labels.dayLabel(d.date), int(d.sales), money(d.revenue), money(d.gross_profit), d.losses ? '-' + money(d.losses) : '-', money(d.gross_profit - d.losses)]), { right: [1, 2, 3, 4, 5] });
    if (data.best_day) pdf.note(`Melhor dia: ${labels.dayLabel(data.best_day.date)}${data.worst_day && data.worst_day.date !== data.best_day.date ? ` · pior dia: ${labels.dayLabel(data.worst_day.date)}` : ''}.`);
  }

  breakdown(pdf, data);
  if (kind === 'weekly') restock(pdf, data.restock, 'O que comprar para a próxima semana');
  if (kind === 'monthly') restock(pdf, data.restock, 'O que comprar para o próximo mês');
  timeline(pdf, tl, kind === 'daily');
  pdf.footer();

  const kindName = { daily: 'diário', weekly: 'semanal', monthly: 'mensal' }[kind];
  return { blob: pdf.doc.output('blob'), filename: `Relatório ${kindName} - ${safeFileName(shopName)} (${safeFileName(labels.period)}).pdf` };
}


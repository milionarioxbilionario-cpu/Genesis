// Nomes da auditoria do dono (Fase 8.5). Os grupos (filtros) vem do servidor
// (backend/src/utils/auditGroups.js); aqui so o texto de cada accao e dos campos
// guardados em "antes / depois". O texto em portugues e a chave da traducao
// (Fase 9.4): actionLabel, fieldLabel e fieldValue saem na lingua actual.
import { money, date } from './format.js';
import { t } from '../i18n/core.js';

export const ACTION_LABEL = {
  CREATE_SALE: 'Venda', CANCEL_SALE: 'Venda cancelada', CANCEL_ATTEMPT: 'PIN errado ao cancelar venda', DISCOUNT_AUTHORIZED: 'Desconto autorizado',
  DISCOUNT_PIN_FAIL: 'PIN errado em desconto', SALES_VIEWED: 'Vendas do dia vistas no terminal',
  STOCK_ENTRY: 'Entrada de stock', STOCK_ADJUSTMENT: 'Ajuste de stock', LOT_EXPIRY_CHANGED: 'Validade de lote alterada', CREATE_SHRINKAGE: 'Quebra registada',
  AUTO_EXPIRY_LOSS: 'Lote vencido (perda automática)', IMPORT_CATALOG: 'Catálogo inicial importado', CREATE_DEMAND_CAPTURE: 'Venda perdida (produto em falta)',
  CREATE_PRODUCT: 'Produto criado', UPDATE_PRODUCT: 'Produto alterado', DELETE_PRODUCT: 'Produto removido',
  SHIFT_CLOSING_OK: 'Fecho de turno', SHIFT_ATTEMPT_FAIL: 'Contagem errada no fecho', SHIFT_OPENED: 'Turno reaberto pelo dono', CASHIER_LOCKED: 'Caixista bloqueado',
  CASHIER_UNLOCKED: 'Caixista desbloqueado', POS_LOGIN: 'Entrada no terminal',
  AUTH_PIN_CHANGED: 'PIN de autorização alterado', AUTH_PIN_CHANGE_FAIL: 'Senha errada ao mudar o PIN', RESET_CASHIER_PIN: 'PIN de caixista alterado',
  POS_PIN_FAIL: 'PIN errado no terminal', SHIFT_OPEN_PIN_FAIL: 'PIN errado ao reabrir turno', SALES_VIEW_PIN_FAIL: 'PIN errado ao ver vendas',
  TERMINAL_PAIRED: 'Terminal emparelhado', TERMINAL_PAIRING_CODE: 'Código de emparelhamento gerado', TERMINAL_REVOKED: 'Terminal revogado',
  SUPPORT_SESSION_OPENED: 'Acesso de suporte Genesis',
  PANEL_PIN_CREATED: 'PIN do painel criado', PANEL_PIN_CHANGED: 'PIN do painel alterado', PANEL_UNLOCK_FAIL: 'PIN errado ao desbloquear o painel',
  PANEL_LOCK_SIGNED_OUT: 'Sessão terminada por PINs errados', PASSKEY_ADDED: 'Face ID / impressão digital activado', PASSKEY_REMOVED: 'Face ID / impressão digital removido',
  CREATE_CASHIER: 'Caixista criado', UPDATE_CASHIER: 'Caixista alterado', DEACTIVATE_CASHIER: 'Caixista desactivado', REACTIVATE_CASHIER: 'Caixista reactivado',
  CREATE_EMPLOYEE: 'Trabalhador criado', UPDATE_EMPLOYEE: 'Trabalhador alterado',
  UPDATE_STORE: 'Dados da loja alterados', UPDATE_HOURS: 'Horário alterado', UPDATE_DISCOUNT_POLICY: 'Limite de desconto alterado', UPDATE_EXPIRY_ALERT: 'Aviso de validade alterado',
  UPDATE_MONTH_CLOSE_DAY: 'Dia do fecho do mês alterado', UPDATE_AUDIT_RETENTION: 'Tempo da auditoria alterado', UPDATE_REPORT_SCHEDULE: 'Horário dos relatórios alterado',
  CREATE_FIXED_COST: 'Custo fixo criado', UPDATE_FIXED_COST: 'Custo fixo alterado', DELETE_FIXED_COST: 'Custo fixo removido',
  CREATE_EXPENSE: 'Despesa registada', UPDATE_EXPENSE: 'Despesa alterada', DELETE_EXPENSE: 'Despesa removida', SET_GOAL: 'Meta definida',
  CREATE_DEBT: 'Cheneca criada', DEBT_PAYMENT: 'Pagamento de cheneca',
  CREATE_SHOPPING_LIST: 'Lista de compras criada', UPDATE_SHOPPING_LIST: 'Lista de compras alterada', SHOPPING_LIST_STATUS: 'Estado da lista de compras', DELETE_SHOPPING_LIST: 'Lista de compras apagada',
  MONTH_CLOSE_SEEN: 'Fecho do mês visto', WHATSAPP_ALERTS_SENT: 'Alertas enviados por WhatsApp', REPORT_SENT: 'Relatório enviado por WhatsApp', REPORT_SEND_FAILED: 'Relatório por WhatsApp falhou',
};
export const actionLabel = (a) => (ACTION_LABEL[a] ? t(ACTION_LABEL[a]) : a);

// Accoes que merecem atencao (PIN errado, bloqueio...).
export const ALERT_ACTIONS = new Set(['CANCEL_ATTEMPT', 'DISCOUNT_PIN_FAIL', 'POS_PIN_FAIL', 'SHIFT_ATTEMPT_FAIL', 'CASHIER_LOCKED', 'AUTH_PIN_CHANGE_FAIL', 'SHIFT_OPEN_PIN_FAIL', 'SALES_VIEW_PIN_FAIL', 'CANCEL_SALE', 'REPORT_SEND_FAILED', 'PANEL_UNLOCK_FAIL', 'PANEL_LOCK_SIGNED_OUT']);

// Campos guardados em centavos -> mostrados em MT.
const MONEY = new Set(['cost_price', 'sell_price', 'unit_cost', 'unit_price', 'total_amount', 'amount', 'counted_amount', 'expected_amount', 'difference', 'discount_amount', 'monthly_salary', 'delivery_cost_per_visit', 'target_amount', 'value', 'total', 'amount_paid']);
export const FIELD_LABEL = {
  name: 'Nome', product_name: 'Produto', product_id: 'Produto (id)', category: 'Categoria', cost_price: 'Preço de compra', sell_price: 'Preço de venda',
  stock_qty: 'Stock', added: 'Entraram', delta: 'Variação', quantity: 'Quantidade', reason: 'Motivo', unit_cost: 'Custo unitário', unit_price: 'Preço unitário',
  supplier_id: 'Fornecedor (id)', lots: 'Lotes', expiry_date: 'Validade', has_expiry: 'Com validade', barcode: 'Código de barras', icon: 'Ícone', min_stock: 'Stock mínimo',
  is_active: 'Activo', total_amount: 'Total', amount: 'Valor', counted_amount: 'Contado', expected_amount: 'Esperado', difference: 'Diferença',
  payment_method: 'Pagamento', terminal_id: 'Terminal (id)', months: 'Meses', expiry_alert_days: 'Dias de aviso', month_close_day: 'Dia do fecho',
  discount_free_pct: 'Desconto livre (%)', opening_time: 'Abre', closing_time: 'Fecha', role: 'Função', phone: 'Telefone', location: 'Localização',
  daily_report_time: 'Hora do relatório diário', weekly_report_day: 'Dia do relatório semanal', weekly_report_time: 'Hora do relatório semanal', monthly_report_time: 'Hora do relatório mensal',
  audit_retention_months: 'Meses guardados', status: 'Estado', debtor_name: 'Cliente', due_date: 'Data limite', monthly_salary: 'Salário', cancel_reason: 'Motivo',
};
export const fieldLabel = (k) => (FIELD_LABEL[k] ? t(FIELD_LABEL[k]) : k.replace(/_/g, ' '));

export const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
export function fieldValue(k, v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? t('Sim') : t('Não');
  if (k === 'image_url') return t('foto');
  if (MONEY.has(k) && typeof v === 'number') return money(v);
  if (k === 'weekly_report_day' && typeof v === 'number') return WEEKDAY[v] ? t(WEEKDAY[v]) : String(v);
  if (k === 'lots' && Array.isArray(v)) return v.map((l) => (l.expiry_date ? t('{n} un. até {d}', { n: l.quantity, d: date(l.expiry_date) }) : t('{n} un.', { n: l.quantity }))).join(' · ');
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T|$)/.test(v)) return date(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// Linhas "campo: antes -> depois" de um registo.
export function diffRows(oldValue, newValue) {
  const o = oldValue && typeof oldValue === 'object' && !Array.isArray(oldValue) ? oldValue : null;
  const n = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : null;
  // Campos do "depois" (com o "antes" quando existe). Um campo so do "antes"
  // nao foi mudado — mostrar "—" no depois parecia que tinha sido apagado.
  // Sem "depois" (ex.: remocao) mostra-se o que havia.
  const base = n && Object.keys(n).length ? Object.keys(n) : Object.keys(o || {});
  const keys = base.filter((k) => !/_hash$|password|pin$/i.test(k));
  const NONE = '—';
  return keys.map((k) => ({ key: k, label: fieldLabel(k), before: o && k in o ? fieldValue(k, o[k]) : NONE, after: n && k in n ? fieldValue(k, n[k]) : NONE }))
    .filter((r) => r.before !== r.after || (!n && r.before !== NONE));
}

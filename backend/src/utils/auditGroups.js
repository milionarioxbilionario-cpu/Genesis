// Auditoria do dono (Fase 8.5, pedido do fundador 10/10/2026): tipos de
// registo para os filtros, inicio de hoje/semana/mes e o corte da retencao —
// tudo pelo calendario de Maputo (UTC+2, sem hora de verao). Funcoes PURAS
// (testadas em tests/auditGroups.test.js).
const { dayInMaputo } = require('./fefo');

const GROUPS = [
  { key: 'sales', label: 'Vendas', actions: ['CREATE_SALE', 'CANCEL_SALE', 'CANCEL_ATTEMPT', 'DISCOUNT_AUTHORIZED', 'DISCOUNT_PIN_FAIL', 'SALES_VIEWED'] },
  { key: 'stock', label: 'Stock', actions: ['STOCK_ENTRY', 'STOCK_ADJUSTMENT', 'LOT_EXPIRY_CHANGED', 'CREATE_SHRINKAGE', 'AUTO_EXPIRY_LOSS', 'IMPORT_CATALOG', 'CREATE_DEMAND_CAPTURE'] },
  { key: 'products', label: 'Produtos', actions: ['CREATE_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT'] },
  { key: 'shifts', label: 'Turnos', actions: ['SHIFT_CLOSING_OK', 'SHIFT_ATTEMPT_FAIL', 'SHIFT_OPENED', 'CASHIER_LOCKED', 'CASHIER_UNLOCKED', 'POS_LOGIN'] },
  { key: 'security', label: 'PINs e segurança', actions: ['AUTH_PIN_CHANGED', 'AUTH_PIN_CHANGE_FAIL', 'RESET_CASHIER_PIN', 'POS_PIN_FAIL', 'SHIFT_OPEN_PIN_FAIL', 'SALES_VIEW_PIN_FAIL', 'TERMINAL_PAIRED', 'TERMINAL_PAIRING_CODE', 'TERMINAL_REVOKED', 'SUPPORT_SESSION_OPENED'] },
  { key: 'team', label: 'Equipa', actions: ['CREATE_CASHIER', 'UPDATE_CASHIER', 'DEACTIVATE_CASHIER', 'REACTIVATE_CASHIER', 'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE'] },
  { key: 'settings', label: 'Definições e custos', actions: ['UPDATE_STORE', 'UPDATE_HOURS', 'UPDATE_DISCOUNT_POLICY', 'UPDATE_EXPIRY_ALERT', 'UPDATE_MONTH_CLOSE_DAY', 'UPDATE_AUDIT_RETENTION', 'UPDATE_REPORT_SCHEDULE', 'CREATE_FIXED_COST', 'UPDATE_FIXED_COST', 'DELETE_FIXED_COST', 'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE', 'SET_GOAL'] },
  { key: 'debts', label: 'Chenecas', actions: ['CREATE_DEBT', 'DEBT_PAYMENT'] },
  { key: 'shopping', label: 'Listas de compras', actions: ['CREATE_SHOPPING_LIST', 'UPDATE_SHOPPING_LIST', 'SHOPPING_LIST_STATUS', 'DELETE_SHOPPING_LIST'] },
];
const BY_ACTION = new Map(GROUPS.flatMap((g) => g.actions.map((a) => [a, g.key])));
const KNOWN = [...BY_ACTION.keys()];
const GROUP_KEYS = [...GROUPS.map((g) => g.key), 'other'];

const groupOf = (action) => BY_ACTION.get(action) || 'other';

// Filtro Prisma do campo `action` para um grupo ("other" = tudo o resto).
function actionFilter(group) {
  if (!group || group === 'all') return undefined;
  if (group === 'other') return { notIn: KNOWN };
  const g = GROUPS.find((x) => x.key === group);
  return g ? { in: g.actions } : undefined;
}

// Nunca se apagam (guiam estados; sao poucas linhas):
//  - bloqueio por contagens erradas (utils/shiftLock.js): conta as falhas
//    desde o ultimo desbloqueio, SEM limite de tempo — apagar falhas antigas
//    desbloqueava sozinho um caixista bloqueado ha meses;
//  - reabertura de turno pelo dono (utils/shift.js);
//  - "visto" do fecho de cada mes (routes/owner.js).
const PROTECTED_ACTIONS = ['CASHIER_UNLOCKED', 'CASHIER_LOCKED', 'SHIFT_ATTEMPT_FAIL', 'SHIFT_OPENED', 'MONTH_CLOSE_SEEN'];

const MAPUTO_OFFSET_MS = 2 * 3600 * 1000;
// Instante (UTC) da meia-noite de Maputo de um dia 'AAAA-MM-DD'.
const maputoMidnight = (day) => new Date(Date.parse(day + 'T00:00:00Z') - MAPUTO_OFFSET_MS);

// Inicio do periodo: hoje, semana (desde segunda) ou mes. 'all' = sem limite.
function periodStart(period, now = new Date()) {
  const today = dayInMaputo(now);
  if (period === 'today') return maputoMidnight(today);
  if (period === 'week') {
    const dow = new Date(today + 'T00:00:00Z').getUTCDay(); // 0 = domingo
    const monday = new Date(Date.parse(today + 'T00:00:00Z') - ((dow + 6) % 7) * 86400000).toISOString().slice(0, 10);
    return maputoMidnight(monday);
  }
  if (period === 'month') return maputoMidnight(today.slice(0, 8) + '01');
  return null;
}

// Retencao de N meses (decisao do fundador: o dono escolhe, minimo 2) = o mes
// corrente + os N-1 anteriores. Devolve o instante a partir do qual se guarda.
const RETENTION_OPTIONS = [2, 3, 6, 12, 24];
function retentionCutoff({ now = new Date(), months }) {
  const m = Math.max(2, Number(months) || 2);
  const today = dayInMaputo(now);
  const y = Number(today.slice(0, 4)); const mon = Number(today.slice(5, 7)) - 1; // 0-11
  const total = y * 12 + mon - (m - 1);
  const day = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}-01`;
  return maputoMidnight(day);
}

module.exports = { GROUPS, GROUP_KEYS, groupOf, actionFilter, PROTECTED_ACTIONS, periodStart, retentionCutoff, RETENTION_OPTIONS, maputoMidnight };

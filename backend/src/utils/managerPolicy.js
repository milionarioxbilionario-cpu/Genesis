// O que o GERENTE pode fazer com as rotas do dono (E2, 31/10/2026).
//
// O fundador: «os gerentes podem ver o estabelecimento deles, mas nao veem
// informacoes super sensiveis (lucro, custos...) e nao podem alterar tudo
// (contacto do dono, senha...)». Duas protecoes, as duas no servidor:
//  1. LISTA FECHADA de rotas (managerAllowed): uma rota do dono so passa para o
//     gerente se estiver aqui. O que nao esta e 403, mesmo que o ecra se esqueca
//     de esconder o botao (middleware/rbac.js).
//  2. RESPOSTAS SEM NUMEROS SENSIVEIS (stripSensitive): custo, lucro, margem,
//     salario, renda, deducoes... saem de todo o JSON que vai para o gerente,
//     pelo nome do campo (middleware/auth.js embrulha o res.json).
// Funcoes puras (tests/managerPolicy.test.js).

const id = '[^/?#]+';
const ALLOW = [
  // Inicio, vendas, avisos, rastreio, turnos
  ['GET', `^/api/owner/(live|tenant|overview|sales|shift-closings|debts|goals/current|goals/history|notifications|alerts|audit|audit/${id})$`],
  ['GET', '^/api/owner/reports/(daily|weekly|timeline)$'],
  // Equipa: caixistas e guardas; terminais
  ['GET', '^/api/owner/(cashiers|terminals)$'],
  ['POST', '^/api/owner/cashiers$'],
  ['PUT', `^/api/owner/cashiers/${id}(/pin|/deactivate|/reactivate)?$`],
  ['POST', `^/api/owner/cashiers/${id}/unlock$`],
  ['POST', '^/api/owner/terminals/pairing-code$'],
  ['POST', `^/api/owner/terminals/${id}/(pairing-code|reactivate|revoke)$`],
  ['PUT', `^/api/owner/terminals/${id}/members$`],
  // Txenekas
  ['POST', `^/api/owner/debts(/${id}/payment)?$`],
  // Produtos e stock (sem custos: o servidor usa o custo que ja existe)
  ['GET', `^/api/products(/${id}/lots)?$`],
  ['POST', '^/api/products$'],
  ['PATCH', `^/api/products/${id}(/stock|/lots/${id})?$`],
  ['GET', `^/api/inventory/(suppliers|stock|suppliers/${id}/entries)$`],
  ['POST', '^/api/inventory/(suppliers|stock)$'],
  ['PUT', `^/api/inventory/suppliers/${id}$`],
  ['GET', `^/api/shopping-lists(/suggestion|/${id}|/${id}/whatsapp)?$`],
  ['POST', '^/api/shopping-lists$'],
  ['PUT', `^/api/shopping-lists/${id}(/status)?$`],
  ['DELETE', `^/api/shopping-lists/${id}$`],
  // Vendas: lista e cancelar (com o PIN de autorizacao)
  ['GET', '^/api/sales(/cancel-pin-status)?$'],
  ['POST', `^/api/sales/${id}/cancel$`],
  // Definicoes operacionais
  ['GET', '^/api/settings(/receipt)?$'],
  ['PUT', '^/api/settings/(hours|custom-items|expiry-alert)$'],
  // So a mensagem do recibo (o resto da rota e recusado em routes/settings.js).
  ['PUT', '^/api/settings/store$'],
  // A propria senha (a conta e dele)
  ['PUT', '^/api/profile/password$'],
].map(([m, re]) => [m, new RegExp(re)]);

function managerAllowed(method, url) {
  const path = String(url || '').split('?')[0].replace(/\/+$/, '') || '/';
  return ALLOW.some(([m, re]) => m === method && re.test(path));
}

// Campos que nunca chegam ao gerente (em qualquer nivel do JSON), pelos PEDACOS
// do nome (snake_case ou camelCase): unit_cost_price, grossProfit, top_profitable,
// fixed_costs, monthly_salary... Um pedaco que COMECA por um destes sai.
const SENSITIVE_PREFIXES = ['cost', 'profit', 'margin', 'margem', 'lucro', 'salar', 'payroll', 'deduc', 'cogs', 'expense', 'despesa'];
// Pedacos que so contam inteiros («rent» sim, «current» e «parent» nao; «custom» nao e «custo»).
const SENSITIVE_WORDS = new Set(['rent', 'renda', 'custo', 'custos', 'investment', 'fines']);
// Nomes inteiros em que o custo vem escondido em palavras neutras.
const SENSITIVE_KEYS = new Set(['stock_value', 'inventory_value', 'losses_total', 'losses_by_reason', 'result_after_losses', 'vat', 'taxes', 'inss_employer_pct']);

function isSensitiveKey(key) {
  if (SENSITIVE_KEYS.has(key)) return true;
  const parts = String(key).replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return parts.some((p) => SENSITIVE_WORDS.has(p) || SENSITIVE_PREFIXES.some((x) => p.startsWith(x)));
}

// Accoes do rastreio que o gerente nao ve (valores de custos, salarios, impostos,
// PIN e dados da conta do dono, estabelecimentos e plano).
const MANAGER_HIDDEN_ACTIONS = [
  'CREATE_FIXED_COST', 'UPDATE_FIXED_COST', 'DELETE_FIXED_COST', 'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE',
  'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE', 'UPDATE_TAXES', 'AUTH_PIN_CHANGED', 'AUTH_PIN_CHANGE_FAIL', 'UPDATE_STORE',
  'UPDATE_ALERTS_PHONE', 'MONTH_CLOSE_SEEN', 'UPDATE_MONTH_CLOSE', 'BIRTHDAY_GIFT_CLAIMED', 'PRICE_CHANGE',
  'PANEL_UNLOCK_FAIL', 'PANEL_LOCK_SIGNED_OUT', 'PANEL_PIN_CREATED', 'PANEL_PIN_CHANGED', 'PANEL_PIN_RESET',
  'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAIL', 'EMAIL_CHANGE_STARTED', 'EMAIL_CHANGED', 'BIRTHDAY_SET', 'PASSKEY_ADDED', 'PASSKEY_REMOVED',
  'CREATE_ESTABLISHMENT', 'ESTABLISHMENT_CLOSED', 'ESTABLISHMENT_DELETED', 'ESTABLISHMENT_REOPENED', 'ESTABLISHMENT_CLOSE_FAIL', 'COPY_CATALOG',
  'MANAGER_CREATED', 'MANAGER_UPDATED',
];

function stripSensitive(value, depth = 0) {
  if (depth > 12 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => stripSensitive(v, depth + 1));
  if (value instanceof Date) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (isSensitiveKey(k)) continue;
    out[k] = stripSensitive(v, depth + 1);
  }
  return out;
}

// Rotas em que o custo vem com nome neutro: as perdas e as entradas de stock
// valem a preco de CUSTO; o «total» da lista de compras e o investimento.
const withoutKeys = (o, keys) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !keys.includes(k)));
function managerReport(r) {
  if (!r || typeof r !== 'object') return r;
  const out = { ...r };
  if (Array.isArray(out.losses)) out.losses = out.losses.map((l) => withoutKeys(l, ['value']));
  if (Array.isArray(out.by_day)) out.by_day = out.by_day.map((d) => withoutKeys(d, ['losses']));
  for (const k of ['best_day', 'worst_day']) if (out[k]) out[k] = withoutKeys(out[k], ['losses']);
  return out;
}
function managerTimeline(t) {
  if (!t || !Array.isArray(t.rows)) return t;
  return {
    ...t,
    totals: withoutKeys(t.totals, ['losses']),
    rows: t.rows.map((e) => (e.type === 'loss' || e.type === 'stock' ? withoutKeys(e, ['amount']) : e)),
  };
}
const listTotalsUnits = (l) => (l && l.totals ? { ...l, totals: { units: l.totals.units } } : l);
// Conta e contactos do dono, plano e subscricao.
const TENANT_HIDDEN = ['phone', 'email', 'trial_ends_at', 'subscription_until', 'subscription_price'];
function managerSettings(s) {
  if (!s || typeof s !== 'object') return s;
  return {
    store: withoutKeys(s.store, ['phone', 'email', 'nuit']),
    hours: s.hours,
    discount_free_pct: s.discount_free_pct,
    custom_items_enabled: s.custom_items_enabled,
    expiry_alert_days: s.expiry_alert_days,
    status: s.status,
  };
}

const OWNER_NOTICES = new Set(['no_location', 'cost_missing']);
function managerNotifications(n) {
  if (!n || !Array.isArray(n.items)) return n;
  const items = n.items.filter((i) => !OWNER_NOTICES.has(i.type));
  return { ...n, items, count: items.length };
}

const SHAPES = [
  ['GET', /^\/api\/owner\/reports\/(daily|weekly)$/, managerReport],
  ['GET', /^\/api\/owner\/reports\/timeline$/, managerTimeline],
  ['GET', /^\/api\/owner\/tenant$/, (t) => withoutKeys(t, TENANT_HIDDEN)],
  // Lotes a expirar: o «value» e a preco de custo.
  ['GET', /^\/api\/owner\/alerts$/, (a) => (a && typeof a === 'object' ? { ...a, expiringLots: (a.expiringLots || []).map((l) => withoutKeys(l, ['value'])), expiredProducts: (a.expiredProducts || []).map((l) => withoutKeys(l, ['value'])) } : a)],
  ['GET', /^\/api\/settings$/, managerSettings],
  ['GET', /^\/api\/shopping-lists$/, (rows) => (Array.isArray(rows) ? rows.map(listTotalsUnits) : rows)],
  ['GET', /^\/api\/shopping-lists\/[^/]+$/, listTotalsUnits],
  // O sino: a localizacao e os custos sao do dono (o gerente nao os muda).
  ['GET', /^\/api\/owner\/notifications$/, managerNotifications],
];

// Resposta para o gerente: a forma da rota (se houver) e depois o corte por nome.
function managerShape(method, url, body) {
  const path = String(url || '').split('?')[0].replace(/\/+$/, '');
  const hit = SHAPES.find(([m, re]) => m === method && re.test(path));
  return stripSensitive(hit ? hit[2](body) : body);
}

// Canal ao vivo do gerente: sem despesas; perdas e entradas de stock sem valor (e custo).
function managerLiveEvent(e) {
  if (!e || e.type === 'expense') return null;
  return stripSensitive(e.type === 'loss' || e.type === 'stock_in' ? { ...e, total: null } : e);
}

module.exports = { managerAllowed, stripSensitive, isSensitiveKey, managerShape, managerLiveEvent, MANAGER_HIDDEN_ACTIONS };

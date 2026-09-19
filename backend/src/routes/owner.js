const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { sendWhatsAppAlert } = require('../utils/whatsapp');
const { getTenantAlertSnapshot, buildAlertSummary } = require('../services/tenantAlerts');
const { computeMonthlyDeductions, computeMonthlyNetProfit } = require('../services/monthlyDeductions');
const { getShiftLock } = require('../utils/shiftLock');

const normalizeRole = (role) => String(role || '').trim();
const money = (v) => Number(v || 0);
const businessHoursStore = new Map();

const getTenantBusinessHours = (tenantId) => {
  return businessHoursStore.get(tenantId) || { opening: '08:00', closing: '18:00' };
};

const updateDebtStatus = (debt) => {
  const total = money(debt.total_amount);
  const paid = money(debt.amount_paid);
  const remaining = total - paid;
  const today = new Date();
  const due = new Date(debt.due_date);

  if (remaining <= 0) return 'paid';
  if (due < today) return 'overdue';
  if (paid > 0) return 'partially_paid';
  return 'active';
};

const ensureTenantScope = (req) => req.user?.tenantId;

const createOwnerAudit = async (req, action, entityType, entityId, extra = {}) => {
  try {
    await prisma.auditLog.create({
      data: {
        tenant_id: ensureTenantScope(req),
        user_id: req.user?.userId || 'system',
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        old_value: extra.old_value ? JSON.stringify(extra.old_value) : null,
        new_value: extra.new_value ? JSON.stringify(extra.new_value) : null,
        ip_address: req.ip || '0.0.0.0',
      },
    });
  } catch (e) {
    console.error('Owner audit failed', action, e.message || e);
  }
};

router.use(auth);
router.use(requireRole('owner'));

router.get('/audit', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { tenant_id: ensureTenantScope(req) },
      orderBy: { created_at: 'desc' },
      take: 40,
      include: { user: true }
    });

    res.json(logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      user_name: log.user?.name || 'Sistema',
      ip_address: log.ip_address,
      created_at: log.created_at,
      old_value: log.old_value ? JSON.parse(log.old_value) : null,
      new_value: log.new_value ? JSON.parse(log.new_value) : null,
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar histórico de auditoria' });
  }
});

router.get('/cashiers', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const cashiers = await prisma.user.findMany({
      where: { tenant_id: tenantId, role: 'cashier' },
      orderBy: { created_at: 'desc' }
    });
    // Estado de bloqueio (fecho cego). O Hub mostra BLOQUEADO e exige a
    // senha do dono antes de deixar voltar a entrar nesse perfil.
    // NB: nunca devolver password_hash (a versao anterior devolvia o user
    // completo, incluindo o hash).
    const withLock = await Promise.all(cashiers.map(async (c) => {
      const lock = await getShiftLock(prisma, tenantId, c.id);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        is_active: c.is_active,
        created_at: c.created_at,
        attempts: lock.attempts,
        maxAttempts: lock.maxAttempts,
        locked: lock.locked,
      };
    }));
    res.json(withLock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar caixistas' });
  }
});

router.post('/cashiers', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: 'Nome e senha são obrigatórios.' });
    }

    const targetEmail = (email || `${String(name).trim().toLowerCase().replace(/\s+/g, '.')}@tenant.local`).toLowerCase();
    const hash = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.create({
      data: {
        tenant_id: ensureTenantScope(req),
        role: 'cashier',
        name: String(name).trim(),
        email: targetEmail,
        phone: phone ? String(phone) : null,
        password_hash: hash,
        is_active: true,
      }
    });

    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, is_active: user.is_active } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar caixista' });
  }
});

router.put('/cashiers/:id/deactivate', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const check = await prisma.user.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, role: 'cashier' },
      select: { id: true, is_active: true },
    });
    if (!check) return res.status(404).json({ error: 'Caixista não encontrado neste estabelecimento' });
    const user = await prisma.user.update({
      where: { id: check.id },
      data: { is_active: false }
    });
    await createOwnerAudit(req, 'DEACTIVATE_CASHIER', 'user', user.id, { old_value: { is_active: check.is_active }, new_value: { is_active: false } });
    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao desactivar caixista' });
  }
});

router.put('/cashiers/:id/reactivate', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const check = await prisma.user.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, role: 'cashier' },
      select: { id: true, is_active: true },
    });
    if (!check) return res.status(404).json({ error: 'Caixista não encontrado neste estabelecimento' });
    const user = await prisma.user.update({
      where: { id: check.id },
      data: { is_active: true }
    });
    await createOwnerAudit(req, 'REACTIVATE_CASHIER', 'user', user.id, { old_value: { is_active: check.is_active }, new_value: { is_active: true } });
    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao reactivar caixista' });
  }
});

router.put('/cashiers/:id/password', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }
    const tenantId = ensureTenantScope(req);
    const check = await prisma.user.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, role: 'cashier' },
      select: { id: true },
    });
    if (!check) return res.status(404).json({ error: 'Caixista não encontrado neste estabelecimento' });
    const hash = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.update({
      where: { id: check.id },
      data: { password_hash: hash }
    });
    await createOwnerAudit(req, 'RESET_CASHIER_PASSWORD', 'user', user.id, { new_value: { reset: true } });
    res.json({ ok: true, user: { id: user.id, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao redefinir senha do caixista' });
  }
});

// Entrada "Vender como": o dono continua logado como owner, mas o POS
// ganha um vendedor activo. Regista audit OPERATE_AS_CASHIER e devolve
// o contexto. Sair do perfil exige fecho de turno (frontend impõe;
// backend valida via /api/owner/cashiers/:id/open-shift).
router.post('/cashiers/:id/operate', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const cashier = await prisma.user.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, role: 'cashier', is_active: true },
      select: { id: true, name: true, email: true, is_active: true },
    });
    if (!cashier) return res.status(404).json({ error: 'Caixista não encontrado ou inactivo neste estabelecimento' });
    await createOwnerAudit(req, 'OPERATE_AS_CASHIER', 'user', cashier.id, {
      new_value: { cashierId: cashier.id, cashierName: cashier.name, device: req.headers['user-agent'] || 'hub' },
    });
    return res.json({ ok: true, cashier });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao entrar no perfil do caixista' });
  }
});

// Há turno aberto para este caixista? O Hub usa isto para bloquear a
// troca de perfil sem fecho de turno. Regra: vendas de hoje sem fecho
// de turno posterior = turno aberto.
router.get('/cashiers/:id/open-shift', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const cashier = await prisma.user.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, role: 'cashier' },
      select: { id: true },
    });
    if (!cashier) return res.status(404).json({ error: 'Caixista não encontrado neste estabelecimento' });
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const saleWhere = { tenant_id: tenantId, cashier_user_id: cashier.id, status: 'completed', created_at: { gte: startOfDay } };
    const [salesToday, lastSale, lastClosing] = await Promise.all([
      prisma.sale.count({ where: saleWhere }),
      prisma.sale.findFirst({ where: saleWhere, orderBy: { created_at: 'desc' }, select: { created_at: true } }),
      prisma.shiftClosing.findFirst({ where: { tenant_id: tenantId, cashier_user_id: cashier.id }, orderBy: { closed_at: 'desc' } }),
    ]);
    // Turno aberto = há venda de hoje POSTERIOR ao último fecho de turno.
    // Não basta comparar o fecho com o início do dia: vender -> fechar ->
    // voltar a vender tem de voltar a exigir fecho antes de sair.
    const open = Boolean(lastSale && (!lastClosing || new Date(lastClosing.closed_at) < new Date(lastSale.created_at)));
    return res.json({ open, salesToday, lastSaleAt: lastSale?.created_at || null, lastClosingAt: lastClosing?.closed_at || null });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar turno' });
  }
});

// A fechadura da porta Hub -> menu Owner: verifica a senha do owner
// sem trocar de sessão. O PC do balcão fica logado como owner o dia
// todo; só volta ao menu com esta senha.
router.post('/verify-password', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Senha obrigatória.' });
    const me = await prisma.user.findUnique({ where: { id: req.user?.userId } });
    if (!me || me.role !== 'owner' || me.tenant_id !== ensureTenantScope(req)) {
      return res.status(403).json({ error: 'Só o dono pode usar esta verificação.' });
    }
    const ok = await bcrypt.compare(String(password), me.password_hash);
    if (!ok) {
      await createOwnerAudit(req, 'VERIFY_OWNER_PASSWORD_FAIL', 'user', me.id, {});
      return res.status(401).json({ error: 'Senha do dono incorrecta.' });
    }
    await createOwnerAudit(req, 'VERIFY_OWNER_PASSWORD', 'user', me.id, {});
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar senha do dono' });
  }
});

// Entrada no perfil do caixista: valida a SENHA DO CAIXISTA SEM criar
// sessão — o PC do balcão continua logado como OWNER (modelo quiosque).
// Nunca usar /api/auth/login aqui: trocaria o cookie httpOnly do dono.
router.post('/cashiers/:id/verify-password', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Senha obrigatória.' });
    const tenantId = ensureTenantScope(req);
    const cashier = await prisma.user.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, role: 'cashier' },
    });
    if (!cashier) return res.status(404).json({ error: 'Caixista não encontrado neste estabelecimento' });
    if (cashier.is_active === false) return res.status(403).json({ error: 'Caixista inactivo.' });
    const ok = await bcrypt.compare(String(password), cashier.password_hash);
    if (!ok) {
      await createOwnerAudit(req, 'VERIFY_CASHIER_PASSWORD_FAIL', 'user', cashier.id, {});
      return res.status(401).json({ error: 'Senha do caixista incorrecta.' });
    }
    await createOwnerAudit(req, 'VERIFY_CASHIER_PASSWORD', 'user', cashier.id, {});
    return res.json({ ok: true, cashier: { id: cashier.id, name: cashier.name, email: cashier.email } });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar senha do caixista' });
  }
});

// ESTADO DO TURNO (caixa cego): o backend sabe o valor real acumulado
// (vendas em DINHEIRO desde o ultimo fecho deste caixista). Nao devolve o
// valor ao frontend — o caixista nao pode ver quanto o sistema espera.
// Devolve apenas: ha vendas sem fecho? quantas tentativas falhadas? bloqueado?
router.get('/cashiers/:id/shift-state', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const cashier = await prisma.user.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, role: 'cashier' },
      select: { id: true, name: true },
    });
    if (!cashier) return res.status(404).json({ error: 'Caixista nao encontrado neste estabelecimento' });
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const lastClosing = await prisma.shiftClosing.findFirst({
      where: { tenant_id: tenantId, cashier_user_id: cashier.id }, orderBy: { closed_at: 'desc' },
    });
    const since = lastClosing ? lastClosing.closed_at : startOfDay;
    const salesSince = await prisma.sale.aggregate({
      where: { tenant_id: tenantId, cashier_user_id: cashier.id, status: 'completed', payment_method: 'cash', created_at: { gt: since } },
      _sum: { total_amount: true },
    });
    const realCash = Number(salesSince._sum.total_amount || 0);
    // Regra imutavel: contam-se falhas DEPOIS do ultimo desbloqueio (nunca se apaga audit)
    const lastUnlock = await prisma.auditLog.findFirst({
      where: { tenant_id: tenantId, action: 'CASHIER_UNLOCKED', entity_id: cashier.id }, orderBy: { created_at: 'desc' },
    });
    const failSince = lastUnlock ? lastUnlock.created_at : startOfDay;
    const attempts = await prisma.auditLog.count({
      where: { tenant_id: tenantId, action: 'SHIFT_ATTEMPT_FAIL', entity_id: cashier.id, created_at: { gt: failSince } },
    });
    const hasOpenSales = await prisma.sale.count({
      where: { tenant_id: tenantId, cashier_user_id: cashier.id, status: 'completed', created_at: { gt: since } },
    });
    return res.json({
      cashier: { id: cashier.id, name: cashier.name },
      hasOpenSales: hasOpenSales > 0,
      attempts, maxAttempts: 3,
      locked: attempts >= 3,
      lastClosingAt: lastClosing?.closed_at || null,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar turno' });
  }
});

// FECHO CEGO: o caixista declara quanto fez; o backend compara com o real.
// - Menor -> tentativa falhada (audit SHIFT_ATTEMPT_FAIL com valores);
//   3 falhas = bloqueado ate o dono desbloquear com a senha dele.
// - Igual ou a mais -> fecho aceite em nome do caixista; a diferenca fica
//   registada para o dono (valor a mais tambem e reportado).
router.post('/cashiers/:id/close-shift-blind', async (req, res) => {
  try {
    const declared = Number(req.body?.declared_amount);
    if (!Number.isInteger(declared) || declared < 0) {
      return res.status(400).json({ error: 'Valor invalido' });
    }
    const tenantId = ensureTenantScope(req);
    const cashier = await prisma.user.findFirst({
      where: { id: req.params.id, tenant_id: tenantId, role: 'cashier' },
      select: { id: true, name: true },
    });
    if (!cashier) return res.status(404).json({ error: 'Caixista nao encontrado neste estabelecimento' });
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const lastClosing = await prisma.shiftClosing.findFirst({
      where: { tenant_id: tenantId, cashier_user_id: cashier.id }, orderBy: { closed_at: 'desc' },
    });
    const since = lastClosing ? lastClosing.closed_at : startOfDay;
    const salesSince = await prisma.sale.aggregate({
      where: { tenant_id: tenantId, cashier_user_id: cashier.id, status: 'completed', payment_method: 'cash', created_at: { gt: since } },
      _sum: { total_amount: true },
    });
    const realCash = Number(salesSince._sum.total_amount || 0);
    if (declared < realCash) {
      const lastUnlock = await prisma.auditLog.findFirst({
        where: { tenant_id: tenantId, action: 'CASHIER_UNLOCKED', entity_id: cashier.id }, orderBy: { created_at: 'desc' },
      });
      const failSince = lastUnlock ? lastUnlock.created_at : startOfDay;
      const attemptNo = (await prisma.auditLog.count({
        where: { tenant_id: tenantId, action: 'SHIFT_ATTEMPT_FAIL', entity_id: cashier.id, created_at: { gt: failSince } },
      })) + 1;
      await createOwnerAudit(req, 'SHIFT_ATTEMPT_FAIL', 'user', cashier.id, {
        new_value: JSON.stringify({ cashierName: cashier.name, attempt: attemptNo, declared: declared, real: realCash }),
      });
      const locked = attemptNo >= 3;
      await createOwnerAudit(req, locked ? 'CASHIER_LOCKED' : 'CASHIER_ATTEMPT_ALERT', 'user', cashier.id, {
        new_value: JSON.stringify({ cashierName: cashier.name, attempt: attemptNo, declared: declared, real: realCash }),
      });
      return res.status(400).json({
        ok: false, accepted: false, locked, attemptNo, maxAttempts: 3,
        remaining: Math.max(0, 3 - attemptNo),
        error: locked
          ? 'Valor incorrecto 3 vezes. Perfil bloqueado — o dono tem de desbloquear com a senha dele.'
          : 'Valor incorrecto: e MENOR do que o dinheiro feito hoje. Restam ' + (3 - attemptNo) + ' tentativa(s).',
      });
    }
    const difference = declared - realCash;
    const record = await prisma.shiftClosing.create({
      data: {
        tenant_id: tenantId, cashier_user_id: cashier.id,
        counted_amount: declared, expected_amount: realCash, difference,
      }
    });
    await createOwnerAudit(req, 'SHIFT_CLOSING_OK', 'user', cashier.id, {
      new_value: JSON.stringify({ cashierName: cashier.name, declared: declared, real: realCash, difference, exact: difference === 0 }),
    });
    return res.status(201).json({
      ok: true, accepted: true, exact: difference === 0, difference,
      closed_at: record.closed_at,
      message: difference === 0
        ? 'Fecho correcto — valor exacto.'
        : 'Fecho aceite. Registaste um valor SUPERIOR ao real; a diferenca ficou registada para o dono.',
    });
  } catch (err) {
    console.error('Blind close error', err);
    return res.status(500).json({ error: 'Erro ao fechar turno' });
  }
});

// Desbloqueio pelo dono (senha do owner). Nao apaga auditoria — apenas
// regista CASHIER_UNLOCKED; a contagem de falhas passa a valer a partir dele.
router.post('/cashiers/:id/unlock-shift', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Senha do dono obrigatoria.' });
    const me = await prisma.user.findUnique({ where: { id: req.user?.userId } });
    if (!me || me.role !== 'owner') return res.status(403).json({ error: 'So o dono pode desbloquear.' });
    const ok = await bcrypt.compare(String(password), me.password_hash);
    if (!ok) {
      await createOwnerAudit(req, 'CASHIER_UNLOCK_FAIL', 'user', req.params.id, {});
      return res.status(401).json({ error: 'Senha do dono incorrecta.' });
    }
    await createOwnerAudit(req, 'CASHIER_UNLOCKED', 'user', req.params.id, {
      new_value: JSON.stringify({ cashierId: req.params.id }),
    });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao desbloquear' });
  }
});


router.get('/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { tenant_id: ensureTenantScope(req) },
      orderBy: { start_date: 'desc' }
    });
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar trabalhadores' });
  }
});

router.get('/payroll', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const employees = await prisma.employee.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { name: 'asc' }
    });

    const monthlyTotal = employees.reduce((sum, employee) => sum + money(employee.monthly_salary), 0);
    const averageSalary = employees.length ? Math.round(monthlyTotal / employees.length) : 0;

    res.json({
      employeeCount: employees.length,
      monthlyTotal,
      averageSalary,
      employees: employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        role: employee.role,
        phone: employee.phone,
        monthly_salary: Number(employee.monthly_salary || 0),
        start_date: employee.start_date,
        is_active: employee.is_active,
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao calcular folha salarial' });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const { name, role, monthly_salary, phone, start_date } = req.body || {};
    if (!name || !role) {
      return res.status(400).json({ error: 'Nome e função são obrigatórios.' });
    }

    const employee = await prisma.employee.create({
      data: {
        tenant_id: ensureTenantScope(req),
        name: String(name).trim(),
        role: String(role).trim(),
        monthly_salary: Number(monthly_salary || 0),
        phone: phone ? String(phone) : null,
        start_date: start_date ? new Date(start_date) : new Date(),
        is_active: true,
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar trabalhador' });
  }
});

router.post('/whatsapp/test', async (req, res) => {
  try {
    const { phone, message } = req.body || {};
    if (!phone || !message) {
      return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: ensureTenantScope(req) } });
    const result = await sendWhatsAppAlert({
      to: String(phone).trim(),
      message: String(message).trim(),
      tenantName: tenant?.name || 'Genesis',
    });

    res.json({ ok: result.ok ?? false, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Erro ao enviar WhatsApp' });
  }
});

router.get('/debts', async (req, res) => {
  try {
    const debts = await prisma.debt.findMany({
      where: { tenant_id: ensureTenantScope(req) },
      orderBy: { created_at: 'desc' },
      include: { payments: true }
    });

    const normalized = debts.map((debt) => {
      const status = updateDebtStatus(debt);
      return { ...debt, status };
    });

    res.json(normalized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar chenecas' });
  }
});

router.post('/debts', async (req, res) => {
  try {
    const { debtor_name, debtor_phone, total_amount, due_date } = req.body || {};
    if (!debtor_name || !due_date || !total_amount) {
      return res.status(400).json({ error: 'Dados do devedor, vencimento e valor são obrigatórios.' });
    }

    const debt = await prisma.debt.create({
      data: {
        tenant_id: ensureTenantScope(req),
        debtor_name: String(debtor_name).trim(),
        debtor_phone: debtor_phone ? String(debtor_phone) : '',
        total_amount: Number(total_amount),
        amount_paid: 0,
        due_date: new Date(due_date),
        status: 'active',
        created_by: req.user.userId,
      }
    });

    res.status(201).json({ ...debt, status: 'active' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registar cheneca' });
  }
});

router.post('/debts/:id/payment', async (req, res) => {
  try {
    const amount = Number(req.body?.amount || 0);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor do pagamento inválido.' });
    }

    const debt = await prisma.debt.findUnique({ where: { id: req.params.id } });
    if (!debt) return res.status(404).json({ error: 'Cheneca não encontrada' });

    const updated = await prisma.debt.update({
      where: { id: debt.id },
      data: {
        amount_paid: debt.amount_paid + amount,
        status: updateDebtStatus({ ...debt, amount_paid: debt.amount_paid + amount }),
      }
    });

    await prisma.debtPayment.create({
      data: {
        debt_id: debt.id,
        amount,
        recorded_by: req.user.userId,
      }
    });

    res.json({ ok: true, debt: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registar pagamento' });
  }
});

router.get('/goals/current', async (req, res) => {
  try {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const goal = await prisma.saleGoal.findFirst({
      where: { tenant_id: ensureTenantScope(req), month, year },
      orderBy: { created_at: 'desc' }
    });

    const latestSales = await prisma.sale.aggregate({
      where: { tenant_id: ensureTenantScope(req), created_at: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59) } },
      _sum: { total_amount: true }
    });

    res.json({
      target: goal?.target_amount || 200000,
      current: Number(latestSales._sum.total_amount || 0),
      projected: Number(latestSales._sum.total_amount || 0),
      month,
      year,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar meta' });
  }
});

router.post('/goals', async (req, res) => {
  try {
    const { target_amount } = req.body || {};
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const goal = await prisma.saleGoal.upsert({
      where: {
        id: (await prisma.saleGoal.findFirst({ where: { tenant_id: ensureTenantScope(req), month, year }, select: { id: true } }))?.id || '00000000-0000-0000-0000-000000000000',
      },
      update: { target_amount: Number(target_amount || 0) },
      create: {
        tenant_id: ensureTenantScope(req),
        month,
        year,
        target_amount: Number(target_amount || 0),
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao guardar meta' });
  }
});

const getPeriodRange = (dateStr) => {
  const start = dateStr ? new Date(dateStr) : new Date();
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const buildReportSummary = async (tenantId, start, end) => {
  const sales = await prisma.sale.findMany({
    where: { tenant_id: tenantId, created_at: { gte: start, lte: end }, status: 'completed' },
    include: { items: true }
  });

  const gross_revenue = sales.reduce((sum, sale) => sum + money(sale.total_amount), 0);
  const cost_of_goods_sold = sales.reduce((sum, sale) => {
    const line = sale.items.reduce((itemSum, item) => itemSum + (money(item.unit_cost_price) * money(item.quantity)), 0);
    return sum + line;
  }, 0);
  const gross_profit = gross_revenue - cost_of_goods_sold;
  const sales_count = sales.length;

  return {
    sales_count,
    gross_revenue,
    gross_profit,
    cost_of_goods_sold,
    cost_of_goods: cost_of_goods_sold,
    total_orders: sales_count,
    sales,
  };
};

router.get('/reports/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getPeriodRange(date || new Date().toISOString().slice(0, 10));
    const report = await buildReportSummary(ensureTenantScope(req), start, end);
    res.json({ ...report, date: start.toISOString().slice(0, 10) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar relatório diário' });
  }
});

router.get('/reports/weekly', async (req, res) => {
  try {
    const startDate = req.query.start ? new Date(req.query.start) : new Date();
    const endDate = req.query.end ? new Date(req.query.end) : new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    const report = await buildReportSummary(ensureTenantScope(req), startDate, endDate);
    res.json({ ...report, start: startDate.toISOString().slice(0, 10), end: endDate.toISOString().slice(0, 10) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar relatório semanal' });
  }
});

router.get('/reports/monthly', async (req, res) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const month = Number(req.query.month || (new Date().getMonth() + 1));
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const tenantId = ensureTenantScope(req);
    const report = await buildReportSummary(tenantId, start, end);
    const [employees, fixedCosts, suppliers, stockEntries] = await Promise.all([
      prisma.employee.findMany({ where: { tenant_id: tenantId, is_active: true } }),
      prisma.fixedCost.findMany({ where: { tenant_id: tenantId } }),
      prisma.supplier.findMany({ where: { tenant_id: tenantId } }),
      prisma.stockEntry.findMany({
        where: { tenant_id: tenantId, created_at: { gte: start, lte: end } },
        select: { supplier_id: true, created_at: true },
      }),
    ]);
    const deductionsCalc = computeMonthlyDeductions({ employees, fixedCosts, suppliers, stockEntries });
    const {
      total_salaries,
      total_fixed,
      total_supplier_delivery,
      total_rent,
      total_other_fixed,
      operating_expenses,
    } = deductionsCalc;
    const net_profit = computeMonthlyNetProfit(report.gross_profit, deductionsCalc);

    res.json({
      period: { year, month },
      gross_revenue: report.gross_revenue,
      gross_profit: report.gross_profit,
      cost_of_goods: report.cost_of_goods_sold,
      cost_of_goods_sold: report.cost_of_goods_sold,
      total_salaries,
      total_fixed,
      total_supplier_delivery,
      total_rent,
      total_other_fixed,
      operating_expenses,
      net_profit,
      sales_count: report.sales_count,
      deductions: {
        total_salaries,
        total_rent,
        total_other_fixed,
        total_fixed,
        total_supplier_delivery,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar relatório mensal' });
  }
});

router.get('/reports/total', async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { tenant_id: ensureTenantScope(req), status: 'completed' },
      include: { items: true }
    });
    const total = sales.reduce((sum, sale) => sum + money(sale.total_amount), 0);
    res.json({ total_revenue: total, sales_count: sales.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao obter total acumulado' });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const snapshot = await getTenantAlertSnapshot(tenantId);

    res.json({
      lowStockProducts: snapshot.lowStockProducts.map((product) => ({
        id: product.id,
        name: product.name,
        stock_qty: Number(product.stock_qty || 0),
        min_stock: Number(product.min_stock || 0),
      })),
      expiredProducts: snapshot.expiredProducts.map((product) => ({
        id: product.id,
        name: product.name,
        expiry_date: product.expiry_date,
        stock_qty: Number(product.stock_qty || 0),
      })),
      totalAlerts: snapshot.totalAlerts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar alertas' });
  }
});

router.post('/alerts/send', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const phone = String(req.body?.phone || tenant?.phone || '').trim();
    const snapshot = await getTenantAlertSnapshot(tenantId);

    if (!snapshot.totalAlerts) {
      return res.json({ ok: true, sent: 0, message: 'Sem alertas para enviar.' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Telefone do dono da loja não encontrado para envio do WhatsApp.' });
    }

    const summary = buildAlertSummary(tenant, snapshot);
    const result = await sendWhatsAppAlert({
      to: phone,
      message: summary,
      tenantName: tenant?.name || 'Genesis',
    });

    res.json({ ok: true, sent: snapshot.totalAlerts, message: summary, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Erro ao enviar alertas do WhatsApp' });
  }
});

router.get('/settings/hours', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    res.json(getTenantBusinessHours(tenantId));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar horário' });
  }
});

router.post('/settings/hours', async (req, res) => {
  try {
    const tenantId = ensureTenantScope(req);
    const { opening, closing } = req.body || {};
    const payload = { opening: opening || '08:00', closing: closing || '18:00' };
    businessHoursStore.set(tenantId, payload);
    res.json({ ok: true, ...payload });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao guardar horário' });
  }
});

module.exports = router;

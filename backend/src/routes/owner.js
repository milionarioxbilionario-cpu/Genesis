const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { sendWhatsAppAlert } = require('../utils/whatsapp');
const { getTenantAlertSnapshot, buildAlertSummary } = require('../services/tenantAlerts');
const { computeMonthlyDeductions, computeMonthlyNetProfit } = require('../services/monthlyDeductions');

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
    const cashiers = await prisma.user.findMany({
      where: { tenant_id: ensureTenantScope(req), role: 'cashier', is_active: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(cashiers);
  } catch (error) {
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
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { is_active: false }
    });
    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao desactivar caixista' });
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

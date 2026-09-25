const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const signUserToken = (user) => jwt.sign({
  userId: user.id,
  tenantId: user.tenant_id,
  role: user.role,
  name: user.name,
}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });

const signRefreshToken = (user) => jwt.sign({
  userId: user.id,
  tenantId: user.tenant_id,
  role: user.role,
  name: user.name,
}, process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + 'refresh'), { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d' });

const setAuthCookie = (res, token) => {
  const cookieOptions = { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('token', token, cookieOptions);
};

const setRefreshCookie = (res, token) => {
  const cookieOptions = { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('refreshToken', token, cookieOptions);
};

const createAudit = async (req, action, tenantId, extra = {}) => {
  await prisma.auditLog.create({
    data: {
      user_id: req.user.userId,
      action,
      entity_type: 'tenant',
      entity_id: tenantId,
      old_value: extra.old_value ? JSON.stringify(extra.old_value) : undefined,
      new_value: extra.new_value ? JSON.stringify(extra.new_value) : undefined,
      ip_address: req.ip || '0.0.0.0',
    }
  }).catch(() => undefined);
};

router.get('/audit', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 60,
      include: { user: true, tenant: true }
    });

    res.json(logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      tenant_id: log.tenant_id,
      tenant_name: log.tenant?.name || null,
      user_name: log.user?.name || 'Sistema',
      user_email: log.user?.email || null,
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

// Listar pedidos pendentes
router.get('/requests', async (req, res) => {
  const requests = await prisma.tenant.findMany({
    where: { status: 'pending' },
    orderBy: { created_at: 'desc' }
  });
  res.json(requests);
});

// Aprovar pedido
router.post('/requests/:tenantId/approve', async (req, res) => {
  const { tenantId } = req.params;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 30);

    let ownerEmail = tenant.email || `${tenant.name.toLowerCase().replace(/\s/g, '')}@genesis.co.mz`;
    try {
      await prisma.$transaction([
        prisma.tenant.update({
          where: { id: tenantId },
          data: { status: 'trial', trial_ends_at: trialEnds }
        }),
        prisma.user.create({
          data: {
            tenant_id: tenantId,
            role: 'owner',
            name: tenant.owner_name,
            email: ownerEmail,
            password_hash: passwordHash,
            phone: tenant.phone,
            is_active: true,
          }
        }),
        prisma.auditLog.create({
          data: {
            user_id: req.user.userId,
            action: 'APPROVE_TENANT',
            entity_type: 'tenant',
            entity_id: tenantId,
            ip_address: req.ip || '0.0.0.0'
          }
        })
      ]);
    } catch (err) {
      if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('email')) {
        ownerEmail = `${ownerEmail.split('@')[0]}.${Date.now()}@genesis.co.mz`;
        await prisma.$transaction([
          prisma.tenant.update({ where: { id: tenantId }, data: { status: 'trial', trial_ends_at: trialEnds } }),
          prisma.user.create({ data: { tenant_id: tenantId, role: 'owner', name: tenant.owner_name, email: ownerEmail, password_hash: passwordHash, phone: tenant.phone, is_active: true } }),
          prisma.auditLog.create({ data: { user_id: req.user.userId, action: 'APPROVE_TENANT', entity_type: 'tenant', entity_id: tenantId, ip_address: req.ip || '0.0.0.0' } })
        ]);
      } else {
        throw err;
      }
    }

    res.json({ email: ownerEmail, temporaryPassword: tempPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao aprovar pedido' });
  }
});

// Listar todos os tenants
router.get('/tenants', async (req, res) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { created_at: 'desc' }
  });
  res.json(tenants);
});

router.post('/tenants/:tenantId/suspend', async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: 'suspended' }
  });

  await prisma.user.updateMany({
    where: { tenant_id: tenantId, role: 'owner' },
    data: { is_active: false }
  });

  await createAudit(req, 'SUSPEND_TENANT', tenantId, { old_value: { status: tenant.status }, new_value: { status: 'suspended' } });

  res.json({ message: 'Tenant suspenso com sucesso' });
});

router.post('/tenants/:tenantId/unsuspend', async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: tenant.status === 'blocked' ? 'blocked' : 'active' }
  });

  await prisma.user.updateMany({
    where: { tenant_id: tenantId, role: 'owner' },
    data: { is_active: true }
  });

  await createAudit(req, 'UNSUSPEND_TENANT', tenantId, { old_value: { status: tenant.status }, new_value: { status: tenant.status === 'blocked' ? 'blocked' : 'active' } });

  res.json({ message: 'Tenant reativado com sucesso' });
});

router.post('/tenants/:tenantId/block', async (req, res) => {
  const { tenantId } = req.params;
  const { reason } = req.body || {};
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: 'blocked' }
  });

  await prisma.user.updateMany({
    where: { tenant_id: tenantId, role: 'owner' },
    data: { is_active: false }
  });

  await createAudit(req, 'BLOCK_TENANT', tenantId, { old_value: { status: tenant.status }, new_value: { status: 'blocked', reason: reason || 'Sem motivo informado' } });

  res.json({ message: 'Tenant bloqueado com sucesso' });
});

router.post('/tenants/:tenantId/unblock', async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: 'active' }
  });

  await prisma.user.updateMany({
    where: { tenant_id: tenantId, role: 'owner' },
    data: { is_active: true }
  });

  await createAudit(req, 'UNBLOCK_TENANT', tenantId, { old_value: { status: tenant.status }, new_value: { status: 'active' } });

  res.json({ message: 'Tenant desbloqueado com sucesso' });
});

router.post('/tenants/:tenantId/restore', async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

  const newStatus = tenant.status === 'rejected' ? 'pending' : 'active';
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: newStatus }
  });

  await prisma.user.updateMany({
    where: { tenant_id: tenantId, role: 'owner' },
    data: { is_active: true }
  });

  await createAudit(req, 'RESTORE_TENANT', tenantId, { old_value: { status: tenant.status }, new_value: { status: newStatus } });

  res.json({ message: 'Tenant recuperado com sucesso' });
});

router.post('/tenants/:tenantId/delete', async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

  await prisma.user.updateMany({
    where: { tenant_id: tenantId },
    data: { is_active: false }
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: 'deleted' }
  });

  await createAudit(req, 'DELETE_TENANT', tenantId, { old_value: { status: tenant.status }, new_value: { status: 'deleted' } });

  res.json({ message: 'Tenant eliminado com sucesso' });
});

router.post('/tenants/:tenantId/impersonate', async (req, res) => {
  const { tenantId } = req.params;
  const ownerUser = await prisma.user.findFirst({
    where: { tenant_id: tenantId, role: 'owner' },
    orderBy: { created_at: 'asc' }
  });

  if (!ownerUser) {
    return res.status(404).json({ error: 'Owner deste tenant não encontrado' });
  }

  const token = signUserToken(ownerUser);
  const refresh = signRefreshToken(ownerUser);
  setAuthCookie(res, token);
  setRefreshCookie(res, refresh);

  await createAudit(req, 'IMPERSONATE_OWNER', tenantId, { old_value: { tenantId }, new_value: { ownerUserId: ownerUser.id } });

  res.json({
    message: 'Sessão do owner carregada com sucesso.',
    redirectUrl: 'http://localhost:5173/owner',
    user: {
      id: ownerUser.id,
      name: ownerUser.name,
      role: ownerUser.role,
      tenantId: ownerUser.tenant_id,
      email: ownerUser.email,
    }
  });
});

// Rejeitar pedido
router.post('/requests/:tenantId/reject', async (req, res) => {
  const { tenantId } = req.params;
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason é obrigatório' });

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: 'rejected' }
  });

  await prisma.auditLog.create({
    data: {
      user_id: req.user.userId,
      action: 'REJECT_TENANT',
      entity_type: 'tenant',
      entity_id: tenantId,
      old_value: JSON.stringify({ status: tenant.status }),
      new_value: JSON.stringify({ status: 'rejected', reason }),
      ip_address: req.ip || '0.0.0.0'
    }
  });

  res.json({ message: 'Pedido rejeitado' });
});

module.exports = router;

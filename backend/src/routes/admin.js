const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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

    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 caracteres
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 30);

    // Choose email candidate; if tenant.email conflicts, append timestamp to ensure uniqueness
    let ownerEmail = tenant.email || `${tenant.name.toLowerCase().replace(/\s/g, '')}@genesis.co.mz`;
    try {
      await prisma.$transaction([
        prisma.tenant.update({
          where: { id: tenantId },
          data: { 
            status: 'trial',
            trial_ends_at: trialEnds
          }
        }),
        prisma.user.create({
          data: {
            tenant_id: tenantId,
            role: 'owner',
            name: tenant.owner_name,
            email: ownerEmail,
            password_hash: passwordHash,
            phone: tenant.phone
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
      // Handle unique email constraint by retrying with timestamped email
      if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('email')) {
        ownerEmail = `${ownerEmail.split('@')[0]}.${Date.now()}@genesis.co.mz`;
        await prisma.$transaction([
          prisma.tenant.update({ where: { id: tenantId }, data: { status: 'trial', trial_ends_at: trialEnds } }),
          prisma.user.create({ data: { tenant_id: tenantId, role: 'owner', name: tenant.owner_name, email: ownerEmail, password_hash: passwordHash, phone: tenant.phone } }),
          prisma.auditLog.create({ data: { user_id: req.user.userId, action: 'APPROVE_TENANT', entity_type: 'tenant', entity_id: tenantId, ip_address: req.ip || '0.0.0.0' } })
        ]);
      } else {
        throw err;
      }
    }

    // Em produção, aqui enviariamos email ou WhatsApp
    res.json({ 
      message: 'Conta aprovada e dono criado',
      credentials: {
        email: ownerEmail,
        temporaryPassword: tempPassword
      }
    });
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

// Suspender tenant
router.post('/tenants/:tenantId/suspend', async (req, res) => {
  const { tenantId } = req.params;
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: 'suspended' }
  });
  
  await prisma.auditLog.create({
    data: {
      user_id: req.user.userId,
      action: 'SUSPEND_TENANT',
      entity_type: 'tenant',
      entity_id: tenantId,
      ip_address: req.ip || '0.0.0.0'
    }
  });

  res.json({ message: 'Tenant suspenso com sucesso' });
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

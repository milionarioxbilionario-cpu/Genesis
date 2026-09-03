const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const requestAccountSchema = z.object({
  businessName: z.string().min(3),
  ownerName: z.string().min(3),
  businessType: z.enum(['bottle_store', 'mercearia', 'padaria', 'talho', 'supermercado', 'outro']),
  location: z.string().min(3),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  nuit: z.string().optional(),
  idDocument: z.string().optional()
});

// LOGIN
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { tenant: true }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Se o tenant estiver suspenso, bloquear login (exceto super_admin)
    if (user.role !== 'super_admin' && user.tenant && user.tenant.status === 'suspended') {
      return res.status(403).json({ error: 'Sua conta está suspensa. Contacte o suporte.' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        tenantId: user.tenant_id, 
        role: user.role,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    // Set httpOnly cookie if possible
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax'
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('token', token, cookieOptions);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PEDIDO DE CONTA (Público)
router.post('/request-account', async (req, res) => {
  try {
    const data = requestAccountSchema.parse(req.body);

    const created = await prisma.tenant.create({
      data: {
        name: data.businessName,
        owner_name: data.ownerName,
        business_type: data.businessType,
        location: data.location,
        phone: data.phone,
        email: data.email,
        nuit: data.nuit,
        id_document: data.idDocument,
        status: 'pending'
      }
    });

    // Notify Super Admin (temporary): log to console — later will use WhatsApp via Twilio
    console.log('Novo pedido de conta recebido:', { tenantId: created.id, name: created.name, owner: created.owner_name, phone: created.phone, email: created.email });

    res.status(201).json({ message: 'Pedido recebido com sucesso. Entraremos em contacto em até 48 horas.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Erro ao processar pedido' });
  }
});

module.exports = router;

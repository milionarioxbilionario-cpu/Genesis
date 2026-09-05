const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const rateLimit = require('express-rate-limit');
const {
  generateCode,
  saveResetCode,
  getResetCode,
  clearResetCode,
} = require('../services/passwordResetStore');

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

const googleAuthSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional().or(z.literal(''))
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8)
});

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const signUserToken = (user) => jwt.sign({
  userId: user.id,
  tenantId: user.tenant_id,
  role: user.role,
  name: user.name
}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });

// Refresh token: longer lived, separate secret
const signRefreshToken = (user) => jwt.sign({
  userId: user.id,
  tenantId: user.tenant_id,
  role: user.role,
  name: user.name
}, process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + 'refresh'), { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d' });

const setAuthCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('token', token, cookieOptions);
};

const setRefreshCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('refreshToken', token, cookieOptions);
};

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

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

    if (user.role !== 'super_admin' && user.tenant && user.tenant.status === 'suspended') {
      return res.status(403).json({ error: 'Sua conta está suspensa. Contacte o suporte.' });
    }

    const token = signUserToken(user);
    const refresh = signRefreshToken(user);
    setAuthCookie(res, token);
    setRefreshCookie(res, refresh);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        email: user.email,
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { email, name } = googleAuthSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { tenant: true }
    });

    if (!user) {
      const tenant = await prisma.tenant.create({
        data: {
          name: `${name || 'Loja'} - Google`,
          owner_name: name || 'Gestor',
          business_type: 'mercearia',
          location: 'Moçambique',
          phone: '000000000',
          email: normalizedEmail,
          status: 'trial',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      const generatedPassword = `${Date.now()}Genesis!`;
      user = await prisma.user.create({
        data: {
          tenant_id: tenant.id,
          role: 'owner',
          name: name || 'Gestor',
          email: normalizedEmail,
          password_hash: await bcrypt.hash(generatedPassword, 12),
          phone: '000000000',
          is_active: true,
        },
        include: { tenant: true }
      });

      console.log('Google signup auto-created', { tenantId: tenant.id, email: normalizedEmail, password: generatedPassword });
    }

    if (user.role !== 'super_admin' && user.tenant && user.tenant.status === 'suspended') {
      return res.status(403).json({ error: 'Sua conta está suspensa. Contacte o suporte.' });
    }

    const token = signUserToken(user);
    setAuthCookie(res, token);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        email: user.email,
        provider: 'google'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: 'Erro ao iniciar sessão com Google' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Conta não encontrada.' });
    }

    const code = generateCode();
    saveResetCode(normalizedEmail, code);
    console.log('Password reset code for', normalizedEmail, code);

    return res.json({
      message: 'Código enviado. Use-o em até 15 minutos.',
      demoCode: code
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: 'Não foi possível processar a recuperação de senha.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = resetPasswordSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);
    const reset = getResetCode(normalizedEmail);

    if (!reset || reset.code !== code) {
      return res.status(400).json({ error: 'Código inválido ou expirado.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { password_hash: passwordHash }
    });

    clearResetCode(normalizedEmail);
    return res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: 'Não foi possível redefinir a senha.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Sessão encerrada.' });
});

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

    console.log('Novo pedido de conta recebido:', { tenantId: created.id, name: created.name, owner: created.owner_name, phone: created.phone, email: created.email });

    return res.status(201).json({ message: 'Pedido recebido. Entraremos em contacto em até 48 horas.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: 'Erro ao processar pedido' });
  }
});

module.exports = router;

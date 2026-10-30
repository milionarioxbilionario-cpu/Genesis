// Etapa A (27/10, decisao do fundador): «Avise-me quando estiver pronto» para os
// tipos de negocio com modo proprio ainda por construir (restaurante, hotel,
// farmacia…). Publico, sem sessao. Fica so registado para o super admin; ninguem
// e avisado automaticamente (o fundador avisa quando o modo existir).
const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { asyncHandler } = require('../utils/http');
const { MODE_PENDING } = require('../utils/businessTypes');

const router = express.Router();

const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiados pedidos a partir desta ligação. Tente mais tarde.', code: 'TOO_MANY_REQUESTS' },
});

const schema = z.object({
  business_type: z.enum(MODE_PENDING),
  name: z.string().trim().min(2, 'Escreva o seu nome').max(80),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,19}$/, 'Número de WhatsApp inválido'),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(254).optional().or(z.literal('')),
  channel: z.enum(['whatsapp', 'email', 'both']),
}).refine((d) => d.channel === 'whatsapp' || Boolean(d.email), { message: 'Para ser avisado por e-mail, escreva o e-mail.', path: ['email'] });

router.post('/', waitlistLimiter, asyncHandler(async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message, code: 'INVALID_WAITLIST' });
  const d = parsed.data;
  const phone = d.phone.replace(/\D/g, '');
  // O mesmo numero para o mesmo tipo: actualiza em vez de duplicar.
  const existing = await prisma.modeWaitlist.findFirst({ where: { phone, business_type: d.business_type } });
  const data = { name: d.name, email: d.email || null, channel: d.channel, notified_at: null };
  if (existing) await prisma.modeWaitlist.update({ where: { id: existing.id }, data });
  else await prisma.modeWaitlist.create({ data: { ...data, phone, business_type: d.business_type } });
  res.status(201).json({ ok: true });
}));

module.exports = router;

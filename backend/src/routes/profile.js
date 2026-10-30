// Fase 16: perfil do dono — senha, e-mail (com codigo no actual e no novo),
// numero do WhatsApp dos alertas, aniversario (so uma vez) e o presente.
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { setSessionCookies } = require('../utils/tokens');
const { setUnlocked } = require('../utils/panelLock');
const { invalidateSessionUser } = require('../utils/sessionUser');
const { getMailerConfig, sendMail } = require('../utils/mailer');
const { tr, reqLang } = require('../utils/lang');
const { dayInMaputo } = require('../utils/shiftDay');
const { effectivePlan, giftAvailable, giftWindow } = require('../services/plans');

const router = express.Router();
const emailTaken = async (email) => Boolean(await prisma.system.user.findFirst({ where: { email }, select: { id: true } }));
router.use(auth, requireRole('owner'));

const userId = (req) => req.user.userId;
const tenantId = (req) => req.user.tenantId;

router.get('/', asyncHandler(async (req, res) => {
  const [u, t] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId(req) }, select: { name: true, email: true, birthday: true, birthday_gift_year: true, lock_pin_hash: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { phone: true, plan: true, plan_period: true, premium_from: true, premium_until: true, subscription_price: true, created_at: true } }),
  ]);
  if (!u || !t) throw httpError(404, 'Conta não encontrada');
  const now = new Date();
  const year = Number(dayInMaputo(now).slice(0, 4));
  res.json({
    name: u.name, email: u.email, alerts_phone: t.phone || '',
    has_lock_pin: Boolean(u.lock_pin_hash),
    birthday: u.birthday || null,
    gift: {
      available: giftAvailable(u, now),
      claimed_this_year: u.birthday_gift_year === year,
      last_year: u.birthday_gift_year || null,
    },
    plan: { plan: t.plan, period: t.plan_period, effective: effectivePlan(t, now), premium_from: t.premium_from, premium_until: t.premium_until, price: t.subscription_price },
    email_enabled: getMailerConfig().isConfigured,
  });
}));

// ------------------------------------------------------------ senha
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Escreva a senha actual'),
  new_password: z.string().min(8, 'A senha nova tem pelo menos 8 caracteres').max(128),
});
router.put('/password', asyncHandler(async (req, res) => {
  const data = passwordSchema.parse(req.body);
  const u = await prisma.user.findUnique({ where: { id: userId(req) } });
  if (!u?.password_hash || !(await bcrypt.compare(data.current_password, u.password_hash))) {
    await writeAudit({ req, action: 'PASSWORD_CHANGE_FAIL', entityType: 'user', entityId: u?.id || userId(req) });
    throw httpError(403, 'A senha actual não está certa.', 'WRONG_PASSWORD');
  }
  if (data.current_password === data.new_password) throw httpError(400, 'A senha nova tem de ser diferente da actual.', 'SAME_PASSWORD');
  const updated = await prisma.user.update({ where: { id: u.id }, data: { password_hash: await bcrypt.hash(data.new_password, 12) } });
  // A versao da senha (pv) muda: as outras sessoes deixam de valer; esta continua.
  invalidateSessionUser(u.id);
  setSessionCookies(res, updated);
  if (updated.lock_pin_hash) setUnlocked(res, updated);
  await writeAudit({ req, action: 'PASSWORD_CHANGED', entityType: 'user', entityId: u.id });
  res.json({ ok: true });
}));

// ------------------------------------------------------------ e-mail
// Codigo de 6 digitos para o e-mail actual E para o novo; 15 min, 5 tentativas.
const EMAIL_TTL_MS = 15 * 60 * 1000;
const emailChanges = new Map(); // userId -> { newEmail, current, next, expiresAt, attempts }
const code6 = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

function emailBody(lang, code, newEmail) {
  const subject = tr(lang, '{code} é o código para mudar o e-mail no Genesis', { code });
  const text = tr(lang, 'Pediu para mudar o e-mail da sua conta Genesis para {email}.', { email: newEmail }) + '\n\n'
    + tr(lang, 'O código é: {code}', { code }) + '\n\n'
    + tr(lang, 'É válido por 15 minutos. Se não foi você, ignore esta mensagem e mude a sua senha.');
  return { subject, text, html: `<p>${text.replace(/\n/g, '<br>')}</p>` };
}

router.post('/email/start', asyncHandler(async (req, res) => {
  const data = z.object({ new_email: z.string().trim().toLowerCase().email('E-mail inválido'), password: z.string().min(1, 'Confirme com a sua senha') }).parse(req.body);
  const u = await prisma.user.findUnique({ where: { id: userId(req) } });
  if (!u?.password_hash || !(await bcrypt.compare(data.password, u.password_hash))) throw httpError(403, 'A senha actual não está certa.', 'WRONG_PASSWORD');
  if (data.new_email === String(u.email || '').toLowerCase()) throw httpError(400, 'Esse já é o seu e-mail.', 'SAME_EMAIL');
  // O e-mail e unico em TODO o Genesis: com a RLS, o cliente da loja so via as contas
  // desta loja e deixava passar o e-mail de outra loja ou do admin (27/10). Ligacao de
  // sistema, so para saber se existe (nao devolve nada da outra conta).
  if (await emailTaken(data.new_email)) throw httpError(409, 'Esse e-mail já pertence a outra conta.', 'EMAIL_IN_USE');
  const cfg = getMailerConfig();
  const production = process.env.NODE_ENV === 'production';
  if (!cfg.isConfigured && production) throw httpError(503, 'O envio de e-mails ainda não está configurado. Fale com o suporte para mudar o e-mail.', 'EMAIL_NOT_CONFIGURED');
  const current = code6();
  const next = code6();
  emailChanges.set(u.id, { newEmail: data.new_email, current: sha(current), next: sha(next), expiresAt: Date.now() + EMAIL_TTL_MS, attempts: 0 });
  const lang = reqLang(req);
  if (cfg.isConfigured) {
    const [a, b] = await Promise.all([
      sendMail({ to: u.email, ...emailBody(lang, current, data.new_email) }),
      sendMail({ to: data.new_email, ...emailBody(lang, next, data.new_email) }),
    ]);
    if (!a.ok || !b.ok) { emailChanges.delete(u.id); throw httpError(502, 'Não foi possível enviar os códigos. Tente mais tarde.', 'EMAIL_SEND_FAILED'); }
  }
  await writeAudit({ req, action: 'EMAIL_CHANGE_STARTED', entityType: 'user', entityId: u.id, newValue: { new_email: data.new_email } });
  // Sem SMTP so fora de producao (testes locais): os codigos vem na resposta.
  res.json({ ok: true, ...(cfg.isConfigured ? {} : { devCodes: { current, next }, devOnly: true }) });
}));

router.post('/email/confirm', asyncHandler(async (req, res) => {
  const data = z.object({ code_current: z.string().regex(/^\d{6}$/, 'Código de 6 dígitos'), code_new: z.string().regex(/^\d{6}$/, 'Código de 6 dígitos') }).parse(req.body);
  const pending = emailChanges.get(userId(req));
  if (!pending || pending.expiresAt < Date.now()) { emailChanges.delete(userId(req)); throw httpError(410, 'O pedido expirou. Peça os códigos outra vez.', 'EMAIL_CHANGE_EXPIRED'); }
  if (sha(data.code_current) !== pending.current || sha(data.code_new) !== pending.next) {
    pending.attempts += 1;
    if (pending.attempts >= 5) emailChanges.delete(userId(req));
    throw httpError(400, 'Os códigos não estão certos.', 'BAD_EMAIL_CODES');
  }
  emailChanges.delete(userId(req));
  if (await emailTaken(pending.newEmail)) throw httpError(409, 'Esse e-mail já pertence a outra conta.', 'EMAIL_IN_USE');
  const before = await prisma.user.findUnique({ where: { id: userId(req) }, select: { email: true } });
  await prisma.user.update({ where: { id: userId(req) }, data: { email: pending.newEmail } });
  invalidateSessionUser(userId(req));
  await writeAudit({ req, action: 'EMAIL_CHANGED', entityType: 'user', entityId: userId(req), oldValue: { email: before?.email }, newValue: { email: pending.newEmail } });
  res.json({ ok: true, email: pending.newEmail });
}));

// ------------------------------------------------------------ WhatsApp dos alertas
router.put('/alerts-phone', asyncHandler(async (req, res) => {
  const { phone } = z.object({ phone: z.string().trim().regex(/^\+?[\d\s]{9,16}$/, 'Número inválido (ex.: 84 123 4567)') }).parse(req.body);
  const before = await prisma.tenant.findUnique({ where: { id: tenantId(req) }, select: { phone: true } });
  await prisma.tenant.update({ where: { id: tenantId(req) }, data: { phone } });
  await writeAudit({ req, action: 'UPDATE_ALERTS_PHONE', entityType: 'tenant', entityId: tenantId(req), oldValue: before, newValue: { phone } });
  res.json({ ok: true });
}));

// ------------------------------------------------------------ aniversario
router.put('/birthday', asyncHandler(async (req, res) => {
  const { birthday } = z.object({ birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato AAAA-MM-DD') }).parse(req.body);
  const d = new Date(birthday + 'T12:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== birthday) throw httpError(400, 'Data inválida', 'BAD_DATE');
  const age = Number(dayInMaputo(new Date()).slice(0, 4)) - Number(birthday.slice(0, 4));
  if (age < 12 || age > 120) throw httpError(400, 'Data de nascimento fora do possível.', 'BAD_BIRTHDAY');
  // So uma vez: a condicao no UPDATE impede duas definicoes em simultaneo.
  const r = await prisma.user.updateMany({ where: { id: userId(req), birthday: null }, data: { birthday } });
  if (r.count !== 1) throw httpError(409, 'A data de aniversário já foi definida e não se pode mudar.', 'BIRTHDAY_LOCKED');
  await writeAudit({ req, action: 'BIRTHDAY_SET', entityType: 'user', entityId: userId(req), newValue: { birthday } });
  res.json({ ok: true, birthday });
}));

// Recolher o presente: so no dia (Maputo) e uma vez por ano, verificado aqui.
router.post('/birthday/gift', asyncHandler(async (req, res) => {
  const now = new Date();
  const year = Number(dayInMaputo(now).slice(0, 4));
  const result = await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: userId(req) }, select: { id: true, birthday: true, birthday_gift_year: true } });
    if (!giftAvailable(u, now)) throw httpError(409, 'O presente só se recolhe no dia do aniversário, uma vez por ano.', 'GIFT_NOT_AVAILABLE');
    const claimed = await tx.user.updateMany({ where: { id: u.id, OR: [{ birthday_gift_year: null }, { birthday_gift_year: { not: year } }] }, data: { birthday_gift_year: year } });
    if (claimed.count !== 1) throw httpError(409, 'O presente deste ano já foi recolhido.', 'GIFT_NOT_AVAILABLE');
    const t = await tx.tenant.findUnique({ where: { id: tenantId(req) }, select: { plan: true, plan_period: true, premium_from: true, premium_until: true, created_at: true } });
    const w = giftWindow(t, now);
    await tx.tenant.update({ where: { id: tenantId(req) }, data: { premium_from: w.from, premium_until: w.until } });
    return w;
  });
  await writeAudit({ req, action: 'BIRTHDAY_GIFT_CLAIMED', entityType: 'tenant', entityId: tenantId(req), newValue: { year, rule: result.rule, premium_from: result.from, premium_until: result.until } });
  res.json({ ok: true, premium_from: result.from, premium_until: result.until, rule: result.rule });
}));

module.exports = router;

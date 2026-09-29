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
  verifyResetCode,
  clearResetCode,
} = require('../services/passwordResetStore');
const { sendWhatsAppAlert } = require('../utils/whatsapp');
const { sendPasswordResetEmail } = require('../utils/mailer');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

// O reset de password e publico e nao autenticado: sem limite, (a) qualquer
// pessoa faz o servidor emitir codigos sem fim e (b) forca o codigo de 6
// digitos a partir do email de outra pessoa. O login tinha limite, isto nao.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados pedidos de recuperação. Tente novamente em 15 minutos.' }
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas tentativas de reposição. Tente novamente em 15 minutos.' }
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

// Login com Google verificado NO SERVIDOR.
//
// Recebemos o ID token (JWT) do Google Identity Services. A verificacao e
// feita aqui, contra a chave publica do Google e com audiencia igual ao
// GOOGLE_CLIENT_ID. NUNCA confiamos num "email" vindo do browser: sem
// verificacao, qualquer pessoa finge ser qualquer email.
//
// REGRA DE NEGOCIO (pedido do fundador): so entra se a conta JA estiver
// registada. Se nao estiver, nao criamos nada — devolve-se uma mensagem a
// dizer para ir ao "pedir conta". Isto evita contas fantasma criadas por
// qualquer clique.
const googleCredentialSchema = z.object({
  credential: z.string().min(20)
});

// O Google publica o JWKS em endpoint fixo; confirmamos por OIDC discovery
// para nao depender de URLs hardcodadas que possam mudar.
async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !clientId.includes('apps.googleusercontent.com')) {
    const err = new Error(
      'GOOGLE_CLIENT_ID nao configurado em backend/.env (precisa do formato ' +
      'XXXX.apps.googleusercontent.com — a API Key AIza... nao serve para login).'
    );
    err.code = 'NOT_CONFIGURED';
    throw err;
  }

  // 1) Estrutura do JWT. O token vem do browser, portanto NADA aqui é
  //    de confiance ate a assinatura passar no passo 3.
  const parts = String(credential).split('.');
  if (parts.length !== 3) {
    const err = new Error('Token do Google mal formado');
    err.code = 'MALFORMED';
    throw err;
  }

  const b64url = (s) => Buffer.from(s, 'base64url');
  let header;
  let unverified;
  try {
    header = JSON.parse(b64url(parts[0]).toString('utf8'));
    unverified = JSON.parse(b64url(parts[1]).toString('utf8'));
  } catch {
    const err = new Error('Token do Google nao pode ser lido');
    err.code = 'MALFORMED';
    throw err;
  }

  // BUG ANTERIOR: o issuer (iss) esta no PAYLOAD, nao no header. Ler o iss do
  // header devolvia sempre undefined e rejeitava ate tokens validos do Google.
  // Agora o issuer e lido do payload (ainda por verificar) so para escolher a
  // chave correcta, e re-validado no passo 4 depois da assinatura passar.
  const issuer = unverified && unverified.iss;
  if (issuer !== 'https://accounts.google.com' && issuer !== 'accounts.google.com') {
    const err = new Error('Issuer do token nao e do Google');
    err.code = 'BAD_ISSUER';
    throw err;
  }

  // Impede o ataque "alg: none" e confirma que a assinatura e RSA-SHA256.
  if (header.alg !== 'RS256') {
    const err = new Error('Algoritmo de assinatura nao suportado');
    err.code = 'BAD_ALG';
    throw err;
  }
  if (!header.kid) {
    const err = new Error('Token do Google sem identificador de chave (kid)');
    err.code = 'MALFORMED';
    throw err;
  }

  const discovery = await fetch('https://accounts.google.com/.well-known/openid-configuration');
  if (!discovery.ok) throw new Error('Nao foi possivel consultar a metadata do Google');
  const meta = await discovery.json();
  if (meta.issuer !== 'https://accounts.google.com') {
    const err = new Error('Metadata do Google devolvida por issuer inesperado');
    err.code = 'BAD_ISSUER';
    throw err;
  }

  const jwksRes = await fetch(meta.jwks_uri);
  if (!jwksRes.ok) throw new Error('Nao foi possivel obter as chaves do Google');
  const jwks = await jwksRes.json();

  // Node aceita directamente a chave no formato JWK — sem conversoes manuais.
  const { createPublicKey, createVerify, constants } = require('crypto');
  const signingInput = `${parts[0]}.${parts[1]}`;

  let valid = false;
  for (const key of jwks.keys || []) {
    if (key.kid !== header.kid || key.kty !== 'RSA') continue;

    const verify = createVerify('RSA-SHA256');
    verify.update(signingInput);
    verify.end();

    try {
      // parts[2] e a ASSINATURA (3a parte do JWT); signingInput so se carrega
      // acima. Trocar os dois "valida" qualquer coisa — e exactamente o que
      // um atacante queria.
      const signature = b64url(parts[2] || '');
      valid = verify.verify(
        { key: createPublicKey({ key, format: 'jwk' }), padding: constants.RSA_PKCS1_PADDING },
        signature
      );
    } catch {
      valid = false;
    }
    if (valid) break;
  }
  if (!valid) {
    const err = new Error('Assinatura do token invalida');
    err.code = 'BAD_SIGNATURE';
    throw err;
  }

  // 4) Claims so sao Confiaveis AGORA que a assinatura foi verificada.
  const payload = unverified;
  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
    const err = new Error('Issuer do token nao e do Google');
    err.code = 'BAD_ISSUER';
    throw err;
  }
  if (payload.aud !== clientId) {
    const err = new Error('Audiencia do token nao corresponde ao configurado');
    err.code = 'BAD_AUDIENCE';
    throw err;
  }
  // Sem exp nao aceitamos: um token sem prazo e a porta aberta.
  if (!payload.exp || payload.exp < now) {
    const err = new Error('Token expirado');
    err.code = 'EXPIRED';
    throw err;
  }
  if (payload.nbf && payload.nbf > now + 60) {
    // O Google emite iat/nbf com o "agora" verdadeiro. Se o token parece estar
    // no futuro, em 99% dos casos o relogio da MAQUINA esta errado (ex.: atras
    // 8 horas por bateria CMOS) e nao o token. A tolerancia de 60 s acima e o
    // maximo aceitavel: aumentar muito abriria uma janela de replay.
    const skew = payload.nbf - now;
    const err = new Error(
      `Token ainda nao valido: o relogio do sistema parece estar ` +
      `${Math.round(skew / 60)} min atrasado. Sincroniza a hora do computador ` +
      `(w32tm /resync) e tenta de novo.`
    );
    err.code = 'CLOCK_SKEW';
    err.skewSeconds = skew;
    throw err;
  }
  if (!payload.email || payload.email_verified !== true) {
    const err = new Error('O email do Google nao esta verificado');
    err.code = 'EMAIL_UNVERIFIED';
    throw err;
  }

  return { email: String(payload.email).toLowerCase(), name: payload.name || '', sub: payload.sub };
}

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

    // `bcrypt.compare(pass, null)` LANÇA TypeError. Uma conta criada pelo
    // Google (ou aprovada sem senha) tem password_hash NULL, e o catch de
    // baixo devolvia 500 "Erro interno no servidor" ao utilizador — que é
    // exactamente o sintoma reportado. Aqui dizemos o que se passa.
    if (!user.password_hash) {
      return res.status(401).json({
        error: 'Esta conta ainda não tem palavra-passe. Entra com Google ou usa "Esqueci a senha" para definires uma.',
        code: 'NO_PASSWORD'
      });
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
        tenant: user.tenant ? {
          id: user.tenant.id,
          onboarding_completed: Boolean(user.tenant.onboarding_completed)
        } : null
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    // A resposta ao cliente continua genérica, mas o erro REAL fica no log.
    // Sem isto, um 500 era impossível de diagnosticar.
    console.error('[auth:login] falha para', normalizedEmail || '(email ausente)', '->', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = googleCredentialSchema.parse(req.body);

    let account;
    try {
      account = await verifyGoogleCredential(credential);
    } catch (err) {
      if (err.code === 'NOT_CONFIGURED') {
        return res.status(503).json({
          error: err.message,
          code: 'GOOGLE_NOT_CONFIGURED'
        });
      }
      // Relógio da máquina errado: o token do Google é legítimo, mas o
      // servidor acha que foi emitido no futuro. Devolvemos a causa real em
      // vez de um "não foi possível validar" genérico que não ajuda ninguém.
      if (err.code === 'CLOCK_SKEW') {
        console.error('[google] token recusado por desvio do relogio:', err.skewSeconds, 's ->', err.message);
        return res.status(401).json({
          error: err.message,
          code: 'CLOCK_SKEW'
        });
      }
      console.warn('[google] token recusado:', err.code || err.message, err.stack || '');
      return res.status(401).json({
        error: 'Não foi possível validar a sessão do Google.',
        code: 'GOOGLE_INVALID'
      });
    }

    const normalizedEmail = normalizeEmail(account.email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { tenant: true }
    });

    // SEM CONTA REGISTADA: nao criamos nada. O fundador pediu que se avise o
    // utilizador e se mande para "pedir conta". Criar uma loja a cada clique
    // deixava a base de dados cheia de contas de teste sem dono real.
    if (!user) {
      return res.status(404).json({
        error: `A conta ${normalizedEmail} não está registada no Genesis. Peça uma conta e depois volte a entrar.`,
        code: 'NOT_REGISTERED'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Conta desactivada. Contacte o suporte.' });
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
        tenant: user.tenant
          ? { id: user.tenant.id, name: user.tenant.name, status: user.tenant.status,
              onboarding_completed: user.tenant.onboarding_completed }
          : null,
        provider: 'google'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error('[auth:google] falha apos validar o token ->', err);
    return res.status(500).json({ error: 'Erro ao iniciar sessão com Google' });
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Resposta igual exista ou nao a conta: um 404 para emails inexistentes
    // transforma esta rota publica num oraculo de contas registadas.
    const genericResponse = {
      message: 'Se a conta existir, o código de recuperação foi enviado. É válido 15 minutos.'
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const code = generateCode();
    saveResetCode(normalizedEmail, code);

    // Entrega de seguranca:
    // Prioridade 1: Email (SMTP / Gmail).
    // Prioridade 2: WhatsApp (se o utilizador tiver telefone configurado).
    // Em desenvolvimento (nao prod): regista no log para viabilizar testes offline.
    const isProduction = process.env.NODE_ENV === 'production';
    let entregue = false;
    try {
      const mailResult = await sendPasswordResetEmail(normalizedEmail, code);
      if (mailResult.ok) {
        entregue = true;
        console.info('[reset] Codigo de recuperacao enviado por email para', normalizedEmail);
      } else if (user.phone) {
        const waResult = await sendWhatsAppAlert({
          to: user.phone,
          message: `Genesis: codigo de recuperacao ${code}. Valido 15 minutos.`
        });
        if (waResult.ok) {
          entregue = true;
          console.info('[reset] Codigo de recuperacao enviado por WhatsApp para', user.phone);
        }
      }

      if (!entregue) {
        console.warn('[reset] codigo NAO entregue (sem SMTP/WhatsApp configurado).');
      }
      if (!isProduction) {
        console.info('[reset] Codigo de recuperacao (modo teste local) para', normalizedEmail, '->', code);
      }
    } catch (err) {
      console.error('Falha ao entregar codigo de recuperacao', err.message || err);
    }

    // O SMTP ainda nao esta configurado (MAIL_USER/MAIL_PASS vazios), logo o
    // utilizador NUNCA recebe o codigo e o fluxo fica parado no ecra
    // "introduza o codigo" sem forma de o obter. Com DEV_SHOW_RESET_CODE=true
    // devolvemos o codigo no proprio ecra — SO em desenvolvimento e so quando
    // o codigo nao foi entregue a ninguem. Em producao isto nunca corre.
    if (!entregue && process.env.DEV_SHOW_RESET_CODE === 'true' && !isProduction) {
      return res.json({ ...genericResponse, devCode: code, devOnly: true });
    }

    return res.json(genericResponse);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error('[auth:forgot-password] falha para', normalizedEmail || '(email ausente)', '->', err);
    return res.status(500).json({ error: 'Não foi possível processar a recuperação de senha.' });
  }
});

router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  try {
    const { email, code, password } = resetPasswordSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

    // verifyResetCode conta as tentativas falhadas, destroi o codigo ao fim de
    // MAX_ATTEMPTS e compara o hash em tempo constante.
    if (!verifyResetCode(normalizedEmail, code)) {
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
    console.error('[auth:reset-password] falha para', normalizedEmail || '(email ausente)', '->', err);
    return res.status(500).json({ error: 'Não foi possível redefinir a senha.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Sessão encerrada.' });
});

// Simple endpoint to validate current session and return user info
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Não autenticado' });
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, name: true, email: true, tenant_id: true, is_active: true }
    });
    if (!user || !user.is_active) return res.status(401).json({ error: 'Conta inactiva ou não encontrada' });
    if (user.tenant_id) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenant_id },
        // name/location servem o recibo do POS (nome e local da loja). NUNCA
        // devolver aqui cancel_pin_hash nem dados sensiveis do dono.
        select: { status: true, name: true, location: true }
      });
      if (tenant?.status === 'suspended') return res.status(401).json({ error: 'Conta suspensa. Contacte o suporte.' });
      return res.json({
        user: {
          ...user,
          tenant: tenant ? { name: tenant.name, location: tenant.location } : null,
        },
      });
    }

    return res.json({ user });
  } catch (err) {
    console.error('[auth:me] falha ao validar a sessao ->', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
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
    // Este era o "Erro ao processar pedido" mudo que impedia o fundador de ver
    // o pedido de conta. O `tenant.create` falhava (coluna em falta no Postgres
    // ou constraint) e o erro real nunca chegava ao log nem ao ecrã.
    console.error('[auth:request-account] falha ao criar o pedido ->', err);
    return res.status(500).json({ error: 'Erro ao processar pedido' });
  }
});

module.exports = router;

// Exposto apenas para a suite de testes (scripts/test_google.js). Nao e um
// caminho de producao: o router continua a ser o export principal.
module.exports.verifyGoogleCredential = verifyGoogleCredential;

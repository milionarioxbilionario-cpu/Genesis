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
    const err = new Error('Token ainda nao valido');
    err.code = 'NOT_YET_VALID';
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
      console.warn('[google] token recusado:', err.code || err.message);
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

    // O codigo nunca sai na resposta HTTP (quem o tem troca a password da conta).
    // So e entregue por WhatsApp, quando a conta tem telefone e o Twilio esta
    // configurado. Fora de producao fica no log do servidor para permitir testes.
    const isProduction = process.env.NODE_ENV === 'production';
    try {
      const sent = user.phone
        ? await sendWhatsAppAlert({
            to: user.phone,
            message: `Genesis: codigo de recuperacao ${code}. Valido 15 minutos.`
          })
        : { ok: false, skipped: true, reason: 'conta-sem-telefone' };

      if (!sent.ok && !isProduction) {
        console.info('[reset] Codigo de recuperacao (apenas dev) para', normalizedEmail, code);
      } else if (!sent.ok) {
        console.error('[reset] Codigo nao entregue a', normalizedEmail, '-', sent.reason);
      }
    } catch (err) {
      console.error('Falha ao entregar codigo de recuperacao', err.message || err);
    }

    return res.json(genericResponse);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
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
    return res.status(500).json({ error: 'Não foi possível redefinir a senha.' });
  }
});

// ---------------------------------------------------------------------------
// REDEFINICAO IMEDIATA DE SENHA (pedida pelo fundador, 2026-09-25)
//
// Hoje nao ha nenhum servidor de email ligado. O fluxo normal gera um codigo
// de 6 digitos e tenta entrega-lo por WhatsApp — que nao funciona sem Twilio
// configurado, nem conta com telefone. Resultado: o utilizador nunca recebe
// nada e fica bloqueado. Pediu-se: clicar e a senha mudar logo.
//
// SEGURANCA — isto e uma porta de backdoor para qualquer conta, por isso:
//   1) Desligado por omissao. So abre com RESET_IMMEDIATE=true no .env.
//   2) Sem codigo nem segredo: exige email + a senha nova, logo nao serve
//      para explorar contas de terceiros sem saberes a senha.
//   3) Cada uso e registado em AuditLog e o aviso volta sempre na resposta.
//
// QUANDO O EMAIL ESTIVER LIGADO: apagar esta rota e voltar ao codigo de 6
// digitos (rota /reset-password que continua intacta).
// ---------------------------------------------------------------------------
const instantResetSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.')
});

const RESET_WARNING =
  '⚠️ Senha redefinida SEM verificação por email (modo directo). ' +
  'Nenhuma confirmação foi enviada. Ligue um servidor de email e remova ' +
  'RESET_IMMEDIATE do .env antes de ir para produção.';

router.post('/reset-password-instant', async (req, res) => {
  if (process.env.RESET_IMMEDIATE !== 'true') {
    return res.status(403).json({
      error: 'Redefinição directa desligada. Configure RESET_IMMEDIATE=true ou use o código de recuperação.',
      code: 'RESET_IMMEDIATE_DISABLED'
    });
  }

  try {
    const { email, password } = instantResetSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({
        error: `A conta ${normalizedEmail} não está registada no Genesis.`,
        code: 'NOT_REGISTERED'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: passwordHash }
    });

    // Auditoria obrigatoria: nao deixar a porta sem registo.
    try {
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          tenant_id: user.tenant_id,
          action: 'RESET_PASSWORD_INSTANT',
          entity_type: 'user',
          entity_id: user.id,
          new_value: JSON.stringify({
            email: normalizedEmail,
            role: user.role,
            at: new Date().toISOString(),
            warning: 'redefinida sem verificacao (RESET_IMMEDIATE)'
          }),
          ip_address: req.ip || '0.0.0.0'
        }
      });
    } catch (e) {
      console.error('[reset-instant] falha ao gravar auditoria:', e.message);
    }

    console.warn(`[reset-instant] senha redefinida para ${normalizedEmail} (role=${user.role})`);

    return res.json({ message: 'Senha redefinida com sucesso.', warning: RESET_WARNING });
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
    return res.status(500).json({ error: 'Erro ao processar pedido' });
  }
});

module.exports = router;

// Exposto apenas para a suite de testes (scripts/test_google.js). Nao e um
// caminho de producao: o router continua a ser o export principal.
module.exports.verifyGoogleCredential = verifyGoogleCredential;

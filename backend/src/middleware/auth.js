const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { blockedTenantStatus, isTrialExpired, isSubscriptionOverdue } = require('../utils/tenantStatus');
const { isScopeAllowed } = require('../utils/sessionScopes');
const { validateSessionClaims } = require('../utils/sessionUser');
const { checkPanelLock } = require('../utils/panelLock');

// Autenticacao por sessao (cookie httpOnly `token` ou Authorization: Bearer).
// Define req.user = { userId, tenantId, role, name, scope, tid }.
//
// Ordem das verificacoes:
//  1. assinatura/expiracao do JWT                       -> 401
//  2. conta activa + emitido com a senha actual (pv)    -> 401 (utils/sessionUser.js)
//  3. ambito restrito ('pos', 'support')                -> 403 SCOPE_RESTRICTED
//  3b. painel do dono bloqueado (PIN pessoal, Fase 12.4) -> 423 PANEL_LOCKED (utils/panelLock.js)
//  4. loja suspensa/bloqueada/eliminada                 -> 403
//  5. trial expirado: so leitura                        -> 402 TRIAL_EXPIRED
//  5b. subscricao paga vencida (Etapa A): so leitura    -> 402 SUBSCRIPTION_OVERDUE
// Falha de infra-estrutura (BD em baixo) -> 503, nunca 401: um 401 mandaria
// todos os POS para o login e a fila offline deixaria de tentar.
//
// Com o trial expirado so passam escritas que nao criam valor: a lingua da
// propria conta (Fase 9.3).
// Fase 16: senha, e-mail e aniversario (perfil) continuam com o teste terminado — sao a conta, nao vendas.
const TRIAL_EXEMPT = /^\/api\/(auth\/language|profile(\/[\w/-]*)?|establishments\/(switch|home))\/?$/;
// Etapa D (31/10): ver a lista, trocar e voltar ao estabelecimento de casa nao
// criam valor nem mostram dados do estabelecimento activo. Passam com o activo
// suspenso, em teste acabado, em atraso ou com o acesso retirado, para o dono
// nunca ficar preso num deles.
const ESTABLISHMENT_ESCAPE = /^\/api\/establishments(\/switch|\/home)?\/?$/;

const { resolveActingTenant } = require('../utils/actingTenant');
const { closedState } = require('../utils/tenantStatus');
// Encerrado: o balcao ainda envia o que ficou na fila (vendas, perdas, pedidos, fecho do turno).
const CLOSED_POS_SYNC = /^\/api\/(sales|shrinkage_records|demand_captures|pos\/shift\/close)\/?$/;

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  else if (req.cookies && req.cookies.token) token = req.cookies.token;

  if (!token) return res.status(401).json({ error: 'Sessão não iniciada', code: 'NO_SESSION' });

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Sessão expirada. Entre de novo.', code: 'SESSION_EXPIRED' });
    }

    const check = await validateSessionClaims(decoded);
    if (!check.ok) return res.status(check.status).json({ error: check.error, code: check.code });

    // Etapa D: estabelecimento activo (o de casa ou outro do mesmo dono, validado).
    const path = req.originalUrl.split('?')[0];
    const escape = ESTABLISHMENT_ESCAPE.test(path);
    let acting = await resolveActingTenant(check.user, decoded);
    if (decoded.act && !acting) {
      if (!escape) return res.status(403).json({ error: 'Sem acesso a este estabelecimento. Entre de novo.', code: 'ESTABLISHMENT_FORBIDDEN' });
      acting = check.user.tenant_id || null;
    }

    req.user = {
      userId: check.user.id,
      tenantId: acting,
      homeTenantId: check.user.tenant_id || null,
      // Papel e nome vem da BD, nao do token: uma alteracao conta logo.
      role: check.user.role,
      name: check.user.name,
      scope: decoded.scope || null,
      tid: decoded.tid || null,
    };

    // Etapa D (31/10): a pagina diz que estabelecimento mostra. Se o dono trocou
    // noutro separador, este pedido iria para o estabelecimento errado: 409 e a
    // pagina recarrega (frontend/src/utils/api.js). Trocar/voltar a casa passam.
    const shown = req.headers['x-genesis-establishment'];
    if (shown && !escape && shown !== req.user.tenantId) {
      return res.status(409).json({ error: 'Mudou de estabelecimento noutra janela. A actualizar…', code: 'ESTABLISHMENT_CHANGED' });
    }

    if (req.user.scope && !isScopeAllowed(req.user.scope, req.method, req.originalUrl)) {
      return res.status(403).json({
        error: req.user.scope === 'support' ? 'Modo suporte: só leitura.' : 'Esta acção não está disponível no terminal.',
        code: 'SCOPE_RESTRICTED',
      });
    }

    if (!checkPanelLock(req, res, check.user, req.user.scope)) {
      return res.status(423).json({ error: 'Painel bloqueado. Introduza o seu PIN.', code: 'PANEL_LOCKED' });
    }

    if (req.user.role !== 'super_admin' && req.user.tenantId) {
      const blocked = await blockedTenantStatus(req.user.tenantId);
      if (blocked && !escape) {
        // Um estabelecimento extra suspenso: o painel volta ao de casa (api.js), sem terminar a sessao.
        if (req.user.homeTenantId && req.user.tenantId !== req.user.homeTenantId) return res.status(403).json({ error: 'Este estabelecimento está suspenso. A voltar ao estabelecimento principal.', code: 'ESTABLISHMENT_FORBIDDEN' });
        return res.status(403).json({ error: 'Conta suspensa. Contacte o suporte.', code: 'TENANT_BLOCKED' });
      }
      if (req.method !== 'GET' && !escape) {
        const closed = await closedState(req.user.tenantId);
        if (closed.closed && !(closed.syncOpen && req.user.scope === 'pos' && CLOSED_POS_SYNC.test(path))) {
          return res.status(403).json({ error: 'Este estabelecimento está encerrado: só se pode consultar.', code: 'ESTABLISHMENT_CLOSED' });
        }
      }
      if (req.method !== 'GET' && !TRIAL_EXEMPT.test(req.originalUrl.split('?')[0]) && await isTrialExpired(req.user.tenantId)) {
        return res.status(402).json({ error: 'O período de teste terminou. Contacte a Genesis para activar a subscrição.', code: 'TRIAL_EXPIRED' });
      }
      if (req.method !== 'GET' && !TRIAL_EXEMPT.test(req.originalUrl.split('?')[0]) && await isSubscriptionOverdue(req.user.tenantId)) {
        return res.status(402).json({ error: 'A subscrição está em atraso. Pode consultar tudo; para vender e alterar, renove com a Genesis.', code: 'SUBSCRIPTION_OVERDUE' });
      }
    }

    // Contexto da loja para o resto do pedido: todas as queries passam a usar o
    // papel SEM bypassrls com app.tenant_id desta loja (utils/prisma.js).
    return prisma.runWithTenant(req.user.tenantId, next);
  } catch (err) {
    console.error('Auth middleware error', err && err.message ? err.message : err);
    return res.status(503).json({ error: 'Serviço temporariamente indisponível' });
  }
};

module.exports = authMiddleware;

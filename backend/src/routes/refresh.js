const express = require('express');
const router = express.Router();
const { setSessionCookies, verifyRefreshToken, REFRESH_COOKIE, clearSessionCookies } = require('../utils/tokens');
const { validateSessionClaims } = require('../utils/sessionUser');
const { blockedTenantStatus } = require('../utils/tenantStatus');
const { resolveActingTenant } = require('../utils/actingTenant');

// Renova a sessao a partir do refresh token.
//
// Antes: confiava cegamente no refresh token (30 dias) e reemitia um access token
// SEM scope e sem olhar para a BD. Consequencias: uma conta desactivada renovava
// a sessao para sempre, e um PC em modo quiosque recuperava a sessao COMPLETA do
// dono so por chamar esta rota.
//
// Agora: a conta tem de estar activa, a senha nao pode ter mudado (claim pv), a
// loja nao pode estar suspensa, e o scope (ex.: 'kiosk') e preservado.
router.post('/', async (req, res) => {
  try {
    const refresh = req.cookies && req.cookies[REFRESH_COOKIE] ? req.cookies[REFRESH_COOKIE] : null;
    if (!refresh) return res.status(401).json({ error: 'Refresh token not provided' });

    let decoded;
    try {
      decoded = verifyRefreshToken(refresh);
    } catch (err) {
      clearSessionCookies(res);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const check = await validateSessionClaims(decoded);
    if (!check.ok) {
      clearSessionCookies(res);
      return res.status(check.status).json({ error: check.error, code: check.code });
    }
    const user = check.user;

    // Etapa D (31/10): conta o estabelecimento ACTIVO. Acesso retirado ou activo
    // suspenso: volta ao de casa se esse estiver aberto, em vez de terminar a sessao.
    let act = decoded.act || undefined;
    if (user.role !== 'super_admin' && user.tenant_id) {
      const acting = act ? await resolveActingTenant(user, decoded) : user.tenant_id;
      if (act && (!acting || await blockedTenantStatus(acting))) act = undefined;
      if (!act && await blockedTenantStatus(user.tenant_id)) {
        clearSessionCookies(res);
        return res.status(403).json({ error: 'Conta suspensa. Contacte o suporte.' });
      }
    }

    const token = setSessionCookies(res, user, { scope: decoded.scope || undefined, tid: decoded.tid || undefined, act });
    return res.json({ token });
  } catch (err) {
    console.error('Refresh token error', err.message || err);
    return res.status(500).json({ error: 'Erro ao renovar a sessão' });
  }
});

module.exports = router;

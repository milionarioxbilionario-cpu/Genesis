const deviceKeyService = require('../services/deviceKeyService');

// Middleware to authenticate requests with header: Authorization: Device <rawSecret>
// On success it sets req.deviceKey = { id, device_name, owner_user_id, tenant_id }

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Device ')) {
      return res.status(401).json({ error: 'Device authorization header missing' });
    }

    const rawSecret = auth.substring('Device '.length).trim();
    const info = await deviceKeyService.verifyDeviceSecret(rawSecret);
    if (!info) {
      return res.status(401).json({ error: 'Invalid or revoked device key' });
    }

    // Attach device info so route handlers can set DB SET LOCAL or attribute audit logs
    req.deviceKey = info;
    // Also set a minimal req.user-like structure for downstream logic that expects tenant
    req.user = req.user || {};
    req.user.userId = info.owner_user_id;
    req.user.tenantId = info.tenant_id;

    next();
  } catch (err) {
    console.error('deviceKeyAuth error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Device auth error' });
  }
};

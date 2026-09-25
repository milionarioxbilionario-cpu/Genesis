const express = require('express');
const router = express.Router();
const deviceKeyService = require('../services/deviceKeyService');

// POST /api/device-keys  (create) - owner only
router.post('/', async (req, res) => {
  try {
    const ownerUserId = req.user && req.user.userId;
    const tenantId = req.user && req.user.tenantId;
    const { device_name } = req.body || {};
    if (!ownerUserId || !tenantId) return res.status(403).json({ error: 'Unauthorized' });
    if (!device_name) return res.status(400).json({ error: 'device_name required' });

    const { id, rawSecret } = await deviceKeyService.createDeviceKey({ ownerUserId, tenantId, deviceName: device_name });
    // rawSecret is shown only once
    res.status(201).json({ id, secret: rawSecret });
  } catch (err) {
    console.error('create device key error', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Could not create device key' });
  }
});

// GET /api/device-keys - list device keys for owner
router.get('/', async (req, res) => {
  try {
    const ownerUserId = req.user && req.user.userId;
    const tenantId = req.user && req.user.tenantId;
    if (!ownerUserId || !tenantId) return res.status(403).json({ error: 'Unauthorized' });
    const rows = await deviceKeyService.listDeviceKeysForOwner(ownerUserId, tenantId);
    res.json(rows.map(r => ({ id: r.id, device_name: r.device_name, created_at: r.created_at, last_used_at: r.last_used_at, revoked_at: r.revoked_at })));
  } catch (err) {
    console.error('list device keys error', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Could not list device keys' });
  }
});

// POST /api/device-keys/:id/revoke
router.post('/:id/revoke', async (req, res) => {
  try {
    const ownerUserId = req.user && req.user.userId;
    const tenantId = req.user && req.user.tenantId;
    const { id } = req.params;
    if (!ownerUserId || !tenantId) return res.status(403).json({ error: 'Unauthorized' });
    await deviceKeyService.revokeDeviceKey(id, ownerUserId);
    res.json({ revoked: true });
  } catch (err) {
    console.error('revoke device key error', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Could not revoke device key' });
  }
});

module.exports = router;

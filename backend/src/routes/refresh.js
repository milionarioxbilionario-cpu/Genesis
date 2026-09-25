const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
  try {
    const refresh = req.cookies && req.cookies.refreshToken ? req.cookies.refreshToken : null;
    if (!refresh) return res.status(401).json({ error: 'Refresh token not provided' });

    const decoded = jwt.verify(refresh, process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + 'refresh'));
    // issue new access token
    const token = jwt.sign({ userId: decoded.userId, tenantId: decoded.tenantId, role: decoded.role, name: decoded.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
    // rotate refresh token
    const newRefresh = jwt.sign({ userId: decoded.userId, tenantId: decoded.tenantId, role: decoded.role, name: decoded.name }, process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + 'refresh'), { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d' });

    const cookieOptions = { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', newRefresh, cookieOptions);

    return res.json({ token });
  } catch (err) {
    console.error('Refresh token error', err.message || err);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;

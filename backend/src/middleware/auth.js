const jwt = require('jsonwebtoken');

// Auth middleware: verifies JWT and assigns req.user = { userId, tenantId, role, name }
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers && req.headers.cookie) {
    // check cookie header for token cookie (set by login)
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    for (const c of cookies) {
      if (c.startsWith('token=')) {
        token = c.substring('token='.length);
        break;
      }
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalize fields
    req.user = {
      userId: decoded.userId || decoded.id || null,
      tenantId: decoded.tenantId || decoded.tenant_id || null,
      role: decoded.role || null,
      name: decoded.name || decoded.username || null
    };

    // IMPORTANT: do NOT set app.tenant_id globally here. Routes will set SET LOCAL inside
    // transactions where needed to ensure tenant scoping and avoid leaking state across
    // pooled DB connections.

    next();
  } catch (err) {
    console.error('Auth middleware error', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = authMiddleware;

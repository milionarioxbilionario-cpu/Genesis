const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers && req.headers.cookie) {
    // Fallback: check cookie header for token cookie (set by login)
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
    req.user = decoded;

    // Injetar tenant_id no PostgreSQL para ativar RLS (Segunda linha de defesa)
    if (req.user.tenantId) {
      await prisma.$executeRawUnsafe(`SET app.tenant_id = '${req.user.tenantId}'`);
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = authMiddleware;

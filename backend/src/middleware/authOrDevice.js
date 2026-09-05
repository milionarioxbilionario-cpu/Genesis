const authMiddleware = require('./auth');
const deviceKeyAuth = require('./deviceKeyAuth');

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Device ')) {
      return deviceKeyAuth(req, res, next);
    }
    return authMiddleware(req, res, next);
  } catch (e) {
    console.error('authOrDevice error', e);
    return res.status(500).json({ error: 'Server auth error' });
  }
};

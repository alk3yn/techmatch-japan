// server/middleware/auth.js
// Verifies a Bearer JWT on the Authorization header and attaches the
// decoded payload to req.user. Use on any route that requires auth.

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      error: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error('[auth] JWT_SECRET is not set');
    return res.status(500).json({ success: false, error: 'Server misconfiguration' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload: { userId, email, iat, exp }
    req.user = payload;
    return next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ success: false, error: message });
  }
}

module.exports = { requireAuth };

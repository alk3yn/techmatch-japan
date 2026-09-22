// server/routes/auth.js
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me   (requires JWT)

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const { findUserByEmail, findUserById, createUser } = require('../models/queries');

const router = express.Router();

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function sanitizeUser(user) {
  // Never send password_hash back to the client.
  const { password_hash, ...safe } = user;
  return safe;
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: errors.array().map((e) => e.msg).join('; '),
    });
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('displayName').optional().trim().isLength({ max: 100 }),
    body('preferredLanguage').optional().isIn(['ja', 'en']),
  ],
  async (req, res, next) => {
    if (handleValidation(req, res)) return;

    try {
      const { email, password, displayName, preferredLanguage } = req.body;

      const existing = await findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, error: 'Email is already registered' });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await createUser({ email, passwordHash, displayName, preferredLanguage });
      const token = signToken(user);

      res.status(201).json({
        success: true,
        data: { token, user: sanitizeUser(user) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    if (handleValidation(req, res)) return;

    try {
      const { email, password } = req.body;

      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const passwordMatches = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatches) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const token = signToken(user);

      res.json({
        success: true,
        data: { token, user: sanitizeUser(user) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

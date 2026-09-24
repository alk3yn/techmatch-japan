// server/routes/user.js
// All routes require a valid JWT (mounted behind requireAuth).
// GET    /api/user/saved-searches
// POST   /api/user/saved-searches   { searchName, filters }
// DELETE /api/user/saved-searches/:id
// PUT    /api/user/profile          { displayName, preferredLanguage, skills }

const express = require('express');
const { body, validationResult } = require('express-validator');

const { requireAuth } = require('../middleware/auth');
const {
  getSavedSearchesByUser,
  createSavedSearch,
  deleteSavedSearch,
  updateUserProfile,
} = require('../models/queries');

const router = express.Router();
router.use(requireAuth);

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
// GET /api/user/saved-searches
// ---------------------------------------------------------------------------
router.get('/saved-searches', async (req, res, next) => {
  try {
    const searches = await getSavedSearchesByUser(req.user.userId);
    res.json({ success: true, data: { searches } });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/user/saved-searches
// ---------------------------------------------------------------------------
router.post(
  '/saved-searches',
  [
    body('searchName').trim().notEmpty().withMessage('searchName is required').isLength({ max: 100 }),
    body('filters').isObject().withMessage('filters must be an object'),
  ],
  async (req, res, next) => {
    if (handleValidation(req, res)) return;

    try {
      const { searchName, filters } = req.body;
      const search = await createSavedSearch(req.user.userId, { searchName, filters });
      res.status(201).json({ success: true, data: { search } });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/user/saved-searches/:id
// ---------------------------------------------------------------------------
router.delete('/saved-searches/:id', async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Saved search id must be a number' });
  }

  try {
    const deleted = await deleteSavedSearch(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Saved search not found' });
    }
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/user/profile
// ---------------------------------------------------------------------------
router.put(
  '/profile',
  [
    body('displayName').optional().trim().isLength({ max: 100 }),
    body('preferredLanguage').optional().isIn(['ja', 'en']),
    body('skills').optional().isArray().withMessage('skills must be an array of strings'),
    body('skills.*').optional().isString().trim().notEmpty(),
  ],
  async (req, res, next) => {
    if (handleValidation(req, res)) return;

    try {
      const { displayName, preferredLanguage, skills } = req.body;
      const user = await updateUserProfile(req.user.userId, {
        displayName,
        preferredLanguage,
        skills,
      });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

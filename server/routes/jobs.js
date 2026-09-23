// server/routes/jobs.js
// GET /api/jobs          list with filters, pagination, sorting
// GET /api/jobs/skills   all unique skills in the database
// GET /api/jobs/:id      single job with its skills

const express = require('express');
const { query, validationResult } = require('express-validator');

const { getJobs, getJobById, getAllSkills } = require('../models/queries');

const router = express.Router();

const VALID_SORTS = ['salary_desc', 'salary_asc', 'experience_asc', 'experience_desc', 'newest'];

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
// GET /api/jobs
// ---------------------------------------------------------------------------
router.get(
  '/',
  [
    query('salary_min').optional().isInt({ min: 0 }).withMessage('salary_min must be a non-negative integer'),
    query('salary_max').optional().isInt({ min: 0 }).withMessage('salary_max must be a non-negative integer'),
    query('experience_max').optional().isInt({ min: 0 }).withMessage('experience_max must be a non-negative integer'),
    query('remote').optional().isIn(['true', 'false']).withMessage('remote must be true or false'),
    query('career_changer').optional().isIn(['true', 'false']).withMessage('career_changer must be true or false'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('sort').optional().isIn(VALID_SORTS).withMessage(`sort must be one of: ${VALID_SORTS.join(', ')}`),
    // language is accepted for forward-compatibility with the client's i18n
    // state, but every job already carries both title_ja/title_en and
    // description_ja/description_en — the client picks which to render.
    query('language').optional().isIn(['ja', 'en']),
  ],
  async (req, res, next) => {
    if (handleValidation(req, res)) return;

    try {
      const { jobs, pagination } = await getJobs(req.query);
      res.json({ success: true, data: { jobs, pagination } });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/jobs/skills
// Must be declared before /:id so "skills" isn't parsed as an id.
// ---------------------------------------------------------------------------
router.get('/skills', async (req, res, next) => {
  try {
    const skills = await getAllSkills();
    res.json({ success: true, data: { skills } });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/jobs/:id
// Declared after /skills so "skills" is never parsed as an id. Rejects
// non-numeric ids with a clean 400 instead of hitting the DB with NaN.
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Job id must be a number' });
  }

  try {
    const job = await getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    res.json({ success: true, data: { job } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

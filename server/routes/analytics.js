// server/routes/analytics.js
// GET /api/analytics/salary-by-tech
// GET /api/analytics/jobs-by-location
// GET /api/analytics/skills-demand
// GET /api/analytics/salary-vs-experience
// GET /api/analytics/career-changer-stats
// GET /api/analytics/overview

const express = require('express');
const {
  getSalaryByTech,
  getJobsByLocation,
  getSkillsDemand,
  getSalaryVsExperience,
  getCareerChangerStats,
  getAnalyticsOverview,
} = require('../models/queries');

const router = express.Router();

router.get('/salary-by-tech', async (req, res, next) => {
  try {
    const data = await getSalaryByTech();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/jobs-by-location', async (req, res, next) => {
  try {
    const data = await getJobsByLocation();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/skills-demand', async (req, res, next) => {
  try {
    const data = await getSkillsDemand();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/salary-vs-experience', async (req, res, next) => {
  try {
    const data = await getSalaryVsExperience();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/career-changer-stats', async (req, res, next) => {
  try {
    const data = await getCareerChangerStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/overview', async (req, res, next) => {
  try {
    const data = await getAnalyticsOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

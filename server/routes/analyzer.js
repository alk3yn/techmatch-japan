// server/routes/analyzer.js
// POST /api/analyzer
//   Body: { skills: ["C#", "JavaScript", "AWS"] }
//   Computes, for every job, how much of that job's required skill set the
//   user already has, plus aggregate stats on what's most worth learning.

const express = require('express');
const { body, validationResult } = require('express-validator');

const { getAllJobsForAnalysis } = require('../models/queries');

const router = express.Router();

const MOST_DEMANDED_LIMIT = 10;
const RECOMMENDED_LIMIT = 3;

router.post(
  '/',
  [
    body('skills')
      .isArray({ min: 1 })
      .withMessage('skills must be a non-empty array of strings'),
    body('skills.*').isString().trim().notEmpty().withMessage('each skill must be a non-empty string'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array().map((e) => e.msg).join('; '),
      });
    }

    try {
      const userSkills = req.body.skills.map((s) => s.trim());
      const userSkillSet = new Set(userSkills.map((s) => s.toLowerCase()));

      const jobs = await getAllJobsForAnalysis();

      const missingTally = new Map(); // skill (original casing) -> count of jobs missing it

      const matchRateByJob = jobs.map((job) => {
        const jobSkills = job.skills || [];
        const missing = jobSkills.filter((s) => !userSkillSet.has(s.toLowerCase()));
        const matched = jobSkills.length - missing.length;
        const matchRate = jobSkills.length > 0 ? Math.round((matched / jobSkills.length) * 100) : 0;

        missing.forEach((skill) => {
          missingTally.set(skill, (missingTally.get(skill) || 0) + 1);
        });

        return {
          job_id: job.id,
          title_en: job.title_en,
          title_ja: job.title_ja,
          match_rate: matchRate,
          missing,
        };
      });

      matchRateByJob.sort((a, b) => b.match_rate - a.match_rate);

      const matchingJobs = matchRateByJob.filter((j) => j.match_rate > 0);
      const totalMatchingJobs = matchingJobs.length;
      const avgMatchRate =
        totalMatchingJobs > 0
          ? Math.round(
              matchingJobs.reduce((sum, j) => sum + j.match_rate, 0) / totalMatchingJobs
            )
          : 0;

      const mostDemandedMissing = [...missingTally.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, MOST_DEMANDED_LIMIT)
        .map(([skill]) => skill);

      const recommendedNext = mostDemandedMissing.slice(0, RECOMMENDED_LIMIT);

      res.json({
        success: true,
        data: {
          match_rate_by_job: matchRateByJob,
          overall_stats: {
            total_matching_jobs: totalMatchingJobs,
            avg_match_rate: avgMatchRate,
            most_demanded_missing: mostDemandedMissing,
            recommended_next: recommendedNext,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

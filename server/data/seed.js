// server/data/seed.js
// Reads sample-jobs.json and inserts it into job_listings + job_skills.
// Run with: npm run seed   (or: node data/seed.js)
//
// Sample data note: company names in sample-jobs.json (e.g. "Sample Corp A",
// "Tech Solutions B") are fictional placeholders for portfolio/demo purposes,
// not real companies.

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');

const DATA_PATH = path.join(__dirname, 'sample-jobs.json');

async function seed() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const jobs = JSON.parse(raw);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing job data so this script is safely re-runnable.
    await client.query('DELETE FROM job_skills');
    await client.query('DELETE FROM job_listings');
    // Keep ids stable / predictable across re-seeds.
    await client.query('ALTER SEQUENCE job_listings_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE job_skills_id_seq RESTART WITH 1');

    const insertJobText = `
      INSERT INTO job_listings (
        title_ja, title_en, company, location, is_remote,
        salary_min, salary_max, experience_years, career_changer_friendly,
        employment_type, description_ja, description_en
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id
    `;

    const insertSkillText = `
      INSERT INTO job_skills (job_id, skill_name)
      VALUES ($1, $2)
    `;

    let jobCount = 0;
    let skillCount = 0;

    for (const job of jobs) {
      const result = await client.query(insertJobText, [
        job.title_ja,
        job.title_en,
        job.company,
        job.location,
        job.is_remote,
        job.salary_min,
        job.salary_max,
        job.experience_years,
        job.career_changer_friendly,
        job.employment_type,
        job.description_ja,
        job.description_en,
      ]);

      const jobId = result.rows[0].id;
      jobCount += 1;

      for (const skill of job.skills || []) {
        await client.query(insertSkillText, [jobId, skill]);
        skillCount += 1;
      }
    }

    await client.query('COMMIT');
    console.log(`[seed] Inserted ${jobCount} job listings and ${skillCount} skill rows.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Failed, rolled back:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

// server/models/queries.js
// Centralized SQL queries. Routes call these instead of writing SQL inline.
// Every query is parameterized — no string interpolation of user input.

const { query } = require('../config/db');

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await query(
    `SELECT id, email, display_name, preferred_language, skills, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function createUser({ email, passwordHash, displayName, preferredLanguage }) {
  const result = await query(
    `INSERT INTO users (email, password_hash, display_name, preferred_language)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, display_name, preferred_language, skills, created_at, updated_at`,
    [email, passwordHash, displayName || null, preferredLanguage || 'ja']
  );
  return result.rows[0];
}

async function updateUserProfile(id, { displayName, preferredLanguage, skills }) {
  const result = await query(
    `UPDATE users
     SET display_name = COALESCE($2, display_name),
         preferred_language = COALESCE($3, preferred_language),
         skills = COALESCE($4, skills),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, display_name, preferred_language, skills, created_at, updated_at`,
    [id, displayName, preferredLanguage, skills]
  );
  return result.rows[0] || null;
}

// ---------------------------------------------------------------------------
// Job listings
// ---------------------------------------------------------------------------

const SORT_OPTIONS = {
  salary_desc: 'jl.salary_max DESC',
  salary_asc: 'jl.salary_min ASC',
  experience_asc: 'jl.experience_years ASC',
  experience_desc: 'jl.experience_years DESC',
  newest: 'jl.created_at DESC',
};

/**
 * Builds a parameterized WHERE clause from GET /api/jobs query params.
 * Returns { whereSql, params } so both the count query and the list
 * query can share identical filtering logic.
 */
function buildJobFilters(filters) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (filters.location) {
    conditions.push(`jl.location = $${i++}`);
    params.push(filters.location);
  }

  // Overlap logic: a job "matches" salary_min if its range reaches at
  // least that high, and "matches" salary_max if its range starts at
  // or below that ceiling.
  if (filters.salary_min !== undefined) {
    conditions.push(`jl.salary_max >= $${i++}`);
    params.push(Number(filters.salary_min));
  }
  if (filters.salary_max !== undefined) {
    conditions.push(`jl.salary_min <= $${i++}`);
    params.push(Number(filters.salary_max));
  }

  if (filters.experience_max !== undefined) {
    conditions.push(`jl.experience_years <= $${i++}`);
    params.push(Number(filters.experience_max));
  }

  if (filters.remote !== undefined) {
    conditions.push(`jl.is_remote = $${i++}`);
    params.push(filters.remote === 'true' || filters.remote === true);
  }

  if (filters.career_changer !== undefined) {
    conditions.push(`jl.career_changer_friendly = $${i++}`);
    params.push(filters.career_changer === 'true' || filters.career_changer === true);
  }

  if (filters.skills) {
    const skillsArr = String(filters.skills)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillsArr.length > 0) {
      // Matches jobs requiring ANY of the given skills.
      conditions.push(
        `EXISTS (SELECT 1 FROM job_skills js2 WHERE js2.job_id = jl.id AND js2.skill_name = ANY($${i++}))`
      );
      params.push(skillsArr);
    }
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, params };
}

async function getJobs(filters = {}) {
  const { whereSql, params } = buildJobFilters(filters);

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const orderBySql = SORT_OPTIONS[filters.sort] || SORT_OPTIONS.newest;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM job_listings jl ${whereSql}`,
    params
  );
  const total = countResult.rows[0].total;

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;

  const listResult = await query(
    `SELECT jl.*,
            COALESCE(
              (SELECT array_agg(js.skill_name ORDER BY js.skill_name)
               FROM job_skills js WHERE js.job_id = jl.id),
              '{}'
            ) AS skills
     FROM job_listings jl
     ${whereSql}
     ORDER BY ${orderBySql}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...params, limit, offset]
  );

  return {
    jobs: listResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function getJobById(id) {
  const result = await query(
    `SELECT jl.*,
            COALESCE(
              array_agg(js.skill_name ORDER BY js.skill_name) FILTER (WHERE js.skill_name IS NOT NULL),
              '{}'
            ) AS skills
     FROM job_listings jl
     LEFT JOIN job_skills js ON js.job_id = jl.id
     WHERE jl.id = $1
     GROUP BY jl.id`,
    [id]
  );
  return result.rows[0] || null;
}

async function getAllSkills() {
  const result = await query('SELECT DISTINCT skill_name FROM job_skills ORDER BY skill_name');
  return result.rows.map((row) => row.skill_name);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

async function getSalaryByTech() {
  const result = await query(
    `SELECT js.skill_name AS tech,
            ROUND(AVG((jl.salary_min + jl.salary_max) / 2.0))::int AS avg_salary,
            COUNT(*)::int AS count
     FROM job_skills js
     JOIN job_listings jl ON jl.id = js.job_id
     GROUP BY js.skill_name
     ORDER BY avg_salary DESC`
  );
  return result.rows;
}

async function getJobsByLocation() {
  const result = await query(
    `SELECT location, COUNT(*)::int AS count
     FROM job_listings
     GROUP BY location
     ORDER BY count DESC`
  );
  return result.rows;
}

async function getSkillsDemand() {
  const result = await query(
    `SELECT skill_name AS skill, COUNT(*)::int AS count
     FROM job_skills
     GROUP BY skill_name
     ORDER BY count DESC`
  );
  return result.rows;
}

async function getSalaryVsExperience() {
  const result = await query(
    `SELECT experience_years AS experience,
            ROUND(AVG((salary_min + salary_max) / 2.0))::int AS avg_salary
     FROM job_listings
     GROUP BY experience_years
     ORDER BY experience_years ASC`
  );
  return result.rows;
}

async function getCareerChangerStats() {
  const result = await query(
    `SELECT COUNT(*)::int AS total_jobs,
            COUNT(*) FILTER (WHERE career_changer_friendly)::int AS career_changer_friendly
     FROM job_listings`
  );
  const { total_jobs, career_changer_friendly } = result.rows[0];
  const percentage = total_jobs > 0 ? Math.round((career_changer_friendly / total_jobs) * 100) : 0;
  return { total_jobs, career_changer_friendly, percentage };
}

async function getAnalyticsOverview() {
  const result = await query(
    `SELECT COUNT(*)::int AS total_jobs,
            ROUND(AVG((salary_min + salary_max) / 2.0))::int AS avg_salary,
            COUNT(*) FILTER (WHERE is_remote)::int AS remote_count,
            COUNT(*) FILTER (WHERE career_changer_friendly)::int AS career_changer_count
     FROM job_listings`
  );
  return result.rows[0];
}

// ---------------------------------------------------------------------------
// Skill analyzer
// ---------------------------------------------------------------------------

async function getAllJobsForAnalysis() {
  const result = await query(
    `SELECT jl.id, jl.title_ja, jl.title_en,
            COALESCE(
              array_agg(js.skill_name ORDER BY js.skill_name) FILTER (WHERE js.skill_name IS NOT NULL),
              '{}'
            ) AS skills
     FROM job_listings jl
     LEFT JOIN job_skills js ON js.job_id = jl.id
     GROUP BY jl.id`
  );
  return result.rows;
}

// ---------------------------------------------------------------------------
// Saved searches
// ---------------------------------------------------------------------------

async function getSavedSearchesByUser(userId) {
  const result = await query(
    'SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function createSavedSearch(userId, { searchName, filters }) {
  const result = await query(
    `INSERT INTO saved_searches (user_id, search_name, filters)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, searchName, filters]
  );
  return result.rows[0];
}

async function deleteSavedSearch(id, userId) {
  const result = await query(
    'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rowCount > 0;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  getJobs,
  getJobById,
  getAllSkills,
  getSalaryByTech,
  getJobsByLocation,
  getSkillsDemand,
  getSalaryVsExperience,
  getCareerChangerStats,
  getAnalyticsOverview,
  getAllJobsForAnalysis,
  getSavedSearchesByUser,
  createSavedSearch,
  deleteSavedSearch,
};

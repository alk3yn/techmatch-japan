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

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
};

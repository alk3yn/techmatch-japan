-- server/schema.sql
-- TechMatch Japan — PostgreSQL schema
-- Run with: psql -d techmatch -f schema.sql

-- Drop in dependency order so this file can be re-run cleanly in dev.
DROP TABLE IF EXISTS saved_searches;
DROP TABLE IF EXISTS job_skills;
DROP TABLE IF EXISTS job_listings;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id                  SERIAL PRIMARY KEY,
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    display_name        VARCHAR(100),
    preferred_language  VARCHAR(5) DEFAULT 'ja' CHECK (preferred_language IN ('ja', 'en')),
    skills              TEXT[] DEFAULT '{}',
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- job_listings
-- ---------------------------------------------------------------------------
CREATE TABLE job_listings (
    id                       SERIAL PRIMARY KEY,
    title_ja                 VARCHAR(255),
    title_en                 VARCHAR(255),
    company                  VARCHAR(255),
    location                 VARCHAR(100),
    is_remote                BOOLEAN DEFAULT FALSE,
    salary_min                INTEGER,
    salary_max                INTEGER,
    experience_years          INTEGER,
    career_changer_friendly   BOOLEAN DEFAULT FALSE,
    employment_type          VARCHAR(50),
    description_ja           TEXT,
    description_en           TEXT,
    created_at                TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- job_skills (junction table — many skills per job)
-- ---------------------------------------------------------------------------
CREATE TABLE job_skills (
    id          SERIAL PRIMARY KEY,
    job_id      INTEGER REFERENCES job_listings(id) ON DELETE CASCADE,
    skill_name  VARCHAR(100) NOT NULL
);

-- ---------------------------------------------------------------------------
-- saved_searches
-- ---------------------------------------------------------------------------
CREATE TABLE saved_searches (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    search_name   VARCHAR(100),
    filters       JSONB,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes for common filter/lookup patterns (GET /api/jobs, analyzer, auth)
-- ---------------------------------------------------------------------------
CREATE INDEX idx_job_listings_location ON job_listings(location);
CREATE INDEX idx_job_listings_is_remote ON job_listings(is_remote);
CREATE INDEX idx_job_listings_career_changer ON job_listings(career_changer_friendly);
CREATE INDEX idx_job_listings_salary ON job_listings(salary_min, salary_max);
CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill_name ON job_skills(skill_name);
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);

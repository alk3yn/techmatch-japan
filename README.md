# TechMatch Japan 🇯🇵

**Bilingual IT Career Intelligence Platform for Engineers in Japan**

A full-stack web application that helps IT engineers analyze the Japanese job
market, compare salaries by technology, identify skill gaps against real
listings, and track career development — fully in Japanese and English.

Built as a portfolio project to demonstrate full-stack engineering skills to
Japanese employers.

## Live Demo

🔗 _[Add your live URL here after deploying — see [DEPLOYMENT.md](./DEPLOYMENT.md)]_

## Screenshots

| Dashboard | Job Listings | Skill Analyzer |
|---|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Jobs](screenshots/jobs.png) | ![Analyzer](screenshots/analyzer.png) |

## Features

- **Salary Analytics** — salary by technology, by location, and by
  experience level, plus skills-demand ranking, all as Chart.js
  visualizations pulling live from the database
- **Job Listings** — 50 sample IT positions with filtering by location,
  salary range, experience, remote status, and career-changer-friendliness;
  sortable, paginated, shareable via URL
- **Skill Gap Analyzer** — enter your skills and see a match rate against
  every listing, which skills are most worth learning next, and a chart of
  your best-matching roles
- **Bilingual UI** — every page, including all charts and form validation
  messages, fully supports Japanese and English with a persistent language
  switcher
- **Accounts** — JWT-based register/login, saved job searches, and a skill
  set that persists to your profile and auto-loads on the Analyzer
- **Responsive design** — works down to 375px, with a dark/blue design
  system throughout
- **Resilient by design** — every page has loading and error states, and an
  app-wide error boundary catches unexpected render failures gracefully

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Chart.js, i18next, React Router v6 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 15 |
| Auth | JWT + bcryptjs |
| Cloud | AWS S3, CloudFront, EC2, RDS |
| Process manager | PM2 |
| Version Control | Git + GitHub |

## Architecture

```
User Browser
    │
    ▼
[S3 + CloudFront]         ← React SPA (static files)
    │
    ▼  HTTPS/HTTP
[EC2: nginx :80]          ← reverse proxy (see deploy/nginx/)
    │
    ▼  proxy_pass
[EC2: Node + PM2 :5000]   ← Express API (server/ecosystem.config.js)
    │
    ▼
[RDS PostgreSQL]
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step AWS setup.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user (requires JWT) |
| GET | /api/jobs | List jobs — filter, sort, paginate |
| GET | /api/jobs/:id | Get single job with skills |
| GET | /api/jobs/skills | Get all unique skills |
| GET | /api/analytics/salary-by-tech | Avg salary per technology |
| GET | /api/analytics/jobs-by-location | Job count per city |
| GET | /api/analytics/skills-demand | Skill demand ranking |
| GET | /api/analytics/salary-vs-experience | Avg salary per experience year |
| GET | /api/analytics/career-changer-stats | Career-changer-friendly rate |
| GET | /api/analytics/overview | Dashboard summary stats |
| POST | /api/analyzer | Match a skill set against every job |
| GET | /api/user/saved-searches | List saved searches (requires JWT) |
| POST | /api/user/saved-searches | Save a search (requires JWT) |
| DELETE | /api/user/saved-searches/:id | Delete a saved search (requires JWT) |
| PUT | /api/user/profile | Update display name / language / skills (requires JWT) |

All responses follow `{ success: boolean, data: any, error?: string }`.

## Local Setup

```bash
# Clone
git clone https://github.com/tejas-5/techmatch-japan.git
cd techmatch-japan

# Backend
cd server
npm install
cp ../.env.example .env     # edit with your local Postgres credentials
createdb techmatch          # skip if the database already exists
psql -d techmatch -f schema.sql
npm run seed                # loads the 50 sample listings
npm run dev                 # http://localhost:5000

# Frontend (new terminal)
cd ../client
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm run dev                 # http://localhost:5173
```

## Environment Variables

**server/.env** (see `server/.env.example`):

```
DATABASE_URL=postgresql://user:pass@localhost:5432/techmatch
JWT_SECRET=your-secret-key
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

**client/.env** (see `client/.env.example`):

```
VITE_API_URL=http://localhost:5000/api
```

Production variants — `server/.env.production.example` and
`client/.env.production.example` — are documented in
[DEPLOYMENT.md](./DEPLOYMENT.md).

## Deployment

Deployed on AWS: the React build is served from S3 behind CloudFront, and
the Express API runs under PM2 on an EC2 instance behind an nginx reverse
proxy, talking to a PostgreSQL database on RDS.

Full step-by-step instructions, plus the `deploy/` scripts that automate
each redeploy, are in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## Sample Data Notice

All 50 job listings (and every company name — `Sample Corp A`,
`Tech Solutions B`, etc.) are fictional, generated for this portfolio
project. No real companies, postings, or applications are involved; the
"Apply" button on a job's detail page is intentionally disabled.

## Author

**Tejas Agrawal** — [Portfolio](https://tejas-agrawal.web.app/) | [GitHub](https://github.com/tejas-5)

## License

MIT

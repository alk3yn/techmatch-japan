# TechMatch Japan — client

React 18 + Vite single-page app (React Router v6, i18next, Chart.js).

For the project overview, features, API and architecture see the
[root README](../README.md). Deployment steps are in
[DEPLOYMENT.md](../DEPLOYMENT.md).

## Commands

```bash
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
npm run build            # production build into dist/ (uses .env.production)
```

For production builds, create `client/.env.production` containing
`VITE_API_URL=/api` (see `.env.production.example`).

// server/index.js
// TechMatch Japan — Express API entry point.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Core middleware ----
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---- Route mounting ----
// Routes are added incrementally following the build order:
//   Day 3: app.use('/api/auth', require('./routes/auth'));
//   Day 4: app.use('/api/jobs', require('./routes/jobs'));
//   Day 5: app.use('/api/analytics', require('./routes/analytics'));
//   Day 5: app.use('/api/analyzer', require('./routes/analyzer'));
//   Day 5: app.use('/api/user', require('./routes/user'));

// ---- 404 handler for unknown API routes ----
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// ---- Central error handler ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`TechMatch Japan API listening on port ${PORT}`);
});

module.exports = app;

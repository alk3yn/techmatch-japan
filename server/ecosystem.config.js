// server/ecosystem.config.js
// PM2 process manager config. On the EC2 instance:
//   pm2 start ecosystem.config.js --env production
//   pm2 save                          # persist the process list
//   pm2 startup                       # generate the boot-time systemd hook (run the printed command once)
//
// Common PM2 commands used day-to-day:
//   pm2 status              — see if the API is up
//   pm2 logs techmatch-api  — tail stdout/stderr
//   pm2 reload techmatch-api --env production   — zero-downtime restart after a deploy
//   pm2 restart techmatch-api                   — hard restart

module.exports = {
  apps: [
    {
      name: 'techmatch-api',
      script: 'index.js',
      cwd: __dirname,

      // t2.micro (free tier) has 1 vCPU — a single fork instance is the
      // right choice. Bump `instances` (and switch exec_mode to 'cluster')
      // only if you move to a multi-core instance type.
      instances: 1,
      exec_mode: 'fork',

      // .env is still loaded by dotenv inside index.js — this just makes
      // sure NODE_ENV is correct even if the environment doesn't set it.
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },

      // Restart automatically if the process leaks past this — generous
      // headroom for a t2.micro (1GB RAM) while still catching runaway leaks.
      max_memory_restart: '300M',

      // Don't hot-loop-restart a genuinely broken deploy.
      min_uptime: '10s',
      max_restarts: 10,

      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
    },
  ],
};

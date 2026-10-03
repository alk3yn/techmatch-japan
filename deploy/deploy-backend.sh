#!/usr/bin/env bash
# deploy/deploy-backend.sh
#
# Deploys the current git branch's HEAD to the EC2 instance: pulls the
# latest code, installs production dependencies, and reloads PM2 with
# zero downtime. Run from the repo root:
#
#   ./deploy/deploy-backend.sh
#
# Prerequisites: deploy/deploy.config.sh exists (see .example), your
# changes are pushed to GitHub (the server pulls from origin, it doesn't
# receive a local copy of your working directory), and schema.sql / a
# fresh seed have already been run on RDS at least once (see DEPLOYMENT.md).

set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f deploy.config.sh ]; then
  echo "error: deploy/deploy.config.sh not found — copy deploy.config.sh.example and fill in your values." >&2
  exit 1
fi
source deploy.config.sh

echo "==> Deploying backend to $EC2_HOST"

ssh -i "$EC2_KEY_PATH" "$EC2_USER@$EC2_HOST" bash -s <<EOF
  set -euo pipefail
  cd "$REMOTE_APP_DIR"

  echo "--> Pulling latest code"
  git pull origin main

  echo "--> Installing production dependencies"
  cd server
  npm ci --omit=dev

  echo "--> Reloading PM2 (zero-downtime)"
  npx pm2 reload ecosystem.config.js --env production || npx pm2 start ecosystem.config.js --env production
  npx pm2 save
EOF

echo "==> Backend deploy complete"
echo "    Check status:  ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST 'pm2 status'"
echo "    Tail logs:     ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST 'pm2 logs techmatch-api'"

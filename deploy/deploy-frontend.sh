#!/usr/bin/env bash
# deploy/deploy-frontend.sh
#
# Builds the React app locally with production env vars and syncs it to
# S3, then invalidates the CloudFront cache so the new build is served
# immediately instead of waiting out the cache TTL. Run from the repo root:
#
#   ./deploy/deploy-frontend.sh
#
# Prerequisites: deploy/deploy.config.sh exists, client/.env.production
# contains VITE_API_URL=/api (CloudFront forwards /api/* to the backend, see
# DEPLOYMENT.md), and the AWS CLI is configured (`aws configure`) with
# credentials that can write to the bucket and create CloudFront
# invalidations. Run it from Git Bash on Windows, not PowerShell.

set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f deploy.config.sh ]; then
  echo "error: deploy/deploy.config.sh not found — copy deploy.config.sh.example and fill in your values." >&2
  exit 1
fi
source deploy.config.sh

cd ../client

if [ ! -f .env.production ]; then
  echo "error: client/.env.production not found — copy .env.production.example and set VITE_API_URL." >&2
  exit 1
fi

if ! tr -d '\r' < .env.production | grep -qx 'VITE_API_URL=/api'; then
  echo "warning: client/.env.production does not contain VITE_API_URL=/api." >&2
  echo "         An absolute http:// API address is blocked by browsers on the HTTPS site." >&2
  read -r -p "Continue anyway? [y/N] " answer
  [ "$answer" = "y" ] || exit 1
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building production bundle"
npm run build

echo "==> Syncing dist/ to s3://$S3_BUCKET"
aws s3 sync dist/ "s3://$S3_BUCKET" --delete

echo "==> Invalidating CloudFront cache ($CLOUDFRONT_DISTRIBUTION_ID)"
# MSYS_NO_PATHCONV stops Git Bash on Windows rewriting "/*" into a Windows path
# (it has no effect on macOS/Linux).
MSYS_NO_PATHCONV=1 aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*"

echo "==> Frontend deploy complete"

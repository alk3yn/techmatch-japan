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
# has VITE_API_URL pointing at your deployed backend, and the AWS CLI is
# configured (`aws configure`) with credentials that can write to the
# bucket and create CloudFront invalidations.

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

echo "==> Installing dependencies"
npm ci

echo "==> Building production bundle"
npm run build

echo "==> Syncing dist/ to s3://$S3_BUCKET"
aws s3 sync dist/ "s3://$S3_BUCKET" --delete

echo "==> Invalidating CloudFront cache ($CLOUDFRONT_DISTRIBUTION_ID)"
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*"

echo "==> Frontend deploy complete"

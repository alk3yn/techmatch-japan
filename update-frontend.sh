#!/usr/bin/env bash
# update-frontend.sh
# Builds the React frontend, uploads it to S3, and refreshes CloudFront.
#
# Put this file in the ROOT of your project (next to the client/ and server/ folders):
#   ~/OneDrive/Documents/GitHub/techmatch-japan/update-frontend.sh
#
# Run it from Git Bash:
#   cd ~/OneDrive/Documents/GitHub/techmatch-japan
#   ./update-frontend.sh
# (first time only: chmod +x update-frontend.sh)

set -euo pipefail

# ---- Your values (no secrets here) -----------------------------------------
BUCKET="techmatch-japan-frontend-alk3yn"
CLOUDFRONT_DOMAIN="d3laf37ajd6nv0.cloudfront.net"
# -----------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$SCRIPT_DIR/client"

echo "==> Checking setup"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "ERROR: can't find the client folder at $CLIENT_DIR"
  echo "Put this script in the project root, next to the client/ and server/ folders."
  exit 1
fi

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "ERROR: the AWS CLI isn't logged in. Run: aws configure"
  exit 1
fi

# The build must point at /api (CloudFront forwards /api/* to the server).
# Without this, the live site would call the wrong address.
ENV_FILE="$CLIENT_DIR/.env.production"
if [ ! -f "$ENV_FILE" ] || ! tr -d '\r' < "$ENV_FILE" | grep -qx 'VITE_API_URL=/api'; then
  echo "ERROR: client/.env.production is missing or wrong."
  echo "It must contain exactly this line:  VITE_API_URL=/api"
  echo "Fix it with:  echo \"VITE_API_URL=/api\" > client/.env.production"
  exit 1
fi

echo "==> 1/4 Building the frontend"
( cd "$CLIENT_DIR" && npm run build )

if [ ! -f "$CLIENT_DIR/dist/index.html" ]; then
  echo "ERROR: build finished but client/dist/index.html is missing."
  exit 1
fi

echo "==> 2/4 Uploading to S3 bucket: $BUCKET"
aws s3 sync "$CLIENT_DIR/dist/" "s3://$BUCKET" --delete

echo "==> 3/4 Finding the CloudFront distribution for $CLOUDFRONT_DOMAIN"
DIST_ID="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?DomainName=='$CLOUDFRONT_DOMAIN'].Id" \
  --output text)"

if [ -z "$DIST_ID" ] || [ "$DIST_ID" = "None" ]; then
  echo "ERROR: no CloudFront distribution found for $CLOUDFRONT_DOMAIN"
  exit 1
fi

echo "==> 4/4 Refreshing CloudFront (distribution $DIST_ID)"
# MSYS_NO_PATHCONV stops Git Bash from turning "/*" into a Windows path.
MSYS_NO_PATHCONV=1 aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text

echo
echo "Done. Wait a minute or two, then open https://$CLOUDFRONT_DOMAIN"
echo "and do a hard refresh (Ctrl+Shift+R)."

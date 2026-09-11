#!/usr/bin/env bash
# Build and publish the site.
#
# NOTE: this overwrites index.html in the bucket — which is what the
# under-construction placeholder currently occupies. Running this RAISES THE
# CURTAIN and puts the real site live at ellieevens.com.
set -euo pipefail

BUCKET=s3://ellie-website
DIST=E1DMC9GBT90JNF

cd "$(dirname "$0")"

# This runs on your laptop, not the server. The EC2 box has no frontend
# toolchain, and its instance role deliberately cannot write the site bucket
# or invalidate CloudFront — it exists to run the API.
if [ ! -x node_modules/.bin/vite ]; then
  echo "ERROR: frontend dependencies are missing here."
  exit 1
fi

echo "==> Build (type-check runs in parallel; a type error aborts the deploy)"
npm run build

echo "==> Hashed assets — immutable for a year"
# Safe because Vite renames these on every content change, so a stale cache
# entry can never be served for changed content.
aws s3 sync dist/assets "$BUCKET/assets" --delete \
  --cache-control 'public, max-age=31536000, immutable'

echo "==> Stable-name files — one hour"
aws s3 sync dist "$BUCKET" --exclude 'assets/*' --exclude index.html \
  --cache-control 'public, max-age=3600'

echo "==> index.html — never cached"
# This is why deploys take effect immediately: the edge always revalidates
# this one file, and it names every hashed asset the app needs.
aws s3 cp dist/index.html "$BUCKET/index.html" --cache-control 'no-cache'

echo "==> Invalidating the edge caches"
aws cloudfront create-invalidation --distribution-id "$DIST" --paths '/*' \
  --query 'Invalidation.Status' --output text

echo
echo "Live: https://ellieevens.com"

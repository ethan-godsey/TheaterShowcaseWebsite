#!/usr/bin/env bash
# One-time: push the existing optimised gallery images to S3 and create their
# database rows, so the site can stop bundling them into the JS build.
#
# Run from the repo root, with AWS credentials that can write the bucket:
#   bash server/scripts/backfill-gallery.sh
set -euo pipefail

BUCKET=ellie-gallery-pics
SRC=ellie-evens/src/assets/opt
cd "$(dirname "$0")/../.."

export $(grep DATABASE_URL server/.env)

count=0
for file in "$SRC"/IMG_*.jpg; do
  [ -e "$file" ] || continue
  base=$(basename "$file" .jpg)
  key="media/gallery/${base}.jpg"

  aws s3 cp "$file" "s3://${BUCKET}/${key}" \
    --content-type image/jpeg \
    --cache-control 'public, max-age=31536000, immutable' \
    --only-show-errors

  # ON CONFLICT: s3_key is UNIQUE, so re-running this is safe.
  psql "$DATABASE_URL" -q -c \
    "INSERT INTO photos (s3_key, caption, alt_text, sort_order)
     VALUES ('${key}', '', 'Ellie Evens', ${count})
     ON CONFLICT (s3_key) DO NOTHING;"

  count=$((count + 1))
  printf '.'
done

echo
echo "uploaded and registered: ${count}"
psql "$DATABASE_URL" -t -c "SELECT '  rows in photos: ' || count(*) FROM photos;"

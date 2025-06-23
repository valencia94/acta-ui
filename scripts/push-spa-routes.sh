#!/usr/bin/env bash
set -euo pipefail

ROUTES=(login dashboard)          # ← add more routes here if needed
BUCKET="${S3_BUCKET_NAME:?bucket env missing}"

for path in "${ROUTES[@]}"; do
  aws s3 cp dist/index.html "s3://$BUCKET/$path" \
    --cache-control 'no-cache, no-store, must-revalidate' \
    --content-type 'text/html'
done

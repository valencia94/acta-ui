#!/usr/bin/env bash
# scripts/push-spa-routes.sh
# Copy SPA shell for client-side routes locally AND upload to S3.
# Requires: BUCKET or AWS_S3_BUCKET, AWS_REGION; optionally CLOUDFRONT_DIST_ID.

set -euo pipefail

# ────────────────────────────────────────────────────────────────────────────────
# Configuration
# ────────────────────────────────────────────────────────────────────────────────

# S3 bucket (allow either BUCKET or AWS_S3_BUCKET)
BUCKET="${BUCKET:-${AWS_S3_BUCKET:-}}"
if [ -z "$BUCKET" ]; then
  echo "Error: Set \$BUCKET or \$AWS_S3_BUCKET"
  exit 1
fi

# AWS region (default to us-east-1 if not set)
REGION="${AWS_REGION:-us-east-1}"

# Build output directory (first arg, default "dist")
DIST_DIR="${1:-dist}"
shift || true

# Routes to process (remaining args; default to login & dashboard)
ROUTES=( "$@" )
if [ "${#ROUTES[@]}" -eq 0 ]; then
  ROUTES=( login dashboard )
fi

# Optional CloudFront distribution ID for invalidation
CLOUDFRONT_DIST_ID="${CLOUDFRONT_DIST_ID:-}"

echo "→ Bucket: $BUCKET"
echo "→ Region: $REGION"
echo "→ Dist dir: $DIST_DIR"
echo "→ Routes: ${ROUTES[*]}"
[ -n "$CLOUDFRONT_DIST_ID" ] && echo "→ Will invalidate CloudFront: $CLOUDFRONT_DIST_ID"

# ────────────────────────────────────────────────────────────────────────────────
# Sanity check
# ────────────────────────────────────────────────────────────────────────────────

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "Error: $DIST_DIR/index.html not found"
  exit 1
fi

# ────────────────────────────────────────────────────────────────────────────────
# Copy & Upload
# ────────────────────────────────────────────────────────────────────────────────

for route in "${ROUTES[@]}"; do
  # Local copy
  mkdir -p "$DIST_DIR/$route"
  cp "$DIST_DIR/index.html" "$DIST_DIR/$route/index.html"
  echo "Copied local fallback → $DIST_DIR/$route/index.html"

  # S3 upload (root of route and explicit index.html)
  for target in "" "index.html"; do
    dest="s3://$BUCKET/$route${target:+/$target}"
    echo "Uploading → $dest"
    aws s3 cp "$DIST_DIR/index.html" "$dest" \
      --region "$REGION" \
      --content-type "text/html; charset=utf-8" \
      --cache-control "max-age=0, no-cache, no-store, must-revalidate"
  done
done

echo "✓ SPA routes pushed to S3"

# ────────────────────────────────────────────────────────────────────────────────
# Optional CloudFront invalidation
# ────────────────────────────────────────────────────────────────────────────────

if [ -n "$CLOUDFRONT_DIST_ID" ]; then
  echo "Invalidating CloudFront distribution $CLOUDFRONT_DIST_ID (/*)"
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DIST_ID" \
    --paths "/*" \
    --region "$REGION" \
    > /dev/null
  echo "✓ Invalidation requested"
fi

echo "All done!"

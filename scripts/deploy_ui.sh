#!/usr/bin/env bash
# ----------------------------------------------------------
# Deploy Vite build to an EXISTING S3 bucket + CloudFront distro
# ----------------------------------------------------------
set -euo pipefail

# ----- Mandatory config (fail fast if absent) -----------------
: "${AWS_REGION:?AWS_REGION not set}"
: "${S3_BUCKET_NAME:?S3_BUCKET_NAME not set}"
: "${CLOUDFRONT_DIST_ID:?CLOUDFRONT_DIST_ID not set}"

BUILD_DIR=${BUILD_DIR:-dist}

echo "🔧 Region ............ $AWS_REGION"
echo "🔧 Bucket ............ $S3_BUCKET_NAME"
echo "🔧 Build dir ......... $BUILD_DIR"
echo "🔧 CloudFront distro . $CLOUDFRONT_DIST_ID"

# ----- Build (skip in CI if already built) --------------------
if [[ -d src ]]; then
  corepack enable
  pnpm install --no-frozen-lockfile
  pnpm run build
fi

# ----- Ensure bucket exists (creates only on first run) -------
if ! aws s3api head-bucket --bucket "$S3_BUCKET_NAME" 2>/dev/null; then
  echo "🪣  Creating bucket $S3_BUCKET_NAME"
  aws s3api create-bucket \
      --bucket "$S3_BUCKET_NAME" \
      --region "$AWS_REGION" \
      --create-bucket-configuration LocationConstraint="$AWS_REGION"
  aws s3 website s3://"$S3_BUCKET_NAME" --index-document index.html
fi

# ----- Upload build ------------------------------------------
echo "⬆️  Syncing $BUILD_DIR → s3://$S3_BUCKET_NAME"
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET_NAME" --delete

# ----- Invalidate CloudFront cache ---------------------------
echo "♻️  Invalidating CloudFront cache"
aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DIST_ID" \
    --paths '/*' >/dev/null

DOMAIN=$(aws cloudfront get-distribution \
    --id "$CLOUDFRONT_DIST_ID" \
    --query 'Distribution.DomainName' --output text)

echo "🚀  Deployed → https://$DOMAIN"

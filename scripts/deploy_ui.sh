#!/usr/bin/env bash
# ----------------------------------------------------------
# Sync built SPA (dist/) to S3 and invalidate CloudFront
# ----------------------------------------------------------
set -euo pipefail

: "${AWS_REGION:?AWS_REGION not set}"
: "${S3_BUCKET_NAME:?S3_BUCKET_NAME not set}"
: "${CLOUDFRONT_DIST_ID:?CLOUDFRONT_DIST_ID not set}"
BUILD_DIR=${BUILD_DIR:-dist}

echo "🔧  Region ............ $AWS_REGION"
echo "🔧  Bucket ............ $S3_BUCKET_NAME"
echo "🔧  Build dir ......... $BUILD_DIR"
echo "🔧  CloudFront distro . $CLOUDFRONT_DIST_ID"

# ---------- Ensure bucket exists (first run only) ----------
if ! aws s3api head-bucket --bucket "$S3_BUCKET_NAME" 2>/dev/null; then
  echo "🪣  Creating bucket $S3_BUCKET_NAME"
  aws s3api create-bucket \
      --bucket "$S3_BUCKET_NAME" \
      --region "$AWS_REGION" \
      --create-bucket-configuration LocationConstraint="$AWS_REGION"
  aws s3 website s3://"$S3_BUCKET_NAME" --index-document index.html
fi

# ---------- Upload build -----------------------------------
echo "⬆️   Syncing $BUILD_DIR → s3://$S3_BUCKET_NAME"
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET_NAME" \
  --delete \
  --acl bucket-owner-full-control \
  --cache-control "public,max-age=31536000,immutable"

# ---------- Invalidate CloudFront --------------------------
echo "♻️   Invalidating CloudFront cache"
aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DIST_ID" \
    --paths '/*' >/dev/null

DOMAIN=$(aws cloudfront get-distribution \
    --id "$CLOUDFRONT_DIST_ID" \
    --query 'Distribution.DomainName' --output text)

echo "🚀  Deployed → https://$DOMAIN"

#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION not set}"
: "${S3_BUCKET_NAME:?S3_BUCKET_NAME not set}"
: "${CLOUDFRONT_DIST_ID:?CLOUDFRONT_DIST_ID not set}"
BUILD_DIR=${BUILD_DIR:-dist}

echo "🔧  Region ............ $AWS_REGION"
echo "🔧  Bucket ............ $S3_BUCKET_NAME"
echo "🔧  Build dir ......... $BUILD_DIR"
echo "🔧  CloudFront distro . $CLOUDFRONT_DIST_ID"

# --- create bucket on first run ---
if ! aws s3api head-bucket --bucket "$S3_BUCKET_NAME" 2>/dev/null; then
  echo "🪣  Creating bucket $S3_BUCKET_NAME"
  aws s3api create-bucket \
    --bucket "$S3_BUCKET_NAME" \
    --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION"
  aws s3 website s3://"$S3_BUCKET_NAME" --index-document index.html
fi

# --- upload index.html without cache ---
aws s3 cp "$BUILD_DIR/index.html" "s3://$S3_BUCKET_NAME/index.html" \
  --acl bucket-owner-full-control \
  --cache-control "no-cache, no-store, must-revalidate"

# --- upload everything else with long-term cache ---
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET_NAME" \
  --exclude "index.html" \
  --delete \
  --acl bucket-owner-full-control \
  --cache-control "public,max-age=31536000,immutable"

# --- CloudFront invalidate ---
echo "♻️   Invalidating CloudFront cache"
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DIST_ID" \
  --paths '/*' >/dev/null

DOMAIN=$(aws cloudfront get-distribution \
  --id "$CLOUDFRONT_DIST_ID" \
  --query 'Distribution.DomainName' --output text)
echo "🚀  Deployed → https://$DOMAIN"

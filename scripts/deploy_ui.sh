#!/usr/bin/env bash
# ----------------------------------------------------------
# Build Vite app (if src/ present) and deploy to S3 + CloudFront
# ----------------------------------------------------------
set -euo pipefail

# ----- Config (taken from env) -----
AWS_REGION=${AWS_REGION:-us-east-2}
BUILD_DIR=${BUILD_DIR:-dist}
BUCKET_NAME=${S3_BUCKET_NAME:?S3_BUCKET_NAME not set}
CLOUDFRONT_DIST_ID=${CLOUDFRONT_DIST_ID:-}

echo "🔧 Region ............ $AWS_REGION"
echo "🔧 Bucket ............ $BUCKET_NAME"
echo "🔧 Build dir ......... $BUILD_DIR"
echo "🔧 CloudFront distro . ${CLOUDFRONT_DIST_ID:-<will create>}"

# ----- Build (skip in CI if already built) -----
if [[ -d src ]]; then
  corepack enable
  pnpm install --frozen-lockfile
  pnpm run build
fi

# ----- Ensure S3 bucket -----
aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null || {
  echo "🪣 Creating bucket $BUCKET_NAME"
  aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --region "$AWS_REGION" \
      --create-bucket-configuration LocationConstraint="$AWS_REGION"
  aws s3 website s3://"$BUCKET_NAME" --index-document index.html
}

# ----- Upload build -----
echo "⬆️  Syncing build → s3://$BUCKET_NAME"
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" --delete

# ----- CloudFront distro -----
if [[ -z "$CLOUDFRONT_DIST_ID" ]]; then
  echo "🌐 Creating CloudFront distribution"
  CLOUDFRONT_DIST_ID=$(aws cloudfront create-distribution \
        --origin-domain-name "$BUCKET_NAME.s3.$AWS_REGION.amazonaws.com" \
        --default-root-object index.html \
        --query 'Distribution.Id' --output text)
fi

DOMAIN=$(aws cloudfront get-distribution --id "$CLOUDFRONT_DIST_ID" \
        --query 'Distribution.DomainName' --output text)

echo "♻️  Invalidating cache"
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths '/*' >/dev/null

echo "🚀  Deployed → https://$DOMAIN"

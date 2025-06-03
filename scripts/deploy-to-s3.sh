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

# --- Only for initial setup; comment out in prod ---
# if ! aws s3api head-bucket --bucket "$S3_BUCKET_NAME" 2>/dev/null; then
#   echo "🛠️  Creating bucket $S3_BUCKET_NAME"
#   aws s3api create-bucket \
#     --bucket "$S3_BUCKET_NAME" \
#     --region "$AWS_REGION" \
#     --create-bucket-configuration LocationConstraint="$AWS_REGION"
#   aws s3 website s3://"$S3_BUCKET_NAME" --index-document index.html
# fi

# --- Sync build to S3 ---
aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET_NAME/" --delete

# --- Invalidate CloudFront cache ---
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/*"

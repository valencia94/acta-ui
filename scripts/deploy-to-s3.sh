#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION not set}"
: "${S3_BUCKET_NAME:?S3_BUCKET_NAME not set}"
: "${CLOUDFRONT_DIST_ID:?CLOUDFRONT_DIST_ID not set}"
BUILD_DIR="${BUILD_DIR:-dist}"

echo "Syncing build directory to S3 bucket..."
aws s3 sync "${BUILD_DIR}/" "s3://${S3_BUCKET_NAME}/" --delete --region "${AWS_REGION}"

echo "Uploading /health with no-cache headers..."
aws s3 cp "${BUILD_DIR}/health" "s3://${S3_BUCKET_NAME}/health" \
  --content-type application/json --cache-control no-cache --region "${AWS_REGION}"

echo "Invalidating CloudFront distribution..."
aws cloudfront create-invalidation --distribution-id "${CLOUDFRONT_DIST_ID}" --paths "/*" --region "${AWS_REGION}"

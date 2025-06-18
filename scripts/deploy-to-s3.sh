#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION not set}"
: "${S3_BUCKET_NAME:?S3_BUCKET_NAME not set}"
: "${CLOUDFRONT_DIST_ID:?CLOUDFRONT_DIST_ID not set}"
BUILD_DIR="${BUILD_DIR:-dist}"

aws s3 sync "${BUILD_DIR}/" "s3://${S3_BUCKET_NAME}/" --delete --region "${AWS_REGION}"
aws cloudfront create-invalidation --distribution-id "${CLOUDFRONT_DIST_ID}" --paths "/*" --region "${AWS_REGION}"

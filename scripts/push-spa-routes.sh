#!/usr/bin/env bash
# Clean deploy script for Acta UI
set -euo pipefail

# Required settings
BUCKET="acta-ui-frontend-prod"
REGION="us-east-2"
DISTRIBUTION_ID="EPQU7PVDLQXUA"
DIST_DIR="dist"

echo "📦 Building frontend..."
pnpm run build

echo "☁️ Uploading to S3 bucket: $BUCKET"
aws s3 sync "$DIST_DIR/" "s3://$BUCKET/" \
  --region "$REGION" \
  --delete \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"

echo "🌍 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --region "$REGION"

echo "✅ Deployment complete!"


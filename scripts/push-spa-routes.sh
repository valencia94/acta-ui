#!/usr/bin/env bash
# Clean deploy script for Acta UI
set -euo pipefail

# Required settings
BUCKET="acta-ui-frontend-prod"
REGION="us-east-2"
DISTRIBUTION_ID="EPQU7PVDLQXUA"
DIST_DIR="dist"

echo "📦 Build process completed, uploading artifacts..."

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

echo "🔍 Verifying SPA routing files were uploaded..."
aws s3 ls "s3://$BUCKET/index.html" --region "$REGION" || echo "⚠️  index.html not found"
aws s3 ls "s3://$BUCKET/404.html" --region "$REGION" || echo "⚠️  404.html not found"

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "  1. Wait 5-10 minutes for CloudFront invalidation to complete"
echo "  2. Test direct navigation to routes like /dashboard, /admin, /projects-for-pm"
echo "  3. Verify browser refresh works on all routes"


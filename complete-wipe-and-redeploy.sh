#!/bin/bash

# 🚀 COMPLETE WIPE & REDEPLOY ACTA-UI to S3 + CloudFront
set -euo pipefail

S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"

# 🧬 Environment Variables for Vite Build
export VITE_API_BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
export VITE_COGNITO_REGION="us-east-2"
export VITE_COGNITO_POOL_ID="us-east-2_FyHLtOhiY"
export VITE_COGNITO_WEB_CLIENT="dshos5iou44tuach7ta3ici5m"
export VITE_SKIP_AUTH="false"
export VITE_USE_MOCK_API="false"

echo "⚠️ WIPING S3 Bucket: $S3_BUCKET in 3 seconds..."
sleep 3
aws s3 rm s3://$S3_BUCKET/ --recursive --region $AWS_REGION
echo "✅ S3 Wipe Complete!"

echo "🧹 Cleaning local build artifacts..."
rm -rf dist .vite node_modules/.vite .next out build
echo "✅ Local cleanup done."

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🏗️ Building Vite app..."
pnpm run build

# ✅ Validate Output
if [ ! -f "dist/index.html" ]; then
  echo "❌ Missing index.html — build failed"
  exit 1
fi

if ! grep -q "Ikusi · Acta Platform" dist/index.html; then
  echo "❌ Incorrect <title> in HTML"
  exit 1
fi

if ! grep -q "q2b9avfwv5.execute-api.us-east-2.amazonaws.com" dist/assets/*.js; then
  echo "❌ Production API URL not embedded"
  exit 1
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
FILE_COUNT=$(find dist -type f | wc -l)

echo "✅ Build Complete! Size: $BUILD_SIZE, Files: $FILE_COUNT"

echo "☁️ Syncing to S3..."

# Static files (JS, CSS, icons, fonts)
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --region $AWS_REGION \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000"

# HTML with no-cache
aws s3 cp dist/ s3://$S3_BUCKET/ \
  --recursive \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# JSON files (if any)
aws s3 cp dist/ s3://$S3_BUCKET/ \
  --recursive \
  --exclude "*" \
  --include "*.json" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/json"

echo "✅ Upload complete."

S3_FILE_COUNT=$(aws s3 ls s3://$S3_BUCKET/ --recursive | wc -l)
echo "📊 S3 now holds $S3_FILE_COUNT files."

echo "🌐 Invalidating CloudFront..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

aws cloudfront wait invalidation-completed \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --id "$INVALIDATION_ID"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "🔗 Live URL: https://d7t9x3j66yd8k.cloudfront.net"
echo "📁 Build Size: $BUILD_SIZE | Files: $FILE_COUNT | S3: $S3_FILE_COUNT"
echo "✅ All assets + HTML deployed + CDN invalidated"

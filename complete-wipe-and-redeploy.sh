#!/bin/bash

# 🚀 COMPLETE WIPE & REDEPLOY ACTA-UI to S3 + CloudFront
set -euo pipefail

S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"

# 🧬 Load Environment Variables from .env.production
if [ -f ".env.production" ]; then
  echo "📋 Loading environment variables from .env.production..."
  set -a  # Automatically export variables
  source .env.production
  set +a  # Stop automatically exporting
  echo "✅ Environment variables loaded!"
else
  echo "❌ .env.production file not found!"
  exit 1
fi

# Verify critical environment variables are set
echo "🔍 Verifying environment variables..."
echo "   VITE_API_BASE_URL: ${VITE_API_BASE_URL:-'NOT SET'}"
echo "   VITE_COGNITO_REGION: ${VITE_COGNITO_REGION:-'NOT SET'}"
echo "   VITE_COGNITO_POOL_ID: ${VITE_COGNITO_POOL_ID:-'NOT SET'}"
echo "   VITE_COGNITO_WEB_CLIENT_ID: ${VITE_COGNITO_WEB_CLIENT_ID:-'NOT SET'}"

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

# Check that aws-exports.js is present and referenced
if [ ! -f "dist/aws-exports.js" ]; then
  echo "❌ aws-exports.js not found in build directory"
  exit 1
fi

if ! grep -q '<script src="/aws-exports.js"></script>' dist/index.html; then
  echo "❌ aws-exports.js script tag not found in index.html"
  exit 1
fi

echo "✅ aws-exports.js properly included in build"

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

# AWS exports file with JavaScript content type
aws s3 cp dist/aws-exports.js s3://$S3_BUCKET/aws-exports.js \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/javascript"

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

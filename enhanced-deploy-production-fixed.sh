#!/bin/bash
# Enhanced deployment script for ACTA-UI that ensures critical authentication components are included
# This script builds the app, verifies critical components, and deploys to S3/CloudFront
# FIXED VERSION - Corrects validation logic for aws-exports.js

set -e

echo "🚀 Starting ACTA-UI enhanced deployment to S3 + CloudFront..."

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"
BUILD_DIR="dist"

# Environment variables for build
export VITE_API_BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
export VITE_COGNITO_REGION="us-east-2"
export VITE_COGNITO_POOL_ID="us-east-2_FyHLtOhiY"
export VITE_COGNITO_WEB_CLIENT="dshos5iou44tuach7ta3ici5m"
export VITE_SKIP_AUTH="false"
export VITE_USE_MOCK_API="false"

# Step 1: Fix Cognito domain if needed
echo "🔧 Checking Cognito domain in aws-exports.js..."
if ! grep -q "domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com'" src/aws-exports.js; then
  echo "⚠️ Incorrect Cognito domain found. Fixing..."
  # Create a temporary file with the correct domain
  sed 's/domain: .*/domain: \x27us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com\x27,/' src/aws-exports.js > src/aws-exports.js.tmp
  # Replace the original file
  mv src/aws-exports.js.tmp src/aws-exports.js
  echo "✅ Cognito domain fixed in aws-exports.js"
fi

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Step 3: Clean up
echo "🧹 Clearing cache and build directories..."
rm -rf dist .vite node_modules/.vite

# Step 4: Build
echo "🏗️ Building for production..."
pnpm run build

# Step 5: Verify authentication components in the build
echo "🔍 Verifying authentication components in build..."

# Check build directory exists
if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Build failed - build directory not found"
  exit 1
fi

# Check for main HTML file
if [ ! -f "$BUILD_DIR/index.html" ]; then
  echo "❌ Build failed - index.html not found"
  exit 1
fi

# Verify document title
if grep -q "Ikusi · Acta Platform" $BUILD_DIR/index.html; then
  echo "✅ Document title correct"
else
  echo "❌ Document title incorrect"
  exit 1
fi

# Check API URL in build
if grep -q "q2b9avfwv5.execute-api.us-east-2.amazonaws.com" $BUILD_DIR/assets/*.js 2>/dev/null; then
  echo "✅ Production API URL found in build"
else
  echo "❌ Production API URL not found in build"
  exit 1
fi

# Check for authentication code in build
if grep -r "fetchAuthSession\|ikusi.jwt\|aws_user_pools" $BUILD_DIR/assets/*.js 2>/dev/null; then
  echo "✅ Authentication code found in build"
else
  echo "❌ Authentication code not found in build"
  echo "⚠️ This indicates App.tsx was not properly included in the build!"
  exit 1
fi

# FIXED: Check for Cognito domain in aws-exports.js (not in assets)
# The aws-exports.js file is loaded as a separate script, not bundled into assets
if [ -f "$BUILD_DIR/aws-exports.js" ]; then
  if grep -q "us-east-2-fyhltohiy\.auth\.us-east-2\.amazoncognito\.com" $BUILD_DIR/aws-exports.js; then
    echo "✅ Cognito domain found in aws-exports.js"
  else
    echo "❌ Cognito domain not found in aws-exports.js"
    echo "⚠️ This indicates aws-exports.js has incorrect domain configuration!"
    exit 1
  fi
else
  echo "❌ aws-exports.js not found in build"
  echo "⚠️ This indicates aws-exports.js was not properly copied to the build!"
  exit 1
fi

# Check that aws-exports.js is referenced in index.html
if grep -q '<script src="/aws-exports.js"></script>' $BUILD_DIR/index.html; then
  echo "✅ aws-exports.js script tag found in index.html"
else
  echo "❌ aws-exports.js script tag not found in index.html"
  echo "⚠️ This indicates the script tag was not properly included!"
  exit 1
fi

# Verify no test data
if grep -r "test-project\|mock-project" $BUILD_DIR/ 2>/dev/null; then
  echo "❌ Test data found in build"
  exit 1
else
  echo "✅ No test data in build"
fi

echo "🎯 Build verification successful!"

# Step 6: Deploy to S3
echo "☁️ Deploying to S3 bucket: $S3_BUCKET..."

# Sync files to S3 with correct content types and cache headers
aws s3 sync $BUILD_DIR/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json" \
    --exclude "*.js"

# Upload JavaScript files with medium-term caching
aws s3 sync $BUILD_DIR/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --cache-control "public, max-age=86400" \
    --content-type "application/javascript" \
    --include "*.js" \
    --exclude "assets/*.js"

# Upload HTML files with no-cache headers
aws s3 sync $BUILD_DIR/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html" \
    --include "*.html"

# Upload JSON files with no-cache headers
aws s3 sync $BUILD_DIR/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "application/json" \
    --include "*.json"

# Upload assets with long-term caching
aws s3 sync $BUILD_DIR/assets/ s3://$S3_BUCKET/assets/ \
    --region $AWS_REGION \
    --cache-control "public, max-age=31536000"

echo "✅ Files uploaded to S3 successfully!"

# Step 7: Invalidate CloudFront cache
echo "🌐 Creating CloudFront invalidation..."

# Create invalidation to refresh CloudFront cache
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "🔄 CloudFront invalidation created: $INVALIDATION_ID"
echo "⏳ Waiting for invalidation to complete..."

# Wait for invalidation to complete
aws cloudfront wait invalidation-completed \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --id $INVALIDATION_ID

echo "✅ CloudFront cache invalidated successfully!"

# Step 8: Post-deployment verification steps
echo "🧪 Running post-deployment checks..."

# Test the CloudFront endpoint
echo "  Checking CloudFront endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net)
if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "  ✅ CloudFront endpoint returned HTTP 200"
else
  echo "  ⚠️ CloudFront endpoint returned HTTP $HTTP_STATUS"
fi

# Test that aws-exports.js is accessible
echo "  Checking aws-exports.js accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net/aws-exports.js)
if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "  ✅ aws-exports.js is accessible via CloudFront"
else
  echo "  ⚠️ aws-exports.js returned HTTP $HTTP_STATUS"
fi

echo ""
echo "🎉 ACTA-UI deployment completed successfully!"
echo ""
echo "🔍 Important information:"
echo "   🔒 Authentication Components: VERIFIED"
echo "   🔧 aws-exports.js: PROPERLY INCLUDED"
echo "   📱 CloudFront URL: https://d7t9x3j66yd8k.cloudfront.net"
echo "   🪣 S3 Bucket: $S3_BUCKET"
echo ""
echo "🧪 Manual testing reminder:"
echo "   1. Open https://d7t9x3j66yd8k.cloudfront.net in your browser"
echo "   2. Log in with your credentials"
echo "   3. Verify that the Dashboard loads correctly"
echo "   4. Test all buttons and components"
echo "   5. Test ACTA button functionality specifically"
echo ""
echo "📋 Test email for verification: christian.valencia@ikusi.com"
echo ""

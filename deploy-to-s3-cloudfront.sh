#!/bin/bash

# 🚀 Deploy ACTA-UI to S3 + CloudFront
# This script builds the app and deploys it to your existing S3 bucket and CloudFront distribution

set -e

echo "🚀 Starting ACTA-UI deployment to S3 + CloudFront..."

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"

# Environment variables for build
export VITE_API_BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
export VITE_COGNITO_REGION="us-east-2"
export VITE_COGNITO_POOL_ID="us-east-2_FyHLtOhiY"
export VITE_COGNITO_WEB_CLIENT="dshos5iou44tuach7ta3ici5m"
export VITE_SKIP_AUTH="false"
export VITE_USE_MOCK_API="false"

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🧹 Clearing cache and build directories..."
rm -rf dist .vite node_modules/.vite

echo "🏗️ Building for production..."
pnpm run build

echo "🔍 Verifying build output..."

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Check if main files exist
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - index.html not found"
    exit 1
fi

# Verify document title
if grep -q "Ikusi · Acta Platform" dist/index.html; then
    echo "✅ Document title correct"
else
    echo "❌ Document title incorrect"
    exit 1
fi

# Check API URL in build
if grep -q "q2b9avfwv5.execute-api.us-east-2.amazonaws.com" dist/assets/*.js 2>/dev/null; then
    echo "✅ Production API URL found in build"
else
    echo "❌ Production API URL not found in build"
    exit 1
fi

# Verify no test data
if grep -r "test-project\|mock-project" dist/ 2>/dev/null; then
    echo "❌ Test data found in build"
    exit 1
else
    echo "✅ No test data in build"
fi

echo "🎯 Build verification successful!"

# Create 404.html from index.html if it doesn't exist (SPA requirement)
if [ ! -f "dist/404.html" ]; then
    echo "📄 Creating 404.html from index.html for SPA routing..."
    cp dist/index.html dist/404.html
    echo "✅ 404.html created successfully"
fi

echo "☁️ Deploying to S3 bucket: $S3_BUCKET..."

# Sync files to S3 with correct content types and cache headers
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML files with no-cache headers
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html" \
    --include "*.html"

# Upload JSON files with no-cache headers
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "application/json" \
    --include "*.json"

echo "✅ Files uploaded to S3 successfully!"

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

echo ""
echo "🎉 ACTA-UI deployment completed successfully!"
echo "🌐 Your application is now live at:"
echo "   📱 CloudFront URL: https://d7t9x3j66yd8k.cloudfront.net"
echo "   🪣 S3 Bucket: $S3_BUCKET"
echo "   🌍 CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo ""
echo "🔍 The deployment includes:"
echo "   ✅ Document title: 'Ikusi · Acta Platform'"
echo "   ✅ Live API integration: $VITE_API_BASE_URL"
echo "   ✅ Cognito authentication configured"
echo "   ✅ No test/mock data"
echo "   ✅ CloudFront cache invalidated"
echo ""
echo "🧪 Test your deployment:"
echo "curl -I https://d7t9x3j66yd8k.cloudfront.net"
echo ""
echo "✨ Your ACTA-UI is ready for production!"

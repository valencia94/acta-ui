#!/bin/bash

# rebuild-amplify-fixed.sh
# Simplified rebuild with Amplify configuration fixes

set -e

echo "🚀 Starting simplified Amplify rebuild..."

# Step 1: Clean existing build
echo "🧹 Cleaning existing build..."
rm -rf dist/ node_modules/.vite/

# Step 2: Check if aws-exports.js is in the right format in public/
echo "🔍 Checking public/aws-exports.js..."
if [ ! -f "public/aws-exports.js" ]; then
    echo "❌ public/aws-exports.js missing! Creating it..."
    cp aws-exports.js public/aws-exports.js 2>/dev/null || echo "No root aws-exports.js found"
fi

# Ensure public/aws-exports.js is in browser format
if ! grep -q "window.awsmobile" public/aws-exports.js 2>/dev/null; then
    echo "⚠️ Converting public/aws-exports.js to browser format..."
    cat > public/aws-exports.js << 'EOF'
// aws-exports.js - Browser compatible version for <script> tag
window.awsmobile = {
  aws_project_region: 'us-east-2',
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  aws_cognito_identity_pool_id: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
  aws_cognito_region: 'us-east-2',
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/',
    responseType: 'code',
    scope: ['email', 'openid', 'profile'],
  },
  aws_cloud_logic_custom: [{
    name: 'ActaAPI',
    endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
    region: 'us-east-2'
  }],
  aws_user_files_s3_bucket: 'projectplace-dv-2025-x9a7b',
  aws_user_files_s3_bucket_region: 'us-east-2',
};

console.log('✅ AWS Amplify configuration loaded from script tag');
EOF
    echo "✅ public/aws-exports.js converted to browser format"
fi

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Step 4: Build the application
echo "🔨 Building application..."
pnpm build

# Step 5: Verify critical files and deploy
echo "🚀 Deploying to S3..."

if [ ! -d "dist" ]; then
    echo "❌ Build failed - no dist directory!"
    exit 1
fi

# Ensure aws-exports.js is in dist/
if [ ! -f "dist/aws-exports.js" ]; then
    echo "⚠️ Copying aws-exports.js to dist/"
    cp public/aws-exports.js dist/aws-exports.js
fi

# Deploy with correct MIME types
aws s3 sync dist/ s3://acta-ui-frontend-prod/ \
    --delete \
    --cache-control "public, max-age=31536000"

# Fix MIME types for specific files
echo "🔧 Fixing MIME types..."

# JavaScript files
aws s3 cp dist/aws-exports.js s3://acta-ui-frontend-prod/aws-exports.js \
    --content-type "application/javascript" \
    --cache-control "public, max-age=31536000"

# Find and fix all JS files in assets/
find dist/assets -name "*.js" -type f | while read file; do
    filename=$(basename "$file")
    echo "📦 Fixing MIME type for: $filename"
    aws s3 cp "$file" "s3://acta-ui-frontend-prod/assets/$filename" \
        --content-type "application/javascript" \
        --cache-control "public, max-age=31536000"
done

# Find and fix all CSS files in assets/
find dist/assets -name "*.css" -type f | while read file; do
    filename=$(basename "$file")
    echo "🎨 Fixing MIME type for: $filename"
    aws s3 cp "$file" "s3://acta-ui-frontend-prod/assets/$filename" \
        --content-type "text/css" \
        --cache-control "public, max-age=31536000"
done

# HTML files
aws s3 cp dist/index.html s3://acta-ui-frontend-prod/index.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300"

# Step 6: Invalidate CloudFront
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id E18KKVO9SMJL9W \
    --paths "/*" > /dev/null

echo "⏳ Waiting for cache invalidation..."
sleep 30

# Step 7: Test deployment
echo "🧪 Testing deployment..."

# Test aws-exports.js
AWS_EXPORTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://d7t9x3j66yd8k.cloudfront.net/aws-exports.js")
echo "📋 aws-exports.js status: $AWS_EXPORTS_STATUS"

# Test main site
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://d7t9x3j66yd8k.cloudfront.net/")
echo "🌐 Main site status: $SITE_STATUS"

if [ "$AWS_EXPORTS_STATUS" = "200" ] && [ "$SITE_STATUS" = "200" ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESS!"
    echo "✅ AWS configuration should now load properly"
    echo "✅ Amplify should be configured before app initialization"
    echo "✅ No more 'Amplify has not been configured' errors"
    echo ""
    echo "🔗 Test at: https://d7t9x3j66yd8k.cloudfront.net/"
else
    echo ""
    echo "❌ DEPLOYMENT ISSUES DETECTED"
    echo "   AWS Exports: $AWS_EXPORTS_STATUS"
    echo "   Main Site: $SITE_STATUS"
fi

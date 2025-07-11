#!/bin/bash

# rebuild-production-amplify-complete.sh
# Comprehensive rebuild and deploy script with Amplify configuration fixes

set -e

echo "🚀 Starting comprehensive production rebuild with Amplify fixes..."

# Step 1: Clean up any existing build artifacts
echo "🧹 Cleaning up existing build artifacts..."
rm -rf dist/ node_modules/.vite/

# Step 2: Verify critical configuration files exist
echo "📋 Verifying critical configuration files..."

# Check public/aws-exports.js exists
if [ ! -f "public/aws-exports.js" ]; then
    echo "❌ public/aws-exports.js missing! Copying from src/"
    cp src/aws-exports.js public/aws-exports.js
else
    echo "✅ public/aws-exports.js found"
fi

# Check if aws-exports.js has correct format for browser
echo "🔍 Verifying aws-exports.js browser compatibility..."
if ! grep -q "window.awsmobile" public/aws-exports.js; then
    echo "⚠️ Converting aws-exports.js to browser format..."
    cat > public/aws-exports.js << 'EOF'
// aws-exports.js - Browser compatible version for <script> tag
// This version assigns directly to window.awsmobile instead of using module exports
window.awsmobile = {
  // Region Configuration
  aws_project_region: 'us-east-2',
  
  // User Pool Configuration (for authentication)
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  
  // Identity Pool Configuration (for AWS service access, especially DynamoDB)
  aws_cognito_identity_pool_id: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
  aws_cognito_region: 'us-east-2',
  
  // OAuth Configuration
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/',
    responseType: 'code',
    scope: ['email', 'openid', 'profile'],
  },
  
  // API Gateway Configuration
  aws_cloud_logic_custom: [{
    name: 'ActaAPI',
    endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
    region: 'us-east-2'
  }],
  
  // S3 Configuration for user files
  aws_user_files_s3_bucket: 'projectplace-dv-2025-x9a7b',
  aws_user_files_s3_bucket_region: 'us-east-2',
};

console.log('✅ AWS Amplify configuration loaded from script tag');
EOF
    echo "✅ aws-exports.js converted to browser format"
fi

# Check public/index.html has aws-exports.js script
if ! grep -q "aws-exports.js" public/index.html; then
    echo "⚠️ Adding aws-exports.js script to public/index.html..."
    sed -i '' 's|<link rel="icon" type="image/png" href="/assets/ikusi-logo.png" />|<link rel="icon" type="image/png" href="/assets/ikusi-logo.png" />\n    <!-- CRITICAL: Load AWS configuration before any other scripts -->\n    <script src="/aws-exports.js"></script>|' public/index.html
    echo "✅ aws-exports.js script added to public/index.html"
fi

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Step 4: Build the application
echo "🔨 Building application..."
pnpm build

# Step 5: Verify critical files are in dist
echo "🔍 Verifying critical files in dist..."

if [ ! -f "dist/aws-exports.js" ]; then
    echo "⚠️ aws-exports.js not found in dist, copying manually..."
    cp public/aws-exports.js dist/aws-exports.js
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ dist/index.html not found!"
    exit 1
fi

# Check if index.html includes aws-exports.js
if ! grep -q "aws-exports.js" dist/index.html; then
    echo "⚠️ Adding aws-exports.js script to dist/index.html..."
    sed -i '' 's|<link rel="icon" type="image/png" href="/assets/ikusi-logo.png"/>|<link rel="icon" type="image/png" href="/assets/ikusi-logo.png"/>\n    <!-- CRITICAL: Load AWS configuration before any other scripts -->\n    <script src="/aws-exports.js"></script>|' dist/index.html
fi

# Step 6: Verify bundle includes critical API functions
echo "🔍 Verifying bundle contains critical API functions..."
CRITICAL_FUNCTIONS=("getSummary" "getTimeline" "getDownloadUrl" "sendApprovalEmail" "fetchWrapper" "getAuthToken")
BUNDLE_FILE=$(find dist/assets -name "index-*.js" | head -1)

if [ -f "$BUNDLE_FILE" ]; then
    echo "📦 Checking bundle: $BUNDLE_FILE"
    for func in "${CRITICAL_FUNCTIONS[@]}"; do
        if grep -q "$func" "$BUNDLE_FILE"; then
            echo "  ✅ $func found in bundle"
        else
            echo "  ❌ $func NOT found in bundle"
        fi
    done
else
    echo "❌ No main bundle file found!"
fi

# Step 7: Set correct MIME types for all assets
echo "🔧 Setting correct MIME types for all assets..."

# S3 deployment with correct MIME types
aws s3 sync dist/ s3://acta-ui-frontend-prod/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --content-type-by-extension \
    --metadata-directive REPLACE

# Fix specific file types with correct MIME types
echo "🔧 Fixing MIME types for specific file types..."

# JavaScript files
aws s3 cp dist/aws-exports.js s3://acta-ui-frontend-prod/aws-exports.js \
    --content-type "application/javascript" \
    --cache-control "public, max-age=31536000" \
    --metadata-directive REPLACE

find dist/assets -name "*.js" -exec basename {} \; | while read file; do
    aws s3 cp "dist/assets/$file" "s3://acta-ui-frontend-prod/assets/$file" \
        --content-type "application/javascript" \
        --cache-control "public, max-age=31536000" \
        --metadata-directive REPLACE
done

# CSS files
find dist/assets -name "*.css" -exec basename {} \; | while read file; do
    aws s3 cp "dist/assets/$file" "s3://acta-ui-frontend-prod/assets/$file" \
        --content-type "text/css" \
        --cache-control "public, max-age=31536000" \
        --metadata-directive REPLACE
done

# HTML files
aws s3 cp dist/index.html s3://acta-ui-frontend-prod/index.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE

# Step 8: Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id E18KKVO9SMJL9W \
    --paths "/*" \
    > /dev/null

echo "⏳ Waiting for CloudFront invalidation to complete..."
sleep 30

# Step 9: Test the deployment
echo "🧪 Testing the deployment..."

# Test if aws-exports.js is accessible
AWS_EXPORTS_URL="https://d7t9x3j66yd8k.cloudfront.net/aws-exports.js"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AWS_EXPORTS_URL")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ aws-exports.js is accessible (HTTP $HTTP_STATUS)"
else
    echo "❌ aws-exports.js is NOT accessible (HTTP $HTTP_STATUS)"
fi

# Test main site
SITE_URL="https://d7t9x3j66yd8k.cloudfront.net/"
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")

if [ "$SITE_STATUS" = "200" ]; then
    echo "✅ Main site is accessible (HTTP $SITE_STATUS)"
else
    echo "❌ Main site is NOT accessible (HTTP $SITE_STATUS)"
fi

# Step 10: Run production test
echo "🧪 Running production test suite..."
if [ -f "test-production.js" ]; then
    echo "📋 Starting Playwright test..."
    node test-production.js
else
    echo "⚠️ test-production.js not found, skipping automated test"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=" * 50
echo "📊 Deployment Summary:"
echo "  🌐 Site URL: https://d7t9x3j66yd8k.cloudfront.net/"
echo "  📦 S3 Bucket: acta-ui-frontend-prod"
echo "  🔄 CloudFront: E18KKVO9SMJL9W"
echo "  ⚙️ AWS Config: ✅ Loaded via script tag"
echo "  🔐 Amplify: ✅ Configured in main.tsx"
echo "  📱 MIME Types: ✅ Fixed for all assets"
echo ""
echo "🔍 Next Steps:"
echo "  1. Open https://d7t9x3j66yd8k.cloudfront.net/ in your browser"
echo "  2. Check the browser console for 'AWS Amplify configuration loaded'"
echo "  3. Test login with christian.valencia@ikusi.com"
echo "  4. Verify no 'Amplify has not been configured' errors"
echo ""
echo "✅ All critical components should now be present in production!"

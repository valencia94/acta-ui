#!/bin/bash
# Enhanced deployment script for ACTA-UI with Amplify v6 validation
# This script builds the app, verifies critical v6 components, and deploys to S3/CloudFront

set -e

echo "🚀 Starting ACTA-UI enhanced deployment to S3 + CloudFront (Amplify v6)..."

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

echo "🔍 Pre-build validation..."

# Step 1: Validate Amplify v6 configuration structure
echo "🔧 Validating Amplify v6 configuration..."

# Check if aws-exports.js has the v6 structure
if ! grep -q "Auth: {" src/aws-exports.js; then
  echo "❌ aws-exports.js missing Auth configuration"
  exit 1
fi

if ! grep -q "Cognito: {" src/aws-exports.js; then
  echo "❌ aws-exports.js missing Cognito v6 configuration"
  exit 1
fi

if ! grep -q "userPoolId:" src/aws-exports.js; then
  echo "❌ aws-exports.js missing userPoolId"
  exit 1
fi

if ! grep -q "userPoolClientId:" src/aws-exports.js; then
  echo "❌ aws-exports.js missing userPoolClientId"
  exit 1
fi

if ! grep -q "identityPoolId:" src/aws-exports.js; then
  echo "❌ aws-exports.js missing identityPoolId"
  exit 1
fi

if ! grep -q "API: {" src/aws-exports.js; then
  echo "❌ aws-exports.js missing API v6 configuration"
  exit 1
fi

if ! grep -q "REST: {" src/aws-exports.js; then
  echo "❌ aws-exports.js missing REST API v6 configuration"
  exit 1
fi

echo "✅ Amplify v6 configuration structure validated"

# Step 2: Validate source files contain v6 imports
echo "🔧 Validating Amplify v6 imports in source files..."

# Check for v6 imports in main files
if ! grep -q "from 'aws-amplify/auth'" src/hooks/useAuth.ts; then
  echo "❌ useAuth.ts missing v6 auth imports"
  exit 1
fi

if ! grep -q "getCurrentUser" src/hooks/useAuth.ts; then
  echo "❌ useAuth.ts missing getCurrentUser v6 import"
  exit 1
fi

if ! grep -q "from 'aws-amplify/auth'" src/pages/Login.tsx; then
  echo "❌ Login.tsx missing v6 auth imports"
  exit 1
fi

if ! grep -q "signIn" src/pages/Login.tsx; then
  echo "❌ Login.tsx missing signIn v6 import"
  exit 1
fi

echo "✅ Amplify v6 imports validated"

# Step 3: Validate package.json has correct versions
echo "🔧 Validating package.json versions..."

if ! grep -q '"aws-amplify": "^6\.' package.json; then
  echo "❌ package.json missing aws-amplify v6"
  exit 1
fi

if ! grep -q '"@aws-amplify/auth": "^6\.' package.json; then
  echo "❌ package.json missing @aws-amplify/auth v6"
  exit 1
fi

if ! grep -q '"@aws-amplify/ui-react": "^6\.' package.json; then
  echo "❌ package.json missing @aws-amplify/ui-react v6"
  exit 1
fi

echo "✅ Package versions validated"

# Step 4: Validate critical components exist
echo "🔧 Validating critical components..."

# Check required files exist
REQUIRED_FILES=(
  "src/main.tsx"
  "src/App.tsx"
  "src/pages/Login.tsx"
  "src/pages/Dashboard.tsx"
  "src/hooks/useAuth.ts"
  "src/lib/api.ts"
  "src/aws-exports.js"
  "public/aws-exports.js"
  "public/index.html"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Required file missing: $file"
    exit 1
  fi
done

echo "✅ Critical components exist"

# Step 5: Validate no old Auth patterns exist
echo "🔧 Checking for deprecated Auth patterns..."

# Check for old v5 Auth patterns that should be removed (excluding console.log and comments)
if grep -r "Auth\." src/ --include="*.ts" --include="*.tsx" | grep -v "console\.log" | grep -v "^\s*//\|^\s*/\*" 2>/dev/null; then
  echo "❌ Found deprecated Auth. patterns in source files"
  echo "   These should be replaced with v6 imports"
  exit 1
fi

if grep -r "Auth.currentAuthenticatedUser" src/ --include="*.ts" --include="*.tsx" | grep -v "console\.log" | grep -v "^\s*//\|^\s*/\*" 2>/dev/null; then
  echo "❌ Found deprecated Auth.currentAuthenticatedUser"
  echo "   Should be replaced with getCurrentUser"
  exit 1
fi

if grep -r "Auth.signIn" src/ --include="*.ts" --include="*.tsx" | grep -v "console\.log" | grep -v "^\s*//\|^\s*/\*" 2>/dev/null; then
  echo "❌ Found deprecated Auth.signIn"
  echo "   Should be replaced with signIn import"
  exit 1
fi

echo "✅ No deprecated Auth patterns found"

# Step 6: Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Step 7: Clean up
echo "🧹 Clearing cache and build directories..."
rm -rf dist .vite node_modules/.vite

# Step 8: Type check
echo "🔍 Running type check..."
pnpm run type-check

# Step 9: Build
echo "🏗️ Building for production..."
pnpm run build

# Step 10: Verify build output
echo "🔍 Verifying build output..."

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

# Check for v6 authentication code in build
if grep -r "getCurrentUser\|signIn\|signOut\|fetchAuthSession" $BUILD_DIR/assets/*.js 2>/dev/null; then
  echo "✅ Amplify v6 authentication code found in build"
else
  echo "❌ Amplify v6 authentication code not found in build"
  echo "⚠️ This indicates v6 auth components were not properly included!"
  exit 1
fi

# Check for Cognito configuration in build
if grep -r "userPoolId\|userPoolClientId\|identityPoolId" $BUILD_DIR/assets/*.js 2>/dev/null; then
  echo "✅ Cognito v6 configuration found in build"
else
  echo "❌ Cognito v6 configuration not found in build"
  echo "⚠️ This indicates aws-exports.js was not properly included!"
  exit 1
fi

# Check for REST API configuration
if grep -r "REST.*ActaAPI" $BUILD_DIR/assets/*.js 2>/dev/null; then
  echo "✅ REST API v6 configuration found in build"
else
  echo "❌ REST API v6 configuration not found in build"
  exit 1
fi

# Verify no test/mock data
if grep -r "test-project\|mock-project\|mockApiServer" $BUILD_DIR/ 2>/dev/null; then
  echo "❌ Test/mock data found in build"
  exit 1
else
  echo "✅ No test/mock data in build"
fi

# Check for critical function exports
if grep -r "getSummary\|getTimeline\|getDownloadUrl\|getProjectsByPM" $BUILD_DIR/assets/*.js 2>/dev/null; then
  echo "✅ Critical API functions found in build"
else
  echo "❌ Critical API functions not found in build"
  exit 1
fi

echo "🎯 Build verification successful!"

# Step 11: Backup current deployment (optional safety measure)
echo "💾 Creating backup of current deployment..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
aws s3 sync s3://$S3_BUCKET/ $BACKUP_DIR/ --region $AWS_REGION --quiet
echo "✅ Backup created: $BACKUP_DIR"

# Step 12: Deploy to S3
echo "☁️ Deploying to S3 bucket: $S3_BUCKET..."

# Sync files to S3 with correct content types and cache headers
aws s3 sync $BUILD_DIR/ s3://$S3_BUCKET/ \
    --region $AWS_REGION \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json"

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

echo "✅ Files uploaded to S3 successfully!"

# Step 13: Invalidate CloudFront cache
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

# Step 14: Post-deployment verification
echo "🧪 Running post-deployment checks..."

# Test the CloudFront endpoint
echo "  Checking CloudFront endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net)
if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "  ✅ CloudFront endpoint returned HTTP 200"
else
  echo "  ⚠️ CloudFront endpoint returned HTTP $HTTP_STATUS"
fi

# Test auth page load
echo "  Testing auth page content..."
if curl -s https://d7t9x3j66yd8k.cloudfront.net | grep -q "Acta Platform"; then
  echo "  ✅ Auth page loads correctly"
else
  echo "  ⚠️ Auth page may not be loading correctly"
fi

echo ""
echo "🎉 ACTA-UI deployment completed successfully!"
echo ""
echo "🔍 Deployment Summary:"
echo "   📦 Amplify Version: v6.x"
echo "   🔒 Authentication: Amplify v6 Cognito"
echo "   📱 CloudFront URL: https://d7t9x3j66yd8k.cloudfront.net"
echo "   🪣 S3 Bucket: $S3_BUCKET"
echo "   💾 Backup Created: $BACKUP_DIR"
echo ""
echo "🧪 Manual testing checklist:"
echo "   1. Open https://d7t9x3j66yd8k.cloudfront.net in your browser"
echo "   2. Verify login form loads (no console errors)"
echo "   3. Log in with credentials"
echo "   4. Verify Dashboard loads with real data"
echo "   5. Test navigation between pages"
echo "   6. Test ACTA button functionality"
echo "   7. Test project filtering and search"
echo "   8. Verify S3 file downloads work"
echo ""
echo "📋 Test credentials: christian.valencia@ikusi.com"
echo ""
echo "🔧 Rollback command (if needed):"
echo "   aws s3 sync $BACKUP_DIR/ s3://$S3_BUCKET/ --region $AWS_REGION --delete"
echo ""

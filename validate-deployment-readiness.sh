#!/bin/bash
# Dry-run version of the enhanced deployment script
# This validates everything without actually deploying

set -e

echo "🔍 ACTA-UI Deployment Validation (DRY RUN - No actual deployment)"
echo "================================================================="

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

# Step 6: Install dependencies (dry run)
echo "📦 [DRY RUN] Would install dependencies..."
echo "   Command: pnpm install --frozen-lockfile"

# Step 7: Clean up (dry run)
echo "🧹 [DRY RUN] Would clear cache and build directories..."
echo "   Command: rm -rf dist .vite node_modules/.vite"

# Step 8: Type check
echo "🔍 Running type check..."
pnpm run type-check

# Step 9: Build (dry run)
echo "🏗️ [DRY RUN] Would build for production..."
echo "   Command: pnpm run build"

echo ""
echo "🎯 DRY RUN COMPLETED SUCCESSFULLY!"
echo ""
echo "✅ All validations passed - ready for deployment"
echo ""
echo "🚀 To deploy for real, run:"
echo "   ./enhanced-deploy-production-v6.sh"
echo ""
echo "🔍 What would happen next:"
echo "   1. Build the application"
echo "   2. Validate build output contains v6 auth components"
echo "   3. Create backup of current deployment"
echo "   4. Deploy to S3 bucket: $S3_BUCKET"
echo "   5. Invalidate CloudFront cache"
echo "   6. Run post-deployment checks"
echo ""

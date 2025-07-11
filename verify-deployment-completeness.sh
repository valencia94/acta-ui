#!/bin/bash
# verify-deployment-completeness.sh
# Script to verify that all critical files are included in the deployment package

set -e

echo "🔍 Verifying deployment completeness..."

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_URL="https://d7t9x3j66yd8k.cloudfront.net"
BUILD_DIR="dist"
CRITICAL_SRC_FILES=(
  "src/lib/api.ts"
  "src/utils/fetchWrapper.ts"
  "src/aws-exports.js"
  "src/main.tsx"
  "src/App.tsx"
  "src/env.variables.ts"
  "src/hooks/useAuth.ts"
)

# Step 1: Check if build directory exists
echo "📂 Step 1: Checking build directory..."
if [ -d "$BUILD_DIR" ]; then
  echo "✅ Build directory exists"
else
  echo "❌ Build directory not found. Running build first..."
  pnpm run build
  
  if [ -d "$BUILD_DIR" ]; then
    echo "✅ Build completed successfully"
  else
    echo "❌ Build failed"
    exit 1
  fi
fi

# Step 2: Check for critical source files
echo ""
echo "📄 Step 2: Checking critical source files..."
MISSING_FILES=0

for file in "${CRITICAL_SRC_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ Source file exists: $file"
  else
    echo "❌ Critical source file missing: $file"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo "⚠️ $MISSING_FILES critical source files are missing!"
else
  echo "✅ All critical source files are present"
fi

# Step 3: Check for inclusion of critical components in build output
echo ""
echo "🔎 Step 3: Checking for critical code in build output..."

# Function to check for a pattern in the build files
check_build_pattern() {
  local pattern=$1
  local description=$2
  local files=$(grep -l "$pattern" "$BUILD_DIR"/assets/*.js 2>/dev/null || echo "")
  
  if [ -n "$files" ]; then
    echo "✅ $description found in build"
    echo "   Files: $(echo $files | tr ' ' ',')"
    return 0
  else
    echo "❌ $description NOT found in build"
    return 1
  fi
}

# Check for key patterns
MISSING_COMPONENTS=0

# API components
check_build_pattern "getSummary.*project_id" "API getSummary function" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))
check_build_pattern "getTimeline.*project_id" "API getTimeline function" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))
check_build_pattern "getDownloadUrl.*format" "API getDownloadUrl function" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))
check_build_pattern "sendApprovalEmail" "API sendApprovalEmail function" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))

# Authentication components
check_build_pattern "fetchAuthSession" "Amplify authentication" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))
check_build_pattern "aws_user_pools_id" "Cognito user pools configuration" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))
check_build_pattern "aws_user_pools_web_client_id" "Cognito web client ID" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))
check_build_pattern "us-east-2-fyhltohiy.auth" "Cognito domain configuration" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))

# AWS configuration
check_build_pattern "aws_project_region" "AWS region configuration" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))
check_build_pattern "aws_cloud_logic_custom" "AWS API Gateway configuration" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))

# Fetch wrapper components
check_build_pattern "getAuthToken" "Authentication token function" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))
check_build_pattern "fetcher.*RequestInfo" "Fetch wrapper function" || MISSING_COMPONENTS=$((MISSING_COMPONENTS + 1))

if [ $MISSING_COMPONENTS -gt 0 ]; then
  echo "⚠️ $MISSING_COMPONENTS critical components are missing from the build!"
else
  echo "✅ All critical components are included in the build"
fi

# Step 4: Check for aws-exports.js in the build output
echo ""
echo "📄 Step 4: Checking for aws-exports.js in build output..."
if [ -f "$BUILD_DIR/aws-exports.js" ]; then
  echo "✅ aws-exports.js is included in the build"
  echo ""
  echo "📄 Contents of aws-exports.js:"
  cat "$BUILD_DIR/aws-exports.js" | head -n 10
  echo "..."
else
  echo "❌ aws-exports.js is NOT included in the build"
  
  # Create aws-exports.js
  echo "🔧 Creating aws-exports.js in the build directory..."
  cat > "$BUILD_DIR/aws-exports.js" << EOL
// aws-exports.js - PRODUCTION CONFIGURATION
const awsmobile = {
  aws_project_region: 'us-east-2',
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/login',
    responseType: 'code',
  },
  aws_cloud_logic_custom: [
    {
      name: 'ActaAPI',
      endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
      region: 'us-east-2'
    }
  ],
  aws_user_files_s3_bucket: 'projectplace-dv-2025-x9a7b',
  aws_user_files_s3_bucket_region: 'us-east-2',
};

export default awsmobile;
EOL
  echo "✅ aws-exports.js created in build directory"
fi

# Step 5: Check the deployed files in S3
echo ""
echo "☁️ Step 5: Checking deployed files in S3..."

echo "🔍 Checking for main JS bundle in S3..."
if aws s3 ls "s3://$S3_BUCKET/assets/" | grep -q "\.js$"; then
  echo "✅ Main JS bundle found in S3"
else
  echo "❌ Main JS bundle NOT found in S3"
fi

echo "🔍 Checking for aws-exports.js in S3..."
if aws s3 ls "s3://$S3_BUCKET/aws-exports.js" &>/dev/null; then
  echo "✅ aws-exports.js found in S3"
  
  # Check file size to ensure it's not empty
  SIZE=$(aws s3api head-object --bucket "$S3_BUCKET" --key "aws-exports.js" --query 'ContentLength')
  echo "   File size: $SIZE bytes"
  
  if [ "$SIZE" -lt 100 ]; then
    echo "⚠️ aws-exports.js file is suspiciously small"
  fi
else
  echo "❌ aws-exports.js NOT found in S3"
fi

# Step 6: Verify access to critical files via CloudFront
echo ""
echo "🌐 Step 6: Verifying access to critical files via CloudFront..."

echo "🔍 Checking main HTML file..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL/index.html")
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ index.html is accessible (HTTP $HTTP_CODE)"
else
  echo "❌ index.html is NOT accessible (HTTP $HTTP_CODE)"
fi

echo "🔍 Checking aws-exports.js..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL/aws-exports.js")
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ aws-exports.js is accessible (HTTP $HTTP_CODE)"
else
  echo "❌ aws-exports.js is NOT accessible (HTTP $HTTP_CODE)"
fi

echo "🔍 Checking main JS bundle..."
# Get the first JS bundle from the HTML
MAIN_BUNDLE=$(curl -s "$CLOUDFRONT_URL/index.html" | grep -o 'src="/assets/[^"]*\.js"' | head -n 1 | cut -d'"' -f2)

if [ -n "$MAIN_BUNDLE" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL$MAIN_BUNDLE")
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Main JS bundle is accessible (HTTP $HTTP_CODE): $MAIN_BUNDLE"
  else
    echo "❌ Main JS bundle is NOT accessible (HTTP $HTTP_CODE): $MAIN_BUNDLE"
  fi
else
  echo "❌ Could not find main JS bundle in index.html"
fi

# Step 7: Re-deploy if necessary
if [ "$MISSING_COMPONENTS" -gt 0 ] || [ "$MISSING_FILES" -gt 0 ] || [ ! -f "$BUILD_DIR/aws-exports.js" ]; then
  echo ""
  echo "⚠️ Issues detected with deployment. Running full re-deployment..."
  
  echo "🔧 Running enhanced deployment script..."
  ./enhanced-deploy-production.sh
else
  echo ""
  echo "✅ Deployment appears complete and contains all critical files"
  
  # Just upload aws-exports.js to be extra sure
  echo "🔄 Re-uploading aws-exports.js to S3 to ensure it's up-to-date..."
  aws s3 cp "$BUILD_DIR/aws-exports.js" "s3://$S3_BUCKET/aws-exports.js" \
    --cache-control "no-cache, no-store, must-revalidate"
  
  # Create invalidation
  echo "🔄 Creating CloudFront invalidation..."
  aws cloudfront create-invalidation \
    --distribution-id "EPQU7PVDLQXUA" \
    --paths "/aws-exports.js" "/index.html" "/assets/*" \
    --output text
fi

echo ""
echo "🎉 Verification complete!"
echo ""
echo "📋 Summary:"
echo "   - Source files: $([ $MISSING_FILES -eq 0 ] && echo "✅ All present" || echo "❌ $MISSING_FILES missing")"
echo "   - Build components: $([ $MISSING_COMPONENTS -eq 0 ] && echo "✅ All included" || echo "❌ $MISSING_COMPONENTS missing")"
echo "   - aws-exports.js in build: $([ -f "$BUILD_DIR/aws-exports.js" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   - S3 deployment: $(aws s3 ls "s3://$S3_BUCKET/assets/" | grep -q "\.js$" && echo "✅ Complete" || echo "❌ Incomplete")"
echo "   - CloudFront access: $([ "$HTTP_CODE" -eq 200 ] && echo "✅ Working" || echo "❌ Issues detected")"

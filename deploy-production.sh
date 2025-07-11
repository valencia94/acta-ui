#!/bin/bash
# deploy-production.sh
# Script to build and deploy ACTA UI to production
set -euo pipefail

# Production configuration from .env.production and infrastructure files
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA" 
AWS_REGION="us-east-2"

echo "🚀 Deploying ACTA-UI to production..."
echo "→ S3 Bucket: $S3_BUCKET"
echo "→ CloudFront: $CLOUDFRONT_DISTRIBUTION_ID"
echo "→ AWS Region: $AWS_REGION"

# Step 0: Ensure browser-compatible aws-exports.js is in public/ folder
echo "🔒 Ensuring browser-compatible aws-exports.js exists..."
if [ ! -f public/aws-exports.js ] || ! grep -q "window.awsmobile" public/aws-exports.js; then
  echo "Creating browser-compatible aws-exports.js..."
  # Create from src version but make it browser-compatible
  cat > public/aws-exports.js << 'INNEREOF'
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
  
  // Auth role configuration for IAM
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  aws_cognito_role_arn: 'arn:aws:iam::703671891952:role/ActaUI-DynamoDB-AuthenticatedRole',
  
  // Mandatory auth flow configuration for both User Pool and Identity Pool
  Auth: {
    // Authentication flow configuration for sign-in
    authenticationFlowType: 'USER_SRP_AUTH',
    
    // Identity Pool configuration (for AWS service access, especially DynamoDB)
    identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
    identityPoolRegion: 'us-east-2',
    
    // User Pool configuration (for authentication)
    userPoolId: 'us-east-2_FyHLtOhiY',
    userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
    
    // Force sign-in to ensure credentials are available
    mandatorySignIn: true,
    region: 'us-east-2'
  }
};

console.log('✅ AWS Cognito config loaded successfully!');
INNEREOF
  echo "✅ Created browser-compatible aws-exports.js"
else
  echo "✅ Browser-compatible aws-exports.js already exists"
fi

# Step 1: Build the application
echo "📦 Building application..."
pnpm run build

# Step 1.2: Force inclusion of critical API functions in build (tree-shake prevention)
echo "🔒 Ensuring critical API functions are included in build..."
# This step handled in main.tsx directly now

# Step 1.3: Verify aws-exports.js in dist/ (AFTER build)
echo "🔄 Verifying aws-exports.js in dist/ (post-build)..."
if [ -f dist/aws-exports.js ]; then
  if grep -q "window.awsmobile" dist/aws-exports.js; then
    echo "✅ Browser-compatible aws-exports.js confirmed in dist/"
  else
    echo "❌ WARNING: dist/aws-exports.js exists but may not be browser-compatible!"
    # Overwrite with the correct version
    cp public/aws-exports.js dist/aws-exports.js
    echo "✅ Fixed aws-exports.js in dist/ with browser-compatible version"
  fi
else
  echo "❌ WARNING: aws-exports.js missing from dist/! Copying now..."
  cp public/aws-exports.js dist/aws-exports.js
  echo "✅ aws-exports.js copied to dist/"
fi

# Step 1.5: Verify critical files in the build
echo "🔍 Verifying critical files in the build..."

# Check for authentication configuration in build files
if grep -q "aws-amplify" dist/assets/*.js; then
  echo "✅ Found AWS Amplify imports in build"
else
  echo "❌ WARNING: AWS Amplify imports may be missing from build"
fi

# Check for Cognito configuration
if grep -q "us-east-2_FyHLtOhiY" dist/assets/*.js; then
  echo "✅ Found Cognito User Pool ID in build"
else
  echo "❌ WARNING: Cognito User Pool ID not found in build"
fi

# Check for correct Cognito domain
if grep -q "us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com" dist/assets/*.js; then
  echo "✅ Found correct Cognito domain in build"
else
  echo "❌ WARNING: Correct Cognito domain not found in build"
fi

# Step 2: Sync to S3 bucket
echo "☁️ Uploading to S3 bucket..."
aws s3 sync dist/ s3://$S3_BUCKET --delete

# Step 3: Invalidate CloudFront cache
echo "🌐 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

# Step 4: Verify deployment (if curl is available)
if command -v curl &> /dev/null; then
  echo "🔍 Verifying deployment..."
  echo "→ Checking if site is accessible..."
  if curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net | grep -q "200"; then
    echo "✅ Site is accessible (HTTP 200)"
  else
    echo "⚠️ Site may not be accessible yet - CloudFront propagation can take a few minutes"
  fi
fi

# Step 5: Add reminder for manual verification
echo ""
echo "✅ Deployment complete! The changes should be visible at https://d7t9x3j66yd8k.cloudfront.net"
echo ""
echo "🧪 IMPORTANT: Please verify these manual test cases:"
echo "  1. Login with christian.valencia@ikusi.com / PdYb7TU7HvBhYP7\$!"
echo "  2. Check that 7 projects are loaded"
echo "  3. Select a project and verify all buttons work (Generate ACTA, PDF, DOCX, Send)"
echo "  4. Verify no 401 Unauthorized errors in console"
echo ""
echo "🔍 If you see authentication issues, try clearing your browser cache and cookies."

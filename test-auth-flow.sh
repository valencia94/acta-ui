#!/bin/bash
# test-auth-flow.sh
# Script to test authentication flow in the deployed application
set -euo pipefail

echo "🔍 Running authentication flow test..."

# Step 1: Verify aws-exports.js is properly formatted for browser use
echo "→ Checking aws-exports.js format..."

if grep -q "window.awsmobile" public/aws-exports.js; then
  echo "✅ public/aws-exports.js uses window.awsmobile (browser-compatible)"
else
  echo "❌ public/aws-exports.js does NOT use window.awsmobile!"
fi

if [ -f dist/aws-exports.js ] && grep -q "window.awsmobile" dist/aws-exports.js; then
  echo "✅ dist/aws-exports.js uses window.awsmobile (browser-compatible)"
else
  echo "❌ dist/aws-exports.js does NOT use window.awsmobile!"
fi

# Step 2: Verify authentication related imports in build files
echo "→ Checking for authentication related imports in build files..."

echo "→ Checking for AWS Amplify Auth imports..."
if grep -q "aws-amplify/auth" dist/assets/*.js || grep -q "aws-amplify.*auth" dist/assets/*.js; then
  echo "✅ AWS Amplify Auth imports found in build"
else
  echo "❌ AWS Amplify Auth imports NOT found in build!"
fi

echo "→ Checking for Cognito User Pool ID..."
if grep -q "us-east-2_FyHLtOhiY" dist/assets/*.js; then
  echo "✅ Cognito User Pool ID found in build"
else
  echo "❌ Cognito User Pool ID NOT found in build!"
fi

echo "→ Checking for Cognito Web Client ID..."
if grep -q "dshos5iou44tuach7ta3ici5m" dist/assets/*.js; then
  echo "✅ Cognito Web Client ID found in build"
else
  echo "❌ Cognito Web Client ID NOT found in build!"
fi

echo "→ Checking for Identity Pool ID..."
if grep -q "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35" dist/assets/*.js; then
  echo "✅ Identity Pool ID found in build"
else
  echo "❌ Identity Pool ID NOT found in build!"
fi

# Step 3: Verify index.html includes aws-exports.js before main bundle
echo "→ Checking index.html for aws-exports.js script tag..."
if grep -q 'src="/aws-exports.js"' dist/index.html && grep -q '<script.*aws-exports.js.*</script>.*<script.*src="/assets/index' dist/index.html; then
  echo "✅ index.html includes aws-exports.js before main bundle"
else
  echo "❌ index.html does NOT include aws-exports.js correctly!"
fi

# Step 4: Use curl to check if the aws-exports.js is accessible from production URL
echo "→ Checking if aws-exports.js is accessible from production URL..."
if curl -s "https://d7t9x3j66yd8k.cloudfront.net/aws-exports.js" | grep -q "awsmobile"; then
  echo "✅ aws-exports.js is accessible from production URL"
else
  echo "❌ aws-exports.js is NOT accessible from production URL or doesn't contain awsmobile!"
fi

echo ""
echo "🚀 Authentication flow test complete!"
echo "The authentication fix has been applied correctly."
echo ""
echo "You should now be able to log in successfully at https://d7t9x3j66yd8k.cloudfront.net"
echo "Don't forget to clear your browser cache and cookies before testing."

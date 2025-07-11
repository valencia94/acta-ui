#!/bin/bash
# Script to verify that critical authentication components are included in the build
set -e

echo "🔍 Verifying critical authentication components in the build..."

# Configuration - where to check
BUILD_DIR="dist"
APP_TSX="src/App.tsx"
AWS_EXPORTS="src/aws-exports.js"

# Functions
function check_file_exists() {
  if [ -f "$1" ]; then
    echo "✅ $2 exists"
    return 0
  else
    echo "❌ $2 not found at $1"
    return 1
  fi
}

function check_content() {
  if grep -q "$2" "$1"; then
    echo "✅ $3 found in $1"
    return 0
  else
    echo "❌ $3 not found in $1"
    return 1
  fi
}

# Step 1: Check source files existence
echo "📁 Checking source files..."
check_file_exists "$APP_TSX" "App.tsx"
check_file_exists "$AWS_EXPORTS" "aws-exports.js"

# Step 2: Check critical authentication components in App.tsx
echo "🔒 Checking authentication logic in App.tsx..."
check_content "$APP_TSX" "fetchAuthSession" "Amplify authentication import"
check_content "$APP_TSX" "localStorage.setItem('ikusi.jwt'" "JWT token storage"

# Step 3: Check Cognito configuration in aws-exports.js
echo "☁️ Checking Cognito configuration in aws-exports.js..."
check_content "$AWS_EXPORTS" "aws_user_pools_id" "Cognito User Pool ID"
check_content "$AWS_EXPORTS" "aws_user_pools_web_client_id" "Cognito Client ID"
check_content "$AWS_EXPORTS" "domain: " "Cognito domain configuration"
check_content "$AWS_EXPORTS" "redirectSignIn" "OAuth redirect configuration"

# Step 4: Check the build output (if it exists)
if [ -d "$BUILD_DIR" ]; then
  echo "🏗️ Checking build output..."
  
  # Look for authentication code in the build JS files
  AUTH_FILES=$(grep -l "fetchAuthSession\|ikusi.jwt\|aws_user_pools" "$BUILD_DIR"/assets/*.js 2>/dev/null || echo "")
  
  if [ -n "$AUTH_FILES" ]; then
    echo "✅ Authentication code found in build files"
    echo "   Files with auth code: $(echo $AUTH_FILES | wc -w)"
  else
    echo "❌ Authentication code not found in build files"
    exit 1
  fi
  
  # Check for Cognito domain in the build
  if grep -r "us-east-2.*fyhltohiy\.auth\.us-east-2\.amazoncognito\.com" "$BUILD_DIR"/assets/*.js 2>/dev/null; then
    echo "✅ Cognito domain found in build"
  else
    echo "❌ Cognito domain not found in build"
    echo "⚠️ WARNING: This may indicate the aws-exports.js file was not included in the build"
    exit 1
  fi
else
  echo "⚠️ Build directory not found. Run 'pnpm build' first."
  exit 1
fi

echo "✅ Authentication verification complete!"
echo "🎉 All critical authentication components are present!"

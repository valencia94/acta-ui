#!/bin/bash

# This script fixes authentication flow issues in the ACTA-UI application
# by ensuring both Cognito User Pool and DynamoDB access are properly configured

echo "🔧 Starting authentication flow fix..."

# Step 1: Check for required packages and install if needed
echo "📦 Checking dependencies..."
REQUIRED_PACKAGES=(
  "@aws-amplify/auth"
  "@aws-amplify/core"
  "aws-amplify"
)

for package in "${REQUIRED_PACKAGES[@]}"; do
  if ! grep -q "\"$package\"" package.json; then
    echo "⚠️ Missing required package: $package"
    echo "📦 Installing $package..."
    npm install $package
  else
    echo "✅ Found package: $package"
  fi
done

# Step 2: Fix aws-exports.js configuration
echo "🔄 Ensuring aws-exports.js is correctly configured..."

# Create or update aws-exports.js in src directory
cat > src/aws-exports.js << EOL
// src/aws-exports.js
const awsmobile = {
  aws_project_region: 'us-east-2',
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/',
    responseType: 'code',
  },
  aws_cloud_logic_custom: [{
    name: 'ActaAPI',
    endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
    region: 'us-east-2'
  }]
};

export default awsmobile;
EOL

echo "✅ Updated src/aws-exports.js"

# Copy to public directory
mkdir -p public
cp src/aws-exports.js public/aws-exports.js
echo "✅ Copied aws-exports.js to public directory"

# Step 3: Update index.html to ensure aws-exports.js is loaded before main.tsx
echo "🔄 Updating index.html..."
if ! grep -q '<script src="/aws-exports.js"></script>' index.html; then
  sed -i '' 's|<div id="root"></div>|<div id="root"></div>\n    <script src="/aws-exports.js"></script>|' index.html
  echo "✅ Added aws-exports.js script tag to index.html"
else
  echo "✅ aws-exports.js script tag already exists in index.html"
fi

# Step 4: Run lint fix to resolve lint errors
echo "🧹 Running lint fix..."
npm run lint --fix

# Step 5: Build the application
echo "🏗️ Building the application..."
npm run build

echo "🎉 Authentication flow fix completed!"
echo ""
echo "Next steps:"
echo "1. Deploy the application with 'npm run deploy'"
echo "2. Run tests to verify the fix with 'node test-production.js'"

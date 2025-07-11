#!/bin/bash

# fix-aws-exports-location.sh
# Script to fix AWS exports configuration file location and rebuild the application

set -e

echo "🔧 Fixing aws-exports.js location and rebuilding application..."

# Step 1: Copy aws-exports.js to public directory
echo "📋 Copying aws-exports.js from src to public directory..."
cp src/aws-exports.js public/aws-exports.js
echo "✅ aws-exports.js copied to public directory"

# Step 2: Also ensure it's exported correctly in the source file
echo "🔍 Checking aws-exports.js export format..."
if ! grep -q "export default awsmobile" src/aws-exports.js; then
  echo "🔧 Fixing export in src/aws-exports.js..."
  # Add export if missing
  echo -e "\nexport default awsmobile;" >> src/aws-exports.js
  echo "✅ Added 'export default awsmobile' to src/aws-exports.js"
else
  echo "✅ src/aws-exports.js already has correct export statement"
fi

# Step 3: Create an additional export file to ensure AWS Amplify can find it
echo "📋 Creating aws-exports.js in root directory for direct module imports..."
cat > aws-exports.js << INNEREOF
// aws-exports.js in root for direct module imports
import awsmobile from './src/aws-exports.js';
export default awsmobile;
INNEREOF
echo "✅ Created aws-exports.js in root directory"

# Step 4: Rebuild the application
echo "🏗️ Rebuilding the application..."
pnpm run build

# Step 5: Verify the build includes aws-exports.js
echo "🔍 Verifying build output..."
if [ -f "dist/aws-exports.js" ]; then
  echo "✅ aws-exports.js found in dist directory"
else
  echo "❌ aws-exports.js not found in dist directory"
  echo "📋 Copying it directly..."
  cp public/aws-exports.js dist/aws-exports.js
  echo "✅ aws-exports.js copied to dist directory"
fi

# Step 6: Update the deployment
echo "�� Deploying the updated build..."
if [ -f "deploy-to-s3-cloudfront.sh" ]; then
  bash deploy-to-s3-cloudfront.sh
  echo "✅ Deployment completed using deploy-to-s3-cloudfront.sh"
else
  echo "❌ deploy-to-s3-cloudfront.sh not found"
  echo "📋 Manual deployment steps:"
  echo "1. Run 'aws s3 sync dist/ s3://acta-ui-frontend-prod/ --delete'"
  echo "2. Run 'aws cloudfront create-invalidation --distribution-id EPQU7PVDLQXUA --paths \"/*\"'"
fi

echo "✅ All fixes applied!"
echo ""
echo "🧪 Next steps:"
echo "1. Run 'node test-production.js' to verify the changes"
echo "2. Check the CloudFront URL: https://d7t9x3j66yd8k.cloudfront.net/"
echo "3. Test the authentication flow and API calls"

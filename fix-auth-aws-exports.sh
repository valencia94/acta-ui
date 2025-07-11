#!/bin/bash

# This script fixes AWS Amplify authentication configuration
# by ensuring aws-exports.js is correctly placed and configured

echo "🔧 Fixing AWS Amplify authentication configuration..."

# Configuration
SRC_AWS_EXPORTS="src/aws-exports.js"
PUBLIC_AWS_EXPORTS="public/aws-exports.js"

# Step 1: Check for aws-exports.js in src directory
echo "🔍 Checking for aws-exports.js in src directory..."
if [ ! -f "$SRC_AWS_EXPORTS" ]; then
    echo "❌ Error: $SRC_AWS_EXPORTS not found!"
    exit 1
fi

# Step 2: Copy aws-exports.js to public directory
echo "📝 Copying aws-exports.js to public directory..."
cp "$SRC_AWS_EXPORTS" "$PUBLIC_AWS_EXPORTS"
echo "✅ aws-exports.js copied to public directory"

# Step 3: Verify both files have the correct content
echo "🔍 Verifying aws-exports.js content..."
if grep -q "aws_user_pools_id" "$SRC_AWS_EXPORTS" && grep -q "aws_user_pools_id" "$PUBLIC_AWS_EXPORTS"; then
    echo "✅ aws-exports.js files have the correct content"
else
    echo "❌ aws-exports.js files might be missing required configuration"
    exit 1
fi

echo "🔄 Rebuilding the application with the updated configuration..."
npm run build

echo "🎉 AWS Amplify authentication configuration fixed!"
echo ""
echo "Next steps:"
echo "1. Deploy the application with 'npm run deploy'"
echo "2. Run tests to verify the fix with 'node test-production.js'"

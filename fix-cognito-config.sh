#!/bin/bash

# 🔧 Quick Fix Script for Cognito Configuration
echo "🔧 Applying Cognito fixes to current repo..."

# Fix the OAuth domain in aws-exports.js
if [ -f "src/aws-exports.js" ]; then
    echo "📝 Fixing OAuth domain in aws-exports.js..."
    sed -i.bak 's/us-east-2fyhltohiy/us-east-2-fyhltohiy/g' src/aws-exports.js
    echo "✅ Fixed OAuth domain (backup saved as src/aws-exports.js.bak)"
else
    echo "❌ src/aws-exports.js not found"
fi

# Check for import issues in Login.tsx
if [ -f "src/pages/Login.tsx" ]; then
    echo "📝 Checking Login.tsx imports..."
    if grep -q "@aws-amplify/auth" src/pages/Login.tsx; then
        echo "⚠️  Found @aws-amplify/auth imports - consider changing to aws-amplify/auth"
    else
        echo "✅ Login.tsx imports look correct"
    fi
else
    echo "❌ src/pages/Login.tsx not found"
fi

echo ""
echo "🎯 MANUAL STEPS REQUIRED:"
echo "1. Copy the corrected-aws-exports.js content to src/aws-exports.js"
echo "2. Ensure all auth imports use 'aws-amplify/auth' format"
echo "3. Test the login flow"
echo "4. Deploy using: ./complete-wipe-and-redeploy.sh"

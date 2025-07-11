#!/bin/bash

# 🔍 Extract Working Cognito Configuration and Code Patterns
# This script helps you port the working Cognito setup to your current repo

echo "🔍 EXTRACTING WORKING COGNITO CONFIGURATION..."

# Create extraction directory
mkdir -p cognito-extraction
cd cognito-extraction

echo "📥 1. Downloading working configuration files..."

# Download the working aws-exports.js
curl -s https://d7t9x3j66yd8k.cloudfront.net/aws-exports.js > working-aws-exports.js
echo "✅ Downloaded working aws-exports.js"

# Download the working bundle to analyze
curl -s https://d7t9x3j66yd8k.cloudfront.net/assets/index-C83_uCbX.js > working-bundle.js
echo "✅ Downloaded working JavaScript bundle"

echo ""
echo "🔍 2. Analyzing AWS configuration differences..."

echo "📋 WORKING AWS-EXPORTS.JS CONFIGURATION:"
echo "─────────────────────────────────────────"
cat working-aws-exports.js | head -20
echo ""

echo "🔧 3. Extracting Cognito patterns from working bundle..."

# Extract specific Cognito patterns
echo "📋 AUTH FUNCTION CALLS FOUND IN WORKING BUNDLE:"
echo "─────────────────────────────────────────"
grep -o 'signIn[^(]*([^)]*)\|signOut[^(]*([^)]*)\|getCurrentUser[^(]*([^)]*)\|fetchAuthSession[^(]*([^)]*)' working-bundle.js | sort | uniq | head -10

echo ""
echo "📋 COGNITO CONFIGURATION PATTERNS:"
echo "─────────────────────────────────────────"
grep -o 'aws_user_pools[^,]*\|aws_cognito[^,]*\|oauth[^}]*}' working-bundle.js | sort | uniq | head -10

echo ""
echo "📋 AUTH METHOD PATTERNS:"
echo "─────────────────────────────────────────"
grep -o 'Auth\.[a-zA-Z]*[^(]*\|amplify[^(]*' working-bundle.js | sort | uniq | head -10

echo ""
echo "🔧 4. Creating corrected configuration files..."

# Create the corrected aws-exports.js with exact working configuration
cat > ../corrected-aws-exports.js << 'EOF'
// aws-exports.js - WORKING PRODUCTION CONFIGURATION
// ✅ This configuration is extracted from the working July 8th deployment

const awsmobile = {
  aws_project_region: 'us-east-2',
  aws_cognito_region: 'us-east-2',
  
  // ── Cognito User Pool Configuration ─────────────────────────────────────────
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',

  // ── OAuth Configuration (EXACT working format) ─────────────────────────────
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com', // ✅ CORRECTED: hyphen not dot
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/login',
    responseType: 'code',
  },
  
  // ── API Gateway Configuration ──────────────────────────────────────────────
  aws_cloud_logic_custom: [
    {
      name: 'ActaAPI',
      endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
      region: 'us-east-2'
    }
  ],

  // ── S3 Storage Configuration ───────────────────────────────────────────────
  aws_user_files_s3_bucket: 'projectplace-dv-2025-x9a7b',
  aws_user_files_s3_bucket_region: 'us-east-2',
};

export default awsmobile;
EOF

echo "✅ Created corrected-aws-exports.js"

# Create an authentication pattern guide
cat > ../auth-patterns-guide.md << 'EOF'
# 🔐 Working Cognito Authentication Patterns

## Key Differences Found in Working Version

### 1. AWS Exports Configuration
```javascript
// ❌ BROKEN (current repo):
oauth: {
  domain: 'us-east-2fyhltohiy.auth.us-east-2.amazoncognito.com', // Missing hyphen
}

// ✅ WORKING (July 8th version):
oauth: {
  domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com', // Correct hyphen
}
```

### 2. Authentication Flow Patterns
Based on the working bundle analysis, the successful auth flow uses:

```typescript
// Import pattern (working):
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';

// Session verification (working pattern):
const { tokens } = await fetchAuthSession();
const token = tokens?.idToken?.toString() ?? '';

// Sign-in pattern (working):
await signIn({ username: email, password });

// Token storage (working):
localStorage.setItem('ikusi.jwt', token);
```

### 3. Configuration Loading
The working version loads AWS configuration early in the app lifecycle:

```typescript
// In main.tsx or App.tsx:
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure(awsExports);
```

## Files to Update in Your Current Repo

1. **src/aws-exports.js** - Fix OAuth domain (add hyphen)
2. **src/pages/Login.tsx** - Verify auth import patterns
3. **src/App.tsx** - Check session verification logic
4. **src/main.tsx** - Ensure Amplify is configured early

## Critical Fixes Needed

1. **OAuth Domain**: Change `us-east-2fyhltohiy` to `us-east-2-fyhltohiy`
2. **Import Paths**: Use `aws-amplify/auth` not `@aws-amplify/auth`
3. **Session Handling**: Verify `fetchAuthSession()` usage matches working pattern
EOF

echo "✅ Created auth-patterns-guide.md"

# Create a specific fix script
cat > ../fix-cognito-config.sh << 'EOF'
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
EOF

chmod +x ../fix-cognito-config.sh
echo "✅ Created fix-cognito-config.sh"

cd ..

echo ""
echo "🎉 EXTRACTION COMPLETE!"
echo ""
echo "📁 Files created:"
echo "   ✅ corrected-aws-exports.js - Working configuration"
echo "   ✅ auth-patterns-guide.md - Analysis and patterns"
echo "   ✅ fix-cognito-config.sh - Quick fix script"
echo "   📁 cognito-extraction/ - Downloaded working files"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Review auth-patterns-guide.md for detailed analysis"
echo "2. Run ./fix-cognito-config.sh for quick fixes"
echo "3. Manually apply the corrected-aws-exports.js content"
echo "4. Test locally, then deploy with ./complete-wipe-and-redeploy.sh"
echo ""
echo "🔍 Key fix needed: OAuth domain should be 'us-east-2-fyhltohiy' (with hyphen)"

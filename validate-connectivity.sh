#!/bin/bash

# Connectivity Validation Script
# Uses existing working validation tools

echo "🚀 ACTA-UI Connectivity Validation"
echo "=================================="
echo

# 1. Build validation
echo "1️⃣ Building project..."
if pnpm run build > /dev/null 2>&1; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi

# 2. Lint validation
echo "2️⃣ Running lint check..."
if pnpm run lint > /dev/null 2>&1; then
    echo "   ✅ Lint check passed"
else
    echo "   ❌ Lint check failed"
    exit 1
fi

# 3. Button validation
echo "3️⃣ Validating dashboard buttons..."
if node validate-dashboard-buttons.cjs > /dev/null 2>&1; then
    echo "   ✅ Dashboard buttons validated"
else
    echo "   ❌ Dashboard button validation failed"
fi

# 4. Environment check
echo "4️⃣ Checking environment variables..."
if [ -f ".env.production" ]; then
    echo "   ✅ Production environment file exists"
    
    # Check for key variables
    if grep -q "VITE_API_BASE_URL" .env.production; then
        echo "   ✅ API Base URL configured"
    else
        echo "   ❌ API Base URL missing"
    fi
    
    if grep -q "VITE_AWS_REGION" .env.production; then
        echo "   ✅ AWS Region configured"
    else
        echo "   ❌ AWS Region missing"
    fi
else
    echo "   ❌ Production environment file missing"
fi

# 5. AWS exports check
echo "5️⃣ Checking AWS exports..."
if [ -f "src/aws-exports.js" ]; then
    echo "   ✅ AWS exports file exists"
    
    # Check for key configurations
    if grep -q "userPoolId" src/aws-exports.js; then
        echo "   ✅ Cognito User Pool configured"
    else
        echo "   ❌ Cognito User Pool missing"
    fi
    
    if grep -q "identityPoolId" src/aws-exports.js; then
        echo "   ✅ Identity Pool configured"
    else
        echo "   ❌ Identity Pool missing"
    fi
else
    echo "   ❌ AWS exports file missing"
fi

# 6. Critical files check
echo "6️⃣ Checking critical files..."
critical_files=(
    "src/pages/Dashboard.tsx"
    "src/components/DynamoProjectsView.tsx"
    "src/lib/api.ts"
    "src/App.tsx"
    "package.json"
    "commitlint.config.cjs"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
    fi
done

echo
echo "🎉 Connectivity validation complete!"
echo "   For browser-based API testing, use: public/button-test-runner.html"
echo "   For production deployment, use: pnpm run build && deploy script"

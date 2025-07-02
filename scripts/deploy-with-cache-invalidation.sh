#!/bin/bash

# ACTA UI Deployment with Cache Invalidation
# This script ensures that cached files are properly invalidated during deployment

set -e

echo "🚀 Starting ACTA UI deployment with cache invalidation..."

# Step 1: Clear local caches
echo "🧹 Clearing local caches..."
rm -rf node_modules/.vite
rm -rf dist
rm -rf .cache

# Step 2: Install dependencies fresh
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Step 3: Build with timestamp
echo "🔨 Building application..."
export BUILD_TIMESTAMP=$(date +%s)
echo "Build timestamp: $BUILD_TIMESTAMP"
pnpm run build

# Step 4: Add build metadata
echo "📝 Adding build metadata..."
echo "{ \"buildTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"timestamp\": $BUILD_TIMESTAMP }" > dist/build-info.json

# Step 5: Verify build output
echo "✅ Verifying build output..."
echo "Files in dist:"
ls -la dist/

echo "Checking for critical files:"
[ -f "dist/index.html" ] && echo "✅ index.html found" || echo "❌ index.html missing"
[ -f "dist/assets/index-*.js" ] && echo "✅ Main JS bundle found" || echo "❌ Main JS bundle missing"
[ -f "dist/assets/index-*.css" ] && echo "✅ Main CSS bundle found" || echo "❌ Main CSS bundle missing"

# Step 6: Verify no test data
echo "🔍 Verifying no test data in build..."
if grep -r "test-project\|mock-project\|sample-project" dist/; then
    echo "❌ CRITICAL: Test projects found in build!"
    exit 1
else
    echo "✅ No test projects found in build"
fi

# Step 7: Check title in built HTML
echo "🔍 Verifying document title..."
if grep -q "Ikusi · Acta Platform" dist/index.html; then
    echo "✅ Correct document title found"
else
    echo "❌ CRITICAL: Document title not correct in build!"
    exit 1
fi

echo "🎉 Build verification complete!"
echo "📋 Build summary:"
echo "  - Clean caches: ✅"
echo "  - Fresh dependencies: ✅"
echo "  - Successful build: ✅"
echo "  - No test data: ✅"
echo "  - Correct title: ✅"
echo "  - Build metadata: ✅"

echo "🚀 Ready for deployment!"
echo "💡 Remember to invalidate CDN/CloudFront cache after deployment"

# If AWS CLI is available and app is deployed to Amplify, invalidate cache
if command -v aws &> /dev/null && [ ! -z "$AMPLIFY_APP_ID" ]; then
    echo "🔄 Attempting to trigger Amplify cache invalidation..."
    aws amplify start-job --app-id "$AMPLIFY_APP_ID" --branch-name main --job-type RELEASE || echo "⚠️ Could not trigger cache invalidation automatically"
fi

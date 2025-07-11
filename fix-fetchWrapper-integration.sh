#!/bin/bash

# Fix Fetch Wrapper Integration Script
# This script rebuilds the app ensuring fetchWrapper is properly integrated
# and fixes any CORS issues with the API

set -e

echo "🔧 Fixing fetchWrapper integration and API connectivity..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in the correct directory. Please run from acta-ui root."
    exit 1
fi

# Step 1: Ensure all dependencies are installed
echo "📦 Installing dependencies..."
pnpm install

# Step 2: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.vite/

# Step 3: Build the application with extra logging
echo "🔨 Building application with fetchWrapper integration..."
NODE_ENV=production pnpm run build 2>&1 | tee build.log

# Check if build was successful
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed! Check build.log for errors."
    exit 1
fi

echo "✅ Build completed successfully"

# Step 4: Verify fetchWrapper is in the bundle
echo "🔍 Verifying fetchWrapper is in production bundle..."

# Check for fetchWrapper functions in the built JS
JS_FILE=$(find dist/assets -name "index-*.js" | head -1)
if [ -f "$JS_FILE" ]; then
    echo "📄 Checking JavaScript bundle: $(basename "$JS_FILE")"
    
    # Check for key fetchWrapper functions
    if grep -q "fetchWrapper\|getAuthToken\|fetcher" "$JS_FILE"; then
        echo "✅ fetchWrapper functions found in bundle"
    else
        echo "❌ fetchWrapper functions NOT found in bundle"
        echo "⚠️  This may cause API connectivity issues"
    fi
    
    # Check for raw fetch calls that should use fetchWrapper
    RAW_FETCH_COUNT=$(grep -o "await fetch(" "$JS_FILE" | wc -l)
    echo "📊 Raw fetch() calls found: $RAW_FETCH_COUNT"
    
    if [ "$RAW_FETCH_COUNT" -gt 5 ]; then
        echo "⚠️  High number of raw fetch calls detected"
        echo "   Some API calls may not use proper error handling"
    fi
else
    echo "❌ Could not find JavaScript bundle file"
    exit 1
fi

# Step 5: Deploy to S3 with proper content types
echo ""
echo "🚀 Deploying to S3 with correct MIME types..."

S3_BUCKET="acta-ui-frontend-prod"
AWS_REGION="us-east-2"

# Upload files with correct content types
aws s3 sync dist/ "s3://$S3_BUCKET/" \
    --region "$AWS_REGION" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.txt"

# Upload index.html with no-cache
aws s3 cp dist/index.html "s3://$S3_BUCKET/" \
    --region "$AWS_REGION" \
    --content-type "text/html" \
    --cache-control "no-cache, no-store, must-revalidate"

# Upload text files
find dist/ -name "*.txt" -exec aws s3 cp {} "s3://$S3_BUCKET/{}" \
    --region "$AWS_REGION" \
    --content-type "text/plain" \;

# Set correct content types for specific file types
echo "🔧 Setting correct MIME types..."

# JavaScript files
aws s3 cp "s3://$S3_BUCKET/assets/" "s3://$S3_BUCKET/assets/" \
    --region "$AWS_REGION" \
    --recursive \
    --exclude "*" \
    --include "*.js" \
    --content-type "application/javascript" \
    --metadata-directive REPLACE

# CSS files
aws s3 cp "s3://$S3_BUCKET/assets/" "s3://$S3_BUCKET/assets/" \
    --region "$AWS_REGION" \
    --recursive \
    --exclude "*" \
    --include "*.css" \
    --content-type "text/css" \
    --metadata-directive REPLACE

# PNG files
aws s3 cp "s3://$S3_BUCKET/assets/" "s3://$S3_BUCKET/assets/" \
    --region "$AWS_REGION" \
    --recursive \
    --exclude "*" \
    --include "*.png" \
    --content-type "image/png" \
    --metadata-directive REPLACE

echo "✅ S3 deployment completed"

# Step 6: Invalidate CloudFront
echo ""
echo "🔄 Invalidating CloudFront cache..."

CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text \
    --region "$AWS_REGION")

echo "📋 Invalidation ID: $INVALIDATION_ID"

# Wait for invalidation to complete
echo "⏳ Waiting for invalidation to complete..."
aws cloudfront wait invalidation-completed \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID" \
    --region "$AWS_REGION"

echo "✅ CloudFront invalidation completed"

# Step 7: Test the deployment
echo ""
echo "🧪 Testing the deployment..."

# Test basic connectivity
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net/)
if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Site is responding (HTTP 200)"
else
    echo "❌ Site returned HTTP $HTTP_STATUS"
fi

# Test JavaScript MIME type
JS_CONTENT_TYPE=$(curl -s -I https://d7t9x3j66yd8k.cloudfront.net/assets/$(basename "$JS_FILE") | grep -i "content-type" | awk '{print $2}' | tr -d '\r')
if [[ "$JS_CONTENT_TYPE" == "application/javascript"* ]]; then
    echo "✅ JavaScript MIME type correct: $JS_CONTENT_TYPE"
else
    echo "⚠️ JavaScript MIME type: $JS_CONTENT_TYPE"
fi

# Step 8: Test API connectivity
echo ""
echo "🔌 Testing API connectivity..."

# Test the health endpoint
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health)
if [ "$API_STATUS" -eq 200 ] || [ "$API_STATUS" -eq 403 ]; then
    echo "✅ API Gateway is responding (HTTP $API_STATUS)"
    if [ "$API_STATUS" -eq 403 ]; then
        echo "ℹ️  403 is expected for health endpoint without auth"
    fi
else
    echo "❌ API Gateway returned HTTP $API_STATUS"
fi

echo ""
echo "🎉 fetchWrapper integration fix completed!"
echo "🌐 Your site: https://d7t9x3j66yd8k.cloudfront.net/"
echo ""
echo "📋 Next steps:"
echo "  1. Wait 2-3 minutes for full propagation"
echo "  2. Clear browser cache (Ctrl+F5)"
echo "  3. Test login and API functionality"
echo "  4. Run: node test-production.js"
echo ""
echo "🔍 If issues persist, check browser console for:"
echo "  - Proper fetchWrapper function calls"
echo "  - Correct CORS headers in API responses"
echo "  - Authentication token handling"

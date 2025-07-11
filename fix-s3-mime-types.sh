#!/bin/bash

# Fix S3 MIME Types Script
# This script fixes the Content-Type metadata for critical files in S3

set -e

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"

echo "🔧 Fixing S3 MIME types for critical files..."
echo "🪣 S3 Bucket: $S3_BUCKET"
echo ""

# Function to update content-type for a file
update_content_type() {
    local key="$1"
    local content_type="$2"
    
    echo "📝 Updating $key to $content_type..."
    
    # Copy the object to itself with the correct content-type
    aws s3 cp "s3://$S3_BUCKET/$key" "s3://$S3_BUCKET/$key" \
        --content-type "$content_type" \
        --metadata-directive REPLACE \
        --region "$AWS_REGION"
    
    if [ $? -eq 0 ]; then
        echo "✅ Updated: $key"
    else
        echo "❌ Failed: $key"
    fi
}

# Fix JavaScript files
echo "🔧 Fixing JavaScript files..."
update_content_type "assets/index-C83_uCbX.js" "application/javascript"

# Fix CSS files  
echo "🔧 Fixing CSS files..."
update_content_type "assets/index-DZQpD9Ki.css" "text/css"

# Fix HTML files
echo "🔧 Fixing HTML files..."
update_content_type "index.html" "text/html"

# Fix other common file types
echo "🔧 Fixing other file types..."
update_content_type "robots.txt" "text/plain"
update_content_type "assets/ikusi-logo.png" "image/png"
update_content_type "aws-exports.js" "application/javascript"

# Create CloudFront invalidation to clear cache
echo ""
echo "🔄 Creating CloudFront invalidation..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text \
    --region "$AWS_REGION")

echo "📋 Invalidation ID: $INVALIDATION_ID"

# Monitor invalidation status
echo ""
echo "⏳ Monitoring invalidation progress..."
while true; do
    STATUS=$(aws cloudfront get-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_ID" \
        --query 'Invalidation.Status' \
        --output text \
        --region "$AWS_REGION")
    
    echo "📊 Invalidation status: $STATUS"
    
    if [ "$STATUS" = "Completed" ]; then
        break
    fi
    
    sleep 30
done

# Test the fixed site
echo ""
echo "🧪 Testing fixed site..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net/)

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Site is responding (HTTP 200)"
else
    echo "❌ Site returned HTTP $HTTP_STATUS"
fi

# Test JavaScript file content-type
echo "🧪 Testing JavaScript MIME type..."
JS_CONTENT_TYPE=$(curl -s -I https://d7t9x3j66yd8k.cloudfront.net/assets/index-C83_uCbX.js | grep -i "content-type" | awk '{print $2}' | tr -d '\r')

if [[ "$JS_CONTENT_TYPE" == "application/javascript"* ]]; then
    echo "✅ JavaScript MIME type fixed: $JS_CONTENT_TYPE"
else
    echo "⚠️ JavaScript MIME type: $JS_CONTENT_TYPE"
fi

# Test CSS file content-type
echo "🧪 Testing CSS MIME type..."
CSS_CONTENT_TYPE=$(curl -s -I https://d7t9x3j66yd8k.cloudfront.net/assets/index-DZQpD9Ki.css | grep -i "content-type" | awk '{print $2}' | tr -d '\r')

if [[ "$CSS_CONTENT_TYPE" == "text/css"* ]]; then
    echo "✅ CSS MIME type fixed: $CSS_CONTENT_TYPE"
else
    echo "⚠️ CSS MIME type: $CSS_CONTENT_TYPE"
fi

echo ""
echo "🎉 MIME type fix completed!"
echo "🌐 Your site: https://d7t9x3j66yd8k.cloudfront.net/"
echo ""
echo "ℹ️  Note: It may take 5-15 minutes for all changes to propagate through CloudFront."

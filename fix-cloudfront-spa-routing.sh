#!/bin/bash
set -e

echo "🔧 Fixing CloudFront SPA Routing Configuration"
echo "=============================================="

DISTRIBUTION_ID="EPQU7PVDLQXUA"

# Get current configuration
echo "📥 Getting current CloudFront configuration..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > current-config.json

# Extract ETag for updates
ETAG=$(jq -r '.ETag' current-config.json)
echo "📋 Current ETag: $ETAG"

# Create updated configuration with SPA routing error pages
echo "⚙️ Creating updated configuration with SPA routing..."
jq '.DistributionConfig.CustomErrorResponses = {
  "Quantity": 2,
  "Items": [
    {
      "ErrorCode": 403,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 10
    },
    {
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html", 
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 10
    }
  ]
}' distribution-config-only.json > updated-config.json

# Update the distribution
echo "🚀 Updating CloudFront distribution..."
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file://updated-config.json \
  --if-match $ETAG > update-result.json

echo "✅ CloudFront distribution updated successfully!"

# Get new distribution status
NEW_ETAG=$(jq -r '.ETag' update-result.json)
echo "📋 New ETag: $NEW_ETAG"

echo "⏳ Distribution is now updating... This may take 5-15 minutes to deploy globally."
echo "🔍 You can check the status with:"
echo "   aws cloudfront get-distribution --id $DISTRIBUTION_ID"

echo ""
echo "🧪 After deployment completes, test the routes:"
echo "   curl -I https://d3e4f5g6h7i8j9.cloudfront.net/dashboard"
echo "   curl -I https://d3e4f5g6h7i8j9.cloudfront.net/admin"
echo "   curl -I https://d3e4f5g6h7i8j9.cloudfront.net/profile"
echo ""
echo "✨ SPA routing fix applied!"

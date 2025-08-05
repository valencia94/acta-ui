#!/bin/bash
# CloudFront Origin Request Policy Fix - Simple Version
set -euo pipefail

echo "🔧 CloudFront Header Forwarding Fix"
echo "==================================="

DIST_ID="EPQU7PVDLQXUA"
REGION="us-east-2"

echo "Checking current CloudFront configuration..."

# Get current distribution config
aws cloudfront get-distribution-config --id "$DIST_ID" > /tmp/current-dist.json
ETAG=$(jq -r '.ETag' /tmp/current-dist.json)
echo "Current ETag: $ETAG"

# Check if our policy already exists
POLICY_ID=$(aws cloudfront list-origin-request-policies \
  --query "OriginRequestPolicyList.Items[?OriginRequestPolicyConfig.Name=='acta-ui-auth-policy'].Id" \
  --output text)

if [ -z "$POLICY_ID" ] || [ "$POLICY_ID" = "None" ]; then
  echo "Creating new origin request policy..."
  POLICY_ID=$(aws cloudfront create-origin-request-policy \
    --origin-request-policy-config '{
      "Comment": "ACTA-UI Auth Headers Policy",
      "Name": "acta-ui-auth-policy",
      "HeadersConfig": {
        "HeaderBehavior": "whitelist",
        "Headers": {
          "Quantity": 3,
          "Items": ["Authorization", "Origin", "Content-Type"]
        }
      },
      "CookiesConfig": {
        "CookieBehavior": "none"
      },
      "QueryStringsConfig": {
        "QueryStringBehavior": "all"
      }
    }' \
    --query 'OriginRequestPolicy.Id' --output text)
  echo "Created policy ID: $POLICY_ID"
else
  echo "Using existing policy ID: $POLICY_ID"
fi

# Extract and update distribution config
jq '.DistributionConfig' /tmp/current-dist.json > /tmp/dist-config.json
jq --arg policy_id "$POLICY_ID" '.DefaultCacheBehavior.OriginRequestPolicyId = $policy_id' /tmp/dist-config.json > /tmp/updated-config.json

echo "Updating CloudFront distribution..."
aws cloudfront update-distribution \
  --id "$DIST_ID" \
  --if-match "$ETAG" \
  --distribution-config file:///tmp/updated-config.json

echo "✅ CloudFront update complete!"
echo "⏳ Changes will propagate in 5-15 minutes"

# Cleanup
rm -f /tmp/current-dist.json /tmp/dist-config.json /tmp/updated-config.json

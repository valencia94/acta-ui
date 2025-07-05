#!/bin/bash
# CloudFront Origin Request Policy Fix (Header Forwarding)
# Surgical intervention for live production deployment
set -euo pipefail

echo "🔧 CloudFront Distribution Header Forwarding Fix"
echo "================================================="

DIST_ID="EPQU7PVDLQXUA"
POLICY_NAME="acta-ui-auth-policy"
REGION="us-east-2"

echo "📋 Target Distribution: $DIST_ID"
echo "🎯 Policy Name: $POLICY_NAME"
echo ""

# Check if our custom policy already exists
echo "🔍 Checking for existing origin request policy..."
POLICY_ID=$(aws cloudfront list-origin-request-policies \
  --query "OriginRequestPolicyList.Items[?OriginRequestPolicyConfig.Name=='${POLICY_NAME}'].Id" \
  --output text)

if [ -z "$POLICY_ID" ] || [ "$POLICY_ID" = "None" ]; then
  echo "📝 Creating new origin request policy: $POLICY_NAME"
  
  # Create the policy with proper headers for Cognito auth
  POLICY_ID=$(aws cloudfront create-origin-request-policy \
    --origin-request-policy-config '{
      "Comment": "ACTA-UI Auth Headers - Authorization, Origin, Content-Type",
      "Name": "'$POLICY_NAME'",
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
  
  echo "✅ Created policy ID: $POLICY_ID"
else
  echo "✅ Using existing policy ID: $POLICY_ID"
fi

# Get current distribution configuration
echo "📥 Fetching current CloudFront configuration..."
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

DIST_CONFIG="$TEMP_DIR/distribution-config.json"
UPDATED_CONFIG="$TEMP_DIR/updated-config.json"

aws cloudfront get-distribution-config --id "$DIST_ID" > "$DIST_CONFIG"
ETAG=$(jq -r '.ETag' "$DIST_CONFIG")
echo "📋 Current ETag: $ETAG"

# Extract just the distribution config
jq '.DistributionConfig' "$DIST_CONFIG" > "$UPDATED_CONFIG.tmp"

# Update the Origin Request Policy ID for all behaviors
echo "🔄 Updating Origin Request Policy for all cache behaviors..."
jq --arg policy_id "$POLICY_ID" '
  .DefaultCacheBehavior.OriginRequestPolicyId = $policy_id |
  if .CacheBehaviors.Items then 
    (.CacheBehaviors.Items[] | .OriginRequestPolicyId) = $policy_id 
  else . end
' "$UPDATED_CONFIG.tmp" > "$UPDATED_CONFIG"

# Apply the update
echo "🚀 Applying CloudFront distribution update..."
UPDATE_RESULT=$(aws cloudfront update-distribution \
  --id "$DIST_ID" \
  --if-match "$ETAG" \
  --distribution-config file://"$UPDATED_CONFIG" \
  --output json)

NEW_ETAG=$(echo "$UPDATE_RESULT" | jq -r '.ETag')
STATUS=$(echo "$UPDATE_RESULT" | jq -r '.Distribution.Status')

echo ""
echo "✅ CloudFront Update Successful!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 New ETag: $NEW_ETAG"
echo "📊 Status: $STATUS"
echo "🎯 Policy Applied: $POLICY_ID"
echo ""
echo "🔍 Verification Command:"
echo "aws cloudfront get-distribution --id $DIST_ID --query 'Distribution.DistributionConfig.DefaultCacheBehavior.OriginRequestPolicyId'"
echo ""
echo "⏳ Note: CloudFront changes take 5-15 minutes to propagate globally"
echo "🧪 Test after propagation: curl -H 'Authorization: Bearer test' https://d7t9x3j66yd8k.cloudfront.net/api/health"

#!/bin/bash

# 🔧 Surgical CloudFront Origin Request Policy Fix for Acta-UI
# Follows AWS Architect guidance: separate by control plane
# This script ONLY handles CloudFront header forwarding - no API Gateway changes

set -e

DISTRIBUTION_ID="EPQU7PVDLQXUA"
REGION="us-east-1"  # CloudFront is always us-east-1

echo "☁️ SURGICAL CLOUDFRONT ORIGIN REQUEST POLICY FIX"
echo "Distribution: $DISTRIBUTION_ID"
echo "Region: $REGION (CloudFront global)"
echo "================================================"

# Create a custom origin request policy for Acta-UI
echo "🔧 Creating custom origin request policy for header forwarding..."

POLICY_NAME="acta-ui-auth-headers-policy"
POLICY_CONFIG='{
    "Name": "'$POLICY_NAME'",
    "Comment": "Surgical fix: Forward auth headers for Acta-UI Cognito integration",
    "HeadersConfig": {
        "HeaderBehavior": "whitelist",
        "Headers": {
            "Quantity": 3,
            "Items": [
                "Authorization",
                "Origin", 
                "Content-Type"
            ]
        }
    },
    "QueryStringsConfig": {
        "QueryStringBehavior": "all"
    },
    "CookiesConfig": {
        "CookieBehavior": "none"
    }
}'

# Create the policy
echo "➕ Creating origin request policy..."
POLICY_RESULT=$(aws cloudfront create-origin-request-policy \
    --origin-request-policy-config "$POLICY_CONFIG" \
    --region "$REGION" 2>/dev/null || echo "POLICY_EXISTS")

if [ "$POLICY_RESULT" = "POLICY_EXISTS" ]; then
    echo "ℹ️ Policy may already exist, getting existing policy ID..."
    POLICY_ID=$(aws cloudfront list-origin-request-policies \
        --region "$REGION" \
        --query "OriginRequestPolicyList.Items[?OriginRequestPolicy.OriginRequestPolicyConfig.Name=='$POLICY_NAME'].OriginRequestPolicy.Id" \
        --output text)
else
    POLICY_ID=$(echo "$POLICY_RESULT" | jq -r '.OriginRequestPolicy.Id')
fi

echo "✅ Origin Request Policy ID: $POLICY_ID"

# Get current CloudFront distribution config
echo "🔍 Getting current CloudFront distribution configuration..."
DIST_CONFIG=$(aws cloudfront get-distribution-config \
    --id "$DISTRIBUTION_ID" \
    --region "$REGION")

ETAG=$(echo "$DIST_CONFIG" | jq -r '.ETag')
echo "📋 Current ETag: $ETAG"

# Update the distribution config to use our new policy
echo "🔧 Updating CloudFront distribution with new origin request policy..."

# Extract current config and update the origin request policy ID
UPDATED_CONFIG=$(echo "$DIST_CONFIG" | jq --arg policy_id "$POLICY_ID" '
    .DistributionConfig.DefaultCacheBehavior.OriginRequestPolicyId = $policy_id
')

# Save updated config to temporary file
echo "$UPDATED_CONFIG" > /tmp/cloudfront-config-update.json

# Apply the update
echo "📤 Applying CloudFront distribution update..."
UPDATE_RESULT=$(aws cloudfront update-distribution \
    --id "$DISTRIBUTION_ID" \
    --distribution-config file:///tmp/cloudfront-config-update.json \
    --if-match "$ETAG" \
    --region "$REGION")

NEW_ETAG=$(echo "$UPDATE_RESULT" | jq -r '.ETag')
echo "✅ CloudFront update complete! New ETag: $NEW_ETAG"

# Clean up temp file
rm -f /tmp/cloudfront-config-update.json

echo ""
echo "⏰ CloudFront distribution is updating..."
echo "   This typically takes 15-20 minutes to propagate globally."
echo ""
echo "🧪 You can check status with:"
echo "   aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"
echo ""
echo "✅ When status shows 'Deployed', the auth headers will be forwarded correctly."
echo ""
echo "🎉 Surgical CloudFront origin request policy fix complete!"
echo "✅ Next step: Test the admin dashboard in production"

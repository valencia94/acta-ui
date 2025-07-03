#!/bin/bash
# Update CloudFront distribution with custom Origin Request Policy
set -euo pipefail

DIST_ID="EPQU7PVDLQXUA"
POLICY_NAME="acta-ui-auth-policy"
POLICY_CONFIG="$(dirname "$0")/custom-origin-request-policy.json"

# Create policy if it doesn't exist
POLICY_ID=$(aws cloudfront list-origin-request-policies \
  --query "OriginRequestPolicyList.Items[?OriginRequestPolicyConfig.Name=='${POLICY_NAME}'].Id" \
  --output text)

if [ -z "$POLICY_ID" ] || [ "$POLICY_ID" = "None" ]; then
  echo "Creating origin request policy $POLICY_NAME"
  POLICY_ID=$(aws cloudfront create-origin-request-policy \
    --origin-request-policy-config file://$POLICY_CONFIG \
    --query 'OriginRequestPolicy.Id' --output text)
  echo "Created policy ID: $POLICY_ID"
else
  echo "Using existing policy ID: $POLICY_ID"
fi

# Fetch current distribution config and ETag
DIST_JSON=$(mktemp)
CONFIG_JSON=$(mktemp)
UPDATED_JSON=$(mktemp)
trap 'rm -f "$DIST_JSON" "$CONFIG_JSON" "$UPDATED_JSON"' EXIT

aws cloudfront get-distribution-config --id "$DIST_ID" > "$DIST_JSON"
ETAG=$(jq -r '.ETag' "$DIST_JSON")
jq '.DistributionConfig' "$DIST_JSON" > "$CONFIG_JSON"

# Update all cache behaviors to use the policy
jq --arg pid "$POLICY_ID" \
  '(.DefaultCacheBehavior.OriginRequestPolicyId)=$pid | if .CacheBehaviors.Items then (.CacheBehaviors.Items[].OriginRequestPolicyId=$pid) else . end' \
  "$CONFIG_JSON" > "$UPDATED_JSON"

aws cloudfront update-distribution \
  --id "$DIST_ID" \
  --if-match "$ETAG" \
  --distribution-config file://$UPDATED_JSON

echo "Updated distribution $DIST_ID to use policy $POLICY_ID"
echo "Run the following to confirm:" 
echo "aws cloudfront get-distribution --id $DIST_ID --query 'Distribution.DistributionConfig.DefaultCacheBehavior.OriginRequestPolicyId'"

#!/bin/bash

# ACTA-UI Cognito Configuration Diagnostic
# Find out what Cognito resources actually exist and are configured

set -e

echo "🔍 ACTA-UI Cognito Configuration Diagnostic"
echo "==========================================="

# From .env.production
EXPECTED_USER_POOL="us-east-2_FyHLtOhiY"
EXPECTED_CLIENT_ID="dshos5iou44tuach7ta3ici5m"
EXPECTED_DOMAIN="acta-ui-prod"
EXPECTED_REGION="us-east-2"
PROD_FRONTEND="https://d7t9x3j66yd8k.cloudfront.net"

echo ""
echo "📋 Expected Configuration (from .env.production):"
echo "  User Pool ID: $EXPECTED_USER_POOL"
echo "  Client ID: $EXPECTED_CLIENT_ID"  
echo "  Domain: $EXPECTED_DOMAIN"
echo "  Region: $EXPECTED_REGION"
echo "  Frontend: $PROD_FRONTEND"
echo ""

# Check AWS identity
echo "🔐 AWS Identity:"
aws sts get-caller-identity --output table || echo "❌ AWS CLI not configured"
echo ""

# Try to find user pools in multiple regions
echo "🔍 Searching for Cognito User Pools..."
for region in us-east-2 us-east-1 us-west-2 eu-west-1; do
    echo "  Checking region: $region"
    if pools=$(aws cognito-idp list-user-pools --max-items 20 --region "$region" --output json 2>/dev/null); then
        count=$(echo "$pools" | jq '.UserPools | length' 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "    ✅ Found $count user pool(s) in $region"
            echo "$pools" | jq -r '.UserPools[] | "      Pool: \(.Id) - \(.Name)"' 2>/dev/null || echo "    (Unable to parse pool details)"
        else
            echo "    📭 No user pools in $region"
        fi
    else
        echo "    ❌ Cannot access region $region"
    fi
done
echo ""

# Check if the expected user pool exists
echo "🎯 Checking Expected User Pool: $EXPECTED_USER_POOL"
if pool_info=$(aws cognito-idp describe-user-pool --user-pool-id "$EXPECTED_USER_POOL" --region "$EXPECTED_REGION" --output json 2>/dev/null); then
    echo "  ✅ User pool exists!"
    domain=$(echo "$pool_info" | jq -r '.UserPool.Domain // "None"')
    echo "  📍 Configured domain: $domain"
    
    # Check clients in this pool
    echo "  🔍 Checking clients..."
    if clients=$(aws cognito-idp list-user-pool-clients --user-pool-id "$EXPECTED_USER_POOL" --region "$EXPECTED_REGION" --output json 2>/dev/null); then
        client_count=$(echo "$clients" | jq '.UserPoolClients | length' 2>/dev/null || echo "0")
        echo "    Found $client_count client(s):"
        echo "$clients" | jq -r '.UserPoolClients[] | "      Client: \(.ClientId) - \(.ClientName)"' 2>/dev/null || echo "    (Unable to parse client details)"
        
        # Check our expected client
        if client_details=$(aws cognito-idp describe-user-pool-client --user-pool-id "$EXPECTED_USER_POOL" --client-id "$EXPECTED_CLIENT_ID" --region "$EXPECTED_REGION" --output json 2>/dev/null); then
            echo "  ✅ Expected client exists!"
            echo "    Callback URLs:"
            echo "$client_details" | jq -r '.UserPoolClient.CallbackURLs[]? // "    None configured"' | sed 's/^/      /'
            echo "    Logout URLs:"
            echo "$client_details" | jq -r '.UserPoolClient.LogoutURLs[]? // "    None configured"' | sed 's/^/      /'
        else
            echo "  ❌ Expected client $EXPECTED_CLIENT_ID does not exist"
        fi
    else
        echo "    ❌ Cannot list clients"
    fi
else
    echo "  ❌ User pool $EXPECTED_USER_POOL does not exist in $EXPECTED_REGION"
fi
echo ""

# Check if the expected domain exists
echo "🌐 Checking Expected Cognito Domain: $EXPECTED_DOMAIN"
if domain_info=$(aws cognito-idp describe-user-pool-domain --domain "$EXPECTED_DOMAIN" --region "$EXPECTED_REGION" --output json 2>/dev/null); then
    echo "  ✅ Domain exists!"
    echo "$domain_info" | jq -r '  Status: \(.DomainDescription.Status)
  User Pool: \(.DomainDescription.UserPoolId)
  CloudFront Distribution: \(.DomainDescription.CloudFrontDistribution // "None")'
else
    echo "  ❌ Domain $EXPECTED_DOMAIN does not exist in $EXPECTED_REGION"
fi
echo ""

echo "🎯 RECOMMENDATIONS:"
echo "==================="
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found - check configuration"
else
    echo "✅ .env.production exists - using its configuration"
fi

echo ""
echo "🔧 NEXT STEPS:"
echo "1. If Cognito resources don't exist, they need to be recreated"
echo "2. If they exist but have wrong URLs, update callback/logout URLs" 
echo "3. Ensure the frontend $PROD_FRONTEND is configured as callback URL"
echo "4. Test the actual authentication flow end-to-end"

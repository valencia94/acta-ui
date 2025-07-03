#!/bin/bash

# Cognito Authentication Troubleshooting Script
# Check if Cognito user pool and client are properly configured

set -e

echo "🔍 Cognito Authentication Diagnostic"
echo "===================================="
echo ""

USER_POOL_ID="us-east-2_FyHLtOhiY"
CLIENT_ID="dshos5iou44tuach7ta3ici5m"
REGION="us-east-2"
PROD_DOMAIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "📋 Configuration:"
echo "   User Pool ID: $USER_POOL_ID"
echo "   Client ID: $CLIENT_ID"
echo "   Region: $REGION"
echo "   Production Domain: $PROD_DOMAIN"
echo ""

# Check if user pool exists
echo "1️⃣ Checking User Pool..."
if pool_info=$(aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" --region "$REGION" --output json 2>/dev/null); then
    echo "   ✅ User pool exists"
    echo "   Pool Name: $(echo "$pool_info" | jq -r '.UserPool.Name')"
    echo "   Status: $(echo "$pool_info" | jq -r '.UserPool.Status')"
    
    # Check password policy
    echo ""
    echo "   🔐 Password Policy:"
    echo "$pool_info" | jq -r '.UserPool.Policies.PasswordPolicy | "      Min Length: \(.MinimumLength // "default")
      Require Uppercase: \(.RequireUppercase // false)
      Require Lowercase: \(.RequireLowercase // false)  
      Require Numbers: \(.RequireNumbers // false)
      Require Symbols: \(.RequireSymbols // false)"'
else
    echo "   ❌ User pool does not exist or no access"
    exit 1
fi

echo ""

# Check client configuration
echo "2️⃣ Checking App Client..."
if client_info=$(aws cognito-idp describe-user-pool-client --user-pool-id "$USER_POOL_ID" --client-id "$CLIENT_ID" --region "$REGION" --output json 2>/dev/null); then
    echo "   ✅ App client exists"
    echo "   Client Name: $(echo "$client_info" | jq -r '.UserPoolClient.ClientName')"
    
    echo ""
    echo "   🔗 OAuth Configuration:"
    echo "   Callback URLs:"
    echo "$client_info" | jq -r '.UserPoolClient.CallbackURLs[]?' | sed 's/^/      /' || echo "      None configured"
    
    echo "   Logout URLs:"
    echo "$client_info" | jq -r '.UserPoolClient.LogoutURLs[]?' | sed 's/^/      /' || echo "      None configured"
    
    echo "   Allowed OAuth Flows:"
    echo "$client_info" | jq -r '.UserPoolClient.AllowedOAuthFlows[]?' | sed 's/^/      /' || echo "      None configured"
    
    echo "   OAuth Scopes:"
    echo "$client_info" | jq -r '.UserPoolClient.AllowedOAuthScopes[]?' | sed 's/^/      /' || echo "      None configured"
    
    # Check if production domain is in callback URLs
    if echo "$client_info" | jq -r '.UserPoolClient.CallbackURLs[]?' | grep -q "$PROD_DOMAIN"; then
        echo "   ✅ Production domain found in callback URLs"
    else
        echo "   ❌ Production domain NOT found in callback URLs"
        echo "      This could cause authentication failures"
    fi
else
    echo "   ❌ App client does not exist or no access"
    exit 1
fi

echo ""

# Check if there are any users in the pool
echo "3️⃣ Checking Users..."
if users=$(aws cognito-idp list-users --user-pool-id "$USER_POOL_ID" --region "$REGION" --max-items 5 --output json 2>/dev/null); then
    user_count=$(echo "$users" | jq '.Users | length')
    echo "   📊 Total users in pool: $user_count"
    
    if [[ "$user_count" -gt 0 ]]; then
        echo "   👥 Users:"
        echo "$users" | jq -r '.Users[] | "      \(.Username) - Status: \(.UserStatus) - Enabled: \(.Enabled)"'
    else
        echo "   📭 No users found in the pool"
        echo "      You may need to create a user or check if users exist"
    fi
else
    echo "   ❌ Cannot list users or no access"
fi

echo ""

# Check domain configuration
echo "4️⃣ Checking Domain Configuration..."
if domain_info=$(aws cognito-idp describe-user-pool-domain --domain "acta-ui-prod" --region "$REGION" --output json 2>/dev/null); then
    echo "   ✅ Cognito domain exists: acta-ui-prod"
    echo "   Status: $(echo "$domain_info" | jq -r '.DomainDescription.Status')"
else
    echo "   ⚠️  Cognito hosted domain not found"
    echo "      This is OK if you're using custom authentication"
fi

echo ""
echo "🔧 TROUBLESHOOTING RECOMMENDATIONS:"
echo "=================================="

if echo "$client_info" | jq -r '.UserPoolClient.CallbackURLs[]?' | grep -q "$PROD_DOMAIN"; then
    echo "✅ Callback URLs are correctly configured"
else
    echo "❌ ISSUE: Production domain not in callback URLs"
    echo "   FIX: Add $PROD_DOMAIN to callback URLs in Cognito console"
fi

echo ""
echo "💡 If credentials aren't working after reset:"
echo "   1. Check if the user status is 'CONFIRMED'"
echo "   2. Verify password meets the policy requirements above"
echo "   3. Try creating a new test user"
echo "   4. Check browser console for specific error messages"
echo ""
echo "🌐 Test login URL:"
echo "   https://d7t9x3j66yd8k.cloudfront.net"

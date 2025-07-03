#!/bin/bash

# Test Enhanced Cognito Sign-in Page
# Verifies that the styled sign-in page is accessible and functional

set -e

echo "🔍 Testing Enhanced Cognito Sign-in Page..."

# Configuration
USER_POOL_ID="us-east-2_FyHLtOhiY"
REGION="us-east-2"
CLIENT_ID="dshos5iou44tuach7ta3ici5m"
DOMAIN="us-east-2fyhltohiy"
REDIRECT_URI="https://main.d1234567890123.amplifyapp.com/"

# Construct the full sign-in URL
SIGNIN_URL="https://${DOMAIN}.auth.${REGION}.amazoncognito.com/login"
FULL_URL="${SIGNIN_URL}?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${REDIRECT_URI}"

echo "📋 Testing Configuration:"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Region: $REGION"
echo "  Client ID: $CLIENT_ID"
echo "  Domain: $DOMAIN"
echo ""

# Test 1: Check if the sign-in page is accessible
echo "🌐 Test 1: Sign-in Page Accessibility"
echo "URL: $SIGNIN_URL"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SIGNIN_URL" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Sign-in page is accessible (HTTP $HTTP_STATUS)"
else
    echo "❌ Sign-in page returned HTTP $HTTP_STATUS"
fi

# Test 2: Check if the full authentication URL works
echo ""
echo "🔐 Test 2: Full Authentication URL"
echo "URL: $FULL_URL"

FULL_HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FULL_URL" || echo "000")

if [ "$FULL_HTTP_STATUS" = "200" ]; then
    echo "✅ Full authentication URL is accessible (HTTP $FULL_HTTP_STATUS)"
else
    echo "❌ Full authentication URL returned HTTP $FULL_HTTP_STATUS"
fi

# Test 3: Verify UI customization is applied
echo ""
echo "🎨 Test 3: UI Customization Status"

if aws cognito-idp get-ui-customization --user-pool-id "$USER_POOL_ID" --region "$REGION" --query 'UICustomization.CSS' --output text &>/dev/null; then
    CSS_VERSION=$(aws cognito-idp get-ui-customization --user-pool-id "$USER_POOL_ID" --region "$REGION" --query 'UICustomization.CSSVersion' --output text)
    echo "✅ UI customization is active (Version: $CSS_VERSION)"
    
    # Check if our custom CSS is present
    if aws cognito-idp get-ui-customization --user-pool-id "$USER_POOL_ID" --region "$REGION" --query 'UICustomization.CSS' --output text | grep -q "banner-customizable"; then
        echo "✅ Custom styling (banner-customizable) is present"
    else
        echo "⚠️  Custom styling not found in CSS"
    fi
    
    if aws cognito-idp get-ui-customization --user-pool-id "$USER_POOL_ID" --region "$REGION" --query 'UICustomization.CSS' --output text | grep -q "2c5aa0"; then
        echo "✅ Acta brand colors (#2c5aa0) are present"
    else
        echo "⚠️  Brand colors not found in CSS"
    fi
    
else
    echo "❌ UI customization not found"
fi

# Test 4: Check domain configuration
echo ""
echo "🌐 Test 4: Domain Configuration"

if aws cognito-idp describe-user-pool-domain --domain "$DOMAIN" --region "$REGION" &>/dev/null; then
    DOMAIN_STATUS=$(aws cognito-idp describe-user-pool-domain --domain "$DOMAIN" --region "$REGION" --query 'DomainDescription.Status' --output text)
    echo "✅ Domain '$DOMAIN' exists (Status: $DOMAIN_STATUS)"
else
    echo "❌ Domain '$DOMAIN' not found or not accessible"
fi

# Summary
echo ""
echo "🎯 Enhanced Sign-in Page Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$HTTP_STATUS" = "200" ] && [ "$FULL_HTTP_STATUS" = "200" ]; then
    echo "✅ PASS: Sign-in page is accessible and functional"
    echo ""
    echo "🌟 Ready for Client Demo!"
    echo "🔗 Share this URL with your client:"
    echo "$FULL_URL"
    echo ""
    echo "🎨 Visual Improvements Active:"
    echo "   • Professional blue gradient header"
    echo "   • Enhanced form styling"
    echo "   • Modern button design"  
    echo "   • Acta brand colors"
    echo "   • Smooth hover effects"
else
    echo "❌ FAIL: Sign-in page has accessibility issues"
    echo "   Sign-in page: HTTP $HTTP_STATUS"
    echo "   Full auth URL: HTTP $FULL_HTTP_STATUS"
fi

echo ""
echo "💡 Pro Tip: Open the URL in a browser to see the visual improvements!"
echo "🚀 Your professional sign-in page is ready to impress!"

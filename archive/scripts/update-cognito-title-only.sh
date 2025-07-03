#!/bin/bash

# Minimal Cognito Title Update - Only adds "Acta Platform" title
# Keeps all existing styling intact

set -e

echo "🔧 Adding Acta Platform title to Cognito sign-in page..."

# Configuration from aws-exports.js and .env.production
USER_POOL_ID="us-east-2_FyHLtOhiY"
REGION="us-east-2"
CLIENT_ID="dshos5iou44tuach7ta3ici5m"

echo "📋 Configuration:"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Region: $REGION"
echo "  Client ID: $CLIENT_ID"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' first"
    exit 1
fi

echo "✅ AWS CLI is configured"

# MINIMAL CSS - Only adds the title, keeps everything else default
TITLE_ONLY_CSS='.banner-customizable {
    text-align: center;
    padding: 25px;
}

.banner-customizable:before {
    content: "Acta Platform";
    display: block;
    font-size: 24px;
    font-weight: bold;
    color: #232F3E;
    margin-bottom: 15px;
}'

# Create temporary CSS file
CSS_FILE="/tmp/cognito-title-only.css"
echo "$TITLE_ONLY_CSS" > "$CSS_FILE"

echo "📝 Created minimal CSS - only adds 'Acta Platform' title"
echo "   • Keeps all default Cognito styling"
echo "   • Only adds the title text"
echo "   • No color changes to background or forms"

# Update UI customization
echo "🎨 Applying title-only customization..."

# Apply minimal CSS
aws cognito-idp set-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --css "$(cat $CSS_FILE)" \
    --region "$REGION"

echo "✅ Applied title-only customization successfully!"

# Get the correct domain
ACTUAL_DOMAIN=$(aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" --region "$REGION" --query 'UserPool.Domain' --output text)
HOSTED_UI_URL="https://${ACTUAL_DOMAIN}.auth.${REGION}.amazoncognito.com/login"

echo ""
echo "🌟 Acta Platform Title Added!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Test URL: $HOSTED_UI_URL"
echo "📋 Full URL:"
echo "${HOSTED_UI_URL}?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=https://d7t9x3j66yd8k.cloudfront.net/"
echo ""
echo "✅ Changes Applied:"
echo "   • Added 'Acta Platform' title to sign-in page"
echo "   • Kept all default Cognito styling intact"
echo "   • No background or color changes"
echo ""
echo "💡 Only the title was modified - everything else remains default!"

# Clean up
rm -f "$CSS_FILE"

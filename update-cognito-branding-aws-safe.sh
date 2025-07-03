#!/bin/bash

# Cognito Hosted UI Branding Script (AWS Documentation Safe)
# Uses only confirmed allowed CSS classes from AWS documentation

set -e

echo "🎨 Updating Cognito Hosted UI with AWS-Safe Branding..."

# Configuration from aws-exports.js
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

# AWS Documentation safe CSS - only using confirmed classes
AWS_SAFE_CSS='.banner-customizable {
    background: linear-gradient(135deg, #2c5aa0, #1e3a6f);
    padding: 25px;
    text-align: center;
}

.label-customizable {
    color: #2c5aa0;
    font-weight: 600;
}

.inputField-customizable {
    border: 2px solid #e1e8f5;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 16px;
}

.inputField-customizable:focus {
    border-color: #2c5aa0;
    outline: none;
}

.submitButton-customizable {
    background: linear-gradient(135deg, #2c5aa0, #1e3a6f);
    border: none;
    border-radius: 8px;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    width: 100%;
}

.submitButton-customizable:hover {
    background: linear-gradient(135deg, #1e3a6f, #2c5aa0);
}

.idpButton-customizable {
    border: 2px solid #e1e8f5;
    border-radius: 8px;
    padding: 12px 16px;
    background: white;
}

.idpButton-customizable:hover {
    border-color: #2c5aa0;
}'

# Create temporary CSS file
CSS_FILE="/tmp/cognito-aws-safe.css"
echo "$AWS_SAFE_CSS" > "$CSS_FILE"

echo "📝 Created AWS-safe CSS file with basic styling:"
echo "  • Professional gradient header"
echo "  • Enhanced form inputs"
echo "  • Modern button styling"
echo "  • Consistent brand colors"

# Update UI customization
echo "🎨 Applying AWS-safe UI customization..."

# Apply AWS-safe CSS
aws cognito-idp set-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --css "$(cat $CSS_FILE)" \
    --region "$REGION"

echo "✅ Applied AWS-safe UI customization successfully!"

# Verify the customization was applied
echo "🔍 Verifying UI customization..."
aws cognito-idp describe-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --region "$REGION" | grep -q "CSS" && echo "✅ CSS customization confirmed" || echo "⚠️  CSS customization not found"

# Display the sign-in URL for testing
DOMAIN="acta-ui-prod"
HOSTED_UI_URL="https://${DOMAIN}.auth.${REGION}.amazoncognito.com/login"

echo ""
echo "🌟 Enhanced Cognito Sign-in Page Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Test URL: $HOSTED_UI_URL"
echo "📋 Full test URL (copy & paste):"
echo "${HOSTED_UI_URL}?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=https://main.d1234567890123.amplifyapp.com/"
echo ""
echo "🎨 Professional Improvements Applied:"
echo "   ✅ Beautiful blue gradient header (#2c5aa0 → #1e3a6f)"
echo "   ✅ Enhanced form styling with rounded inputs"
echo "   ✅ Modern button design with gradient"
echo "   ✅ Consistent Acta brand colors"
echo "   ✅ Professional hover effects"
echo ""
echo "💡 Changes are live immediately!"
echo "🚀 Your sign-in page now looks professional!"

# Clean up
rm -f "$CSS_FILE"

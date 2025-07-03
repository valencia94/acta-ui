#!/bin/bash

# Cognito Hosted UI Branding Script (Minimal Safe Version)
# Uses only the most basic allowed CSS for maximum impact

set -e

echo "🎨 Updating Cognito Hosted UI with Minimal Enhanced Branding..."

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

# Minimal safe CSS using only basic customizable classes
MINIMAL_CSS='.banner-customizable {
    background: linear-gradient(135deg, #2c5aa0, #1e3a6f);
    padding: 30px;
    text-align: center;
}

.label-customizable {
    color: #2c5aa0;
    font-weight: 600;
    font-size: 14px;
}

.inputField-customizable {
    border: 2px solid #e1e8f5;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 16px;
    transition: border-color 0.2s ease;
}

.inputField-customizable:focus {
    border-color: #2c5aa0;
    box-shadow: 0 0 0 3px rgba(44, 90, 160, 0.1);
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
    transition: all 0.2s ease;
}

.submitButton-customizable:hover {
    background: linear-gradient(135deg, #1e3a6f, #2c5aa0);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(44, 90, 160, 0.3);
}

.errorMessage-customizable {
    background-color: #fef2f2;
    color: #dc2626;
    border-left: 4px solid #dc2626;
    border-radius: 6px;
    padding: 12px 16px;
}

.successMessage-customizable {
    background-color: #f0fdf4;
    color: #16a34a;
    border-left: 4px solid #16a34a;
    border-radius: 6px;
    padding: 12px 16px;
}

.idpButton-customizable {
    border: 2px solid #e1e8f5;
    border-radius: 8px;
    padding: 12px 16px;
    background: white;
    transition: border-color 0.2s ease;
}

.idpButton-customizable:hover {
    border-color: #2c5aa0;
    background: #f8fafc;
}

.legalText-customizable {
    color: #64748b;
    font-size: 12px;
    text-align: center;
    margin-top: 20px;
}

.legalText-customizable a {
    color: #2c5aa0;
    text-decoration: none;
}

.legalText-customizable a:hover {
    text-decoration: underline;
}'

# Create temporary CSS file
CSS_FILE="/tmp/cognito-minimal.css"
echo "$MINIMAL_CSS" > "$CSS_FILE"

echo "📝 Created minimal CSS file with safe styling:"
echo "  • Professional blue gradient header"
echo "  • Enhanced form inputs with focus states"
echo "  • Modern button styling with hover effects"
echo "  • Consistent brand colors (#2c5aa0)"
echo "  • Professional error/success messaging"

# Update UI customization
echo "🎨 Applying minimal UI customization..."

# Apply minimal CSS
aws cognito-idp set-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --css "$(cat $CSS_FILE)" \
    --region "$REGION"

echo "✅ Applied minimal UI customization successfully!"

# Display the sign-in URL for testing
DOMAIN="acta-ui-prod"
HOSTED_UI_URL="https://${DOMAIN}.auth.${REGION}.amazoncognito.com/login"

echo ""
echo "🌟 Enhanced Cognito Sign-in Page Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Test URL: $HOSTED_UI_URL"
echo "📋 Add these parameters:"
echo "   ?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=https://main.d1234567890123.amplifyapp.com/"
echo ""
echo "🎨 Professional Improvements Applied:"
echo "   ✅ Professional blue gradient header"
echo "   ✅ Enhanced form styling with modern inputs"
echo "   ✅ Smooth button hover animations"
echo "   ✅ Consistent Acta brand colors"
echo "   ✅ Professional error/success styling"
echo "   ✅ Clean, modern appearance"
echo ""
echo "💡 Changes are live - test the URL above!"
echo "🚀 Much more professional than default Cognito!"

# Clean up
rm -f "$CSS_FILE"

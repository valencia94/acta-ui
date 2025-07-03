#!/bin/bash

# Cognito Hosted UI Branding Script (Cognito-Safe CSS)
# Uses only allowed CSS classes for maximum compatibility

set -e

echo "🎨 Updating Cognito Hosted UI with Safe Enhanced Branding..."

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

# Safe CSS using only standard Cognito classes
SAFE_CSS='.banner-customizable {
    background: linear-gradient(135deg, #2c5aa0 0%, #1e3a6f 100%);
    padding: 25px;
    text-align: center;
}

.banner-customizable .banner-inner {
    color: white !important;
    font-size: 32px !important;
    font-weight: bold !important;
    text-transform: none !important;
    letter-spacing: -0.5px;
}

.banner-customizable .banner-inner:before {
    content: "Acta Platform" !important;
    display: block !important;
    margin-bottom: 8px !important;
}

.banner-customizable:after {
    content: "Secure Access Portal";
    display: block;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: normal;
    margin-top: 5px;
}

.label-customizable {
    color: #2c5aa0 !important;
    font-weight: 600 !important;
    font-size: 14px !important;
}

.textDescription-customizable {
    color: #64748b !important;
    font-size: 14px !important;
}

.inputField-customizable {
    border: 2px solid #e1e8f5 !important;
    border-radius: 8px !important;
    padding: 12px 16px !important;
    font-size: 16px !important;
    background: white !important;
    transition: border-color 0.2s ease !important;
}

.inputField-customizable:focus {
    border-color: #2c5aa0 !important;
    box-shadow: 0 0 0 3px rgba(44, 90, 160, 0.1) !important;
    outline: none !important;
}

.submitButton-customizable {
    background: linear-gradient(135deg, #2c5aa0 0%, #1e3a6f 100%) !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 14px 24px !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    color: white !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    width: 100% !important;
}

.submitButton-customizable:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 20px rgba(44, 90, 160, 0.3) !important;
    background: linear-gradient(135deg, #1e3a6f 0%, #2c5aa0 100%) !important;
}

.submitButton-customizable:active {
    transform: translateY(0) !important;
}

.errorMessage-customizable {
    background-color: #fef2f2 !important;
    color: #dc2626 !important;
    border: none !important;
    border-left: 4px solid #dc2626 !important;
    border-radius: 6px !important;
    padding: 12px 16px !important;
    font-size: 14px !important;
    margin-bottom: 16px !important;
}

.successMessage-customizable {
    background-color: #f0fdf4 !important;
    color: #16a34a !important;
    border: none !important;
    border-left: 4px solid #16a34a !important;
    border-radius: 6px !important;
    padding: 12px 16px !important;
    font-size: 14px !important;
    margin-bottom: 16px !important;
}

.idpButton-customizable {
    border: 2px solid #e1e8f5 !important;
    border-radius: 8px !important;
    padding: 12px 16px !important;
    font-size: 14px !important;
    background: white !important;
    color: #374151 !important;
    transition: all 0.2s ease !important;
}

.idpButton-customizable:hover {
    border-color: #2c5aa0 !important;
    background: #f8fafc !important;
}

.legalText-customizable {
    color: #64748b !important;
    font-size: 12px !important;
    text-align: center !important;
    margin-top: 20px !important;
    line-height: 1.4 !important;
}

.legalText-customizable a {
    color: #2c5aa0 !important;
    text-decoration: none !important;
}

.legalText-customizable a:hover {
    text-decoration: underline !important;
}

.modal-header {
    background: linear-gradient(135deg, #2c5aa0 0%, #1e3a6f 100%) !important;
    border-bottom: none !important;
    border-radius: 8px 8px 0 0 !important;
}

.modal-content {
    border-radius: 12px !important;
    border: none !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
    overflow: hidden !important;
}

.modal-body {
    padding: 30px !important;
    background: white !important;
}

.form-group {
    margin-bottom: 20px !important;
}

@media (max-width: 480px) {
    .banner-customizable {
        padding: 20px !important;
    }
    
    .banner-customizable .banner-inner {
        font-size: 26px !important;
    }
    
    .modal-body {
        padding: 20px !important;
    }
}'

# Create temporary CSS file
CSS_FILE="/tmp/cognito-safe.css"
echo "$SAFE_CSS" > "$CSS_FILE"

echo "📝 Created safe CSS file with Cognito-allowed classes:"
echo "  • .banner-customizable (header styling)"
echo "  • .inputField-customizable (form inputs)"
echo "  • .submitButton-customizable (buttons)"
echo "  • .label-customizable (labels)"
echo "  • .errorMessage-customizable (error styling)"
echo "  • .successMessage-customizable (success styling)"

# Update UI customization
echo "🎨 Applying safe UI customization..."

# Apply safe CSS
aws cognito-idp set-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --css "$(cat $CSS_FILE)" \
    --region "$REGION"

echo "✅ Applied safe UI customization successfully!"

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
echo "   ✅ Custom 'Acta Platform' title with subtitle"
echo "   ✅ Professional blue gradient header (#2c5aa0)"
echo "   ✅ Enhanced form styling with focus states"
echo "   ✅ Modern button design with hover effects"
echo "   ✅ Consistent brand colors throughout"
echo "   ✅ Professional error/success message styling"
echo "   ✅ Mobile-responsive design"
echo "   ✅ Smooth transitions and animations"
echo ""
echo "💡 Changes are live immediately - test the URL above!"
echo "🚀 Your client will be impressed with this professional look!"

# Clean up
rm -f "$CSS_FILE"

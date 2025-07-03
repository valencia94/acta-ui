#!/bin/bash

# Enhanced Cognito Hosted UI Branding Script (Fixed)
# Creates a professional, client-ready sign-in experience

set -e

echo "🎨 Updating Cognito Hosted UI with Enhanced Branding..."

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

# Fixed CSS for professional branding (removing problematic data URLs)
ENHANCED_CSS='body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
}

.modal-content {
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border: none;
    background: white;
    max-width: 420px;
    margin: 40px auto;
    overflow: hidden;
}

.banner-customizable {
    background: linear-gradient(135deg, #2c5aa0 0%, #1e3a6f 100%);
    padding: 40px 20px 30px;
    text-align: center;
    position: relative;
}

.banner-customizable .banner-inner {
    display: block !important;
    color: white;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin: 0;
}

.banner-customizable .banner-inner:before {
    content: "Acta Platform";
    display: block;
    margin-bottom: 8px;
}

.banner-customizable:after {
    content: "Secure Access Portal";
    display: block;
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    font-weight: 400;
    margin-top: 5px;
}

.modal-body {
    padding: 40px 30px 30px;
    background: white;
}

.form-group {
    margin-bottom: 24px;
    position: relative;
}

.form-group label {
    color: #2c5aa0;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
    display: block;
}

.form-control {
    border: 2px solid #e1e8f5;
    border-radius: 8px;
    padding: 14px 16px;
    font-size: 16px;
    transition: all 0.2s ease;
    width: 100%;
    box-sizing: border-box;
    background: white;
}

.form-control:focus {
    border-color: #2c5aa0;
    box-shadow: 0 0 0 3px rgba(44, 90, 160, 0.1);
    outline: none;
}

.btn-primary {
    background: linear-gradient(135deg, #2c5aa0 0%, #1e3a6f 100%);
    border: none;
    border-radius: 8px;
    padding: 16px 24px;
    font-size: 16px;
    font-weight: 600;
    width: 100%;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(44, 90, 160, 0.25);
    background: linear-gradient(135deg, #1e3a6f 0%, #2c5aa0 100%);
}

.btn-primary:active {
    transform: translateY(0);
}

a {
    color: #2c5aa0;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

a:hover {
    color: #1e3a6f;
    text-decoration: underline;
}

.alert {
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    border: none;
    font-size: 14px;
}

.alert-danger {
    background-color: #fef2f2;
    color: #dc2626;
    border-left: 4px solid #dc2626;
}

.alert-success {
    background-color: #f0fdf4;
    color: #16a34a;
    border-left: 4px solid #16a34a;
}

.modal-footer {
    background: #f8fafc;
    padding: 20px 30px;
    text-align: center;
    border-top: 1px solid #e2e8f0;
}

.modal-footer p {
    margin: 0;
    color: #64748b;
    font-size: 13px;
}

@media (max-width: 480px) {
    .modal-content {
        margin: 20px;
        max-width: none;
    }
    
    .banner-customizable {
        padding: 30px 20px 25px;
    }
    
    .banner-customizable .banner-inner {
        font-size: 24px;
    }
    
    .modal-body {
        padding: 30px 20px;
    }
}

input[type="checkbox"], input[type="radio"] {
    accent-color: #2c5aa0;
}

h1, h2, h3, h4, h5, h6 {
    color: #1e293b;
    font-weight: 600;
}

p {
    color: #475569;
    line-height: 1.5;
}

.form-control::placeholder {
    color: #94a3b8;
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.btn-primary:focus,
.form-control:focus,
a:focus {
    outline: 2px solid #2c5aa0;
    outline-offset: 2px;
}'

# Create temporary CSS file
CSS_FILE="/tmp/cognito-enhanced-fixed.css"
echo "$ENHANCED_CSS" > "$CSS_FILE"

echo "📝 Created enhanced CSS file with:"
echo "  ✨ Modern gradient backgrounds"
echo "  🎯 Professional typography"
echo "  📱 Responsive design"
echo "  ⚡ Smooth animations"
echo "  🔒 Consistent branding"
echo "  ♿ Accessibility improvements"

# Update UI customization
echo "🎨 Applying enhanced UI customization..."

# Apply enhanced CSS
aws cognito-idp set-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --css "$(cat $CSS_FILE)" \
    --region "$REGION"

echo "✅ Applied enhanced UI customization successfully!"

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
echo "🎨 Visual Improvements Applied:"
echo "   • Custom 'Acta Platform' title with subtitle"
echo "   • Professional gradient backgrounds"
echo "   • Modern form styling with focus states"
echo "   • Smooth hover animations on buttons"
echo "   • Enhanced typography and spacing"
echo "   • Mobile-responsive design"
echo "   • Consistent brand colors (#2c5aa0)"
echo "   • Professional error/success message styling"
echo ""
echo "💡 The changes should be visible immediately!"
echo "🚀 Ready to impress your client!"

# Clean up
rm -f "$CSS_FILE"

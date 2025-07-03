#!/bin/bash

# Enhanced Cognito Hosted UI Branding Script
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

# Enhanced CSS for professional branding
ENHANCED_CSS='
/* Remove default Cognito branding and create custom experience */
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
}

/* Main container styling */
.modal-content {
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border: none;
    background: white;
    max-width: 400px;
    margin: 0 auto;
}

/* Custom header with logo space */
.banner-customizable {
    background: linear-gradient(135deg, #2c5aa0 0%, #1e3a6f 100%);
    padding: 30px 20px;
    text-align: center;
    border-radius: 12px 12px 0 0;
    position: relative;
    overflow: hidden;
}

.banner-customizable:before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    animation: float 20s infinite linear;
    pointer-events: none;
}

@keyframes float {
    0% { transform: rotate(0deg) translate(-50%, -50%); }
    100% { transform: rotate(360deg) translate(-50%, -50%); }
}

/* Custom title */
.banner-customizable .banner-inner {
    display: block !important;
    color: white;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -1px;
    margin: 0;
    position: relative;
    z-index: 1;
}

.banner-customizable .banner-inner:before {
    content: "Acta Platform";
    display: block;
}

/* Subtitle */
.banner-customizable:after {
    content: "Secure Access Portal";
    display: block;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 400;
    margin-top: 8px;
    position: relative;
    z-index: 1;
}

/* Form container */
.modal-body {
    padding: 40px 30px 30px;
    background: white;
}

/* Input styling */
.form-group {
    margin-bottom: 25px;
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
    padding: 12px 16px;
    font-size: 16px;
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
}

.form-control:focus {
    border-color: #2c5aa0;
    box-shadow: 0 0 0 3px rgba(44, 90, 160, 0.1);
    outline: none;
}

/* Button styling */
.btn-primary {
    background: linear-gradient(135deg, #2c5aa0 0%, #1e3a6f 100%);
    border: none;
    border-radius: 8px;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 600;
    width: 100%;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(44, 90, 160, 0.3);
}

.btn-primary:active {
    transform: translateY(0);
}

/* Link styling */
a {
    color: #2c5aa0;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

a:hover {
    color: #1e3a6f;
    text-decoration: underline;
}

/* Error/success message styling */
.alert {
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    border: none;
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

/* Footer/additional links */
.modal-footer {
    background: #f8fafc;
    padding: 20px 30px;
    border-radius: 0 0 12px 12px;
    text-align: center;
    border-top: 1px solid #e2e8f0;
}

.modal-footer p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
}

/* Responsive design */
@media (max-width: 480px) {
    .modal-content {
        margin: 20px;
        max-width: none;
    }
    
    .banner-customizable {
        padding: 25px 15px;
    }
    
    .banner-customizable .banner-inner {
        font-size: 28px;
    }
    
    .modal-body {
        padding: 30px 20px;
    }
}

/* Loading state for buttons */
.btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

/* Additional polish: Focus rings for accessibility */
.form-control:focus,
.btn-primary:focus,
a:focus {
    outline: 2px solid #2c5aa0;
    outline-offset: 2px;
}

/* Custom checkbox/radio styling if present */
input[type="checkbox"], input[type="radio"] {
    accent-color: #2c5aa0;
}

/* Professional spacing and typography */
h1, h2, h3, h4, h5, h6 {
    color: #1e293b;
    font-weight: 600;
    line-height: 1.4;
}

p {
    color: #475569;
    line-height: 1.6;
}

/* Hide any Cognito branding/logos we cannot control */
.amplify-authenticator [data-amplify-authenticator-signin] .amplify-heading {
    display: none !important;
}
'

# Create temporary CSS file
CSS_FILE="/tmp/cognito-enhanced.css"
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

# Check current UI customization
echo "📊 Checking current UI customization..."
aws cognito-idp describe-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --region "$REGION" 2>/dev/null || echo "No existing UI customization found"

# Apply enhanced CSS
aws cognito-idp set-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --css "$(cat $CSS_FILE)" \
    --region "$REGION"

echo "✅ Applied enhanced UI customization"

# Display the sign-in URL for testing
DOMAIN="acta-ui-prod"
HOSTED_UI_URL="https://${DOMAIN}.auth.${REGION}.amazoncognito.com/login"

echo ""
echo "🌟 Enhanced Cognito Sign-in Page Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Test URL: $HOSTED_UI_URL"
echo "📋 Parameters to add:"
echo "   client_id=$CLIENT_ID"
echo "   response_type=code"
echo "   scope=email+openid+profile"
echo "   redirect_uri=https://main.d1234567890123.amplifyapp.com/"
echo ""
echo "🎨 Visual Improvements Applied:"
echo "   • Professional gradient background"
echo "   • Custom 'Acta Platform' branding"
echo "   • Smooth hover animations"
echo "   • Modern form styling"
echo "   • Responsive mobile design"
echo "   • Enhanced accessibility"
echo "   • Consistent color scheme"
echo ""
echo "💡 Pro Tip: Test on both desktop and mobile for full effect!"

# Clean up
rm -f "$CSS_FILE"

echo "🚀 Ready to impress your client!"

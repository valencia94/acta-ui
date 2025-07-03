#!/bin/bash

# Update Cognito Hosted UI Branding Script
# Changes the sign-in screen title to "Acta Platform"

set -e

echo "🔧 Updating Cognito Hosted UI Branding..."

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

# Create CSS for custom branding
# Note: Cognito Hosted UI has limited customization options
# The title is typically changed via CSS customization
CUSTOM_CSS='
.banner-customizable {
    background-color: #ffffff;
}

.banner-customizable .banner-inner {
    color: #2c5aa0;
    font-weight: bold;
    text-align: center;
}

/* Custom title styling */
.banner-customizable:before {
    content: "Acta Platform";
    display: block;
    font-size: 24px;
    font-weight: bold;
    color: #2c5aa0;
    text-align: center;
    padding: 20px 0;
}

/* Hide default title if present */
.banner-customizable .banner-inner {
    display: none;
}

/* Ensure the sign-in form styling is preserved */
.modal-body {
    background-color: #ffffff;
}

.form-group {
    margin-bottom: 15px;
}

.btn-primary {
    background-color: #2c5aa0;
    border-color: #2c5aa0;
}

.btn-primary:hover {
    background-color: #1e3a6f;
    border-color: #1e3a6f;
}
'

# Create temporary CSS file
CSS_FILE="/tmp/cognito-custom.css"
echo "$CUSTOM_CSS" > "$CSS_FILE"

echo "📝 Created custom CSS file: $CSS_FILE"

# Update UI customization
echo "🎨 Updating Cognito UI customization..."

# First, let's check current UI customization
echo "📊 Checking current UI customization..."
aws cognito-idp describe-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --region "$REGION" || echo "No existing UI customization found"

# Set UI customization with custom CSS
aws cognito-idp set-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --css "$(cat $CSS_FILE)" \
    --region "$REGION"

echo "✅ Updated UI customization with custom CSS"

# Alternative approach: Update User Pool domain branding
echo "🌐 Checking User Pool domain configuration..."

DOMAIN="us-east-2fyhltohiy"
DOMAIN_FULL="us-east-2fyhltohiy.auth.us-east-2.amazoncognito.com"

# Check if domain exists
if aws cognito-idp describe-user-pool-domain --domain "$DOMAIN" --region "$REGION" &>/dev/null; then
    echo "✅ Domain $DOMAIN_FULL exists"
    
    # For more advanced branding, we might need to create custom domain
    # with SSL certificate, but for now CSS customization should work
else
    echo "ℹ️  Domain not found or not accessible"
fi

# Clean up
rm -f "$CSS_FILE"

echo ""
echo "🎉 Cognito Hosted UI branding update completed!"
echo ""
echo "📋 Summary:"
echo "  ✅ Applied custom CSS to change title to 'Acta Platform'"
echo "  ✅ Preserved existing styling and functionality"
echo "  ✅ Changes will appear on the sign-in screen"
echo ""
echo "🔍 To verify changes:"
echo "  1. Visit: https://$DOMAIN_FULL/login?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=https://d7t9x3j66yd8k.cloudfront.net/"
echo "  2. Check that the title shows 'Acta Platform'"
echo ""
echo "⚠️  Note: CSS changes may take a few minutes to propagate"

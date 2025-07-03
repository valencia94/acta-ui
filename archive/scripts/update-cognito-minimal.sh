#!/bin/bash

# Update Cognito Hosted UI - Minimal Allowed CSS Only
# This script uses only the CSS classes that AWS Cognito allows

set -e

echo "🔧 Updating Cognito Hosted UI with minimal allowed CSS..."

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

# According to AWS documentation, only very specific classes are allowed
# Let's try with the most basic allowed classes
MINIMAL_CSS='
.btn-primary {
    background-color: #2c5aa0;
    border-color: #2c5aa0;
}

.btn-primary:hover {
    background-color: #1e3a6f;
    border-color: #1e3a6f;
}

.btn-primary:focus {
    background-color: #1e3a6f;
    border-color: #1e3a6f;
    box-shadow: 0 0 0 0.2rem rgba(44, 90, 160, 0.25);
}

.redirect-customizable {
    color: #2c5aa0;
}

.redirect-customizable:hover {
    color: #1e3a6f;
}
'

# Create temporary CSS file
CSS_FILE="/tmp/cognito-minimal.css"
echo "$MINIMAL_CSS" > "$CSS_FILE"

echo "📝 Created minimal CSS file with only basic button styling"

# Apply minimal CSS customization
echo "🎨 Applying minimal UI customization..."
aws cognito-idp set-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --css "$(cat $CSS_FILE)" \
    --region "$REGION"

echo "✅ Applied minimal CSS customization successfully"

# Clean up
rm -f "$CSS_FILE"

echo ""
echo "🎉 Minimal UI customization completed!"
echo ""
echo "📋 What was applied:"
echo "  ✅ Custom button colors (Acta blue theme)"
echo "  ✅ Custom link colors"
echo ""
echo "⚠️  Important notes about Cognito Hosted UI limitations:"
echo "  • The page title 'Sign In' cannot be changed via CSS"
echo "  • Most CSS classes are restricted for security reasons"
echo "  • Only basic button and link styling is allowed"
echo ""
echo "🔍 To test the changes:"
echo "  Visit: https://us-east-2fyhltohiy.auth.us-east-2.amazoncognito.com/login?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=https://d7t9x3j66yd8k.cloudfront.net/"
echo ""
echo "💡 To actually change the title to 'Acta Platform', you would need:"
echo "  1. A custom domain with SSL certificate"
echo "  2. Your own hosted UI implementation (not Cognito Hosted UI)"
echo "  3. AWS Support assistance for advanced branding"
echo ""
echo "🚀 The current setup provides:"
echo "  • Secure authentication with Cognito"
echo "  • Branded button colors matching your app"
echo "  • Functional OAuth flow"

#!/bin/bash

# Update Cognito Hosted UI Branding Script (Simplified)
# Changes the sign-in screen with allowed CSS classes only

set -e

echo "🔧 Updating Cognito Hosted UI Branding (Simplified)..."

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

# Check current UI customization
echo "📊 Checking current UI customization..."
aws cognito-idp get-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --region "$REGION" || echo "No existing UI customization found"

# Create minimal CSS with only allowed classes
# Based on AWS Cognito documentation, only certain classes are allowed
CUSTOM_CSS='
/* Main container styling */
.modal-content {
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Header styling */
.modal-header {
    background-color: #2c5aa0;
    color: white;
    text-align: center;
    border-bottom: none;
    padding: 20px;
}

/* Form styling */
.modal-body {
    padding: 30px;
    background-color: #ffffff;
}

/* Button styling */
.btn-primary {
    background-color: #2c5aa0;
    border-color: #2c5aa0;
    width: 100%;
    padding: 12px;
    font-size: 16px;
    border-radius: 4px;
}

.btn-primary:hover, .btn-primary:focus {
    background-color: #1e3a6f;
    border-color: #1e3a6f;
}

/* Input styling */
.form-control {
    border-radius: 4px;
    border: 1px solid #ddd;
    padding: 12px;
    font-size: 14px;
}

.form-control:focus {
    border-color: #2c5aa0;
    box-shadow: 0 0 0 0.2rem rgba(44, 90, 160, 0.25);
}

/* Link styling */
.redirect-customizable {
    color: #2c5aa0;
    text-decoration: none;
}

.redirect-customizable:hover {
    color: #1e3a6f;
    text-decoration: underline;
}
'

# Create temporary CSS file
CSS_FILE="/tmp/cognito-simple.css"
echo "$CUSTOM_CSS" > "$CSS_FILE"

echo "📝 Created simplified CSS file: $CSS_FILE"

# Set UI customization with allowed CSS only
echo "🎨 Applying UI customization..."
aws cognito-idp set-ui-customization \
    --user-pool-id "$USER_POOL_ID" \
    --css "$(cat $CSS_FILE)" \
    --region "$REGION"

echo "✅ Applied CSS customization successfully"

# Now let's try to update the User Pool itself to change the name/title
echo "🏷️  Checking User Pool configuration..."
aws cognito-idp describe-user-pool \
    --user-pool-id "$USER_POOL_ID" \
    --region "$REGION" \
    --query 'UserPool.{Name:Name,Policies:Policies,AutoVerifiedAttributes:AutoVerifiedAttributes}' \
    --output table

# Clean up
rm -f "$CSS_FILE"

echo ""
echo "🎉 Basic UI customization completed!"
echo ""
echo "📋 What was applied:"
echo "  ✅ Custom color scheme (blue theme)"
echo "  ✅ Improved button and form styling"
echo "  ✅ Better visual appearance"
echo ""
echo "⚠️  Note about title:"
echo "  The actual page title 'Sign In' is controlled by Cognito internally"
echo "  and cannot be changed via CSS due to security restrictions."
echo "  However, the styling now matches your brand colors."
echo ""
echo "🔍 To test the changes:"
echo "  Visit: https://us-east-2fyhltohiy.auth.us-east-2.amazoncognito.com/login?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=https://d7t9x3j66yd8k.cloudfront.net/"
echo ""
echo "💡 Alternative solutions for title change:"
echo "  1. Use a custom domain with your own hosted UI"
echo "  2. Implement your own sign-in page instead of Cognito Hosted UI"
echo "  3. Contact AWS Support for advanced branding options"

#!/usr/bin/env bash

# Script to refresh AWS credentials for ACTA-UI troubleshooting
echo "🔐 Refreshing AWS Credentials for ACTA-UI"
echo "========================================="

# Role to assume
ROLE_ARN="arn:aws:iam::703671891952:role/service-role/codebuild-acta-ui-service-role"
SESSION_NAME="acta-ui-lambda-fix-$(date +%s)"

echo "📋 Assuming role: $ROLE_ARN"
echo "📋 Session name: $SESSION_NAME"

# Get temporary credentials
CREDENTIALS=$(aws sts assume-role \
    --role-arn "$ROLE_ARN" \
    --role-session-name "$SESSION_NAME" \
    --duration-seconds 3600 \
    --output json)

if [ $? -ne 0 ]; then
    echo "❌ Failed to assume role. Please check your base AWS credentials."
    echo ""
    echo "Make sure you have valid AWS credentials configured:"
    echo "1. aws configure"
    echo "2. Or set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    exit 1
fi

# Extract credentials
ACCESS_KEY=$(echo "$CREDENTIALS" | jq -r '.Credentials.AccessKeyId')
SECRET_KEY=$(echo "$CREDENTIALS" | jq -r '.Credentials.SecretAccessKey')
SESSION_TOKEN=$(echo "$CREDENTIALS" | jq -r '.Credentials.SessionToken')
EXPIRATION=$(echo "$CREDENTIALS" | jq -r '.Credentials.Expiration')

# Export credentials
export AWS_ACCESS_KEY_ID="$ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$SECRET_KEY"
export AWS_SESSION_TOKEN="$SESSION_TOKEN"
export AWS_DEFAULT_REGION="us-east-2"

echo "✅ Credentials refreshed successfully!"
echo "📋 Expiration: $EXPIRATION"

# Verify credentials
echo -e "\n🔍 Verifying credentials..."
aws sts get-caller-identity

echo -e "\n🎯 You can now run:"
echo "   ./deploy-lambda-fixes-comprehensive.sh"
echo ""
echo "💡 Or export these in your current shell:"
echo "export AWS_ACCESS_KEY_ID='$ACCESS_KEY'"
echo "export AWS_SECRET_ACCESS_KEY='$SECRET_KEY'"
echo "export AWS_SESSION_TOKEN='$SESSION_TOKEN'"
echo "export AWS_DEFAULT_REGION='us-east-2'"

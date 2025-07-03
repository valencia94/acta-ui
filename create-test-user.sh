#!/bin/bash

# Create a test user in Cognito for authentication testing

set -e

USER_POOL_ID="us-east-2_FyHLtOhiY"
REGION="us-east-2"
TEST_EMAIL="test@acta-platform.com"
TEMP_PASSWORD="TempPass123!"

echo "🔧 Creating test user in Cognito..."
echo "   User Pool: $USER_POOL_ID"
echo "   Email: $TEST_EMAIL"
echo "   Temp Password: $TEMP_PASSWORD"
echo ""

# Create user
echo "Creating user..."
aws cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$TEST_EMAIL" \
    --user-attributes Name=email,Value="$TEST_EMAIL" Name=email_verified,Value=true \
    --temporary-password "$TEMP_PASSWORD" \
    --message-action SUPPRESS \
    --region "$REGION"

echo ""
echo "Setting permanent password..."
aws cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --username "$TEST_EMAIL" \
    --password "$TEMP_PASSWORD" \
    --permanent \
    --region "$REGION"

echo ""
echo "✅ Test user created successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Login Credentials:"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEMP_PASSWORD"
echo ""
echo "🌐 Test at: https://d7t9x3j66yd8k.cloudfront.net"
echo ""
echo "💡 If this works, the issue was with your original user account"

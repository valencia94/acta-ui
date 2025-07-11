#!/bin/bash

# Create unauthenticated role for Cognito Identity Pool
# This is needed for the two-sided authentication system

echo "🔧 Creating unauthenticated role for Cognito Identity Pool..."

IDENTITY_POOL_ID="us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35"
ROLE_NAME="ActaUI-DynamoDB-UnauthenticatedRole"

# Create trust policy for unauthenticated role
cat > /tmp/unauth-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "unauthenticated"
        }
      }
    }
  ]
}
EOF

# Create permissions policy for unauthenticated role (minimal permissions)
cat > /tmp/unauth-permissions-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "mobileanalytics:PutEvents",
        "cognito-sync:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create the unauthenticated role
echo "Creating IAM role: $ROLE_NAME"
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file:///tmp/unauth-trust-policy.json \
  --description "Unauthenticated role for Acta UI Identity Pool"

# Attach the permissions policy
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "UnauthenticatedPolicy" \
  --policy-document file:///tmp/unauth-permissions-policy.json

# Get the role ARN
UNAUTH_ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
echo "Unauthenticated role ARN: $UNAUTH_ROLE_ARN"

# Update the identity pool to include the unauthenticated role
echo "Updating identity pool roles..."
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id "$IDENTITY_POOL_ID" \
  --roles "authenticated=arn:aws:iam::703671891952:role/ActaUI-DynamoDB-AuthenticatedRole,unauthenticated=$UNAUTH_ROLE_ARN"

echo "✅ Unauthenticated role created and assigned to identity pool"

# Clean up temp files
rm -f /tmp/unauth-trust-policy.json /tmp/unauth-permissions-policy.json

echo "🔍 Verifying identity pool configuration..."
aws cognito-identity get-identity-pool-roles --identity-pool-id "$IDENTITY_POOL_ID"

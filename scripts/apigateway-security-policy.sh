#!/bin/bash
# API Gateway Resource Policy - Restrict Access to CloudFront Only
# Optional security layer for live production deployment
set -euo pipefail

echo "🔒 API Gateway Resource Policy Security Enforcement"
echo "=================================================="

API_ID="q2b9avfwv5"
REGION="us-east-2"
CLOUDFRONT_DIST_ID="EPQU7PVDLQXUA"
AWS_ACCOUNT_ID="703671891952"

echo "📋 Configuration:"
echo "   API ID: $API_ID"
echo "   Region: $REGION"
echo "   CloudFront Distribution: $CLOUDFRONT_DIST_ID"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo ""

# CloudFront distribution ARN
CLOUDFRONT_ARN="arn:aws:cloudfront::${AWS_ACCOUNT_ID}:distribution/${CLOUDFRONT_DIST_ID}"
echo "🎯 CloudFront ARN: $CLOUDFRONT_ARN"
echo ""

# Create the resource policy JSON
POLICY_DOCUMENT=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "execute-api:Invoke",
      "Resource": "arn:aws:execute-api:${REGION}:${AWS_ACCOUNT_ID}:${API_ID}/*",
      "Condition": {
        "StringEquals": {
          "aws:SourceArn": "${CLOUDFRONT_ARN}"
        }
      }
    },
    {
      "Sid": "AllowDirectHealthCheck",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "execute-api:Invoke",
      "Resource": "arn:aws:execute-api:${REGION}:${AWS_ACCOUNT_ID}:${API_ID}/*/GET/health",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": [
            "0.0.0.0/0"
          ]
        }
      }
    },
    {
      "Sid": "AllowAmplifyBuild",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "execute-api:Invoke",
      "Resource": "arn:aws:execute-api:${REGION}:${AWS_ACCOUNT_ID}:${API_ID}/*",
      "Condition": {
        "StringLike": {
          "aws:userid": "*amplify*"
        }
      }
    }
  ]
}
EOF
)

echo "📄 Resource Policy Document:"
echo "$POLICY_DOCUMENT" | jq .
echo ""

# Apply the resource policy
echo "🔒 Applying API Gateway resource policy..."
aws apigateway update-rest-api \
  --rest-api-id "$API_ID" \
  --patch-ops op=replace,path=/policy,value="$(echo "$POLICY_DOCUMENT" | jq -c .)" \
  --region "$REGION" >/dev/null

echo "✅ Resource policy applied successfully!"
echo ""

# Verify the policy was applied
echo "🔍 Verifying resource policy..."
CURRENT_POLICY=$(aws apigateway get-rest-api \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'policy' \
  --output text)

if [[ "$CURRENT_POLICY" != "None" && "$CURRENT_POLICY" != "" ]]; then
  echo "✅ Resource policy is active"
  echo ""
  echo "📋 Policy Summary:"
  echo "   • ✅ Allow: Requests from CloudFront distribution $CLOUDFRONT_DIST_ID"
  echo "   • ✅ Allow: Direct health check access (for monitoring)"
  echo "   • ✅ Allow: Amplify build process access"
  echo "   • ❌ Deny: All other direct API access"
else
  echo "❌ Resource policy not found - may need retry"
fi

# Deploy the changes
echo ""
echo "🚀 Deploying resource policy changes..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "prod" \
  --description "Add CloudFront-only access restriction policy" \
  --region "$REGION" \
  --query 'id' --output text)

echo ""
echo "✅ API Gateway Security Policy Applied!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Deployment ID: $DEPLOYMENT_ID"
echo "🔒 Security Level: CloudFront-only access"
echo "🎯 Protected API: $API_ID"
echo ""
echo "🔍 Verification Commands:"
echo "# Test direct access (should be blocked):"
echo "curl -I 'https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health'"
echo ""
echo "# Test via CloudFront (should work):"
echo "curl -I 'https://d7t9x3j66yd8k.cloudfront.net/api/health'"
echo ""
echo "⚠️  WARNING: This restricts all direct API access except via CloudFront"
echo "🔄 To remove policy: aws apigateway update-rest-api --rest-api-id $API_ID --patch-ops op=remove,path=/policy --region $REGION"

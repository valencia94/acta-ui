#!/bin/bash
# API Gateway OPTIONS Integration Fix - CORS for Cognito Authentication
# Surgical intervention for live production deployment
set -euo pipefail

echo "🔧 API Gateway CORS OPTIONS Integration Fix"
echo "============================================="

API_ID="q2b9avfwv5"
STAGE="prod"
REGION="us-east-2"
CLOUDFRONT_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "📋 Configuration:"
echo "   API ID: $API_ID"
echo "   Stage: $STAGE"
echo "   Region: $REGION"
echo "   Allowed Origin: $CLOUDFRONT_ORIGIN"
echo ""

# Define all API resources that need CORS OPTIONS methods
declare -a RESOURCES=(
  "health"
  "check-document"
  "check-document/{projectId}"
  "timeline/{id}"
  "project-summary/{id}"
  "download-acta/{id}"
  "extract-project-place/{id}"
  "send-approval-email"
  "pm-manager/all-projects"
  "pm-manager/{pmEmail}"
  "upload-document"
  "projects"
  "projects/{id}"
)

echo "🎯 Resources to fix CORS:"
for resource in "${RESOURCES[@]}"; do
  echo "   • /$resource"
done
echo ""

# Function to add CORS OPTIONS method to a resource
add_cors_options() {
  local resource_path="$1"
  echo "🔧 Fixing CORS for: /$resource_path"
  
  # Get the resource ID for this path
  RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query "items[?path=='/${resource_path}'].id" \
    --output text)
  
  if [[ "$RESOURCE_ID" == "None" || -z "$RESOURCE_ID" ]]; then
    echo "   ❌ Resource not found: /$resource_path"
    return 1
  fi
  
  echo "   ✅ Found resource ID: $RESOURCE_ID"
  
  # Create/update OPTIONS method
  echo "   🔄 Setting up OPTIONS method..."
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION" >/dev/null 2>&1 || echo "   📝 OPTIONS method already exists"
  
  # Add MOCK integration for OPTIONS
  echo "   🔄 Setting up MOCK integration..."
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION" >/dev/null 2>&1
  
  # Add method response with CORS headers
  echo "   🔄 Setting up method response..."
  aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Origin": false,
      "method.response.header.Access-Control-Allow-Headers": false,
      "method.response.header.Access-Control-Allow-Methods": false,
      "method.response.header.Access-Control-Allow-Credentials": false
    }' \
    --response-models '{"application/json":"Empty"}' \
    --region "$REGION" >/dev/null 2>&1
  
  # Add integration response with actual CORS headers
  echo "   🎯 Setting up integration response (CRITICAL)..."
  aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Origin": "'\'''"$CLOUDFRONT_ORIGIN"'\''",
      "method.response.header.Access-Control-Allow-Headers": "'\''Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
      "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS,HEAD,PUT,DELETE'\''",
      "method.response.header.Access-Control-Allow-Credentials": "'\''true'\''"
    }' \
    --response-templates '{"application/json":""}' \
    --region "$REGION" >/dev/null 2>&1
  
  echo "   ✅ CORS configured for /$resource_path"
  echo ""
}

# Apply CORS to all resources
echo "🚀 Starting CORS configuration for all endpoints..."
echo ""

SUCCESS_COUNT=0
TOTAL_COUNT=${#RESOURCES[@]}

for resource in "${RESOURCES[@]}"; do
  if add_cors_options "$resource"; then
    ((SUCCESS_COUNT++))
  fi
done

echo "📊 CORS Configuration Summary:"
echo "   ✅ Successfully configured: $SUCCESS_COUNT/$TOTAL_COUNT resources"
echo ""

# Deploy changes to production stage
echo "🚀 Deploying changes to production stage..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE" \
  --description "CORS OPTIONS integration fix for Cognito authentication" \
  --region "$REGION" \
  --query 'id' --output text)

echo ""
echo "✅ API Gateway CORS Fix Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Deployment ID: $DEPLOYMENT_ID"
echo "🎯 Stage: $STAGE"
echo "🌐 CORS Origin: $CLOUDFRONT_ORIGIN"
echo ""
echo "🔍 Verification Commands:"
echo "# Test CORS preflight:"
echo "curl -H 'Origin: $CLOUDFRONT_ORIGIN' \\"
echo "     -H 'Access-Control-Request-Method: GET' \\"
echo "     -H 'Access-Control-Request-Headers: Authorization,Content-Type' \\"
echo "     -X OPTIONS \\"
echo "     'https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/health'"
echo ""
echo "⏳ Changes take 30-60 seconds to propagate"
echo "🧪 Test with authenticated requests from your React app after deployment"

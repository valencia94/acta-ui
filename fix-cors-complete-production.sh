#!/bin/bash
set -euo pipefail

# ACTA-UI Production CORS Fix - Complete Integration Response Setup
# Based on ChatGPT's systematic approach, customized for production

API_ID="q2b9avfwv5"
STAGE="prod"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🔧 Setting up complete CORS for ACTA-UI Production"
echo "📋 Configuration:"
echo "   API ID: $API_ID"
echo "   Stage: $STAGE"
echo "   Region: $REGION"
echo "   Production Origin: $PROD_ORIGIN"
echo ""

# Define ALL the resource paths that need CORS (from your frontend API calls)
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

echo "🎯 Resources to fix:"
for path in "${RESOURCES[@]}"; do
  echo "   • /$path"
done
echo ""

# Function to enable CORS on a specific resource path
add_cors_options() {
  local path=$1
  echo "🔧 Adding CORS to: /$path"

  # Get Resource ID for path
  RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
    --query "items[?path=='/${path}'].id" --output text)

  if [[ "$RESOURCE_ID" == "None" || -z "$RESOURCE_ID" ]]; then
    echo "   ❌ Could not find resource for path: /$path"
    return
  fi

  echo "   ✅ Found resource ID: $RESOURCE_ID"

  # Create OPTIONS method with mock integration (overwrite if exists)
  echo "   🔧 Creating OPTIONS method..."
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type "NONE" \
    --region "$REGION" >/dev/null 2>&1 || echo "   📝 OPTIONS method already exists"

  echo "   🔗 Setting up mock integration..."
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION" >/dev/null 2>&1

  echo "   📤 Configuring method response..."
  aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters 'method.response.header.Access-Control-Allow-Origin=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Credentials=true' \
    --response-models '{"application/json":"Empty"}' \
    --region "$REGION" >/dev/null 2>&1

  echo "   🎯 Setting up integration response (THE CRITICAL PART)..."
  aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Origin='$PROD_ORIGIN',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS,HEAD',method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',method.response.header.Access-Control-Allow-Credentials='true'" \
    --response-templates '{"application/json":""}' \
    --region "$REGION" >/dev/null 2>&1

  echo "   ✅ CORS fully configured for /$path"
  echo ""
}

# Loop through each path and apply CORS
echo "🚀 Starting CORS configuration..."
echo ""

for path in "${RESOURCES[@]}"; do
  add_cors_options "$path"
done

echo "🚀 Deploying changes to production stage..."
aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE" \
  --description "Complete CORS fix with Integration Response headers for production" \
  --region "$REGION" >/dev/null

echo ""
echo "🎉 ALL CORS OPTIONS METHODS APPLIED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CORS Headers Configured:"
echo "   • Access-Control-Allow-Origin: $PROD_ORIGIN"
echo "   • Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,HEAD"
echo "   • Access-Control-Allow-Headers: Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token"
echo "   • Access-Control-Allow-Credentials: true"
echo ""
echo "🔧 Fixed Endpoints:"
for path in "${RESOURCES[@]}"; do
  echo "   • /$path OPTIONS"
done
echo ""
echo "🧪 Test with:"
echo "curl -X OPTIONS 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health' \\"
echo "  -H 'Origin: $PROD_ORIGIN' \\"
echo "  -H 'Access-Control-Request-Method: GET' \\"
echo "  -H 'Access-Control-Request-Headers: Authorization' -v"
echo ""
echo "🌐 Your production app should now work at: $PROD_ORIGIN"

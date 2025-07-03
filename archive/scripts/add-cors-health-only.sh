#!/bin/bash

# Add CORS to ONE endpoint at a time - Starting with /health
# Simple, step-by-step approach

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🎯 Adding CORS to /health endpoint ONLY"
echo "======================================="
echo ""
echo "API ID: $API_ID"
echo "Region: $REGION"
echo "Origin: $PROD_ORIGIN"
echo ""

# Step 1: Get the health resource ID
echo "Step 1: Finding /health resource..."
HEALTH_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
    --query "items[?path=='/health'].id | [0]" --output text 2>/dev/null)

if [[ "$HEALTH_ID" == "None" || -z "$HEALTH_ID" ]]; then
    echo "❌ Could not find /health resource"
    exit 1
fi

echo "✅ Found /health resource ID: $HEALTH_ID"
echo ""

# Step 2: Delete existing OPTIONS method (clean slate)
echo "Step 2: Cleaning up existing OPTIONS method..."
aws apigateway delete-method \
    --rest-api-id "$API_ID" \
    --resource-id "$HEALTH_ID" \
    --http-method "OPTIONS" \
    --region "$REGION" 2>/dev/null && echo "✅ Deleted existing OPTIONS" || echo "📝 No existing OPTIONS to delete"
echo ""

# Step 3: Create OPTIONS method
echo "Step 3: Creating OPTIONS method..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$HEALTH_ID" \
    --http-method "OPTIONS" \
    --authorization-type "NONE" \
    --region "$REGION"
echo "✅ OPTIONS method created"
echo ""

# Step 4: Add mock integration
echo "Step 4: Adding mock integration..."
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$HEALTH_ID" \
    --http-method "OPTIONS" \
    --type "MOCK" \
    --request-templates '{"application/json":"{\"statusCode\":200}"}' \
    --region "$REGION"
echo "✅ Mock integration added"
echo ""

# Step 5: Add method response with headers
echo "Step 5: Adding method response headers..."
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$HEALTH_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Headers": true,
        "method.response.header.Access-Control-Allow-Credentials": true
    }' \
    --region "$REGION"
echo "✅ Method response headers defined"
echo ""

# Step 6: Add integration response with header mappings (THE CRITICAL PART)
echo "Step 6: Adding integration response header mappings..."
aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$HEALTH_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --response-parameters "{
        \"method.response.header.Access-Control-Allow-Origin\": \"'$PROD_ORIGIN'\",
        \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,OPTIONS,HEAD'\",
        \"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,Authorization'\",
        \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
    }" \
    --response-templates '{"application/json":"{}"}' \
    --region "$REGION"
echo "✅ Integration response mappings added"
echo ""

# Step 7: Deploy to production
echo "Step 7: Deploying to production..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "prod" \
    --description "Add CORS to /health endpoint" \
    --region "$REGION"
echo "✅ Deployed to production"
echo ""

echo "🎉 /health endpoint CORS configuration complete!"
echo ""
echo "🧪 Test with:"
echo "curl -X OPTIONS 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health' \\"
echo "  -H 'Origin: $PROD_ORIGIN' \\"
echo "  -H 'Access-Control-Request-Method: GET' -v"
echo ""
echo "✅ Expected: HTTP 200 with CORS headers"
echo "❌ If 500 error: Check response templates"
echo "❌ If no CORS headers: Check integration response mappings"

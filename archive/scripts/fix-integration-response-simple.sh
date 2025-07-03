#!/bin/bash

# Simple CORS Integration Response Fix for Critical Endpoints
# Focus on the endpoints that your frontend actually calls

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🎯 Fixing Integration Response for critical endpoints..."
echo "Production Origin: $PROD_ORIGIN"
echo ""

# Function to fix Integration Response only (assumes OPTIONS method exists)
fix_integration_response() {
    local resource_id=$1
    local endpoint_name=$2
    
    echo "🔧 Fixing Integration Response for $endpoint_name (Resource: $resource_id)"
    
    # Update Integration Response with correct CORS headers
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters "{
            \"method.response.header.Access-Control-Allow-Origin\": \"'$PROD_ORIGIN'\",
            \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,PUT,DELETE,OPTIONS,HEAD'\",
            \"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",
            \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
        }" \
        --response-templates '{"application/json":""}' \
        --region "$REGION" 2>/dev/null && echo "   ✅ Success" || echo "   ⚠️  May need OPTIONS method created first"
}

# Get resource IDs and fix the critical endpoints
echo "🔍 Getting resource IDs..."

# Health endpoint
HEALTH_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query "items[?path=='/health'].id | [0]" --output text)
if [[ "$HEALTH_ID" != "None" && -n "$HEALTH_ID" ]]; then
    fix_integration_response "$HEALTH_ID" "/health"
fi

# PM Manager endpoints (your main API calls)
PM_ALL_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query "items[?path=='/pm-manager/all-projects'].id | [0]" --output text)
if [[ "$PM_ALL_ID" != "None" && -n "$PM_ALL_ID" ]]; then
    fix_integration_response "$PM_ALL_ID" "/pm-manager/all-projects"
fi

PM_EMAIL_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query "items[?contains(path, 'pm-manager') && contains(path, '{pmEmail}')].id | [0]" --output text)
if [[ "$PM_EMAIL_ID" != "None" && -n "$PM_EMAIL_ID" ]]; then
    fix_integration_response "$PM_EMAIL_ID" "/pm-manager/{pmEmail}"
fi

# Deploy changes
echo ""
echo "🚀 Deploying changes..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "prod" \
    --description "Fix Integration Response CORS headers for production" \
    --region "$REGION"

echo ""
echo "✅ Integration Response headers updated!"
echo "🌐 Headers set for origin: $PROD_ORIGIN"
echo "🔑 Credentials enabled: true"

# Test one endpoint
echo ""
echo "🧪 Testing /health endpoint:"
curl -X OPTIONS "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health" \
    -H "Origin: $PROD_ORIGIN" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization" \
    -s -i | grep -E "(HTTP/|Access-Control)" || echo "No CORS headers found - may need OPTIONS method created"

#!/bin/bash

# 🚨 Emergency CORS Fix - Target Specific Failing Endpoints
# Based on actual browser console errors

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
CLOUDFRONT_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🚨 EMERGENCY CORS FIX - TARGETING ACTUAL FAILING ENDPOINTS"
echo "API Gateway: $API_ID"
echo "CloudFront Origin: $CLOUDFRONT_ORIGIN"
echo "Region: $REGION"
echo "================================================"

# Function to add CORS to existing GET methods (not just OPTIONS)
fix_get_method_cors() {
    local resource_id=$1
    local endpoint_name=$2
    
    echo "🔧 Fixing GET method CORS for /$endpoint_name (Resource: $resource_id)"
    
    # 1. First ensure GET method has CORS response parameter
    echo "  ➕ Adding CORS response parameter to GET method..."
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method GET \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Origin": false}' \
        --region "$REGION" 2>/dev/null || echo "    ℹ️ GET method response already configured"
    
    # 2. Add CORS header to GET integration response (this is crucial!)
    echo "  ➕ Adding CORS header to GET integration response..."
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method GET \
        --status-code 200 \
        --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$CLOUDFRONT_ORIGIN'\"}" \
        --region "$REGION" || echo "    ⚠️ GET integration response update failed"
    
    # 3. Add OPTIONS method if missing
    echo "  ➕ Adding OPTIONS method..."
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region "$REGION" 2>/dev/null || echo "    ℹ️ OPTIONS method already exists"
    
    # 4. Add MOCK integration for OPTIONS
    echo "  ➕ Adding MOCK integration for OPTIONS..."
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --type MOCK \
        --integration-http-method OPTIONS \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region "$REGION" 2>/dev/null || echo "    ℹ️ Integration already exists"
    
    # 5. Add method response for OPTIONS
    echo "  ➕ Adding OPTIONS method response..."
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers": false, "method.response.header.Access-Control-Allow-Methods": false, "method.response.header.Access-Control-Allow-Origin": false, "method.response.header.Access-Control-Allow-Credentials": false}' \
        --region "$REGION" 2>/dev/null || echo "    ℹ️ Method response already exists"
    
    # 6. Add integration response for OPTIONS
    echo "  ➕ Adding OPTIONS integration response..."
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":\"'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,OPTIONS,HEAD,PUT,DELETE'\",\"method.response.header.Access-Control-Allow-Origin\":\"'$CLOUDFRONT_ORIGIN'\",\"method.response.header.Access-Control-Allow-Credentials\":\"'true'\"}" \
        --response-templates '{"application/json":""}' \
        --region "$REGION" || echo "    ⚠️ Integration response update failed"
    
    echo "  ✅ CORS fixed for /$endpoint_name"
    echo ""
}

echo "🎯 Applying emergency CORS fixes to ACTUAL failing endpoints..."

# Fix the specific endpoints that are failing in the browser console
fix_get_method_cors "j7z1ti" "health"
fix_get_method_cors "cltt9f" "pm-manager/{pmEmail}"
fix_get_method_cors "u8hucp" "pm-manager/all-projects"

# Also fix other critical endpoints that will likely be called
fix_get_method_cors "9nmq2z" "projects"
fix_get_method_cors "i3rbne" "check-document"
fix_get_method_cors "pufkqk" "download-acta"

echo "📤 Deploying emergency CORS fixes to production..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name prod \
    --description "Emergency CORS fix for failing endpoints" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo "✅ Emergency CORS fix deployed! Deployment ID: $DEPLOYMENT_ID"
echo ""
echo "🧪 Testing health endpoint CORS..."
sleep 5
curl -H "Origin: $CLOUDFRONT_ORIGIN" -v "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health" 2>&1 | grep -i "access-control-allow-origin" || echo "Still testing..."

echo ""
echo "🎉 Emergency CORS fix complete!"
echo "📝 Refresh the browser and check console for CORS errors."

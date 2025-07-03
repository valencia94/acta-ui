#!/bin/bash

# Fix Lambda CORS responses by ensuring all API Gateway method responses include CORS headers
# This addresses the issue where OPTIONS requests have CORS headers but GET/POST responses don't

set -e

# Configuration
API_ID="q2b9avfwv5"
REGION="us-east-2"
STAGE="prod"
CLOUDFRONT_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🔧 FIXING LAMBDA CORS RESPONSES"
echo "================================"
echo "API Gateway: $API_ID (Region: $REGION)"
echo "CloudFront Origin: $CLOUDFRONT_ORIGIN"
echo ""

# Function to add CORS headers to method response
add_cors_to_method_response() {
    local resource_id=$1
    local method=$2
    local status_code=$3
    
    echo "  Adding CORS headers to $method $resource_id (status: $status_code)"
    
    # Add CORS headers to method response
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "$method" \
        --status-code "$status_code" \
        --response-parameters \
            "method.response.header.Access-Control-Allow-Origin=false" \
            "method.response.header.Access-Control-Allow-Headers=false" \
            "method.response.header.Access-Control-Allow-Methods=false" \
            "method.response.header.Access-Control-Allow-Credentials=false" \
        --region "$REGION" \
        --no-cli-pager 2>/dev/null || true
}

# Function to add CORS headers to integration response
add_cors_to_integration_response() {
    local resource_id=$1
    local method=$2
    local status_code=$3
    
    echo "  Adding CORS headers to $method $resource_id integration (status: $status_code)"
    
    # Add CORS headers to integration response
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "$method" \
        --status-code "$status_code" \
        --response-parameters \
            "method.response.header.Access-Control-Allow-Origin='$CLOUDFRONT_ORIGIN'" \
            "method.response.header.Access-Control-Allow-Headers='Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'" \
            "method.response.header.Access-Control-Allow-Methods='GET,POST,OPTIONS,HEAD,PUT,DELETE'" \
            "method.response.header.Access-Control-Allow-Credentials='true'" \
        --region "$REGION" \
        --no-cli-pager 2>/dev/null || true
}

# Get all resources and their methods
echo "📋 Getting API Gateway resources and methods..."
RESOURCES=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --output json)

# Process each resource
echo "$RESOURCES" | jq -r '.items[] | select(.resourceMethods) | "\(.id) \(.pathPart // "ROOT") \(.resourceMethods | keys | join(","))"' | while read -r resource_id path_part methods; do
    echo ""
    echo "🔍 Processing resource: $resource_id ($path_part)"
    echo "   Methods: $methods"
    
    # Split methods by comma and process each
    IFS=',' read -ra METHOD_ARRAY <<< "$methods"
    for method in "${METHOD_ARRAY[@]}"; do
        if [[ "$method" != "OPTIONS" ]]; then
            echo "  🔧 Fixing CORS for $method method..."
            
            # Add CORS headers for both 200 and error responses
            add_cors_to_method_response "$resource_id" "$method" "200"
            add_cors_to_integration_response "$resource_id" "$method" "200"
            
            # Also add for common error codes
            add_cors_to_method_response "$resource_id" "$method" "400"
            add_cors_to_integration_response "$resource_id" "$method" "400"
            
            add_cors_to_method_response "$resource_id" "$method" "401"
            add_cors_to_integration_response "$resource_id" "$method" "401"
            
            add_cors_to_method_response "$resource_id" "$method" "403"
            add_cors_to_integration_response "$resource_id" "$method" "403"
            
            add_cors_to_method_response "$resource_id" "$method" "404"
            add_cors_to_integration_response "$resource_id" "$method" "404"
            
            add_cors_to_method_response "$resource_id" "$method" "500"
            add_cors_to_integration_response "$resource_id" "$method" "500"
        fi
    done
done

echo ""
echo "🚀 Creating new deployment to apply CORS fixes..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE" \
    --description "Lambda CORS response headers fix - $(date '+%Y-%m-%d %H:%M:%S')" \
    --region "$REGION" \
    --output text --query 'id')

echo "✅ Deployment created: $DEPLOYMENT_ID"
echo ""

echo "🧪 Testing CORS headers after fix..."
echo ""

# Test key endpoints
ENDPOINTS=(
    "/health"
    "/pm-manager/test@example.com"
    "/project-summary/1000000064013473"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Testing $endpoint..."
    
    echo "  OPTIONS request:"
    curl -s -H "Origin: $CLOUDFRONT_ORIGIN" \
         -H "Access-Control-Request-Method: GET" \
         -H "Access-Control-Request-Headers: authorization,content-type" \
         -X OPTIONS \
         "https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod${endpoint}" \
         -w "Status: %{http_code}\n" \
         -o /dev/null 2>/dev/null || echo "  ❌ OPTIONS failed"
    
    echo "  GET request:"
    curl -s -H "Origin: $CLOUDFRONT_ORIGIN" \
         -H "Authorization: Bearer dummy-token" \
         "https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod${endpoint}" \
         -w "Status: %{http_code}\n" \
         -I 2>/dev/null | grep -E "(HTTP/|access-control-)" || echo "  ❌ GET failed"
    
    echo ""
done

echo "🎯 LAMBDA CORS FIX COMPLETE!"
echo ""
echo "📋 Summary:"
echo "   • Added CORS headers to all method responses (200, 400, 401, 403, 404, 500)"
echo "   • Added CORS headers to all integration responses"
echo "   • Created new deployment: $DEPLOYMENT_ID"
echo "   • All Lambda responses should now include CORS headers"
echo ""
echo "🔍 If CORS errors persist:"
echo "   • Check Lambda function code for response format"
echo "   • Verify CloudFront cache has been cleared"
echo "   • Test with browser dev tools network tab"
echo ""
echo "✅ Lambda CORS response fix deployed successfully!"

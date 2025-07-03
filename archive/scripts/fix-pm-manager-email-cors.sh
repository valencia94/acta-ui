#!/bin/bash

# Fix CORS for /pm-manager/{pmEmail} endpoint
set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
RESOURCE_PATH="/pm-manager/{pmEmail}"

echo "🔧 Fixing CORS for $RESOURCE_PATH endpoint..."

# Find the resource ID for /pm-manager/{pmEmail}
echo "📋 Finding resource ID for $RESOURCE_PATH..."
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION)

# Extract resource ID for pm-manager/{pmEmail}
PM_MANAGER_EMAIL_RESOURCE_ID=$(echo "$RESOURCES" | jq -r '.items[] | select(.pathPart == "{pmEmail}" and .parentId != null) | .id')

if [ -z "$PM_MANAGER_EMAIL_RESOURCE_ID" ] || [ "$PM_MANAGER_EMAIL_RESOURCE_ID" = "null" ]; then
    echo "❌ Could not find resource ID for $RESOURCE_PATH"
    echo "Available resources:"
    echo "$RESOURCES" | jq -r '.items[] | "\(.pathPart) - \(.id) - \(.path)"'
    exit 1
fi

echo "✅ Found resource ID: $PM_MANAGER_EMAIL_RESOURCE_ID"

# Check if OPTIONS method already exists
echo "🔍 Checking if OPTIONS method exists..."
OPTIONS_EXISTS=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $PM_MANAGER_EMAIL_RESOURCE_ID \
    --http-method OPTIONS \
    --region $REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$OPTIONS_EXISTS" = "NOT_FOUND" ]; then
    echo "🚀 Creating OPTIONS method..."
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $PM_MANAGER_EMAIL_RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION
    
    echo "📝 Creating OPTIONS method response..."
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $PM_MANAGER_EMAIL_RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Origin": false,
            "method.response.header.Access-Control-Allow-Headers": false,
            "method.response.header.Access-Control-Allow-Methods": false,
            "method.response.header.Access-Control-Allow-Credentials": false
        }' \
        --region $REGION
    
    echo "🔗 Creating OPTIONS integration..."
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $PM_MANAGER_EMAIL_RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --integration-http-method OPTIONS \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region $REGION
    
    echo "📤 Creating OPTIONS integration response..."
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $PM_MANAGER_EMAIL_RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Origin": "'\''https://d7t9x3j66yd8k.cloudfront.net'\''",
            "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''",
            "method.response.header.Access-Control-Allow-Methods": "'\''GET,OPTIONS'\''",
            "method.response.header.Access-Control-Allow-Credentials": "'\''true'\''"
        }' \
        --region $REGION
else
    echo "✅ OPTIONS method already exists"
fi

# Update GET method to include CORS headers in response
echo "🔧 Updating GET method response to include CORS headers..."

# First, check if the method response exists and has the headers
GET_METHOD_RESPONSE=$(aws apigateway get-method-response \
    --rest-api-id $API_ID \
    --resource-id $PM_MANAGER_EMAIL_RESOURCE_ID \
    --http-method GET \
    --status-code 200 \
    --region $REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$GET_METHOD_RESPONSE" = "NOT_FOUND" ]; then
    echo "❌ GET method response not found"
    exit 1
fi

# Update the method response to include CORS headers
aws apigateway update-method-response \
    --rest-api-id $API_ID \
    --resource-id $PM_MANAGER_EMAIL_RESOURCE_ID \
    --http-method GET \
    --status-code 200 \
    --patch-ops '[
        {
            "op": "add",
            "path": "/responseParameters/method.response.header.Access-Control-Allow-Origin",
            "value": "false"
        },
        {
            "op": "add", 
            "path": "/responseParameters/method.response.header.Access-Control-Allow-Credentials",
            "value": "false"
        }
    ]' \
    --region $REGION

# Update the integration response to include CORS headers
echo "📤 Updating GET integration response to include CORS headers..."
aws apigateway update-integration-response \
    --rest-api-id $API_ID \
    --resource-id $PM_MANAGER_EMAIL_RESOURCE_ID \
    --http-method GET \
    --status-code 200 \
    --patch-ops '[
        {
            "op": "add",
            "path": "/responseParameters/method.response.header.Access-Control-Allow-Origin",
            "value": "'\''https://d7t9x3j66yd8k.cloudfront.net'\''"
        },
        {
            "op": "add",
            "path": "/responseParameters/method.response.header.Access-Control-Allow-Credentials", 
            "value": "'\''true'\''"
        }
    ]' \
    --region $REGION

# Deploy the changes
echo "🚀 Deploying changes to prod stage..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --description "Fix CORS for /pm-manager/{pmEmail} endpoint with credentials support" \
    --region $REGION

echo "✅ CORS fix deployed successfully for $RESOURCE_PATH!"
echo "🧪 Testing in 5 seconds..."
sleep 5

# Test the OPTIONS request
echo "🧪 Testing OPTIONS request..."
curl -X OPTIONS "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/pm-manager/christian.valencia%40ikusi.com" \
    -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: authorization,content-type" \
    -v

echo ""
echo "🧪 Testing GET request (should return 401/403 but with CORS headers)..."
curl -I "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/pm-manager/christian.valencia%40ikusi.com" \
    -H "Origin: https://d7t9x3j66yd8k.cloudfront.net"

echo ""
echo "✅ CORS fix completed!"

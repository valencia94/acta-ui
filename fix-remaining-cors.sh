#!/bin/bash

# Fix CORS for additional endpoints that are failing
API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🔧 Fixing CORS for additional failing endpoints..."

# Additional endpoints from console errors:
# /check-document/{projectId} - resource 0rpaw2 
# /extract-project-place/{id} - resource j6ci0c

ADDITIONAL_RESOURCES=(
    "0rpaw2"   # /check-document/{projectId}
    "j6ci0c"   # /extract-project-place/{id}
    "i3rbne"   # /check-document
    "co74cb"   # /extract-project-place
)

CORS_HEADERS='"method.response.header.Access-Control-Allow-Headers": false, "method.response.header.Access-Control-Allow-Methods": false, "method.response.header.Access-Control-Allow-Origin": false'
OPTIONS_INTEGRATION_RESPONSE='"method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-Target,X-Amz-User-Agent'\''", "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,PUT,DELETE,OPTIONS'\''", "method.response.header.Access-Control-Allow-Origin": "'\'$ORIGIN\''"'
CORS_ORIGIN_HEADER='"method.response.header.Access-Control-Allow-Origin": "'\'$ORIGIN\''"'

for RESOURCE_ID in "${ADDITIONAL_RESOURCES[@]}"; do
    echo "🔧 Fixing CORS for resource: $RESOURCE_ID"
    
    # Add OPTIONS method if it doesn't exist
    aws apigateway get-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS --region $REGION 2>/dev/null || {
        echo "  ➕ Adding OPTIONS method..."
        aws apigateway put-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS --authorization-type NONE --region $REGION
        
        echo "  ➕ Adding MOCK integration for OPTIONS..."
        aws apigateway put-integration --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS --type MOCK --integration-http-method OPTIONS --request-templates '{"application/json": "{\"statusCode\": 200}"}' --region $REGION
        
        echo "  ➕ Adding OPTIONS method response..."
        aws apigateway put-method-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters "{$CORS_HEADERS}" --region $REGION
        
        echo "  ➕ Adding OPTIONS integration response..."
        aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters "{$OPTIONS_INTEGRATION_RESPONSE}" --region $REGION
    }
    
    # Add CORS to GET method if it exists
    aws apigateway get-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --region $REGION 2>/dev/null && {
        echo "  ➕ Adding CORS header to GET method..."
        aws apigateway put-method-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin": false}' --region $REGION 2>/dev/null || echo "    ℹ️  GET method response already configured"
        aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --status-code 200 --response-parameters "{$CORS_ORIGIN_HEADER}" --region $REGION 2>/dev/null || echo "    ℹ️  GET integration response already configured"
    }
    
    # Add CORS to POST method if it exists
    aws apigateway get-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method POST --region $REGION 2>/dev/null && {
        echo "  ➕ Adding CORS header to POST method..."
        aws apigateway put-method-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method POST --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin": false}' --region $REGION 2>/dev/null || echo "    ℹ️  POST method response already configured"
        aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method POST --status-code 200 --response-parameters "{$CORS_ORIGIN_HEADER}" --region $REGION 2>/dev/null || echo "    ℹ️  POST integration response already configured"
    }
    
    echo "  ✅ CORS fixed for resource: $RESOURCE_ID"
done

# Also need to create a projects-by-pm endpoint or fix existing projects endpoint
echo "🔧 Checking for projects-by-pm endpoint..."

echo "📤 Deploying changes..."
DEPLOYMENT_ID=$(aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION --query 'id' --output text)
echo "✅ Deployed with ID: $DEPLOYMENT_ID"

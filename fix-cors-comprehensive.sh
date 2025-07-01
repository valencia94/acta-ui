#!/bin/bash

# Comprehensive CORS Fix for API Gateway
API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🔧 Comprehensive CORS Fix for API Gateway: $API_ID"
echo "================================================"

# Common CORS headers
CORS_HEADERS='"method.response.header.Access-Control-Allow-Headers": false, "method.response.header.Access-Control-Allow-Methods": false, "method.response.header.Access-Control-Allow-Origin": false'
OPTIONS_INTEGRATION_RESPONSE='"method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-Target,X-Amz-User-Agent'\''", "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,PUT,DELETE,OPTIONS'\''", "method.response.header.Access-Control-Allow-Origin": "'\'$ORIGIN\''"'
CORS_ORIGIN_HEADER='"method.response.header.Access-Control-Allow-Origin": "'\'$ORIGIN\''"'

# List of resources that need CORS
RESOURCES=(
    "j7z1ti"   # /health
    "cltt9f"   # /pm-manager/{pmEmail}
    "u8hucp"   # /pm-manager/all-projects
    "9nmq2z"   # /projects
)

for RESOURCE_ID in "${RESOURCES[@]}"; do
    echo "🔧 Fixing CORS for resource: $RESOURCE_ID"
    
    # Check if OPTIONS method exists, if not create it
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
    
    # Add CORS header to existing GET method
    echo "  ➕ Adding CORS header to GET method response..."
    aws apigateway put-method-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin": false}' --region $REGION 2>/dev/null || echo "    ℹ️  GET method response already exists or not needed"
    
    echo "  ➕ Adding CORS header to GET integration response..."
    aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --status-code 200 --response-parameters "{$CORS_ORIGIN_HEADER}" --region $REGION 2>/dev/null || echo "    ℹ️  GET integration response already exists"
    
    echo "  ✅ CORS fixed for resource: $RESOURCE_ID"
done

echo "📤 Deploying changes to production..."
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION

echo "✅ CORS fix complete! Deployment ID: $(aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION --query 'id' --output text)"
echo "⏰ Wait 30-60 seconds for CloudFront cache to clear..."

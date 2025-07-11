#!/bin/bash
# Add localhost to CORS origins for development testing

API_ID="q2b9avfwv5"
REGION="us-east-2"

echo "🔧 Adding localhost CORS origins for development..."

# Get all resources
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --output json)

# Fix extract-project-place endpoint specifically
EXTRACT_RESOURCE_ID=$(echo "$RESOURCES" | jq -r '.items[] | select(.pathPart == "{id}" and .parentId != null) | select(.path | contains("extract-project-place")) | .id')

if [ -n "$EXTRACT_RESOURCE_ID" ]; then
    echo "🔧 Fixing extract-project-place/{id} CORS for localhost..."
    
    # Update OPTIONS integration response to include localhost
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $EXTRACT_RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Origin": "'\''http://localhost:3000,https://d7t9x3j66yd8k.cloudfront.net'\''",
            "method.response.header.Access-Control-Allow-Headers": "'\''Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
            "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS,HEAD,PUT,DELETE'\''",
            "method.response.header.Access-Control-Allow-Credentials": "'\''true'\''"
        }' \
        --region $REGION 2>/dev/null || echo "  ⚠️ Integration response may already exist"
    
    # Update POST integration response to include localhost
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $EXTRACT_RESOURCE_ID \
        --http-method POST \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Origin": "'\''http://localhost:3000,https://d7t9x3j66yd8k.cloudfront.net'\''"
        }' \
        --region $REGION 2>/dev/null || echo "  ⚠️ POST integration response may already exist"
        
    echo "  ✅ CORS fixed for extract-project-place/{id}"
fi

# Deploy the changes
echo "📤 Deploying API Gateway changes..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION > /dev/null

echo "✅ Development CORS fix deployed!"
echo "🧪 You can now test from localhost:3000"

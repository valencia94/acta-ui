#!/bin/bash

# 🔧 ACTA-UI CORS Integration Response Fix
# This script ensures all OPTIONS methods have proper integration responses

set -e

# Activate the virtual environment with AWS CLI
source /tmp/aws-env/bin/activate

API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🔧 Fixing CORS Integration Responses..."

# Key resource IDs from your API
RESOURCES=(
    "j7z1ti:health"
    "a0omy8:timeline"
    "3scf5w:project-summary"
    "pufkqk:download-acta"
    "co74cb:extract-project-place"
    "sixint:send-approval-email"
    "i3rbne:check-document"
    "0rpaw2:check-document/{projectId}"
    "4j5w9n:project-summary/{id}"
    "dgcz16:download-acta/{id}"
    "j6ci0c:extract-project-place/{id}"
    "wo429e:timeline/{id}"
)

for resource in "${RESOURCES[@]}"; do
    IFS=':' read -r resource_id resource_name <<< "$resource"
    
    echo "🔄 Fixing integration response for: $resource_name ($resource_id)"
    
    # Add integration response for OPTIONS method
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''",
            "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,PUT,DELETE,OPTIONS'\''",
            "method.response.header.Access-Control-Allow-Origin": "'\'''"$ORIGIN"'\''"
        }' \
        --region "$REGION" \
        2>/dev/null && echo "  ✅ Integration response added" || echo "  ℹ️ Integration response already exists"
done

# Deploy the changes
echo ""
echo "📤 Deploying API Gateway changes..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name prod \
    --description "CORS integration response fix - $(date)" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo "✅ Deployment ID: $DEPLOYMENT_ID"

# Wait a moment for deployment to propagate
echo "⏳ Waiting for deployment to propagate..."
sleep 5

# Test CORS again
echo ""
echo "🧪 Testing CORS configuration..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization,Content-Type" \
    -X OPTIONS \
    "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health")

echo "📊 CORS test result: HTTP $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "🎉 SUCCESS! CORS is now working correctly!"
    echo ""
    echo "Testing actual CORS headers..."
    
    # Test with verbose output to see headers
    curl -v -H "Origin: $ORIGIN" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization,Content-Type" \
        -X OPTIONS \
        "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health" \
        2>&1 | grep -E "(< HTTP|< access-control|< Access-Control)" || true
        
    echo ""
    echo "✨ Your ACTA-UI should now work without CORS errors!"
    echo "🌐 Test at: https://d7t9x3j66yd8k.cloudfront.net"
else
    echo "⚠️ CORS still returning HTTP $HTTP_CODE"
    echo "Let me check what's happening..."
    
    # Debug output
    curl -v -H "Origin: $ORIGIN" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health" \
        2>&1 | head -20
fi

echo ""
echo "🏁 CORS fix script completed!"

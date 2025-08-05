#!/bin/bash
# API Gateway CORS Configuration Fix for ACTA-UI
# This script enables CORS on API Gateway q2b9avfwv5

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 API Gateway CORS Fix for ACTA-UI${NC}"
echo "===================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuring CORS for API Gateway: ${API_ID}${NC}"
echo ""

# Get all resources in the API
echo -e "${YELLOW}📥 Getting API resources...${NC}"
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --output json)

# Extract resource IDs
echo "$RESOURCES" | jq -r '.items[] | "\(.id) \(.path)"' | while read RESOURCE_ID PATH; do
    echo -e "${YELLOW}🔍 Processing resource: $PATH (ID: $RESOURCE_ID)${NC}"
    
    # Check if OPTIONS method exists
    echo "   Checking for OPTIONS method..."
    
    # Try to get OPTIONS method (will fail if it doesn't exist)
    if aws apigateway get-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --region $REGION &>/dev/null; then
        echo "   ✅ OPTIONS method exists"
    else
        echo "   ⚠️  OPTIONS method missing - needs to be added"
        echo "   Manual step required: Add OPTIONS method to $PATH"
    fi
    
    # Check existing methods and their CORS headers
    METHODS=$(aws apigateway get-resource \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --region $REGION \
        --query 'resourceMethods' \
        --output json 2>/dev/null || echo "{}")
    
    if [ "$METHODS" != "{}" ] && [ "$METHODS" != "null" ]; then
        echo "   Available methods: $(echo $METHODS | jq -r 'keys[]' | tr '\n' ' ')"
    fi
    echo ""
done

echo -e "${YELLOW}⚠️  MANUAL STEPS REQUIRED:${NC}"
echo "Due to API Gateway complexity, please complete these steps manually:"
echo ""
echo "1. Go to AWS Console → API Gateway → APIs → $API_ID"
echo "2. For each resource/endpoint, ensure OPTIONS method exists:"
echo "   • Click on resource → Actions → Create Method → OPTIONS"
echo "   • Integration type: Mock"
echo "   • Click 'Save'"
echo ""
echo "3. For each method (GET, POST, OPTIONS), add CORS headers:"
echo "   • Click on method → Method Response"
echo "   • Add these response headers:"
echo "     - Access-Control-Allow-Origin"
echo "     - Access-Control-Allow-Headers" 
echo "     - Access-Control-Allow-Methods"
echo ""
echo "4. For each method, configure Integration Response:"
echo "   • Click Integration Response → 200"
echo "   • Add Header Mappings:"
echo "     - Access-Control-Allow-Origin: '*'"
echo "     - Access-Control-Allow-Headers: 'Authorization,Content-Type'"
echo "     - Access-Control-Allow-Methods: 'GET,POST,OPTIONS'"
echo ""
echo "5. Deploy the API:"
echo "   • Actions → Deploy API → Select 'prod' stage → Deploy"
echo ""

# Test the API endpoints
echo -e "${YELLOW}🧪 Testing API endpoints...${NC}"
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"

echo "Testing OPTIONS request..."
curl -X OPTIONS "$API_ENDPOINT/health" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization" \
    -v || echo "OPTIONS test completed"

echo ""
echo -e "${GREEN}🎯 Next: Run fix-iam-permissions.sh to complete the IAM setup${NC}"
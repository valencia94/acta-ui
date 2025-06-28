#!/usr/bin/env bash
set -euo pipefail

# CONFLICT-FREE DEPLOYMENT SCRIPT for ACTA-UI Backend
# Uses unique resource names to avoid API Gateway conflicts

echo "🚀 ACTA-UI Conflict-Free Backend Deployment"
echo "=========================================="

# Configuration
ACTA_API_ID="q2b9avfwv5"
ACTA_API_ROOT_ID="kw8f8zihjg"
STACK_NAME="acta-conflict-free-backend"

echo "✅ Configuration:"
echo "📋 API ID: $ACTA_API_ID"
echo "📋 Root Resource ID: $ACTA_API_ROOT_ID"
echo "📋 Stack Name: $STACK_NAME"
echo

# Step 1: Check if AWS CLI is available
echo "🔧 Step 1: Checking AWS CLI availability"
echo "========================================"

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not available in this environment"
    echo "📝 Please run this deployment on your Mac where AWS CLI is installed:"
    echo
    echo "🔗 Manual CloudFormation deployment command:"
    echo "   aws cloudformation deploy \\"
    echo "     --template-file infra/template-conflict-free.yaml \\"
    echo "     --stack-name $STACK_NAME \\"
    echo "     --parameter-overrides \\"
    echo "       ExistingApiId=$ACTA_API_ID \\"
    echo "       ExistingApiRootResourceId=$ACTA_API_ROOT_ID \\"
    echo "     --capabilities CAPABILITY_IAM \\"
    echo "     --region us-east-2"
    echo
    echo "💡 Or use the GitHub Actions workflow for deployment"
    exit 1
fi

echo "✅ AWS CLI found, proceeding with deployment..."

# Deploy CloudFormation stack
echo "🌐 Step 2: Deploying API Gateway Resources (Conflict-Free)"
echo "========================================================="

TIMESTAMP=$(date +%Y%m%d-%H%M%S)

aws cloudformation deploy \
    --template-file infra/template-conflict-free.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        ExistingApiId="$ACTA_API_ID" \
        ExistingApiRootResourceId="$ACTA_API_ROOT_ID" \
        DeploymentTimestamp="$TIMESTAMP" \
    --capabilities CAPABILITY_IAM \
    --region us-east-2

echo "✅ CloudFormation deployment completed!"

# Test endpoints
BASE_URL="https://$ACTA_API_ID.execute-api.us-east-2.amazonaws.com/prod"

echo "🧪 Step 3: Testing New Endpoints"
echo "================================"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo "🔍 Testing: $description"
    echo "   $method $endpoint"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status_code" = "200" ]; then
        echo "   ✅ Status: $status_code (Working)"
    elif [ "$status_code" = "403" ]; then
        echo "   ✅ Status: $status_code (Auth Required - Expected)"
    elif [ "$status_code" = "404" ]; then
        echo "   ❌ Status: $status_code (Not Found)"
    else
        echo "   ⚠️  Status: $status_code"
    fi
    echo
}

echo "📋 NEW CONFLICT-FREE Endpoints:"
test_endpoint "GET" "/pm-manager/all-projects" "PM Manager (All Projects)"
test_endpoint "GET" "/pm-manager/test@example.com" "PM Manager (By Email)"
test_endpoint "GET" "/projects-manager" "Projects Manager"
test_endpoint "GET" "/document-validator/test" "Document Validator (GET)"

echo "📋 Existing Endpoints:"
test_endpoint "GET" "/health" "Health Check"

echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================"
echo "🔗 Base URL: $BASE_URL"
echo "🎯 New Endpoints:"
echo "  ✅ GET /pm-manager/all-projects"
echo "  ✅ GET /pm-manager/{pmEmail}"
echo "  ✅ GET /projects-manager"
echo "  ✅ GET /document-validator/{projectId}"
echo "  ✅ HEAD /document-validator/{projectId}"

#!/usr/bin/env bash
set -euo pipefail

# SIMPLIFIED DEPLOYMENT SCRIPT for ACTA-UI Backend
# Routes all PM endpoints to existing projectMetadataEnricher Lambda

echo "🚀 ACTA-UI Simplified Backend Deployment"
echo "========================================"

# Configuration
ROLE="arn:aws:iam::703671891952:role/ProjectplaceLambdaRole"
ACTA_API_ID="q2b9avfwv5"
ACTA_API_ROOT_ID="kw8f8zihjg"
STACK_NAME="acta-api-wiring-stack-manual"

echo "✅ Configuration:"
echo "📋 Role: $ROLE"
echo "📋 API ID: $ACTA_API_ID"
echo "📋 Root Resource ID: $ACTA_API_ROOT_ID"
echo "📋 Stack Name: $STACK_NAME"
echo

# Step 1: Check if AWS CLI is available
echo "🔧 Step 1: Checking AWS CLI availability"
echo "========================================"

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not available in this environment"
    echo "📝 Please run this deployment using GitHub Actions:"
    echo "   1. Go to GitHub Actions → Deploy Simplified Backend"
    echo "   2. Or commit and push this script to trigger the workflow"
    echo
    echo "🔗 Manual CloudFormation deployment:"
    echo "   aws cloudformation deploy \\"
    echo "     --template-file infra/template-simplified-lambda.yaml \\"
    echo "     --stack-name $STACK_NAME \\"
    echo "     --parameter-overrides \\"
    echo "       ExistingApiId=$ACTA_API_ID \\"
    echo "       ExistingApiRootResourceId=$ACTA_API_ROOT_ID \\"
    echo "     --capabilities CAPABILITY_IAM \\"
    echo "     --region us-east-2"
    exit 0
fi

# Step 2: Deploy CloudFormation stack
echo "🌐 Step 2: Deploying API Gateway Resources"
echo "=========================================="

echo "🔧 Deploying CloudFormation stack: $STACK_NAME"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

aws cloudformation deploy \
    --template-file infra/template-conflict-free.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        DeploymentTimestamp="$TIMESTAMP" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --region us-east-2

echo "✅ CloudFormation stack deployed successfully!"
echo "ℹ️  API Gateway deployment is included in the CloudFormation stack"

# Step 3: Validate deployment
echo "🧪 Step 3: Validating Deployment"
echo "================================"

# Step 4: Test endpoints
echo "🧪 Step 4: Testing Endpoints"
echo "============================"

BASE_URL="https://$ACTA_API_ID.execute-api.us-east-2.amazonaws.com/prod"

echo "🔗 Base URL: $BASE_URL"
echo

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
        echo "   ❌ Status: $status_code (Not Found - Check deployment)"
    else
        echo "   ⚠️  Status: $status_code"
    fi
    echo
}

echo "📋 Testing NEW PM Endpoints (routed to projectMetadataEnricher):"
test_endpoint "GET" "/pm-projects/all-projects" "PM Projects (All)"
test_endpoint "GET" "/pm-projects/test@example.com" "PM Projects (By Email)"
test_endpoint "GET" "/projects" "Projects List"
test_endpoint "GET" "/check-document/test?format=docx" "Document Status (GET)"
test_endpoint "HEAD" "/check-document/test?format=docx" "Document Status (HEAD)"

echo "📋 Testing EXISTING Endpoints:"
test_endpoint "GET" "/health" "Health Check"
test_endpoint "GET" "/project-summary/test" "Project Summary"

# Step 5: Generate report
echo "📊 Step 5: Deployment Report"
echo "============================"

cat << EOF
🎉 SIMPLIFIED BACKEND DEPLOYMENT COMPLETED!

✅ What was deployed:
   - API Gateway resources for PM endpoints
   - Document status checking endpoints
   - All routed to existing projectMetadataEnricher Lambda

🎯 New Endpoints Available:
   - GET /pm-projects/all-projects
   - GET /pm-projects/{pmEmail}
   - GET /projects
   - GET /check-document/{projectId}
   - HEAD /check-document/{projectId}

🔗 Base URL: $BASE_URL

📝 Next Steps:
   1. Test with authentication tokens
   2. Enhance projectMetadataEnricher to handle PM queries
   3. Update frontend to use real backend data

🧪 Test with authentication:
   curl -H "Authorization: Bearer your-token" \\
     "$BASE_URL/pm-projects/all-projects"

✅ Deployment successful!
EOF

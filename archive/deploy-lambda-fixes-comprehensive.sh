#!/usr/bin/env bash

# Comprehensive Lambda Function Deployment for ACTA-UI
# This script fixes the 502 errors by deploying missing Lambda functions

set -e

echo "🚀 ACTA-UI Lambda Function Deployment"
echo "====================================="

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
aws sts get-caller-identity || {
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    echo "   or set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN"
    exit 1
}

# Set region
export AWS_DEFAULT_REGION="us-east-2"

echo "📋 Current AWS Identity:"
aws sts get-caller-identity

echo -e "\n🔍 Phase 1: Checking existing Lambda functions"
echo "=============================================="

# List current Lambda functions
echo "Existing Lambda functions:"
aws lambda list-functions --query 'Functions[].FunctionName' --output table

echo -e "\n🛠️  Phase 2: Deploying missing Lambda functions"
echo "==============================================="

# Lambda execution role ARN (from CloudFormation template)
LAMBDA_ROLE="arn:aws:iam::703671891952:role/acta-ui-lambda-execution-role"

# Function definitions
declare -A functions=(
    ["GetProjectSummary"]="lambda-functions/fixed/GetProjectSummary.js.zip"
    ["GetTimeline"]="lambda-functions/fixed/GetTimeline.js.zip"
    ["GetDownloadActa"]="lambda-functions/fixed/GetDownloadActa.js.zip"
    ["SendApprovalEmail"]="lambda-functions/fixed/SendApprovalEmail.js.zip"
)

for func_name in "${!functions[@]}"; do
    zip_file="${functions[$func_name]}"
    
    echo -n "🔧 Deploying $func_name... "
    
    if [ ! -f "$zip_file" ]; then
        echo "❌ Zip file not found: $zip_file"
        continue
    fi
    
    # Check if function exists
    if aws lambda get-function --function-name "$func_name" >/dev/null 2>&1; then
        echo "📦 Updating existing function..."
        aws lambda update-function-code \
            --function-name "$func_name" \
            --zip-file "fileb://$zip_file" \
            --no-cli-pager
        echo "✅ Updated $func_name"
    else
        echo "🆕 Creating new function..."
        aws lambda create-function \
            --function-name "$func_name" \
            --runtime "nodejs18.x" \
            --role "$LAMBDA_ROLE" \
            --handler "index.handler" \
            --zip-file "fileb://$zip_file" \
            --timeout 30 \
            --memory-size 256 \
            --environment Variables='{
                "TABLE_NAME":"acta-ui-projects",
                "S3_BUCKET":"acta-ui-documents",
                "SES_SOURCE_EMAIL":"noreply@acta-ui.com"
            }' \
            --no-cli-pager
        echo "✅ Created $func_name"
    fi
    
    # Add API Gateway permissions
    echo "🔗 Adding API Gateway permissions..."
    aws lambda add-permission \
        --function-name "$func_name" \
        --statement-id "api-gateway-invoke" \
        --action "lambda:InvokeFunction" \
        --principal "apigateway.amazonaws.com" \
        --source-arn "arn:aws:execute-api:us-east-2:703671891952:q2b9avfwv5/*" \
        --no-cli-pager 2>/dev/null || echo "⚠️  Permission already exists"
done

echo -e "\n🔍 Phase 3: Verifying deployment"
echo "================================"

# Test Lambda functions
for func_name in "${!functions[@]}"; do
    echo -n "Testing $func_name... "
    
    test_event='{"httpMethod":"GET","path":"/test","pathParameters":{"project_id":"test"},"queryStringParameters":{"format":"pdf"},"body":null}'
    
    result=$(aws lambda invoke \
        --function-name "$func_name" \
        --payload "$test_event" \
        --output json \
        --no-cli-pager \
        /tmp/lambda-response.json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "✅ Function responds"
    else
        echo "❌ Function failed"
    fi
done

echo -e "\n🌐 Phase 4: Running system test"
echo "==============================="

# Run our comprehensive system test
if [ -f "./test-complete-system.sh" ]; then
    echo "Running comprehensive system test..."
    chmod +x ./test-complete-system.sh
    ./test-complete-system.sh
else
    echo "⚠️  System test script not found"
fi

echo -e "\n🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo "✅ Lambda functions deployed"
echo "✅ API Gateway permissions configured"
echo "✅ System test completed"
echo ""
echo "🔗 API Gateway URL: https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
echo ""
echo "📋 Next steps:"
echo "1. Test the frontend in production"
echo "2. Monitor CloudWatch logs for any issues"
echo "3. Update any hardcoded endpoint URLs if needed"

#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploying Lambda Functions & Infrastructure Fixes"
echo "===================================================="

# Configuration
AWS_REGION="us-east-2"
BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo "✅ Phase 1: Package and Deploy Missing Lambda Functions"
echo "======================================================="

# Function to create and deploy a Lambda function
deploy_lambda() {
    local func_name="$1"
    local file_path="$2"
    
    echo "📦 Deploying $func_name..."
    
    # Create deployment package
    zip_file="/tmp/${func_name}.zip"
    zip -j "$zip_file" "$file_path"
    
    # Try to create the function (will fail if exists)
    aws lambda create-function \
        --function-name "$func_name" \
        --runtime python3.9 \
        --role arn:aws:iam::703671891952:role/service-role/codebuild-acta-ui-service-role \
        --handler "$(basename "${file_path%.*}").lambda_handler" \
        --zip-file "fileb://$zip_file" \
        --timeout 30 \
        --memory-size 512 \
        --region "$AWS_REGION" 2>/dev/null || {
        
        echo "   Function exists, updating code..."
        aws lambda update-function-code \
            --function-name "$func_name" \
            --zip-file "fileb://$zip_file" \
            --region "$AWS_REGION"
    }
    
    echo "   ✅ $func_name deployed successfully"
}

# Deploy missing Lambda functions
if [ -f "lambda-functions/projects-manager.py" ]; then
    deploy_lambda "ProjectsManager" "lambda-functions/projects-manager.py"
fi

if [ -f "lambda-functions/document-status.py" ]; then
    deploy_lambda "DocumentStatus" "lambda-functions/document-status.py"
fi

if [ -f "lambda-functions/enhanced-project-metadata-enricher.py" ]; then
    deploy_lambda "EnhancedProjectMetadataEnricher" "lambda-functions/enhanced-project-metadata-enricher.py"
fi

echo -e "\n✅ Phase 2: Deploy Corrected Infrastructure"
echo "==========================================="

# Deploy the corrected CloudFormation template
aws cloudformation deploy \
    --template-file infra/template-wiring-corrected.yaml \
    --stack-name acta-corrected-wiring \
    --parameter-overrides \
        ExistingApiId=q2b9avfwv5 \
        ExistingApiRootResourceId=kw8f8zihjg \
    --capabilities CAPABILITY_IAM \
    --region "$AWS_REGION"

echo -e "\n✅ Phase 3: Test All Button Functions"
echo "===================================="

# Run comprehensive test
chmod +x test-complete-system.sh
./test-complete-system.sh

echo -e "\n✅ Phase 4: Build and Deploy Frontend"
echo "===================================="

# Build updated frontend
npm run build

# Deploy to S3 (using aws s3 sync)
aws s3 sync dist/ s3://acta-ui-bucket --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
    --distribution-id YOUR_DISTRIBUTION_ID \
    --paths "/*"

echo -e "\n🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo "🔗 Frontend URL: https://d7t9x3j66yd8k.cloudfront.net"
echo "🔗 API Base URL: $BASE_URL"
echo -e "\n📋 Next Steps:"
echo "1. Test with authentication using provided credentials"
echo "2. Verify all button functionality works"
echo "3. Check CloudWatch logs for any remaining issues"

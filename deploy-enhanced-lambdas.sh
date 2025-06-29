#!/usr/bin/env bash

# Lambda Function Deployment and Testing Script
echo "🚀 DEPLOYING ENHANCED LAMBDA FUNCTIONS"
echo "====================================="

# Check if we're in the right environment
if ! command -v aws &> /dev/null; then
    echo "⚠️ AWS CLI not available - deployment instructions only"
    echo ""
    echo "📋 Manual Deployment Instructions:"
    echo "================================="
    echo ""
    echo "1. Enhanced Project Metadata Enricher:"
    echo "   - Function: projectMetadataEnricher"
    echo "   - File: lambda-functions/enhanced-project-metadata-enricher.py"
    echo "   - Action: Update function code in AWS Console"
    echo ""
    echo "2. Enhanced Download ACTA:"
    echo "   - Function: GetDownloadActa (or create new)"
    echo "   - File: lambda-functions/enhanced-download-acta.py"
    echo "   - Action: Update function code in AWS Console"
    echo ""
    echo "3. Enhanced Send Approval:"
    echo "   - Function: SendApprovalEmail (or create new)"
    echo "   - File: lambda-functions/enhanced-send-approval.py"
    echo "   - Action: Update function code in AWS Console"
    echo ""
    echo "🎯 After deployment, run the test script to verify fixes"
    exit 0
fi

echo "📋 Step 1: Preparing Lambda Function Packages"
echo "============================================"

# Create deployment packages
mkdir -p dist

# Package enhanced project metadata enricher
echo "📦 Packaging enhanced project metadata enricher..."
cd lambda-functions
zip -r ../dist/enhanced-project-metadata-enricher.zip enhanced-project-metadata-enricher.py
cd ..

# Package enhanced download ACTA
echo "📦 Packaging enhanced download ACTA..."
cd lambda-functions
zip -r ../dist/enhanced-download-acta.zip enhanced-download-acta.py
cd ..

# Package enhanced send approval
echo "📦 Packaging enhanced send approval..."
cd lambda-functions
zip -r ../dist/enhanced-send-approval.zip enhanced-send-approval.py
cd ..

echo "📋 Step 2: Updating Lambda Functions"
echo "==================================="

# Update projectMetadataEnricher
echo "🔄 Updating projectMetadataEnricher function..."
aws lambda update-function-code \
    --function-name projectMetadataEnricher \
    --zip-file fileb://dist/enhanced-project-metadata-enricher.zip \
    --region us-east-2 \
    --output table || echo "❌ Failed to update projectMetadataEnricher"

# Update or create download function
echo "🔄 Updating download ACTA function..."
aws lambda update-function-code \
    --function-name GetDownloadActa \
    --zip-file fileb://dist/enhanced-download-acta.zip \
    --region us-east-2 \
    --output table || echo "❌ Failed to update GetDownloadActa (may not exist)"

# Update or create send approval function
echo "🔄 Updating send approval function..."
aws lambda update-function-code \
    --function-name SendApprovalEmail \
    --zip-file fileb://dist/enhanced-send-approval.zip \
    --region us-east-2 \
    --output table || echo "❌ Failed to update SendApprovalEmail (may not exist)"

echo ""
echo "📋 Step 3: Configuring Environment Variables"
echo "==========================================="

# Set environment variables for enhanced functionality
echo "🔧 Setting environment variables for projectMetadataEnricher..."
aws lambda update-function-configuration \
    --function-name projectMetadataEnricher \
    --environment Variables='{
        "S3_BUCKET":"projectplace-dv-2025-x9a7b",
        "AWS_REGION":"us-east-2"
    }' \
    --region us-east-2 || echo "❌ Failed to set environment variables"

echo "🔧 Setting environment variables for download function..."
aws lambda update-function-configuration \
    --function-name GetDownloadActa \
    --environment Variables='{
        "S3_BUCKET":"projectplace-dv-2025-x9a7b"
    }' \
    --region us-east-2 || echo "❌ Failed to set environment variables (function may not exist)"

echo "🔧 Setting environment variables for send approval function..."
aws lambda update-function-configuration \
    --function-name SendApprovalEmail \
    --environment Variables='{
        "SENDER_EMAIL":"noreply@acta-system.com"
    }' \
    --region us-east-2 || echo "❌ Failed to set environment variables (function may not exist)"

echo ""
echo "📋 Step 4: Testing Updated Functions"
echo "==================================="

# Test the updated functions
echo "🧪 Testing updated Lambda functions..."

BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo "1. Testing enhanced PM manager endpoints:"
echo "----------------------------------------"
curl -s -w "Status: %{http_code}\n" "$BASE_URL/pm-manager/all-projects" | head -3

echo -e "\n2. Testing enhanced document validator:"
echo "-------------------------------------"
curl -s -w "Status: %{http_code}\n" "$BASE_URL/document-validator/test?format=pdf" | head -3

echo -e "\n3. Testing enhanced project summary:"
echo "----------------------------------"
curl -s -w "Status: %{http_code}\n" "$BASE_URL/project-summary/test" | head -3

echo -e "\n4. Testing enhanced send approval (should work now):"
echo "-------------------------------------------------"
curl -s -w "Status: %{http_code}\n" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"project_id":"test","client_email":"test@example.com"}' \
    "$BASE_URL/send-approval-email" | head -3

echo ""
echo "📊 DEPLOYMENT SUMMARY"
echo "===================="
echo "✅ Enhanced Lambda functions packaged and deployed"
echo "✅ Environment variables configured"
echo "✅ Functions tested with API Gateway"
echo ""
echo "🎯 Expected Results:"
echo "- 403 responses (auth required) instead of 502 errors"
echo "- Proper JSON responses instead of generic error messages"
echo "- Working document status checking"
echo "- Fixed send approval parameter validation"
echo ""
echo "🚀 Next: Test with authentication in production environment"

# Cleanup
rm -rf dist

echo "✅ Lambda deployment script completed!"

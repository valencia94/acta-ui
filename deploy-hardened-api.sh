#!/bin/bash

# 🚀 Deploy Hardened API Gateway Configuration
# This script deploys the production-hardened API Gateway structure

set -e

API_ID="q2b9avfwv5"
STAGE_NAME="prod"
AWS_REGION="us-east-2"

echo "🚀 Deploying hardened API Gateway configuration..."

# Backup current configuration
echo "📦 Creating backup of current API..."
aws apigateway get-export \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME \
    --export-type swagger \
    --accepts application/json \
    --region $AWS_REGION \
    backup-api-$(date +%Y%m%d-%H%M%S).json

echo "✅ Backup created"

# Deploy new configuration
echo "🔧 Deploying hardened configuration..."
aws apigateway put-rest-api \
    --rest-api-id $API_ID \
    --mode overwrite \
    --body file://acta-backend-hardened.json \
    --region $AWS_REGION

echo "✅ Configuration uploaded"

# Create deployment
echo "🚀 Creating new deployment..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME \
    --description "Production hardened deployment $(date)" \
    --region $AWS_REGION \
    --query 'id' \
    --output text)

echo "✅ Deployment created: $DEPLOYMENT_ID"

# Verify deployment
echo "🔍 Verifying deployment..."
curl -s "https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/$STAGE_NAME/health" | head -1

echo ""
echo "🎉 HARDENED API GATEWAY DEPLOYED SUCCESSFULLY!"
echo ""
echo "📊 Changes Applied:"
echo "   ✅ Standardized all integrations to aws_proxy"
echo "   ✅ Added comprehensive CORS headers"
echo "   ✅ Unified authentication to Cognito User Pool"
echo "   ✅ Added gateway responses for error CORS"
echo "   ✅ Increased timeouts to 60s for all endpoints"
echo "   ✅ Added request validation"
echo "   ✅ Removed redundant/insecure patterns"
echo ""
echo "🔗 API Base URL: https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/$STAGE_NAME"
echo ""
echo "📋 Next Steps:"
echo "1. Test all endpoints from your frontend"
echo "2. Verify CORS works properly"
echo "3. Check Cognito authentication flow"
echo "4. Monitor CloudWatch logs for any issues"

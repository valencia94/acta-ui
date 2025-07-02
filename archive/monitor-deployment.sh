#!/usr/bin/env bash

# Monitor ACTA-UI Lambda Function Deployment
echo "🔍 ACTA-UI Deployment Monitor"
echo "============================="

echo "📋 Monitoring CodeBuild and Lambda deployment..."

# Wait a moment for the build to start
echo "⏳ Waiting for CodeBuild to start (30 seconds)..."
sleep 30

echo "🌐 Running system test to check current API status..."
./test-complete-system.sh

echo -e "\n⏰ Waiting for deployment to complete (60 seconds)..."
sleep 60

echo "🔍 Running post-deployment system test..."
./test-complete-system.sh

echo -e "\n📊 DEPLOYMENT MONITORING COMPLETE"
echo "=================================="
echo "🔗 If errors persist, check:"
echo "1. CodeBuild logs in AWS Console"
echo "2. Lambda function logs in CloudWatch"
echo "3. API Gateway integration logs"

echo -e "\n💡 Expected success indicators:"
echo "✅ Project Summary Button: 200/403 (not 502)"
echo "✅ Timeline Load Button: 200/403 (not 502)"  
echo "✅ Download PDF Button: 200/302/403 (not 502)"
echo "✅ Download DOCX Button: 200/302/403 (not 502)"
echo "✅ Send Approval Button: 200/403 (not 400)"

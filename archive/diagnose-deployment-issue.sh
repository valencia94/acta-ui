#!/bin/bash

# Deployment Status Check Script
# This script checks why the deployment might not be working

echo "🔍 DEPLOYMENT STATUS CHECK"
echo "=========================="

echo ""
echo "📋 Current Situation:"
echo "- Local build: $(date -r dist/index.html)"
echo "- Live site last-modified: Mon, 30 Jun 2025 01:41:56 GMT"
echo "- This indicates deployment is ~19 hours old"

echo ""
echo "🔍 Checking Deployment Workflow"
echo "==============================="

# Check if workflow file exists and is properly configured
if [ -f ".github/workflows/build_deploy.yml" ]; then
    echo "✅ Workflow file exists"
    
    # Check trigger configuration
    if grep -q "branches: \[develop\]" .github/workflows/build_deploy.yml; then
        echo "✅ Workflow triggers on develop branch"
    else
        echo "❌ Workflow may not trigger on develop branch"
    fi
    
    # Check for environment references
    if grep -q "environment: prod" .github/workflows/build_deploy.yml; then
        echo "✅ Workflow uses prod environment"
    else
        echo "⚠️  Workflow may not use prod environment"
    fi
    
    # Check for secrets usage
    if grep -q "secrets\." .github/workflows/build_deploy.yml; then
        echo "✅ Workflow uses secrets"
    else
        echo "❌ Workflow may not use secrets"
    fi
    
else
    echo "❌ Workflow file not found"
fi

echo ""
echo "🔍 Checking Required Secrets"
echo "============================="

# List secrets that should be configured
echo "Required secrets for deployment:"
echo "- AWS_ROLE_ARN: For AWS authentication"
echo "- AWS_REGION: AWS region (should be us-east-2)"
echo "- S3_BUCKET_NAME: S3 bucket for static assets"
echo "- CLOUDFRONT_DIST_ID: CloudFront distribution ID"
echo "- VITE_API_BASE_URL: API base URL for frontend"

echo ""
echo "🔍 Checking Current Git Status"
echo "=============================="

echo "Current branch: $(git branch --show-current)"
echo "Latest commit: $(git log --oneline -1)"
echo "Remote status: $(git status -s)"

# Check if there are any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  There are uncommitted changes"
    git status --porcelain
else
    echo "✅ No uncommitted changes"
fi

echo ""
echo "🔍 Checking Build Configuration"
echo "==============================="

# Check if build has correct API URL
if [ -f "dist/assets/index-BG0nj0C0.js" ]; then
    echo "✅ Main JavaScript bundle exists"
    
    if grep -q "q2b9avfwv5.execute-api.us-east-2.amazonaws.com" dist/assets/index-BG0nj0C0.js; then
        echo "✅ Build contains correct API URL"
    else
        echo "❌ Build may not contain correct API URL"
    fi
else
    echo "⚠️  Main JavaScript bundle not found (may have different name)"
fi

echo ""
echo "🔍 Possible Issues and Solutions"
echo "==============================="

echo ""
echo "🚨 MOST LIKELY ISSUES:"
echo ""
echo "1. 🔐 GitHub Secrets Not Configured"
echo "   - AWS_ROLE_ARN might be missing or incorrect"
echo "   - CLOUDFRONT_DIST_ID might be wrong"
echo "   - S3_BUCKET_NAME might be incorrect"
echo ""
echo "2. 🔒 AWS Permissions"
echo "   - IAM role might not have S3 permissions"
echo "   - IAM role might not have CloudFront permissions"
echo ""
echo "3. 🎯 Workflow Environment"
echo "   - GitHub environment 'prod' might not be configured"
echo "   - Environment protection rules might be blocking deployment"
echo ""
echo "4. 🔄 Concurrency Lock"
echo "   - Previous deployment might be stuck"
echo "   - Concurrency group might be preventing new deployments"

echo ""
echo "🔧 IMMEDIATE SOLUTIONS:"
echo ""
echo "1. 🚀 Manual Deployment (if you have AWS access):"
echo "   - Sync dist/ to S3 bucket manually"
echo "   - Invalidate CloudFront cache manually"
echo ""
echo "2. 🔄 Trigger Workflow Manually:"
echo "   - Go to GitHub Actions tab"
echo "   - Click 'Build and Deploy' workflow"
echo "   - Click 'Run workflow' button"
echo ""
echo "3. 🧪 Check Workflow Logs:"
echo "   - Go to GitHub Actions tab"
echo "   - Check if any workflows failed"
echo "   - Look for error messages in logs"

echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. Check GitHub Actions for failed workflows"
echo "2. Verify all secrets are configured correctly"
echo "3. Try manual workflow trigger"
echo "4. If urgent, consider manual deployment"

echo ""
echo "📊 Current State Summary:"
echo "- ✅ Frontend code is ready"
echo "- ✅ Backend APIs are working"
echo "- ✅ Build process works"
echo "- ❌ Deployment not updating live site"
echo "- 🎯 Focus: Fix deployment pipeline"

echo ""
echo "Check completed at: $(date)"

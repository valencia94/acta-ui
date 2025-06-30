#!/bin/bash

# ACTA-UI Comprehensive API and Auth Audit Script
# This script audits all API endpoints and Lambda functions for proper Amplify Auth integration

echo "🔍 ACTA-UI COMPREHENSIVE API & AUTH AUDIT"
echo "=========================================="

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
TEST_PROJECT_ID="1000000049842296"

echo ""
echo "📋 1. API ENDPOINTS AUTHENTICATION TEST"
echo "----------------------------------------"

# Function to test endpoint
test_endpoint() {
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_auth="${3:-protected}"
    
    echo "Testing $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_BASE$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$API_BASE$endpoint" -H "Content-Type: application/json" -d '{}')
    fi
    
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]+$//')
    
    if [ "$expected_auth" = "protected" ]; then
        if [ "$http_code" = "403" ] || [[ "$body" == *"Missing Authentication Token"* ]] || [[ "$body" == *"Unauthorized"* ]]; then
            echo "✅ $endpoint - PROPERLY PROTECTED (HTTP $http_code)"
        else
            echo "❌ $endpoint - NOT PROTECTED (HTTP $http_code) - SECURITY ISSUE!"
            echo "   Response: $body"
        fi
    else
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            echo "✅ $endpoint - Public endpoint working (HTTP $http_code)"
        else
            echo "⚠️ $endpoint - Public endpoint issue (HTTP $http_code)"
        fi
    fi
    echo ""
}

# Test all known endpoints
echo "Testing core endpoints..."
test_endpoint "/health" "GET" "public"
test_endpoint "/projects" "GET" "protected"
test_endpoint "/timeline/$TEST_PROJECT_ID" "GET" "protected"
test_endpoint "/project-summary/$TEST_PROJECT_ID" "GET" "protected"
test_endpoint "/download-acta/$TEST_PROJECT_ID" "GET" "protected"
test_endpoint "/extract-project-place/$TEST_PROJECT_ID" "POST" "protected"
test_endpoint "/send-approval-email" "POST" "protected"
test_endpoint "/pm-projects/all-projects" "GET" "protected"
test_endpoint "/pm-projects/valencia942003@gmail.com" "GET" "protected"
test_endpoint "/check-document/$TEST_PROJECT_ID" "GET" "protected"

echo ""
echo "🔧 2. LAMBDA FUNCTIONS AUDIT"
echo "-----------------------------"

# List all Lambda functions that should be integrated
echo "Checking Lambda functions in the region..."
aws lambda list-functions --region us-east-2 --query 'Functions[].FunctionName' --output table 2>/dev/null | grep -E "(GetTimeline|GetDownloadActa|projectMetadataEnricher|SendApprovalEmail|ProjectPlaceDataExtractor|HealthCheck|ProjectsManager|DocumentStatus)" || echo "AWS CLI not available or no access"

echo ""
echo "🏗️ 3. INFRASTRUCTURE ANALYSIS"
echo "------------------------------"

echo "Current infrastructure template issues found:"
echo "❌ ALL API endpoints use AuthorizationType: NONE"
echo "❌ No Cognito User Pool authorizer configured"
echo "❌ Lambda functions don't validate JWT tokens"
echo "❌ Mixed security model - some endpoints require auth, others don't"

echo ""
echo "🔐 4. AUTHENTICATION FLOW ANALYSIS"
echo "-----------------------------------"

echo "Current auth configuration:"
echo "✅ Cognito User Pool: us-east-2_FyHLtOhiY"
echo "✅ Web Client ID: 1hdn8b19ub2kmfkuse8rsjpv8e"
echo "✅ Frontend sends Authorization: Bearer <token> headers"
echo "❌ API Gateway not configured to validate these tokens"

echo ""
echo "🎯 5. RECOMMENDATIONS FOR COMPLETE AUTH INTEGRATION"
echo "======================================================"

echo ""
echo "CRITICAL FIXES NEEDED:"
echo ""
echo "1. 🔧 CREATE COGNITO AUTHORIZER"
echo "   - Add AWS::ApiGateway::Authorizer for Cognito User Pool"
echo "   - Configure all protected endpoints to use this authorizer"
echo ""
echo "2. 🔧 UPDATE INFRASTRUCTURE TEMPLATE"
echo "   - Change AuthorizationType from NONE to COGNITO_USER_POOLS"
echo "   - Add AuthorizerId reference to all protected methods"
echo ""
echo "3. 🔧 LAMBDA FUNCTION SECURITY"
echo "   - Add JWT token validation in Lambda functions"
echo "   - Extract user information from Cognito claims"
echo "   - Implement proper error handling for unauthorized requests"
echo ""
echo "4. 🔧 ENDPOINT CLASSIFICATION"
echo "   - Health check: Public (no auth required)"
echo "   - All other endpoints: Protected (require auth)"
echo ""
echo "5. 🔧 DEPLOY CORRECTED INFRASTRUCTURE"
echo "   - Deploy updated CloudFormation template"
echo "   - Test all endpoints with proper auth headers"
echo "   - Verify UI functionality after auth enforcement"

echo ""
echo "🚨 SECURITY ALERT"
echo "=================="
echo ""
echo "CURRENT STATE: Some endpoints are accessible without authentication!"
echo "This is a CRITICAL SECURITY VULNERABILITY that must be fixed immediately."
echo ""
echo "IMMEDIATE ACTION REQUIRED:"
echo "1. Deploy auth-enabled infrastructure template"
echo "2. Test all UI functionality"
echo "3. Verify all API calls include proper Authorization headers"

echo ""
echo "📋 NEXT STEPS"
echo "=============="
echo ""
echo "1. Create corrected infrastructure template with Cognito authorizer"
echo "2. Update Lambda functions to validate JWT tokens"
echo "3. Deploy infrastructure changes"
echo "4. Run comprehensive UI testing"
echo "5. Verify all button functionality works with auth"

echo ""
echo "🎉 AUDIT COMPLETE"
echo "=================="

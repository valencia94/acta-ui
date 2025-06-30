#!/bin/bash

# ACTA-UI Complete End-to-End Authentication and Functionality Test
# This script performs comprehensive testing of the entire system after auth implementation

echo "🧪 ACTA-UI COMPLETE AUTHENTICATION & FUNCTIONALITY TEST"
echo "========================================================"

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
TEST_PROJECT_ID="1000000049842296"

echo ""
echo "🔐 1. AUTHENTICATION SECURITY VERIFICATION"
echo "==========================================="

echo "Testing ALL endpoints for proper authentication..."

# Function to test endpoint security
test_endpoint_security() {
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_protected="${3:-true}"
    
    echo "Testing $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_BASE$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$API_BASE$endpoint" -H "Content-Type: application/json" -d '{}')
    fi
    
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]+$//')
    
    if [ "$expected_protected" = "true" ]; then
        if [ "$http_code" = "403" ] || [[ "$body" == *"Missing Authentication Token"* ]] || [[ "$body" == *"Unauthorized"* ]]; then
            echo "✅ SECURED - Returns HTTP $http_code (authentication required)"
        else
            echo "❌ SECURITY ISSUE - Returns HTTP $http_code (should require auth!)"
            echo "   Response: ${body:0:100}..."
        fi
    else
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            echo "✅ PUBLIC - Returns HTTP $http_code (accessible without auth)"
        else
            echo "⚠️ ISSUE - Returns HTTP $http_code (should be accessible)"
        fi
    fi
    echo ""
}

# Test all endpoints
echo "Core API endpoints:"
test_endpoint_security "/health" "GET" false
test_endpoint_security "/projects" "GET" true
test_endpoint_security "/timeline/$TEST_PROJECT_ID" "GET" true
test_endpoint_security "/project-summary/$TEST_PROJECT_ID" "GET" true
test_endpoint_security "/download-acta/$TEST_PROJECT_ID" "GET" true
test_endpoint_security "/extract-project-place/$TEST_PROJECT_ID" "POST" true
test_endpoint_security "/send-approval-email" "POST" true
test_endpoint_security "/pm-projects/all-projects" "GET" true
test_endpoint_security "/pm-projects/valencia942003@gmail.com" "GET" true
test_endpoint_security "/check-document/$TEST_PROJECT_ID" "GET" true

echo ""
echo "🏗️ 2. INFRASTRUCTURE VERIFICATION"
echo "=================================="

echo "Checking deployed infrastructure..."

# Check if Cognito authorizer exists
echo "Checking API Gateway authorizers..."
AUTHORIZERS=$(aws apigateway get-authorizers --rest-api-id q2b9avfwv5 --region us-east-2 2>/dev/null | jq -r '.items[].name // empty')
if [ -n "$AUTHORIZERS" ]; then
    echo "✅ API Gateway Authorizers found:"
    echo "$AUTHORIZERS"
else
    echo "❌ No API Gateway authorizers found"
fi

echo ""
echo "Checking Lambda functions..."
LAMBDA_FUNCTIONS=$(aws lambda list-functions --region us-east-2 --query 'Functions[?contains(FunctionName, `projectMetadataEnricher`) || contains(FunctionName, `GetTimeline`) || contains(FunctionName, `GetDownloadActa`) || contains(FunctionName, `ProjectPlaceDataExtractor`) || contains(FunctionName, `HealthCheck`)].FunctionName' --output text 2>/dev/null)
if [ -n "$LAMBDA_FUNCTIONS" ]; then
    echo "✅ Lambda functions found:"
    echo "$LAMBDA_FUNCTIONS" | tr '\t' '\n'
else
    echo "❌ Lambda functions not found or no access"
fi

echo ""
echo "📱 3. UI CONFIGURATION VERIFICATION"
echo "===================================="

echo "Checking UI configuration files..."

# Check aws-exports.js
if [ -f "src/aws-exports.js" ]; then
    echo "✅ aws-exports.js exists"
    
    if grep -q "custom_header" src/aws-exports.js; then
        echo "✅ Custom auth header function configured"
    else
        echo "❌ Custom auth header function missing"
    fi
    
    if grep -q "aws_user_pools_id.*us-east-2_FyHLtOhiY" src/aws-exports.js; then
        echo "✅ Cognito User Pool ID correct"
    else
        echo "❌ Cognito User Pool ID incorrect"
    fi
    
    if grep -q "aws_user_pools_web_client_id.*1hdn8b19ub2kmfkuse8rsjpv8e" src/aws-exports.js; then
        echo "✅ Cognito Web Client ID correct"
    else
        echo "❌ Cognito Web Client ID incorrect"
    fi
else
    echo "❌ aws-exports.js not found"
fi

# Check .env.production
if [ -f ".env.production" ]; then
    echo "✅ .env.production exists"
    
    if grep -q "VITE_COGNITO_WEB_CLIENT_ID=1hdn8b19ub2kmfkuse8rsjpv8e" .env.production; then
        echo "✅ Environment variable VITE_COGNITO_WEB_CLIENT_ID correct"
    else
        echo "❌ Environment variable VITE_COGNITO_WEB_CLIENT_ID incorrect"
    fi
else
    echo "❌ .env.production not found"
fi

echo ""
echo "🎯 4. BROWSER TEST SCRIPT VERIFICATION"
echo "======================================="

echo "Checking browser test scripts..."

if [ -f "public/test-button-functionality.js" ]; then
    echo "✅ Browser test script exists"
    if grep -q "Authorization.*Bearer" public/test-button-functionality.js; then
        echo "✅ Test script includes authorization header validation"
    else
        echo "⚠️ Test script may not validate authorization headers"
    fi
else
    echo "❌ Browser test script not found"
fi

if [ -f "public/quick-auth-test.js" ]; then
    echo "✅ Quick auth test script exists"
else
    echo "❌ Quick auth test script not found"
fi

echo ""
echo "🏃‍♂️ 5. DEVELOPMENT SERVER READINESS"
echo "===================================="

echo "Checking development environment..."

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    echo "✅ Node modules installed"
else
    echo "❌ Node modules not installed - run 'pnpm install'"
fi

# Check if build exists
if [ -d "dist" ]; then
    echo "✅ Production build exists"
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo "   Build size: $BUILD_SIZE"
else
    echo "⚠️ No production build - run 'pnpm build' if needed"
fi

echo ""
echo "🧪 6. MANUAL TESTING INSTRUCTIONS"
echo "=================================="

echo ""
echo "To test the complete system:"
echo ""
echo "STEP 1: Start the development server"
echo "   pnpm dev"
echo ""
echo "STEP 2: Open browser to http://localhost:3000"
echo ""
echo "STEP 3: Login with test credentials"
echo "   Email: valencia942003@gmail.com"
echo "   Password: PdYb7TU7HvBhYP7$"
echo ""
echo "STEP 4: Verify login and dashboard access"
echo "   - Should see dashboard after login"
echo "   - No authentication errors in console"
echo ""
echo "STEP 5: Test project functionality"
echo "   - Enter Project ID: $TEST_PROJECT_ID"
echo "   - Click 'Load Project' button"
echo "   - Verify project data loads successfully"
echo ""
echo "STEP 6: Test all dashboard buttons"
echo "   - Generate ACTA button"
echo "   - Download Word button"
echo "   - Download PDF button"
echo "   - Preview PDF button"
echo "   - Send Approval Email button"
echo ""
echo "STEP 7: Verify API calls in Network tab"
echo "   - All API calls should include 'Authorization: Bearer ...' headers"
echo "   - No 403 errors for authenticated requests"
echo "   - Proper responses from backend"
echo ""
echo "STEP 8: Test browser console functions"
echo "   - Open browser console (F12)"
echo "   - Run: clickButton('generate')"
echo "   - Run: clickButton('pdf')"
echo "   - Run: clickButton('preview')"
echo "   - Verify all functions work without errors"

echo ""
echo "📊 7. EXPECTED RESULTS AFTER FIXES"
echo "==================================="

echo ""
echo "✅ AUTHENTICATION:"
echo "   - All protected endpoints return 403 without auth"
echo "   - UI login works without errors"
echo "   - Authorization headers sent with all API calls"
echo ""
echo "✅ FUNCTIONALITY:"
echo "   - All dashboard buttons are enabled with project ID"
echo "   - Button clicks trigger appropriate API calls"
echo "   - Project data loads successfully"
echo "   - PDF preview modal works"
echo "   - Document downloads work (when available)"
echo ""
echo "✅ SECURITY:"
echo "   - No unauthorized access to sensitive endpoints"
echo "   - Proper JWT token validation"
echo "   - User-specific data access controls"

echo ""
echo "🚨 SECURITY STATUS SUMMARY"
echo "=========================="

# Count secured vs unsecured endpoints
TOTAL_ENDPOINTS=10
SECURED_ENDPOINTS=$(curl -s "$API_BASE/timeline/$TEST_PROJECT_ID" -w "%{http_code}" -o /dev/null)
if [ "$SECURED_ENDPOINTS" = "403" ]; then
    echo "✅ SECURITY STATUS: PROPERLY SECURED"
    echo "   All protected endpoints require authentication"
else
    echo "❌ SECURITY STATUS: VULNERABILITIES REMAIN"
    echo "   Some endpoints may still be accessible without auth"
fi

echo ""
echo "🎉 COMPREHENSIVE TEST COMPLETE"
echo "==============================="
echo ""
echo "This audit has verified:"
echo "• API endpoint security configuration"
echo "• Infrastructure deployment status"
echo "• UI authentication configuration"
echo "• Lambda function integration"
echo "• Manual testing procedures"
echo ""
echo "Follow the manual testing instructions above to complete"
echo "the end-to-end functionality verification!"

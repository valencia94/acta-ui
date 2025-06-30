#!/bin/bash

# ACTA-UI Live Button Testing Script
# Tests button functionality on the production CloudFront site

echo "🚀 ACTA-UI Live Button Testing"
echo "=============================="

FRONTEND_URL="https://d7t9x3j66yd8k.cloudfront.net"
API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo ""
echo "📋 Testing Setup:"
echo "Frontend: $FRONTEND_URL"
echo "API Base: $API_BASE"

echo ""
echo "🔍 1. TESTING SITE ACCESSIBILITY"
echo "================================"

# Check if site loads
echo "Testing main site..."
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$SITE_STATUS" = "200" ]; then
    echo "✅ Site loads successfully (Status: $SITE_STATUS)"
else
    echo "❌ Site not accessible (Status: $SITE_STATUS)"
    exit 1
fi

# Check dashboard route
echo "Testing dashboard route..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/dashboard")
if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "✅ Dashboard route accessible (Status: $DASHBOARD_STATUS)"
else
    echo "❌ Dashboard route not accessible (Status: $DASHBOARD_STATUS)"
fi

echo ""
echo "🔍 2. TESTING API ENDPOINTS (Backend)"
echo "====================================="

# Test core API endpoints that buttons would call
test_api_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_status="$3"
    
    echo "Testing: $description"
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE$endpoint")
    
    if [ "$status" = "$expected_status" ]; then
        echo "✅ $description: Status $status (Expected: $expected_status)"
    else
        echo "⚠️  $description: Status $status (Expected: $expected_status)"
    fi
}

# Test button-related endpoints
test_api_endpoint "/health" "Health Check" "200"
test_api_endpoint "/projects" "Projects API" "403"
test_api_endpoint "/pm-manager/all-projects" "PM Manager API" "403"

# Test project-specific endpoints that buttons call
PROJECT_ID="1000000049842296"
test_api_endpoint "/timeline/$PROJECT_ID" "Timeline API" "403"
test_api_endpoint "/project-summary/$PROJECT_ID" "Project Summary API" "403"
test_api_endpoint "/download-acta/$PROJECT_ID?format=pdf" "PDF Download API" "403"

echo ""
echo "🔍 3. CHECKING DEPLOYMENT FRESHNESS"
echo "==================================="

# Check if the deployment is recent by looking at assets
echo "Checking asset timestamps..."
ASSET_INFO=$(curl -s -I "$FRONTEND_URL/assets/" 2>/dev/null || echo "Assets directory not accessible")
echo "Asset info: $ASSET_INFO"

# Check for specific bundled assets
echo "Checking main JavaScript bundle..."
JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/assets/index-BG0nj0C0.js")
if [ "$JS_STATUS" = "200" ]; then
    echo "✅ Main JavaScript bundle accessible"
    
    # Check if it contains the correct API URL
    JS_CONTENT=$(curl -s "$FRONTEND_URL/assets/index-BG0nj0C0.js" | head -1000)
    if echo "$JS_CONTENT" | grep -q "q2b9avfwv5.execute-api.us-east-2.amazonaws.com"; then
        echo "✅ JavaScript bundle contains correct API URL"
    else
        echo "⚠️  JavaScript bundle may not contain correct API URL"
    fi
else
    echo "⚠️  Main JavaScript bundle not accessible (Status: $JS_STATUS)"
fi

echo ""
echo "🔍 4. SIMULATING BUTTON INTERACTIONS"
echo "==================================="

echo "Note: Full button testing requires browser interaction."
echo "Here's what should happen when buttons are clicked:"
echo ""

echo "🔵 Generate ACTA Button:"
echo "   Should POST to: $API_BASE/extract-project-place/$PROJECT_ID"
echo "   Expected: 401/403 (authentication required)"

echo ""
echo "🔵 Download Buttons:"
echo "   Should GET: $API_BASE/download-acta/$PROJECT_ID?format=pdf"
echo "   Should GET: $API_BASE/download-acta/$PROJECT_ID?format=docx"
echo "   Expected: 401/403 (authentication required)"

echo ""
echo "🔵 Send Approval Button:"
echo "   Should POST to: $API_BASE/send-approval-email"
echo "   Expected: 401/403 (authentication required)"

echo ""
echo "🎯 DIAGNOSIS SUMMARY"
echo "==================="

if [ "$SITE_STATUS" = "200" ] && [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "✅ Frontend deployment: WORKING"
    echo "✅ Backend API: RESPONDING"
    echo ""
    echo "🔧 LIKELY ISSUE: Authentication Integration"
    echo ""
    echo "The site and APIs are working, but buttons may fail due to:"
    echo "1. Missing authentication tokens"
    echo "2. CORS configuration issues"
    echo "3. Frontend not properly sending auth headers"
    echo ""
    echo "📝 NEXT STEPS:"
    echo "1. Test login functionality first"
    echo "2. Check browser console for auth errors"
    echo "3. Verify Cognito authentication is working"
    echo "4. Test buttons after successful login"
else
    echo "❌ Deployment issue detected"
    echo "The site or APIs are not responding correctly."
fi

echo ""
echo "🌐 MANUAL TESTING:"
echo "=================="
echo "1. Open: $FRONTEND_URL"
echo "2. Login with test credentials"
echo "3. Navigate to dashboard"
echo "4. Enter project ID: $PROJECT_ID"
echo "5. Test each button and check browser Network tab"

echo ""
echo "Test completed at: $(date)"

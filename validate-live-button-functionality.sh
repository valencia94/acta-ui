#!/bin/bash

# Live Button Functionality Validation Script
# Tests the live ACTA-UI application to ensure all buttons are working correctly

echo "🎯 LIVE ACTA-UI BUTTON FUNCTIONALITY VALIDATION"
echo "==============================================="

LIVE_URL="https://d7t9x3j66yd8k.cloudfront.net"
API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
TEST_PROJECT_ID="1000000049842296"

echo ""
echo "📋 Test Configuration:"
echo "Live Site: $LIVE_URL"
echo "API Base: $API_BASE"  
echo "Test Project ID: $TEST_PROJECT_ID"

echo ""
echo "🔍 PRE-TESTING: VERIFY SITE AND API AVAILABILITY"
echo "================================================"

# Test site accessibility
echo "Testing live site accessibility..."
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LIVE_URL")
if [[ "$SITE_STATUS" == "200" ]]; then
    echo "✅ Live site accessible: $SITE_STATUS"
else
    echo "❌ Live site not accessible: $SITE_STATUS"
    exit 1
fi

# Test API endpoints are responding
echo ""
echo "Testing API endpoints availability..."

endpoints=(
    "GET:/health:200:Health Check (Public)"
    "GET:/timeline/$TEST_PROJECT_ID:401:Timeline API (Protected)"
    "GET:/project-summary/$TEST_PROJECT_ID:401:Project Summary API (Protected)"
    "GET:/download-acta/$TEST_PROJECT_ID:401:Download ACTA API (Protected)"
    "POST:/extract-project-place/$TEST_PROJECT_ID:401:Generate ACTA API (Protected)"
    "POST:/send-approval-email:401:Send Approval API (Protected)"
    "GET:/check-document/$TEST_PROJECT_ID:401:Document Status API (Protected)"
)

for endpoint in "${endpoints[@]}"; do
    IFS=':' read -r method path expected_status description <<< "$endpoint"
    
    if [[ "$method" == "GET" ]]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE$path")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_BASE$path" \
                 -H "Content-Type: application/json" -d '{}')
    fi
    
    if [[ "$status" == "$expected_status" ]]; then
        echo "✅ $description: $status (expected: $expected_status)"
    else
        echo "⚠️  $description: $status (expected: $expected_status)"
    fi
done

echo ""
echo "🎯 BUTTON TESTING INSTRUCTIONS"
echo "=============================="

echo ""
echo "🚀 STEP 1: Open Live Site in Browser"
echo "URL: $LIVE_URL"
echo ""

echo "🔐 STEP 2: Login with Test Credentials"
echo "Email: valencia942003@gmail.com"
echo "Password: PdYb7TU7HvBhYP7$"
echo ""

echo "📋 STEP 3: Navigate to Dashboard and Enter Project ID"
echo "Project ID: $TEST_PROJECT_ID"
echo ""

echo "🧪 STEP 4: Test Each Button (in order of importance)"
echo ""

echo "🔵 BUTTON 1: GENERATE ACTA"
echo "   Expected: POST request to /extract-project-place/$TEST_PROJECT_ID"
echo "   Should show: Loading indicator → Success/Error message"
echo "   API Response: Should include Authorization header"
echo ""

echo "🔵 BUTTON 2: DOWNLOAD WORD"
echo "   Expected: GET request to /download-acta/$TEST_PROJECT_ID?format=docx"
echo "   Should show: File download OR 'Generate document first' message"
echo "   API Response: Should include Authorization header"
echo ""

echo "🔵 BUTTON 3: DOWNLOAD PDF"
echo "   Expected: GET request to /download-acta/$TEST_PROJECT_ID?format=pdf"
echo "   Should show: File download OR 'Generate document first' message"
echo "   API Response: Should include Authorization header"
echo ""

echo "🔵 BUTTON 4: PREVIEW PDF"
echo "   Expected: GET request to /download-acta/$TEST_PROJECT_ID?format=pdf"
echo "   Should show: PDF preview modal OR 'Generate document first' message"
echo "   API Response: Should include Authorization header"
echo ""

echo "🔵 BUTTON 5: SEND APPROVAL"
echo "   Expected: POST request to /send-approval-email"
echo "   Should show: Success message OR error message"
echo "   API Response: Should include Authorization header"
echo ""

echo "🔵 BUTTON 6: TIMELINE (if visible)"
echo "   Expected: GET request to /timeline/$TEST_PROJECT_ID"
echo "   Should show: Timeline data OR loading state"
echo "   API Response: Should include Authorization header"
echo ""

echo "📊 VALIDATION CHECKLIST"
echo "======================="

echo ""
echo "For EACH button click, verify:"
echo "✅ Button responds visually (loading state, disabled, etc.)"
echo "✅ Network request appears in Developer Tools > Network tab"
echo "✅ Request URL is correct for the button"
echo "✅ Authorization header is present in request"
echo "✅ UI provides feedback (success/error/loading messages)"
echo "✅ No JavaScript errors in Console tab"

echo ""
echo "🚨 FAILURE INDICATORS TO WATCH FOR:"
echo "❌ Button doesn't respond to clicks"
echo "❌ No network request generated"
echo "❌ Missing Authorization header in request"
echo "❌ Silent failures (no user feedback)"
echo "❌ JavaScript errors in browser console"
echo "❌ Infinite loading states"

echo ""
echo "🎯 SUCCESS CRITERIA"
echo "==================="

echo ""
echo "✅ ALL buttons must respond to clicks"
echo "✅ ALL button clicks must generate correct API requests"
echo "✅ ALL API requests must include Authorization headers"
echo "✅ ALL operations must provide user feedback"
echo "✅ NO JavaScript errors in console"

echo ""
echo "📝 EXPECTED AUTHENTICATION FLOW"
echo "==============================="

echo ""
echo "1. User logs in → Cognito JWT token obtained"
echo "2. Token stored in browser (localStorage/sessionStorage)"
echo "3. Button clicks → API calls include 'Authorization: Bearer <token>'"
echo "4. API Gateway validates token with Cognito User Pool"
echo "5. Valid token → Lambda function executes"
echo "6. Invalid/missing token → 401 Unauthorized response"

echo ""
echo "🚀 START TESTING NOW!"
echo "====================="

echo ""
echo "Open the Simple Browser in VS Code and follow the testing procedure."
echo "The live site is ready for comprehensive button functionality testing!"

echo ""
echo "💡 TIP: Keep Developer Tools open during testing to monitor:"
echo "   • Network tab for API requests"
echo "   • Console tab for any errors"
echo "   • Application tab to verify JWT token storage"

echo ""
echo "Report any issues found during testing for immediate resolution."

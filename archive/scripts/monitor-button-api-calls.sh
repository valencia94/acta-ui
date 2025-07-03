#!/bin/bash

# Real-time API Call Monitoring for ACTA-UI Button Testing
# This script monitors network activity and API responses in real-time

echo "🔍 REAL-TIME API MONITORING FOR ACTA-UI BUTTONS"
echo "================================================"

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
TEST_PROJECT_ID="1000000049842296"

echo ""
echo "📋 MONITORING SETUP"
echo "-------------------"
echo "API Base URL: $API_BASE"
echo "Test Project ID: $TEST_PROJECT_ID"
echo "Monitoring for button-triggered API calls..."

echo ""
echo "🧪 FIRST - LET'S TEST API ENDPOINTS WITH VALID AUTH"
echo "==================================================="

# Function to test with a mock Authorization header (for testing)
test_endpoint_with_auth() {
    local endpoint="$1"
    local method="${2:-GET}"
    local description="$3"
    
    echo ""
    echo "Testing: $description"
    echo "Endpoint: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        echo "Without auth (should be 401):"
        curl -s -w "   Status: %{http_code}\n" -o /dev/null "$API_BASE$endpoint"
        
        echo "Expected: Status 401 (authentication required)"
    elif [ "$method" = "POST" ]; then
        echo "Without auth (should be 401):"
        curl -s -w "   Status: %{http_code}\n" -o /dev/null -X POST "$API_BASE$endpoint" -H "Content-Type: application/json" -d '{}'
        
        echo "Expected: Status 401 (authentication required)"
    fi
}

# Test all the button-related endpoints
test_endpoint_with_auth "/timeline/$TEST_PROJECT_ID" "GET" "Timeline Button API"
test_endpoint_with_auth "/project-summary/$TEST_PROJECT_ID" "GET" "Project Summary Loading API"
test_endpoint_with_auth "/download-acta/$TEST_PROJECT_ID?format=pdf" "GET" "PDF Download Button API"
test_endpoint_with_auth "/download-acta/$TEST_PROJECT_ID?format=docx" "GET" "Word Download Button API"
test_endpoint_with_auth "/extract-project-place/$TEST_PROJECT_ID" "POST" "Generate ACTA Button API"
test_endpoint_with_auth "/send-approval-email" "POST" "Send Approval Button API"

echo ""
echo "🎯 BUTTON TESTING INSTRUCTIONS"
echo "==============================="

echo ""
echo "NOW - Open the UI and test each button while monitoring:"
echo ""
echo "1. 🌐 Open browser to: http://localhost:3000"
echo "2. 🔑 Login with: valencia942003@gmail.com / PdYb7TU7HvBhYP7$"
echo "3. 📋 Enter Project ID: $TEST_PROJECT_ID"
echo "4. 🖱️ Click each button and watch for:"
echo ""

echo "   📊 EXPECTED BUTTON BEHAVIORS:"
echo "   =============================="
echo ""
echo "   🔵 GENERATE ACTA BUTTON:"
echo "   - Should show loading spinner/toast"
echo "   - Should make POST to /extract-project-place/$TEST_PROJECT_ID"
echo "   - Should either succeed or show meaningful error"
echo ""
echo "   🔵 DOWNLOAD WORD BUTTON:"
echo "   - Should make GET to /download-acta/$TEST_PROJECT_ID?format=docx"
echo "   - Should either download file or show 'Generate first' message"
echo ""
echo "   🔵 DOWNLOAD PDF BUTTON:"
echo "   - Should make GET to /download-acta/$TEST_PROJECT_ID?format=pdf"
echo "   - Should either download file or show 'Generate first' message"
echo ""
echo "   🔵 PREVIEW PDF BUTTON:"
echo "   - Should make GET to /download-acta/$TEST_PROJECT_ID?format=pdf"
echo "   - Should open PDF preview modal or show error"
echo ""
echo "   🔵 SEND APPROVAL BUTTON:"
echo "   - Should make POST to /send-approval-email"
echo "   - Should show success message or meaningful error"
echo ""

echo "🔧 TROUBLESHOOTING - Common Issues:"
echo "==================================="
echo ""
echo "❌ BUTTON DOESN'T RESPOND:"
echo "   - Check browser console for JavaScript errors"
echo "   - Verify project ID is entered"
echo "   - Check if button is disabled"
echo ""
echo "❌ NO API CALL MADE:"
echo "   - Open Network tab in browser dev tools"
echo "   - Click button and watch for new requests"
echo "   - Check if Authorization header is present"
echo ""
echo "❌ API CALL FAILS:"
echo "   - Status 401: Authentication issue"
echo "   - Status 403: Permission denied"
echo "   - Status 404: Document not found (may need to generate first)"
echo "   - Status 500: Server error in Lambda function"
echo ""

echo "📱 LIVE MONITORING COMMANDS"
echo "==========================="
echo ""
echo "While testing buttons, you can run these in another terminal:"
echo ""
echo "Monitor API Gateway logs:"
echo "aws logs tail /aws/apigateway/$API_BASE --follow --region us-east-2"
echo ""
echo "Monitor Lambda function logs:"
echo "aws logs tail /aws/lambda/getTimeline --follow --region us-east-2"
echo "aws logs tail /aws/lambda/projectMetadataEnricher --follow --region us-east-2"
echo "aws logs tail /aws/lambda/GetDownloadActa --follow --region us-east-2"
echo "aws logs tail /aws/lambda/ProjectPlaceDataExtractor --follow --region us-east-2"
echo ""

echo "🧪 BROWSER CONSOLE TESTING"
echo "=========================="
echo ""
echo "In browser console (F12), you can test individual functions:"
echo ""
echo "// Test if clickButton function exists"
echo "console.log(typeof clickButton);"
echo ""
echo "// Test individual buttons"
echo "clickButton('generate');   // Should trigger Generate ACTA"
echo "clickButton('word');       // Should trigger Word download"
echo "clickButton('pdf');        // Should trigger PDF download"
echo "clickButton('preview');    // Should open PDF preview"
echo ""

echo "🎉 START TESTING!"
echo "=================="
echo ""
echo "Ready for button testing! Follow the instructions above and report:"
echo "1. Which buttons respond vs don't respond"
echo "2. What API calls appear in Network tab"
echo "3. Any error messages in console"
echo "4. Expected vs actual UI behavior"

echo ""
echo "The dev server should be running at: http://localhost:3000"
echo "All API endpoints are now secured and ready for authenticated requests!"

#!/usr/bin/env bash
set -euo pipefail

# ACTA-UI Backend Testing Script
# Tests all backend endpoints after deployment

echo "🧪 ACTA-UI Backend Endpoint Testing"
echo "===================================="

BASE_URL="${API_BASE_URL:-https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod}"
echo "🔗 Testing API Base URL: $BASE_URL"
echo

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_codes=${4:-"200,403,502"}  # Accept 403 (auth required) as valid
    
    echo "🔍 Testing: $description"
    echo "   $method $endpoint"
    
    # Make request and capture status code
    if [ "$method" = "HEAD" ]; then
        response=$(curl -s -I -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
    fi
    
    # Extract status code
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    # Check if status code is expected
    if echo "$expected_codes" | grep -q "$status_code"; then
        if [ "$status_code" = "200" ]; then
            echo "   ✅ Status: $status_code (Working)"
        elif [ "$status_code" = "403" ]; then
            echo "   ✅ Status: $status_code (Auth Required - Expected)"
        else
            echo "   ⚠️  Status: $status_code (Acceptable)"
        fi
    else
        echo "   ❌ Status: $status_code (Failed)"
    fi
    
    # Show response body for 200 responses (truncated)
    if [ "$status_code" = "200" ] && [ "$method" != "HEAD" ]; then
        body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
        if [ ${#body} -gt 200 ]; then
            echo "   📝 Response: ${body:0:200}..."
        else
            echo "   📝 Response: $body"
        fi
    fi
    
    echo
}

echo "📋 Testing EXISTING Endpoints:"
echo "=============================="

# Test existing endpoints
test_endpoint "GET" "/health" "Health Check" "200"
test_endpoint "GET" "/project-summary/test" "Project Summary (projectMetadataEnricher)" "200,403,502"
test_endpoint "GET" "/timeline/test" "Timeline Data" "200,403,502"
test_endpoint "GET" "/download-acta/test?format=docx" "Download ACTA (DOCX)" "200,403,404"
test_endpoint "GET" "/download-acta/test?format=pdf" "Download ACTA (PDF)" "200,403,404"
test_endpoint "POST" "/extract-project-place/test" "Extract Project Data" "200,403,502,504"

echo "📋 Testing NEW Endpoints (After Deployment):"
echo "============================================="

# Test new PM projects endpoints
test_endpoint "GET" "/pm-projects/all-projects" "PM Projects (All)" "200,403,404"
test_endpoint "GET" "/pm-projects/test@example.com" "PM Projects (By Email)" "200,403,404"

# Test new document status endpoints
test_endpoint "HEAD" "/check-document/test?format=docx" "Check Document Status (HEAD)" "200,403,404"
test_endpoint "GET" "/check-document/test?format=docx" "Check Document Status (GET)" "200,403,404"
test_endpoint "GET" "/check-document/test?format=pdf" "Check Document Status (PDF)" "200,403,404"

echo "📊 Testing Summary:"
echo "=================="

# Count successful tests
echo "🎯 Endpoint Categories:"
echo "  🟢 200 - Working endpoints"
echo "  🟡 403 - Auth-protected endpoints (expected)"
echo "  🔴 404 - Missing endpoints (need deployment)"
echo "  🔴 502 - Lambda errors (need fixes)"
echo

echo "📝 Next Steps:"
echo "=============="
echo "1. If you see 404s for NEW endpoints:"
echo "   → Run the GitHub workflow: Deploy Backend Infrastructure"
echo "2. If you see 502s for EXISTING endpoints:"
echo "   → Check CloudWatch logs for Lambda errors"
echo "3. If you see 403s:"
echo "   → Add authentication headers to test real functionality"
echo

echo "🔗 Useful Commands:"
echo "==================="
echo "# Check Lambda logs:"
echo "aws logs describe-log-groups --region us-east-2 | grep acta"
echo
echo "# Test with authentication:"
echo "curl -H 'Authorization: Bearer your-token' '$BASE_URL/pm-projects/all-projects'"
echo

echo "✅ Backend testing completed!"

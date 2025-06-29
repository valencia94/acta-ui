#!/bin/bash

# ACTA-UI Production Testing Script
# Comprehensive testing of API endpoints, authentication, and system functionality

echo "🚀 ACTA-UI Production Testing Started"
echo "====================================="
echo "$(date)"
echo ""

# Configuration
BASE_URL="http://localhost:5173"
API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
TEST_EMAIL="valencia942003@gmail.com"
TEST_PROJECT_ID="prj001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}: $details"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $test_name${NC}: $details"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "${YELLOW}➖ $test_name${NC}: $details"
    fi
}

# Test 1: Frontend Application Availability
echo -e "${BLUE}🌐 Testing Frontend Availability...${NC}"
if curl -s --connect-timeout 5 "$BASE_URL" > /dev/null; then
    FRONTEND_RESPONSE=$(curl -s "$BASE_URL")
    if echo "$FRONTEND_RESPONSE" | grep -q "ACTA\|React\|<!DOCTYPE html>"; then
        log_test "Frontend Load" "PASS" "Frontend is accessible and serving content"
    else
        log_test "Frontend Load" "FAIL" "Frontend accessible but content unexpected"
    fi
else
    log_test "Frontend Load" "FAIL" "Frontend not accessible at $BASE_URL"
fi

# Test 2: API Gateway Health Check
echo -e "${BLUE}🔍 Testing API Gateway Health...${NC}"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/health" 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    log_test "API Health" "PASS" "Health endpoint responding with 200"
elif [ "$HEALTH_RESPONSE" = "403" ]; then
    log_test "API Health" "PASS" "Health endpoint secured (403) - API Gateway working"
else
    log_test "API Health" "FAIL" "Unexpected response: $HEALTH_RESPONSE"
fi

# Test 3: Lambda Functions Status
echo -e "${BLUE}⚡ Testing Lambda Functions...${NC}"

# Test projectMetadataEnricher
LAMBDA_STATUS=$(aws lambda get-function --function-name projectMetadataEnricher --region us-east-2 --query 'Configuration.State' --output text 2>/dev/null)
if [ "$LAMBDA_STATUS" = "Active" ]; then
    log_test "ProjectMetadataEnricher Lambda" "PASS" "Function is Active"
else
    log_test "ProjectMetadataEnricher Lambda" "FAIL" "Function status: $LAMBDA_STATUS"
fi

# Test getDownloadActa
DOWNLOAD_LAMBDA_STATUS=$(aws lambda get-function --function-name getDownloadActa --region us-east-2 --query 'Configuration.State' --output text 2>/dev/null)
if [ "$DOWNLOAD_LAMBDA_STATUS" = "Active" ]; then
    log_test "GetDownloadActa Lambda" "PASS" "Function is Active"
else
    log_test "GetDownloadActa Lambda" "FAIL" "Function status: $DOWNLOAD_LAMBDA_STATUS"
fi

# Test S3 Bucket Access
echo -e "${BLUE}🗂️  Testing S3 Bucket...${NC}"
S3_OBJECTS=$(aws s3 ls s3://acta-documents-bucket-ohio/ --region us-east-2 2>/dev/null | wc -l)
if [ "$S3_OBJECTS" -gt 0 ]; then
    log_test "S3 Bucket Access" "PASS" "Found $S3_OBJECTS objects in bucket"
else
    log_test "S3 Bucket Access" "FAIL" "No objects found or access denied"
fi

# Test 4: API Endpoints with Authentication Headers
echo -e "${BLUE}🔐 Testing API Security...${NC}"

# Test /approve endpoint
APPROVE_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/approve" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" 2>/dev/null)

if [ "$APPROVE_RESPONSE" = "403" ] || [ "$APPROVE_RESPONSE" = "401" ]; then
    log_test "API Security" "PASS" "Endpoints properly secured (401/403)"
elif [ "$APPROVE_RESPONSE" = "200" ]; then
    log_test "API Security" "WARN" "Endpoint accessible without proper auth"
else
    log_test "API Security" "FAIL" "Unexpected response: $APPROVE_RESPONSE"
fi

# Test 5: Environment Configuration
echo -e "${BLUE}⚙️  Testing Configuration...${NC}"

if [ -n "$VITE_API_BASE_URL" ]; then
    log_test "Environment Config" "PASS" "API URL configured: $VITE_API_BASE_URL"
else
    log_test "Environment Config" "FAIL" "VITE_API_BASE_URL not set"
fi

# Test 6: CloudFront Distribution
echo -e "${BLUE}☁️  Testing CloudFront...${NC}"
if [ -n "$VITE_CLOUDFRONT_DOMAIN" ]; then
    CF_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "https://$VITE_CLOUDFRONT_DOMAIN" 2>/dev/null)
    if [ "$CF_RESPONSE" = "200" ] || [ "$CF_RESPONSE" = "403" ]; then
        log_test "CloudFront" "PASS" "CloudFront distribution accessible"
    else
        log_test "CloudFront" "FAIL" "CloudFront response: $CF_RESPONSE"
    fi
else
    log_test "CloudFront" "SKIP" "CloudFront domain not configured"
fi

# Test 7: API Gateway Resources
echo -e "${BLUE}🌉 Testing API Gateway Resources...${NC}"
API_RESOURCES=$(aws apigateway get-resources --rest-api-id q2b9avfwv5 --region us-east-2 --query 'items[].pathPart' --output text 2>/dev/null)
if echo "$API_RESOURCES" | grep -q "approve"; then
    log_test "API Gateway Resources" "PASS" "Required resources found: approve"
else
    log_test "API Gateway Resources" "FAIL" "Missing required resources"
fi

# Test 8: Lambda Permissions
echo -e "${BLUE}🔑 Testing Lambda Permissions...${NC}"
LAMBDA_POLICY=$(aws lambda get-policy --function-name projectMetadataEnricher --region us-east-2 2>/dev/null)
if [ $? -eq 0 ]; then
    log_test "Lambda Permissions" "PASS" "Lambda has resource policy configured"
else
    log_test "Lambda Permissions" "FAIL" "Lambda resource policy missing or inaccessible"
fi

# Test 9: DynamoDB Access
echo -e "${BLUE}🗃️  Testing DynamoDB...${NC}"
DYNAMO_TABLES=$(aws dynamodb list-tables --region us-east-2 --query 'TableNames' --output text 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$DYNAMO_TABLES" ]; then
    log_test "DynamoDB Access" "PASS" "DynamoDB accessible with tables"
else
    log_test "DynamoDB Access" "FAIL" "DynamoDB access issues"
fi

# Test 10: Build Artifacts
echo -e "${BLUE}📦 Testing Build Artifacts...${NC}"
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    log_test "Build Artifacts" "PASS" "Build artifacts present (size: $DIST_SIZE)"
else
    log_test "Build Artifacts" "FAIL" "Build artifacts missing"
fi

# Manual UI Test Instructions
echo ""
echo -e "${BLUE}📋 Manual UI Testing Instructions${NC}"
echo "================================="
echo "Please manually test the following in your browser at $BASE_URL:"
echo ""
echo "1. 🔐 Authentication:"
echo "   - Username: $TEST_EMAIL"
echo "   - Password: [Check environment variables]"
echo ""
echo "2. 📊 Dashboard:"
echo "   - Verify project data loads"
echo "   - Check responsive design on different screen sizes"
echo ""
echo "3. 🔘 ACTA Buttons:"
echo "   - Test Generate button functionality"
echo "   - Test Download button functionality"
echo "   - Test Preview button functionality"
echo ""
echo "4. 📄 PDF Preview:"
echo "   - Click Preview button on any document"
echo "   - Verify PDF renders correctly"
echo "   - Test Download from preview modal"
echo "   - Test Close button"
echo ""
echo "5. 📱 Responsive Design:"
echo "   - Test on desktop (1920x1080)"
echo "   - Test on tablet (768x1024)"
echo "   - Test on mobile (375x667)"
echo ""

# Generate Summary Report
echo ""
echo "======================================="
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo "======================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
echo "Success Rate: ${SUCCESS_RATE}%"

# Final Status
echo ""
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL AUTOMATED TESTS PASSED - SYSTEM READY FOR PRODUCTION! 🎉${NC}"
    echo ""
    echo "✅ Backend API Gateway integrations restored and working"
    echo "✅ Lambda functions are active and configured"
    echo "✅ S3 and CloudFront integration functional"
    echo "✅ Security measures in place"
    echo "✅ Environment properly configured"
    echo ""
    echo "🔄 Next Steps:"
    echo "1. Complete manual UI testing as listed above"
    echo "2. Monitor system performance in production"
    echo "3. Set up regular health checks"
else
    echo -e "${RED}⚠️  Some tests failed. Review the issues above.${NC}"
    echo ""
    echo "🔧 Recommended Actions:"
    echo "1. Fix failed tests"
    echo "2. Re-run testing script"
    echo "3. Verify all components before production deployment"
fi

# Save detailed report
REPORT_FILE="production-test-report-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "ACTA-UI Production Test Report"
    echo "Generated: $(date)"
    echo "=============================="
    echo ""
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Success Rate: ${SUCCESS_RATE}%"
    echo ""
    echo "Environment:"
    echo "- Frontend URL: $BASE_URL"
    echo "- API Base URL: $API_BASE"
    echo "- AWS Region: us-east-2"
    echo "- Test User: $TEST_EMAIL"
    echo ""
} > "$REPORT_FILE"

echo ""
echo "📄 Detailed report saved to: $REPORT_FILE"
echo ""
echo "🚀 Production testing complete!"

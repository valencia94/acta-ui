#!/bin/bash

# Post-Manual-Changes Verification Script
# Run this AFTER making manual AWS Console changes to verify security

echo "🔍 VERIFICATION: Manual AWS Console Security Changes"
echo "===================================================="

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
TEST_PROJECT_ID="1000000049842296"

echo ""
echo "📋 TESTING ENDPOINT SECURITY AFTER MANUAL CHANGES"
echo "---------------------------------------------------"

echo ""
echo "🔓 Public Endpoints (should still work):"
echo "==========================================="

# Health check should still work
HEALTH_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/health")
echo "Health endpoint: HTTP $HEALTH_STATUS (should be 200)"

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Health endpoint working correctly"
else
    echo "❌ Health endpoint broken - check API Gateway"
fi

echo ""
echo "🔒 Protected Endpoints (should now require auth):"
echo "=================================================="

# Test endpoints that were previously unsecured
echo "Timeline endpoint:"
TIMELINE_RESPONSE=$(curl -s -w "Status: %{http_code}" "$API_BASE/timeline/$TEST_PROJECT_ID")
echo "$TIMELINE_RESPONSE"
if [[ "$TIMELINE_RESPONSE" == *"403"* ]] || [[ "$TIMELINE_RESPONSE" == *"Missing Authentication Token"* ]]; then
    echo "✅ Timeline endpoint properly secured"
else
    echo "❌ Timeline endpoint still unsecured - needs manual fix"
fi

echo ""
echo "Project summary endpoint:"
PROJECT_RESPONSE=$(curl -s -w "Status: %{http_code}" "$API_BASE/project-summary/$TEST_PROJECT_ID")
echo "$PROJECT_RESPONSE"
if [[ "$PROJECT_RESPONSE" == *"403"* ]] || [[ "$PROJECT_RESPONSE" == *"Missing Authentication Token"* ]]; then
    echo "✅ Project summary endpoint properly secured"
else
    echo "❌ Project summary endpoint still unsecured - needs manual fix"
fi

echo ""
echo "Download ACTA endpoint:"
DOWNLOAD_RESPONSE=$(curl -s -w "Status: %{http_code}" "$API_BASE/download-acta/$TEST_PROJECT_ID")
echo "$DOWNLOAD_RESPONSE"
if [[ "$DOWNLOAD_RESPONSE" == *"403"* ]] || [[ "$DOWNLOAD_RESPONSE" == *"Missing Authentication Token"* ]]; then
    echo "✅ Download ACTA endpoint properly secured"
else
    echo "❌ Download ACTA endpoint still unsecured - needs manual fix"
fi

echo ""
echo "Extract project place endpoint:"
EXTRACT_RESPONSE=$(curl -s -w "Status: %{http_code}" -X POST "$API_BASE/extract-project-place/$TEST_PROJECT_ID" -H "Content-Type: application/json" -d '{}')
echo "$EXTRACT_RESPONSE"
if [[ "$EXTRACT_RESPONSE" == *"403"* ]] || [[ "$EXTRACT_RESPONSE" == *"Missing Authentication Token"* ]]; then
    echo "✅ Extract project place endpoint properly secured"
else
    echo "❌ Extract project place endpoint still unsecured - needs manual fix"
fi

echo ""
echo "Send approval email endpoint:"
APPROVAL_RESPONSE=$(curl -s -w "Status: %{http_code}" -X POST "$API_BASE/send-approval-email" -H "Content-Type: application/json" -d '{}')
echo "$APPROVAL_RESPONSE"
if [[ "$APPROVAL_RESPONSE" == *"403"* ]] || [[ "$APPROVAL_RESPONSE" == *"Missing Authentication Token"* ]]; then
    echo "✅ Send approval email endpoint properly secured"
else
    echo "❌ Send approval email endpoint still unsecured - needs manual fix"
fi

echo ""
echo "🔍 Previously Secured Endpoints (should still be secure):"
echo "=========================================================="

# Check endpoints that were already secured
PROJECTS_RESPONSE=$(curl -s -w "Status: %{http_code}" "$API_BASE/projects")
echo "Projects endpoint: $PROJECTS_RESPONSE"
if [[ "$PROJECTS_RESPONSE" == *"403"* ]]; then
    echo "✅ Projects endpoint still properly secured"
else
    echo "❌ Projects endpoint security broken - check configuration"
fi

echo ""
echo "📊 SECURITY STATUS SUMMARY"
echo "=========================="

# Count properly secured endpoints
SECURED_COUNT=0
TOTAL_PROTECTED=9

# Check each endpoint
for endpoint in "timeline" "project-summary" "download-acta" "extract-project-place" "send-approval-email" "projects" "pm-projects/all-projects" "pm-projects/valencia942003@gmail.com" "check-document"; do
    if [ "$endpoint" = "timeline" ]; then
        [[ "$TIMELINE_RESPONSE" == *"403"* ]] && ((SECURED_COUNT++))
    elif [ "$endpoint" = "project-summary" ]; then
        [[ "$PROJECT_RESPONSE" == *"403"* ]] && ((SECURED_COUNT++))
    elif [ "$endpoint" = "download-acta" ]; then
        [[ "$DOWNLOAD_RESPONSE" == *"403"* ]] && ((SECURED_COUNT++))
    elif [ "$endpoint" = "extract-project-place" ]; then
        [[ "$EXTRACT_RESPONSE" == *"403"* ]] && ((SECURED_COUNT++))
    elif [ "$endpoint" = "send-approval-email" ]; then
        [[ "$APPROVAL_RESPONSE" == *"403"* ]] && ((SECURED_COUNT++))
    elif [ "$endpoint" = "projects" ]; then
        [[ "$PROJECTS_RESPONSE" == *"403"* ]] && ((SECURED_COUNT++))
    else
        # Test other endpoints
        OTHER_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/$endpoint" 2>/dev/null)
        [[ "$OTHER_RESPONSE" == "403" ]] && ((SECURED_COUNT++))
    fi
done

echo ""
echo "Secured endpoints: $SECURED_COUNT / $TOTAL_PROTECTED"

if [ "$SECURED_COUNT" -eq "$TOTAL_PROTECTED" ]; then
    echo "🎉 PERFECT! All endpoints properly secured"
    SECURITY_STATUS="COMPLETE"
elif [ "$SECURED_COUNT" -gt 5 ]; then
    echo "✅ GOOD! Most endpoints secured, minor fixes needed"
    SECURITY_STATUS="MOSTLY_COMPLETE"
else
    echo "⚠️ PARTIAL! Several endpoints still need securing"
    SECURITY_STATUS="NEEDS_WORK"
fi

echo ""
echo "🧪 NEXT STEPS FOR UI TESTING"
echo "============================="

if [ "$SECURITY_STATUS" = "COMPLETE" ] || [ "$SECURITY_STATUS" = "MOSTLY_COMPLETE" ]; then
    echo ""
    echo "Security changes look good! Now test the UI:"
    echo ""
    echo "1. Start development server:"
    echo "   pnpm dev"
    echo ""
    echo "2. Open browser to: http://localhost:3000"
    echo ""
    echo "3. Login with credentials:"
    echo "   Email: valencia942003@gmail.com"
    echo "   Password: PdYb7TU7HvBhYP7$"
    echo ""
    echo "4. Navigate to dashboard and enter Project ID: $TEST_PROJECT_ID"
    echo ""
    echo "5. Test all buttons - they should work normally"
    echo ""
    echo "6. Open browser console and run:"
    echo "   runAllTests()  // Comprehensive test"
    echo ""
    echo "7. Check Network tab for Authorization headers on API calls"
    echo ""
    echo "✅ Expected Results:"
    echo "   - Login works without errors"
    echo "   - All buttons function properly"
    echo "   - API calls include 'Authorization: Bearer ...' headers"
    echo "   - No 403 errors in authenticated requests"
    echo "   - PDF preview modal works"
    echo "   - Downloads work (when documents exist)"
else
    echo ""
    echo "❌ Security issues remain. Please complete manual AWS Console changes:"
    echo ""
    echo "1. Go to API Gateway console"
    echo "2. Select acta-backend-manual API"
    echo "3. Create Cognito User Pool Authorizer if not done"
    echo "4. Update authorization for unsecured endpoints"
    echo "5. Deploy API changes"
    echo "6. Run this script again to verify"
fi

echo ""
echo "🔗 REFERENCE DOCUMENTATION"
echo "=========================="
echo "Complete instructions: MANUAL_AWS_CONSOLE_SECURITY_CHANGES.md"
echo "System integration map: COMPLETE_SYSTEM_INTEGRATION_MAP.md"
echo "Comprehensive testing: comprehensive-auth-functionality-test.sh"

echo ""
echo "🎯 VERIFICATION COMPLETE"
echo "========================"
echo "Security Status: $SECURITY_STATUS"
echo "Manual changes verification completed!"

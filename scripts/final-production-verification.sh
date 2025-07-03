#!/bin/bash

echo "🎯 FINAL PRODUCTION VERIFICATION"
echo "================================"
echo ""

FRONTEND_URL="https://d7t9x3j66yd8k.cloudfront.net"
API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo "🌐 Frontend: $FRONTEND_URL"
echo "🔗 API Base: $API_BASE"
echo ""

echo "⏳ Waiting for CloudFront cache invalidation to complete..."
sleep 30

echo ""
echo "🧪 TESTING PRODUCTION APPLICATION"
echo "================================="

# Test 1: Frontend loads
echo "1. Testing frontend application loads..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✅ Frontend loads successfully (Status: $FRONTEND_STATUS)"
else
    echo "   ❌ Frontend failed to load (Status: $FRONTEND_STATUS)"
fi

# Test 2: Check if new bundle is deployed (should not contain old client ID)
echo ""
echo "2. Verifying new build is deployed..."
OLD_CLIENT_CHECK=$(curl -s "$FRONTEND_URL" | grep -c "1hdn8b19ub2kmfkuse8rsjpv8e" || true)
NEW_CLIENT_CHECK=$(curl -s "$FRONTEND_URL" | grep -c "dshos5iou44tuach7ta3ici5m" || true)

if [ "$OLD_CLIENT_CHECK" -eq 0 ] && [ "$NEW_CLIENT_CHECK" -gt 0 ]; then
    echo "   ✅ New build deployed - correct client ID found"
else
    echo "   ⚠️  Build verification - Old ID found: $OLD_CLIENT_CHECK, New ID found: $NEW_CLIENT_CHECK"
fi

# Test 3: API Gateway CORS OPTIONS
echo ""
echo "3. Testing API Gateway CORS (OPTIONS)..."
OPTIONS_RESULT=$(curl -s -H "Origin: $FRONTEND_URL" \
                     -H "Access-Control-Request-Method: GET" \
                     -H "Access-Control-Request-Headers: authorization,content-type" \
                     -X OPTIONS \
                     "$API_BASE/health" \
                     -w "Status: %{http_code}" \
                     -o /dev/null)

if [[ "$OPTIONS_RESULT" == *"200"* ]]; then
    echo "   ✅ CORS OPTIONS request successful"
else
    echo "   ❌ CORS OPTIONS request failed: $OPTIONS_RESULT"
fi

# Test 4: API Gateway actual requests (will show CORS headers or lack thereof)
echo ""
echo "4. Testing API Gateway GET requests..."
GET_HEADERS=$(curl -s -H "Origin: $FRONTEND_URL" \
                  "$API_BASE/health" \
                  -I 2>/dev/null | grep -i "access-control" || echo "No CORS headers found")

echo "   CORS Headers in GET response: $GET_HEADERS"

# Test 5: Key endpoint availability
echo ""
echo "5. Testing key API endpoints..."

ENDPOINTS=(
    "/health"
    "/pm-manager/all-projects"
    "/project-summary/1000000064013473"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "   Testing $endpoint..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE$endpoint")
    case $STATUS in
        200) echo "     ✅ Available (Status: $STATUS)" ;;
        401|403) echo "     🔒 Requires authentication (Status: $STATUS)" ;;
        404) echo "     ❌ Not found (Status: $STATUS)" ;;
        *) echo "     ⚠️  Status: $STATUS" ;;
    esac
done

echo ""
echo "🔍 MANUAL TESTING REQUIRED:"
echo "=========================="
echo ""
echo "1. Open: $FRONTEND_URL"
echo "2. Check browser console for CORS errors"
echo "3. Click 'Admin Dashboard' button"
echo "4. Click 'Load All Projects' button"
echo "5. Verify it makes real API calls (not mock data)"
echo "6. Check network tab for API requests and CORS headers"
echo ""

echo "🎯 Expected Results:"
echo "   • No Cognito client ID errors in console"
echo "   • Dashboard makes real API calls to /pm-manager/all-projects"
echo "   • If CORS errors persist, Lambda functions need CORS headers in responses"
echo "   • Authentication errors (401/403) are expected without valid tokens"
echo ""

echo "✅ Production verification complete!"
echo "Check the manual testing steps above to confirm everything is working."

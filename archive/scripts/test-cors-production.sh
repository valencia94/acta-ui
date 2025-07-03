#!/bin/bash

# Test if CORS fixes are actually working
echo "🧪 Testing CORS fixes on production API..."
echo ""

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "Testing /health endpoint CORS:"
echo "curl -X OPTIONS '$API_BASE/health' -H 'Origin: $ORIGIN' -v"
echo ""

curl -X OPTIONS "$API_BASE/health" \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization" \
    -v 2>&1 | grep -E "(HTTP/|Access-Control)" || echo "No CORS headers found"

echo ""
echo "Testing /pm-manager/all-projects endpoint CORS:"

curl -X OPTIONS "$API_BASE/pm-manager/all-projects" \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization" \
    -v 2>&1 | grep -E "(HTTP/|Access-Control)" || echo "No CORS headers found"

echo ""
echo "🎯 Expected headers:"
echo "   Access-Control-Allow-Origin: $ORIGIN"
echo "   Access-Control-Allow-Credentials: true"
echo "   Access-Control-Allow-Headers: ...Authorization..."

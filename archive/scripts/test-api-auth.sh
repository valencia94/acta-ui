#!/usr/bin/env bash

# Test API connectivity with authentication
BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo "🧪 Testing API with Authentication Issues"
echo "========================================"

echo "1. Testing Health endpoint (should work without auth):"
curl -s -w "\n   Status: %{http_code}\n" "$BASE_URL/health"

echo -e "\n2. Testing protected endpoint without auth (should be 403):"
curl -s -o /dev/null -w "   Status: %{http_code}\n" "$BASE_URL/projects"

echo -e "\n3. Testing with CORS preflight:"
curl -s -o /dev/null -w "   Status: %{http_code}\n" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -X OPTIONS "$BASE_URL/projects"

echo -e "\n4. Testing CORS on health endpoint:"
curl -s -w "\n   Status: %{http_code}\n" \
  -H "Origin: http://localhost:3000" \
  "$BASE_URL/health"

echo -e "\n5. Testing with CloudFront origin (should work):"
curl -s -o /dev/null -w "   Status: %{http_code}\n" \
  -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" \
  "$BASE_URL/projects"

echo -e "\n📊 Diagnosis:"
echo "   - If health works but others fail → Authentication issue"
echo "   - If CORS preflight fails → CORS configuration issue"
echo "   - If CloudFront origin works → Local dev CORS issue"

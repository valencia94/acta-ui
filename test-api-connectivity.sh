#!/bin/bash

# API Gateway Connectivity Test
# This script tests the API Gateway endpoints from the command line

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
TEST_PROJECT_ID="12345"

echo "🚀 Testing API Gateway Connectivity"
echo "Base URL: $API_BASE"
echo "========================================="

# Test 1: Basic connectivity (OPTIONS request)
echo ""
echo "1️⃣ Testing basic connectivity (OPTIONS)..."
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" \
  -X OPTIONS \
  -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" \
  "$API_BASE"

# Test 2: Test root endpoint
echo ""
echo "2️⃣ Testing root endpoint..."
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" \
  "$API_BASE" | head -5

# Test 3: Test individual endpoints (should return 401 without auth)
echo ""
echo "3️⃣ Testing individual endpoints (expecting 401)..."

endpoints=(
  "/project-summary/$TEST_PROJECT_ID"
  "/timeline/$TEST_PROJECT_ID" 
  "/extract-project-place/$TEST_PROJECT_ID"
  "/download-acta/$TEST_PROJECT_ID"
  "/send-approval-email"
)

for endpoint in "${endpoints[@]}"; do
  echo "Testing: $endpoint"
  response=$(curl -s -w "Status: %{http_code}" "$API_BASE$endpoint")
  status=$(echo "$response" | tail -c 4)
  
  if [ "$status" = "401" ]; then
    echo "  ✅ Endpoint exists (requires auth): $status"
  elif [ "$status" = "404" ]; then
    echo "  ❌ Endpoint not found: $status"
  elif [ "$status" = "000" ]; then
    echo "  ❌ Network error (DNS/connectivity issue)"
  else
    echo "  ⚠️  Unexpected status: $status"
  fi
done

# Test 4: CORS preflight
echo ""
echo "4️⃣ Testing CORS preflight..."
curl -s -w "Status: %{http_code}\n" \
  -X OPTIONS \
  -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  "$API_BASE" | grep -E "(access-control|Status:)"

# Test 5: DNS resolution
echo ""
echo "5️⃣ Testing DNS resolution..."
api_host=$(echo "$API_BASE" | sed 's|https\?://||' | sed 's|/.*||')
echo "Host: $api_host"

if nslookup "$api_host" > /dev/null 2>&1; then
  echo "✅ DNS resolution successful"
  ip=$(nslookup "$api_host" | grep "Address:" | tail -1 | awk '{print $2}')
  echo "IP: $ip"
else
  echo "❌ DNS resolution failed"
fi

# Test 6: TLS/SSL
echo ""
echo "6️⃣ Testing TLS/SSL..."
if openssl s_client -connect "$api_host:443" -servername "$api_host" < /dev/null 2>/dev/null | grep -q "CONNECTED"; then
  echo "✅ TLS connection successful"
else
  echo "❌ TLS connection failed"
fi

echo ""
echo "========================================="
echo "✅ Connectivity test completed"
echo ""
echo "If all endpoints return 401, the API is working correctly"
echo "If you see 000 or timeout errors, there's a network/deployment issue"
echo "If you see 404 errors, the Lambda functions may not be deployed"

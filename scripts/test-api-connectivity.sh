#!/bin/bash
# Quick API connectivity test after OAC policy removal

echo "🔍 Testing API connectivity after OAC policy removal..."

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo "🏥 Testing health endpoint (should work without auth)..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${API_BASE}/health" || echo "❌ Health check failed"

echo ""
echo "🔐 Testing protected endpoint (should return 401 Unauthorized, not 403 Forbidden)..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${API_BASE}/project-summary/test" || echo "❌ Protected endpoint test failed"

echo ""
echo "✅ If you see:"
echo "   - Health: 200 OK (or any 2xx/4xx, not 403)"
echo "   - Protected: 401 Unauthorized (not 403 Forbidden)"
echo "   Then the OAC policy fix worked!"

echo ""
echo "🚀 Ready to deploy ACTA-UI!"

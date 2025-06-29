#!/usr/bin/env bash

# Test script for newly deployed conflict-free endpoints
BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo "🧪 Testing Fixed API Endpoints"
echo "=============================="

echo "1. Testing projects-manager endpoint:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/projects-manager"

echo "2. Testing pm-manager/all-projects endpoint:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/pm-manager/all-projects"

echo "3. Testing document-validator endpoint:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/document-validator/test"

echo "4. Testing document-validator HEAD request:"
curl -s -o /dev/null -w "Status: %{http_code}\n" -I "$BASE_URL/document-validator/test"

echo "✅ All tests completed!"
echo "Expected: 403 (auth required) or 200/500 (function working)"
echo "Not expected: 404 (endpoint missing)"

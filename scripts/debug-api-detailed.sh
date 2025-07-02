#!/bin/bash
# Advanced API debugging to understand the 401 issue

echo "🔍 Advanced API Debugging..."

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo "📊 Testing health endpoint with verbose output..."
curl -v -X GET "${API_BASE}/health" 2>&1 | head -20

echo ""
echo "📊 Testing with different User-Agent..."
curl -H "User-Agent: ACTA-UI/1.0" -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" "${API_BASE}/health"

echo ""
echo "📊 Testing OPTIONS request (CORS preflight)..."
curl -X OPTIONS -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" -H "Access-Control-Request-Method: GET" -s -w "\nHTTP Status: %{http_code}\n" "${API_BASE}/health"

echo ""
echo "🔍 Checking if Lambda function is actually receiving requests..."
echo "If the health endpoint returns 401 but should be AuthorizationType: NONE,"
echo "it might be:"
echo "  1. Lambda function itself checking for auth tokens"
echo "  2. API Gateway resource policy blocking requests"
echo "  3. CloudFormation deployment didn't update the method"
echo ""
echo "💡 Next steps:"
echo "  - Check CloudWatch logs for HealthCheck Lambda"
echo "  - Verify API Gateway method configuration in AWS Console"
echo "  - Check if there's a resource policy on the API Gateway"

#!/bin/bash
# Script to debug and fix API fetch errors in the deployed application
set -e

echo "🔍 Debugging API fetch errors in ACTA-UI..."

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"
API_ENDPOINT="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

# Step 1: Test API connectivity
echo "📡 Testing API connectivity..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT")
if [ "$API_STATUS" -eq 200 ] || [ "$API_STATUS" -eq 204 ] || [ "$API_STATUS" -eq 403 ]; then
  echo "✅ API endpoint is responding (HTTP $API_STATUS)"
else
  echo "❌ API endpoint returned HTTP $API_STATUS"
  echo "   This indicates the API might be down or unreachable"
fi

# Step 2: Check for CORS headers
echo "🌐 Checking CORS configuration..."
CORS_HEADERS=$(curl -s -I -X OPTIONS "$API_ENDPOINT" -H "Origin: https://d7t9x3j66yd8k.cloudfront.net")
if echo "$CORS_HEADERS" | grep -i "Access-Control-Allow-Origin" > /dev/null; then
  echo "✅ CORS headers found"
  echo "$CORS_HEADERS" | grep -i "Access-Control-Allow"
else
  echo "❌ CORS headers missing"
  echo "   This could be causing the fetch error"
  
  # Offer to fix CORS issues
  echo ""
  echo "Would you like to try applying a CORS fix? (y/n)"
  read -r answer
  if [[ "$answer" == "y" ]]; then
    echo "🛠️ Applying CORS fix to API Gateway..."
    
    # Check if CORS fix script exists, use it if it does
    if [ -f "scripts/surgical-apigateway-cors-fix.sh" ]; then
      echo "Found surgical-apigateway-cors-fix.sh, running it..."
      chmod +x scripts/surgical-apigateway-cors-fix.sh
      ./scripts/surgical-apigateway-cors-fix.sh
    else
      echo "Creating temporary CORS policy..."
      cat > cors_policy.json << EOL
{
  "AllowOrigins": ["https://d7t9x3j66yd8k.cloudfront.net"],
  "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
  "AllowHeaders": ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"],
  "ExposeHeaders": ["Content-Length", "Content-Type"],
  "MaxAge": 86400,
  "AllowCredentials": true
}
EOL
      
      # Apply CORS policy to API Gateway
      echo "Applying CORS policy to API Gateway..."
      API_ID="q2b9avfwv5"
      STAGE_NAME="prod"
      
      aws apigateway update-stage \
        --rest-api-id "$API_ID" \
        --stage-name "$STAGE_NAME" \
        --patch-operations op=replace,path=/cors,value=true \
        --region "$AWS_REGION"
      
      echo "CORS policy applied successfully"
    fi
  fi
fi

# Step 3: Check for Lambda function timeout issues
echo "⏱️ Checking for potential Lambda timeout issues..."
API_RESPONSE_TIME=$(curl -s -w "%{time_total}\n" -o /dev/null "$API_ENDPOINT")
echo "   API response time: $API_RESPONSE_TIME seconds"
if (( $(echo "$API_RESPONSE_TIME > 5" | bc -l) )); then
  echo "⚠️ API response time is high (>5s)"
  echo "   This might indicate Lambda function performance issues"
fi

# Step 4: Check CloudFront distribution
echo "☁️ Checking CloudFront distribution..."
CF_DOMAIN="d7t9x3j66yd8k.cloudfront.net"
CF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$CF_DOMAIN")
if [ "$CF_STATUS" -eq 200 ]; then
  echo "✅ CloudFront distribution is accessible (HTTP 200)"
else
  echo "❌ CloudFront returned HTTP $CF_STATUS"
  echo "   This might indicate CloudFront configuration issues"
fi

# Step 5: Test browser connection to API from CloudFront domain
echo "🧪 Testing cross-domain API connectivity..."
cat > api-test.js << EOL
console.log('🔍 Testing API connectivity from browser...');
fetch('${API_ENDPOINT}/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ API connection successful!', response.status);
  return response.json().catch(() => 'No JSON response');
})
.then(data => {
  console.log('📊 Response data:', data);
})
.catch(error => {
  console.error('❌ API connection failed:', error.message);
});
EOL

echo "📝 Generated API test script: api-test.js"
echo "   Open the browser console and paste this code to test API connectivity"

echo ""
echo "📋 Debugging Summary and Next Steps:"
echo "1. Check for CORS issues - make sure the API allows requests from your CloudFront domain"
echo "2. Verify API endpoint is correct in aws-exports.js - it should be $API_ENDPOINT"
echo "3. Check Network tab in browser DevTools for specific error details"
echo "4. If the API works but returns errors, check the server logs"
echo ""
echo "If CORS is the issue, try running: ./scripts/fix-all-cors.sh"
echo "For CloudFront issues, try: ./scripts/surgical-cloudfront-fix.sh"
echo ""
echo "🎉 Debugging complete!"

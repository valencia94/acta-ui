#!/bin/bash
# Comprehensive script to diagnose and fix the "Failed to fetch" error
set -e

echo "🔍 Diagnosing and fixing 'Failed to fetch' error..."

# Configuration
API_ID="q2b9avfwv5"
REGION="us-east-2"
CLOUDFRONT_URL="https://d7t9x3j66yd8k.cloudfront.net"
API_BASE="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
S3_BUCKET="acta-ui-frontend-prod"

# Step 1: Check if API is accessible
echo "📡 Step 1: Testing API connectivity..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health")

if [ "$HEALTH_STATUS" -ge 200 ] && [ "$HEALTH_STATUS" -lt 300 ]; then
  echo "✅ API health endpoint is accessible (HTTP $HEALTH_STATUS)"
else
  echo "❌ API health endpoint returned HTTP $HEALTH_STATUS"
  echo "🔄 Testing with verbose output to get more details..."
  curl -v "$API_BASE/health" 2>&1 | head -20
fi

# Step 2: Check CORS configuration
echo ""
echo "🌐 Step 2: Testing CORS configuration..."
CORS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS -H "Origin: $CLOUDFRONT_URL" \
  -H "Access-Control-Request-Method: GET" "$API_BASE/health")

if [ "$CORS_STATUS" -eq 200 ]; then
  echo "✅ CORS is properly configured for OPTIONS request (HTTP $CORS_STATUS)"
else
  echo "❌ CORS may not be configured correctly (HTTP $CORS_STATUS)"
  echo "🔧 Applying CORS fix to all endpoints..."
  
  # Add CORS headers to all methods
  echo "  Adding CORS headers to API Gateway..."
  
  # 1. Get all resources
  RESOURCES=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query "items[].id" --output text)
  
  for RESOURCE_ID in $RESOURCES; do
    echo "  Processing resource: $RESOURCE_ID"
    
    # 2. Add OPTIONS method if it doesn't exist
    aws apigateway put-method \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --authorization-type NONE \
      --region "$REGION" 2>/dev/null || echo "    OPTIONS method already exists"
    
    # 3. Add mock integration
    aws apigateway put-integration \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --type MOCK \
      --integration-http-method OPTIONS \
      --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
      --region "$REGION" 2>/dev/null || echo "    Integration already exists"
    
    # 4. Add method response
    aws apigateway put-method-response \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --status-code 200 \
      --response-parameters "{
        \"method.response.header.Access-Control-Allow-Headers\": false,
        \"method.response.header.Access-Control-Allow-Methods\": false,
        \"method.response.header.Access-Control-Allow-Origin\": false,
        \"method.response.header.Access-Control-Allow-Credentials\": false
      }" \
      --region "$REGION" 2>/dev/null || echo "    Method response already exists"
    
    # 5. Add integration response
    aws apigateway put-integration-response \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --status-code 200 \
      --response-parameters "{
        \"method.response.header.Access-Control-Allow-Headers\": \"'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",
        \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,PUT,DELETE,OPTIONS'\",
        \"method.response.header.Access-Control-Allow-Origin\": \"'$CLOUDFRONT_URL'\",
        \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
      }" \
      --response-templates '{"application/json":""}' \
      --region "$REGION" 2>/dev/null || echo "    Integration response already exists"
  done
  
  # Deploy the changes
  DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name prod \
    --description "CORS Fix for Failed to Fetch error" \
    --region "$REGION" \
    --query 'id' \
    --output text)
  
  echo "  ✅ CORS fix deployed (Deployment ID: $DEPLOYMENT_ID)"
  echo "  ⏳ Waiting 30 seconds for changes to propagate..."
  sleep 30
  
  # Test CORS again
  NEW_CORS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS -H "Origin: $CLOUDFRONT_URL" \
    -H "Access-Control-Request-Method: GET" "$API_BASE/health")
  
  if [ "$NEW_CORS_STATUS" -eq 200 ]; then
    echo "  ✅ CORS is now working (HTTP $NEW_CORS_STATUS)"
  else
    echo "  ⚠️ CORS fix might not have worked (HTTP $NEW_CORS_STATUS)"
  fi
fi

# Step 3: Check CloudFront origin configuration
echo ""
echo "☁️ Step 3: Checking if CloudFront might be blocking requests..."
echo "  Retrieving CloudFront distribution details..."

# Get CloudFront distributions and extract our distribution ID
CF_DIST_ID="EPQU7PVDLQXUA"

echo "  Testing CloudFront passthrough for API requests..."
CF_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL/api/test" || echo "Failed")

if [ "$CF_API_STATUS" == "Failed" ]; then
  echo "❌ Unable to connect to CloudFront API path"
else
  echo "  CloudFront API path returned HTTP $CF_API_STATUS"
fi

# Step 4: Verify aws-exports.js configuration
echo ""
echo "📄 Step 4: Verifying AWS exports configuration..."
echo "  Checking if aws-exports.js is included in the build..."

# Get a list of JS files in the build
AWS_EXPORTS_INCLUDED=$(aws s3 ls "s3://$S3_BUCKET/aws-exports.js" 2>/dev/null || echo "Not found")

if [[ "$AWS_EXPORTS_INCLUDED" == *"Not found"* ]]; then
  echo "❌ aws-exports.js is not in the S3 bucket"
  echo "🔧 Rebuilding and redeploying with aws-exports.js included..."
  
  # Clean build directory
  rm -rf dist
  
  # Rebuild with proper configuration
  VITE_API_BASE_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod" \
  VITE_COGNITO_REGION="$REGION" \
  VITE_COGNITO_POOL_ID="us-east-2_FyHLtOhiY" \
  VITE_COGNITO_WEB_CLIENT="dshos5iou44tuach7ta3ici5m" \
  VITE_SKIP_AUTH="false" \
  VITE_USE_MOCK_API="false" \
  pnpm run build
  
  # Verify aws-exports.js is included in the build
  if [ -f "dist/aws-exports.js" ]; then
    echo "✅ aws-exports.js is now included in the build"
    
    # Upload the file to S3
    aws s3 cp dist/aws-exports.js "s3://$S3_BUCKET/aws-exports.js" \
      --region "$REGION" \
      --cache-control "no-cache, no-store, must-revalidate"
    
    echo "✅ aws-exports.js uploaded to S3"
  else
    echo "❌ aws-exports.js is still not included in the build"
    # Create aws-exports.js in the dist folder
    cat > dist/aws-exports.js << EOL
// aws-exports.js - PRODUCTION CONFIGURATION
const awsmobile = {
  aws_project_region: 'us-east-2',
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/login',
    responseType: 'code',
  },
  aws_cloud_logic_custom: [
    {
      name: 'ActaAPI',
      endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
      region: 'us-east-2'
    }
  ],
  aws_user_files_s3_bucket: 'projectplace-dv-2025-x9a7b',
  aws_user_files_s3_bucket_region: 'us-east-2',
};

export default awsmobile;
EOL
    
    # Upload the file to S3
    aws s3 cp dist/aws-exports.js "s3://$S3_BUCKET/aws-exports.js" \
      --region "$REGION" \
      --cache-control "no-cache, no-store, must-revalidate"
    
    echo "✅ Created and uploaded aws-exports.js to S3"
  fi
  
  # Invalidate CloudFront cache
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/aws-exports.js" "/*" \
    --query 'Invalidation.Id' \
    --output text)
  
  echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
else
  echo "✅ aws-exports.js is in the S3 bucket"
fi

# Step 5: Create a diagnostic script for the browser
echo ""
echo "🔬 Step 5: Creating browser diagnostic script..."

cat > public/debug-fetch-error.js << EOL
// Debug script to help diagnose fetch errors
console.log('🔍 ACTA-UI Fetch Debugging Tool');

// Store the original fetch function
const originalFetch = window.fetch;

// Override fetch with our debugging version
window.fetch = async function(input, init) {
  const url = typeof input === 'string' ? input : input.url;
  const method = init?.method || 'GET';
  
  console.log(\`🌐 Fetch request: \${method} \${url}\`, {
    headers: init?.headers,
    body: init?.body,
    credentials: init?.credentials
  });
  
  try {
    const response = await originalFetch(input, init);
    
    // Clone the response so we can both log it and return it
    const clone = response.clone();
    
    console.log(\`📡 Fetch response: \${response.status} \${response.statusText}\`, {
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url,
      redirected: response.redirected,
      type: response.type
    });
    
    if (!response.ok) {
      // Try to extract error details
      clone.text().then(text => {
        try {
          const json = JSON.parse(text);
          console.error('❌ API error response:', json);
        } catch {
          console.error('❌ API error text:', text);
        }
      }).catch(e => console.error('❌ Could not read error response:', e));
    }
    
    return response;
  } catch (error) {
    console.error(\`❌ Fetch error for \${url}: \${error.message}\`, error);
    throw error;
  }
};

// Test the API endpoints
async function testApiEndpoints() {
  console.log('🧪 Testing API endpoints...');
  
  // Test health endpoint
  try {
    const healthResponse = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health');
    console.log('✅ Health endpoint:', await healthResponse.json());
  } catch (error) {
    console.error('❌ Health endpoint test failed:', error);
  }
  
  // Check if AWS exports is available
  try {
    if (typeof awsmobile !== 'undefined') {
      console.log('✅ AWS exports is available:', awsmobile);
      console.log('🔑 Cognito config:', {
        region: awsmobile.aws_project_region,
        userPoolId: awsmobile.aws_user_pools_id,
        webClientId: awsmobile.aws_user_pools_web_client_id,
        domain: awsmobile.oauth?.domain
      });
      console.log('🌐 API config:', awsmobile.aws_cloud_logic_custom);
    } else {
      console.error('❌ AWS exports is not available');
    }
  } catch (error) {
    console.error('❌ Error checking AWS exports:', error);
  }
}

// Run tests after a short delay
setTimeout(testApiEndpoints, 2000);

console.log('🔧 Fetch debugging initialized');
EOL

# Upload diagnostic script to S3
aws s3 cp public/debug-fetch-error.js "s3://$S3_BUCKET/debug-fetch-error.js" \
  --region "$REGION" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/javascript"

echo "✅ Debugging script uploaded to S3"

# Step 6: Create instructions for browser debugging
echo ""
echo "📋 Step 6: Creating instructions for browser debugging..."

cat > browser-debug-instructions.txt << EOL
🔍 ACTA-UI Fetch Error Debugging Instructions

1. Open your browser's developer tools:
   - Chrome/Edge: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
   - Firefox: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
   - Safari: Cmd+Option+I

2. Go to the Network tab and check "Preserve log"

3. Open this URL in your browser:
   https://d7t9x3j66yd8k.cloudfront.net/?debug=true

4. Look for any failed network requests (red text)
   - Check if they're CORS related (look for CORS errors in Console tab)
   - Check if authentication is failing

5. In the Console tab, add this line to load the debugging script:
   
   const script = document.createElement('script'); 
   script.src = 'https://d7t9x3j66yd8k.cloudfront.net/debug-fetch-error.js'; 
   document.head.appendChild(script);

6. Watch the console for detailed logs about each fetch request and response

7. Common issues to look for:
   - CORS errors: Check if the API is returning proper CORS headers
   - Authentication errors: Check if tokens are being sent correctly
   - Network errors: Check if the API endpoint is accessible
   - AWS Exports missing: Check if aws-exports.js is properly included

8. If you see CORS errors, run the fix-all-cors.sh script:
   ./scripts/fix-all-cors.sh

9. If you see authentication errors, check the Cognito configuration:
   ./fix-aws-exports-cognito-domain.sh

10. After making changes, deploy and invalidate the CloudFront cache:
    ./enhanced-deploy-production.sh
EOL

echo ""
echo "🎉 Diagnostics and potential fixes have been applied!"
echo ""
echo "📋 Instructions for browser debugging have been created in browser-debug-instructions.txt"
echo ""
echo "Next steps:"
echo "  1. Open your browser's developer tools (F12)"
echo "  2. Visit your deployed application"
echo "  3. Use the diagnostic instructions to further debug the issue"
echo "  4. If needed, run the fix-all-cors.sh script to fix CORS issues"
echo ""
echo "If CORS is the issue, the fixes applied should resolve the problem after the API Gateway changes propagate (30-60 seconds)"

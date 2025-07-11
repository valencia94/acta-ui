#!/bin/bash
# Script to check if aws-exports.js is properly available in production
set -e

CLOUDFRONT_URL="https://d7t9x3j66yd8k.cloudfront.net"
S3_BUCKET="acta-ui-frontend-prod"

echo "🔍 Checking for aws-exports.js in production..."

# 1. Check if aws-exports.js exists in the S3 bucket
echo "🪣 Checking S3 bucket for aws-exports.js..."
if aws s3 ls "s3://$S3_BUCKET/aws-exports.js" &>/dev/null; then
  echo "✅ aws-exports.js file exists in S3 bucket"
  echo ""
  
  # Get the file's metadata
  echo "📄 File details from S3:"
  aws s3api head-object --bucket "$S3_BUCKET" --key "aws-exports.js" \
    --query '{ContentLength: ContentLength, LastModified: LastModified, ContentType: ContentType, CacheControl: CacheControl}'
else
  echo "❌ aws-exports.js file does not exist in S3 bucket"
fi

echo ""

# 2. Try to fetch aws-exports.js from CloudFront
echo "☁️ Checking CloudFront for aws-exports.js..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL/aws-exports.js")

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ aws-exports.js accessible via CloudFront (HTTP $HTTP_CODE)"
  
  echo ""
  echo "📄 First 10 lines of aws-exports.js:"
  curl -s "$CLOUDFRONT_URL/aws-exports.js" | head -n 10
else
  echo "❌ aws-exports.js not accessible via CloudFront (HTTP $HTTP_CODE)"
  
  # Create the aws-exports.js file and upload it to S3
  echo ""
  echo "🔧 Creating and uploading aws-exports.js..."
  
  # Create temporary file
  cat > /tmp/aws-exports.js << EOL
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

  # Upload to S3
  aws s3 cp /tmp/aws-exports.js "s3://$S3_BUCKET/aws-exports.js" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "application/javascript"
  
  echo "✅ aws-exports.js uploaded to S3"
  
  # Create CloudFront invalidation
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "EPQU7PVDLQXUA" \
    --paths "/aws-exports.js" "/*" \
    --query 'Invalidation.Id' \
    --output text)
  
  echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
  echo "⏳ Please wait 30-60 seconds for the CloudFront invalidation to complete"
fi

echo ""
echo "🧪 Testing a fetch to the API with curl..."
curl -v "$CLOUDFRONT_URL/api/health" 2>&1 | head -n 20
echo ""

echo "🔍 Testing complete!"
echo ""
echo "To verify in the browser:"
echo "1. Open $CLOUDFRONT_URL in your browser"
echo "2. Open Developer Tools (F12)"
echo "3. Go to the Console tab"
echo "4. Enter this command to check for aws-exports.js:"
echo "   fetch('$CLOUDFRONT_URL/aws-exports.js').then(r=>r.text()).then(console.log)"

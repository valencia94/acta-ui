#!/bin/bash
# fix-s3-cloudfront-paths.sh
# Fix S3 website hosting and CloudFront origin path issue
set -euo pipefail

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
CLOUDFRONT_DOMAIN="d7t9x3j66yd8k.cloudfront.net"

echo "🔧 Fixing S3 website hosting and CloudFront configuration..."

# Step 1: Ensure S3 bucket is configured for website hosting
echo "📦 Configuring S3 bucket for website hosting..."
aws s3 website s3://$S3_BUCKET \
  --index-document index.html \
  --error-document index.html

# Step 2: Update bucket policy to allow public read access (required for static website hosting)
echo "🔒 Updating bucket policy to allow public read access..."
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file:///tmp/bucket-policy.json

# Step 3: Verify the origin configuration in CloudFront
echo "🌐 Updating CloudFront origin settings..."
echo "  Note: This might require manual intervention in the AWS Console if the AWS CLI"
echo "        doesn't support the specific distribution configuration updates needed."

# Step 4: Create a CloudFront origin access identity
echo "🔑 Creating CloudFront Origin Access Identity..."
OAI_RESULT=$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config CallerReference=acta-ui-$(date +%s),Comment=ActaUI-S3Access \
  --query 'CloudFrontOriginAccessIdentity.Id' --output text || echo "existing")

if [[ "$OAI_RESULT" != "existing" ]]; then
  echo "✅ Created new OAI: $OAI_RESULT"
  
  # Step 5: Update bucket policy to use OAI
  echo "🔒 Updating bucket policy to use OAI..."
  cat > /tmp/oai-bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFrontOAIAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_RESULT"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF
  aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file:///tmp/oai-bucket-policy.json
fi

# Step 6: Invalidate CloudFront cache to ensure changes take effect
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Done! Configuration updated."
echo ""
echo "🔍 IMPORTANT: You may still need to update the CloudFront distribution in the AWS Console:"
echo "  1. Navigate to CloudFront console"
echo "  2. Select the distribution ID $CLOUDFRONT_DISTRIBUTION_ID"
echo "  3. Go to the Origins tab"
echo "  4. Edit the S3 origin"
echo "  5. Make sure 'Origin access' is set to 'Origin access control settings (recommended)'"
echo "  6. Save changes and create a new invalidation if needed"
echo ""
echo "🌐 After these changes, verify your website at: https://$CLOUDFRONT_DOMAIN"

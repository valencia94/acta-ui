#!/bin/bash
# Manual AWS S3 + CloudFront Deployment Script

echo "🚀 Deploying ACTA-UI to AWS S3 + CloudFront..."

# Configuration (update these values)
S3_BUCKET="your-acta-ui-bucket"
CLOUDFRONT_DISTRIBUTION_ID="your-distribution-id"
AWS_REGION="us-east-2"

# Upload to S3
echo "📤 Uploading files to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete --cache-control "public,max-age=31536000,immutable" --exclude "*.html"
aws s3 sync dist/ s3://$S3_BUCKET --delete --cache-control "no-cache,no-store,must-revalidate" --exclude "*" --include "*.html"

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Your ACTA-UI should be live with the latest changes!"

#!/bin/bash

# 🔄 Rollback ACTA-UI to state before July 9, 2025 00:36:02 UTC
# Target: July 8, 2025 23:46:36 UTC (before invalidation IWRGBYT9XONTC6ZUL1YK6JL0W)

set -e

echo "🔄 Starting ROLLBACK to July 8, 2025 23:46:36 UTC..."

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"
TARGET_TIME="2025-07-08T23:46:36+00:00"

echo "⚠️  WARNING: This will restore S3 bucket to state BEFORE July 9, 2025 00:36:02 UTC"
echo "This affects invalidation: IWRGBYT9XONTC6ZUL1YK6JL0W"
echo "Proceeding in 5 seconds..."
sleep 5

echo "🔍 Step 1: Finding object versions before $TARGET_TIME..."

# Get all current objects
CURRENT_OBJECTS=$(aws s3api list-objects-v2 --bucket $S3_BUCKET --region $AWS_REGION --query 'Contents[].Key' --output text)

echo "📋 Current objects to rollback:"
echo "$CURRENT_OBJECTS"

echo "🔄 Step 2: Rolling back each object to previous version..."

for object in $CURRENT_OBJECTS; do
    echo "Processing: $object"
    
    # Find the version that existed before our target time
    VERSION_ID=$(aws s3api list-object-versions \
        --bucket $S3_BUCKET \
        --region $AWS_REGION \
        --prefix "$object" \
        --query "Versions[?LastModified<=\`$TARGET_TIME\`] | [0].VersionId" \
        --output text)
    
    if [ "$VERSION_ID" != "None" ] && [ -n "$VERSION_ID" ]; then
        echo "  → Rolling back $object to version: $VERSION_ID"
        
        # Copy the old version back as the current version
        aws s3api copy-object \
            --bucket $S3_BUCKET \
            --copy-source "$S3_BUCKET/$object?versionId=$VERSION_ID" \
            --key "$object" \
            --region $AWS_REGION
        
        echo "  ✅ Restored: $object"
    else
        echo "  ⚠️  No version found for $object before $TARGET_TIME"
    fi
done

echo "🌐 Step 3: Creating CloudFront invalidation..."

# Create invalidation to refresh CloudFront cache
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "🔄 CloudFront invalidation created: $INVALIDATION_ID"
echo "⏳ Waiting for invalidation to complete..."

# Wait for invalidation to complete
aws cloudfront wait invalidation-completed \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --id $INVALIDATION_ID

echo "✅ CloudFront cache invalidated successfully!"

echo ""
echo "🎉 ROLLBACK COMPLETED SUCCESSFULLY!"
echo "🌐 Your application has been restored to: July 8, 2025 23:46:36 UTC"
echo "   📱 CloudFront URL: https://d7t9x3j66yd8k.cloudfront.net"
echo "   🪣 S3 Bucket: $S3_BUCKET"
echo ""
echo "🔍 Test the rollback:"
echo "curl -I https://d7t9x3j66yd8k.cloudfront.net"
echo ""
echo "📊 Rollback details:"
echo "   🎯 Target time: $TARGET_TIME"
echo "   🔄 Invalidation ID: $INVALIDATION_ID"
echo "   ⏪ Reversed invalidation: IWRGBYT9XONTC6ZUL1YK6JL0W"
echo ""
echo "✨ Your ACTA-UI has been restored to the previous state!"

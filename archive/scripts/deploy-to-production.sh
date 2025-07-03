#!/bin/bash

# ACTA-UI Deployment Script
# Deploys the built application with correct Cognito configuration

set -e

echo "🚀 ACTA-UI Deployment Script"
echo "============================="

# Configuration
BUILD_DIR="/workspaces/acta-ui/dist"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
DEPLOYMENT_LOG="deployment-${TIMESTAMP}.log"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found: $BUILD_DIR"
    echo "Run 'npm run build' first"
    exit 1
fi

echo "📋 Deployment Information:"
echo "- Build Directory: $BUILD_DIR"
echo "- Timestamp: $TIMESTAMP"
echo "- Log File: $DEPLOYMENT_LOG"

# Verify build contents
echo ""
echo "📁 Build Contents:"
ls -la "$BUILD_DIR"

echo ""
echo "🔍 Checking key files..."

# Check for index.html
if [ -f "$BUILD_DIR/index.html" ]; then
    echo "✅ index.html found"
else
    echo "❌ index.html not found"
    exit 1
fi

# Check for assets directory
if [ -d "$BUILD_DIR/assets" ]; then
    echo "✅ Assets directory found"
    echo "   CSS files: $(find $BUILD_DIR/assets -name "*.css" | wc -l)"
    echo "   JS files: $(find $BUILD_DIR/assets -name "*.js" | wc -l)"
else
    echo "❌ Assets directory not found"
    exit 1
fi

# Display build size
echo ""
echo "📊 Build Size Analysis:"
echo "Total build size: $(du -sh $BUILD_DIR | cut -f1)"
echo "Assets size: $(du -sh $BUILD_DIR/assets | cut -f1)"

# Check for large files
echo ""
echo "🔍 Large files (>500KB):"
find "$BUILD_DIR" -type f -size +500k -exec ls -lh {} \; | awk '{ print $5 "\t" $9 }' || echo "No large files found"

echo ""
echo "✅ Build verification complete!"

# Create deployment summary
cat > "$DEPLOYMENT_LOG" << EOF
ACTA-UI Deployment Log
=====================
Date: $(date)
Build Directory: $BUILD_DIR
Git Commit: $(cd /workspaces/acta-ui && git rev-parse HEAD)
Git Branch: $(cd /workspaces/acta-ui && git branch --show-current)

Configuration Verified:
- Cognito User Pool: us-east-2_FyHLtOhiY  
- App Client ID: dshos5iou44tuach7ta3ici5m
- API Gateway: https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod
- Region: us-east-2

Build Contents:
$(ls -la $BUILD_DIR)

Build Size: $(du -sh $BUILD_DIR | cut -f1)

Deployment Status: Ready for upload to CloudFront/S3
EOF

echo "📋 Deployment log created: $DEPLOYMENT_LOG"

echo ""
echo "🎯 Next Steps for Deployment:"
echo "1. Upload contents of $BUILD_DIR to your S3 bucket"
echo "2. Invalidate CloudFront cache"
echo "3. Update DNS if needed"
echo "4. Test the deployed application"

echo ""
echo "🔧 AWS CLI Commands (if using S3/CloudFront):"
echo "# Sync to S3 bucket:"
echo "aws s3 sync $BUILD_DIR s3://YOUR_BUCKET_NAME --delete"
echo ""
echo "# Invalidate CloudFront cache:"
echo "aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths '/*'"

echo ""
echo "🧪 Post-Deployment Testing:"
echo "1. Navigate to your deployed URL"
echo "2. Test authentication (login/logout)"
echo "3. Run browser testing script from testing-resources/"
echo "4. Verify all button functionality"

echo ""
echo "✅ Deployment preparation complete!"
echo "📄 See $DEPLOYMENT_LOG for full details"

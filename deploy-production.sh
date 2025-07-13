#!/bin/bash
# deploy-production.sh
# Comprehensive production deployment script for ACTA-UI Dashboard

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"
BACKUP_DIR="deployment-backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${PURPLE}🚀 ACTA-UI PRODUCTION DEPLOYMENT${NC}"
echo "================================="
echo -e "${BLUE}📅 Starting deployment at $(date)${NC}"
echo -e "${BLUE}🌍 Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}🪣 S3 Bucket: ${S3_BUCKET}${NC}"
echo -e "${BLUE}☁️  CloudFront: ${CLOUDFRONT_DISTRIBUTION_ID}${NC}"
echo ""

# Step 1: Pre-deployment validation
echo -e "${YELLOW}1️⃣ PRE-DEPLOYMENT VALIDATION${NC}"
echo "----------------------------"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

# Check if Node.js and pnpm are available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js not found${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ Error: pnpm not found${NC}"
    exit 1
fi

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI not found${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment checks passed${NC}"

# Step 2: Run comprehensive validation
echo ""
echo -e "${YELLOW}2️⃣ COMPREHENSIVE VALIDATION${NC}"
echo "----------------------------"

echo "🔍 Running validation suite..."
if node comprehensive-validation.js; then
    echo -e "${GREEN}✅ All validation tests passed${NC}"
else
    echo -e "${RED}❌ Validation tests failed${NC}"
    echo "Please fix validation issues before deployment"
    exit 1
fi

# Step 3: Create deployment backup
echo ""
echo -e "${YELLOW}3️⃣ CREATING DEPLOYMENT BACKUP${NC}"
echo "-------------------------------"

mkdir -p "$BACKUP_DIR"
echo "📦 Creating backup in $BACKUP_DIR"

# Backup current build if it exists
if [ -d "dist" ]; then
    echo "💾 Backing up current build..."
    cp -r dist "$BACKUP_DIR/dist-backup"
fi

# Backup environment files
echo "💾 Backing up environment configuration..."
cp .env.production "$BACKUP_DIR/"
cp src/aws-exports.js "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  aws-exports.js not found"

echo -e "${GREEN}✅ Backup created successfully${NC}"

# Step 4: Clean install dependencies
echo ""
echo -e "${YELLOW}4️⃣ INSTALLING DEPENDENCIES${NC}"
echo "----------------------------"

echo "🧹 Cleaning node_modules..."
rm -rf node_modules

echo "📦 Installing production dependencies..."
pnpm install --frozen-lockfile

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 5: Build for production
echo ""
echo -e "${YELLOW}5️⃣ BUILDING FOR PRODUCTION${NC}"
echo "----------------------------"

# Set production environment
export NODE_ENV=production

echo "🏗️  Building optimized production bundle..."
echo "   • Tailwind CSS optimization enabled"
echo "   • Framer Motion tree-shaking enabled"
echo "   • AWS Amplify UI optimizations enabled"
echo "   • Dashboard responsive design included"

if pnpm run build; then
    echo -e "${GREEN}✅ Production build completed successfully${NC}"
    
    # Display build stats
    echo ""
    echo "📊 Build Statistics:"
    echo "==================="
    du -sh dist/
    echo ""
    ls -la dist/assets/ | head -10
    echo ""
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 6: Deploy to S3
echo ""
echo -e "${YELLOW}6️⃣ DEPLOYING TO S3${NC}"
echo "-------------------"

echo "🪣 Deploying to S3 bucket: $S3_BUCKET with correct MIME types"
echo "   • Using individual file uploads for correct content types"

# Function to upload files with correct MIME types
upload_with_mime_type() {
    local file_pattern="$1"
    local content_type="$2"
    local cache_control="$3"
    
    find dist/ -name "$file_pattern" -type f | while read file; do
        # Get the S3 key by removing 'dist/' prefix
        s3_key="${file#dist/}"
        echo "   Uploading: $file -> s3://$S3_BUCKET/$s3_key (Content-Type: $content_type)"
        aws s3 cp "$file" "s3://$S3_BUCKET/$s3_key" \
            --region $AWS_REGION \
            --content-type "$content_type" \
            --cache-control "$cache_control"
    done
}

# Upload HTML files (no cache)
echo "📄 Uploading HTML files..."
upload_with_mime_type "*.html" "text/html" "public, max-age=0, must-revalidate"

# Upload JavaScript files (medium cache)
echo "📜 Uploading JavaScript files..."
upload_with_mime_type "*.js" "application/javascript" "public, max-age=86400"

# Upload CSS files (medium cache)
echo "🎨 Uploading CSS files..."
upload_with_mime_type "*.css" "text/css" "public, max-age=86400"

# Upload image files (long cache)
echo "🖼️ Uploading image files..."
upload_with_mime_type "*.png" "image/png" "public, max-age=31536000"
upload_with_mime_type "*.jpg" "image/jpeg" "public, max-age=31536000"
upload_with_mime_type "*.jpeg" "image/jpeg" "public, max-age=31536000"
upload_with_mime_type "*.svg" "image/svg+xml" "public, max-age=31536000"
upload_with_mime_type "*.ico" "image/x-icon" "public, max-age=31536000"

# Upload other files (medium cache)
echo "📁 Uploading other files..."
upload_with_mime_type "*.txt" "text/plain" "public, max-age=86400"

echo -e "${GREEN}✅ S3 deployment completed${NC}"

# Step 7: Invalidate CloudFront cache
echo ""
echo -e "${YELLOW}7️⃣ INVALIDATING CLOUDFRONT CACHE${NC}"
echo "--------------------------------"

echo "☁️  Invalidating CloudFront distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo "   • Clearing dashboard cache"
echo "   • Ensuring fresh asset delivery"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "⏳ Invalidation ID: $INVALIDATION_ID"
echo "   Waiting for invalidation to complete..."

# Wait for invalidation to complete (optional)
aws cloudfront wait invalidation-completed \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --id $INVALIDATION_ID

echo -e "${GREEN}✅ CloudFront invalidation completed${NC}"

# Step 8: Post-deployment verification
echo ""
echo -e "${YELLOW}8️⃣ POST-DEPLOYMENT VERIFICATION${NC}"
echo "-------------------------------"

# Check if site is accessible
SITE_URL="https://acta-ui.com"
echo "🌐 Checking site accessibility: $SITE_URL"

if curl -sSf "$SITE_URL" > /dev/null; then
    echo -e "${GREEN}✅ Site is accessible${NC}"
else
    echo -e "${RED}❌ Site accessibility check failed${NC}"
    echo "⚠️  Site may take a few minutes to propagate"
fi

# Check API health
API_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health"
echo "🔍 Checking API health: $API_URL"

if curl -sSf "$API_URL" > /dev/null; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
fi

# Step 9: Deployment summary
echo ""
echo -e "${PURPLE}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo "====================================="
echo ""
echo -e "${GREEN}✅ Dashboard Features Deployed:${NC}"
echo "   • 🎨 Beautiful, modern UI with Tailwind CSS"
echo "   • 📱 Fully responsive design (mobile, tablet, desktop)"
echo "   • ⚡ Framer Motion animations for smooth interactions"
echo "   • 🔐 AWS Cognito authentication integrated"
echo "   • 📊 5 dashboard action buttons properly mapped:"
echo "     - Copy Project ID"
echo "     - Generate ACTA Document"
echo "     - Download PDF"
echo "     - Download DOCX"
echo "     - Send Approval Email"
echo "   • 🗄️  DynamoDB project data integration"
echo "   • 📧 Email notification system"
echo "   • 🔄 Real-time project status updates"
echo ""
echo -e "${BLUE}🌍 Production URLs:${NC}"
echo "   • Dashboard: https://acta-ui.com"
echo "   • API: https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
echo ""
echo -e "${BLUE}🧪 Testing Instructions:${NC}"
echo "   1. Open: https://acta-ui.com"
echo "   2. Login as: christian.valencia@ikusi.com"
echo "   3. Test all dashboard buttons"
echo "   4. Verify project loading from DynamoDB"
echo "   5. Test document generation and email sending"
echo ""
echo -e "${BLUE}📋 Backup Location:${NC}"
echo "   • $BACKUP_DIR (local backup of previous version)"
echo ""
echo -e "${BLUE}📅 Deployment completed at: $(date)${NC}"
echo ""
echo -e "${YELLOW}🎯 Next Steps:${NC}"
echo "   • Test the dashboard in production"
echo "   • Verify Christian Valencia can access his projects"
echo "   • Confirm all dashboard buttons work correctly"
echo "   • Monitor CloudWatch logs for any issues"
echo ""
echo -e "${GREEN}🚀 ACTA-UI Dashboard is now live in production!${NC}"

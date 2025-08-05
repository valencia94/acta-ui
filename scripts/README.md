# 🚧 ACTA-UI S3 DEPLOYMENT AUDIT

This directory contains comprehensive audit scripts to validate that the ACTA-UI deployment to AWS S3 and CloudFront matches the expected Vite-based SPA requirements.

## 🎯 Production Configuration

- **S3 Bucket**: `acta-ui-frontend-prod`
- **Region**: `us-east-2`
- **CloudFront ID**: `EPQU7PVDLQXUA`
- **Live URL**: https://d7t9x3j66yd8k.cloudfront.net

## 📋 Audit Scripts

### 🔍 Complete Audit Runner
```bash
./scripts/deployment-audit.sh
```
**Comprehensive audit that runs all validation phases:**
- Phase 1: Build validation
- Phase 2: S3 deployment verification
- Phase 3: Live site smoke testing

### 🏗️ Build Validation
```bash
./scripts/validate-build.sh
```
**Validates local build output:**
- ✅ `dist/index.html` exists
- ✅ `dist/aws-exports.js` exists and is 3KB+
- ✅ `dist/assets/` contains JS/CSS chunks
- ✅ `dist/404.html` exists (creates from index.html if missing)
- ✅ Document title is correct
- ✅ Production API URLs are present
- ✅ No test data in build

### ☁️ S3 Deployment Audit
```bash
./scripts/s3-deployment-audit.sh
```
**Validates S3 bucket contents:**
- ✅ `index.html` at bucket root
- ✅ `aws-exports.js` is 3KB+ in size
- ✅ `assets/` folder with JS/CSS chunks
- ✅ `404.html` exists (creates if missing)
- ✅ File timestamps are recent
- 🌐 Creates CloudFront invalidation

### 🧪 Live Site Smoke Test
```bash
./scripts/smoke-test.sh
```
**Tests live site functionality:**
- ✅ Main site loads (/)
- ✅ Login route loads (/login)
- ✅ Dashboard route loads (/dashboard)
- ✅ Resources are accessible (aws-exports.js, assets)
- ✅ SPA routing works correctly
- ✅ Performance is acceptable
- ✅ No 404 errors

## 🚀 Deployment Process

### 1. Standard Deployment
```bash
# Build and deploy
pnpm run build
./deploy-to-s3-cloudfront.sh

# Run audit
./scripts/deployment-audit.sh
```

### 2. Audit-Only (No Deployment)
```bash
# Just validate existing deployment
./scripts/deployment-audit.sh
```

### 3. Manual Verification Steps

After running the automated audit, manually verify:

1. **Browse to**: https://d7t9x3j66yd8k.cloudfront.net
   - Page loads without errors
   - Title shows "Ikusi · Acta Platform"

2. **Test login**: https://d7t9x3j66yd8k.cloudfront.net/login
   - Login form is visible
   - Cognito authentication works

3. **Test dashboard**: https://d7t9x3j66yd8k.cloudfront.net/dashboard
   - Dashboard loads after authentication
   - All components render correctly

4. **DevTools check**:
   - Open DevTools > Sources panel
   - Verify `index.html` is present
   - Verify `main.tsx` is in sources
   - Verify `assets/` folder contains chunks
   - No console errors

## 🔧 Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf dist .vite node_modules/.vite
pnpm install
pnpm run build

# Validate build
./scripts/validate-build.sh
```

### S3 Deployment Issues
```bash
# Check AWS credentials
aws sts get-caller-identity

# Manual S3 verification
aws s3 ls s3://acta-ui-frontend-prod/ --region us-east-2

# Re-deploy
./deploy-to-s3-cloudfront.sh
```

### CloudFront Issues
```bash
# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id EPQU7PVDLQXUA \
  --paths "/*"

# Check distribution status
aws cloudfront get-distribution \
  --id EPQU7PVDLQXUA \
  --query 'Distribution.Status'
```

### Live Site Issues
```bash
# Test connectivity
curl -I https://d7t9x3j66yd8k.cloudfront.net

# Run smoke test
./scripts/smoke-test.sh
```

## ✅ Expected Audit Results

When everything is working correctly, you should see:

```
🚧 ACTA-UI COMPLETE DEPLOYMENT AUDIT
====================================

🔍 PHASE 1: BUILD VALIDATION
============================
✅ Phase 1 PASSED: Build validation successful

🔍 PHASE 2: S3 DEPLOYMENT VALIDATION
====================================
✅ Phase 2 PASSED: S3 deployment verified

🔍 PHASE 3: LIVE SITE SMOKE TEST
===============================
✅ Phase 3 PASSED: Live site working correctly

📊 COMPREHENSIVE AUDIT SUMMARY
===============================
Phases Passed: 3/3
Phases Failed: 0/3

🎉 AUDIT PASSED: ACTA-UI deployment is healthy!
```

## 🚨 Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing `aws-exports.js` | Build validation fails | Copy from `public/` to `dist/` |
| Missing `404.html` | S3 audit fails | Auto-created from `index.html` |
| Stale CloudFront cache | Old content loads | Run CloudFront invalidation |
| S3 permissions | 403 errors | Check bucket policy and IAM |
| Build artifacts missing | Empty `dist/` folder | Run `pnpm run build` |

## 🔐 AWS Configuration Required

For S3 and CloudFront validation, ensure AWS CLI is configured:

```bash
aws configure
# Enter your AWS credentials with permissions for:
# - S3: s3:ListBucket, s3:GetObject, s3:PutObject
# - CloudFront: cloudfront:CreateInvalidation, cloudfront:GetDistribution
```

## 📝 Notes

- All scripts use proper exit codes (0 = success, 1 = failure)
- Color-coded output for easy status identification
- Scripts can run independently or as part of the complete audit
- Designed for CI/CD integration
- Safe to run multiple times (idempotent operations)
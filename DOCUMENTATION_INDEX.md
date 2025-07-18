# ACTA-UI Documentation Index

## 📋 **Essential Documentation**

### Production Status & Testing

- **`PRODUCTION_TEST_RESULTS.md`** - Comprehensive test results for all production functionality
- **`DEPLOYMENT_SUCCESS_FINAL_REPORT.md`** - Final deployment status and infrastructure verification
- **`COGNITO_VISUAL_ENHANCEMENTS_FINAL_REPORT.md`** - Professional branding implementation results
- **`DESIGN_REVIEW.md`** - UI/UX design decisions and client branding specifications

### Test Results

- **`auth-test-report.json`** - Detailed authentication flow test results

## 🛠️ **Essential Scripts & Tools**

### Production Operations

- **`production-test-suite.sh`** - Comprehensive test suite for all production functionality
- **`deploy-to-s3-cloudfront.sh`** - Main deployment script for S3/CloudFront
- **`fix-cors-complete-production.sh`** - Final CORS configuration for all API endpoints
- **`update-cognito-branding-aws-safe.sh`** - Safe Cognito Hosted UI branding updates

### Diagnostics & User Management

- **`create-test-user.sh`** - Create test users in Cognito for testing
- **`diagnose-cognito-auth.sh`** - Diagnose authentication configuration issues
- **`diagnose-cognito-config.sh`** - Verify Cognito domain and client configuration

### Preview & Verification

- **`cognito-signin-preview.html`** - Static preview of enhanced Cognito sign-in page

## 📁 **Archive Structure**

### `archive/scripts/`

Contains historical versions and alternative implementations:

- CORS fix variations (`fix-cors-*`)
- Cognito branding experiments (`update-cognito-*`)
- Individual test scripts (`test-*`)
- Diagnostic utilities (`diagnose-*`)
- Lambda helpers and deployment utilities

### `archive/docs/`

Contains development history and interim reports:

- Status summaries and resolution reports
- Deployment strategies and checklists
- Authentication and CORS fix documentation
- Cache invalidation and infrastructure reports

### `archive/temp/`

Contains temporary files and configurations:

- Development configuration files
- Temporary HTML and YAML files
- Schema definitions

## 🏗️ **Core Application Structure**

### Configuration

- **`.env.production`** - Production environment variables (Cognito domain, API URLs)
- **`amplify.yml`** - AWS Amplify deployment configuration
- **`vite.config.ts`** - Vite build configuration
- **`package.json`** - Dependencies and scripts

### Source Code

- **`src/`** - All application source code
- **`public/`** - Static assets and favicons
- **`tests/`** - Test suites and specifications

### Infrastructure

- **`.github/workflows/`** - CI/CD pipeline configurations
- **`infra/`** - Infrastructure as Code (if applicable)
- **`amplify/`** - AWS Amplify backend configuration

## 📝 **Usage Guide**

### Running Tests

```bash
# Run comprehensive production test suite
./production-test-suite.sh

# Diagnose authentication issues
./diagnose-cognito-auth.sh

# Create test users
./create-test-user.sh
```

### Deployment

```bash
# Deploy to production
./deploy-to-s3-cloudfront.sh

# Update Cognito branding
./update-cognito-branding-aws-safe.sh

# Fix CORS if needed
./fix-cors-complete-production.sh
```

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## 🎯 **Key Achievements**

1. **Authentication Resolution** - Fixed Cognito domain configuration and CORS issues
2. **Professional Branding** - Implemented client-ready Cognito Hosted UI styling
3. **Comprehensive Testing** - Created robust test suite covering all critical paths
4. **Production Deployment** - Stable S3/CloudFront deployment with proper caching
5. **Clean Architecture** - Organized codebase with clear separation of concerns
6. **Documentation** - Complete documentation for maintenance and future development

---

_For technical support or deployment questions, refer to the individual script documentation and test results._

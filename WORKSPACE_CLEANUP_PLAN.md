# ACTA-UI Workspace Cleanup Plan

## Current Status
The workspace contains numerous duplicate scripts, temporary files, and documentation that accumulated during development. This plan will systematically clean up the workspace while preserving essential files.

## Files to Keep (Essential Production Files)

### Core Application Files
- `src/` - Source code (keep all)
- `public/` - Static assets (keep all)
- `package.json`, `pnpm-lock.yaml` - Dependencies
- `vite.config.ts`, `tsconfig.json`, `vitest.config.ts` - Build config
- `tailwind.config.js` - Styling config
- `.env.production`, `.env.example` - Environment configs
- `README.md`, `LICENSE` - Documentation

### Infrastructure & Deployment
- `.github/workflows/` - CI/CD (keep all)
- `amplify.yml` - AWS Amplify config
- `deploy-to-s3-cloudfront.sh` - Main deployment script
- `Makefile` - Build automation

### Essential Scripts (Keep Latest/Best Versions)
- `production-test-suite.sh` - Comprehensive test suite
- `create-test-user.sh` - User management
- `diagnose-cognito-auth.sh` - Authentication diagnostics
- `fix-cors-complete-production.sh` - Final CORS fixes
- `update-cognito-branding-aws-safe.sh` - Safe branding updates

### Key Documentation (Consolidate)
- `PRODUCTION_TEST_RESULTS.md` - Latest test results
- `DEPLOYMENT_SUCCESS_FINAL_REPORT.md` - Final deployment status
- `COGNITO_VISUAL_ENHANCEMENTS_FINAL_REPORT.md` - Final branding report

## Files to Archive

### Duplicate/Versioned Scripts
- `fix-cors-pm-manager-all-projects-v2.sh`, `fix-cors-pm-manager-all-projects-v3.sh`
- Multiple CORS fix variants
- Multiple Cognito branding scripts (keep only the safe version)

### Interim Documentation
- Multiple status reports and summaries
- Development notes and strategies

### Development/Debug Files
- `browser-debug.js`
- Debug test scripts
- Temporary verification files

## Files to Delete

### AWS Installation Files
- `awscliv2.zip` - Temporary installation file

### Duplicate/Outdated Files
- `package-lock.json` (we use pnpm)
- Obsolete scripts and configs

## Cleanup Actions

1. Create `archive/` directory structure
2. Move non-essential files to archive
3. Delete temporary/duplicate files
4. Update documentation index
5. Clean up git history markers

# 🚀 GitHub Pages Deployment Setup

This document explains how to set up GitHub Pages deployment for the ACTA-UI project.

## 📋 **Current Status**

The project has two deployment methods:
1. **AWS S3/CloudFront** (Primary) - via `build_deploy.yml`
2. **GitHub Pages** (Secondary) - via `deploy-github-pages.yml` ✨ **NEW**

## 🛠️ **Setup GitHub Pages**

### 1. Enable GitHub Pages in Repository Settings
1. Go to repository **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. Save the configuration

### 2. Workflow Configuration
The new workflow `.github/workflows/deploy-github-pages.yml` will:
- ✅ Build the React application with correct base path
- ✅ Run all tests and linting
- ✅ Deploy to GitHub Pages
- ✅ Verify deployment accessibility

### 3. Base Path Configuration
GitHub Pages deployments use the repository name as base path:
- **CloudFront URL**: `https://d7t9x3j66yd8k.cloudfront.net`
- **GitHub Pages URL**: `https://valencia94.github.io/acta-ui/`

The build process automatically sets `--base=/acta-ui/` for Pages deployment.

## 🎯 **Deployment URLs**

### Primary (AWS CloudFront)
- URL: `https://d7t9x3j66yd8k.cloudfront.net`
- Triggered: Push to `develop` branch
- Workflow: `build_deploy.yml`

### Secondary (GitHub Pages)
- URL: `https://valencia94.github.io/acta-ui/`
- Triggered: Push to `develop` branch  
- Workflow: `deploy-github-pages.yml`

## 🔄 **Workflow Triggers**

Both workflows trigger on:
- Push to `develop` branch
- Manual dispatch (`workflow_dispatch`)

## 📊 **Build Process**

### Common Steps (Both Deployments)
1. Install dependencies with pnpm
2. Run Prettier formatting
3. Run ESLint checks and fixes
4. Run TypeScript compilation
5. Run Vitest unit tests
6. Build React application

### AWS Deployment Specific
- Sync to S3 bucket
- Update CloudFront distribution
- Apply OAC bucket policy
- Invalidate CloudFront cache

### GitHub Pages Specific
- Build with GitHub Pages base path
- Upload Pages artifact
- Deploy using GitHub Actions
- Verify deployment accessibility

## 🧪 **Testing**

Both deployments include post-deployment verification:
- Test main routes (/, /login, /dashboard)
- Verify React app loads correctly
- Check API connectivity (health endpoint)

## 🔧 **Manual Deployment**

To manually trigger either deployment:
1. Go to **Actions** tab
2. Select the desired workflow
3. Click **Run workflow**
4. Select branch and run

## 📝 **Notes**

- GitHub Pages deployment is currently configured as a secondary option
- Primary production deployment remains on CloudFront
- Both deployments use the same API endpoints
- GitHub Pages URL will include `/acta-ui/` base path

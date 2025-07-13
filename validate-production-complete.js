#!/usr/bin/env node

// Complete Production Validation Script
// This script validates the entire ACTA-UI production setup with pnpm

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 ACTA-UI Complete Production Validation');
console.log('=========================================');
console.log(`Date: ${new Date().toLocaleDateString()}`);
console.log(`Time: ${new Date().toLocaleTimeString()}`);
console.log();

let validationsPassed = 0;
let totalValidations = 0;

function runValidation(name, validationFunction) {
  totalValidations++;
  console.log(`🔍 ${name}...`);
  
  try {
    const result = validationFunction();
    if (result) {
      console.log(`✅ ${name}: PASS`);
      validationsPassed++;
    } else {
      console.log(`❌ ${name}: FAIL`);
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
  }
  console.log();
}

// Validation 1: Package Manager
runValidation('Package Manager (pnpm)', () => {
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    
    console.log(`  - pnpm version: ${pnpmVersion}`);
    console.log(`  - package.json requires: ${packageJson.packageManager}`);
    
    return packageJson.packageManager && packageJson.packageManager.includes('pnpm');
  } catch (error) {
    return false;
  }
});

// Validation 2: Dependencies
runValidation('Dependencies Installation', () => {
  try {
    const result = execSync('pnpm list aws-amplify @aws-amplify/auth', { encoding: 'utf8' });
    
    const hasAwsAmplify = result.includes('aws-amplify');
    const hasAwsAuth = result.includes('@aws-amplify/auth');
    
    console.log(`  - aws-amplify: ${hasAwsAmplify ? '✅' : '❌'}`);
    console.log(`  - @aws-amplify/auth: ${hasAwsAuth ? '✅' : '❌'}`);
    
    return hasAwsAmplify && hasAwsAuth;
  } catch (error) {
    return false;
  }
});

// Validation 3: Build Process
runValidation('Build Process', () => {
  try {
    console.log('  - Running pnpm build...');
    const buildResult = execSync('pnpm build', { encoding: 'utf8' });
    
    const buildSuccess = buildResult.includes('✓ built in');
    const distExists = existsSync('dist/index.html');
    
    console.log(`  - Build completed: ${buildSuccess ? '✅' : '❌'}`);
    console.log(`  - dist/index.html exists: ${distExists ? '✅' : '❌'}`);
    
    return buildSuccess && distExists;
  } catch (error) {
    console.log(`  - Build error: ${error.message}`);
    return false;
  }
});

// Validation 4: AWS Configuration
runValidation('AWS Configuration Files', () => {
  try {
    const srcConfig = readFileSync('src/aws-exports.js', 'utf8');
    const publicConfig = readFileSync('public/aws-exports.js', 'utf8');
    const distConfig = existsSync('dist/aws-exports.js') ? readFileSync('dist/aws-exports.js', 'utf8') : '';
    
    const srcValid = srcConfig.includes('userPoolId') && srcConfig.includes('export default');
    const publicValid = publicConfig.includes('userPoolId') && (publicConfig.includes('window.awsExports') || publicConfig.includes('window.awsmobile'));
    const distValid = distConfig.includes('userPoolId');
    
    console.log(`  - src/aws-exports.js: ${srcValid ? '✅' : '❌'}`);
    console.log(`  - public/aws-exports.js: ${publicValid ? '✅' : '❌'}`);
    console.log(`  - dist/aws-exports.js: ${distValid ? '✅' : '❌'}`);
    
    return srcValid && publicValid && distValid;
  } catch (error) {
    console.log(`  - Config error: ${error.message}`);
    return false;
  }
});

// Validation 5: Authentication Components
runValidation('Authentication Components', () => {
  try {
    const useAuth = readFileSync('src/hooks/useAuth.ts', 'utf8');
    const useAuthContext = readFileSync('src/hooks/useAuthContext.tsx', 'utf8');
    const loginPage = readFileSync('src/pages/Login.tsx', 'utf8');
    
    const useAuthValid = useAuth.includes('aws-amplify') && useAuth.includes('getCurrentUser');
    const contextValid = useAuthContext.includes('aws-amplify/auth') && useAuthContext.includes('signOut');
    const loginValid = loginPage.includes('signIn') && loginPage.includes('aws-amplify');
    
    console.log(`  - useAuth hook: ${useAuthValid ? '✅' : '❌'}`);
    console.log(`  - useAuthContext hook: ${contextValid ? '✅' : '❌'}`);
    console.log(`  - Login page: ${loginValid ? '✅' : '❌'}`);
    
    return useAuthValid && contextValid && loginValid;
  } catch (error) {
    console.log(`  - Auth components error: ${error.message}`);
    return false;
  }
});

// Validation 6: Environment Variables
runValidation('Environment Variable Types', () => {
  try {
    const viteEnv = readFileSync('src/vite-env.d.ts', 'utf8');
    
    const hasCloudFront = viteEnv.includes('VITE_CLOUDFRONT_DISTRIBUTION_ID');
    const hasApiUrl = viteEnv.includes('VITE_API_BASE_URL');
    const hasCognitoPool = viteEnv.includes('VITE_COGNITO_POOL_ID');
    const hasS3Bucket = viteEnv.includes('VITE_S3_BUCKET_NAME');
    
    console.log(`  - CloudFront ID: ${hasCloudFront ? '✅' : '❌'}`);
    console.log(`  - API Base URL: ${hasApiUrl ? '✅' : '❌'}`);
    console.log(`  - Cognito Pool ID: ${hasCognitoPool ? '✅' : '❌'}`);
    console.log(`  - S3 Bucket: ${hasS3Bucket ? '✅' : '❌'}`);
    
    return hasCloudFront && hasApiUrl && hasCognitoPool && hasS3Bucket;
  } catch (error) {
    console.log(`  - Environment types error: ${error.message}`);
    return false;
  }
});

// Validation 7: Bundle Optimization
runValidation('Bundle Optimization', () => {
  try {
    const viteConfig = readFileSync('vite.config.ts', 'utf8');
    
    const hasManualChunks = viteConfig.includes('manualChunks');
    const hasRollupOptions = viteConfig.includes('rollupOptions');
    
    console.log(`  - Manual chunks configured: ${hasManualChunks ? '✅' : '❌'}`);
    console.log(`  - Rollup options configured: ${hasRollupOptions ? '✅' : '❌'}`);
    
    return hasManualChunks && hasRollupOptions;
  } catch (error) {
    console.log(`  - Bundle config error: ${error.message}`);
    return false;
  }
});

// Validation 8: Deployment Scripts
runValidation('Deployment Scripts', () => {
  try {
    const deployScript = existsSync('scripts/push-spa-routes.sh');
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    
    const hasDeployScript = packageJson.scripts && packageJson.scripts.deploy;
    const hasPredeployScript = packageJson.scripts && packageJson.scripts.predeploy;
    
    console.log(`  - push-spa-routes.sh exists: ${deployScript ? '✅' : '❌'}`);
    console.log(`  - deploy script in package.json: ${hasDeployScript ? '✅' : '❌'}`);
    console.log(`  - predeploy script in package.json: ${hasPredeployScript ? '✅' : '❌'}`);
    
    return deployScript && hasDeployScript && hasPredeployScript;
  } catch (error) {
    console.log(`  - Deployment scripts error: ${error.message}`);
    return false;
  }
});

// Summary
console.log('═══════════════════════════════════════');
console.log('🎯 VALIDATION SUMMARY');
console.log('═══════════════════════════════════════');
console.log(`Total Validations: ${totalValidations}`);
console.log(`Passed: ${validationsPassed}`);
console.log(`Failed: ${totalValidations - validationsPassed}`);
console.log(`Success Rate: ${Math.round((validationsPassed / totalValidations) * 100)}%`);
console.log();

if (validationsPassed === totalValidations) {
  console.log('🎉 ALL VALIDATIONS PASSED!');
  console.log('✅ ACTA-UI is ready for production deployment with pnpm!');
  console.log();
  console.log('To deploy:');
  console.log('1. Set environment variables: BUCKET, AWS_REGION');
  console.log('2. Run: pnpm run deploy');
  console.log();
  process.exit(0);
} else {
  console.log('⚠️  Some validations failed. Please review the configuration.');
  process.exit(1);
}

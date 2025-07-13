#!/usr/bin/env node

// Production Authentication and Configuration Test
// This script validates the key components without requiring a browser environment

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 ACTA-UI Production Authentication Test Suite');
console.log('================================================');
console.log(`Date: ${new Date().toLocaleDateString()}`);
console.log(`Time: ${new Date().toLocaleTimeString()}`);
console.log();

let testsPassed = 0;
let totalTests = 0;

function runTest(testName, testFunction) {
  totalTests++;
  try {
    const result = testFunction();
    if (result) {
      console.log(`✅ ${testName}: PASS`);
      testsPassed++;
    } else {
      console.log(`❌ ${testName}: FAIL`);
    }
  } catch (error) {
    console.log(`❌ ${testName}: ERROR - ${error.message}`);
  }
}

// Test 1: Check aws-exports.js files exist and are valid
runTest('AWS Exports Files Exist', () => {
  const srcExports = readFileSync(join(__dirname, 'src/aws-exports.js'), 'utf8');
  const publicExports = readFileSync(join(__dirname, 'public/aws-exports.js'), 'utf8');
  const distExports = readFileSync(join(__dirname, 'dist/aws-exports.js'), 'utf8');
  
  return srcExports.includes('userPoolId') && 
         publicExports.includes('userPoolId') && 
         distExports.includes('userPoolId');
});

// Test 2: Check package.json uses correct package manager
runTest('Package Manager Configuration', () => {
  const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
  return packageJson.packageManager && packageJson.packageManager.includes('pnpm');
});

// Test 3: Check AWS Amplify versions
runTest('AWS Amplify Version Compatibility', () => {
  const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
  const amplifyVersion = packageJson.dependencies['aws-amplify'];
  const authVersion = packageJson.dependencies['@aws-amplify/auth'];
  
  return amplifyVersion && authVersion && 
         amplifyVersion.includes('6.') && 
         authVersion.includes('6.');
});

// Test 4: Check build artifacts exist
runTest('Build Artifacts Present', () => {
  const indexHtml = readFileSync(join(__dirname, 'dist/index.html'), 'utf8');
  return indexHtml.includes('Ikusi · Acta Platform') && 
         indexHtml.includes('assets/');
});

// Test 5: Check TypeScript configuration
runTest('TypeScript Configuration', () => {
  const tsConfig = readFileSync(join(__dirname, 'tsconfig.json'), 'utf8');
  return tsConfig.includes('compilerOptions') && 
         tsConfig.includes('target') && 
         tsConfig.includes('ESNext');
});

// Test 6: Check Vite configuration
runTest('Vite Configuration', () => {
  const viteConfig = readFileSync(join(__dirname, 'vite.config.ts'), 'utf8');
  return viteConfig.includes('rollupOptions') && 
         viteConfig.includes('manualChunks');
});

// Test 7: Check authentication hook exists
runTest('Authentication Hook Present', () => {
  const authHook = readFileSync(join(__dirname, 'src/hooks/useAuthContext.tsx'), 'utf8');
  return authHook.includes('aws-amplify/auth') && 
         authHook.includes('signOut');
});

// Test 8: Check main entry point
runTest('Main Entry Point Valid', () => {
  const mainTs = readFileSync(join(__dirname, 'src/main.tsx'), 'utf8');
  return mainTs.includes('Amplify.configure') && 
         mainTs.includes('ReactDOM.createRoot');
});

// Test 9: Check environment types
runTest('Environment Types Declaration', () => {
  const viteEnv = readFileSync(join(__dirname, 'src/vite-env.d.ts'), 'utf8');
  return viteEnv.includes('VITE_CLOUDFRONT_DISTRIBUTION_ID') && 
         viteEnv.includes('VITE_COGNITO_POOL_ID') && 
         viteEnv.includes('VITE_API_BASE_URL');
});

// Test 10: Check API integration
runTest('API Integration Files', () => {
  const apiLib = readFileSync(join(__dirname, 'src/lib/api.ts'), 'utf8');
  const apiAmplify = readFileSync(join(__dirname, 'src/lib/api-amplify.ts'), 'utf8');
  return apiLib.includes('fetch') && 
         apiAmplify.includes('aws-amplify');
});

console.log();
console.log('🎯 TEST SUMMARY');
console.log('===============');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${totalTests - testsPassed}`);
console.log(`Success Rate: ${Math.round((testsPassed / totalTests) * 100)}%`);

if (testsPassed === totalTests) {
  console.log('🎉 ALL TESTS PASSED! Production configuration is valid.');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the configuration.');
  process.exit(1);
}

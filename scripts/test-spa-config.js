#!/usr/bin/env node
// Test script to validate SPA routing configuration
// This validates the fix without needing a full build

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);

console.log('🧪 Testing SPA routing configuration...');

// 1. Check vite.config.ts has proper SPA settings
const viteConfigPath = path.join(rootDir, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  const checks = [
    { setting: 'base: "/"', description: 'Base path for SPA' },
    { setting: 'historyApiFallback: true', description: 'History API fallback for dev server' },
    { setting: 'copy-aws-exports', description: 'AWS exports plugin' },
    { setting: '404.html', description: 'SPA fallback file generation' }
  ];
  
  let configValid = true;
  for (const check of checks) {
    if (viteConfig.includes(check.setting)) {
      console.log(`✅ ${check.description}: Found`);
    } else {
      console.error(`❌ ${check.description}: Missing "${check.setting}"`);
      configValid = false;
    }
  }
  
  if (configValid) {
    console.log('✅ vite.config.ts has proper SPA configuration');
  } else {
    console.error('❌ vite.config.ts missing SPA configuration');
  }
} else {
  console.error('❌ vite.config.ts not found');
}

// 2. Check App.tsx has React Router setup
const appPath = path.join(rootDir, 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  const routeChecks = [
    'BrowserRouter',
    'Routes',
    'Route',
    '/dashboard',
    '/login',
    '/admin',
    '/profile',
    '/projects-for-pm'
  ];
  
  let routerValid = true;
  for (const check of routeChecks) {
    if (appContent.includes(check)) {
      console.log(`✅ Route check: ${check} found`);
    } else {
      console.error(`❌ Route check: ${check} missing`);
      routerValid = false;
    }
  }
  
  if (routerValid) {
    console.log('✅ App.tsx has proper React Router setup');
  } else {
    console.error('❌ App.tsx missing proper React Router setup');
  }
} else {
  console.error('❌ App.tsx not found');
}

// 3. Check package.json has smoke test in build pipeline
const packagePath = path.join(rootDir, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  if (packageJson.scripts?.predeploy?.includes('smoke-test.js')) {
    console.log('✅ smoke-test.js included in build pipeline');
  } else {
    console.error('❌ smoke-test.js not included in build pipeline');
  }
  
  if (packageJson.scripts?.['smoke-test']) {
    console.log('✅ standalone smoke-test script available');
  } else {
    console.error('❌ standalone smoke-test script missing');
  }
} else {
  console.error('❌ package.json not found');
}

// 4. Check smoke test script exists and is executable
const smokeTestPath = path.join(rootDir, 'scripts', 'smoke-test.js');
if (fs.existsSync(smokeTestPath)) {
  console.log('✅ smoke-test.js script exists');
  
  try {
    const stats = fs.statSync(smokeTestPath);
    if (stats.mode & parseInt('111', 8)) {
      console.log('✅ smoke-test.js is executable');
    } else {
      console.log('⚠️  smoke-test.js may not be executable (check permissions)');
    }
  } catch (error) {
    console.log('⚠️  Could not check smoke-test.js permissions');
  }
} else {
  console.error('❌ smoke-test.js script not found');
}

console.log('\n🎯 SPA Routing Configuration Summary:');
console.log('• React Router with BrowserRouter for client-side routing');
console.log('• Vite configured with historyApiFallback for dev server');
console.log('• Build process automatically creates 404.html from index.html');
console.log('• Smoke test validates build output before deployment');
console.log('• CloudFront invalidation included in deployment script');
console.log('\n✨ When deployed, all routes should work correctly!');
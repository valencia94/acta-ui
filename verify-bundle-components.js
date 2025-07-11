#!/usr/bin/env node
// verify-bundle-components.js
// Script to verify that all critical components are included in the production bundle

import fs from 'fs';
import path from 'path';

console.log('🔍 VERIFYING PRODUCTION BUNDLE COMPONENTS');
console.log('=' .repeat(50));

// List of critical components that must be in the bundle
const criticalComponents = [
  'Dashboard',
  'AdminDashboard', 
  'Login',
  'Header',
  'ProjectTable',
  'PMProjectManager',
  'DynamoProjectsView',
  'DocumentStatus',
  'EmailInputDialog',
  'ActaButtons',
  'PDFPreview'
];

// List of critical pages
const criticalPages = [
  'Dashboard',
  'AdminDashboard',
  'Login'
];

// List of critical API functions
const criticalApiFunctions = [
  'getSummary',
  'getTimeline',
  'getDownloadUrl',
  'sendApprovalEmail',
  'generateActaDocument',
  'getProjectsByPM'
];

// List of critical utilities
const criticalUtils = [
  'fetchWrapper',
  'getAuthToken',
  'backendDiagnostic'
];

function checkBundleContents() {
  console.log('\n📦 BUNDLE ANALYSIS:');
  
  // Check if dist directory exists
  if (!fs.existsSync('dist')) {
    console.log('❌ dist directory not found. Run npm run build first.');
    return false;
  }
  
  // Find main JavaScript bundle
  const assetsDir = 'dist/assets';
  if (!fs.existsSync(assetsDir)) {
    console.log('❌ dist/assets directory not found.');
    return false;
  }
  
  const jsFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith('.js') && file.startsWith('index-'));
  
  if (jsFiles.length === 0) {
    console.log('❌ No main JavaScript bundle found.');
    return false;
  }
  
  const mainBundle = path.join(assetsDir, jsFiles[0]);
  const bundleContent = fs.readFileSync(mainBundle, 'utf8');
  
  console.log(`✅ Found main bundle: ${jsFiles[0]} (${(fs.statSync(mainBundle).size / 1024 / 1024).toFixed(2)}MB)`);
  
  // Check for critical components
  console.log('\n🧩 COMPONENTS VERIFICATION:');
  let componentIssues = 0;
  
  criticalComponents.forEach(component => {
    const regex = new RegExp(`${component}["\':,\\s]`, 'i');
    const found = regex.test(bundleContent);
    if (found) {
      console.log(`  ✅ ${component}: Found in bundle`);
    } else {
      console.log(`  ❌ ${component}: NOT found in bundle`);
      componentIssues++;
    }
  });
  
  // Check for critical pages
  console.log('\n📄 PAGES VERIFICATION:');
  let pageIssues = 0;
  
  criticalPages.forEach(page => {
    const regex = new RegExp(`${page}["\':,\\s]`, 'i');
    const found = regex.test(bundleContent);
    if (found) {
      console.log(`  ✅ ${page}: Found in bundle`);
    } else {
      console.log(`  ❌ ${page}: NOT found in bundle`);
      pageIssues++;
    }
  });
  
  // Check for critical API functions
  console.log('\n🔌 API FUNCTIONS VERIFICATION:');
  let apiIssues = 0;
  
  criticalApiFunctions.forEach(func => {
    const regex = new RegExp(`${func}["\':,\\s(]`, 'i');
    const found = regex.test(bundleContent);
    if (found) {
      console.log(`  ✅ ${func}: Found in bundle`);
    } else {
      console.log(`  ❌ ${func}: NOT found in bundle`);
      apiIssues++;
    }
  });
  
  // Check for critical utilities
  console.log('\n🛠️ UTILITIES VERIFICATION:');
  let utilIssues = 0;
  
  criticalUtils.forEach(util => {
    const regex = new RegExp(`${util}["\':,\\s(]`, 'i');
    const found = regex.test(bundleContent);
    if (found) {
      console.log(`  ✅ ${util}: Found in bundle`);
    } else {
      console.log(`  ❌ ${util}: NOT found in bundle`);
      utilIssues++;
    }
  });
  
  // Check for AWS configuration
  console.log('\n🔐 AWS CONFIGURATION:');
  const awsConfigFile = 'dist/aws-exports.js';
  if (fs.existsSync(awsConfigFile)) {
    const awsConfig = fs.readFileSync(awsConfigFile, 'utf8');
    console.log(`  ✅ aws-exports.js: Found (${(fs.statSync(awsConfigFile).size)} bytes)`);
    
    // Check for critical AWS config properties
    const awsChecks = [
      { prop: 'aws_user_pools_id', expected: 'us-east-2_FyHLtOhiY' },
      { prop: 'aws_user_pools_web_client_id', expected: 'dshos5iou44tuach7ta3ici5m' },
      { prop: 'endpoint', expected: 'q2b9avfwv5.execute-api.us-east-2.amazonaws.com' }
    ];
    
    awsChecks.forEach(check => {
      if (awsConfig.includes(check.expected)) {
        console.log(`    ✅ ${check.prop}: Correct value found`);
      } else {
        console.log(`    ❌ ${check.prop}: Expected value not found`);
        utilIssues++;
      }
    });
  } else {
    console.log('  ❌ aws-exports.js: NOT found in dist');
    utilIssues++;
  }
  
  // Summary
  const totalIssues = componentIssues + pageIssues + apiIssues + utilIssues;
  
  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log('=' .repeat(50));
  console.log(`Components: ${criticalComponents.length - componentIssues}/${criticalComponents.length} found`);
  console.log(`Pages: ${criticalPages.length - pageIssues}/${criticalPages.length} found`);
  console.log(`API Functions: ${criticalApiFunctions.length - apiIssues}/${criticalApiFunctions.length} found`);
  console.log(`Utilities: ${criticalUtils.length - utilIssues}/${criticalUtils.length} found`);
  console.log(`\nTotal Issues: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 ALL CRITICAL COMPONENTS VERIFIED SUCCESSFULLY!');
    console.log('✅ The production bundle contains all required components.');
    return true;
  } else {
    console.log('\n⚠️ ISSUES FOUND IN PRODUCTION BUNDLE');
    console.log('❌ Some critical components are missing from the bundle.');
    console.log('\n💡 SUGGESTED FIXES:');
    console.log('1. Verify all imports in src/App.tsx');
    console.log('2. Check for TypeScript compilation errors');
    console.log('3. Ensure all components are exported properly');
    console.log('4. Run npm run build again and check for warnings');
    return false;
  }
}

function checkSourceFiles() {
  console.log('\n📁 SOURCE FILES VERIFICATION:');
  
  // Check if critical source files exist
  const criticalFiles = [
    'src/App.tsx',
    'src/main.tsx',
    'src/pages/Dashboard.tsx',
    'src/pages/AdminDashboard.tsx',
    'src/pages/Login.tsx',
    'src/components/Header.tsx',
    'src/components/ProjectTable.tsx',
    'src/lib/api.ts',
    'src/utils/fetchWrapper.ts'
  ];
  
  let missingFiles = 0;
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`  ✅ ${file}: Found (${stats.size} bytes)`);
    } else {
      console.log(`  ❌ ${file}: NOT found`);
      missingFiles++;
    }
  });
  
  return missingFiles === 0;
}

function checkViteConfig() {
  console.log('\n⚙️ VITE CONFIGURATION:');
  
  if (fs.existsSync('vite.config.ts')) {
    const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
    
    // Check for important Vite settings
    const checks = [
      { name: 'React plugin', pattern: /react\(\)/ },
      { name: 'Path aliases', pattern: /@.*path\.resolve/ },
      { name: 'Build optimization', pattern: /build:\s*{/ },
      { name: 'Public directory', pattern: /publicDir.*public/ }
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(viteConfig)) {
        console.log(`  ✅ ${check.name}: Configured`);
      } else {
        console.log(`  ❌ ${check.name}: Not found`);
      }
    });
  } else {
    console.log('  ❌ vite.config.ts: NOT found');
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  console.log('Starting component verification...\n');
  
  const sourceFilesOk = checkSourceFiles();
  const viteConfigOk = checkViteConfig();
  const bundleOk = checkBundleContents();
  
  console.log('\n🏁 FINAL RESULT:');
  console.log('=' .repeat(50));
  
  if (sourceFilesOk && viteConfigOk && bundleOk) {
    console.log('🎉 SUCCESS: All components verified and ready for deployment!');
    process.exit(0);
  } else {
    console.log('❌ FAILURE: Issues found that need to be resolved.');
    console.log('\n🔧 NEXT STEPS:');
    if (!sourceFilesOk) console.log('- Fix missing source files');
    if (!viteConfigOk) console.log('- Fix Vite configuration');
    if (!bundleOk) console.log('- Rebuild and fix bundle issues');
    process.exit(1);
  }
}

main().catch(console.error);

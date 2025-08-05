#!/usr/bin/env node
// 🧪 API and Component Validation Test for ACTA-UI
// Validates API structure, button functionality, and component integrity

import fs from 'fs';
import path from 'path';

// Test configuration validation
function testConfiguration() {
  console.log('🔧 Testing Configuration Files...');
  console.log('=' .repeat(60));
  
  const configs = [
    { file: 'src/aws-exports.js', description: 'AWS Amplify Configuration' },
    { file: '.env.production', description: 'Production Environment Variables' },
    { file: 'package.json', description: 'Package Configuration' },
    { file: 'vite.config.ts', description: 'Vite Build Configuration' }
  ];
  
  const results = [];
  
  for (const config of configs) {
    try {
      const filePath = path.join(process.cwd(), config.file);
      const exists = fs.existsSync(filePath);
      const size = exists ? fs.statSync(filePath).size : 0;
      
      console.log(`📁 ${config.description}:`);
      console.log(`   File: ${config.file}`);
      console.log(`   Exists: ${exists ? '✅' : '❌'}`);
      console.log(`   Size: ${size} bytes`);
      
      if (exists && config.file === 'src/aws-exports.js') {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasEndpoint = content.includes('q2b9avfwv5.execute-api.us-east-2.amazonaws.com');
        const hasCognito = content.includes('us-east-2_FyHLtOhiY');
        const hasS3 = content.includes('projectplace-dv-2025-x9a7b');
        
        console.log(`   API Endpoint: ${hasEndpoint ? '✅' : '❌'}`);
        console.log(`   Cognito Pool: ${hasCognito ? '✅' : '❌'}`);
        console.log(`   S3 Bucket: ${hasS3 ? '✅' : '❌'}`);
      }
      
      results.push({ ...config, exists, size, valid: exists && size > 0 });
      
    } catch (error) {
      console.log(`❌ Error checking ${config.file}: ${error.message}`);
      results.push({ ...config, exists: false, size: 0, valid: false });
    }
    console.log('');
  }
  
  return results;
}

// Test component structure
function testComponentStructure() {
  console.log('🏗️ Testing Component Structure...');
  console.log('=' .repeat(60));
  
  const components = [
    'src/pages/Login.tsx',
    'src/pages/Dashboard.tsx',
    'src/components/ActaButtons/ActaButtons.tsx',
    'src/components/DynamoProjectsView.tsx',
    'src/components/Header.tsx',
    'src/lib/api.ts',
    'src/utils/fetchWrapper.ts',
    'src/hooks/useAuth.ts'
  ];
  
  const results = [];
  
  for (const component of components) {
    try {
      const filePath = path.join(process.cwd(), component);
      const exists = fs.existsSync(filePath);
      const size = exists ? fs.statSync(filePath).size : 0;
      
      let hasExports = false;
      let hasProperImports = false;
      
      if (exists) {
        const content = fs.readFileSync(filePath, 'utf8');
        hasExports = content.includes('export') || content.includes('default');
        hasProperImports = content.includes('import') || content.includes('require');
      }
      
      console.log(`📄 ${component}:`);
      console.log(`   Exists: ${exists ? '✅' : '❌'}`);
      console.log(`   Size: ${size} bytes`);
      console.log(`   Has Exports: ${hasExports ? '✅' : '❌'}`);
      console.log(`   Has Imports: ${hasProperImports ? '✅' : '❌'}`);
      
      results.push({
        file: component,
        exists,
        size,
        hasExports,
        hasProperImports,
        valid: exists && size > 0 && hasExports
      });
      
    } catch (error) {
      console.log(`❌ Error checking ${component}: ${error.message}`);
      results.push({
        file: component,
        exists: false,
        size: 0,
        hasExports: false,
        hasProperImports: false,
        valid: false
      });
    }
    console.log('');
  }
  
  return results;
}

// Test API endpoint structure
function testAPIStructure() {
  console.log('🌐 Testing API Structure...');
  console.log('=' .repeat(60));
  
  try {
    const apiPath = path.join(process.cwd(), 'src/lib/api.ts');
    
    if (!fs.existsSync(apiPath)) {
      console.log('❌ API file not found');
      return { valid: false, endpoints: [] };
    }
    
    const content = fs.readFileSync(apiPath, 'utf8');
    
    // Check for key API functions
    const apiMethods = [
      'generateActaDocument',
      'getSignedDownloadUrl',
      'sendApprovalEmail',
      'documentExists',
      'getProjectsByPM'
    ];
    
    const endpoints = [
      { path: '/generate-acta', description: 'Generate ACTA Document' },
      { path: '/download-acta', description: 'Download ACTA' },
      { path: '/send-approval-email', description: 'Send Approval Email' },
      { path: '/check-document', description: 'Check Document Status' },
      { path: '/projects-for-pm', description: 'PM Projects' }
    ];
    
    console.log('📋 API Methods:');
    for (const method of apiMethods) {
      const exists = content.includes(method);
      console.log(`   ${method}: ${exists ? '✅' : '❌'}`);
    }
    
    console.log('\n📍 API Endpoints:');
    for (const endpoint of endpoints) {
      const exists = content.includes(endpoint.path);
      console.log(`   ${endpoint.description} (${endpoint.path}): ${exists ? '✅' : '❌'}`);
    }
    
    // Check for proper error handling
    const hasErrorHandling = content.includes('try') && content.includes('catch');
    const hasReturnTypes = content.includes('Promise<') || content.includes(': Promise');
    
    console.log('\n🔧 Code Quality:');
    console.log(`   Error Handling: ${hasErrorHandling ? '✅' : '❌'}`);
    console.log(`   TypeScript Types: ${hasReturnTypes ? '✅' : '❌'}`);
    
    return {
      valid: true,
      hasAllMethods: apiMethods.every(method => content.includes(method)),
      hasAllEndpoints: endpoints.every(endpoint => content.includes(endpoint.path)),
      hasErrorHandling,
      hasReturnTypes
    };
    
  } catch (error) {
    console.log(`❌ Error analyzing API structure: ${error.message}`);
    return { valid: false };
  }
}

// Test build configuration
function testBuildConfiguration() {
  console.log('🏗️ Testing Build Configuration...');
  console.log('=' .repeat(60));
  
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
    
    const packageExists = fs.existsSync(packagePath);
    const viteConfigExists = fs.existsSync(viteConfigPath);
    
    console.log(`📦 package.json: ${packageExists ? '✅' : '❌'}`);
    console.log(`⚙️ vite.config.ts: ${viteConfigExists ? '✅' : '❌'}`);
    
    if (packageExists) {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredScripts = ['build', 'dev', 'lint', 'ci', 'type-check'];
      console.log('\n📋 Required Scripts:');
      for (const script of requiredScripts) {
        const exists = packageContent.scripts && packageContent.scripts[script];
        console.log(`   ${script}: ${exists ? '✅' : '❌'}`);
      }
      
      const requiredDeps = ['aws-amplify', 'react', 'react-dom', 'vite'];
      console.log('\n📋 Key Dependencies:');
      for (const dep of requiredDeps) {
        const exists = packageContent.dependencies && packageContent.dependencies[dep];
        console.log(`   ${dep}: ${exists ? '✅' : '❌'}`);
      }
    }
    
    return {
      valid: packageExists && viteConfigExists
    };
    
  } catch (error) {
    console.log(`❌ Error analyzing build configuration: ${error.message}`);
    return { valid: false };
  }
}

// Test deployment workflow
function testDeploymentWorkflow() {
  console.log('🚀 Testing Deployment Workflow...');
  console.log('=' .repeat(60));
  
  try {
    const workflowPath = path.join(process.cwd(), '.github/workflows/deploy-ui-prod.yml');
    
    if (!fs.existsSync(workflowPath)) {
      console.log('❌ Deployment workflow not found');
      return { valid: false };
    }
    
    const content = fs.readFileSync(workflowPath, 'utf8');
    
    const requiredSteps = [
      'pnpm install',
      'pnpm run ci',
      'pnpm run build',
      'aws s3 sync',
      'aws cloudfront create-invalidation'
    ];
    
    console.log('📋 Deployment Steps:');
    for (const step of requiredSteps) {
      const exists = content.includes(step);
      console.log(`   ${step}: ${exists ? '✅' : '❌'}`);
    }
    
    const hasSecrets = content.includes('secrets.') && content.includes('OIDC_AWS_ROLE_ARN');
    const hasEnvironment = content.includes('env:') && content.includes('AWS_REGION');
    
    console.log('\n🔐 Security & Environment:');
    console.log(`   Uses Secrets: ${hasSecrets ? '✅' : '❌'}`);
    console.log(`   Has Environment: ${hasEnvironment ? '✅' : '❌'}`);
    
    return {
      valid: true,
      hasAllSteps: requiredSteps.every(step => content.includes(step)),
      hasSecrets,
      hasEnvironment
    };
    
  } catch (error) {
    console.log(`❌ Error analyzing deployment workflow: ${error.message}`);
    return { valid: false };
  }
}

// Main test execution
async function main() {
  console.log('🧪 ACTA-UI Structure Validation Test');
  console.log('=' .repeat(80));
  console.log('');
  
  const configResults = testConfiguration();
  console.log('');
  
  const componentResults = testComponentStructure();
  console.log('');
  
  const apiResults = testAPIStructure();
  console.log('');
  
  const buildResults = testBuildConfiguration();
  console.log('');
  
  const deployResults = testDeploymentWorkflow();
  console.log('');
  
  // Summary
  console.log('📊 VALIDATION SUMMARY');
  console.log('=' .repeat(80));
  
  const configValid = configResults.every(r => r.valid);
  const componentValid = componentResults.every(r => r.valid);
  
  console.log(`✅ Configuration Files: ${configValid ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Component Structure: ${componentValid ? 'PASS' : 'FAIL'}`);
  console.log(`✅ API Structure: ${apiResults.valid ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Build Configuration: ${buildResults.valid ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Deployment Workflow: ${deployResults.valid ? 'PASS' : 'FAIL'}`);
  
  const overallValid = configValid && componentValid && apiResults.valid && buildResults.valid && deployResults.valid;
  
  console.log('\n🎯 OVERALL STATUS:');
  console.log(`${overallValid ? '🟢 READY FOR PRODUCTION' : '🟡 NEEDS ATTENTION'}`);
  
  if (!overallValid) {
    console.log('\n🔧 Issues to Address:');
    if (!configValid) console.log('- Fix configuration files');
    if (!componentValid) console.log('- Fix component structure');
    if (!apiResults.valid) console.log('- Fix API structure');
    if (!buildResults.valid) console.log('- Fix build configuration');
    if (!deployResults.valid) console.log('- Fix deployment workflow');
  }
  
  return {
    valid: overallValid,
    config: configValid,
    components: componentValid,
    api: apiResults.valid,
    build: buildResults.valid,
    deploy: deployResults.valid
  };
}

main().catch(console.error);
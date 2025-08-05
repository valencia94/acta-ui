#!/usr/bin/env node
// 🧪 Build and Deployment Validation for ACTA-UI
// Tests build process, deployment pipeline, and production readiness

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function runCommand(command, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
    console.log(`✅ ${description} completed successfully`);
    return { success: true, output };
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

function testBuildProcess() {
  console.log('🏗️ Testing Build Process...');
  console.log('=' .repeat(60));
  
  // Test CI pipeline
  const ciResult = runCommand('pnpm run ci', 'CI Pipeline (lint, type-check, test)');
  
  // Test build
  const buildResult = runCommand('pnpm run build', 'Production Build');
  
  // Check build output
  const distPath = path.join(process.cwd(), 'dist');
  const distExists = fs.existsSync(distPath);
  
  console.log(`\n📁 Build Output:`);
  console.log(`   dist/ directory: ${distExists ? '✅' : '❌'}`);
  
  if (distExists) {
    const files = fs.readdirSync(distPath);
    const hasIndex = files.includes('index.html');
    const hasAssets = files.some(f => f.startsWith('assets'));
    const has404 = files.includes('404.html');
    const hasAwsExports = files.includes('aws-exports.js');
    
    console.log(`   index.html: ${hasIndex ? '✅' : '❌'}`);
    console.log(`   assets/: ${hasAssets ? '✅' : '❌'}`);
    console.log(`   404.html (SPA): ${has404 ? '✅' : '❌'}`);
    console.log(`   aws-exports.js: ${hasAwsExports ? '✅' : '❌'}`);
    
    // Check file sizes
    if (hasIndex) {
      const indexSize = fs.statSync(path.join(distPath, 'index.html')).size;
      console.log(`   index.html size: ${indexSize} bytes`);
    }
    
    const buildSuccess = hasIndex && hasAssets && has404 && hasAwsExports;
    
    return {
      success: ciResult.success && buildResult.success && buildSuccess,
      ci: ciResult.success,
      build: buildResult.success,
      output: buildSuccess
    };
  }
  
  return {
    success: false,
    ci: ciResult.success,
    build: buildResult.success,
    output: false
  };
}

function testDeploymentConfiguration() {
  console.log('\n🚀 Testing Deployment Configuration...');
  console.log('=' .repeat(60));
  
  // Check GitHub workflow
  const workflowPath = path.join(process.cwd(), '.github/workflows/deploy-ui-prod.yml');
  const workflowExists = fs.existsSync(workflowPath);
  
  console.log(`📋 Deployment Workflow:`);
  console.log(`   deploy-ui-prod.yml: ${workflowExists ? '✅' : '❌'}`);
  
  if (workflowExists) {
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    
    const requiredElements = [
      { pattern: 'pnpm/action-setup', description: 'PNPM Setup' },
      { pattern: 'aws-actions/configure-aws-credentials', description: 'AWS Credentials' },
      { pattern: 'pnpm run ci', description: 'CI Checks' },
      { pattern: 'pnpm run build', description: 'Build Step' },
      { pattern: 'aws s3 sync', description: 'S3 Deployment' },
      { pattern: 'aws cloudfront create-invalidation', description: 'CloudFront Invalidation' },
      { pattern: 'secrets.OIDC_AWS_ROLE_ARN', description: 'OIDC Role' }
    ];
    
    for (const element of requiredElements) {
      const exists = workflowContent.includes(element.pattern);
      console.log(`   ${element.description}: ${exists ? '✅' : '❌'}`);
    }
    
    return {
      success: workflowExists && requiredElements.every(e => workflowContent.includes(e.pattern)),
      hasWorkflow: workflowExists,
      hasAllSteps: requiredElements.every(e => workflowContent.includes(e.pattern))
    };
  }
  
  return { success: false, hasWorkflow: false, hasAllSteps: false };
}

function testEnvironmentConfiguration() {
  console.log('\n⚙️ Testing Environment Configuration...');
  console.log('=' .repeat(60));
  
  // Check environment files
  const envFiles = [
    { file: '.env.production', description: 'Production Environment' },
    { file: 'src/aws-exports.js', description: 'AWS Configuration' },
    { file: 'src/env.variables.ts', description: 'Environment Variables' }
  ];
  
  const results = [];
  
  for (const envFile of envFiles) {
    const filePath = path.join(process.cwd(), envFile.file);
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    
    console.log(`📁 ${envFile.description}:`);
    console.log(`   ${envFile.file}: ${exists ? '✅' : '❌'}`);
    console.log(`   Size: ${size} bytes`);
    
    if (exists && envFile.file === '.env.production') {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasApiUrl = content.includes('VITE_API_BASE_URL');
      const hasCognito = content.includes('VITE_COGNITO_POOL_ID');
      const hasCloudFront = content.includes('VITE_CLOUDFRONT_URL');
      
      console.log(`   API URL: ${hasApiUrl ? '✅' : '❌'}`);
      console.log(`   Cognito Config: ${hasCognito ? '✅' : '❌'}`);
      console.log(`   CloudFront URL: ${hasCloudFront ? '✅' : '❌'}`);
    }
    
    results.push({ ...envFile, exists, size, valid: exists && size > 0 });
  }
  
  return {
    success: results.every(r => r.valid),
    files: results
  };
}

function testSecurityConfiguration() {
  console.log('\n🔐 Testing Security Configuration...');
  console.log('=' .repeat(60));
  
  // Check CORS configuration
  const scriptsPath = path.join(process.cwd(), 'scripts');
  const corsScript = path.join(scriptsPath, 'enable-cors.js');
  const corsExists = fs.existsSync(corsScript);
  
  console.log(`🛡️ CORS Configuration:`);
  console.log(`   enable-cors.js: ${corsExists ? '✅' : '❌'}`);
  
  // Check fetchWrapper for SigV4
  const fetchWrapperPath = path.join(process.cwd(), 'src/utils/fetchWrapper.ts');
  const fetchWrapperContent = fs.readFileSync(fetchWrapperPath, 'utf8');
  
  const securityElements = [
    { pattern: 'SignatureV4', description: 'AWS SigV4 Signing' },
    { pattern: 'fetchAuthSession', description: 'Cognito Authentication' },
    { pattern: 'needsSigV4', description: 'Selective SigV4 Application' },
    { pattern: 'Authorization', description: 'Bearer Token Support' }
  ];
  
  console.log(`\n🔧 API Security:`);
  for (const element of securityElements) {
    const exists = fetchWrapperContent.includes(element.pattern);
    console.log(`   ${element.description}: ${exists ? '✅' : '❌'}`);
  }
  
  // Check environment variables security
  const envVarsPath = path.join(process.cwd(), 'src/env.variables.ts');
  const envVarsContent = fs.readFileSync(envVarsPath, 'utf8');
  
  const securitySettings = [
    { pattern: 'skipAuth = false', description: 'Auth Required in Production' },
    { pattern: 'isDemo = false', description: 'Demo Mode Disabled' },
    { pattern: 'isProduction = true', description: 'Production Mode Enabled' }
  ];
  
  console.log(`\n🔒 Security Settings:`);
  for (const setting of securitySettings) {
    const exists = envVarsContent.includes(setting.pattern);
    console.log(`   ${setting.description}: ${exists ? '✅' : '❌'}`);
  }
  
  return {
    success: corsExists && securityElements.every(e => fetchWrapperContent.includes(e.pattern)),
    cors: corsExists,
    apiSecurity: securityElements.every(e => fetchWrapperContent.includes(e.pattern)),
    productionSecurity: securitySettings.every(s => envVarsContent.includes(s.pattern))
  };
}

function testProductionReadiness() {
  console.log('\n🎯 Testing Production Readiness...');
  console.log('=' .repeat(60));
  
  const readinessChecks = [
    {
      name: 'Package.json Scripts',
      check: () => {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredScripts = ['build', 'ci', 'lint', 'type-check'];
        return requiredScripts.every(script => pkg.scripts[script]);
      }
    },
    {
      name: 'TypeScript Configuration',
      check: () => fs.existsSync('tsconfig.json')
    },
    {
      name: 'Vite Configuration',
      check: () => fs.existsSync('vite.config.ts')
    },
    {
      name: 'ESLint Configuration',
      check: () => fs.existsSync('.eslintrc.cjs')
    },
    {
      name: 'Prettier Configuration',
      check: () => fs.existsSync('.prettierrc')
    },
    {
      name: 'AWS Exports',
      check: () => fs.existsSync('src/aws-exports.js')
    },
    {
      name: 'Environment Variables',
      check: () => fs.existsSync('.env.production')
    }
  ];
  
  console.log(`📋 Production Readiness Checks:`);
  
  const results = [];
  for (const check of readinessChecks) {
    try {
      const passed = check.check();
      console.log(`   ${check.name}: ${passed ? '✅' : '❌'}`);
      results.push({ name: check.name, passed });
    } catch (error) {
      console.log(`   ${check.name}: ❌ (Error: ${error.message})`);
      results.push({ name: check.name, passed: false });
    }
  }
  
  const allPassed = results.every(r => r.passed);
  
  return {
    success: allPassed,
    checks: results
  };
}

// Main execution
async function main() {
  console.log('🧪 ACTA-UI BUILD & DEPLOYMENT VALIDATION');
  console.log('=' .repeat(80));
  
  const buildResults = testBuildProcess();
  const deployResults = testDeploymentConfiguration();
  const envResults = testEnvironmentConfiguration();
  const securityResults = testSecurityConfiguration();
  const readinessResults = testProductionReadiness();
  
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('=' .repeat(80));
  
  console.log(`🏗️ Build Process: ${buildResults.success ? 'PASS' : 'FAIL'}`);
  console.log(`🚀 Deployment Config: ${deployResults.success ? 'PASS' : 'FAIL'}`);
  console.log(`⚙️ Environment Config: ${envResults.success ? 'PASS' : 'FAIL'}`);
  console.log(`🔐 Security Config: ${securityResults.success ? 'PASS' : 'FAIL'}`);
  console.log(`🎯 Production Readiness: ${readinessResults.success ? 'PASS' : 'FAIL'}`);
  
  const overallSuccess = buildResults.success && deployResults.success && 
                        envResults.success && securityResults.success && 
                        readinessResults.success;
  
  console.log('\n🎯 OVERALL BUILD & DEPLOYMENT STATUS:');
  console.log(`${overallSuccess ? '🟢 READY FOR PRODUCTION DEPLOYMENT' : '🟡 NEEDS ATTENTION'}`);
  
  if (overallSuccess) {
    console.log('\n✅ Production Deployment Checklist:');
    console.log('- ✅ CI pipeline passes all checks');
    console.log('- ✅ Build creates proper distribution');
    console.log('- ✅ Deployment workflow is configured');
    console.log('- ✅ Environment variables are set');
    console.log('- ✅ Security measures are in place');
    console.log('- ✅ AWS configuration is ready');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Trigger GitHub Actions deployment workflow');
    console.log('2. Monitor CloudFront invalidation');
    console.log('3. Test production URL functionality');
    console.log('4. Validate authentication flow');
    console.log('5. Test all button actions');
  } else {
    console.log('\n🔧 Issues to Address:');
    if (!buildResults.success) console.log('- Fix build process issues');
    if (!deployResults.success) console.log('- Fix deployment configuration');
    if (!envResults.success) console.log('- Fix environment configuration');
    if (!securityResults.success) console.log('- Fix security configuration');
    if (!readinessResults.success) console.log('- Fix production readiness issues');
  }
  
  return {
    success: overallSuccess,
    build: buildResults.success,
    deploy: deployResults.success,
    environment: envResults.success,
    security: securityResults.success,
    readiness: readinessResults.success
  };
}

main().catch(console.error);
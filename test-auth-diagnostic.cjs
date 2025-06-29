#!/usr/bin/env node

/**
 * ACTA-UI Authentication Analysis & API Testing
 * 
 * Tests authentication and API connectivity without browser automation
 */

const https = require('https');
const http = require('http');

// Configuration
const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

// Test credentials
const TEST_EMAIL = process.env.ACTA_UI_USER;
const TEST_PASSWORD = process.env.ACTA_UI_PW;

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      timeout: 10000,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        data: data
      }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testFrontendAccessibility() {
  console.log('🌐 Testing Frontend Accessibility...\n');
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    console.log(`✅ Frontend accessible: ${response.status} ${response.statusText}`);
    
    // Check if it's the React app or a redirect
    const isReactApp = response.data.includes('id="root"') || response.data.includes('React') || response.data.includes('vite');
    console.log(`📱 React App Detected: ${isReactApp ? '✅ Yes' : '❌ No'}`);
    
    // Check for Amplify/Auth references
    const hasAmplify = response.data.includes('amplify') || response.data.includes('cognito');
    console.log(`🔐 Amplify/Auth References: ${hasAmplify ? '✅ Found' : '❌ Not Found'}`);
    
    // Check for environment variables or config
    const hasConfig = response.data.includes('VITE_') || response.data.includes('window.ENV');
    console.log(`⚙️ Environment Config: ${hasConfig ? '✅ Found' : '❌ Not Found'}`);
    
    // Extract title
    const titleMatch = response.data.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      console.log(`📑 Page Title: ${titleMatch[1]}`);
    }
    
    return {
      accessible: response.status === 200,
      isReactApp,
      hasAmplify,
      hasConfig,
      contentLength: response.data.length
    };
    
  } catch (error) {
    console.error(`❌ Frontend accessibility test failed: ${error.message}`);
    return { accessible: false, error: error.message };
  }
}

async function testAPIEndpoints() {
  console.log('\n🔌 Testing API Endpoints...\n');
  
  const endpoints = [
    { 
      path: '/health', 
      method: 'GET', 
      expectAuth: false, 
      description: 'Health Check',
      expectedStatus: [200, 404] 
    },
    { 
      path: '/projects', 
      method: 'GET', 
      expectAuth: true, 
      description: 'Projects List',
      expectedStatus: [401, 403] 
    },
    { 
      path: '/pm-manager/all-projects', 
      method: 'GET', 
      expectAuth: true, 
      description: 'PM All Projects',
      expectedStatus: [401, 403] 
    },
    { 
      path: '/project-summary/1000000049842296', 
      method: 'GET', 
      expectAuth: true, 
      description: 'Project Summary',
      expectedStatus: [401, 403] 
    },
    { 
      path: '/send-approval-email', 
      method: 'POST', 
      expectAuth: true, 
      description: 'Send Approval Email',
      expectedStatus: [401, 403, 405] 
    }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${API_BASE}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': FRONTEND_URL
        }
      });
      
      const isExpected = endpoint.expectedStatus.includes(response.status);
      const status = isExpected ? '✅' : '❌';
      
      console.log(`${status} ${endpoint.description}: ${response.status} ${response.statusText}`);
      
      // Log additional details for unexpected responses
      if (!isExpected) {
        console.log(`   Expected: ${endpoint.expectedStatus.join(' or ')}, Got: ${response.status}`);
        console.log(`   Response: ${response.data.substring(0, 200)}...`);
      }
      
      results.push({
        endpoint: endpoint.path,
        description: endpoint.description,
        status: response.status,
        expected: isExpected,
        response: response.data.substring(0, 200)
      });
      
    } catch (error) {
      console.log(`❌ ${endpoint.description}: ${error.message}`);
      results.push({
        endpoint: endpoint.path,
        description: endpoint.description,
        error: error.message,
        expected: false
      });
    }
  }
  
  return results;
}

async function testCORSConfiguration() {
  console.log('\n🔄 Testing CORS Configuration...\n');
  
  const corsTests = [
    { origin: FRONTEND_URL, description: 'Production Origin' },
    { origin: 'http://localhost:3000', description: 'Development Origin' },
    { origin: 'https://localhost:3000', description: 'HTTPS Development Origin' }
  ];
  
  for (const test of corsTests) {
    try {
      const response = await makeRequest(`${API_BASE}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': test.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,content-type'
        }
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'],
        'access-control-allow-headers': response.headers['access-control-allow-headers'],
        'access-control-allow-credentials': response.headers['access-control-allow-credentials']
      };
      
      const hasCors = Object.values(corsHeaders).some(val => val);
      
      console.log(`${hasCors ? '✅' : '❌'} ${test.description}: ${response.status}`);
      
      if (hasCors) {
        Object.entries(corsHeaders).forEach(([key, value]) => {
          if (value) {
            console.log(`   ${key}: ${value}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ ${test.description}: ${error.message}`);
    }
  }
}

async function analyzeCognitoConfiguration() {
  console.log('\n🔐 Analyzing Cognito Configuration...\n');
  
  // Read the aws-exports.js file to check configuration
  const fs = require('fs');
  const path = require('path');
  
  try {
    const awsExportsPath = path.join(__dirname, 'src', 'aws-exports.js');
    if (fs.existsSync(awsExportsPath)) {
      const awsExports = fs.readFileSync(awsExportsPath, 'utf8');
      console.log('✅ aws-exports.js found');
      
      // Extract key configuration values
      const userPoolId = awsExports.match(/aws_user_pools_id:\s*['"]([^'"]+)['"]/)?.[1];
      const clientId = awsExports.match(/aws_user_pools_web_client_id:\s*['"]([^'"]+)['"]/)?.[1];
      const region = awsExports.match(/aws_project_region:\s*['"]([^'"]+)['"]/)?.[1];
      const oauthDomain = awsExports.match(/domain:\s*['"]([^'"]+)['"]/)?.[1];
      const redirectSignIn = awsExports.match(/redirectSignIn:\s*['"]([^'"]+)['"]/)?.[1];
      
      console.log('Cognito Configuration:');
      console.log(`   Region: ${region || '❌ Missing'}`);
      console.log(`   User Pool ID: ${userPoolId || '❌ Missing'}`);
      console.log(`   Client ID: ${clientId || '❌ Missing'}`);
      console.log(`   OAuth Domain: ${oauthDomain || '❌ Missing'}`);
      console.log(`   Redirect Sign In: ${redirectSignIn || '❌ Missing'}`);
      
      // Check if redirect URLs match current frontend
      const redirectMatchesFrontend = redirectSignIn === FRONTEND_URL || redirectSignIn === `${FRONTEND_URL}/`;
      console.log(`   Redirect URL Match: ${redirectMatchesFrontend ? '✅ Match' : '❌ Mismatch'}`);
      
      return {
        found: true,
        region,
        userPoolId,
        clientId,
        oauthDomain,
        redirectSignIn,
        redirectMatchesFrontend
      };
    } else {
      console.log('❌ aws-exports.js not found');
      return { found: false };
    }
  } catch (error) {
    console.error(`❌ Error reading aws-exports.js: ${error.message}`);
    return { found: false, error: error.message };
  }
}

async function generateDiagnosticReport() {
  console.log('🔍 ACTA-UI Authentication Diagnostic Report\n');
  console.log('==========================================\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    frontend: null,
    api: null,
    cors: null,
    cognito: null,
    credentials: {
      available: !!(TEST_EMAIL && TEST_PASSWORD),
      email: TEST_EMAIL ? TEST_EMAIL.substring(0, 3) + '***' : 'Not set'
    },
    issues: [],
    recommendations: []
  };
  
  // Test frontend
  report.frontend = await testFrontendAccessibility();
  
  // Test API endpoints
  report.api = await testAPIEndpoints();
  
  // Test CORS
  await testCORSConfiguration();
  
  // Analyze Cognito
  report.cognito = await analyzeCognitoConfiguration();
  
  // Generate issues and recommendations
  if (!report.frontend.accessible) {
    report.issues.push('Frontend not accessible');
    report.recommendations.push('Check CloudFront distribution and S3 deployment');
  }
  
  if (!report.frontend.isReactApp) {
    report.issues.push('Frontend not serving React application');
    report.recommendations.push('Verify build and deployment process');
  }
  
  if (!report.frontend.hasAmplify) {
    report.issues.push('Amplify/Auth references not found in frontend');
    report.recommendations.push('Check if Amplify is properly bundled');
  }
  
  if (!report.cognito.found) {
    report.issues.push('Cognito configuration not found');
    report.recommendations.push('Ensure aws-exports.js is properly configured');
  } else if (!report.cognito.redirectMatchesFrontend) {
    report.issues.push('Cognito redirect URL mismatch');
    report.recommendations.push('Update Cognito redirect URLs to match frontend domain');
  }
  
  if (!report.credentials.available) {
    report.issues.push('Test credentials not available');
    report.recommendations.push('Set ACTA_UI_USER and ACTA_UI_PW environment variables');
  }
  
  // Summary
  console.log('\n📊 Diagnostic Summary\n');
  console.log('===================\n');
  console.log(`Frontend Accessible: ${report.frontend.accessible ? '✅ Yes' : '❌ No'}`);
  console.log(`React App Serving: ${report.frontend.isReactApp ? '✅ Yes' : '❌ No'}`);
  console.log(`Amplify References: ${report.frontend.hasAmplify ? '✅ Found' : '❌ Missing'}`);
  console.log(`Cognito Config: ${report.cognito.found ? '✅ Found' : '❌ Missing'}`);
  console.log(`Credentials Available: ${report.credentials.available ? '✅ Yes' : '❌ No'}`);
  
  if (report.issues.length > 0) {
    console.log('\n🚨 Issues Found:\n');
    report.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\n💡 Recommendations:\n');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  } else {
    console.log('\n🎉 No critical issues found! Authentication should work.');
  }
  
  // Save report
  const fs = require('fs');
  fs.writeFileSync('./auth-diagnostic-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Full report saved to: auth-diagnostic-report.json');
  
  return report;
}

// Main execution
async function main() {
  try {
    const report = await generateDiagnosticReport();
    
    // Exit with appropriate code
    const hasErrors = report.issues.length > 0;
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  testFrontendAccessibility, 
  testAPIEndpoints, 
  testCORSConfiguration, 
  analyzeCognitoConfiguration,
  generateDiagnosticReport 
};

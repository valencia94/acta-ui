#!/usr/bin/env node

/**
 * Comprehensive UI Issue Diagnosis
 * Tests all reported issues after login
 */

const https = require('https');

const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

async function diagnoseUIIssues() {
  console.log('🔍 Diagnosing UI Issues After Login...\n');
  
  try {
    // Test 1: Check logout redirect configuration
    console.log('🚪 Testing logout redirect configuration...');
    
    // Check aws-exports.js for logout redirect
    const awsExportsTest = await new Promise((resolve, reject) => {
      const req = https.get(`${FRONTEND_URL}/src/aws-exports.js`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          content: data,
          hasLogoutRedirect: data.includes('redirectSignOut')
        }));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('AWS exports timeout')));
    });
    
    console.log(`📝 AWS Exports Status: ${awsExportsTest.status}`);
    if (awsExportsTest.status === 200) {
      console.log(`🔄 Has Logout Redirect: ${awsExportsTest.hasLogoutRedirect}`);
      
      // Extract redirect URLs
      const redirectMatches = awsExportsTest.content.match(/redirectSign(In|Out):\s*['"]([^'"]+)['"]/g);
      if (redirectMatches) {
        console.log('🔗 Redirect URLs found:');
        redirectMatches.forEach(match => console.log(`   ${match}`));
      }
    }
    
    // Test 2: Check API endpoints with different auth scenarios
    console.log('\n🔌 Testing API endpoints for authentication...');
    
    const testEndpoints = [
      { path: '/projects', name: 'Projects List' },
      { path: '/pm-manager/all-projects', name: 'PM All Projects' },
      { path: '/pm-manager/projects/1000000049842296', name: 'Specific Project' }
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await new Promise((resolve, reject) => {
          const req = https.get(`${API_BASE}${endpoint.path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
              status: res.statusCode,
              data: data,
              headers: Object.fromEntries(res.rawHeaders.map((h, i) => i % 2 === 0 ? [h.toLowerCase(), res.rawHeaders[i + 1]] : null).filter(Boolean))
            }));
          });
          req.on('error', reject);
          req.setTimeout(10000, () => reject(new Error('Timeout')));
        });
        
        console.log(`📊 ${endpoint.name}: ${response.status}`);
        if (response.status === 403 || response.status === 401) {
          console.log(`   ⚠️ Auth required - ${response.data.substring(0, 100)}`);
        } else if (response.status === 200) {
          console.log(`   ✅ Success - Data length: ${response.data.length}`);
          console.log(`   📄 Sample: ${response.data.substring(0, 200)}...`);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
      }
    }
    
    // Test 3: Check if environment variables are properly set in frontend
    console.log('\n⚙️ Checking frontend environment configuration...');
    
    const envTest = await new Promise((resolve, reject) => {
      const req = https.get(`${FRONTEND_URL}/assets/index-B5NTLSft.js`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          hasApiBase: data.includes('execute-api'),
          hasSkipAuth: data.includes('SKIP_AUTH'),
          hasCognito: data.includes('cognito') || data.includes('COGNITO'),
          hasTestData: data.includes('test-data') || data.includes('mock'),
          size: data.length
        }));
      });
      req.on('error', reject);
      req.setTimeout(15000, () => reject(new Error('Environment test timeout')));
    });
    
    console.log(`📦 Frontend Bundle Analysis:`);
    console.log(`   Status: ${envTest.status}`);
    console.log(`   Size: ${envTest.size} bytes`);
    console.log(`   Has API Base: ${envTest.hasApiBase}`);
    console.log(`   Has Skip Auth: ${envTest.hasSkipAuth}`);
    console.log(`   Has Cognito: ${envTest.hasCognito}`);
    console.log(`   Has Test Data: ${envTest.hasTestData}`);
    
    // Test 4: Check document generation endpoints
    console.log('\n📄 Testing document generation endpoints...');
    
    const docEndpoints = [
      '/extract-project-place/1000000049842296',
      '/check-document/1000000049842296',
      '/download-acta/1000000049842296?format=pdf'
    ];
    
    for (const endpoint of docEndpoints) {
      try {
        const response = await new Promise((resolve, reject) => {
          const req = https.get(`${API_BASE}${endpoint}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
              status: res.statusCode,
              data: data.substring(0, 300),
              contentType: res.headers['content-type']
            }));
          });
          req.on('error', reject);
          req.setTimeout(10000, () => reject(new Error('Timeout')));
        });
        
        console.log(`📋 ${endpoint}: ${response.status} (${response.contentType})`);
        if (response.status !== 200) {
          console.log(`   ⚠️ ${response.data}`);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
    
    // Test 5: Check CORS configuration
    console.log('\n🌐 Testing CORS configuration...');
    
    const corsTest = await new Promise((resolve, reject) => {
      const req = https.request(`${API_BASE}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization'
        }
      }, (res) => {
        resolve({
          status: res.statusCode,
          headers: Object.fromEntries(res.rawHeaders.map((h, i) => i % 2 === 0 ? [h.toLowerCase(), res.rawHeaders[i + 1]] : null).filter(Boolean))
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('CORS test timeout')));
      req.end();
    });
    
    console.log(`🔄 CORS Preflight: ${corsTest.status}`);
    console.log(`   Access-Control-Allow-Origin: ${corsTest.headers['access-control-allow-origin'] || 'Not set'}`);
    console.log(`   Access-Control-Allow-Methods: ${corsTest.headers['access-control-allow-methods'] || 'Not set'}`);
    console.log(`   Access-Control-Allow-Headers: ${corsTest.headers['access-control-allow-headers'] || 'Not set'}`);
    
    // Summary and recommendations
    console.log('\n📊 ISSUE DIAGNOSIS SUMMARY:');
    console.log('================================');
    
    const issues = [];
    const fixes = [];
    
    // Check for logout redirect issue
    if (awsExportsTest.status !== 200 || !awsExportsTest.hasLogoutRedirect) {
      issues.push('Logout redirect configuration missing or incorrect');
      fixes.push('Fix aws-exports.js redirectSignOut URL');
    }
    
    // Check for API authentication
    if (corsTest.headers['access-control-allow-origin'] !== FRONTEND_URL && corsTest.headers['access-control-allow-origin'] !== '*') {
      issues.push('CORS configuration may be blocking frontend requests');
      fixes.push('Update API Gateway CORS to allow frontend domain');
    }
    
    // Check for environment configuration
    if (!envTest.hasApiBase) {
      issues.push('API base URL not properly configured in frontend');
      fixes.push('Verify VITE_API_BASE_URL environment variable');
    }
    
    if (envTest.hasTestData) {
      issues.push('Frontend may be using test/mock data instead of real API');
      fixes.push('Remove test data configuration and ensure API integration');
    }
    
    console.log('\n🔍 IDENTIFIED ISSUES:');
    issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    fixes.forEach((fix, i) => console.log(`${i + 1}. ${fix}`));
    
    return {
      issues,
      fixes,
      logoutRedirectOK: awsExportsTest.hasLogoutRedirect,
      apiAuthOK: corsTest.status === 200,
      envConfigOK: envTest.hasApiBase && !envTest.hasTestData
    };
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    return { issues: ['Diagnosis failed'], fixes: ['Check network connectivity'], logoutRedirectOK: false, apiAuthOK: false, envConfigOK: false };
  }
}

// Run the diagnosis
if (require.main === module) {
  diagnoseUIIssues()
    .then(result => {
      const allOK = result.logoutRedirectOK && result.apiAuthOK && result.envConfigOK;
      console.log(`\n${allOK ? '✅' : '❌'} UI Issues Diagnosis ${allOK ? 'COMPLETED' : 'FOUND ISSUES'}`);
      process.exit(allOK ? 0 : 1);
    })
    .catch(error => {
      console.error('Diagnosis failed:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseUIIssues };

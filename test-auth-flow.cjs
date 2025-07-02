#!/usr/bin/env node

/**
 * ACTA-UI Authentication Flow Test
 * 
 * Tests the complete authentication flow including:
 * - Cognito configuration validation
 * - OAuth URLs and redirects
 * - Login page functionality
 * - Client ID verification
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

// Configuration from our corrected files
const COGNITO_REGION = 'us-east-2';
const COGNITO_POOL_ID = 'us-east-2_FyHLtOhiY';
const COGNITO_CLIENT_ID = 'dshos5iou44tuach7ta3ici5m';
const COGNITO_DOMAIN = 'us-east-2fyhltohiy.auth.us-east-2.amazoncognito.com';
const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';

const results = {
  cognito: {},
  oauth: {},
  frontend: {},
  summary: { passed: 0, failed: 0, warnings: 0 }
};

function log(level, message, details = '') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'PASS': '✅',
    'FAIL': '❌', 
    'WARN': '⚠️',
    'INFO': '📋'
  }[level] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
  if (details) console.log(`   ${details}`);
  
  if (level === 'PASS') results.summary.passed++;
  else if (level === 'FAIL') results.summary.failed++;
  else if (level === 'WARN') results.summary.warnings++;
}

function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data: data,
        url: url
      }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Request timeout')));
    req.end();
  });
}

// Test Cognito Configuration
async function testCognitoConfig() {
  log('INFO', 'Testing Cognito Configuration...');
  
  // Test Cognito Well-Known Configuration
  const wellKnownUrl = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}/.well-known/jwks.json`;
  
  try {
    const response = await makeRequest(wellKnownUrl);
    if (response.status === 200) {
      log('PASS', 'Cognito User Pool accessible', `Pool: ${COGNITO_POOL_ID}`);
      results.cognito['User Pool Access'] = { status: 'PASS', pool: COGNITO_POOL_ID };
    } else {
      log('FAIL', `Cognito User Pool not accessible: ${response.status}`, wellKnownUrl);
      results.cognito['User Pool Access'] = { status: 'FAIL', code: response.status };
    }
  } catch (error) {
    log('FAIL', `Cognito User Pool error: ${error.message}`, wellKnownUrl);
    results.cognito['User Pool Access'] = { status: 'FAIL', error: error.message };
  }
}

// Test OAuth Configuration
async function testOAuthConfig() {
  log('INFO', 'Testing OAuth Configuration...');
  
  // Check if OAuth is enabled in aws-exports.js
  try {
    const awsExportsContent = fs.readFileSync('./src/aws-exports.js', 'utf8');
    
    // Check if OAuth configuration is commented out
    if (awsExportsContent.includes('// oauth:') || !awsExportsContent.includes('oauth:')) {
      log('INFO', 'OAuth configuration is disabled (custom domain not deployed)');
      log('INFO', 'Using basic Cognito hosted UI - OAuth tests skipped');
      results.oauth['OAuth Status'] = { status: 'DISABLED', message: 'Custom domain not deployed, using default Cognito hosted UI' };
      return;
    }
  } catch (error) {
    log('WARN', 'Could not read OAuth configuration', error.message);
  }
  
  // Test Cognito OAuth Domain
  const oauthDiscoveryUrl = `https://${COGNITO_DOMAIN}/.well-known/openid_configuration`;
  
  try {
    const response = await makeRequest(oauthDiscoveryUrl);
    if (response.status === 200) {
      log('PASS', 'OAuth Domain accessible', `Domain: ${COGNITO_DOMAIN}`);
      results.oauth['Domain Access'] = { status: 'PASS', domain: COGNITO_DOMAIN };
      
      // Parse and validate OAuth endpoints
      try {
        const config = JSON.parse(response.data);
        if (config.authorization_endpoint && config.token_endpoint) {
          log('PASS', 'OAuth endpoints configured', `Auth: ${config.authorization_endpoint}`);
          results.oauth['Endpoints'] = { status: 'PASS', endpoints: config };
        } else {
          log('FAIL', 'OAuth endpoints missing', 'Authorization or token endpoint not found');
          results.oauth['Endpoints'] = { status: 'FAIL', config };
        }
      } catch (parseError) {
        log('WARN', 'OAuth config parse error', parseError.message);
        results.oauth['Endpoints'] = { status: 'WARN', error: parseError.message };
      }
    } else {
      log('FAIL', `OAuth Domain not accessible: ${response.status}`, oauthDiscoveryUrl);
      results.oauth['Domain Access'] = { status: 'FAIL', code: response.status };
    }
  } catch (error) {
    log('FAIL', `OAuth Domain error: ${error.message}`, oauthDiscoveryUrl);
    results.oauth['Domain Access'] = { status: 'FAIL', error: error.message };
  }
}

// Test Frontend and Login Page
async function testFrontendAuth() {
  log('INFO', 'Testing Frontend Authentication Pages...');
  
  const pages = [
    { path: '', name: 'Root Page', expectRedirect: true },
    { path: '/login', name: 'Login Page', expectRedirect: false },
    { path: '/dashboard', name: 'Dashboard Page', expectRedirect: true }
  ];
  
  for (const page of pages) {
    try {
      const response = await makeRequest(`${FRONTEND_URL}${page.path}`);
      
      if (response.status === 200) {
        log('PASS', `${page.name}: Accessible`, `${page.path} -> ${response.status}`);
        results.frontend[page.name] = { status: 'PASS', code: response.status };
        
        // Check if page contains authentication elements
        if (page.name === 'Login Page') {
          const hasAuth = response.data.includes('auth') || 
                         response.data.includes('login') || 
                         response.data.includes('cognito');
          if (hasAuth) {
            log('PASS', 'Login page contains auth elements');
            results.frontend['Auth Elements'] = { status: 'PASS' };
          } else {
            log('WARN', 'Login page may not have auth elements');
            results.frontend['Auth Elements'] = { status: 'WARN' };
          }
        }
        
      } else if (response.status === 302 || response.status === 301) {
        if (page.expectRedirect) {
          log('PASS', `${page.name}: Redirects as expected`, `${page.path} -> ${response.status}`);
          results.frontend[page.name] = { status: 'PASS', code: response.status, redirect: true };
        } else {
          log('WARN', `${page.name}: Unexpected redirect`, `${page.path} -> ${response.status}`);
          results.frontend[page.name] = { status: 'WARN', code: response.status };
        }
      } else {
        log('WARN', `${page.name}: Unexpected status`, `${page.path} -> ${response.status}`);
        results.frontend[page.name] = { status: 'WARN', code: response.status };
      }
    } catch (error) {
      log('FAIL', `${page.name}: Error`, error.message);
      results.frontend[page.name] = { status: 'FAIL', error: error.message };
    }
  }
}

// Validate Configuration Files
function validateConfigFiles() {
  log('INFO', 'Validating Configuration Files...');
  
  // Check .env file
  try {
    const envContent = fs.readFileSync('./.env', 'utf8');
    if (envContent.includes(COGNITO_CLIENT_ID)) {
      log('PASS', 'Correct client ID in .env', COGNITO_CLIENT_ID);
      results.cognito['Env Config'] = { status: 'PASS', clientId: COGNITO_CLIENT_ID };
    } else {
      log('FAIL', 'Incorrect client ID in .env');
      results.cognito['Env Config'] = { status: 'FAIL' };
    }
  } catch (error) {
    log('WARN', '.env file not readable', error.message);
    results.cognito['Env Config'] = { status: 'WARN', error: error.message };
  }
  
  // Check aws-exports.js
  try {
    const awsExportsContent = fs.readFileSync('./src/aws-exports.js', 'utf8');
    if (awsExportsContent.includes(COGNITO_CLIENT_ID)) {
      log('PASS', 'Correct client ID in aws-exports.js', COGNITO_CLIENT_ID);
      results.cognito['AWS Exports Config'] = { status: 'PASS', clientId: COGNITO_CLIENT_ID };
    } else {
      log('FAIL', 'Incorrect client ID in aws-exports.js');
      results.cognito['AWS Exports Config'] = { status: 'FAIL' };
    }
  } catch (error) {
    log('WARN', 'aws-exports.js not readable', error.message);
    results.cognito['AWS Exports Config'] = { status: 'WARN', error: error.message };
  }
}

// Generate Report
function generateReport() {
  log('INFO', 'Generating Authentication Test Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    configuration: {
      cognitoRegion: COGNITO_REGION,
      cognitoPoolId: COGNITO_POOL_ID,
      cognitoClientId: COGNITO_CLIENT_ID,
      cognitoDomain: COGNITO_DOMAIN,
      frontendUrl: FRONTEND_URL
    },
    summary: results.summary,
    results: results,
    recommendations: []
  };
  
  // Add recommendations
  if (results.summary.failed > 0) {
    report.recommendations.push('❌ Authentication configuration has critical issues');
  }
  if (results.summary.warnings > 0) {
    report.recommendations.push('⚠️ Some authentication components need attention');
  }
  if (results.summary.failed === 0 && results.summary.warnings === 0) {
    report.recommendations.push('✅ Authentication configuration is correct');
  }
  
  // Write report
  fs.writeFileSync('./auth-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n🔐 AUTHENTICATION TEST SUMMARY');
  console.log('===============================');
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  console.log('\n📋 Recommendations:');
  report.recommendations.forEach(rec => console.log(`   ${rec}`));
  console.log('\n📊 Full report saved to: auth-test-report.json');
}

// Main execution
async function main() {
  console.log('🔐 ACTA-UI Authentication Flow Test');
  console.log('===================================\n');
  
  try {
    validateConfigFiles();
    await testCognitoConfig();
    await testOAuthConfig();
    await testFrontendAuth();
    generateReport();
    
    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    log('FAIL', 'Auth test suite error', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testCognitoConfig, testOAuthConfig, testFrontendAuth, validateConfigFiles };

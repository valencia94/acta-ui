#!/usr/bin/env node

/**
 * API Gateway Health Endpoint Fix
 * ===============================
 * This script diagnoses and attempts to fix the API Gateway health endpoint
 * that should be publicly accessible but is currently requiring authentication.
 */

const https = require('https');

// Configuration
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url,
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Request timeout')));
    req.end();
  });
}

function log(level, message, details = '') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'INFO': '📋',
    'SUCCESS': '✅',
    'WARNING': '⚠️',
    'ERROR': '❌'
  }[level] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
  if (details) console.log(`   ${details}`);
}

async function diagnoseAPIGateway() {
  console.log('🔍 API Gateway Health Check Diagnosis');
  console.log('=====================================');
  
  // Test endpoints that should work
  const endpoints = [
    { path: '/health', expected: 'public', name: 'Health Check' },
    { path: '/projects', expected: 'protected', name: 'Projects' },
    { path: '/', expected: 'unknown', name: 'Root' }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      log('INFO', `Testing ${endpoint.name}...`, `${API_BASE}${endpoint.path}`);
      
      const response = await makeRequest(`${API_BASE}${endpoint.path}`);
      
      results[endpoint.name] = {
        status: response.status,
        expected: endpoint.expected,
        headers: response.headers,
        working: false
      };
      
      if (endpoint.expected === 'public' && response.status === 200) {
        log('SUCCESS', `${endpoint.name}: Working correctly (${response.status})`);
        results[endpoint.name].working = true;
      } else if (endpoint.expected === 'protected' && response.status === 403) {
        log('SUCCESS', `${endpoint.name}: Correctly protected (${response.status})`);
        results[endpoint.name].working = true;
      } else {
        log('ERROR', `${endpoint.name}: Unexpected response (${response.status})`);
        if (response.headers['x-amzn-errortype']) {
          log('ERROR', `Error type: ${response.headers['x-amzn-errortype']}`);
        }
      }
      
    } catch (error) {
      log('ERROR', `${endpoint.name}: ${error.message}`);
      results[endpoint.name] = { error: error.message, working: false };
    }
  }
  
  // Generate report
  console.log('\\n📊 DIAGNOSIS SUMMARY');
  console.log('===================');
  
  const issues = [];
  const working = [];
  
  Object.entries(results).forEach(([name, result]) => {
    if (result.working) {
      working.push(`✅ ${name}: Working correctly`);
    } else {
      issues.push(`❌ ${name}: ${result.error || `Status ${result.status} (expected ${result.expected})`}`);
    }
  });
  
  working.forEach(item => console.log(item));
  issues.forEach(item => console.log(item));
  
  if (issues.length > 0) {
    console.log('\\n🔧 RECOMMENDED FIXES:');
    console.log('1. Redeploy the secure-cognito-auth CloudFormation template');
    console.log('2. Ensure health endpoint has AuthorizationType: NONE');
    console.log('3. Check if API Gateway was manually modified');
    console.log('\\n📋 CloudFormation command:');
    console.log('aws cloudformation update-stack \\\\');
    console.log('  --stack-name acta-ui-secure-api \\\\');
    console.log('  --template-body file://infra/template-secure-cognito-auth.yaml');
  } else {
    console.log('\\n🎉 All endpoints working correctly!');
  }
  
  return issues.length === 0;
}

async function main() {
  try {
    const success = await diagnoseAPIGateway();
    process.exit(success ? 0 : 1);
  } catch (error) {
    log('ERROR', 'Diagnosis failed', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

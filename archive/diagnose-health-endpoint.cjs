#!/usr/bin/env node

/**
 * API Gateway Health Endpoint Diagnostic
 * 
 * This script checks the current status of the health endpoint
 * and compares it with what should be configured according to
 * the CloudFormation template.
 */

const https = require('https');

// Test endpoints
const ENDPOINTS = [
  {
    name: 'Health (via API Gateway)',
    url: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health',
    expectedStatus: 200,
    expectedResponse: '{"status":"ok"}',
    description: 'Should be public (no auth required)'
  },
  {
    name: 'Health (via CloudFront)',
    url: 'https://d7t9x3j66yd8k.cloudfront.net/health',
    expectedStatus: 200,
    expectedResponse: '{"status":"ok"}',
    description: 'Public static endpoint via CloudFront'
  },
  {
    name: 'Projects (Protected)',
    url: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/projects',
    expectedStatus: [401, 403],
    description: 'Should require authentication'
  }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.trim(),
          url: url,
        })
      );
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Request timeout')));
    req.end();
  });
}

async function main() {
  console.log('🩺 API GATEWAY HEALTH ENDPOINT DIAGNOSTIC');
  console.log('==========================================');
  console.log('Date:', new Date().toISOString());
  console.log();

  let allCorrect = true;

  for (const endpoint of ENDPOINTS) {
    console.log(`🔍 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    console.log(`   Expected: ${Array.isArray(endpoint.expectedStatus) ? endpoint.expectedStatus.join(' or ') : endpoint.expectedStatus}`);
    console.log(`   Purpose: ${endpoint.description}`);

    try {
      const response = await makeRequest(endpoint.url);
      const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
        ? endpoint.expectedStatus 
        : [endpoint.expectedStatus];

      if (expectedStatuses.includes(response.status)) {
        console.log(`   ✅ PASS: ${response.status} ${response.status === 200 ? '- ' + response.data : ''}`);
      } else {
        console.log(`   ❌ FAIL: ${response.status} (expected ${expectedStatuses.join(' or ')})`);
        if (response.data) {
          console.log(`   Response: ${response.data}`);
        }
        allCorrect = false;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      allCorrect = false;
    }
    console.log();
  }

  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('====================');
  
  if (allCorrect) {
    console.log('✅ All endpoints behaving as expected');
    console.log('🎉 Health endpoint is properly configured');
  } else {
    console.log('❌ Issues detected with API Gateway configuration');
    console.log();
    console.log('🔧 RECOMMENDED ACTIONS:');
    console.log('1. Redeploy CloudFormation template to restore health endpoint');
    console.log('2. Verify that AuthorizationType: NONE is set for /health endpoint');
    console.log('3. Check if manual changes were made to API Gateway');
  }

  console.log();
  console.log('📋 TECHNICAL DETAILS:');
  console.log('- CloudFormation template: infra/template-secure-cognito-auth.yaml');
  console.log('- Health method should have: AuthorizationType: NONE (line 86)');
  console.log('- Current API Gateway behavior suggests auth is required');
  
  process.exit(allCorrect ? 0 : 1);
}

main().catch(console.error);

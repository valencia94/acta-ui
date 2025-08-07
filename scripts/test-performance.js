#!/usr/bin/env node

// Performance Test Script for ACTA-UI (ES Module version)
// Run with: node scripts/test-performance.js

import https from 'https';
import { performance } from 'perf_hooks';

const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
const CLOUDFRONT_URL = 'https://d7t9x3j66yd8k.cloudfront.net';

console.log('🚀 ACTA-UI Production Performance Test');
console.log('=====================================\n');

async function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runTests() {
  const results = {
    pageLoad: 0,
    apiHealth: 0,
    apiProjects: 0
  };

  // Test 1: CloudFront Page Load
  console.log('📄 Testing CloudFront page load...');
  const pageStart = performance.now();
  try {
    const response = await httpsGet(CLOUDFRONT_URL);
    results.pageLoad = performance.now() - pageStart;
    console.log(`✅ Page loaded in ${results.pageLoad.toFixed(2)}ms (Status: ${response.status})`);
  } catch (error) {
    console.error('❌ Page load failed:', error.message);
  }

  // Test 2: API Health Check
  console.log('\n🏥 Testing API health endpoint...');
  const healthStart = performance.now();
  try {
    const response = await httpsGet(`${API_BASE}/health`);
    results.apiHealth = performance.now() - healthStart;
    console.log(`✅ API health check: ${results.apiHealth.toFixed(2)}ms (Status: ${response.status})`);
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
  }

  // Test 3: API Projects Endpoint
  console.log('\n📋 Testing API projects endpoint...');
  const projectsStart = performance.now();
  try {
    const response = await httpsGet(`${API_BASE}/projects`);
    results.apiProjects = performance.now() - projectsStart;
    console.log(`✅ Projects endpoint: ${results.apiProjects.toFixed(2)}ms (Status: ${response.status})`);
  } catch (error) {
    console.error('❌ Projects endpoint failed:', error.message);
  }

  // Summary
  console.log('\n📊 PERFORMANCE SUMMARY');
  console.log('======================');
  console.log(`Page Load: ${results.pageLoad.toFixed(2)}ms ${results.pageLoad < 2000 ? '✅' : '⚠️'}`);
  console.log(`API Health: ${results.apiHealth.toFixed(2)}ms ${results.apiHealth < 500 ? '✅' : '⚠️'}`);
  console.log(`API Projects: ${results.apiProjects.toFixed(2)}ms ${results.apiProjects < 3000 ? '✅' : '⚠️'}`);

  // Performance recommendations
  console.log('\n💡 RECOMMENDATIONS');
  if (results.apiProjects > 3000) {
    console.log('⚠️  API response time is slow. Consider:');
    console.log('   - Implementing direct DynamoDB access via awsDataService');
    console.log('   - Adding API Gateway caching');
    console.log('   - Optimizing Lambda function code');
  }
  if (results.pageLoad > 2000) {
    console.log('⚠️  Page load time needs optimization. Consider:');
    console.log('   - Enabling CloudFront compression');
    console.log('   - Implementing lazy loading');
  }
}

// Run the tests
runTests().catch(console.error);

#!/usr/bin/env node

/**
 * ACTA-UI Production Testing Suite
 *
 * Comprehensive end-to-end testing of the ACTA-UI system
 * including API endpoints, frontend functionality, and deployment status
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

// Configuration
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';

// Test results
const results = {
  api: {},
  frontend: {},
  deployment: {},
  summary: { passed: 0, failed: 0, warnings: 0 },
};

// Helper functions
function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url,
        })
      );
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Request timeout')));
    req.end();
  });
}

function log(level, message, details = '') {
  const timestamp = new Date().toISOString();
  const prefix =
    {
      PASS: '✅',
      FAIL: '❌',
      WARN: '⚠️',
      INFO: '📋',
    }[level] || '📋';

  console.log(`${prefix} [${timestamp}] ${message}`);
  if (details) console.log(`   ${details}`);

  if (level === 'PASS') results.summary.passed++;
  else if (level === 'FAIL') results.summary.failed++;
  else if (level === 'WARN') results.summary.warnings++;
}

// Test API Endpoints
async function testAPIs() {
  log('INFO', 'Testing API Endpoints...');

  const endpoints = [
    { path: '/health', expectedStatus: 200, name: 'Health Check', useCloudFront: true },
    {
      path: '/projects',
      expectedStatus: 403,
      name: 'Projects (Auth Required)',
    },
    {
      path: '/pm-manager/all-projects',
      expectedStatus: 403,
      name: 'PM All Projects (Auth Required)',
    },
    {
      path: '/pm-manager/test@example.com',
      expectedStatus: 403,
      name: 'PM Email Projects (Auth Required)',
    },
    {
      path: '/check-document/dummy',
      expectedStatus: [400, 403],
      name: 'Document Check',
    },
  ];

  for (const endpoint of endpoints) {
    try {
      const baseUrl = endpoint.useCloudFront ? FRONTEND_URL : API_BASE;
      const response = await makeRequest(`${baseUrl}${endpoint.path}`);
      const expectedStatuses = Array.isArray(endpoint.expectedStatus)
        ? endpoint.expectedStatus
        : [endpoint.expectedStatus];

      if (expectedStatuses.includes(response.status)) {
        log('PASS', `${endpoint.name}: ${response.status}`, endpoint.path);
        results.api[endpoint.name] = { status: 'PASS', code: response.status };
      } else {
        log(
          'FAIL',
          `${endpoint.name}: ${response.status} (expected ${endpoint.expectedStatus})`,
          endpoint.path
        );
        results.api[endpoint.name] = { status: 'FAIL', code: response.status };
      }
    } catch (error) {
      log('FAIL', `${endpoint.name}: ${error.message}`, endpoint.path);
      results.api[endpoint.name] = { status: 'FAIL', error: error.message };
    }
  }
}

// Test Frontend
async function testFrontend() {
  log('INFO', 'Testing Frontend...');

  const frontendTests = [
    { path: '', name: 'Root Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/dashboard', name: 'Dashboard Page' },
  ];

  for (const test of frontendTests) {
    try {
      const response = await makeRequest(`${FRONTEND_URL}${test.path}`);

      if (response.status === 200) {
        log('PASS', `${test.name}: ${response.status}`, test.path);
        results.frontend[test.name] = { status: 'PASS', code: response.status };
      } else {
        log('WARN', `${test.name}: ${response.status}`, test.path);
        results.frontend[test.name] = { status: 'WARN', code: response.status };
      }
    } catch (error) {
      log('FAIL', `${test.name}: ${error.message}`, test.path);
      results.frontend[test.name] = { status: 'FAIL', error: error.message };
    }
  }
}

// Check Deployment Status
async function checkDeployment() {
  log('INFO', 'Checking Deployment Status...');

  // Check if build artifacts exist
  const buildExists = fs.existsSync('./dist/index.html');
  if (buildExists) {
    log('PASS', 'Build artifacts exist', './dist/index.html found');
    results.deployment['Build Artifacts'] = { status: 'PASS' };
  } else {
    log('FAIL', 'Build artifacts missing', './dist/index.html not found');
    results.deployment['Build Artifacts'] = { status: 'FAIL' };
  }

  // Check package.json version
  try {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    log('PASS', `Package version: ${pkg.version}`, `Name: ${pkg.name}`);
    results.deployment['Package Info'] = {
      status: 'PASS',
      version: pkg.version,
    };
  } catch (error) {
    log('FAIL', 'Package.json read error', error.message);
    results.deployment['Package Info'] = {
      status: 'FAIL',
      error: error.message,
    };
  }
}

// Test PDF Preview Feature
async function testPDFPreview() {
  log('INFO', 'Testing PDF Preview Feature...');

  const pdfComponents = [
    './src/components/PDFPreview/PDFPreview.tsx',
    './src/components/PDFPreview/PDFViewerCore.tsx',
    './src/components/PDFPreview/index.ts',
  ];

  let pdfFeatureReady = true;
  for (const component of pdfComponents) {
    if (fs.existsSync(component)) {
      log('PASS', `PDF Component exists: ${component}`);
    } else {
      log('FAIL', `PDF Component missing: ${component}`);
      pdfFeatureReady = false;
    }
  }

  results.deployment['PDF Preview Feature'] = {
    status: pdfFeatureReady ? 'PASS' : 'FAIL',
    components: pdfComponents.length,
  };
}

// Generate Report
function generateReport() {
  log('INFO', 'Generating Test Report...');

  const report = {
    timestamp: new Date().toISOString(),
    summary: results.summary,
    results: results,
    recommendations: [],
  };

  // Add recommendations based on results
  if (results.summary.failed > 0) {
    report.recommendations.push('❌ Some tests failed - review failed items');
  }
  if (results.summary.warnings > 0) {
    report.recommendations.push(
      '⚠️ Some warnings detected - verify frontend routing'
    );
  }
  if (results.summary.failed === 0 && results.summary.warnings === 0) {
    report.recommendations.push(
      '✅ All tests passed - system is production ready!'
    );
  }

  // Write report to file
  fs.writeFileSync(
    './production-test-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n🎯 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  console.log('\n📋 Recommendations:');
  report.recommendations.forEach((rec) => console.log(`   ${rec}`));
  console.log('\n📊 Full report saved to: production-test-report.json');
}

// Main execution
async function main() {
  console.log('🚀 ACTA-UI Production Testing Suite');
  console.log('====================================\n');

  try {
    await testAPIs();
    await testFrontend();
    await checkDeployment();
    await testPDFPreview();
    generateReport();

    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    log('FAIL', 'Test suite error', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testAPIs, testFrontend, checkDeployment, testPDFPreview };

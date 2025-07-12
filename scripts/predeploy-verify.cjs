#!/usr/bin/env node

/**
 * Unified pre-deployment validation for ACTA-UI
 * Validates: auth config, API reachability, Cognito setup, bundle coverage, UI completeness
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const BUILD_DIR = './dist';
const CONFIG_PATH = './public/aws-exports.js';
const INDEX_HTML = path.join(BUILD_DIR, 'index.html');
const CLOUDFRONT_URL = 'https://d7t9x3j66yd8k.cloudfront.net';
const API_ENDPOINT = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

// 1. Check if aws-exports.js exists
function checkAWSExports() {
  console.log('🔍 Checking AWS config...');
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error('❌ Missing public/aws-exports.js');
  }
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
  if (!configContent.includes('aws_user_pools_id')) {
    throw new Error('❌ aws-exports.js appears incomplete');
  }
  console.log('✅ aws-exports.js validated.');
}

// 2. Check build output directory
function checkBuildOutput() {
  console.log('🔍 Checking build output...');
  if (!fs.existsSync(BUILD_DIR)) {
    throw new Error('❌ Build directory missing. Run `pnpm build` first.');
  }
  if (!fs.existsSync(INDEX_HTML)) {
    throw new Error('❌ dist/index.html not found');
  }
  console.log('✅ Build output exists.');
}

// 3. Check for bundle completeness
function checkBundleIncludes() {
  const criticalModules = ['DynamoProjectsView', 'App', 'main.tsx', 'aws-exports.js'];
  const distFiles = fs.readdirSync(path.join(BUILD_DIR, 'assets'));
  criticalModules.forEach((mod) => {
    const match = distFiles.find((f) => f.includes(mod));
    if (!match) console.warn(`⚠️ Chunk for ${mod} not detected`);
    else console.log(`✅ Found ${mod} → ${match}`);
  });
}

// 4. Validate API endpoint
async function checkAPI() {
  console.log('🔍 Checking API connectivity...');
  try {
    const res = await fetch(API_ENDPOINT, { method: 'GET' });
    if (res.status === 403 || res.status === 401) {
      console.log('✅ API reachable but requires auth');
    } else if (res.ok) {
      console.log('✅ API responded successfully');
    } else {
      console.warn(`⚠️ Unexpected API response: ${res.status}`);
    }
  } catch (err) {
    throw new Error('❌ API endpoint not reachable: ' + err.message);
  }
}

// 5. Check for missing autocomplete on login form
function checkFormAccessibility() {
  console.log('🔍 Checking autocomplete attributes...');
  const html = fs.readFileSync(INDEX_HTML, 'utf-8');
  const hasAutocomplete = html.includes('autocomplete="email"') || html.includes('autocomplete="username"');
  if (!hasAutocomplete) {
    console.warn('⚠️ Missing autocomplete attributes on form fields');
  } else {
    console.log('✅ Form accessibility attributes present.');
  }
}

// 6. Run all checks
(async () => {
  try {
    checkAWSExports();
    checkBuildOutput();
    checkBundleIncludes();
    await checkAPI();
    checkFormAccessibility();

    console.log('\n🎉 Pre-deployment readiness check PASSED\n');
    process.exit(0);
  } catch (e) {
    console.error('\n❌ Pre-deployment check FAILED:', e.message, '\n');
    process.exit(1);
  }
})();

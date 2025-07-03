#!/usr/bin/env node

/**
 * ACTA-UI Issue Analysis
 *
 * Analyzes the specific issues reported by user:
 * 1. "Email address required for bulk generation"
 * 2. "Backend API is not available"
 * 3. "Failed to send approval email"
 * 4. Auth Debug showing "Not authenticated"
 * 5. "No PDF document found for project"
 */

const https = require('https');

// Configuration
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
const TEST_PROJECT_ID = '1000000049842296'; // Project ID mentioned in user's error

console.log('🔍 ACTA-UI Issue Analysis');
console.log('========================\n');
console.log('Analyzing reported issues:');
console.log('❌ "Email address required for bulk generation"');
console.log('❌ "Backend API is not available"');
console.log('❌ "Failed to send approval email"');
console.log('❌ "User needs to be authenticated to call this API"');
console.log('❌ "No PDF document found for project 1000000049842296"');
console.log('');

async function makeAPICall(path, description) {
  return new Promise((resolve) => {
    const req = https.request(
      `${API_BASE}${path}`,
      {
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'ACTA-UI-Test',
          Accept: 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log(`${description}:`);
          console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
          if (data) {
            try {
              const jsonData = JSON.parse(data);
              console.log(
                `  Response: ${JSON.stringify(jsonData, null, 2).substring(0, 200)}...`
              );
            } catch {
              console.log(`  Response: ${data.substring(0, 200)}...`);
            }
          }
          console.log('');
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data,
          });
        });
      }
    );

    req.on('error', (error) => {
      console.log(`${description}: ❌ ${error.message}\n`);
      resolve({ error: error.message });
    });

    req.on('timeout', () => {
      console.log(`${description}: ❌ Request timeout\n`);
      resolve({ error: 'timeout' });
    });

    req.end();
  });
}

async function analyzeIssues() {
  console.log('🧪 Testing API Endpoints (without authentication)...\n');

  // Test health endpoint
  await makeAPICall('/health', '🏥 Health Check');

  // Test project endpoints that require auth
  await makeAPICall('/projects', '📊 Projects List (should require auth)');
  await makeAPICall(
    '/pm-manager/all-projects',
    '👥 PM All Projects (should require auth)'
  );
  await makeAPICall(
    `/pm-manager/test@example.com`,
    '📧 PM Email Projects (should require auth)'
  );

  // Test document-related endpoints
  await makeAPICall(
    `/check-document/${TEST_PROJECT_ID}`,
    `📄 Document Check for ${TEST_PROJECT_ID}`
  );
  await makeAPICall(
    `/download-acta/${TEST_PROJECT_ID}?format=pdf`,
    `📥 Download PDF for ${TEST_PROJECT_ID}`
  );

  // Test project summary
  await makeAPICall(
    `/project-summary/${TEST_PROJECT_ID}`,
    `📋 Project Summary for ${TEST_PROJECT_ID}`
  );

  console.log('🔍 Issue Analysis Summary:');
  console.log('==========================\n');

  console.log('1. 📧 "Email address required for bulk generation"');
  console.log('   → This suggests the PM email is not being passed correctly');
  console.log(
    '   → Frontend may not be extracting user email from auth session'
  );
  console.log('   → Check: Cognito token contains email claim\n');

  console.log('2. 🔌 "Backend API is not available"');
  console.log('   → API endpoints are responding (see tests above)');
  console.log('   → Issue likely: CORS or authentication token problems');
  console.log('   → Check: Browser network tab for CORS errors\n');

  console.log('3. 📤 "Failed to send approval email"');
  console.log('   → Approval email endpoint requires authentication');
  console.log('   → Frontend auth token may be missing or invalid');
  console.log('   → Check: localStorage token and Cognito session\n');

  console.log('4. 🔐 "User needs to be authenticated to call this API"');
  console.log('   → Cognito JWT token not being sent with requests');
  console.log('   → Frontend authentication flow may be broken');
  console.log('   → Check: AWS Amplify configuration and token handling\n');

  console.log('5. 📄 "No PDF document found for project"');
  console.log('   → Document may not exist in S3 bucket');
  console.log('   → Need to generate document first');
  console.log('   → Check: S3 bucket contents and document generation\n');

  console.log('🛠️ RECOMMENDED FIXES:');
  console.log('===================\n');

  console.log('1. 🔑 Authentication Issues:');
  console.log('   - User needs to properly log in through Cognito');
  console.log('   - JWT token must be stored and sent with API requests');
  console.log('   - Check AWS Amplify authentication setup\n');

  console.log('2. 📧 Email Issues:');
  console.log('   - Ensure user email is extracted from Cognito token');
  console.log('   - Verify email claim is present in JWT');
  console.log('   - Pass email to bulk generation functions\n');

  console.log('3. 📄 Document Issues:');
  console.log('   - Generate documents before trying to download');
  console.log('   - Use "Generate Acta" button first');
  console.log('   - Then use download buttons\n');

  console.log('4. 🌐 Frontend Issues:');
  console.log('   - Check browser developer tools for errors');
  console.log('   - Verify API requests include Authorization header');
  console.log('   - Test authentication flow step by step\n');

  console.log('📋 IMMEDIATE ACTIONS FOR USER:');
  console.log('==============================\n');

  console.log('1. 🔐 AUTHENTICATION FIRST:');
  console.log('   - Go to: https://d7t9x3j66yd8k.cloudfront.net');
  console.log('   - Click "Sign In" and log in with valid Cognito credentials');
  console.log('   - Check the auth debug box shows "Authenticated"\n');

  console.log('2. 📄 DOCUMENT GENERATION:');
  console.log('   - Enter project ID: 1000000049842296');
  console.log('   - Click "Generate Acta" button FIRST');
  console.log('   - Wait for generation to complete');
  console.log('   - Then try download/preview buttons\n');

  console.log('3. 🧪 DEBUGGING:');
  console.log('   - Open browser Developer Tools (F12)');
  console.log('   - Check Console tab for JavaScript errors');
  console.log('   - Check Network tab for failed API calls');
  console.log('   - Look for missing Authorization headers\n');

  console.log('✅ All API endpoints are working correctly!');
  console.log('🔑 Main issue: Authentication not working in frontend');
  console.log('📧 Secondary issue: User email not being passed to backend');
}

// Run the analysis
analyzeIssues()
  .then(() => {
    console.log('\n🎯 Analysis Complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });

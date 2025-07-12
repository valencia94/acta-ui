// Simple deployment test
const https = require('https');
const url = require('url');

console.log('🧪 Testing ACTA-UI Deployment...\n');

// Test 1: Frontend availability
function testFrontend() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://d7t9x3j66yd8k.cloudfront.net', (res) => {
      console.log(`✅ Frontend Status: ${res.statusCode}`);
      console.log(`✅ Content-Type: ${res.headers['content-type']}`);
      resolve(res.statusCode === 200);
    });
    req.on('error', (err) => {
      console.log(`❌ Frontend Error: ${err.message}`);
      resolve(false);
    });
    req.setTimeout(5000);
  });
}

// Test 2: AWS Config availability
function testAWSConfig() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://d7t9x3j66yd8k.cloudfront.net/aws-exports.js', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ AWS Config Status: ${res.statusCode}`);
        if (data.includes('userPoolId') && data.includes('us-east-2_FyHLtOhiY')) {
          console.log('✅ AWS Config contains correct userPoolId');
          resolve(true);
        } else {
          console.log('❌ AWS Config missing userPoolId');
          resolve(false);
        }
      });
    });
    req.on('error', (err) => {
      console.log(`❌ AWS Config Error: ${err.message}`);
      resolve(false);
    });
    req.setTimeout(5000);
  });
}

// Test 3: API Gateway health
function testAPIHealth() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ API Health Status: ${res.statusCode}`);
        if (data.includes('ok')) {
          console.log('✅ API Health check passed');
          resolve(true);
        } else {
          console.log('❌ API Health check failed');
          resolve(false);
        }
      });
    });
    req.on('error', (err) => {
      console.log(`❌ API Health Error: ${err.message}`);
      resolve(false);
    });
    req.setTimeout(5000);
  });
}

// Run all tests
async function runTests() {
  const results = await Promise.all([
    testFrontend(),
    testAWSConfig(),
    testAPIHealth()
  ]);
  
  console.log('\n🎯 TEST SUMMARY:');
  console.log(`Frontend: ${results[0] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`AWS Config: ${results[1] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Health: ${results[2] ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.every(r => r);
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Deployment appears to be working correctly!');
    console.log('Next steps:');
    console.log('1. Test authentication in browser');
    console.log('2. Verify API endpoints with auth token');
    console.log('3. Test DynamoDB integration');
  }
}

runTests();

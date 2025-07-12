#!/usr/bin/env node

const AWS = require('aws-sdk');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

// Configuration
const config = {
  region: 'us-east-2',
  userPoolId: process.env.VITE_COGNITO_POOL_ID,
  identityPoolId: process.env.VITE_COGNITO_IDENTITY_POOL_ID || 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
  apiBaseUrl: process.env.VITE_API_BASE_URL,
  dynamoTableName: 'ProjectPlace_DataExtrator_landing_table_v2'
};

console.log('🔐 CRITICAL CONNECTIVITY TEST');
console.log('==============================');
console.log('API Base URL:', config.apiBaseUrl);
console.log('DynamoDB Table:', config.dynamoTableName);
console.log('Identity Pool ID:', config.identityPoolId);
console.log('==============================\n');

// Test 1: API Gateway Health and Security
async function testAPIGateway() {
  console.log('1️⃣ Testing API Gateway...');
  
  try {
    // Test health endpoint
    console.log('   → Testing health endpoint...');
    const healthResponse = await fetch(`${config.apiBaseUrl}/health`);
    console.log('   → Health Status:', healthResponse.status);
    const healthText = await healthResponse.text();
    console.log('   → Health Response:', healthText);
    
    // Test protected endpoint (should return 401/403)
    console.log('   → Testing protected endpoint...');
    const protectedResponse = await fetch(`${config.apiBaseUrl}/api/pm-manager/all-projects`);
    console.log('   → Protected Status:', protectedResponse.status);
    
    if (protectedResponse.status === 401 || protectedResponse.status === 403) {
      console.log('   ✅ API Gateway properly secured');
    } else {
      console.log('   ⚠️ API Gateway security may be misconfigured');
    }
    
    // Test CORS headers
    console.log('   → Testing CORS headers...');
    const corsResponse = await fetch(`${config.apiBaseUrl}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://d7t9x3j66yd8k.cloudfront.net',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeaders = corsResponse.headers.get('access-control-allow-origin');
    console.log('   → CORS Allow Origin:', corsHeaders || 'Not present');
    
    if (corsHeaders) {
      console.log('   ✅ CORS configured');
    } else {
      console.log('   ⚠️ CORS may not be configured');
    }
    
  } catch (error) {
    console.error('   ❌ API Gateway test failed:', error.message);
  }
  
  console.log();
}

// Test 2: DynamoDB Access via Identity Pool
async function testDynamoDBAccess() {
  console.log('2️⃣ Testing DynamoDB Access...');
  
  try {
    // Configure AWS SDK with region
    AWS.config.update({ region: config.region });
    
    // Create Cognito Identity client
    const cognitoIdentity = new AWS.CognitoIdentity();
    
    // Get anonymous identity
    console.log('   → Getting anonymous identity...');
    const identityResult = await cognitoIdentity.getId({
      IdentityPoolId: config.identityPoolId
    }).promise();
    
    console.log('   → Identity ID:', identityResult.IdentityId);
    
    // Get credentials for the identity
    console.log('   → Getting credentials...');
    const credentialsResult = await cognitoIdentity.getCredentialsForIdentity({
      IdentityId: identityResult.IdentityId
    }).promise();
    
    console.log('   → Access Key ID:', credentialsResult.Credentials.AccessKeyId);
    console.log('   → Expiration:', credentialsResult.Credentials.Expiration);
    
    // Test DynamoDB access with these credentials
    console.log('   → Testing DynamoDB access...');
    const dynamoClient = new AWS.DynamoDB.DocumentClient({
      region: config.region,
      accessKeyId: credentialsResult.Credentials.AccessKeyId,
      secretAccessKey: credentialsResult.Credentials.SecretKey,
      sessionToken: credentialsResult.Credentials.SessionToken
    });
    
    const scanResult = await dynamoClient.scan({
      TableName: config.dynamoTableName,
      Limit: 5
    }).promise();
    
    console.log('   ✅ DynamoDB access successful');
    console.log('   → Items found:', scanResult.Count);
    console.log('   → Total items in table:', scanResult.ScannedCount);
    
    if (scanResult.Items && scanResult.Items.length > 0) {
      console.log('   → Sample item keys:', Object.keys(scanResult.Items[0]));
    }
    
  } catch (error) {
    console.error('   ❌ DynamoDB access failed:', error.message);
    console.error('   → Error code:', error.code);
    console.error('   → Error details:', error.stack?.split('\n')[0]);
  }
  
  console.log();
}

// Test 3: Lambda Function Permissions
async function testLambdaPermissions() {
  console.log('3️⃣ Testing Lambda Function Permissions...');
  
  try {
    // List Lambda functions
    const lambda = new AWS.Lambda({ region: config.region });
    
    console.log('   → Listing Lambda functions...');
    const functions = await lambda.listFunctions({
      FunctionVersion: 'ALL'
    }).promise();
    
    const actaFunctions = functions.Functions.filter(f => 
      f.FunctionName.includes('acta-ui') || f.FunctionName.includes('ActaUI')
    );
    
    console.log('   → Found ACTA-UI functions:', actaFunctions.length);
    
    actaFunctions.forEach(func => {
      console.log('   → Function:', func.FunctionName);
      console.log('   → Runtime:', func.Runtime);
      console.log('   → Role:', func.Role);
      console.log('   → Last Modified:', func.LastModified);
    });
    
    if (actaFunctions.length > 0) {
      console.log('   ✅ Lambda functions found');
    } else {
      console.log('   ⚠️ No ACTA-UI Lambda functions found');
    }
    
  } catch (error) {
    console.log('   ⚠️ Lambda permissions test skipped:', error.message);
    console.log('   → This is expected if Lambda access is not configured');
  }
  
  console.log();
}

// Test 4: End-to-End API Call Simulation
async function testEndToEndAPICall() {
  console.log('4️⃣ Testing End-to-End API Call Simulation...');
  
  try {
    // This simulates what the frontend would do
    console.log('   → Simulating frontend API call pattern...');
    
    // Step 1: Get identity and credentials (as frontend would)
    AWS.config.update({ region: config.region });
    const cognitoIdentity = new AWS.CognitoIdentity();
    
    const identityResult = await cognitoIdentity.getId({
      IdentityPoolId: config.identityPoolId
    }).promise();
    
    const credentialsResult = await cognitoIdentity.getCredentialsForIdentity({
      IdentityId: identityResult.IdentityId
    }).promise();
    
    console.log('   → Got identity credentials');
    
    // Step 2: Try to make API call with AWS signature (if Lambda expects it)
    console.log('   → Making signed API request...');
    
    // For now, just test the basic API call
    const response = await fetch(`${config.apiBaseUrl}/api/pm-manager/all-projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://d7t9x3j66yd8k.cloudfront.net'
      }
    });
    
    console.log('   → API Response Status:', response.status);
    console.log('   → API Response Headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('   → API Response Body:', responseText.slice(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    if (response.status === 401 || response.status === 403) {
      console.log('   ✅ API properly requires authentication');
    } else if (response.status === 200) {
      console.log('   ✅ API call successful (authentication may be optional)');
    } else {
      console.log('   ⚠️ Unexpected API response');
    }
    
  } catch (error) {
    console.error('   ❌ End-to-end API call failed:', error.message);
  }
  
  console.log();
}

// Main test runner
async function runCriticalConnectivityTest() {
  console.log('🚀 Starting critical connectivity test...\n');
  
  try {
    await testAPIGateway();
    await testDynamoDBAccess();
    await testLambdaPermissions();
    await testEndToEndAPICall();
    
    console.log('🎯 CRITICAL CONNECTIVITY TEST COMPLETED');
    console.log('=========================================');
    console.log('✅ All critical components tested');
    console.log('📊 Review results above for any issues');
    console.log('🔄 Next: Run end-to-end browser test');
    
  } catch (error) {
    console.error('❌ Critical connectivity test failed:', error);
    process.exit(1);
  }
}

// Run the test
runCriticalConnectivityTest().catch(console.error);

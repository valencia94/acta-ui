#!/usr/bin/env node

const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const fetch = require('node-fetch');
const { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } = require('@aws-sdk/client-cognito-identity');
const { fromCognitoIdentityPool } = require('@aws-sdk/credential-provider-cognito-identity');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

// Configuration
const config = {
  region: 'us-east-2',
  userPoolId: process.env.VITE_COGNITO_POOL_ID,
  userPoolWebClientId: process.env.VITE_COGNITO_WEB_CLIENT_ID,
  identityPoolId: process.env.VITE_COGNITO_IDENTITY_POOL_ID || 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
  apiBaseUrl: process.env.VITE_API_BASE_URL,
  dynamoTableName: 'ProjectPlace_DataExtrator_landing_table_v2'
};

console.log('🔐 COMPREHENSIVE CONNECTIVITY TEST');
console.log('=====================================');
console.log('Region:', config.region);
console.log('User Pool ID:', config.userPoolId);
console.log('Identity Pool ID:', config.identityPoolId);
console.log('API Base URL:', config.apiBaseUrl);
console.log('DynamoDB Table:', config.dynamoTableName);
console.log('=====================================\n');

// Test 1: DynamoDB Direct Access (via API Gateway)
async function testDynamoDBViaAPI() {
  console.log('1️⃣ Testing DynamoDB Access via API Gateway...');
  
  try {
    // Test without authentication (should fail)
    console.log('   → Testing unauthenticated access...');
    const response = await fetch(`${config.apiBaseUrl}/api/pm-manager/all-projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   → Response Status:', response.status);
    console.log('   → Response Headers:', Object.fromEntries(response.headers));
    
    if (response.status === 401 || response.status === 403) {
      console.log('   ✅ Properly secured - unauthorized access rejected');
    } else {
      console.log('   ⚠️ Unexpected response - endpoint may not be properly secured');
    }
    
    // Try to get response body
    const text = await response.text();
    console.log('   → Response Body:', text.slice(0, 200) + (text.length > 200 ? '...' : ''));
    
  } catch (error) {
    console.error('   ❌ Error testing DynamoDB via API:', error.message);
  }
  
  console.log();
}

// Test 2: Cognito Identity Pool Credentials
async function testIdentityPoolCredentials() {
  console.log('2️⃣ Testing Cognito Identity Pool Credentials...');
  
  try {
    // Get anonymous credentials
    console.log('   → Getting anonymous identity...');
    const cognitoIdentity = new CognitoIdentityClient({ region: config.region });
    
    const getIdCommand = new GetIdCommand({
      IdentityPoolId: config.identityPoolId
    });
    
    const identityResult = await cognitoIdentity.send(getIdCommand);
    console.log('   → Identity ID:', identityResult.IdentityId);
    
    // Get credentials for anonymous identity
    console.log('   → Getting credentials for anonymous identity...');
    const getCredentialsCommand = new GetCredentialsForIdentityCommand({
      IdentityId: identityResult.IdentityId
    });
    
    const credentialsResult = await cognitoIdentity.send(getCredentialsCommand);
    console.log('   → Access Key ID:', credentialsResult.Credentials.AccessKeyId);
    console.log('   → Session Token:', credentialsResult.Credentials.SessionToken ? 'Present' : 'Missing');
    console.log('   → Expiration:', credentialsResult.Credentials.Expiration);
    
    // Test DynamoDB access with these credentials
    console.log('   → Testing DynamoDB access with anonymous credentials...');
    const dynamoClient = new AWS.DynamoDB.DocumentClient({
      region: config.region,
      accessKeyId: credentialsResult.Credentials.AccessKeyId,
      secretAccessKey: credentialsResult.Credentials.SecretKey,
      sessionToken: credentialsResult.Credentials.SessionToken
    });
    
    try {
      const scanResult = await dynamoClient.scan({
        TableName: config.dynamoTableName,
        Limit: 1
      }).promise();
      
      console.log('   ✅ DynamoDB access successful');
      console.log('   → Items found:', scanResult.Count);
      console.log('   → First item keys:', scanResult.Items && scanResult.Items[0] ? Object.keys(scanResult.Items[0]) : 'No items');
      
    } catch (dynamoError) {
      console.log('   ❌ DynamoDB access failed:', dynamoError.message);
      console.log('   → Error code:', dynamoError.code);
    }
    
  } catch (error) {
    console.error('   ❌ Error testing Identity Pool credentials:', error.message);
  }
  
  console.log();
}

// Test 3: API Gateway Health Check
async function testAPIGatewayHealth() {
  console.log('3️⃣ Testing API Gateway Health...');
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/health`);
    console.log('   → Status:', response.status);
    console.log('   → Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('   → Response:', text);
    
    if (response.status === 200) {
      console.log('   ✅ API Gateway health check passed');
    } else {
      console.log('   ❌ API Gateway health check failed');
    }
    
  } catch (error) {
    console.error('   ❌ Error testing API Gateway health:', error.message);
  }
  
  console.log();
}

// Test 4: Lambda Function Logs (if accessible)
async function testLambdaLogs() {
  console.log('4️⃣ Testing Lambda Function Logs...');
  
  try {
    // List log groups to find our Lambda
    const cloudWatchLogs = new AWS.CloudWatchLogs({ region: config.region });
    
    const logGroups = await cloudWatchLogs.describeLogGroups({
      logGroupNamePrefix: '/aws/lambda/acta-ui'
    }).promise();
    
    console.log('   → Found log groups:', logGroups.logGroups.length);
    logGroups.logGroups.forEach(group => {
      console.log('   → Log Group:', group.logGroupName);
    });
    
    if (logGroups.logGroups.length > 0) {
      // Get recent logs from the first group
      const logGroupName = logGroups.logGroups[0].logGroupName;
      console.log('   → Getting recent logs from:', logGroupName);
      
      const logStreams = await cloudWatchLogs.describeLogStreams({
        logGroupName: logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 1
      }).promise();
      
      if (logStreams.logStreams.length > 0) {
        const logStreamName = logStreams.logStreams[0].logStreamName;
        console.log('   → Latest log stream:', logStreamName);
        
        const logEvents = await cloudWatchLogs.getLogEvents({
          logGroupName: logGroupName,
          logStreamName: logStreamName,
          limit: 5
        }).promise();
        
        console.log('   → Recent log events:');
        logEvents.events.forEach(event => {
          console.log('   →', new Date(event.timestamp).toISOString(), event.message.slice(0, 100));
        });
      }
    }
    
  } catch (error) {
    console.log('   ⚠️ Could not access Lambda logs:', error.message);
    console.log('   → This is expected if CloudWatch access is not configured');
  }
  
  console.log();
}

// Test 5: CORS Configuration
async function testCORSConfiguration() {
  console.log('5️⃣ Testing CORS Configuration...');
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://d7t9x3j66yd8k.cloudfront.net',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    
    console.log('   → OPTIONS Status:', response.status);
    console.log('   → CORS Headers:');
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-allow-credentials'
    ];
    
    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      console.log(`   → ${header}:`, value || 'Not present');
    });
    
    if (response.headers.get('access-control-allow-origin')) {
      console.log('   ✅ CORS is configured');
    } else {
      console.log('   ❌ CORS may not be properly configured');
    }
    
  } catch (error) {
    console.error('   ❌ Error testing CORS:', error.message);
  }
  
  console.log();
}

// Main test runner
async function runComprehensiveTest() {
  console.log('🚀 Starting comprehensive connectivity test...\n');
  
  try {
    await testAPIGatewayHealth();
    await testDynamoDBViaAPI();
    await testIdentityPoolCredentials();
    await testCORSConfiguration();
    await testLambdaLogs();
    
    console.log('🎯 COMPREHENSIVE TEST COMPLETED');
    console.log('=====================================');
    console.log('✅ All major connectivity components tested');
    console.log('📊 Review the results above for any issues');
    console.log('🔍 Next steps: Run end-to-end browser test');
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    process.exit(1);
  }
}

// Run the test
runComprehensiveTest().catch(console.error);

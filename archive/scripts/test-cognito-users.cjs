#!/usr/bin/env node

// Test user authentication with the correct Cognito setup

const AWS = require('aws-sdk');

// Your current configuration
const COGNITO_REGION = 'us-east-2';
const COGNITO_USER_POOL_ID = 'us-east-2_FyHLtOhiY';
const COGNITO_CLIENT_ID = 'dshos5iou44tuach7ta3ici5m';

console.log('🔐 COGNITO USER AUTHENTICATION TEST');
console.log('===================================\n');

console.log('📋 Configuration:');
console.log(`   Region: ${COGNITO_REGION}`);
console.log(`   User Pool ID: ${COGNITO_USER_POOL_ID}`);
console.log(`   Client ID: ${COGNITO_CLIENT_ID}`);
console.log(`   App Name: Ikusi-acta-ui-web`);

// Set up AWS Cognito
AWS.config.update({ region: COGNITO_REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();

async function testCognitoUserPool() {
  console.log('\n🏊 Testing User Pool Status...');
  
  try {
    // Test user pool exists and is accessible
    const userPoolInfo = await cognito.describeUserPool({
      UserPoolId: COGNITO_USER_POOL_ID
    }).promise();
    
    console.log('✅ User Pool Status:', userPoolInfo.UserPool.Status);
    console.log('✅ User Pool Name:', userPoolInfo.UserPool.Name);
    console.log('✅ Creation Date:', userPoolInfo.UserPool.CreationDate);
    
    // Test client app exists
    const clientInfo = await cognito.describeUserPoolClient({
      UserPoolId: COGNITO_USER_POOL_ID,
      ClientId: COGNITO_CLIENT_ID
    }).promise();
    
    console.log('✅ Client Name:', clientInfo.UserPoolClient.ClientName);
    console.log('✅ Auth Flows:', clientInfo.UserPoolClient.ExplicitAuthFlows);
    
    // List users (first 10)
    console.log('\n👥 Checking User Pool Users...');
    const users = await cognito.listUsers({
      UserPoolId: COGNITO_USER_POOL_ID,
      Limit: 10
    }).promise();
    
    console.log(`✅ Total Users Found: ${users.Users.length}`);
    if (users.Users.length > 0) {
      console.log('\n📋 User List:');
      users.Users.forEach((user, i) => {
        const email = user.Attributes.find(attr => attr.Name === 'email')?.Value || 'No email';
        console.log(`   ${i + 1}. ${user.Username} (${email}) - Status: ${user.UserStatus}`);
      });
    } else {
      console.log('⚠️  No users found in the User Pool!');
      console.log('💡 You may need to create a user first.');
    }
    
  } catch (error) {
    console.log('❌ Error testing User Pool:', error.message);
    return false;
  }
  
  return true;
}

async function main() {
  try {
    const success = await testCognitoUserPool();
    
    if (success) {
      console.log('\n✅ RESULT: Cognito configuration is correct!');
      console.log('\n💡 Next Steps:');
      console.log('   1. If no users exist, create a test user');
      console.log('   2. Make sure the user status is CONFIRMED');
      console.log('   3. Try logging in with the correct password');
      console.log('   4. Check password requirements (uppercase, lowercase, numbers, symbols)');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

main();

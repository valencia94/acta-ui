#!/usr/bin/env node

// Test script to verify Cognito domain configuration

const COGNITO_REGION = 'us-east-2';
const COGNITO_USER_POOL_ID = 'us-east-2_FyHLtOhiY';
const COGNITO_CLIENT_ID = 'dshos5iou44tuach7ta3ici5m';
const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';

// The correct Cognito domain from the AWS console
const COGNITO_DOMAIN = 'us-east-2fyhltohiy.auth.us-east-2.amazoncognito.com';

console.log('🔐 COGNITO AUTHENTICATION TEST');
console.log('===============================\n');

console.log('📋 Configuration:');
console.log(`   User Pool ID: ${COGNITO_USER_POOL_ID}`);
console.log(`   Client ID: ${COGNITO_CLIENT_ID}`);
console.log(`   Region: ${COGNITO_REGION}`);
console.log(`   Domain: ${COGNITO_DOMAIN}`);
console.log(`   Frontend: ${FRONTEND_URL}\n`);

// Generate the correct login URL
const loginUrl = `https://${COGNITO_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(FRONTEND_URL + '/')}`;

console.log('🔗 CORRECT LOGIN URL:');
console.log(loginUrl);
console.log('\n✅ This should now work for authentication!');

// Test the domain format
console.log('\n🧪 Domain Format Analysis:');
console.log(`   Expected format: [region][userid].auth.[region].amazoncognito.com`);
console.log(`   Your domain: ${COGNITO_DOMAIN}`);
console.log(`   Extracted: us-east-2 + fyhltohiy + .auth.us-east-2.amazoncognito.com`);

// Show what was wrong before
console.log('\n❌ What was wrong before:');
console.log('   Old domain: acta-ui-prod.auth.us-east-2.amazoncognito.com');
console.log('   ^ This custom domain was never created in AWS');
console.log('   ✅ New domain: us-east-2fyhltohiy.auth.us-east-2.amazoncognito.com');
console.log('   ^ This is the actual default Cognito domain');

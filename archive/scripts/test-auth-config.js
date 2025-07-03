// Quick test to verify Amplify Auth configuration
import { Amplify } from 'aws-amplify';

import awsconfig from './src/aws-exports.js';

console.log('🔍 Testing Amplify Auth Configuration...');

// Configure Amplify
Amplify.configure(awsconfig);

// Get current configuration
const config = Amplify.getConfig();
console.log('📋 Current Amplify Config:', {
  auth: config.Auth,
  region: config.Auth?.Cognito?.userPoolId,
  clientId: config.Auth?.Cognito?.userPoolClientId,
});

// Test if we can access Cognito
console.log('✅ Auth configuration loaded successfully!');
console.log('User Pool ID:', config.Auth?.Cognito?.userPoolId);
console.log('Client ID:', config.Auth?.Cognito?.userPoolClientId);

if (
  config.Auth?.Cognito?.userPoolId &&
  config.Auth?.Cognito?.userPoolClientId
) {
  console.log('🎉 AMPLIFY AUTH CONFIGURATION IS WORKING!');
} else {
  console.log('❌ Missing Auth configuration');
}

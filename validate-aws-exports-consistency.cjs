#!/usr/bin/env node
// AWS Exports vs Environment Variables Validation
// This script validates that aws-exports.js matches .env.production

const fs = require('fs');
const path = require('path');

console.log('🔍 AWS EXPORTS vs ENVIRONMENT VALIDATION');
console.log('=========================================');

// Load .env.production file
const envPath = path.join(__dirname, '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '');
    envVars[key.trim()] = value.trim();
  }
});

// Load aws-exports.js
const awsExportsPath = path.join(__dirname, 'src', 'aws-exports.js');
const awsExportsContent = fs.readFileSync(awsExportsPath, 'utf8');

console.log('\n📋 CHECKING CONSISTENCY:');
console.log('========================');

// Extract values from aws-exports.js using regex
const checks = [
  {
    name: 'API Base URL',
    envVar: 'VITE_API_BASE_URL',
    awsExportsPattern: /endpoint:\s*"([^"]+)"/,
    expected: envVars.VITE_API_BASE_URL
  },
  {
    name: 'Cognito Region', 
    envVar: 'VITE_COGNITO_REGION',
    awsExportsPattern: /aws_cognito_region:\s*"([^"]+)"/,
    expected: envVars.VITE_COGNITO_REGION
  },
  {
    name: 'User Pool ID',
    envVar: 'VITE_COGNITO_POOL_ID', 
    awsExportsPattern: /aws_user_pools_id:\s*"([^"]+)"/,
    expected: envVars.VITE_COGNITO_POOL_ID
  },
  {
    name: 'Web Client ID',
    envVar: 'VITE_COGNITO_WEB_CLIENT_ID',
    awsExportsPattern: /aws_user_pools_web_client_id:\s*"([^"]+)"/,
    expected: envVars.VITE_COGNITO_WEB_CLIENT_ID
  },
  {
    name: 'S3 Bucket',
    envVar: 'VITE_S3_BUCKET',
    awsExportsPattern: /aws_user_files_s3_bucket:\s*"([^"]+)"/,
    expected: envVars.VITE_S3_BUCKET
  },
  {
    name: 'CloudFront Domain',
    envVar: 'VITE_CLOUDFRONT_URL',
    awsExportsPattern: /redirectSignIn:\s*"([^"]+)"/,
    expected: envVars.VITE_CLOUDFRONT_URL
  }
];

let allMatch = true;

checks.forEach(check => {
  const match = awsExportsContent.match(check.awsExportsPattern);
  const awsValue = match ? match[1] : 'NOT FOUND';
  
  // Special handling for CloudFront URL comparison
  if (check.name === 'CloudFront Domain') {
    const matches = awsValue.startsWith(check.expected) || check.expected.includes(awsValue.replace('https://', '').replace('/', ''));
    if (matches) {
      console.log(`✅ ${check.name}: Match`);
      console.log(`   ENV: ${check.expected}`);
      console.log(`   AWS: ${awsValue}`);
    } else {
      console.log(`❌ ${check.name}: Mismatch`);
      console.log(`   ENV: ${check.expected}`);
      console.log(`   AWS: ${awsValue}`);
      allMatch = false;
    }
  } else {
    if (awsValue === check.expected) {
      console.log(`✅ ${check.name}: Match`);
      console.log(`   Value: ${awsValue}`);
    } else {
      console.log(`❌ ${check.name}: Mismatch`);
      console.log(`   ENV: ${check.expected}`);
      console.log(`   AWS: ${awsValue}`);
      allMatch = false;
    }
  }
  console.log('');
});

console.log('🎯 VALIDATION RESULT:');
console.log('====================');
if (allMatch) {
  console.log('✅ ALL CONFIGURATIONS MATCH - Ready for production!');
  process.exit(0);
} else {
  console.log('❌ CONFIGURATION MISMATCH - Review required!');
  process.exit(1);
}

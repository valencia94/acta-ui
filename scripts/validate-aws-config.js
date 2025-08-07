#!/usr/bin/env node

// AWS Configuration Validator for ACTA-UI (ES Module version)
// Run with: node scripts/validate-aws-config.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 AWS Configuration Validator');
console.log('==============================\n');

// Check if aws-exports.js exists
const configPath = path.join(__dirname, '..', 'src', 'aws-exports.js');

if (!fs.existsSync(configPath)) {
  console.error('❌ aws-exports.js not found at:', configPath);
  process.exit(1);
}

console.log('✅ Found aws-exports.js at:', configPath);

// Read and validate the configuration
const configContent = fs.readFileSync(configPath, 'utf8');

// Extract configuration values using regex
const checks = [
  {
    name: 'AWS Region',
    pattern: /aws_project_region:\s*"([^"]+)"/,
    expected: 'us-east-2'
  },
  {
    name: 'User Pool ID',
    pattern: /aws_user_pools_id:\s*"([^"]+)"/,
    expected: 'us-east-2_FyHLtOhiY'
  },
  {
    name: 'Identity Pool ID',
    pattern: /aws_cognito_identity_pool_id:\s*"([^"]+)"/,
    expected: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35'
  },
  {
    name: 'API Endpoint',
    pattern: /endpoint:\s*"([^"]+)"/,
    expected: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod'
  },
  {
    name: 'S3 Bucket',
    pattern: /aws_user_files_s3_bucket:\s*"([^"]+)"/,
    expected: 'projectplace-dv-2025-x9a7b'
  }
];

console.log('📋 Configuration Validation Results:');
console.log('===================================');

let allValid = true;

checks.forEach(check => {
  const match = configContent.match(check.pattern);
  if (match && match[1]) {
    const value = match[1];
    const isValid = value === check.expected;
    console.log(`${isValid ? '✅' : '❌'} ${check.name}: ${value}`);
    if (!isValid) {
      console.log(`   Expected: ${check.expected}`);
      allValid = false;
    }
  } else {
    console.log(`❌ ${check.name}: NOT FOUND`);
    allValid = false;
  }
});

// Check for multiple aws-exports files
console.log('\n🔍 Checking for duplicate aws-exports files...');
const locations = [
  'src/aws-exports.js',
  'public/aws-exports.js',
  'aws-exports.js',
  'src/aws-exports-clean.js',
  'src/aws-exports-working.js'
];

locations.forEach(loc => {
  const fullPath = path.join(__dirname, '..', loc);
  if (fs.existsSync(fullPath)) {
    console.log(`📄 Found: ${loc}`);
  }
});

console.log('\n📊 VALIDATION SUMMARY');
console.log('====================');
if (allValid) {
  console.log('✅ All configuration values are correct!');
} else {
  console.log('❌ Some configuration values need attention.');
}

// Additional checks
console.log('\n🔧 Additional Checks:');
console.log('===================');

// Check if using direct AWS SDK
if (configContent.includes('DynamoDBClient')) {
  console.log('✅ Direct AWS SDK references found');
} else {
  console.log('⚠️  No direct AWS SDK references found - may be using API Gateway only');
}

// Check for environment variables
console.log('\n📝 Environment Variables to Set:');
console.log('================================');
console.log('VITE_AWS_REGION=us-east-2');
console.log('VITE_DYNAMODB_TABLE=ProjectPlace_DataExtrator_landing_table_v2');
console.log('VITE_S3_BUCKET=projectplace-dv-2025-x9a7b');

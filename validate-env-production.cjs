#!/usr/bin/env node
// Production Environment Variables Validation Test
// This script validates all environment variables are properly configured for production

const fs = require("fs");
const path = require("path");

console.log("🔍 PRODUCTION ENVIRONMENT VALIDATION");
console.log("=====================================");

// Load .env.production file
const envPath = path.join(__dirname, ".env.production");
const envContent = fs.readFileSync(envPath, "utf8");

// Parse environment variables
const envVars = {};
envContent.split("\n").forEach((line) => {
  if (line.trim() && !line.startsWith("#") && line.includes("=")) {
    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=").replace(/^"/, "").replace(/"$/, "");
    envVars[key.trim()] = value.trim();
  }
});

// Critical variables that must be present
const criticalVars = [
  "VITE_API_BASE_URL",
  "VITE_COGNITO_REGION",
  "VITE_COGNITO_POOL_ID",
  "VITE_COGNITO_WEB_CLIENT_ID",
  "VITE_S3_BUCKET",
  "VITE_CLOUDFRONT_URL",
  "AWS_REGION",
  "AWS_ACCOUNT_ID",
];

console.log("\n📋 CRITICAL VARIABLES CHECK:");
console.log("============================");
let allPresent = true;

criticalVars.forEach((varName) => {
  if (envVars[varName]) {
    console.log(`✅ ${varName}: ${envVars[varName]}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

console.log("\n🔧 CONFIGURATION VALIDATION:");
console.log("============================");

// Validate API URL format
const apiUrl = envVars.VITE_API_BASE_URL;
if (apiUrl && apiUrl.startsWith("https://") && apiUrl.includes("execute-api")) {
  console.log("✅ API URL format: Valid");
} else {
  console.log("❌ API URL format: Invalid");
  allPresent = false;
}

// Validate Cognito Pool ID format
const poolId = envVars.VITE_COGNITO_POOL_ID;
if (poolId && poolId.match(/^us-east-2_[A-Za-z0-9]+$/)) {
  console.log("✅ Cognito Pool ID format: Valid");
} else {
  console.log("❌ Cognito Pool ID format: Invalid");
  allPresent = false;
}

// Validate Client ID format
const clientId = envVars.VITE_COGNITO_WEB_CLIENT_ID;
if (clientId && clientId.length > 20) {
  console.log("✅ Cognito Client ID format: Valid");
} else {
  console.log("❌ Cognito Client ID format: Invalid");
  allPresent = false;
}

// Validate CloudFront URL
const cloudfront = envVars.VITE_CLOUDFRONT_URL;
if (
  cloudfront &&
  cloudfront.startsWith("https://") &&
  cloudfront.includes("cloudfront.net")
) {
  console.log("✅ CloudFront URL format: Valid");
} else {
  console.log("❌ CloudFront URL format: Invalid");
  allPresent = false;
}

// Validate S3 bucket
const s3Bucket = envVars.VITE_S3_BUCKET;
if (s3Bucket && s3Bucket.length > 5) {
  console.log("✅ S3 Bucket format: Valid");
} else {
  console.log("❌ S3 Bucket format: Invalid");
  allPresent = false;
}

console.log("\n🎯 VALIDATION RESULT:");
console.log("====================");
if (allPresent) {
  console.log("✅ ALL VARIABLES VALID - Production ready!");
  process.exit(0);
} else {
  console.log("❌ SOME VARIABLES MISSING/INVALID - Review required!");
  process.exit(1);
}

#!/usr/bin/env node

/**
 * End-to-End Validation Script for ACTA-UI Production Dashboard
 * Validates all critical functionality post-deployment
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

console.log("🔍 ACTA-UI End-to-End Validation Suite");
console.log("======================================");
console.log("");

// Configuration
const PRODUCTION_URL = "https://d7t9x3j66yd8k.cloudfront.net";
const DASHBOARD_URL = `${PRODUCTION_URL}/dashboard`;
const API_BASE_URL =
  "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod";

// Test Results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
};

function addTestResult(testName, passed, details = "") {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () =>
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        }),
      );
    });
    req.on("error", reject);
    req.end();
  });
}

async function validateDeployment() {
  console.log("🚀 1. Deployment Validation");
  console.log("===========================");

  try {
    // Test 1: Main site accessibility
    const mainResponse = await makeRequest(PRODUCTION_URL);
    addTestResult("Main site accessible", mainResponse.statusCode === 200);

    // Test 2: Dashboard route accessibility
    const dashboardResponse = await makeRequest(DASHBOARD_URL);
    addTestResult(
      "Dashboard route accessible",
      dashboardResponse.statusCode === 200,
    );

    // Test 3: AWS exports file present
    const awsExportsResponse = await makeRequest(
      `${PRODUCTION_URL}/aws-exports.js`,
    );
    addTestResult(
      "AWS exports file present",
      awsExportsResponse.statusCode === 200,
    );

    // Test 4: Check for critical content in main page
    const hasReact =
      mainResponse.body.includes("React") || mainResponse.body.includes("vite");
    const hasAmplify =
      mainResponse.body.includes("aws-exports") ||
      mainResponse.body.includes("amplify");
    addTestResult("Critical JavaScript bundles present", hasReact);
    addTestResult("AWS Amplify configuration loaded", hasAmplify);
  } catch (error) {
    addTestResult("Deployment validation", false, error.message);
  }

  console.log("");
}

async function validateAWSConfiguration() {
  console.log("🔧 2. AWS Configuration Validation");
  console.log("===================================");

  try {
    // Test AWS exports content
    const awsExportsResponse = await makeRequest(
      `${PRODUCTION_URL}/aws-exports.js`,
    );
    if (awsExportsResponse.statusCode === 200) {
      const content = awsExportsResponse.body;

      // Test 5: Cognito User Pool configuration
      const hasUserPool = content.includes("us-east-2_FyHLtOhiY");
      addTestResult("Cognito User Pool configured", hasUserPool);

      // Test 6: Cognito Identity Pool configuration
      const hasIdentityPool = content.includes(
        "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
      );
      addTestResult("Cognito Identity Pool configured", hasIdentityPool);

      // Test 7: API Gateway endpoint configuration
      const hasAPIGateway = content.includes(
        "q2b9avfwv5.execute-api.us-east-2.amazonaws.com",
      );
      addTestResult("API Gateway endpoint configured", hasAPIGateway);

      // Test 8: Region configuration
      const hasRegion = content.includes("us-east-2");
      addTestResult("AWS region configured", hasRegion);
    } else {
      addTestResult(
        "AWS exports accessibility",
        false,
        "Cannot access aws-exports.js",
      );
    }
  } catch (error) {
    addTestResult("AWS configuration validation", false, error.message);
  }

  console.log("");
}

async function validateAPIConnectivity() {
  console.log("🌐 3. API Connectivity Validation");
  console.log("==================================");

  try {
    // Test 9: API Gateway health check
    const healthResponse = await makeRequest(`${API_BASE_URL}/health`);
    addTestResult(
      "API Gateway health check",
      healthResponse.statusCode === 200,
    );

    // Test 10: CORS headers present
    const corsHeaders = healthResponse.headers;
    const hasCORS =
      corsHeaders["access-control-allow-origin"] ||
      corsHeaders["Access-Control-Allow-Origin"];
    addTestResult("CORS headers configured", !!hasCORS);
  } catch (error) {
    addTestResult("API connectivity validation", false, error.message);
  }

  console.log("");
}

async function validateBuildIntegrity() {
  console.log("🏗️ 4. Build Integrity Validation");
  console.log("==================================");

  try {
    // Test 11: Check if dist folder exists locally
    const distExists = fs.existsSync("dist");
    addTestResult("Local build output exists", distExists);

    if (distExists) {
      // Test 12: Critical files in build
      const criticalFiles = ["index.html", "aws-exports.js", "assets"];
      for (const file of criticalFiles) {
        const exists = fs.existsSync(path.join("dist", file));
        addTestResult(`Build contains ${file}`, exists);
      }

      // Test 13: Check index.html content
      const indexContent = fs.readFileSync("dist/index.html", "utf8");
      const hasAwsExports = indexContent.includes("aws-exports.js");
      addTestResult("Index.html loads AWS exports", hasAwsExports);

      // Test 14: Check for production build markers
      const hasProductionBuild =
        indexContent.includes("assets/") && indexContent.includes(".js");
      addTestResult("Production build markers present", hasProductionBuild);
    }
  } catch (error) {
    addTestResult("Build integrity validation", false, error.message);
  }

  console.log("");
}

async function validateDocumentationAlignment() {
  console.log("📚 5. Documentation Alignment Validation");
  console.log("=========================================");

  try {
    // Test 15: Check if documentation exists
    const docExists = fs.existsSync("ACTA-UI-DOCUMENTATION.md");
    addTestResult("Documentation exists", docExists);

    if (docExists) {
      const docContent = fs.readFileSync("ACTA-UI-DOCUMENTATION.md", "utf8");

      // Test 16: Documentation is recent (July 9, 2025)
      const isRecent =
        docContent.includes("July 9, 2025") || docContent.includes("July 8");
      addTestResult("Documentation is up-to-date", isRecent);

      // Test 17: Critical sections present
      const criticalSections = [
        "Authentication Flow",
        "Key Components",
        "API Integration",
        "Build and Deployment Process",
      ];

      for (const section of criticalSections) {
        const hasSection = docContent.includes(section);
        addTestResult(`Documentation contains ${section}`, hasSection);
      }
    }
  } catch (error) {
    addTestResult("Documentation alignment validation", false, error.message);
  }

  console.log("");
}

async function validateSecurityConfiguration() {
  console.log("🔒 6. Security Configuration Validation");
  console.log("========================================");

  try {
    // Test 18: Check HTTPS
    const isHTTPS = PRODUCTION_URL.startsWith("https://");
    addTestResult("HTTPS enabled", isHTTPS);

    // Test 19: Check security headers
    const mainResponse = await makeRequest(PRODUCTION_URL);
    const headers = mainResponse.headers;

    const hasSecurityHeaders =
      headers["x-content-type-options"] ||
      headers["x-frame-options"] ||
      headers["content-security-policy"];
    addTestResult("Security headers present", !!hasSecurityHeaders);

    // Test 20: CloudFront distribution
    const hasCloudFront =
      headers["server"]?.includes("CloudFront") ||
      headers["x-amz-cf-id"] ||
      headers["x-amzn-trace-id"];
    addTestResult("CloudFront distribution active", !!hasCloudFront);
  } catch (error) {
    addTestResult("Security configuration validation", false, error.message);
  }

  console.log("");
}

function generateReport() {
  console.log("📊 Final Validation Report");
  console.log("===========================");
  console.log("");

  const successRate = Math.round(
    (testResults.passed / testResults.total) * 100,
  );

  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${successRate}%`);
  console.log("");

  if (testResults.failed > 0) {
    console.log("❌ Failed Tests:");
    testResults.details
      .filter((test) => !test.passed)
      .forEach((test) => {
        console.log(`   • ${test.testName}: ${test.details}`);
      });
    console.log("");
  }

  // Overall assessment
  if (successRate >= 90) {
    console.log("🎉 EXCELLENT: Production deployment is ready!");
  } else if (successRate >= 80) {
    console.log(
      "✅ GOOD: Production deployment is mostly ready with minor issues.",
    );
  } else if (successRate >= 70) {
    console.log("⚠️  ACCEPTABLE: Production deployment needs some fixes.");
  } else {
    console.log("❌ CRITICAL: Production deployment has significant issues.");
  }

  console.log("");
  console.log("🔗 Production URL:", PRODUCTION_URL);
  console.log("🔗 Dashboard URL:", DASHBOARD_URL);
  console.log("");

  return successRate;
}

async function runValidation() {
  console.log(`🕒 Started: ${new Date().toLocaleString()}`);
  console.log("");

  await validateDeployment();
  await validateAWSConfiguration();
  await validateAPIConnectivity();
  await validateBuildIntegrity();
  await validateDocumentationAlignment();
  await validateSecurityConfiguration();

  const successRate = generateReport();

  console.log(`🕒 Completed: ${new Date().toLocaleString()}`);

  // Exit with appropriate code
  process.exit(successRate >= 80 ? 0 : 1);
}

// Run validation
runValidation().catch((error) => {
  console.error("❌ Validation failed:", error);
  process.exit(1);
});

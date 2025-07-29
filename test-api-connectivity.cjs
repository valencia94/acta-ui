#!/usr/bin/env node

/**
 * Comprehensive API Connectivity Test
 * Tests all API endpoints and authentication flows
 */

const https = require("https");
const fs = require("fs");

console.log("🔌 ACTA-UI API Connectivity Test");
console.log("=================================");
console.log("");

// API Configuration
const API_BASE_URL =
  "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod";
const COGNITO_REGION = "us-east-2";
const USER_POOL_ID = "us-east-2_FyHLtOhiY";

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
          url: url,
        }),
      );
    });
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testBasicConnectivity() {
  console.log("🌐 1. Basic API Connectivity");
  console.log("============================");

  try {
    // Test 1: Health endpoint
    const healthResponse = await makeRequest(`${API_BASE_URL}/health`);
    addTestResult(
      "Health endpoint accessible",
      healthResponse.statusCode === 200,
      healthResponse.statusCode !== 200
        ? `Status: ${healthResponse.statusCode}`
        : "",
    );

    if (healthResponse.statusCode === 200) {
      try {
        const healthData = JSON.parse(healthResponse.body);
        console.log("  📊 Health response:", healthData);
      } catch (e) {
        console.log("  📊 Health response (raw):", healthResponse.body);
      }
    }

    // Test 2: CORS headers
    const corsHeaders = healthResponse.headers;
    const hasCORS =
      corsHeaders["access-control-allow-origin"] ||
      corsHeaders["Access-Control-Allow-Origin"];
    addTestResult("CORS headers present", !!hasCORS);

    if (hasCORS) {
      console.log(`  🔗 CORS Origin: ${hasCORS}`);
    }

    // Test 3: Check if API Gateway is responding
    const isAPIGateway =
      healthResponse.headers["x-amzn-requestid"] ||
      healthResponse.headers["x-amz-apigw-id"];
    addTestResult("API Gateway responding", !!isAPIGateway);
  } catch (error) {
    addTestResult("Basic connectivity test", false, error.message);
  }

  console.log("");
}

async function testProjectEndpoints() {
  console.log("📋 2. Project Endpoints");
  console.log("========================");

  const endpoints = [
    "/pm-manager/all-projects",
    "/projects",
    "/pm-projects/admin@ikusi.com",
    "/pm-projects/christian.valencia@ikusi.com",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${API_BASE_URL}${endpoint}`);
      const success =
        response.statusCode === 200 || response.statusCode === 401; // 401 is expected without auth
      addTestResult(
        `Endpoint ${endpoint}`,
        success,
        !success
          ? `Status: ${response.statusCode}`
          : `Status: ${response.statusCode}`,
      );

      if (response.statusCode === 401) {
        console.log(`  🔐 Authentication required (expected)`);
      } else if (response.statusCode === 200) {
        console.log(`  ✅ Endpoint accessible`);
      } else {
        console.log(`  ⚠️  Unexpected status: ${response.statusCode}`);
      }
    } catch (error) {
      addTestResult(`Endpoint ${endpoint}`, false, error.message);
    }
  }

  console.log("");
}

async function testAuthenticationFlow() {
  console.log("🔐 3. Authentication Flow Test");
  console.log("==============================");

  try {
    // Test Cognito endpoints
    const cognitoEndpoint = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

    const response = await makeRequest(cognitoEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.DescribeUserPool",
      },
      body: JSON.stringify({
        UserPoolId: USER_POOL_ID,
      }),
    });

    // Cognito will return 400 for unauthorized requests, which is expected
    const success = response.statusCode === 400 || response.statusCode === 403;
    addTestResult(
      "Cognito service accessible",
      success,
      !success
        ? `Status: ${response.statusCode}`
        : "Service responding (auth required)",
    );
  } catch (error) {
    addTestResult("Cognito authentication test", false, error.message);
  }

  console.log("");
}

async function testAPIGatewayCORS() {
  console.log("🔗 4. CORS Configuration Test");
  console.log("==============================");

  try {
    // Test OPTIONS request (CORS preflight)
    const optionsResponse = await makeRequest(`${API_BASE_URL}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://d7t9x3j66yd8k.cloudfront.net",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });

    addTestResult(
      "CORS preflight request",
      optionsResponse.statusCode === 200 || optionsResponse.statusCode === 204,
      optionsResponse.statusCode !== 200 && optionsResponse.statusCode !== 204
        ? `Status: ${optionsResponse.statusCode}`
        : "",
    );

    // Check CORS headers in response
    const corsHeaders = optionsResponse.headers;
    const requiredHeaders = [
      "access-control-allow-origin",
      "access-control-allow-methods",
      "access-control-allow-headers",
    ];

    for (const header of requiredHeaders) {
      const exists =
        corsHeaders[header] || corsHeaders[header.replace(/-/g, "_")];
      addTestResult(`CORS header: ${header}`, !!exists);
    }
  } catch (error) {
    addTestResult("CORS configuration test", false, error.message);
  }

  console.log("");
}

async function testSpecificAPIIssues() {
  console.log("🔍 5. Specific API Issues");
  console.log("=========================");

  try {
    // Test the exact endpoint that was failing
    console.log(
      "Testing the exact failing endpoint from the production test...",
    );

    const failingEndpoint = `${API_BASE_URL}/pm-manager/all-projects`;
    const response = await makeRequest(failingEndpoint, {
      method: "GET",
      headers: {
        Origin: "https://d7t9x3j66yd8k.cloudfront.net",
        Authorization: "Bearer test-token", // This will fail auth but test connectivity
      },
    });

    // Any response (even 401) means the endpoint is reachable
    const reachable = response.statusCode >= 200 && response.statusCode < 500;
    addTestResult(
      "Failing endpoint reachable",
      reachable,
      !reachable
        ? `Status: ${response.statusCode}`
        : `Status: ${response.statusCode} (reachable)`,
    );

    console.log(`  📊 Response status: ${response.statusCode}`);
    console.log(
      `  📊 Response headers:`,
      Object.keys(response.headers).slice(0, 5),
    );

    if (response.body) {
      try {
        const data = JSON.parse(response.body);
        console.log(`  📊 Response data type:`, typeof data);
      } catch (e) {
        console.log(`  📊 Response body length:`, response.body.length);
      }
    }

    // Test with different methods
    const methods = ["GET", "POST", "OPTIONS"];
    for (const method of methods) {
      try {
        const methodResponse = await makeRequest(failingEndpoint, {
          method: method,
          headers: {
            Origin: "https://d7t9x3j66yd8k.cloudfront.net",
          },
        });

        console.log(`  📊 ${method} method: ${methodResponse.statusCode}`);
      } catch (error) {
        console.log(`  ❌ ${method} method failed: ${error.message}`);
      }
    }
  } catch (error) {
    addTestResult("Specific API issues test", false, error.message);
  }

  console.log("");
}

async function checkNetworkPolicies() {
  console.log("🛡️ 6. Network Security Policies");
  console.log("=================================");

  try {
    // Test if there are any IP restrictions
    const response = await makeRequest(`${API_BASE_URL}/health`);

    // Check response headers for security policies
    const securityHeaders = [
      "x-amzn-requestid",
      "x-amz-apigw-id",
      "access-control-allow-origin",
      "content-security-policy",
      "x-content-type-options",
    ];

    for (const header of securityHeaders) {
      const exists = response.headers[header];
      if (exists) {
        console.log(`  📋 ${header}: ${exists}`);
      }
    }

    // Test rate limiting
    console.log("  🔄 Testing rate limits...");
    const rapidRequests = [];
    for (let i = 0; i < 5; i++) {
      rapidRequests.push(makeRequest(`${API_BASE_URL}/health`));
    }

    const rapidResults = await Promise.allSettled(rapidRequests);
    const successfulRequests = rapidResults.filter(
      (r) => r.status === "fulfilled" && r.value.statusCode === 200,
    ).length;

    addTestResult(
      "Rate limiting test",
      successfulRequests >= 3,
      `${successfulRequests}/5 requests succeeded`,
    );
  } catch (error) {
    addTestResult("Network security policies test", false, error.message);
  }

  console.log("");
}

function generateReport() {
  console.log("📊 API Connectivity Report");
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

  // Recommendations based on results
  console.log("💡 Recommendations:");
  console.log("===================");

  const apiGatewayAccessible = testResults.details.some(
    (t) => t.testName.includes("Health endpoint") && t.passed,
  );

  if (!apiGatewayAccessible) {
    console.log("🚨 CRITICAL: API Gateway not accessible");
    console.log("   - Check AWS API Gateway deployment status");
    console.log("   - Verify endpoint URL is correct");
    console.log("   - Check AWS account permissions");
  } else {
    console.log("✅ API Gateway is accessible");
  }

  const corsIssues = testResults.details.some(
    (t) => t.testName.includes("CORS") && !t.passed,
  );

  if (corsIssues) {
    console.log("⚠️  CORS configuration needs attention");
    console.log("   - Update API Gateway CORS settings");
    console.log(
      "   - Add https://d7t9x3j66yd8k.cloudfront.net to allowed origins",
    );
  }

  const authIssues = testResults.details.some(
    (t) => t.testName.includes("Authentication") && !t.passed,
  );

  if (authIssues) {
    console.log("🔐 Authentication flow needs debugging");
    console.log("   - Check Cognito User Pool configuration");
    console.log("   - Verify JWT token generation");
  }

  console.log("");
  console.log("🔗 API Base URL:", API_BASE_URL);
  console.log("🌐 Frontend URL: https://d7t9x3j66yd8k.cloudfront.net");
  console.log("");

  return successRate;
}

async function runAPITests() {
  console.log(`🕒 Started: ${new Date().toLocaleString()}`);
  console.log("");

  await testBasicConnectivity();
  await testProjectEndpoints();
  await testAuthenticationFlow();
  await testAPIGatewayCORS();
  await testSpecificAPIIssues();
  await checkNetworkPolicies();

  const successRate = generateReport();

  console.log(`🕒 Completed: ${new Date().toLocaleString()}`);

  // Exit with appropriate code
  process.exit(successRate >= 70 ? 0 : 1);
}

// Run tests
runAPITests().catch((error) => {
  console.error("❌ API tests failed:", error);
  process.exit(1);
});

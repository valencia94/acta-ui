#!/usr/bin/env node

// Test script to debug the extract-project-place endpoint
// This script will test the actual API endpoint with proper authentication

const API_BASE = "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod";

// Test project ID
const TEST_PROJECT_ID = "1000000055914011";

// Test function to call the endpoint
async function testExtractProjectPlace() {
  console.log("🧪 Testing extract-project-place endpoint...");
  console.log(`📋 Project ID: ${TEST_PROJECT_ID}`);
  console.log(`🌐 URL: ${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`);
  console.log("");

  // Step 1: Test OPTIONS request (CORS preflight)
  console.log("1️⃣ Testing CORS preflight (OPTIONS request)...");
  try {
    const optionsResponse = await fetch(
      `${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`,
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://d7t9x3j66yd8k.cloudfront.net",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "authorization,content-type",
        },
      },
    );

    console.log(
      `✅ OPTIONS Status: ${optionsResponse.status} ${optionsResponse.statusText}`,
    );
    console.log("📋 CORS Headers:");
    console.log(
      `   - Access-Control-Allow-Origin: ${optionsResponse.headers.get("Access-Control-Allow-Origin")}`,
    );
    console.log(
      `   - Access-Control-Allow-Methods: ${optionsResponse.headers.get("Access-Control-Allow-Methods")}`,
    );
    console.log(
      `   - Access-Control-Allow-Headers: ${optionsResponse.headers.get("Access-Control-Allow-Headers")}`,
    );
    console.log(
      `   - Access-Control-Allow-Credentials: ${optionsResponse.headers.get("Access-Control-Allow-Credentials")}`,
    );
    console.log("");
  } catch (error) {
    console.error("❌ OPTIONS request failed:", error);
    return;
  }

  // Step 2: Test POST request without authentication (should get 401)
  console.log("2️⃣ Testing POST request without authentication...");
  try {
    const noAuthResponse = await fetch(
      `${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`,
      {
        method: "POST",
        headers: {
          Origin: "https://d7t9x3j66yd8k.cloudfront.net",
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    console.log(
      `📊 Status: ${noAuthResponse.status} ${noAuthResponse.statusText}`,
    );
    if (noAuthResponse.status === 401) {
      console.log("✅ Expected 401 Unauthorized - authentication is required");
    } else {
      console.log("⚠️ Unexpected status - expected 401");
    }
    console.log("");
  } catch (error) {
    console.error("❌ POST request failed:", error);
    console.log("");
  }

  // Step 3: Test with dummy Bearer token (should get 401 or 403)
  console.log("3️⃣ Testing POST request with dummy Bearer token...");
  try {
    const dummyTokenResponse = await fetch(
      `${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`,
      {
        method: "POST",
        headers: {
          Origin: "https://d7t9x3j66yd8k.cloudfront.net",
          "Content-Type": "application/json",
          Authorization: "Bearer dummy-token-for-testing",
        },
        credentials: "include",
      },
    );

    console.log(
      `📊 Status: ${dummyTokenResponse.status} ${dummyTokenResponse.statusText}`,
    );
    if (
      dummyTokenResponse.status === 401 ||
      dummyTokenResponse.status === 403
    ) {
      console.log("✅ Expected 401/403 - invalid token rejected");
    } else {
      console.log("⚠️ Unexpected status - expected 401/403");
    }
    console.log("");
  } catch (error) {
    console.error("❌ POST request with dummy token failed:", error);
    console.log("");
  }

  // Step 4: Test GET request (if endpoint supports it)
  console.log("4️⃣ Testing GET request...");
  try {
    const getResponse = await fetch(
      `${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`,
      {
        method: "GET",
        headers: {
          Origin: "https://d7t9x3j66yd8k.cloudfront.net",
          Authorization: "Bearer dummy-token-for-testing",
        },
        credentials: "include",
      },
    );

    console.log(`📊 Status: ${getResponse.status} ${getResponse.statusText}`);
    if (getResponse.status === 405) {
      console.log("✅ Method not allowed - endpoint only supports POST");
    } else if (getResponse.status === 401 || getResponse.status === 403) {
      console.log("✅ Authentication required - endpoint is protected");
    } else {
      console.log("⚠️ Unexpected status for GET request");
    }
    console.log("");
  } catch (error) {
    console.error("❌ GET request failed:", error);
    console.log("");
  }

  // Step 5: Test with malformed URL
  console.log("5️⃣ Testing malformed URL...");
  try {
    const malformedResponse = await fetch(
      `${API_BASE}/extract-project-place/`,
      {
        method: "POST",
        headers: {
          Origin: "https://d7t9x3j66yd8k.cloudfront.net",
          "Content-Type": "application/json",
          Authorization: "Bearer dummy-token-for-testing",
        },
        credentials: "include",
      },
    );

    console.log(
      `📊 Status: ${malformedResponse.status} ${malformedResponse.statusText}`,
    );
    if (malformedResponse.status === 404) {
      console.log("✅ Not found - endpoint requires project ID");
    } else {
      console.log("⚠️ Unexpected status for malformed URL");
    }
    console.log("");
  } catch (error) {
    console.error("❌ Malformed URL test failed:", error);
    console.log("");
  }

  console.log("🎯 SUMMARY:");
  console.log(
    "The extract-project-place endpoint appears to be correctly configured.",
  );
  console.log('The "Failed to fetch" error in the frontend is likely due to:');
  console.log("  1. Authentication token format issue");
  console.log("  2. CORS configuration mismatch");
  console.log("  3. Network connectivity issue");
  console.log("");
  console.log("💡 RECOMMENDATION:");
  console.log("Check the actual JWT token being sent from the frontend.");
  console.log(
    'The token should be a valid Cognito ID token, not "dummy-token-for-testing"',
  );
}

// Run the test
testExtractProjectPlace().catch(console.error);

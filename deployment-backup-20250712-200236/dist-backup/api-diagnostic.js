// API Connectivity Diagnostic Tool for Production
// Run this in the browser console to diagnose API issues

console.log("🔍 Starting API Connectivity Diagnostic...");

// Check environment variables
console.log("📋 Environment Check:");
console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
console.log("Skip Auth:", import.meta.env.VITE_SKIP_AUTH);
console.log("Use Mock API:", import.meta.env.VITE_USE_MOCK_API);
console.log("Cognito Region:", import.meta.env.VITE_COGNITO_REGION);
console.log("Cognito Pool ID:", import.meta.env.VITE_COGNITO_POOL_ID);

// Test API connectivity
async function testAPIConnectivity() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  console.log("\n🌐 Testing API Connectivity...");

  // Test 1: Basic health check without auth
  console.log("Test 1: Health check (no auth)");
  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    console.log("Health check response:", response.status, response.statusText);
    const text = await response.text();
    console.log("Health check body:", text);
  } catch (error) {
    console.error("Health check failed:", error);
  }

  // Test 2: Try to get auth session
  console.log("\nTest 2: Authentication Session");
  try {
    const { fetchAuthSession } = await import("aws-amplify/auth");
    const session = await fetchAuthSession();
    console.log("Auth session exists:", !!session);
    console.log("Has tokens:", !!session.tokens);
    console.log("Has ID token:", !!session.tokens?.idToken);
    console.log("Has access token:", !!session.tokens?.accessToken);

    if (session.tokens?.idToken) {
      console.log(
        "ID Token (first 50 chars):",
        session.tokens.idToken.toString().substring(0, 50) + "...",
      );
    }
  } catch (error) {
    console.error("❌ Authentication session error:", error);
    console.log("💡 User may need to log in again");
  }

  // Test 3: Try authenticated API call
  console.log("\nTest 3: Authenticated API Call");
  try {
    const { fetchAuthSession } = await import("aws-amplify/auth");
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (token) {
      const response = await fetch(`${apiUrl}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      console.log(
        "Authenticated request response:",
        response.status,
        response.statusText,
      );
      const text = await response.text();
      console.log("Authenticated response body:", text);
    } else {
      console.log("❌ No auth token available");
    }
  } catch (error) {
    console.error("❌ Authenticated request failed:", error);
  }
}

// Test 4: Check CORS headers
async function testCORS() {
  console.log("\n🔒 Testing CORS Configuration...");
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: "OPTIONS",
    });
    console.log("CORS preflight status:", response.status);
    console.log("CORS headers:");
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes("access-control")) {
        console.log(`  ${key}: ${value}`);
      }
    }
  } catch (error) {
    console.error("CORS test failed:", error);
  }
}

// Run all tests
testAPIConnectivity();
testCORS();

console.log("\n🎯 Diagnostic Summary:");
console.log(
  "1. If health check returns 403: API requires authentication for all endpoints",
);
console.log("2. If no auth session: User needs to log in through Cognito");
console.log("3. If CORS errors: API Gateway CORS configuration issue");
console.log(
  "4. If auth session exists but still 403: Token format or validation issue",
);

// Make functions available globally for manual testing
window.testAPIConnectivity = testAPIConnectivity;
window.testCORS = testCORS;

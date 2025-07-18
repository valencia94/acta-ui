// check-token-auth.js
// Simple script to verify JWT token and API connectivity

// Import node-fetch for making HTTP requests
import fetch from "node-fetch";

// Test user credentials
const TEST_USER = {
  username: "christian.valencia@ikusi.com",
  password: "PdYb7TU7HvBhYP7$!",
};

// Function to get a token using test credentials
async function getToken() {
  try {
    console.log("🔐 Attempting to get token for", TEST_USER.username);

    // The Cognito endpoint for token generation
    const tokenUrl = "https://cognito-idp.us-east-2.amazonaws.com/";

    // First, get the AWS details
    console.log("📚 Using Cognito details:");
    console.log("  - User Pool ID: us-east-2_FyHLtOhiY");
    console.log("  - Client ID: dshos5iou44tuach7ta3ici5m");

    // Get session data from localStorage (if running in a browser)
    if (typeof localStorage !== "undefined") {
      const storedToken = localStorage.getItem("ikusi.jwt");
      if (storedToken) {
        console.log("✅ Found token in localStorage");
        return storedToken;
      }
    }

    console.log("❌ No token found in storage and not running in browser.");
    console.log(
      "❗ Please get a valid token from browser localStorage and run:",
    );
    console.log("node check-token-auth.js <token>");
    return null;
  } catch (error) {
    console.error("❌ Error getting token:", error.message);
    return null;
  }
}

// Function to check if a JWT token is valid
function checkToken(token) {
  if (!token) {
    console.log("❌ No token provided");
    return false;
  }

  try {
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      console.log("❌ Invalid token format - not a valid JWT");
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(tokenParts[1], "base64").toString("utf-8"),
    );

    console.log("✅ Token payload:", {
      sub: payload.sub,
      email: payload.email || payload["cognito:username"],
      exp: new Date(payload.exp * 1000).toISOString(),
    });

    const now = Date.now();
    const exp = payload.exp * 1000;

    if (now > exp) {
      console.log("❌ Token expired on", new Date(exp).toISOString());
      return false;
    }

    console.log("✅ Token valid until", new Date(exp).toISOString());
    return true;
  } catch (error) {
    console.error("❌ Error parsing token:", error.message);
    return false;
  }
}

// Function to test API connectivity with token
async function testApiConnectivity(token) {
  const apiUrl =
    "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health";

  try {
    console.log("🌐 Testing API connectivity (health)...");
    const response = await fetch(apiUrl);
    console.log("✅ Health API response:", response.status);

    // Now test a protected endpoint
    const protectedUrl =
      "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/extract-project-place/1000000049842296";

    // Test with just the token (no Bearer prefix)
    console.log("🌐 Testing protected API with direct token...");
    const directResponse = await fetch(protectedUrl, {
      headers: {
        Authorization: token,
      },
    });

    console.log("📥 Direct token response:", directResponse.status);

    // Test with Bearer prefix
    console.log("🌐 Testing protected API with Bearer prefix...");
    const bearerResponse = await fetch(protectedUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📥 Bearer prefix response:", bearerResponse.status);

    // Use the better response
    const protectedResponse =
      directResponse.status < 400 ? directResponse : bearerResponse;

    if (protectedResponse.status === 401 || protectedResponse.status === 403) {
      console.log("❌ Authentication failed - token not accepted");
      return false;
    }

    const responseBody = await protectedResponse.text();
    console.log("📦 Response body:", responseBody.substring(0, 200) + "...");
    return true;
  } catch (error) {
    console.error("❌ API test error:", error.message);
    return false;
  }
}

// Function to run the tests
async function runTests() {
  if (process.argv.length < 3) {
    console.log("Usage: node check-token-auth.js <token>");
    return;
  }

  const token = process.argv[2];
  console.log("🔍 Testing token...");

  const isValid = checkToken(token);
  if (!isValid) {
    console.log("❌ Token validation failed");
    return;
  }

  await testApiConnectivity(token);
}

// Run the tests
runTests();

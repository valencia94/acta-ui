// debug-auth-token.js
// Simple script to test token retrieval in the browser console

console.log("🔍 Testing authentication token retrieval...");

// Test 1: Check if the user is authenticated
try {
  const session = await window.fetchAuthSession();
  console.log("📋 Current session:", {
    hasTokens: !!session.tokens,
    hasIdToken: !!session.tokens?.idToken,
    hasAccessToken: !!session.tokens?.accessToken,
  });

  if (session.tokens?.idToken) {
    const token = session.tokens.idToken.toString();
    console.log("✅ Token retrieved successfully");
    console.log("🔍 Token prefix:", token.substring(0, 50) + "...");

    // Test 2: Try a simple API call with this token
    console.log("🧪 Testing API call with token...");
    const response = await fetch(
      "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("📊 API response status:", response.status);
    const data = await response.json();
    console.log("📄 API response data:", data);
  } else {
    console.log("❌ No token found in session");
  }
} catch (error) {
  console.error("❌ Error getting session:", error);
}

// Test 3: Check localStorage for any stored tokens
const localToken = localStorage.getItem("ikusi.jwt");
if (localToken) {
  console.log("✅ Token found in localStorage");
  console.log("🔍 Local token prefix:", localToken.substring(0, 50) + "...");
} else {
  console.log("❌ No token in localStorage");
}

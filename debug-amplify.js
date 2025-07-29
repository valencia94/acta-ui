// Debug script to test Amplify configuration
// Run this in browser console to debug the Auth UserPool not configured error

import { Amplify } from "aws-amplify";
import { getCurrentUser } from "aws-amplify/auth";

console.log("🔧 Starting Amplify configuration debug...");

// Test the current window.awsmobile configuration
if (window.awsmobile) {
  console.log("✅ window.awsmobile found:", window.awsmobile);

  try {
    // Try to configure Amplify
    Amplify.configure(window.awsmobile);
    console.log("✅ Amplify.configure() completed without error");

    // Test if Auth is working
    try {
      const user = await getCurrentUser();
      console.log("✅ getCurrentUser() works:", user);
    } catch (authError) {
      console.error("❌ getCurrentUser() failed:", authError);
      console.error("Error name:", authError.name);
      console.error("Error message:", authError.message);
    }
  } catch (configError) {
    console.error("❌ Amplify.configure() failed:", configError);
  }
} else {
  console.error("❌ window.awsmobile not found");
}

// Check what Amplify thinks the current configuration is
console.log("🔍 Current Amplify config:");
try {
  const config = Amplify.getConfig();
  console.log("Auth config:", config.Auth);
  console.log("API config:", config.API);
} catch (err) {
  console.error("❌ Failed to get Amplify config:", err);
}

// test-auth-production.js
// Test authentication in the current production deployment

import {test } from "@playwright/test";

test("Test current authentication flow in production", async ({ page }) => {
  console.log("🔍 Testing current production authentication...");

  // Navigate to production
  await page.goto("https://d7t9x3j66yd8k.cloudfront.net");

  // Wait for page to load
  await page.waitForLoadState("networkidle");

  // Check what page we're on
  const title = await page.title();
  console.log("📄 Page title:", title);

  // Check if we're on login page or dashboard
  const url = page.url();
  console.log("🌐 Current URL:", url);

  // Check for AWS configuration in console
  const awsConfig = await page.evaluate(() => {
    return {
      hasAwsmobile: !!window.awsmobile,
      awsmobileKeys: window.awsmobile ? Object.keys(window.awsmobile) : [],
      userPoolId: window.awsmobile?.aws_user_pools_id,
      clientId: window.awsmobile?.aws_user_pools_web_client_id,
      region: window.awsmobile?.aws_project_region,
    };
  });

  console.log("⚙️ AWS Configuration:", JSON.stringify(awsConfig, null, 2));

  // Check for any console errors
  const logs = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      logs.push(`❌ ${msg.text()}`);
    }
  });

  // Try to find login form
  const hasLoginForm =
    (await page.$('input[type="email"], input[placeholder*="email" i]')) !==
    null;
  const hasPasswordInput = (await page.$('input[type="password"]')) !== null;

  console.log("🔐 Login form elements:");
  console.log("  - Email input:", hasLoginForm ? "✅ Found" : "❌ Not found");
  console.log(
    "  - Password input:",
    hasPasswordInput ? "✅ Found" : "❌ Not found",
  );

  if (hasLoginForm && hasPasswordInput) {
    console.log("🧪 Attempting test login...");

    // Fill in test credentials (replace with actual test account)
    await page.fill(
      'input[type="email"], input[placeholder*="email" i]',
      "diegobotero+test@ikusi.com",
    );
    await page.fill('input[type="password"]', "TestPassword123!");

    // Find and click sign in button
    const signInButton = await page.$(
      'button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]',
    );

    if (signInButton) {
      console.log("🔘 Found sign in button, clicking...");

      // Listen for any authentication errors
      page.on("console", (msg) => {
        if (msg.type() === "error" && msg.text().includes("Auth")) {
          console.log("🔴 Auth Error:", msg.text());
        }
      });

      await signInButton.click();

      // Wait a bit for authentication to process
      await page.waitForTimeout(3000);

      // Check result
      const newUrl = page.url();
      const newTitle = await page.title();

      console.log("📍 After login attempt:");
      console.log("  - URL:", newUrl);
      console.log("  - Title:", newTitle);

      // Check for any auth-related elements or errors
      const errorMessage = await page.$(
        '.error, [class*="error"], [data-testid*="error"]',
      );
      if (errorMessage) {
        const errorText = await errorMessage.textContent();
        console.log("❌ Error message:", errorText);
      }
    } else {
      console.log("❌ Could not find sign in button");
    }
  } else {
    console.log("🔍 No login form found, checking if already authenticated...");

    // Check if we're on dashboard
    const isDashboard =
      url.includes("/dashboard") ||
      (await page.$('[data-testid*="dashboard"], .dashboard, #dashboard')) !==
        null;
    console.log("📊 On dashboard:", isDashboard ? "✅ Yes" : "❌ No");
  }

  // Print any console errors
  if (logs.length > 0) {
    console.log("\n🔴 Console Errors:");
    logs.forEach((log) => console.log(log));
  }

  // Take a screenshot for debugging
  await page.screenshot({ path: "auth-test-screenshot.png", fullPage: true });
  console.log("📸 Screenshot saved as auth-test-screenshot.png");
});

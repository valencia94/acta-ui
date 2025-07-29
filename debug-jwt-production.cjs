#!/usr/bin/env node

// Enhanced JWT Token Debugging for Production
const puppeteer = require("puppeteer");

async function testJWTTokens() {
  console.log("🔍 Testing JWT Token Handling in Production...");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Navigate to production
  await page.goto("https://d7t9x3j66yd8k.cloudfront.net", {
    waitUntil: "networkidle2",
  });

  // Wait for AWS exports to load
  await page.waitForFunction(() => window.awsmobile);

  // Login
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', "valencia942003@gmail.com");
  await page.type('input[name="password"]', "Asdf1234!");
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForSelector("text=Dashboard", { timeout: 10000 });

  console.log("✅ Login successful, now testing JWT tokens...");

  // Get JWT token details
  const tokenDetails = await page.evaluate(async () => {
    try {
      // Import Amplify (wait for it to be available)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Try to get token from localStorage
      const localToken = localStorage.getItem("ikusi.jwt");

      // Try to get fresh token from Amplify
      let amplifyToken = null;
      try {
        if (window.awsmobile) {
          const { Amplify } = await import("aws-amplify");
          const { fetchAuthSession } = await import("aws-amplify/auth");

          Amplify.configure(window.awsmobile);

          const session = await fetchAuthSession();
          amplifyToken = session.tokens?.idToken?.toString();
        }
      } catch (error) {
        console.error("❌ Amplify token error:", error);
      }

      return {
        localToken: localToken ? localToken.substring(0, 50) + "..." : null,
        amplifyToken: amplifyToken
          ? amplifyToken.substring(0, 50) + "..."
          : null,
        hasLocalToken: !!localToken,
        hasAmplifyToken: !!amplifyToken,
        tokensMatch: localToken === amplifyToken,
      };
    } catch (error) {
      return { error: error.message };
    }
  });

  console.log("📋 JWT Token Details:", tokenDetails);

  // Test API call with token
  const apiTestResult = await page.evaluate(async () => {
    try {
      const token = localStorage.getItem("ikusi.jwt");
      if (!token) {
        return { error: "No token available" };
      }

      // Test API call to a protected endpoint
      const response = await fetch(
        "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/download-acta/test-project-001?format=pdf",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        hasAuthHeader: !!response.headers.get("Authorization"),
      };
    } catch (error) {
      return { error: error.message };
    }
  });

  console.log("🌐 API Test Result:", apiTestResult);

  // Test token parsing
  const tokenParsing = await page.evaluate(() => {
    try {
      const token = localStorage.getItem("ikusi.jwt");
      if (!token) return { error: "No token" };

      const parts = token.split(".");
      if (parts.length !== 3) return { error: "Invalid token format" };

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      return {
        header: header,
        payload: {
          sub: payload.sub,
          email: payload.email,
          exp: new Date(payload.exp * 1000).toISOString(),
          iat: new Date(payload.iat * 1000).toISOString(),
          token_use: payload.token_use,
          client_id: payload.client_id,
          aud: payload.aud,
        },
        isExpired: Date.now() >= payload.exp * 1000,
      };
    } catch (error) {
      return { error: error.message };
    }
  });

  console.log("🔍 Token Parsing Result:", tokenParsing);

  await browser.close();
}

testJWTTokens().catch(console.error);

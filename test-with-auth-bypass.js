// test-with-auth-bypass.js
// Test the app with authentication bypass to see all components

import { chromium } from "playwright";

async function testWithAuthBypass() {
  console.log("🔓 TESTING WITH AUTH BYPASS (SIMULATED AUTHENTICATED STATE)");
  console.log("=".repeat(60));

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the site
    console.log("🌐 Navigating to production site...");
    await page.goto("https://d7t9x3j66yd8k.cloudfront.net/");
    await page.waitForLoadState("networkidle");

    // Simulate authenticated state by setting localStorage
    console.log("🔐 Simulating authenticated state...");
    await page.evaluate(() => {
      // Set a fake JWT token to simulate authentication
      localStorage.setItem("ikusi.jwt", "fake-jwt-token-for-testing");

      // Also trigger the auth success event
      window.dispatchEvent(new Event("auth-success"));
    });

    // Navigate to dashboard
    console.log("📊 Navigating to dashboard...");
    await page.goto("https://d7t9x3j66yd8k.cloudfront.net/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // Wait for potential component loading

    // Check what components are now visible
    const dashboardState = await page.evaluate(() => {
      return {
        currentPath: window.location.pathname,
        pageTitle: document.title,
        pageText: document.body.textContent.toLowerCase(),
        hasElements: {
          dashboard: document.body.textContent
            .toLowerCase()
            .includes("dashboard"),
          projects: document.body.textContent.toLowerCase().includes("project"),
          manager: document.body.textContent.toLowerCase().includes("manager"),
          dynamo: document.body.textContent.toLowerCase().includes("dynamo"),
          table: !!document.querySelector('table, [role="table"], .table'),
          buttons: document.querySelectorAll("button").length,
          forms: document.querySelectorAll("form, input").length,
          headers: document.querySelectorAll("h1, h2, h3").length,
        },
        componentClasses: Array.from(
          document.querySelectorAll(
            '[class*="component"], [class*="Component"]',
          ),
        )
          .map((el) => el.className)
          .slice(0, 10),
        dataTestIds: Array.from(document.querySelectorAll("[data-testid]"))
          .map((el) => el.getAttribute("data-testid"))
          .slice(0, 10),
      };
    });

    console.log("\n📋 DASHBOARD COMPONENT ANALYSIS:");
    console.log(`Current path: ${dashboardState.currentPath}`);
    console.log(`Page title: ${dashboardState.pageTitle}`);

    console.log("\nComponent Indicators:");
    Object.entries(dashboardState.hasElements).forEach(([element, value]) => {
      const display =
        typeof value === "number" ? `${value} found` : value ? "✅" : "❌";
      console.log(`  ${element}: ${display}`);
    });

    // Look for specific component patterns in the DOM
    const componentPatterns = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll("*"));
      const patterns = {
        "PM Project Manager": allElements.some(
          (el) =>
            el.textContent?.includes("PM") ||
            el.className?.includes("pm") ||
            el.id?.includes("pm"),
        ),
        "Dynamo Projects": allElements.some(
          (el) =>
            el.textContent?.includes("Dynamo") ||
            el.className?.includes("dynamo") ||
            el.id?.includes("dynamo"),
        ),
        "Project Table": allElements.some(
          (el) =>
            (el.textContent?.includes("Project") && el.tagName === "TABLE") ||
            el.className?.includes("project-table") ||
            el.id?.includes("project-table"),
        ),
        "Document Status": allElements.some(
          (el) =>
            el.textContent?.includes("Document") ||
            el.textContent?.includes("Status") ||
            el.className?.includes("document") ||
            el.className?.includes("status"),
        ),
        "Email Dialog": allElements.some(
          (el) =>
            el.textContent?.includes("Email") ||
            el.className?.includes("email") ||
            el.className?.includes("dialog"),
        ),
      };

      return patterns;
    });

    console.log("\nSpecific Component Detection:");
    Object.entries(componentPatterns).forEach(([pattern, found]) => {
      console.log(`  ${pattern}: ${found ? "✅" : "❌"}`);
    });

    // Check for any error messages or loading states
    const errorCheck = await page.evaluate(() => {
      const text = document.body.textContent.toLowerCase();
      return {
        hasErrors: text.includes("error") || text.includes("failed"),
        hasLoading: text.includes("loading") || text.includes("spinner"),
        hasSuccess: text.includes("success") || text.includes("loaded"),
        hasNoData: text.includes("no data") || text.includes("empty"),
        specificErrors: Array.from(
          document.querySelectorAll('.error, [class*="error"], .alert-error'),
        )
          .map((el) => el.textContent)
          .slice(0, 5),
      };
    });

    console.log("\nError/State Analysis:");
    Object.entries(errorCheck).forEach(([check, result]) => {
      if (Array.isArray(result)) {
        console.log(
          `  ${check}: ${result.length > 0 ? result.join(", ") : "None"}`,
        );
      } else {
        console.log(`  ${check}: ${result ? "⚠️" : "✅"}`);
      }
    });

    // Try to interact with the page to trigger component loading
    console.log("\n🔄 ATTEMPTING COMPONENT INTERACTIONS...");

    try {
      // Look for mode switcher buttons or similar
      const buttons = await page.locator("button").all();
      console.log(
        `Found ${buttons.length} buttons to potentially interact with`,
      );

      if (buttons.length > 0) {
        // Try clicking the first few buttons to see if they reveal components
        for (let i = 0; i < Math.min(3, buttons.length); i++) {
          try {
            const buttonText = await buttons[i].textContent();
            console.log(`  Clicking button: "${buttonText}"`);
            await buttons[i].click();
            await page.waitForTimeout(1000);
          } catch (e) {
            console.log(`  Button ${i} click failed: ${e.message}`);
          }
        }
      }
    } catch (e) {
      console.log(`Button interaction failed: ${e.message}`);
    }

    // Final component check after interactions
    const finalCheck = await page.evaluate(() => {
      return {
        totalElements: document.querySelectorAll("*").length,
        visibleText: document.body.textContent.trim().substring(0, 500) + "...",
        uniqueClasses: [
          ...new Set(
            Array.from(document.querySelectorAll("[class]"))
              .map((el) => el.className.split(" "))
              .flat(),
          ),
        ]
          .filter((c) => c)
          .slice(0, 20),
      };
    });

    console.log("\n📊 FINAL ANALYSIS:");
    console.log(`Total DOM elements: ${finalCheck.totalElements}`);
    console.log(`Visible text preview: ${finalCheck.visibleText}`);
    console.log(`Unique CSS classes: ${finalCheck.uniqueClasses.join(", ")}`);

    console.log("\n✅ Auth bypass test complete!");
  } catch (error) {
    console.error("❌ Auth bypass test failed:", error);
  } finally {
    await browser.close();
  }
}

testWithAuthBypass().catch(console.error);

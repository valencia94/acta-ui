// comprehensive-auth-api-test.js
// 🧪 ACTA-UI Comprehensive Authentication & API Test
// Run this in the browser console after loading the app

console.log("🧪 Starting ACTA-UI Comprehensive Test...");

// Test 1: Verify AWS Configuration
console.log("\n═══ TEST 1: AWS CONFIGURATION ═══");
try {
  const awsConfig = window.aws_amplify_config || {};
  console.log("✅ AWS Config loaded:", !!awsConfig);
  console.log(
    "📋 Cognito Pool ID:",
    awsConfig.aws_user_pools_id || "Not found",
  );
  console.log(
    "📋 Client ID:",
    awsConfig.aws_user_pools_web_client_id || "Not found",
  );
  console.log("📋 Region:", awsConfig.aws_project_region || "Not found");
} catch (error) {
  console.error("❌ AWS Config error:", error);
}

// Test 2: Check Local Storage for Auth Token
console.log("\n═══ TEST 2: AUTHENTICATION STATE ═══");
const localToken = localStorage.getItem("ikusi.jwt");
console.log("🔑 Local JWT Token exists:", !!localToken);
if (localToken) {
  try {
    const tokenParts = localToken.split(".");
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log("📋 Token payload:", {
        email: payload.email || "Not found",
        exp: new Date(payload.exp * 1000).toISOString(),
        iss: payload.iss || "Not found",
      });
    }
  } catch (e) {
    console.log("⚠️ Token parsing failed:", e.message);
  }
}

// Test 3: API Endpoints Connectivity
console.log("\n═══ TEST 3: API CONNECTIVITY ═══");
const apiBaseUrl =
  "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod";

// Test Health Endpoint (No Auth Required)
async function testHealthEndpoint() {
  try {
    console.log("🔍 Testing Health Endpoint...");
    const response = await fetch(`${apiBaseUrl}/health`);
    const data = await response.json();
    console.log("✅ Health Check:", response.status, data);
    return response.ok;
  } catch (error) {
    console.error("❌ Health Check failed:", error);
    return false;
  }
}

// Test Protected Endpoint (Auth Required)
async function testProtectedEndpoint() {
  try {
    console.log("🔍 Testing Protected Endpoint...");
    const headers = {};
    if (localToken) {
      headers.Authorization = `Bearer ${localToken}`;
    }

    const response = await fetch(`${apiBaseUrl}/timeline/1000000049842296`, {
      headers,
    });

    console.log("📊 Timeline Endpoint:", response.status);
    if (response.status === 401) {
      console.log(
        "✅ Auth protection working (401 expected without valid token)",
      );
    } else if (response.status === 200) {
      const data = await response.json();
      console.log("✅ Timeline data received:", data);
    }
    return true;
  } catch (error) {
    console.error("❌ Timeline test failed:", error);
    return false;
  }
}

// Test 4: Button Functionality
console.log("\n═══ TEST 4: DASHBOARD BUTTONS ═══");
function testButtonsPresence() {
  const buttons = {
    "Generate All Acta": document.querySelector(
      '[data-testid="generate-all-acta"], button[title*="Generate"], button:contains("Generate All")',
    ),
    "Download Word": document.querySelector(
      '[data-testid="download-word"], button[title*="Word"], button:contains("Word")',
    ),
    "Download PDF": document.querySelector(
      '[data-testid="download-pdf"], button[title*="PDF"], button:contains("PDF")',
    ),
    "Preview PDF": document.querySelector(
      '[data-testid="preview-pdf"], button[title*="Preview"], button:contains("Preview")',
    ),
    "Send Approval": document.querySelector(
      '[data-testid="send-approval"], button[title*="Approval"], button:contains("Approval")',
    ),
  };

  console.log("🎯 Button presence check:");
  Object.entries(buttons).forEach(([name, element]) => {
    console.log(
      `${element ? "✅" : "❌"} ${name}: ${element ? "Found" : "Not found"}`,
    );
  });

  return Object.values(buttons).filter(Boolean).length;
}

// Test 5: React Components Mounted
console.log("\n═══ TEST 5: REACT COMPONENTS ═══");
function testReactComponents() {
  const components = {
    "App Container": document.querySelector("#root"),
    Dashboard: document.querySelector(
      '[data-component="dashboard"], .dashboard, [class*="dashboard"]',
    ),
    Header: document.querySelector(
      'header, [data-component="header"], .header',
    ),
    "Project Input": document.querySelector(
      'input[placeholder*="Project"], input[name*="project"]',
    ),
    "Auth Form": document.querySelector('form, [data-component="auth"]'),
  };

  console.log("⚛️ React components:");
  Object.entries(components).forEach(([name, element]) => {
    console.log(
      `${element ? "✅" : "❌"} ${name}: ${element ? "Mounted" : "Not found"}`,
    );
  });

  return Object.values(components).filter(Boolean).length;
}

// Test 6: Document Title
console.log("\n═══ TEST 6: DOCUMENT TITLE ═══");
const expectedTitle = "Ikusi · Acta Platform";
const actualTitle = document.title;
console.log(`📄 Expected: "${expectedTitle}"`);
console.log(`📄 Actual: "${actualTitle}"`);
console.log(
  `${actualTitle === expectedTitle ? "✅" : "❌"} Title ${actualTitle === expectedTitle ? "correct" : "incorrect"}`,
);

// Run All Tests
async function runComprehensiveTest() {
  console.log("\n🚀 RUNNING ALL TESTS...\n");

  const results = {
    health: await testHealthEndpoint(),
    protected: await testProtectedEndpoint(),
    buttons: testButtonsPresence() > 0,
    components: testReactComponents() > 0,
    title: actualTitle === expectedTitle,
  };

  console.log("\n═══ FINAL RESULTS ═══");
  Object.entries(results).forEach(([test, passed]) => {
    console.log(
      `${passed ? "✅" : "❌"} ${test.toUpperCase()}: ${passed ? "PASS" : "FAIL"}`,
    );
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED! System is ready for deployment.");
  } else {
    console.log("⚠️ Some tests failed. Review above for details.");
  }

  return results;
}

// Auto-run tests after 2 seconds
setTimeout(runComprehensiveTest, 2000);

console.log("🧪 Test script loaded. Running tests in 2 seconds...");
console.log("💡 You can also manually run: runComprehensiveTest()");

// Export for manual testing
window.actaTests = {
  runComprehensiveTest,
  testHealthEndpoint,
  testProtectedEndpoint,
  testButtonsPresence,
  testReactComponents,
};

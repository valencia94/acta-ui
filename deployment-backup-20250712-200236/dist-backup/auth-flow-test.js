// auth-flow-test.js
// 🔐 ACTA-UI Authentication Flow Test
// Run this in browser console to test auth functionality

console.log("🔐 Starting Authentication Flow Test...");

// Test 1: Check AWS Amplify Configuration
console.log("\n═══ TEST 1: AWS AMPLIFY CONFIG ═══");
function testAmplifyConfig() {
  try {
    // Check if Amplify is configured
    const hasAmplify =
      typeof window.AWS !== "undefined" ||
      typeof window.aws_amplify_config !== "undefined" ||
      document.querySelector('script[src*="amplify"]') !== null;

    console.log(
      `${hasAmplify ? "✅" : "⚠️"} Amplify library: ${hasAmplify ? "Detected" : "Not clearly detected"}`,
    );

    // Check localStorage for any existing auth tokens
    const jwtToken = localStorage.getItem("ikusi.jwt");
    console.log(
      `🔑 JWT Token in localStorage: ${jwtToken ? "Present" : "Not present"}`,
    );
    if (jwtToken) {
      console.log(`📏 Token length: ${jwtToken.length} characters`);
    }

    return { hasAmplify, hasToken: !!jwtToken };
  } catch (error) {
    console.error("❌ Amplify config test error:", error);
    return { hasAmplify: false, hasToken: false };
  }
}

// Test 2: Check Login Form Elements
console.log("\n═══ TEST 2: LOGIN FORM ELEMENTS ═══");
function testLoginForm() {
  const elements = {
    emailInput: document.querySelector(
      'input[type="email"], input[id="email"]',
    ),
    passwordInput: document.querySelector(
      'input[type="password"], input[id="password"]',
    ),
    submitButton: document.querySelector('button[type="submit"], form button'),
    loginForm: document.querySelector("form"),
  };

  console.log(
    `${elements.emailInput ? "✅" : "❌"} Email input: ${elements.emailInput ? "Found" : "Not found"}`,
  );
  console.log(
    `${elements.passwordInput ? "✅" : "❌"} Password input: ${elements.passwordInput ? "Found" : "Not found"}`,
  );
  console.log(
    `${elements.submitButton ? "✅" : "❌"} Submit button: ${elements.submitButton ? "Found" : "Not found"}`,
  );
  console.log(
    `${elements.loginForm ? "✅" : "❌"} Login form: ${elements.loginForm ? "Found" : "Not found"}`,
  );

  // Check button text
  if (elements.submitButton) {
    const buttonText =
      elements.submitButton.textContent || elements.submitButton.innerText;
    console.log(`📝 Submit button text: "${buttonText}"`);
  }

  return elements;
}

// Test 3: Check Current Page/Route
console.log("\n═══ TEST 3: CURRENT ROUTE ═══");
function testCurrentRoute() {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath === "/login" || currentPath.includes("login");
  const isDashboardPage =
    currentPath === "/dashboard" || currentPath.includes("dashboard");
  const isRootPage = currentPath === "/";

  console.log(`📍 Current path: ${currentPath}`);
  console.log(`${isLoginPage ? "✅" : "❌"} On login page: ${isLoginPage}`);
  console.log(
    `${isDashboardPage ? "✅" : "❌"} On dashboard page: ${isDashboardPage}`,
  );
  console.log(`${isRootPage ? "✅" : "❌"} On root page: ${isRootPage}`);

  return { currentPath, isLoginPage, isDashboardPage, isRootPage };
}

// Test 4: Test Skip Auth Mode
console.log("\n═══ TEST 4: SKIP AUTH MODE ═══");
function testSkipAuthMode() {
  // Look for skip auth indicators
  const skipAuthText =
    document.body.textContent?.includes("Demo mode") ||
    document.body.textContent?.includes("any credentials will work");

  console.log(
    `${skipAuthText ? "✅" : "❌"} Skip auth mode: ${skipAuthText ? "Enabled" : "Not detected"}`,
  );

  return { skipAuthEnabled: skipAuthText };
}

// Test 5: Check Document Title
console.log("\n═══ TEST 5: DOCUMENT TITLE ═══");
function testDocumentTitle() {
  const expectedTitle = "Ikusi · Acta Platform";
  const actualTitle = document.title;
  const titleCorrect = actualTitle === expectedTitle;

  console.log(`📄 Expected title: "${expectedTitle}"`);
  console.log(`📄 Actual title: "${actualTitle}"`);
  console.log(`${titleCorrect ? "✅" : "❌"} Title correct: ${titleCorrect}`);

  return { titleCorrect, actualTitle };
}

// Test 6: Simulate Auth Test (Safe)
console.log("\n═══ TEST 6: AUTH SIMULATION TEST ═══");
function simulateAuthTest() {
  const loginForm = testLoginForm();

  if (
    loginForm.emailInput &&
    loginForm.passwordInput &&
    !loginForm.submitButton?.disabled
  ) {
    console.log("🧪 Form is ready for auth testing");
    console.log("💡 To test auth manually:");
    console.log("   1. Enter email: valencia942003@gmail.com");
    console.log("   2. Enter any password (if skip auth is enabled)");
    console.log("   3. Click submit and watch console for auth flow");
    return { ready: true };
  } else {
    console.log("⚠️ Form not ready for auth testing");
    return { ready: false };
  }
}

// Run All Auth Tests
async function runAuthFlowTests() {
  console.log("\n🚀 RUNNING AUTH FLOW TESTS...\n");

  const results = {
    amplifyConfig: testAmplifyConfig(),
    loginForm: testLoginForm(),
    currentRoute: testCurrentRoute(),
    skipAuthMode: testSkipAuthMode(),
    documentTitle: testDocumentTitle(),
    authSimulation: simulateAuthTest(),
  };

  console.log("\n═══ AUTH FLOW TEST SUMMARY ═══");

  // Analyze results
  let score = 0;
  let maxScore = 6;

  if (results.amplifyConfig.hasAmplify) score++;
  if (
    results.loginForm.loginForm &&
    results.loginForm.emailInput &&
    results.loginForm.passwordInput
  )
    score++;
  if (results.currentRoute.isLoginPage || results.currentRoute.isDashboardPage)
    score++;
  if (results.skipAuthMode.skipAuthEnabled) score++;
  if (results.documentTitle.titleCorrect) score++;
  if (results.authSimulation.ready) score++;

  console.log(`🎯 AUTH FLOW READINESS: ${score}/${maxScore} tests passed`);

  if (score >= 5) {
    console.log("🎉 AUTH FLOW IS READY! You can test login functionality.");
    if (results.skipAuthMode.skipAuthEnabled) {
      console.log(
        "🚀 Skip auth mode is enabled - any credentials should work!",
      );
    }
  } else if (score >= 3) {
    console.log("✅ AUTH FLOW IS MOSTLY READY - may have minor issues.");
  } else {
    console.log("⚠️ AUTH FLOW NEEDS ATTENTION - several components missing.");
  }

  return results;
}

// Auto-run tests
setTimeout(runAuthFlowTests, 500);

console.log("🔐 Auth flow test script loaded. Running tests in 0.5 seconds...");
console.log("💡 Manual run: runAuthFlowTests()");

// Export for manual testing
window.authFlowTests = {
  runAuthFlowTests,
  testAmplifyConfig,
  testLoginForm,
  testCurrentRoute,
  testSkipAuthMode,
  testDocumentTitle,
  simulateAuthTest,
};

#!/usr/bin/env node
// comprehensive-validation.js
// Master validation script that runs all our working tests

import { spawn } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 COMPREHENSIVE VALIDATION SUITE");
console.log("===================================");
console.log("");

// Test suite configuration
const tests = [
  {
    name: "Environment & Connectivity",
    command: "node",
    args: ["test-connectivity-with-auth.js"],
    description:
      "Tests environment variables, API Gateway health, and Cognito config",
  },
  {
    name: "Dashboard Button Validation",
    command: "node",
    args: ["validate-dashboard-buttons.cjs"],
    description: "Validates all 5 dashboard buttons are properly mapped",
  },
  {
    name: "Build & Lint Check",
    command: "pnpm",
    args: ["run", "lint"],
    description: "Runs TypeScript and ESLint checks",
  },
  {
    name: "Production Build Test",
    command: "pnpm",
    args: ["run", "build"],
    description: "Tests production build compilation",
  },
];

let testResults = [];

console.log("🎯 Running validation tests...");
console.log("");

// Run tests sequentially
async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`▶️  ${test.name}`);
    console.log(`   ${test.description}`);

    const startTime = Date.now();
    const process = spawn(test.command, test.args, {
      stdio: "pipe",
      shell: true,
    });

    let output = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;

      testResults.push({
        name: test.name,
        success,
        duration,
        output,
        errorOutput,
        exitCode: code,
      });

      if (success) {
        console.log(`   ✅ PASSED (${duration}ms)`);
      } else {
        console.log(`   ❌ FAILED (${duration}ms) - Exit code: ${code}`);
      }
      console.log("");

      resolve();
    });
  });
}

// Run all tests
async function runAllTests() {
  for (const test of tests) {
    await runTest(test);
  }

  // Print summary
  console.log("📊 VALIDATION SUMMARY");
  console.log("====================");

  const passedTests = testResults.filter((result) => result.success).length;
  const totalTests = testResults.length;
  const passRate = Math.round((passedTests / totalTests) * 100);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log("");

  // Detailed results
  testResults.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    console.log(`${status} ${result.name} (${result.duration}ms)`);

    if (!result.success && result.errorOutput) {
      console.log(`   Error: ${result.errorOutput.substring(0, 200)}...`);
    }
  });

  console.log("");

  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED!");
    console.log("");
    console.log("🚀 PRODUCTION READINESS:");
    console.log("✅ Environment variables configured");
    console.log("✅ API Gateway connectivity verified");
    console.log("✅ Dashboard buttons properly mapped");
    console.log("✅ Build process working");
    console.log("✅ Code quality checks passing");
    console.log("");
    console.log("🎯 NEXT STEPS:");
    console.log("1. Test DynamoDB connectivity in browser:");
    console.log("   → open public/dynamo-connectivity-test.html");
    console.log("2. Login as christian.valencia@ikusi.com");
    console.log("3. Verify all dashboard functions work");
    console.log("4. Deploy to production");
  } else {
    console.log("⚠️  SOME TESTS FAILED");
    console.log("Please fix the failing tests before deployment.");
  }

  console.log("");
  console.log("📋 AVAILABLE TEST FILES:");
  console.log("• test-connectivity-with-auth.js - Environment & API tests");
  console.log("• validate-dashboard-buttons.cjs - Button validation");
  console.log("• public/dynamo-connectivity-test.html - Browser DynamoDB test");
  console.log("• public/button-test-runner.html - Interactive button tests");
  console.log("");

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Start the test suite
runAllTests().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});

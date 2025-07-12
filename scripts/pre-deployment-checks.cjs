
#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const testFiles = [
  "test-api-auth-fixed.js",
  "test-api-auth.js",
  "test-api-buttons.sh",
  "test-api-connectivity.cjs",
  "test-api-direct.js",
  "test-api-simple.js",
  "test-auth-fixes.sh",
  "test-auth-flow.js",
  "test-auth-flow.sh",
  "test-auth-production.js",
  "test-cognito-auth.js",
  "test-cognito-login.js",
  "test-components-production.js",
  "test-dashboard-buttons.js",
  "test-deployment.cjs",
  "test-dynamo-components.js",
  "test-extract-project-place.js",
  "test-frontend-fetch.js",
  "test-full-app-flow.js",
  "test-production.jsss"
];

const results = [];
const rootDir = process.cwd();

console.log("🔍 Running pre-deployment readiness checks...\n");

for (const file of testFiles) {
  const filePath = path.join(rootDir, file);
  const extension = path.extname(filePath);
  if (!fs.existsSync(filePath)) {
    results.push({ file, status: "❌ MISSING" });
    continue;
  }

  try {
    const runCmd =
      extension === ".sh"
        ? `bash ${filePath}`
        : extension === ".cjs" || extension === ".js"
        ? `node ${filePath}`
        : null;

    if (!runCmd) {
      results.push({ file, status: "⚠️ UNSUPPORTED" });
      continue;
    }

    execSync(runCmd, { stdio: "ignore" });
    results.push({ file, status: "✅ PASS" });
  } catch (e) {
    results.push({ file, status: "❌ FAIL" });
  }
}

const report = [
  "# ✅ ACTA-UI: Pre-Deployment Test Summary",
  "",
  "| Test File | Status |",
  "|-----------|--------|",
  ...results.map((r) => `| ${r.file} | ${r.status} |`),
  "",
  `**Tests Run**: ${results.length}`,
  `**Passed**: ${results.filter((r) => r.status === "✅ PASS").length}`,
  `**Failed**: ${results.filter((r) => r.status === "❌ FAIL").length}`,
  `**Missing**: ${results.filter((r) => r.status === "❌ MISSING").length}`,
].join("\n");

fs.writeFileSync("test-report.md", report);
console.log(report);
console.log("\n📋 Report written to test-report.md");

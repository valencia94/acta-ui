
#!/usr/bin/env node
/**
 * pre-deployment-checks.cjs
 * Unified Pre-deployment Testing Script
 * Combines Cognito, API, UI, and Deployment validation
 */

const { execSync } = require("child_process");
const chalk = require("chalk");

function run(label, command) {
  console.log(chalk.blue(`\n🔍 ${label}`));
  try {
    const output = execSync(command, { stdio: "inherit", encoding: "utf-8" });
    console.log(chalk.green(`✅ ${label} passed\n`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ ${label} failed\n`));
    return false;
  }
}

const checks = [
  { label: "Cognito Auth Flow", command: "node test-cognito-auth.js" },
  { label: "API Connectivity", command: "node test-api-connectivity.cjs" },
  { label: "Dashboard Buttons", command: "node test-dashboard-buttons.js" },
  { label: "Cognito Login", command: "node test-cognito-login.js" },
  { label: "Frontend Fetch", command: "node test-frontend-fetch.js" },
  { label: "Full App Flow", command: "node test-full-app-flow.js" },
  { label: "API Simple Ping", command: "node test-api-simple.js" },
  { label: "API Direct Call", command: "node test-api-direct.js" },
  { label: "Extract ProjectPlace", command: "node test-extract-project-place.js" },
  { label: "Deployment Validator", command: "node test-deployment.cjs" },
  { label: "Component Integrity", command: "node test-components-production.js" },
];

let failed = false;
for (const check of checks) {
  const success = run(check.label, check.command);
  if (!success) failed = true;
}

if (!failed) {
  console.log(chalk.bold.green("\n🎉 All checks passed. Ready for deployment!"));
  process.exit(0);
} else {
  console.log(chalk.bold.red("\n⚠️ Some checks failed. Review output above before deploying."));
  process.exit(1);
}

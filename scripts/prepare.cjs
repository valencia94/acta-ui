// scripts/prepare.cjs
if (!process.env.CI) {
  const { execSync } = require("child_process");

  // Install the single browser we need for local dev
  execSync("npx playwright install chromium", { stdio: "inherit" });

  // Set up Husky git hooks
  execSync("npx husky install", { stdio: "inherit" });
}

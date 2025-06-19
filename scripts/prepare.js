// scripts/prepare.js
if (!process.env.CI) {
  const { execSync } = require('child_process');
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  execSync('npx husky install', { stdio: 'inherit' });
}

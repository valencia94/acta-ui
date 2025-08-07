const { execSync } = require('child_process');

console.log('🔍 Starting validation...');

try {
  console.log('📝 Running type check...');
  execSync('pnpm exec tsc --noEmit', { stdio: 'inherit' });

  console.log('🧹 Running linter...');
  execSync('pnpm exec eslint . --fix', { stdio: 'inherit' });

  console.log('✨ Running formatter...');
  execSync('pnpm exec prettier --write "src/**/*.{ts,tsx,css,md}"', { stdio: 'inherit' });

  console.log('✅ All validations passed!');
} catch (error) {
  console.error('❌ Validation failed:', error);
  process.exit(1);
}

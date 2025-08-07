const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();

function cleanupBuildArtifacts() {
  // Safe cleanup targets
  const foldersToClean = [
    '.vite',
    'dist',
    'coverage',
    '.eslintcache',
    '.tsbuildinfo',
  ];

  console.log('🧹 Starting cleanup...');

  // Clean pnpm store safely
  try {
    execSync('pnpm store prune', { stdio: 'inherit' });
    console.log('✅ Pruned pnpm store');
  } catch (error) {
    console.error('❌ Failed to prune pnpm store:', error);
  }

  // Clean build artifacts
  foldersToClean.forEach(folder => {
    const fullPath = path.join(ROOT_DIR, folder);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Cleaned ${folder}`);
      } catch (error) {
        console.error(`❌ Failed to clean ${folder}:`, error);
      }
    }
  });

  console.log('✨ Cleanup complete!');
}

cleanupBuildArtifacts();


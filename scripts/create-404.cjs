// Create dist/404.html from dist/index.html for SPA routing (S3/CloudFront)
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');

try {
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist directory not found');
    process.exit(1);
  }
  if (!fs.existsSync(indexPath)) {
    console.error('❌ dist/index.html not found');
    process.exit(1);
  }
  fs.copyFileSync(indexPath, fallbackPath);
  console.log('✅ Created dist/404.html for SPA routing');
  process.exit(0);
} catch (err) {
  console.error('❌ Failed to create 404.html:', err && err.message ? err.message : err);
  process.exit(1);
}

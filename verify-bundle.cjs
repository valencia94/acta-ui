const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "dist");
const assetsDir = path.join(distDir, "assets");

const requiredChunks = ["pdf-viewer", "vendor", "ui"];

const files = fs.readdirSync(assetsDir);

const getSizeKB = (file) =>
  (fs.statSync(path.join(assetsDir, file)).size / 1024).toFixed(1);

// Check 1: aws-exports.js presence
if (!fs.existsSync(path.join(distDir, "aws-exports.js"))) {
  console.error("❌ Missing aws-exports.js in dist/");
  process.exit(1);
}

// Check 2: Required chunks
for (const chunk of requiredChunks) {
  const found = files.find((f) => f.includes(chunk));
  if (!found) {
    console.error(`❌ Missing chunk for ${chunk}`);
    process.exit(1);
  } else {
    console.log(`✅ ${chunk} found → ${found} (${getSizeKB(found)} KB)`);
  }
}

// Check 3: Entry bundle size
const indexBundle = files.find(
  (f) => f.startsWith("index-") && f.endsWith(".js"),
);
if (!indexBundle) {
  console.error("❌ index-[hash].js bundle not found!");
  process.exit(1);
}

const indexSize = fs.statSync(path.join(assetsDir, indexBundle)).size / 1024;
if (indexSize > 1024) {
  console.warn(
    `⚠️ index.js is large (${indexSize.toFixed(1)} KB). Confirm chunking is effective.`,
  );
} else {
  console.log(`✅ index.js size OK (${indexSize.toFixed(1)} KB)`);
}

console.log("🎯 Bundle verification passed!");

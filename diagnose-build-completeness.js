#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 ACTA-UI Build Completeness Diagnostic");
console.log("=========================================\n");

// Helper function to recursively find files
function findFiles(dir, extensions = [".ts", ".tsx", ".js", ".jsx", ".css"]) {
  const files = [];

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some((ext) => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  if (fs.existsSync(dir)) {
    walk(dir);
  }

  return files;
}

// Helper function to check if a file is imported/used
function isFileImported(filePath, allFiles) {
  const relativePath = path.relative(path.join(__dirname, "src"), filePath);
  const withoutExt = relativePath.replace(/\.(ts|tsx|js|jsx)$/, "");

  // Check if this file is imported in any other file
  for (const file of allFiles) {
    if (file === filePath) continue;

    try {
      const content = fs.readFileSync(file, "utf-8");

      // Check various import patterns
      const importPatterns = [
        `from './${withoutExt}`,
        `from '../${withoutExt}`,
        `from '../../${withoutExt}`,
        `from './../../${withoutExt}`,
        `from './../${withoutExt}`,
        `from '@/${withoutExt}`,
        `from '${withoutExt}`,
        `import('./${withoutExt}`,
        `import('../${withoutExt}`,
        `import('../../${withoutExt}`,
        `import('@/${withoutExt}`,
        `import('${withoutExt}`,
      ];

      if (importPatterns.some((pattern) => content.includes(pattern))) {
        return true;
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  return false;
}

// 1. Analyze src/ structure
console.log("📁 Source Directory Structure:");
console.log("===============================");

const srcFiles = findFiles("src");
const srcDirs = new Set();

srcFiles.forEach((file) => {
  const dir = path.dirname(file);
  srcDirs.add(dir);
});

// Group files by directory
const filesByDir = {};
srcFiles.forEach((file) => {
  const dir = path.dirname(file);
  if (!filesByDir[dir]) filesByDir[dir] = [];
  filesByDir[dir].push(path.basename(file));
});

Object.keys(filesByDir)
  .sort()
  .forEach((dir) => {
    console.log(`📂 ${dir}:`);
    filesByDir[dir].sort().forEach((file) => {
      console.log(`   - ${file}`);
    });
    console.log();
  });

console.log(`Total src files: ${srcFiles.length}`);
console.log(`Total src directories: ${srcDirs.size}\n`);

// 2. Analyze dist/ structure
console.log("📦 Build Output Structure:");
console.log("==========================");

const distFiles = findFiles("dist", [
  ".js",
  ".css",
  ".html",
  ".png",
  ".svg",
  ".ico",
]);
console.log(`Total dist files: ${distFiles.length}`);

// Group dist files by type
const distByType = {};
distFiles.forEach((file) => {
  const ext = path.extname(file);
  if (!distByType[ext]) distByType[ext] = [];
  distByType[ext].push(file);
});

Object.keys(distByType)
  .sort()
  .forEach((ext) => {
    console.log(`${ext} files (${distByType[ext].length}):`);
    distByType[ext].forEach((file) => {
      console.log(`   - ${file}`);
    });
    console.log();
  });

// 3. Check entry points
console.log("🚀 Entry Points Analysis:");
console.log("==========================");

const entryPoints = [
  "src/main.tsx",
  "src/App.tsx",
  "src/pages/Dashboard.tsx",
  "src/pages/Login.tsx",
  "src/components/DynamoProjectsView.tsx",
  "src/lib/api.ts",
  "src/lib/api-amplify.ts",
  "src/utils/fetchWrapper.ts",
];

entryPoints.forEach((entry) => {
  const exists = fs.existsSync(entry);
  const status = exists ? "✅" : "❌";
  console.log(`${status} ${entry}`);

  if (exists) {
    try {
      const content = fs.readFileSync(entry, "utf-8");
      const importCount = (content.match(/import\s+/g) || []).length;
      const exportCount = (content.match(/export\s+/g) || []).length;
      console.log(`     Imports: ${importCount}, Exports: ${exportCount}`);
    } catch (e) {
      console.log(`     Error reading file: ${e.message}`);
    }
  }
});

console.log();

// 4. Check for orphaned files
console.log("🔍 Orphaned Files Analysis:");
console.log("============================");

const orphanedFiles = [];
const tsxFiles = srcFiles.filter(
  (file) => file.endsWith(".tsx") || file.endsWith(".ts"),
);

tsxFiles.forEach((file) => {
  const basename = path.basename(file, path.extname(file));

  // Skip main entry points
  if (basename === "main" || basename === "App") return;

  // Skip type definition files
  if (basename.includes(".d")) return;

  // Skip backup files
  if (basename.includes(".bak") || basename.includes(".backup")) return;

  if (!isFileImported(file, srcFiles)) {
    orphanedFiles.push(file);
  }
});

if (orphanedFiles.length > 0) {
  console.log("❌ Potentially orphaned files (not imported):");
  orphanedFiles.forEach((file) => {
    console.log(`   - ${file}`);
  });
} else {
  console.log("✅ No orphaned files detected");
}

console.log();

// 5. Check critical components
console.log("🧩 Critical Components Check:");
console.log("==============================");

const criticalComponents = [
  "src/components/ActaButtons/ActaButtons.tsx",
  "src/components/DynamoProjectsView.tsx",
  "src/components/PDFPreview.tsx",
  "src/components/EmailInputDialog.tsx",
  "src/components/Header.tsx",
  "src/components/DocumentStatus.tsx",
  "src/components/ProjectTable.tsx",
  "src/components/StatusChip.tsx",
  "src/hooks/useAuth.ts",
  "src/hooks/useAuthContext.tsx",
  "src/contexts/AuthContext.tsx",
];

criticalComponents.forEach((component) => {
  const exists = fs.existsSync(component);
  const status = exists ? "✅" : "❌";
  console.log(`${status} ${component}`);

  if (exists) {
    const imported = isFileImported(component, srcFiles);
    const importStatus = imported ? "✅ Imported" : "❌ Not imported";
    console.log(`     ${importStatus}`);
  }
});

console.log();

// 6. Build size analysis
console.log("📊 Build Size Analysis:");
console.log("========================");

try {
  const buildStats = execSync("du -sh dist/", { encoding: "utf-8" }).trim();
  console.log(`Total build size: ${buildStats.split("\t")[0]}`);

  const jsFiles = distFiles.filter((f) => f.endsWith(".js"));
  const cssFiles = distFiles.filter((f) => f.endsWith(".css"));
  const assetFiles = distFiles.filter(
    (f) => !f.endsWith(".js") && !f.endsWith(".css") && !f.endsWith(".html"),
  );

  console.log(`JavaScript files: ${jsFiles.length}`);
  console.log(`CSS files: ${cssFiles.length}`);
  console.log(`Asset files: ${assetFiles.length}`);

  // Check main bundle size
  const mainBundle = jsFiles.find(
    (f) => f.includes("index-") || f.includes("main-"),
  );
  if (mainBundle) {
    const bundleSize = execSync(`du -sh "${mainBundle}"`, {
      encoding: "utf-8",
    }).trim();
    console.log(`Main bundle size: ${bundleSize.split("\t")[0]}`);
  }
} catch (e) {
  console.log("Error analyzing build size:", e.message);
}

console.log();

// 7. Recommendations
console.log("💡 Recommendations:");
console.log("====================");

const recommendations = [];

if (orphanedFiles.length > 0) {
  recommendations.push(
    `Remove ${orphanedFiles.length} orphaned files to clean up the build`,
  );
}

const missingCritical = criticalComponents.filter((c) => !fs.existsSync(c));
if (missingCritical.length > 0) {
  recommendations.push(
    `${missingCritical.length} critical components are missing`,
  );
}

const notImportedCritical = criticalComponents.filter(
  (c) => fs.existsSync(c) && !isFileImported(c, srcFiles),
);
if (notImportedCritical.length > 0) {
  recommendations.push(
    `${notImportedCritical.length} critical components are not imported`,
  );
}

if (recommendations.length === 0) {
  console.log("✅ No major issues detected!");
} else {
  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });
}

console.log(
  "\n🎯 Build Completeness: " +
    (recommendations.length === 0 ? "GOOD" : "NEEDS ATTENTION"),
);

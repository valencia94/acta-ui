#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Migrating to AWS SDK Direct Access');
console.log('=====================================\n');

// Files to check and update
const srcDir = path.join(__dirname, '..', 'src');

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace old dataService imports with awsDataService
  if (content.includes("from '@/lib/dataService'") || content.includes('from "./lib/dataService"')) {
    content = content.replace(/from ['"]@\/lib\/dataService['"]/g, "from '@/lib/awsDataService'");
    content = content.replace(/from ['"]\.\/lib\/dataService['"]/g, "from './lib/awsDataService'");
    content = content.replace(/from ['"]\.\.\/lib\/dataService['"]/g, "from '../lib/awsDataService'");
    modified = true;
  }

  // Replace any remaining dataService references
  if (content.includes('dataService.') && !content.includes('awsDataService')) {
    console.log(`⚠️  Found direct dataService reference in: ${filePath}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
  }

  return modified;
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
      callback(filePath);
    }
  });
}

let filesUpdated = 0;
walkDir(srcDir, (filePath) => {
  if (updateImports(filePath)) {
    filesUpdated++;
  }
});

console.log(`\n📊 Migration Summary:`);
console.log(`   Files updated: ${filesUpdated}`);
console.log(`\n✅ Migration complete!`);

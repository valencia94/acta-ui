#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Updating components to use AWS SDK directly');
console.log('==============================================\n');

const filesToUpdate = [
  'src/components/AWSDataDashboard.tsx',
  'src/components/PMProjectManager.tsx',
  'src/pages/Dashboard.tsx',
  'src/lib/api.ts'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Update imports from api to awsDataService
  if (content.includes("from '@/lib/api'") || content.includes('from "../lib/api"') || content.includes('from "./api"')) {
    content = content.replace(/from ['"]@\/lib\/api['"]/g, "from '@/lib/awsDataService'");
    content = content.replace(/from ['"]\.\.\/lib\/api['"]/g, "from '../lib/awsDataService'");
    content = content.replace(/from ['"]\.\/api['"]/g, "from './awsDataService'");
    modified = true;
  }
  
  // Also check for any named imports that might need updating
  if (content.includes('import { api }') || content.includes('import api')) {
    console.log(`⚠️  ${file} has direct api imports that may need manual review`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${file}`);
  } else {
    console.log(`ℹ️  No changes needed: ${file}`);
  }
});

console.log('\n📋 Next step: Check if api.ts is still needed or can be removed');

#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying AWS SDK Integration');
console.log('================================\n');

// Key files to check
const filesToCheck = [
  'src/pages/DashboardPM.tsx',
  'src/pages/Projects.tsx',
  'src/components/ProjectTable.tsx',
  'src/lib/awsDataService.ts',
  'src/lib/dataService.ts'
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check what's being imported
  if (content.includes('awsDataService')) {
    console.log(`✅ ${file} - Uses awsDataService`);
  } else if (content.includes('dataService')) {
    console.log(`⚠️  ${file} - Still uses old dataService`);
  } else {
    console.log(`❓ ${file} - No data service imports found`);
  }

  // Check for API Gateway calls
  if (content.includes('execute-api.')) {
    console.log(`   ⚠️  Contains API Gateway references`);
  }

  // Check for direct AWS SDK usage
  if (content.includes('DynamoDBClient') || content.includes('S3Client')) {
    console.log(`   ✅ Uses AWS SDK directly`);
  }
});

console.log('\n📋 Next Steps:');
console.log('1. Ensure all components import from awsDataService');
console.log('2. Remove or rename old dataService.ts');
console.log('3. Test authentication flow');
console.log('4. Monitor network tab for direct AWS calls');

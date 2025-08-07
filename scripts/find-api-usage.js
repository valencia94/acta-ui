#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Finding API Usage in ACTA-UI');
console.log('================================\n');

async function findFiles() {
  try {
    // Find all TypeScript/JavaScript files
    const { stdout } = await execAsync(
      'find src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) 2>/dev/null',
      { cwd: path.join(__dirname, '..') }
    );
    
    const files = stdout.trim().split('\n').filter(Boolean);
    
    console.log(`Found ${files.length} source files to analyze\n`);
    
    // Patterns to search for
    const patterns = {
      dataImports: /import.*['"](.*dataService.*)['"]/g,
      apiCalls: /(getAllProjects|getProjectsByPM|generateActaDocument|getDownloadUrl|getAuthenticatedRequest)\s*\(/g,
      fetchCalls: /fetch\s*\(['"](.*api.*)['"]/gi,
      amplifyAPI: /API\.(get|post|put|delete)\s*\(/g,
      awsSDK: /(DynamoDBClient|S3Client|QueryCommand|ScanCommand)/g
    };
    
    const results = {
      usingAwsDataService: [],
      usingOldDataService: [],
      usingFetch: [],
      usingAmplifyAPI: [],
      usingAwsSDK: []
    };
    
    for (const file of files) {
      const filePath = path.join(__dirname, '..', file);
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = file;
      
      // Check imports
      const importMatches = [...content.matchAll(patterns.dataImports)];
      importMatches.forEach(match => {
        if (match[1].includes('awsDataService')) {
          results.usingAwsDataService.push(relativePath);
        } else if (match[1].includes('dataService')) {
          results.usingOldDataService.push(relativePath);
        }
      });
      
      // Check for direct fetch calls
      if (patterns.fetchCalls.test(content)) {
        results.usingFetch.push(relativePath);
      }
      
      // Check for Amplify API usage
      if (patterns.amplifyAPI.test(content)) {
        results.usingAmplifyAPI.push(relativePath);
      }
      
      // Check for AWS SDK usage
      if (patterns.awsSDK.test(content)) {
        results.usingAwsSDK.push(relativePath);
      }
      
      // Check for API function calls
      if (patterns.apiCalls.test(content)) {
        const apiCalls = [...content.matchAll(patterns.apiCalls)];
        if (apiCalls.length > 0) {
          console.log(`📄 ${relativePath}`);
          apiCalls.forEach(call => {
            console.log(`   - ${call[1]}()`);
          });
        }
      }
    }
    
    // Report findings
    console.log('\n📊 Summary Report:');
    console.log('==================');
    
    console.log(`\n✅ Using awsDataService (${results.usingAwsDataService.length} files):`);
    results.usingAwsDataService.forEach(file => console.log(`   - ${file}`));
    
    if (results.usingOldDataService.length > 0) {
      console.log(`\n❌ Still using old dataService (${results.usingOldDataService.length} files):`);
      results.usingOldDataService.forEach(file => console.log(`   - ${file}`));
    }
    
    if (results.usingFetch.length > 0) {
      console.log(`\n⚠️  Using direct fetch() calls (${results.usingFetch.length} files):`);
      results.usingFetch.forEach(file => console.log(`   - ${file}`));
    }
    
    console.log(`\n🔌 Using Amplify API (${results.usingAmplifyAPI.length} files):`);
    results.usingAmplifyAPI.forEach(file => console.log(`   - ${file}`));
    
    console.log(`\n🚀 Using AWS SDK directly (${results.usingAwsSDK.length} files):`);
    results.usingAwsSDK.forEach(file => console.log(`   - ${file}`));
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (results.usingOldDataService.length > 0) {
      console.log('1. Update imports in files still using old dataService');
    }
    if (results.usingFetch.length > 0) {
      console.log('2. Replace direct fetch() calls with awsDataService methods');
    }
    if (results.usingAmplifyAPI.length === 0 && results.usingAwsSDK.length === 0) {
      console.log('3. No AWS SDK usage detected - ensure awsDataService is being imported and used');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

findFiles();

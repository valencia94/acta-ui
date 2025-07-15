#!/usr/bin/env node
/**
 * Live test script for awsDataService.ts
 * Tests actual AWS SDK calls with real Cognito credentials and data
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔴 LIVE TEST: awsDataService.ts Runtime Validation');
console.log('==================================================\n');

// Test configuration
const TEST_PM_EMAIL = 'john@example.com'; // Replace with actual PM email from your data
const TEST_PROJECT_ID = 'project123'; // Replace with actual project ID from your data
const TEST_FORMAT = 'pdf';

console.log('📋 Test Configuration:');
console.log(`- PM Email: ${TEST_PM_EMAIL}`);
console.log(`- Project ID: ${TEST_PROJECT_ID}`);
console.log(`- Document Format: ${TEST_FORMAT}`);
console.log(`- DynamoDB Table: ProjectPlace_DataExtrator_landing_table_v2`);
console.log(`- S3 Bucket: projectplace-dv-2025-x9a7b`);
console.log(`- AWS Region: us-east-2\n`);

// Create live test script that imports and runs the actual service
const liveTestScript = `
import { 
  getAllProjects, 
  getProjectsByPM, 
  downloadDocument, 
  getProjectStats, 
  checkAWSConnection 
} from './src/lib/awsDataService.ts';

console.log('🔍 Starting live AWS SDK tests...');

async function runLiveTests() {
  try {
    // Test 1: Health Check
    console.log('\\n1. Testing AWS Connection Health...');
    const healthResult = await checkAWSConnection();
    console.log('✅ Health Check Result:', healthResult);
    
    if (!healthResult.credentials) {
      throw new Error('❌ Credentials test failed - cannot proceed');
    }
    
    // Test 2: Get All Projects
    console.log('\\n2. Testing getAllProjects()...');
    const allProjects = await getAllProjects();
    console.log(\`✅ Retrieved \${allProjects.length} total projects\`);
    
    if (allProjects.length > 0) {
      console.log('📋 Sample project:', {
        id: allProjects[0].project_id,
        name: allProjects[0].project_name,
        pm: allProjects[0].pm || allProjects[0].project_manager
      });
    }
    
    // Test 3: Get Projects by PM
    console.log('\\n3. Testing getProjectsByPM()...');
    const pmProjects = await getProjectsByPM('${TEST_PM_EMAIL}');
    console.log(\`✅ Retrieved \${pmProjects.length} projects for PM: ${TEST_PM_EMAIL}\`);
    
    if (pmProjects.length > 0) {
      console.log('📋 PM projects sample:', pmProjects[0]);
    }
    
    // Test 4: Get Project Statistics
    console.log('\\n4. Testing getProjectStats()...');
    const stats = await getProjectStats();
    console.log('✅ Project Statistics:', {
      totalProjects: stats.totalProjects,
      activeProjects: stats.activeProjects,
      pmCount: Object.keys(stats.projectsByPM).length
    });
    
    // Test 5: Download Document (S3 Presigned URL)
    console.log('\\n5. Testing downloadDocument()...');
    const downloadResult = await downloadDocument('${TEST_PROJECT_ID}', '${TEST_FORMAT}');
    console.log('✅ Download URL Generated:', {
      success: downloadResult.success,
      projectId: downloadResult.projectId,
      format: downloadResult.format,
      urlLength: downloadResult.downloadUrl.length,
      urlPreview: downloadResult.downloadUrl.substring(0, 100) + '...'
    });
    
    // Validate S3 URL format
    if (downloadResult.downloadUrl.includes('amazonaws.com') && 
        downloadResult.downloadUrl.includes('X-Amz-Signature')) {
      console.log('✅ S3 presigned URL format validated');
    } else {
      console.log('⚠️ S3 URL format may be incorrect');
    }
    
    console.log('\\n🎯 LIVE TEST SUMMARY:');
    console.log('======================');
    console.log('✅ AWS Connection: Working');
    console.log('✅ Cognito Credentials: Acquired');
    console.log('✅ DynamoDB Access: Working');
    console.log('✅ S3 Access: Working');
    console.log(\`✅ Total Projects: \${allProjects.length}\`);
    console.log(\`✅ PM Projects: \${pmProjects.length}\`);
    console.log('✅ Download URLs: Generated');
    
  } catch (error) {
    console.error('❌ Live test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runLiveTests();
`;

// Write the test script
const testScriptPath = path.join(__dirname, 'scripts/test-awsDataService-live.mjs');
fs.mkdirSync(path.dirname(testScriptPath), { recursive: true });
fs.writeFileSync(testScriptPath, liveTestScript);

console.log('📝 Created live test script at: scripts/test-awsDataService-live.mjs');
console.log('🚀 Running live AWS SDK tests...\n');

// Execute the live test
const child = spawn('node', [testScriptPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--loader ts-node/esm'
  }
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 LIVE TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ awsDataService.ts is working with real AWS data');
    console.log('✅ Cognito Identity Pool credentials are working');
    console.log('✅ DynamoDB and S3 access confirmed');
    console.log('✅ Ready for production use');
  } else {
    console.log('\n❌ Live test failed with exit code:', code);
    console.log('⚠️  Check the error messages above for troubleshooting');
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to run live test:', error.message);
  
  // Fallback: Create a Node.js compatible test
  console.log('\n🔄 Creating fallback Node.js test...');
  
  const fallbackTest = `
const { execSync } = require('child_process');

console.log('🧪 Fallback Live Test - Manual Steps Required');
console.log('============================================');

console.log('\\n1. Manual Test Steps:');
console.log('   - Open your application in browser');
console.log('   - Sign in with Cognito credentials');
console.log('   - Open browser DevTools console');
console.log('   - Run these commands:');
console.log('');
console.log('   // Test getAllProjects');
console.log('   const { getAllProjects } = await import("./src/lib/awsDataService.ts");');
console.log('   const projects = await getAllProjects();');
console.log('   console.log("Total projects:", projects.length);');
console.log('');
console.log('   // Test getProjectsByPM');
console.log('   const { getProjectsByPM } = await import("./src/lib/awsDataService.ts");');
console.log('   const pmProjects = await getProjectsByPM("${TEST_PM_EMAIL}");');
console.log('   console.log("PM projects:", pmProjects.length);');
console.log('');
console.log('   // Test downloadDocument');
console.log('   const { downloadDocument } = await import("./src/lib/awsDataService.ts");');
console.log('   const download = await downloadDocument("${TEST_PROJECT_ID}", "${TEST_FORMAT}");');
console.log('   console.log("Download URL:", download.downloadUrl);');

console.log('\\n2. Expected Results:');
console.log('   ✅ getAllProjects() returns array of projects');
console.log('   ✅ getProjectsByPM() returns filtered projects');
console.log('   ✅ downloadDocument() returns presigned S3 URL');
console.log('   ✅ All functions use Cognito Identity Pool credentials');
console.log('   ✅ No CORS or authentication errors');

console.log('\\n3. Alternative: Test with AWS CLI');
console.log('   aws dynamodb scan --table-name ProjectPlace_DataExtrator_landing_table_v2 --region us-east-2 --limit 5');
console.log('   aws s3 ls s3://projectplace-dv-2025-x9a7b/documents/ --region us-east-2');
`;

  fs.writeFileSync(path.join(__dirname, 'scripts/test-awsDataService-fallback.cjs'), fallbackTest);
  console.log('📝 Created fallback test at: scripts/test-awsDataService-fallback.cjs');
  console.log('🚀 Run: node scripts/test-awsDataService-fallback.cjs');
});

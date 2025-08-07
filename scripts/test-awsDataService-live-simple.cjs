#!/usr/bin/env node
/**
 * Live test for awsDataService.ts using build system
 * Tests actual AWS SDK calls with real data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔴 LIVE TEST: awsDataService.ts Runtime Validation');
console.log('==================================================\n');

// Test configuration
const TEST_PM_EMAIL = 'john@example.com'; // Replace with actual PM email from your data
const TEST_PROJECT_ID = 'project123'; // Replace with actual project ID from your data

console.log('📋 Test Configuration:');
console.log(`- PM Email: ${TEST_PM_EMAIL}`);
console.log(`- Project ID: ${TEST_PROJECT_ID}`);
console.log(`- DynamoDB Table: ProjectPlace_DataExtrator_landing_table_v2`);
console.log(`- S3 Bucket: projectplace-dv-2025-x9a7b`);
console.log(`- AWS Region: us-east-2\n`);

// Create a test HTML file that can be served to test the service
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>AWS Data Service Live Test</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
    .success { color: green; }
    .error { color: red; }
    .info { color: blue; }
    button { margin: 5px; padding: 10px; }
    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>🔴 AWS Data Service Live Test</h1>
  
  <div class="test-section">
    <h2>Test Configuration</h2>
    <ul>
      <li>PM Email: ${TEST_PM_EMAIL}</li>
      <li>Project ID: ${TEST_PROJECT_ID}</li>
      <li>DynamoDB Table: ProjectPlace_DataExtrator_landing_table_v2</li>
      <li>S3 Bucket: projectplace-dv-2025-x9a7b</li>
    </ul>
  </div>
  
  <div class="test-section">
    <h2>Live Tests</h2>
    <button onclick="testHealthCheck()">1. Test Health Check</button>
    <button onclick="testGetAllProjects()">2. Test Get All Projects</button>
    <button onclick="testGetProjectsByPM()">3. Test Get Projects by PM</button>
    <button onclick="testDownloadDocument()">4. Test Download Document</button>
    <button onclick="testGetStats()">5. Test Get Statistics</button>
    <button onclick="runAllTests()">🚀 Run All Tests</button>
  </div>
  
  <div class="test-section">
    <h2>Test Results</h2>
    <div id="results"></div>
  </div>
  
  <script type="module">
    // Import the AWS Data Service (this requires the app to be built)
    import { 
      getAllProjects, 
      getProjectsByPM, 
      downloadDocument, 
      getProjectStats, 
      checkAWSConnection 
    } from './src/lib/awsDataService.ts';
    
    window.awsDataService = {
      getAllProjects,
      getProjectsByPM,
      downloadDocument,
      getProjectStats,
      checkAWSConnection
    };
    
    function log(message, type = 'info') {
      const results = document.getElementById('results');
      const div = document.createElement('div');
      div.className = type;
      div.innerHTML = \`<strong>[\${new Date().toLocaleTimeString()}]</strong> \${message}\`;
      results.appendChild(div);
      results.scrollTop = results.scrollHeight;
    }
    
    window.testHealthCheck = async function() {
      try {
        log('🔍 Testing AWS Connection Health...', 'info');
        const result = await window.awsDataService.checkAWSConnection();
        log(\`✅ Health Check Result: \${JSON.stringify(result, null, 2)}\`, 'success');
        return result;
      } catch (error) {
        log(\`❌ Health Check Failed: \${error.message}\`, 'error');
        return null;
      }
    };
    
    window.testGetAllProjects = async function() {
      try {
        log('📋 Testing getAllProjects()...', 'info');
        const projects = await window.awsDataService.getAllProjects();
        log(\`✅ Retrieved \${projects.length} total projects\`, 'success');
        
        if (projects.length > 0) {
          log(\`📋 Sample project: \${JSON.stringify({
            id: projects[0].project_id,
            name: projects[0].project_name,
            pm: projects[0].pm || projects[0].project_manager
          }, null, 2)}\`, 'info');
        }
        
        return projects;
      } catch (error) {
        log(\`❌ getAllProjects() Failed: \${error.message}\`, 'error');
        return null;
      }
    };
    
    window.testGetProjectsByPM = async function() {
      try {
        log(\`📋 Testing getProjectsByPM(\${TEST_PM_EMAIL})...\`, 'info');
        const projects = await window.awsDataService.getProjectsByPM('${TEST_PM_EMAIL}');
        log(\`✅ Retrieved \${projects.length} projects for PM: ${TEST_PM_EMAIL}\`, 'success');
        
        if (projects.length > 0) {
          log(\`📋 PM projects sample: \${JSON.stringify(projects[0], null, 2)}\`, 'info');
        }
        
        return projects;
      } catch (error) {
        log(\`❌ getProjectsByPM() Failed: \${error.message}\`, 'error');
        return null;
      }
    };
    
    window.testDownloadDocument = async function() {
      try {
        log(\`📥 Testing downloadDocument(\${TEST_PROJECT_ID}, 'pdf')...\`, 'info');
        const result = await window.awsDataService.downloadDocument('${TEST_PROJECT_ID}', 'pdf');
        log(\`✅ Download URL Generated: \${JSON.stringify({
          success: result.success,
          projectId: result.projectId,
          format: result.format,
          urlLength: result.downloadUrl.length,
          urlPreview: result.downloadUrl.substring(0, 100) + '...'
        }, null, 2)}\`, 'success');
        
        // Validate S3 URL format
        if (result.downloadUrl.includes('amazonaws.com') && 
            result.downloadUrl.includes('X-Amz-Signature')) {
          log('✅ S3 presigned URL format validated', 'success');
        } else {
          log('⚠️ S3 URL format may be incorrect', 'error');
        }
        
        return result;
      } catch (error) {
        log(\`❌ downloadDocument() Failed: \${error.message}\`, 'error');
        return null;
      }
    };
    
    window.testGetStats = async function() {
      try {
        log('📊 Testing getProjectStats()...', 'info');
        const stats = await window.awsDataService.getProjectStats();
        log(\`✅ Project Statistics: \${JSON.stringify({
          totalProjects: stats.totalProjects,
          activeProjects: stats.activeProjects,
          pmCount: Object.keys(stats.projectsByPM).length
        }, null, 2)}\`, 'success');
        
        return stats;
      } catch (error) {
        log(\`❌ getProjectStats() Failed: \${error.message}\`, 'error');
        return null;
      }
    };
    
    window.runAllTests = async function() {
      log('🚀 Starting comprehensive live tests...', 'info');
      log('=' + '='.repeat(50), 'info');
      
      const results = {
        health: await window.testHealthCheck(),
        allProjects: await window.testGetAllProjects(),
        pmProjects: await window.testGetProjectsByPM(),
        download: await window.testDownloadDocument(),
        stats: await window.testGetStats()
      };
      
      log('=' + '='.repeat(50), 'info');
      log('🎯 LIVE TEST SUMMARY:', 'info');
      log('======================', 'info');
      log(\`✅ AWS Connection: \${results.health ? 'Working' : 'Failed'}\`, results.health ? 'success' : 'error');
      log(\`✅ Cognito Credentials: \${results.health?.credentials ? 'Acquired' : 'Failed'}\`, results.health?.credentials ? 'success' : 'error');
      log(\`✅ DynamoDB Access: \${results.health?.dynamodb ? 'Working' : 'Failed'}\`, results.health?.dynamodb ? 'success' : 'error');
      log(\`✅ S3 Access: \${results.health?.s3 ? 'Working' : 'Failed'}\`, results.health?.s3 ? 'success' : 'error');
      log(\`✅ Total Projects: \${results.allProjects?.length || 0}\`, results.allProjects ? 'success' : 'error');
      log(\`✅ PM Projects: \${results.pmProjects?.length || 0}\`, results.pmProjects ? 'success' : 'error');
      log(\`✅ Download URLs: \${results.download?.success ? 'Generated' : 'Failed'}\`, results.download?.success ? 'success' : 'error');
      
      const allPassed = results.health && results.allProjects && results.stats;
      log(\`\\n🎉 OVERALL RESULT: \${allPassed ? 'SUCCESS' : 'PARTIAL/FAILED'}\`, allPassed ? 'success' : 'error');
      
      return results;
    };
    
    // Auto-run tests when page loads
    window.addEventListener('load', () => {
      log('🔴 AWS Data Service Live Test Started', 'info');
      log('Ready to run tests. Click buttons above or check browser console.', 'info');
    });
  </script>
</body>
</html>
`;

// Write the test HTML file
const testHtmlPath = path.join(__dirname, 'test-awsDataService-live.html');
fs.writeFileSync(testHtmlPath, testHtml);

console.log('📝 Created live test HTML at: test-awsDataService-live.html');
console.log('');
console.log('🚀 LIVE TEST INSTRUCTIONS:');
console.log('===========================');
console.log('');
console.log('1. Build the application:');
console.log('   pnpm build');
console.log('');
console.log('2. Start the dev server:');
console.log('   pnpm dev');
console.log('');
console.log('3. Open the test page:');
console.log('   http://localhost:5173/test-awsDataService-live.html');
console.log('');
console.log('4. Sign in with your Cognito credentials');
console.log('');
console.log('5. Click "🚀 Run All Tests" to validate live functionality');
console.log('');
console.log('📋 Expected Results:');
console.log('- ✅ Health Check: { dynamodb: true, s3: true, credentials: true }');
console.log('- ✅ All Projects: Array of project objects from DynamoDB');
console.log('- ✅ PM Projects: Filtered projects for specific PM');
console.log('- ✅ Download URLs: Valid S3 presigned URLs');
console.log('- ✅ Statistics: Aggregated project data');
console.log('');
console.log('💡 Alternative: Open browser DevTools and run:');
console.log('   window.runAllTests()');
console.log('');

// Try to automatically start the dev server
try {
  console.log('🔄 Starting development server...');
  const child = execSync('pnpm dev', { stdio: 'inherit', timeout: 5000 });
} catch (error) {
  console.log('⚠️  Could not auto-start dev server. Please run manually:');
  console.log('   pnpm dev');
}

console.log('');
console.log('✅ Live test setup complete!');
console.log('🌐 Navigate to: http://localhost:5173/test-awsDataService-live.html');

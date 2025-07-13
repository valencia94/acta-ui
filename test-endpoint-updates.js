#!/usr/bin/env node

// Test the updated API endpoints
import { getProjectsByPM, getAllProjects } from './src/lib/api.js';

async function testUpdatedEndpoints() {
  console.log('🧪 Testing Updated API Endpoints');
  console.log('================================');
  console.log(`Date: ${new Date().toLocaleDateString()}`);
  console.log(`Time: ${new Date().toLocaleTimeString()}`);
  console.log();

  let testsPassed = 0;
  let totalTests = 0;

  function runTest(testName, testFunction) {
    totalTests++;
    console.log(`🔍 ${testName}...`);
    
    return testFunction()
      .then(result => {
        if (result) {
          console.log(`✅ ${testName}: PASS`);
          testsPassed++;
        } else {
          console.log(`❌ ${testName}: FAIL`);
        }
      })
      .catch(error => {
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
      });
  }

  // Test 1: Verify /projects endpoint is being used
  await runTest('Projects Endpoint Configuration', async () => {
    try {
      // This should fail without authentication, but we're testing the endpoint structure
      await getProjectsByPM('test@example.com', false);
      return false; // Should not reach here without auth
    } catch (error) {
      // Check if the error is from the correct endpoint
      const errorStr = error.toString();
      const isCorrectEndpoint = errorStr.includes('/projects') && !errorStr.includes('/pm-manager');
      console.log(`  - Using correct endpoint: ${isCorrectEndpoint ? '✅' : '❌'}`);
      console.log(`  - Error: ${error.message}`);
      return isCorrectEndpoint;
    }
  });

  // Test 2: Verify getAllProjects uses /projects
  await runTest('All Projects Endpoint Configuration', async () => {
    try {
      await getAllProjects();
      return false; // Should not reach here without auth
    } catch (error) {
      const errorStr = error.toString();
      const isCorrectEndpoint = errorStr.includes('/projects') && !errorStr.includes('/pm-manager');
      console.log(`  - Using correct endpoint: ${isCorrectEndpoint ? '✅' : '❌'}`);
      console.log(`  - Error: ${error.message}`);
      return isCorrectEndpoint;
    }
  });

  console.log();
  console.log('═══════════════════════════════════════');
  console.log('🎯 ENDPOINT UPDATE TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${totalTests - testsPassed}`);
  console.log(`Success Rate: ${Math.round((testsPassed / totalTests) * 100)}%`);
  console.log();

  if (testsPassed === totalTests) {
    console.log('🎉 ALL ENDPOINT UPDATES SUCCESSFUL!');
    console.log('✅ The frontend is now using the new production-hardened API endpoints!');
    console.log();
    console.log('Next steps:');
    console.log('1. Deploy the updated frontend');
    console.log('2. Test with live authentication');
    console.log('3. Verify dashboard loads project data');
    console.log();
  } else {
    console.log('⚠️ Some endpoint configurations need attention.');
  }
}

testUpdatedEndpoints().catch(console.error);

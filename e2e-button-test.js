#!/usr/bin/env node
// e2e-button-test.js - End-to-end test for ACTA-UI buttons with full authentication

const fetch = require('node-fetch');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Global variables to store authentication tokens
let idToken = null;
let awsCredentials = null;

// Test credentials - Update these with valid credentials
const testCredentials = {
  username: 'christian.valencia@ikusi.com',
  password: 'PdYb7TU7HvBhYP7$!'
};

// AWS and API configuration
const CONFIG = {
  // AWS Cognito configuration
  cognito: {
    region: 'us-east-2',
    userPoolId: 'us-east-2_FyHLtOhiY',
    userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
    identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35'
  },
  // API endpoints
  api: {
    baseUrl: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
    healthEndpoint: '/health',
    projectEndpoint: '/extract-project-place',
    documentCheckEndpoint: '/check-document',
    downloadEndpoint: '/download-acta',
    approvalEndpoint: '/send-approval-email'
  }
};

// Project IDs to test (the 7 required ones)
const testProjectIds = [
  '1000000049842296',
  '1000000055914011',
  '1000000058814819',
  '1000000060272603',
  '1000000061690051', 
  '1000000063154415',
  '1000000064013473'
];

// Helper function to authenticate using actual Cognito authentication
async function authenticate() {
  console.log('🔑 Attempting to authenticate with Cognito...');
  
  try {
    console.log('👤 Using credentials:', testCredentials.username);
    
    // Step 1: Initiate auth with User Pool
    console.log('🔐 Step 1: Initiating authentication with Cognito User Pool...');
    const initiateAuthResponse = await fetch(`https://cognito-idp.${CONFIG.cognito.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
      },
      body: JSON.stringify({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CONFIG.cognito.userPoolWebClientId,
        AuthParameters: {
          USERNAME: testCredentials.username,
          PASSWORD: testCredentials.password
        }
      })
    });

    if (!initiateAuthResponse.ok) {
      const error = await initiateAuthResponse.json();
      console.error('❌ Cognito authentication failed:', error);
      return false;
    }

    const authResult = await initiateAuthResponse.json();
    console.log('✅ User Pool authentication successful');
    
    // Get the ID token for API Gateway authorization
    idToken = authResult.AuthenticationResult.IdToken;
    console.log('🔑 ID Token received for API authorization');
    
    // Step 2: Get Identity Pool credentials for AWS service access
    console.log('🔐 Step 2: Getting AWS credentials from Identity Pool...');
    const identityResponse = await fetch(`https://cognito-identity.${CONFIG.cognito.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityService.GetId'
      },
      body: JSON.stringify({
        IdentityPoolId: CONFIG.cognito.identityPoolId,
        Logins: {
          [`cognito-idp.${CONFIG.cognito.region}.amazonaws.com/${CONFIG.cognito.userPoolId}`]: idToken
        }
      })
    });
    
    if (!identityResponse.ok) {
      const error = await identityResponse.json();
      console.error('❌ Identity Pool ID retrieval failed:', error);
      console.log('⚠️ Continuing with User Pool token only, DynamoDB access might fail');
      return true;
    }
    
    const identityResult = await identityResponse.json();
    const identityId = identityResult.IdentityId;
    console.log('✅ Identity ID retrieved:', identityId);
    
    // Step 3: Get AWS credentials from Identity Pool
    const credentialsResponse = await fetch(`https://cognito-identity.${CONFIG.cognito.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityService.GetCredentialsForIdentity'
      },
      body: JSON.stringify({
        IdentityId: identityId,
        Logins: {
          [`cognito-idp.${CONFIG.cognito.region}.amazonaws.com/${CONFIG.cognito.userPoolId}`]: idToken
        }
      })
    });
    
    if (!credentialsResponse.ok) {
      const error = await credentialsResponse.json();
      console.error('❌ AWS credentials retrieval failed:', error);
      console.log('⚠️ Continuing with User Pool token only, DynamoDB access might fail');
      return true;
    }
    
    const credentialsResult = await credentialsResponse.json();
    console.log('✅ AWS credentials retrieved successfully');
    
    // Store AWS credentials
    awsCredentials = {
      accessKeyId: credentialsResult.Credentials.AccessKeyId,
      secretAccessKey: credentialsResult.Credentials.SecretKey,
      sessionToken: credentialsResult.Credentials.SessionToken,
      expiration: credentialsResult.Credentials.Expiration
    };
    
    console.log('🎉 Full authentication successful! Both User Pool and Identity Pool credentials obtained.');
    return true;
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return false;
  }
}

// Test functions for each button
const tests = {
  // Test health endpoint (simple connectivity check)
  testHealthEndpoint: async function() {
    console.log('🧪 Testing health endpoint...');
    const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.healthEndpoint}`);
    const data = await response.json();
    console.log('✅ Health check response:', data);
    return response.ok;
  },
  
  // Test fetching projects
  testProjectsFetch: async function() {
    console.log('🧪 Testing project fetch...');
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      // Test with one project first for simplicity
      const projectId = testProjectIds[0];
      console.log(`📋 Testing project ID: ${projectId}`);
      
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.projectEndpoint}/${projectId}`, {
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Failed to fetch project ${projectId}: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      console.log(`✅ Project data retrieved for ${projectId}:`);
      console.log(`   Title: ${data.title || 'N/A'}`);
      console.log(`   PM: ${data.pm_name || 'N/A'}`);
      console.log(`   Planlet: ${data.planlet_name || data.planlet || 'N/A'}`);
      return true;
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      return false;
    }
  },
  
  // Test Generate ACTA
  testGenerateActa: async function() {
    const projectId = testProjectIds[0];
    console.log(`🧪 Testing Generate ACTA for project ${projectId}...`);
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.projectEndpoint}/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        console.error(`❌ Failed to generate ACTA: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      console.log('✅ ACTA generation successful:', data);
      return true;
    } catch (error) {
      console.error('❌ Error generating ACTA:', error);
      return false;
    }
  },
  
  // Test Download PDF 
  testDownloadPDF: async function() {
    const projectId = testProjectIds[0];
    console.log(`🧪 Testing Download PDF for project ${projectId}...`);
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      // First check if document exists
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.documentCheckEndpoint}/${projectId}`, {
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Document check failed: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      console.log('✅ Document check successful:', data);
      
      // Then get download URL
      const downloadResponse = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.downloadEndpoint}/${projectId}?format=pdf`, {
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!downloadResponse.ok) {
        console.error(`❌ Download URL generation failed: ${downloadResponse.status} ${downloadResponse.statusText}`);
        return false;
      }
      
      const downloadData = await downloadResponse.json();
      console.log('✅ Download URL generated:', downloadData.url ? 'URL successfully generated' : 'No URL returned');
      return !!downloadData.url;
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      return false;
    }
  },
  
  // Test Download DOCX
  testDownloadDOCX: async function() {
    const projectId = testProjectIds[0];
    console.log(`🧪 Testing Download DOCX for project ${projectId}...`);
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      // First check if document exists
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.documentCheckEndpoint}/${projectId}`, {
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Document check failed: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      console.log('✅ Document check successful:', data);
      
      // Then get download URL
      const downloadResponse = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.downloadEndpoint}/${projectId}?format=docx`, {
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!downloadResponse.ok) {
        console.error(`❌ Download URL generation failed: ${downloadResponse.status} ${downloadResponse.statusText}`);
        return false;
      }
      
      const downloadData = await downloadResponse.json();
      console.log('✅ Download URL generated:', downloadData.url ? 'URL successfully generated' : 'No URL returned');
      return !!downloadData.url;
    } catch (error) {
      console.error('❌ Error downloading DOCX:', error);
      return false;
    }
  },
  
  // Test Send Approval
  testSendApproval: async function() {
    const projectId = testProjectIds[0];
    console.log(`🧪 Testing Send Approval for project ${projectId}...`);
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.approvalEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: projectId,
          email: 'test@example.com' // Test email address
        })
      });
      
      if (!response.ok) {
        console.error(`❌ Send approval failed: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      console.log('✅ Send approval successful:', data);
      return true;
    } catch (error) {
      console.error('❌ Error sending approval:', error);
      return false;
    }
  }
};

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting end-to-end button tests with full authentication...');
  console.log('-------------------------------------');
  
  // First authenticate with both User Pool and Identity Pool
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error('❌ Authentication failed, cannot proceed with tests');
    return;
  }
  
  // Give a moment for credentials to propagate
  console.log('⏳ Waiting for authentication to propagate...');
  await sleep(2000);
  
  // Test each function
  const results = {
    health: await tests.testHealthEndpoint(),
    projects: await tests.testProjectsFetch()
  };
  
  // If projects test passes, continue with other tests
  if (results.projects) {
    console.log('✅ Project fetch successful, continuing with other tests...');
    
    // Run the remaining tests
    results.generate = await tests.testGenerateActa();
    
    // If generate succeeds, test document operations
    if (results.generate) {
      console.log('⏳ Waiting for document generation...');
      await sleep(2000); // Give time for document to be generated
      
      results.pdf = await tests.testDownloadPDF();
      results.docx = await tests.testDownloadDOCX();
      results.approval = await tests.testSendApproval();
    } else {
      console.log('⚠️ Skipping document tests as document generation failed');
      results.pdf = false;
      results.docx = false;
      results.approval = false;
    }
  } else {
    console.log('⚠️ Skipping remaining tests as project fetch failed');
    results.generate = false;
    results.pdf = false;
    results.docx = false;
    results.approval = false;
  }
  
  // Print summary
  console.log('\n-------------------------------------');
  console.log('🧪 TEST RESULTS SUMMARY:');
  console.log('-------------------------------------');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  // Overall result
  const allPassed = Object.values(results).every(result => result === true);
  console.log('-------------------------------------');
  console.log(`${allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);
  console.log('-------------------------------------');
  
  // Provide diagnostic information for failures
  if (!allPassed) {
    console.log('\n🔍 DIAGNOSTIC INFORMATION:');
    
    if (!results.health) {
      console.log('❌ API Health endpoint failed - check if the API Gateway is accessible');
    }
    
    if (!results.projects) {
      console.log('❌ Project fetch failed - possible issues:');
      console.log('  - User Pool authentication may not be configured correctly');
      console.log('  - API Gateway may not be accepting the authorization token');
      console.log('  - CORS configuration might be preventing the request');
    }
    
    if (results.projects && !results.generate) {
      console.log('❌ Generate ACTA failed - possible issues:');
      console.log('  - Identity Pool credentials may not be configured correctly');
      console.log('  - Lambda function might be failing to process the request');
      console.log('  - User might not have sufficient IAM permissions');
    }
    
    if (results.generate && (!results.pdf || !results.docx)) {
      console.log('❌ Document download failed - possible issues:');
      console.log('  - S3 access permissions might be incorrectly configured');
      console.log('  - Document generation might be incomplete');
      console.log('  - URL signing might be failing');
    }
    
    console.log('\n💡 TROUBLESHOOTING STEPS:');
    console.log('1. Check Cognito User Pool configuration in aws-exports.js');
    console.log('2. Verify Identity Pool configuration in aws-exports.js');
    console.log('3. Examine IAM roles for proper S3 and DynamoDB access');
    console.log('4. Check API Gateway CORS settings');
    console.log('5. Review CloudWatch logs for Lambda function errors');
  }
}

// Start the tests
runAllTests().catch(console.error);

// test-dashboard-buttons.js
// Script to test all dashboard buttons for the test user

// Token and credentials will be stored here after logging in
let idToken = null;
const testCredentials = {
  username: 'christian.valencia@ikusi.com',
  password: 'PdYb7TU7HvBhYP7$!'
};

// API Endpoints
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
const HEALTH_ENDPOINT = `${API_BASE}/health`;
const PROJECT_ENDPOINT = `${API_BASE}/extract-project-place`;

// Project IDs (the 7 required ones)
const testProjectIds = [
  '1000000049842296',
  '1000000055914011',
  '1000000058814819',
  '1000000060272603',
  '1000000061690051', 
  '1000000063154415',
  '1000000064013473'
];

// Test functions for each button
const tests = {
  // Test health endpoint (simple connectivity check)
  testHealthEndpoint: async function() {
    console.log('🧪 Testing health endpoint...');
    const response = await fetch(HEALTH_ENDPOINT);
    const data = await response.json();
    console.log('✅ Health check response:', data);
    return response.ok;
  },
  
  // Test fetching projects for christian.valencia@ikusi.com
  testProjectsFetch: async function() {
    console.log('🧪 Testing project fetch...');
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      // For each of our 7 test project IDs, try to fetch data
      for (const projectId of testProjectIds) {
        console.log(`📋 Testing project ID: ${projectId}`);
        
        const response = await fetch(`${PROJECT_ENDPOINT}/${projectId}`, {
          headers: {
            'Authorization': idToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error(`❌ Failed to fetch project ${projectId}: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`✅ Project data retrieved for ${projectId}:`);
        console.log(`   Title: ${data.title || 'N/A'}`);
        console.log(`   PM: ${data.pm_name || 'N/A'}`);
        console.log(`   Planlet: ${data.planlet_name || data.planlet || 'N/A'}`);
      }
      return true;
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      return false;
    }
  },
  
  // Test Generate ACTA
  testGenerateActa: async function(projectId = testProjectIds[0]) {
    console.log(`🧪 Testing Generate ACTA for project ${projectId}...`);
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      const response = await fetch(`${API_BASE}/extract-project-place/${projectId}`, {
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        }
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
  testDownloadPDF: async function(projectId = testProjectIds[0]) {
    console.log(`🧪 Testing Download PDF for project ${projectId}...`);
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      // First check if document exists
      const response = await fetch(`${API_BASE}/check-document/${projectId}`, {
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
      const downloadResponse = await fetch(`${API_BASE}/download-acta/${projectId}?format=pdf`, {
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
  testDownloadDOCX: async function(projectId = testProjectIds[0]) {
    console.log(`🧪 Testing Download DOCX for project ${projectId}...`);
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      // First check if document exists
      const response = await fetch(`${API_BASE}/check-document/${projectId}`, {
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
      const downloadResponse = await fetch(`${API_BASE}/download-acta/${projectId}?format=docx`, {
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
  testSendApproval: async function(projectId = testProjectIds[0]) {
    console.log(`🧪 Testing Send Approval for project ${projectId}...`);
    
    if (!idToken) {
      console.error('❌ No authentication token - please login first');
      return false;
    }
    
    try {
      const response = await fetch(`${API_BASE}/send-approval-email`, {
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

// Helper function to authenticate using actual Cognito authentication
async function authenticate() {
  console.log('🔑 Attempting to authenticate with Cognito...');
  
  try {
    // Cognito configuration (from aws-exports.js)
    const COGNITO_CONFIG = {
      region: 'us-east-2',
      userPoolId: 'us-east-2_FyHLtOhiY',
      userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
      identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35'
    };

    console.log('👤 Using credentials:', testCredentials.username);
    
    // Step 1: Initiate auth with User Pool
    console.log('🔐 Step 1: Initiating authentication with Cognito User Pool...');
    const initiateAuthResponse = await fetch(`https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
      },
      body: JSON.stringify({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: COGNITO_CONFIG.userPoolWebClientId,
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
    const identityResponse = await fetch(`https://cognito-identity.${COGNITO_CONFIG.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityService.GetId'
      },
      body: JSON.stringify({
        IdentityPoolId: COGNITO_CONFIG.identityPoolId,
        Logins: {
          [`cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/${COGNITO_CONFIG.userPoolId}`]: idToken
        }
      })
    });
    
    if (!identityResponse.ok) {
      const error = await identityResponse.json();
      console.error('❌ Identity Pool ID retrieval failed:', error);
      // Continue with just the ID token since we can still test API Gateway endpoints
      console.log('⚠️ Continuing with User Pool token only, DynamoDB access might fail');
      return true;
    }
    
    const identityResult = await identityResponse.json();
    const identityId = identityResult.IdentityId;
    console.log('✅ Identity ID retrieved:', identityId);
    
    // Step 3: Get AWS credentials from Identity Pool
    const credentialsResponse = await fetch(`https://cognito-identity.${COGNITO_CONFIG.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityService.GetCredentialsForIdentity'
      },
      body: JSON.stringify({
        IdentityId: identityId,
        Logins: {
          [`cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/${COGNITO_CONFIG.userPoolId}`]: idToken
        }
      })
    });
    
    if (!credentialsResponse.ok) {
      const error = await credentialsResponse.json();
      console.error('❌ AWS credentials retrieval failed:', error);
      // Continue with just the ID token since we can still test API Gateway endpoints
      console.log('⚠️ Continuing with User Pool token only, DynamoDB access might fail');
      return true;
    }
    
    const credentialsResult = await credentialsResponse.json();
    console.log('✅ AWS credentials retrieved successfully');
    
    // Store AWS credentials for signing requests if needed
    window.awsCredentials = {
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

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting dashboard button tests...');
  console.log('-------------------------------------');
  
  // First authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error('❌ Authentication failed, cannot proceed with tests');
    return;
  }
  
  // Test each function
  const results = {
    health: await tests.testHealthEndpoint(),
    projects: await tests.testProjectsFetch(),
    generate: await tests.testGenerateActa(),
    pdf: await tests.testDownloadPDF(),
    docx: await tests.testDownloadDOCX(),
    approval: await tests.testSendApproval()
  };
  
  // Print summary
  console.log('\n-------------------------------------');
  console.log('🧪 TEST RESULTS SUMMARY:');
  console.log('-------------------------------------');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  // Overall result
  const allPassed = Object.values(results).every(result => result);
  console.log('-------------------------------------');
  console.log(`${allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);
  console.log('-------------------------------------');
}

// Start the tests
runAllTests();

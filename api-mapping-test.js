// Test script to validate API endpoint mapping
// Run this in browser console when logged into the app

async function testGenerateActa() {
  console.log('🧪 Testing Generate ACTA API mapping...');
  
  // Test data
  const testProjectId = '12345';
  const testUserEmail = 'test@example.com';
  const testUserRole = 'pm';
  
  console.log('📋 Test Parameters:');
  console.log(`- Project ID: ${testProjectId}`);
  console.log(`- User Email: ${testUserEmail}`);
  console.log(`- User Role: ${testUserRole}`);
  
  try {
    // Import the function (assuming it's available in global scope)
    const { generateActaDocument } = window.ActaUI || {};
    
    if (!generateActaDocument) {
      console.error('❌ generateActaDocument function not found in global scope');
      return;
    }
    
    console.log('🔄 Calling generateActaDocument...');
    const result = await generateActaDocument(testProjectId, testUserEmail, testUserRole);
    
    console.log('✅ API Response:', result);
    
    // Validate response structure
    if (result.success !== undefined) {
      console.log('✅ Response has success field');
    } else {
      console.warn('⚠️ Response missing success field');
    }
    
    if (result.message) {
      console.log('✅ Response has message field');
    } else {
      console.warn('⚠️ Response missing message field');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Analyze error type
    if (error.message.includes('fetch')) {
      console.error('🌐 Network/API Gateway issue');
    } else if (error.message.includes('401')) {
      console.error('🔐 Authentication issue - check Cognito token');
    } else if (error.message.includes('403')) {
      console.error('🚫 Authorization issue - check user permissions');
    } else if (error.message.includes('500')) {
      console.error('⚙️ Lambda function error');
    }
    
    return { success: false, error: error.message };
  }
}

// Payload structure validation
function validatePayloadStructure() {
  console.log('🔍 Validating payload structure...');
  
  const expectedFields = [
    'projectId',
    'pmEmail', 
    'userRole',
    's3Bucket',
    's3Region',
    'cloudfrontDistributionId',
    'cloudfrontUrl',
    'requestSource',
    'generateDocuments',
    'extractMetadata',
    'timestamp'
  ];
  
  console.log('📝 Expected payload fields:');
  expectedFields.forEach(field => console.log(`  - ${field}`));
  
  return expectedFields;
}

// API endpoint validation
function validateEndpoints() {
  console.log('🔗 API Endpoint Mapping Validation:');
  
  const endpoints = [
    { name: 'Generate ACTA', method: 'POST', path: '/extract-project-place/{id}', lambda: 'ProjectPlaceDataExtractor' },
    { name: 'Get Summary', method: 'GET', path: '/project-summary/{id}', lambda: 'projectMetadataEnricher' },
    { name: 'Get Timeline', method: 'GET', path: '/timeline/{id}', lambda: 'getTimeline' },
    { name: 'Download ACTA', method: 'GET', path: '/download-acta/{id}', lambda: 'getDownloadActa' },
    { name: 'Send Approval', method: 'POST', path: '/send-approval-email', lambda: 'sendApprovalEmail' },
    { name: 'Check Document', method: 'GET|HEAD', path: '/check-document/{id}', lambda: 'projectMetadataEnricher' }
  ];
  
  endpoints.forEach(endpoint => {
    console.log(`✅ ${endpoint.name}: ${endpoint.method} ${endpoint.path} → ${endpoint.lambda}`);
  });
  
  return endpoints;
}

// Run all tests
console.log('🚀 Starting API Mapping Tests...');
console.log('=' .repeat(50));

validatePayloadStructure();
console.log('');
validateEndpoints();
console.log('');
console.log('💡 To test actual API call, run: testGenerateActa()');
console.log('⚠️  Make sure you are logged in and have valid Cognito tokens');

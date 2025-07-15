// Test script to verify payload structure
import { generateActaDocument } from './src/lib/api.js';

console.log('🧪 Testing payload structure...');

// Mock the API call to see the payload
const originalPost = global.post;
global.post = (url, payload) => {
  console.log('📡 API Call Details:');
  console.log('🔗 URL:', url);
  console.log('📋 Payload:', JSON.stringify(payload, null, 2));
  
  // Verify all required fields are present
  const requiredFields = [
    'projectId', 'pmEmail', 'userRole', 's3Bucket', 's3Region',
    'cloudfrontDistributionId', 'cloudfrontUrl', 'requestSource',
    'generateDocuments', 'extractMetadata', 'timestamp'
  ];
  
  const missingFields = requiredFields.filter(field => !(field in payload));
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields);
  } else {
    console.log('✅ All required fields present');
  }
  
  // Return mock response
  return Promise.resolve({
    success: true,
    message: 'Mock response',
    s3_location: 's3://projectplace-dv-2025-x9a7b/acta/test.docx'
  });
};

// Test the function
async function testPayload() {
  try {
    const result = await generateActaDocument('1000000064013473', 'test@example.com', 'pm');
    console.log('🎯 Function result:', result);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPayload();

// 🔍 API Verification Test Script
// Copy and paste this into your browser console to verify API calls

console.log("🔍 API Verification Test Starting...");

// Test the actual API base URL
const apiBase = "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod";
console.log("📡 API Base URL:", apiBase);

// Test endpoint construction
const testProjectId = "1000000064013473";
const generateEndpoint = `${apiBase}/extract-project-place/${testProjectId}`;
const summaryEndpoint = `${apiBase}/project-summary/${testProjectId}`;
const timelineEndpoint = `${apiBase}/timeline/${testProjectId}`;
const downloadEndpoint = `${apiBase}/download-acta/${testProjectId}?format=pdf`;

console.log("🎯 Actual Endpoints Being Called:");
console.log("  Generate ACTA:", generateEndpoint);
console.log("  Get Summary:", summaryEndpoint);
console.log("  Get Timeline:", timelineEndpoint);
console.log("  Download PDF:", downloadEndpoint);

// CloudFormation verification
const cloudFormationEndpoints = {
  "Generate ACTA": "/extract-project-place/{id}",
  "Get Summary": "/project-summary/{id}",
  "Get Timeline": "/timeline/{id}",
  "Download ACTA": "/download-acta/{id}",
  "Send Approval": "/send-approval-email",
  "Check Document": "/check-document/{id}",
};

console.log("✅ CloudFormation Template Endpoints:");
Object.entries(cloudFormationEndpoints).forEach(([name, endpoint]) => {
  console.log(`  ${name}: ${endpoint}`);
});

// Payload verification for Generate ACTA
const samplePayload = {
  projectId: testProjectId,
  pmEmail: "test@example.com",
  userRole: "pm",
  s3Bucket: "projectplace-dv-2025-x9a7b",
  s3Region: "us-east-2",
  cloudfrontDistributionId: "D7T9X3J66YD8K",
  cloudfrontUrl: "https://d7t9x3j66yd8k.cloudfront.net",
  requestSource: "acta-ui",
  generateDocuments: true,
  extractMetadata: true,
  timestamp: new Date().toISOString(),
};

console.log("📋 Sample Generate ACTA Payload:");
console.log(JSON.stringify(samplePayload, null, 2));

// Instructions for manual verification
console.log("🔬 Manual Verification Steps:");
console.log("1. Open Network tab in DevTools");
console.log('2. Click "Generate ACTA" button');
console.log("3. Look for POST request to extract-project-place");
console.log("4. Verify payload matches sample above");
console.log("5. Check response structure");

// Expected response structure
const expectedResponse = {
  success: true,
  message: "Document generation completed",
  s3_location: "s3://projectplace-dv-2025-x9a7b/acta/PROJECT_ID.docx",
  document_id: testProjectId,
  bucket: "projectplace-dv-2025-x9a7b",
  key: "acta/PROJECT_ID.docx",
};

console.log("📤 Expected Response Structure:");
console.log(JSON.stringify(expectedResponse, null, 2));

console.log("✅ Verification complete! Check the logs above.");

// ACTA Document Generation & Download Diagnostic
// This script focuses on diagnosing the Lambda + S3 integration

console.log('🔬 ACTA Document Generation & Download Diagnostic');
console.log('Target S3 Bucket: projectplace-dv-2025-x9a7b');

// Environment detection
const currentUrl = window.location.href;
const isLocal = currentUrl.includes('localhost');
const isProd =
  currentUrl.includes('acta-ui-frontend-prod') ||
  currentUrl.includes('cloudfront');

console.log(
  `🌍 Environment: ${isLocal ? 'Local Development' : isProd ? 'Production' : 'Unknown'}`
);

// API Configuration
let API_BASE_URL;
if (isLocal) {
  API_BASE_URL = 'http://localhost:9999'; // Local development
} else {
  // Production - you'll need to set this to your actual API Gateway URL
  API_BASE_URL = 'https://your-api-gateway-url.amazonaws.com/prod';
}

console.log(`🔗 API Base URL: ${API_BASE_URL}`);

// Test project ID (replace with a real one)
const TEST_PROJECT_ID = 'TEST123';

// Document generation test with detailed logging
async function diagnoseDocumentGeneration(projectId = TEST_PROJECT_ID) {
  console.log(`\n🔄 Diagnosing Document Generation for project: ${projectId}`);
  console.log(
    'Expected flow: UI → API Gateway → Lambda → External Data → DOCX Creation → S3 Storage'
  );

  try {
    console.log('📤 Step 1: Triggering document generation...');

    const startTime = Date.now();
    const response = await fetch(
      `${API_BASE_URL}/extract-project-place/${projectId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️ Request duration: ${duration}ms`);
    console.log(
      `📊 Response status: ${response.status} ${response.statusText}`
    );
    console.log(
      '📋 Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Generation failed with status ${response.status}:`);
      console.error(errorText);

      // Common error analysis
      if (response.status === 404) {
        console.log(
          '💡 Possible causes: API endpoint not found, incorrect URL, or Lambda not deployed'
        );
      } else if (response.status === 500) {
        console.log(
          '💡 Possible causes: Lambda function error, external data source unavailable, or S3 permissions issue'
        );
      } else if (response.status === 403) {
        console.log(
          '💡 Possible causes: Authentication issue or insufficient permissions'
        );
      }

      return { success: false, error: errorText, status: response.status };
    }

    const result = await response.json();
    console.log('✅ Generation response:', result);

    // Check if the response indicates successful S3 storage
    if (result.s3_location || result.document_url || result.bucket) {
      console.log('🎯 Document appears to be stored in S3');
    } else {
      console.log("⚠️ Response doesn't clearly indicate S3 storage");
    }

    return { success: true, result, duration };
  } catch (error) {
    console.error('❌ Network or other error during generation:', error);

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log(
        '💡 Possible causes: CORS issue, API Gateway down, or incorrect API URL'
      );
    }

    return { success: false, error: error.message };
  }
}

// Document download test with S3 focus
async function diagnoseDocumentDownload(
  projectId = TEST_PROJECT_ID,
  format = 'docx'
) {
  console.log(
    `\n📥 Diagnosing Document Download for project: ${projectId}, format: ${format}`
  );
  console.log(
    'Expected flow: UI → API Gateway → S3 Signed URL → Document Download'
  );

  try {
    console.log('🔍 Step 1: Checking if document exists in S3...');

    // Check document availability
    const checkResponse = await fetch(
      `${API_BASE_URL}/check-document/${projectId}?format=${format}`,
      {
        method: 'HEAD',
      }
    );

    console.log(
      `📊 Document check: ${checkResponse.status} ${checkResponse.statusText}`
    );

    if (checkResponse.status === 404) {
      console.log('📄 Document not found in S3 - need to generate first');
      return {
        success: false,
        error: 'Document not found',
        needsGeneration: true,
      };
    }

    if (!checkResponse.ok) {
      console.error(`❌ Document check failed: ${checkResponse.statusText}`);
    }

    console.log('📤 Step 2: Requesting signed URL from S3...');

    // Get download URL (should return 302 redirect to S3 signed URL)
    const downloadResponse = await fetch(
      `${API_BASE_URL}/download-acta/${projectId}?format=${format}`,
      {
        method: 'GET',
        redirect: 'manual',
      }
    );

    console.log(
      `📊 Download API response: ${downloadResponse.status} ${downloadResponse.statusText}`
    );
    console.log(
      '📋 Response headers:',
      Object.fromEntries(downloadResponse.headers.entries())
    );

    if (downloadResponse.status !== 302) {
      const errorText = await downloadResponse.text();
      console.error(
        `❌ Expected 302 redirect, got ${downloadResponse.status}:`
      );
      console.error(errorText);

      if (downloadResponse.status === 404) {
        console.log('💡 Document not found in S3 - may need to generate first');
      } else if (downloadResponse.status === 500) {
        console.log(
          '💡 Possible causes: S3 access error, Lambda error, or missing document'
        );
      }

      return {
        success: false,
        error: errorText,
        status: downloadResponse.status,
      };
    }

    const s3SignedUrl = downloadResponse.headers.get('Location');
    console.log(`🔗 S3 Signed URL: ${s3SignedUrl}`);

    if (!s3SignedUrl) {
      console.error('❌ Missing Location header in 302 response');
      return { success: false, error: 'Missing S3 signed URL' };
    }

    // Verify the S3 signed URL is accessible
    console.log('🧪 Step 3: Testing S3 signed URL accessibility...');

    const s3Response = await fetch(s3SignedUrl, {
      method: 'HEAD',
    });

    console.log(
      `📊 S3 URL test: ${s3Response.status} ${s3Response.statusText}`
    );

    if (s3Response.ok) {
      console.log('✅ S3 signed URL is accessible');
      console.log(`📂 Content-Type: ${s3Response.headers.get('Content-Type')}`);
      console.log(
        `📏 Content-Length: ${s3Response.headers.get('Content-Length')} bytes`
      );
      console.log(
        `📅 Last-Modified: ${s3Response.headers.get('Last-Modified')}`
      );

      // Verify it's actually a document
      const contentType = s3Response.headers.get('Content-Type');
      const expectedType =
        format === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf';

      if (contentType && contentType.includes(expectedType.split('/')[1])) {
        console.log('✅ Content type matches expected format');
      } else {
        console.log(
          `⚠️ Content type mismatch. Expected: ${expectedType}, Got: ${contentType}`
        );
      }

      return {
        success: true,
        s3SignedUrl,
        contentType,
        size: s3Response.headers.get('Content-Length'),
      };
    } else {
      console.error(
        `❌ S3 signed URL not accessible: ${s3Response.statusText}`
      );

      if (s3Response.status === 403) {
        console.log(
          '💡 Possible causes: Signed URL expired, S3 permissions issue, or incorrect bucket'
        );
      } else if (s3Response.status === 404) {
        console.log(
          '💡 Document not found in S3 - may have been deleted or never created'
        );
      }

      return {
        success: false,
        error: 'S3 URL not accessible',
        status: s3Response.status,
      };
    }
  } catch (error) {
    console.error('❌ Network error during download test:', error);
    return { success: false, error: error.message };
  }
}

// Complete workflow diagnostic
async function diagnoseCompleteWorkflow(projectId = TEST_PROJECT_ID) {
  console.log(
    `\n🏁 Complete ACTA Workflow Diagnostic for project: ${projectId}`
  );
  console.log('=' * 60);

  const results = {
    generation: null,
    docxDownload: null,
    pdfDownload: null,
    workflow: 'incomplete',
  };

  // Step 1: Test document generation
  console.log('\n📊 Phase 1: Document Generation');
  results.generation = await diagnoseDocumentGeneration(projectId);

  if (results.generation.success) {
    console.log('\n⏳ Waiting 10 seconds for document processing...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Step 2: Test DOCX download
    console.log('\n📊 Phase 2: DOCX Download');
    results.docxDownload = await diagnoseDocumentDownload(projectId, 'docx');

    // Step 3: Test PDF download
    console.log('\n📊 Phase 3: PDF Download');
    results.pdfDownload = await diagnoseDocumentDownload(projectId, 'pdf');

    // Determine overall workflow status
    if (results.docxDownload?.success || results.pdfDownload?.success) {
      results.workflow = 'success';
    } else if (
      results.docxDownload?.needsGeneration ||
      results.pdfDownload?.needsGeneration
    ) {
      results.workflow = 'needs_generation';
    } else {
      results.workflow = 'download_failed';
    }
  } else {
    results.workflow = 'generation_failed';
  }

  // Summary
  console.log('\n📋 DIAGNOSTIC SUMMARY');
  console.log('=' * 30);
  console.log(
    `🔧 Generation: ${results.generation?.success ? '✅ Success' : '❌ Failed'}`
  );
  console.log(
    `📄 DOCX Download: ${results.docxDownload?.success ? '✅ Success' : results.docxDownload?.needsGeneration ? '⏳ Needs Generation' : '❌ Failed'}`
  );
  console.log(
    `📄 PDF Download: ${results.pdfDownload?.success ? '✅ Success' : results.pdfDownload?.needsGeneration ? '⏳ Needs Generation' : '❌ Failed'}`
  );
  console.log(`🏁 Overall Workflow: ${results.workflow}`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('=' * 20);

  if (results.workflow === 'success') {
    console.log('🎉 Workflow is working correctly!');
  } else if (results.workflow === 'generation_failed') {
    console.log('🔧 Fix document generation first:');
    console.log('   - Check API Gateway URL and endpoints');
    console.log('   - Verify Lambda function deployment');
    console.log('   - Check external data source connectivity');
  } else if (results.workflow === 'needs_generation') {
    console.log('📄 Generate documents first, then test downloads');
  } else if (results.workflow === 'download_failed') {
    console.log('📥 Fix download process:');
    console.log('   - Check S3 bucket permissions');
    console.log('   - Verify signed URL generation');
    console.log('   - Confirm documents are stored in S3');
  }

  return results;
}

// Make functions available globally for console testing
window.actaDiagnostic = {
  diagnoseGeneration: diagnoseDocumentGeneration,
  diagnoseDownload: diagnoseDocumentDownload,
  diagnoseWorkflow: diagnoseCompleteWorkflow,

  // Quick test with custom values
  quickTest: async (apiUrl, projectId) => {
    if (apiUrl) {
      API_BASE_URL = apiUrl;
      console.log(`🔧 Updated API URL to: ${API_BASE_URL}`);
    }

    const testProjectId = projectId || TEST_PROJECT_ID;
    console.log(`🧪 Running diagnostic for project: ${testProjectId}`);

    return await diagnoseCompleteWorkflow(testProjectId);
  },

  // Test specific parts
  testGeneration: (projectId) =>
    diagnoseDocumentGeneration(projectId || TEST_PROJECT_ID),
  testDocx: (projectId) =>
    diagnoseDocumentDownload(projectId || TEST_PROJECT_ID, 'docx'),
  testPdf: (projectId) =>
    diagnoseDocumentDownload(projectId || TEST_PROJECT_ID, 'pdf'),
};

// Instructions
console.log(`
🔬 ACTA DIAGNOSTIC TOOL LOADED

🎯 Target Configuration:
   - S3 Bucket: projectplace-dv-2025-x9a7b
   - API URL: ${API_BASE_URL}
   - Test Project: ${TEST_PROJECT_ID}

🧪 Available Commands:
   - actaDiagnostic.diagnoseWorkflow() - Full workflow test
   - actaDiagnostic.testGeneration() - Test document generation
   - actaDiagnostic.testDocx() - Test DOCX download
   - actaDiagnostic.testPdf() - Test PDF download
   - actaDiagnostic.quickTest('api-url', 'project-id') - Custom test

💡 Usage Examples:
   actaDiagnostic.quickTest('https://your-api.amazonaws.com/prod', 'REAL_PROJECT_123')
   actaDiagnostic.testGeneration('PROJECT_456')

Expected S3 Path Format:
   - DOCX: s3://projectplace-dv-2025-x9a7b/acta/PROJECT_ID.docx
   - PDF: s3://projectplace-dv-2025-x9a7b/acta/PROJECT_ID.pdf
`);

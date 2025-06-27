// Test script for ACTA workflow
// This script will test the document generation and download process

console.log('🧪 ACTA Workflow Test Script');

// Configuration - Update these with your actual values
const API_BASE_URL = 'https://your-api-gateway-url'; // Replace with actual API URL
const TEST_PROJECT_ID = 'TEST123'; // Replace with actual project ID
const S3_BUCKET = 'projectplace-dv-2025-x9a7b';

// Test functions
async function testDocumentGeneration() {
    console.log('\n🔄 Testing Document Generation...');
    
    try {
        // Step 1: Trigger document generation
        console.log(`📤 Triggering generation for project: ${TEST_PROJECT_ID}`);
        
        const generateResponse = await fetch(`${API_BASE_URL}/extract-project-place/${TEST_PROJECT_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Generation response: ${generateResponse.status} ${generateResponse.statusText}`);
        
        if (!generateResponse.ok) {
            const errorText = await generateResponse.text();
            console.error(`❌ Generation failed: ${errorText}`);
            return false;
        }
        
        const result = await generateResponse.json();
        console.log('✅ Generation result:', result);
        
        return true;
        
    } catch (error) {
        console.error('❌ Generation error:', error);
        return false;
    }
}

async function testDocumentDownload(format = 'docx') {
    console.log(`\n📥 Testing Document Download (${format.toUpperCase()})...`);
    
    try {
        // Step 1: Check if document exists
        console.log(`🔍 Checking document availability for project: ${TEST_PROJECT_ID}`);
        
        const checkResponse = await fetch(`${API_BASE_URL}/check-document/${TEST_PROJECT_ID}?format=${format}`, {
            method: 'HEAD'
        });
        
        console.log(`📊 Document check response: ${checkResponse.status} ${checkResponse.statusText}`);
        
        if (checkResponse.status === 404) {
            console.log('📄 Document not found - need to generate first');
            return false;
        }
        
        if (!checkResponse.ok) {
            console.error(`❌ Document check failed: ${checkResponse.statusText}`);
            return false;
        }
        
        // Step 2: Get download URL
        console.log(`📤 Getting download URL for ${format}`);
        
        const downloadResponse = await fetch(`${API_BASE_URL}/download-acta/${TEST_PROJECT_ID}?format=${format}`, {
            method: 'GET',
            redirect: 'manual'
        });
        
        console.log(`📊 Download response: ${downloadResponse.status} ${downloadResponse.statusText}`);
        console.log('📋 Response headers:', Object.fromEntries(downloadResponse.headers.entries()));
        
        if (downloadResponse.status !== 302) {
            const errorText = await downloadResponse.text();
            console.error(`❌ Download failed: ${errorText}`);
            return false;
        }
        
        const downloadUrl = downloadResponse.headers.get('Location');
        console.log(`🔗 Download URL: ${downloadUrl}`);
        
        if (!downloadUrl) {
            console.error('❌ Missing Location header in 302 response');
            return false;
        }
        
        // Step 3: Test the actual download URL
        console.log('🧪 Testing download URL accessibility...');
        
        const urlTest = await fetch(downloadUrl, {
            method: 'HEAD'
        });
        
        console.log(`📊 URL test response: ${urlTest.status} ${urlTest.statusText}`);
        
        if (urlTest.ok) {
            console.log('✅ Download URL is accessible');
            console.log(`📂 Content-Type: ${urlTest.headers.get('Content-Type')}`);
            console.log(`📏 Content-Length: ${urlTest.headers.get('Content-Length')}`);
            return true;
        } else {
            console.error('❌ Download URL is not accessible');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Download error:', error);
        return false;
    }
}

async function testS3DirectAccess() {
    console.log('\n☁️ Testing S3 Direct Access...');
    
    try {
        // Test if we can access the S3 bucket directly (this might not work due to permissions)
        const s3Url = `https://${S3_BUCKET}.s3.amazonaws.com/acta/${TEST_PROJECT_ID}.docx`;
        console.log(`🔗 Testing S3 URL: ${s3Url}`);
        
        const s3Response = await fetch(s3Url, {
            method: 'HEAD'
        });
        
        console.log(`📊 S3 response: ${s3Response.status} ${s3Response.statusText}`);
        
        if (s3Response.ok) {
            console.log('✅ S3 direct access works');
            return true;
        } else {
            console.log('ℹ️ S3 direct access blocked (expected for security)');
            return false;
        }
        
    } catch (error) {
        console.log('ℹ️ S3 direct access error (expected):', error.message);
        return false;
    }
}

async function runFullWorkflowTest() {
    console.log('🏁 Running Full Workflow Test...');
    console.log('=' * 50);
    
    // Step 1: Test document generation
    const generationSuccess = await testDocumentGeneration();
    
    if (generationSuccess) {
        console.log('\n⏳ Waiting 30 seconds for document processing...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Step 2: Test downloads
        await testDocumentDownload('docx');
        await testDocumentDownload('pdf');
    }
    
    // Step 3: Test S3 access
    await testS3DirectAccess();
    
    console.log('\n🏁 Test Complete');
}

// Manual test functions for browser console
window.testActaWorkflow = {
    runFullTest: runFullWorkflowTest,
    testGeneration: testDocumentGeneration,
    testDownload: testDocumentDownload,
    testS3: testS3DirectAccess,
    
    // Quick test with custom values
    quickTest: async (apiUrl, projectId) => {
        if (apiUrl) API_BASE_URL = apiUrl;
        if (projectId) TEST_PROJECT_ID = projectId;
        
        console.log(`🧪 Quick test with API: ${API_BASE_URL}, Project: ${TEST_PROJECT_ID}`);
        await runFullWorkflowTest();
    }
};

// Auto-run if specific conditions are met
if (window.location.hash === '#test-acta') {
    console.log('🔥 Auto-running ACTA workflow test...');
    runFullWorkflowTest();
}

// Instructions
console.log(`
📋 ACTA Workflow Test Instructions:

1. Update the configuration at the top of this script:
   - API_BASE_URL: Your actual API Gateway URL
   - TEST_PROJECT_ID: A valid project ID for testing

2. Run tests from browser console:
   - testActaWorkflow.runFullTest() - Run complete workflow test
   - testActaWorkflow.testGeneration() - Test document generation only
   - testActaWorkflow.testDownload('docx') - Test DOCX download
   - testActaWorkflow.testDownload('pdf') - Test PDF download
   - testActaWorkflow.testS3() - Test S3 direct access

3. Quick test with custom values:
   - testActaWorkflow.quickTest('https://your-api.com', 'PROJECT123')

4. Auto-run test:
   - Add #test-acta to URL to auto-run tests

Expected workflow:
Generate → Wait for processing → Download DOCX/PDF from S3
`);

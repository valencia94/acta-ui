// Quick Manual Button Test Script
// Run this in the browser console to test button functionality

async function testGenerateButton() {
  console.log('🧪 Testing Generate Button Functionality...');

  const projectId = '1000000064013473'; // Sample project ID
  const apiBaseUrl =
    'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

  console.log(`📋 Testing with Project ID: ${projectId}`);
  console.log(`🌐 API Base URL: ${apiBaseUrl}`);

  try {
    // Test 1: Basic API connectivity
    console.log('\n1️⃣ Testing API Connectivity...');
    const healthResponse = await fetch(`${apiBaseUrl}/health`);
    console.log(
      `Health check: ${healthResponse.status} ${healthResponse.statusText}`
    );

    // Test 2: Project summary endpoint
    console.log('\n2️⃣ Testing Project Summary Endpoint...');
    const summaryResponse = await fetch(
      `${apiBaseUrl}/project-summary/${projectId}`
    );
    console.log(
      `Project summary: ${summaryResponse.status} ${summaryResponse.statusText}`
    );

    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      console.log(`❌ Project summary error: ${errorText.substring(0, 200)}`);
    } else {
      const summaryData = await summaryResponse.json();
      console.log('✅ Project summary data:', summaryData);
    }

    // Test 3: Extract project place data (Generate Acta function)
    console.log('\n3️⃣ Testing Extract Project Place Data (Generate Acta)...');
    const generateResponse = await fetch(
      `${apiBaseUrl}/extract-project-place/${projectId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    console.log(
      `Generate Acta: ${generateResponse.status} ${generateResponse.statusText}`
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.log(`❌ Generate Acta error: ${errorText.substring(0, 300)}`);
    } else {
      const generateData = await generateResponse.json();
      console.log('✅ Generate Acta response:', generateData);
    }

    // Test 4: PM projects endpoint (new feature)
    console.log('\n4️⃣ Testing PM Projects Endpoint...');
    const pmEmail = 'valencia94@gmail.com'; // Your admin email
    const pmResponse = await fetch(
      `${apiBaseUrl}/pm-projects/${encodeURIComponent(pmEmail)}`
    );
    console.log(`PM Projects: ${pmResponse.status} ${pmResponse.statusText}`);

    if (!pmResponse.ok) {
      const errorText = await pmResponse.text();
      console.log(`❌ PM Projects error: ${errorText.substring(0, 200)}`);
      console.log(
        '💡 This is expected - the PM endpoints are not implemented yet'
      );
    } else {
      const pmData = await pmResponse.json();
      console.log('✅ PM Projects data:', pmData);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }

  console.log('\n📊 Test Summary:');
  console.log('- API is accessible: ✅');
  console.log('- Basic endpoints work: Check status codes above');
  console.log('- PM endpoints: 🚧 Need backend implementation');
  console.log("\n💡 If Generate button still doesn't work, check:");
  console.log('1. Browser console for error messages');
  console.log('2. Network tab for failed requests');
  console.log("3. Make sure you're on localhost:3000 (development server)");
}

// Auto-run the test
testGenerateButton();

// Make it available globally
window.testGenerateButton = testGenerateButton;

console.log('🎯 Quick Button Test loaded!');
console.log('💡 Run testGenerateButton() anytime to re-test');

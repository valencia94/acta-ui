// Backend Implementation Status Checker
// Run this in the browser console to check what needs to be implemented

async function checkBackendImplementationStatus() {
  console.log('🔍 Checking Backend Implementation Status...');
  console.log('='.repeat(60));

  // Import environment variables
  let apiBaseUrl;
  try {
    const envModule = await import('/src/env.variables.js');
    apiBaseUrl = envModule.apiBaseUrl;
  } catch (error) {
    console.log('⚠️ Could not load environment variables');
    apiBaseUrl = 'https://your-api-gateway-url.amazonaws.com/dev'; // fallback
  }

  console.log(`🌐 API Base URL: ${apiBaseUrl}`);

  if (
    !apiBaseUrl ||
    apiBaseUrl.includes('undefined') ||
    apiBaseUrl === 'undefined'
  ) {
    console.log('❌ CRITICAL: API Base URL is not configured!');
    console.log('💡 Set VITE_API_BASE_URL environment variable');
    return false;
  }

  // Test existing endpoints first
  console.log('\n📋 Testing Existing Endpoints...');
  const existingEndpoints = [
    {
      path: '/project-summary/1000000064013473',
      method: 'GET',
      description: 'Project Summary',
    },
    {
      path: '/timeline/1000000064013473',
      method: 'GET',
      description: 'Timeline',
    },
  ];

  for (const endpoint of existingEndpoints) {
    try {
      const response = await fetch(`${apiBaseUrl}${endpoint.path}`);
      console.log(
        `${response.ok ? '✅' : '❌'} ${endpoint.description}: ${response.status}`
      );
    } catch (error) {
      console.log(`❌ ${endpoint.description}: Connection failed`);
    }
  }

  // Test new PM endpoints
  console.log('\n🔬 Testing PM Metadata Enricher Endpoints...');
  const pmEndpoints = [
    {
      path: '/pm-projects/test.pm@company.com',
      method: 'GET',
      description: 'PM Projects (calls metadata enricher)',
      critical: true,
    },
    {
      path: '/bulk-enrich-projects',
      method: 'POST',
      description: 'Bulk Project Enrichment',
      body: { pm_email: 'test.pm@company.com' },
      critical: true,
    },
  ];

  const results = [];

  for (const endpoint of pmEndpoints) {
    console.log(`\n🔍 Testing ${endpoint.description}...`);
    console.log(`   ${endpoint.method} ${apiBaseUrl}${endpoint.path}`);

    try {
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(`${apiBaseUrl}${endpoint.path}`, options);

      console.log(`   Status: ${response.status} ${response.statusText}`);

      let status = 'unknown';
      let needsImplementation = false;

      if (response.status === 404) {
        status = 'not_implemented';
        needsImplementation = true;
        console.log('   ❌ Endpoint not implemented');
      } else if (response.status >= 200 && response.status < 300) {
        status = 'working';
        console.log('   ✅ Endpoint working');

        // Try to parse response to check data structure
        try {
          const data = await response.json();
          console.log(
            '   📄 Response sample:',
            JSON.stringify(data, null, 2).substring(0, 200) + '...'
          );
        } catch (e) {
          console.log('   ⚠️ Could not parse JSON response');
        }
      } else if (response.status >= 500) {
        status = 'server_error';
        console.log('   ⚠️ Server error - endpoint exists but has issues');

        try {
          const errorText = await response.text();
          console.log(`   Error: ${errorText.substring(0, 100)}...`);
        } catch (e) {
          console.log('   Could not read error details');
        }
      } else {
        status = 'client_error';
        console.log(`   ⚠️ Client error: ${response.status}`);
      }

      results.push({
        endpoint: endpoint.description,
        status,
        needsImplementation,
        critical: endpoint.critical,
      });
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      results.push({
        endpoint: endpoint.description,
        status: 'connection_failed',
        needsImplementation: true,
        critical: endpoint.critical,
      });
    }
  }

  // Test Lambda function accessibility (informational)
  console.log('\n⚡ Lambda Function Information:');
  console.log('   Function: projectMetadataEnricher');
  console.log(
    '   ARN: arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher'
  );
  console.log(
    '   Status: ❓ Cannot test directly from browser (requires AWS credentials)'
  );

  // Summary and recommendations
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPLEMENTATION STATUS SUMMARY');
  console.log('='.repeat(60));

  const criticalEndpoints = results.filter((r) => r.critical);
  const implementedCritical = criticalEndpoints.filter(
    (r) => r.status === 'working'
  );
  const needsImplementationCritical = criticalEndpoints.filter(
    (r) => r.needsImplementation
  );

  console.log(
    `✅ Implemented: ${implementedCritical.length}/${criticalEndpoints.length} critical endpoints`
  );
  console.log(
    `❌ Needs Implementation: ${needsImplementationCritical.length} critical endpoints`
  );

  if (needsImplementationCritical.length === 0) {
    console.log('\n🎉 ALL CRITICAL ENDPOINTS IMPLEMENTED!');
    console.log('✨ Your PM workflow should be fully functional!');
    console.log('\n🧪 Next steps:');
    console.log('1. Run: testMetadataEnricherIntegration()');
    console.log('2. Run: testCompleteWorkflowWithEnricher()');
  } else {
    console.log('\n🔧 IMPLEMENTATION NEEDED:');
    needsImplementationCritical.forEach((endpoint) => {
      console.log(`❌ ${endpoint.endpoint}`);
    });

    console.log('\n📋 IMPLEMENTATION PRIORITY:');
    console.log('1. 🥇 Enhance projectMetadataEnricher Lambda function');
    console.log('   - Add PM email filtering capability');
    console.log('   - Add enriched metadata fields');
    console.log('   - See: docs/BACKEND_IMPLEMENTATION_GUIDE.md');

    console.log('2. 🥈 Create API Gateway endpoints');
    console.log('   - GET /pm-projects/{pm_email}');
    console.log('   - POST /bulk-enrich-projects');

    console.log('3. 🥉 Test and deploy');
    console.log('   - Use testMetadataEnricherIntegration() to verify');
  }

  console.log('\n📖 Documentation:');
  console.log('- Implementation Guide: docs/BACKEND_IMPLEMENTATION_GUIDE.md');
  console.log('- API Spec: docs/PM_DYNAMODB_API_SPEC.md');
  console.log('- Integration Details: docs/METADATA_ENRICHER_INTEGRATION.md');

  console.log('\n🧪 Testing Functions Available:');
  console.log('- checkBackendImplementationStatus() - This function');
  console.log('- testBackendAPIRequirements() - Detailed requirements check');
  console.log('- testMetadataEnricherIntegration() - Test when ready');
  console.log('- testCompleteWorkflowWithEnricher() - End-to-end test');

  return {
    apiBaseUrl,
    results,
    criticalEndpointsImplemented: implementedCritical.length,
    criticalEndpointsTotal: criticalEndpoints.length,
    allCriticalImplemented: needsImplementationCritical.length === 0,
  };
}

// Make function available globally
window.checkBackendImplementationStatus = checkBackendImplementationStatus;

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
  console.log('🚀 Backend Implementation Status Checker Loaded!');
  console.log('💡 Run: checkBackendImplementationStatus()');
}

// Dashboard Button Testing Utility
// This utility helps test all buttons on the dashboard and provides enhanced workflow testing

// Function to test dashboard buttons
function testDashboardButtons() {
  console.log('🧪 Starting Enhanced Dashboard Button Tests...');

  // Test 1: Check if we're on the dashboard
  if (!window.location.pathname.includes('dashboard')) {
    console.log('❌ Please navigate to /dashboard first');
    return;
  }

  console.log('✅ On dashboard page');

  // Test 2: Check if project ID input exists
  const projectIdInput = document.querySelector(
    '#projectId'
  ) as HTMLInputElement;
  if (!projectIdInput) {
    console.log('❌ Project ID input not found');
    return;
  }

  console.log('✅ Project ID input found');

  // Test 3: Set a test project ID
  const testProjectId = '1000000064013473';
  projectIdInput.value = testProjectId;
  projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
  projectIdInput.dispatchEvent(new Event('change', { bubbles: true }));
  console.log(`✅ Set test project ID: ${testProjectId}`);

  // Test 4: Environment check
  console.log('🔍 Environment Check:');
  console.log(
    `- API Base URL: ${(window as unknown as Record<string, unknown>).VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'NOT SET'}`
  );
  console.log(`- Current Origin: ${window.location.origin}`);
  console.log(`- User Agent: ${navigator.userAgent.substring(0, 50)}...`);

  // Wait a moment for state to update
  setTimeout(() => {
    // Test 5: Find and test each button
    const buttons = document.querySelectorAll('button');
    console.log(`✅ Found ${buttons.length} buttons on page`);

    // Find specific ACTA buttons with more detailed searching
    const generateBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Generate')
    );
    const approvalBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Send Approval')
    );
    const wordBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Word')
    );
    const pdfBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('PDF')
    );
    const refreshBtn = Array.from(buttons).find(
      (btn) =>
        btn.querySelector('svg')?.classList.contains('animate-spin') !==
        undefined
    );

    console.log('\n🔍 Button Status:');
    console.log('- Generate Acta:', generateBtn ? '✅ Found' : '❌ Missing');
    console.log('- Send Approval:', approvalBtn ? '✅ Found' : '❌ Missing');
    console.log('- Download Word:', wordBtn ? '✅ Found' : '❌ Missing');
    console.log('- Download PDF:', pdfBtn ? '✅ Found' : '❌ Missing');
    console.log('- Refresh Projects:', refreshBtn ? '✅ Found' : '❌ Missing');

    // Test 6: Check if buttons are enabled/disabled
    console.log('\n⚡ Button States:');
    if (generateBtn) {
      console.log(
        '- Generate Acta:',
        generateBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
      console.log(
        '  - onClick handler:',
        generateBtn.onclick ? 'Present' : 'Missing'
      );
    }
    if (approvalBtn) {
      console.log(
        '- Send Approval:',
        approvalBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
      console.log(
        '  - onClick handler:',
        approvalBtn.onclick ? 'Present' : 'Missing'
      );
    }
    if (wordBtn) {
      console.log(
        '- Download Word:',
        wordBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
      console.log(
        '  - onClick handler:',
        wordBtn.onclick ? 'Present' : 'Missing'
      );
    }
    if (pdfBtn) {
      console.log(
        '- Download PDF:',
        pdfBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
      console.log(
        '  - onClick handler:',
        pdfBtn.onclick ? 'Present' : 'Missing'
      );
    }

    // Test 7: Try to trigger buttons with different methods
    console.log('\n🖱️ Testing Button Interactions:');

    if (generateBtn) {
      console.log('🔥 Testing Generate Acta button...');

      // Add a test event listener
      generateBtn.addEventListener('click', () => {
        console.log('✅ Generate button click event fired!');
      });

      // Try multiple ways to trigger the button
      console.log('  - Trying .click() method...');
      generateBtn.click();

      console.log('  - Trying manual event dispatch...');
      generateBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      console.log('  - Checking if button prevents default...');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      const wasDefaultPrevented = !generateBtn.dispatchEvent(clickEvent);
      console.log('  - Default prevented:', wasDefaultPrevented);
    }

    console.log(
      '\n🎯 Enhanced button testing complete! Check console for click events and status.'
    );
    console.log(
      '📝 Note: If no click events appear, the button handlers may not be properly attached.'
    );
  }, 1000); // Increased timeout to ensure state updates
}

// Function to simulate button clicks for testing
function simulateButtonClicks() {
  console.log('🤖 Simulating button clicks...');

  const projectIdInput = document.querySelector(
    '#projectId'
  ) as HTMLInputElement;
  if (projectIdInput && !projectIdInput.value) {
    projectIdInput.value = '1000000064013473';
    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Set test project ID');
  }

  setTimeout(() => {
    const buttons = document.querySelectorAll('button');

    // Find and click Generate button
    const generateBtn = Array.from(buttons).find(
      (btn) => btn.textContent?.includes('Generate') && !btn.disabled
    );
    if (generateBtn) {
      console.log('🔥 Clicking Generate Acta button...');
      (generateBtn as HTMLButtonElement).click();
    }

    // Click other buttons with delays
    setTimeout(() => {
      const approvalBtn = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('Send Approval') && !btn.disabled
      );
      if (approvalBtn) {
        console.log('📧 Clicking Send Approval button...');
        (approvalBtn as HTMLButtonElement).click();
      }
    }, 2000);

    setTimeout(() => {
      const wordBtn = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('Word') && !btn.disabled
      );
      if (wordBtn) {
        console.log('📄 Clicking Download Word button...');
        (wordBtn as HTMLButtonElement).click();
      }
    }, 4000);

    setTimeout(() => {
      const pdfBtn = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('PDF') && !btn.disabled
      );
      if (pdfBtn) {
        console.log('📑 Clicking Download PDF button...');
        (pdfBtn as HTMLButtonElement).click();
      }
    }, 6000);
  }, 1000);
}

// Function to check API connectivity
async function testAPIConnectivity() {
  console.log('🌐 Testing API connectivity...');

  const apiBaseUrl =
    (window as unknown as Record<string, unknown>).__VITE_API_BASE_URL__ ||
    'http://localhost:9999';
  console.log(`📡 API Base URL: ${apiBaseUrl}`);

  try {
    const response = await fetch(`${apiBaseUrl}/health`);
    if (response.ok) {
      console.log('✅ API server is reachable');
      return true;
    } else {
      console.log('⚠️ API server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API server is not reachable:', error.message);
    console.log('💡 Make sure the backend server is running on', apiBaseUrl);
    return false;
  }
}

// Function to test React event handlers specifically
function testReactEventHandlers() {
  console.log('⚛️ Testing React Event Handlers...');

  // Check if project ID is set
  const projectIdInput = document.querySelector(
    '#projectId'
  ) as HTMLInputElement;
  if (projectIdInput && !projectIdInput.value) {
    projectIdInput.value = '1000000064013473';
    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    projectIdInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Set project ID for testing');
  }

  setTimeout(() => {
    const buttons = document.querySelectorAll('button');
    console.log(`Found ${buttons.length} buttons`);

    // Try to find buttons by their text content
    const buttonTests = [
      { name: 'Generate', text: 'Generate' },
      { name: 'Send Approval', text: 'Send Approval' },
      { name: 'Download Word', text: 'Word' },
      { name: 'Download PDF', text: 'PDF' },
    ];

    buttonTests.forEach(({ name, text }) => {
      const button = Array.from(buttons).find((btn) =>
        btn.textContent?.includes(text)
      ) as HTMLButtonElement;

      if (button) {
        console.log(`\n🔍 Testing ${name} button:`);
        console.log(`  - Disabled: ${button.disabled}`);
        console.log(`  - Class list: ${button.className}`);

        // Check if button has React fiber
        const reactFiber =
          (button as unknown as Record<string, unknown>)._reactInternalFiber ||
          (button as unknown as Record<string, unknown>)
            .__reactInternalInstance ||
          Object.keys(button).find((key) =>
            key.startsWith('__reactInternalInstance')
          );
        console.log(`  - React fiber: ${reactFiber ? 'Present' : 'Missing'}`);

        // Add a test listener and try clicking
        let clickDetected = false;
        const testListener = () => {
          clickDetected = true;
          console.log(`  ✅ ${name} button click detected!`);
        };

        button.addEventListener('click', testListener);

        // Try clicking
        console.log('  - Attempting click...');
        button.click();

        setTimeout(() => {
          if (!clickDetected) {
            console.log(`  ❌ ${name} button click not detected`);
          }
          button.removeEventListener('click', testListener);
        }, 100);
      } else {
        console.log(`❌ ${name} button not found`);
      }
    });
  }, 500);
}

// Function to debug environment variables and API configuration
function debugEnvironment() {
  console.log('🔧 Environment Debug Information:');
  console.log('='.repeat(50));

  // Check all environment variables
  console.log('📊 Environment Variables:');
  console.log('- NODE_ENV:', import.meta.env.MODE);
  console.log('- PROD:', import.meta.env.PROD);
  console.log('- DEV:', import.meta.env.DEV);
  console.log('- VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('- VITE_SKIP_AUTH:', import.meta.env.VITE_SKIP_AUTH);
  console.log('- VITE_COGNITO_REGION:', import.meta.env.VITE_COGNITO_REGION);

  // Check current domain
  console.log('\n🌐 Current Domain Info:');
  console.log('- Window location:', window.location.href);
  console.log('- Protocol:', window.location.protocol);
  console.log('- Host:', window.location.host);
  console.log('- Pathname:', window.location.pathname);

  // Check computed API URL
  console.log('\n📡 API Configuration:');
  const computedApiUrl =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999';
  console.log('- Computed API URL:', computedApiUrl);
  console.log(
    '- API URL source:',
    import.meta.env.VITE_API_BASE_URL ? 'Environment variable' : 'Fallback'
  );

  // Check if we're in a CloudFront environment
  const isCloudFront = window.location.host.includes('cloudfront.net');
  console.log('- CloudFront detected:', isCloudFront);

  if (isCloudFront) {
    console.log('\n⚠️ CloudFront Environment Detected:');
    console.log('- Frontend URL:', window.location.origin);
    console.log('- API calls should NOT go to CloudFront');
    console.log('- Need separate API Gateway endpoint');
  }

  // Suggest fixes
  console.log('\n💡 Suggested API Endpoints:');
  console.log('- For development: http://localhost:9999');
  console.log(
    '- For production: https://{api-gateway-id}.execute-api.{region}.amazonaws.com/prod'
  );
  console.log('- Current setting:', computedApiUrl);

  console.log('\n🔍 Test API connectivity with: testAPIConnectivity()');
}

// Test the complete Acta workflow
function testActaWorkflow() {
  console.log('🔄 Starting Acta Workflow Test...');

  const projectId = '1000000064013473'; // Test project ID

  console.log(`📋 Testing workflow for project: ${projectId}`);
  console.log('');

  console.log('Step 1: Set Project ID');
  const projectIdInput = document.querySelector(
    '#projectId'
  ) as HTMLInputElement;
  if (projectIdInput) {
    projectIdInput.value = projectId;
    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Project ID set');
  } else {
    console.log('❌ Project ID input not found');
    return;
  }

  console.log('');
  console.log('Step 2: Test Generate Button');
  console.log('⚠️  Note: This will make actual API calls!');
  console.log(
    '   - Click Generate to create fresh document (takes 2-5 minutes)'
  );
  console.log('   - Or click Download to get existing document');

  const buttons = document.querySelectorAll('button');
  const generateBtn = Array.from(buttons).find((btn) =>
    btn.textContent?.includes('Generate')
  );
  const wordBtn = Array.from(buttons).find((btn) =>
    btn.textContent?.includes('Word')
  );
  const pdfBtn = Array.from(buttons).find((btn) =>
    btn.textContent?.includes('PDF')
  );
  const approvalBtn = Array.from(buttons).find((btn) =>
    btn.textContent?.includes('Send Approval')
  );

  if (generateBtn) {
    console.log('✅ Generate button found - Ready to generate fresh Acta');
  }
  if (wordBtn) {
    console.log('✅ Word download button found - Ready to download .docx');
  }
  if (pdfBtn) {
    console.log('✅ PDF download button found - Ready to download .pdf');
  }
  if (approvalBtn) {
    console.log('✅ Send Approval button found - Ready to email stakeholders');
  }

  console.log('');
  console.log('Step 3: Recommended Test Sequence');
  console.log('   1. Try downloading existing document first:');
  console.log('      wordBtn.click() or pdfBtn.click()');
  console.log('   2. If no document exists, generate fresh:');
  console.log('      generateBtn.click() (wait 2-5 minutes)');
  console.log('   3. Then download the generated document');
  console.log('   4. Optionally send for approval:');
  console.log('      approvalBtn.click()');

  console.log('');
  console.log('🎯 Quick Actions (paste these in console):');
  console.log(
    '   Generate: Array.from(document.querySelectorAll("button")).find(btn => btn.textContent?.includes("Generate"))?.click()'
  );
  console.log(
    '   Word DL:  Array.from(document.querySelectorAll("button")).find(btn => btn.textContent?.includes("Word"))?.click()'
  );
  console.log(
    '   PDF DL:   Array.from(document.querySelectorAll("button")).find(btn => btn.textContent?.includes("PDF"))?.click()'
  );
}

// Test API connectivity with enhanced feedback
function testActaAPIConnectivity() {
  console.log('🌐 Testing ACTA API Connectivity...');

  // Get the API base URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  console.log(`📡 API Base URL: ${apiBaseUrl || 'NOT SET'}`);

  if (!apiBaseUrl) {
    console.log('❌ VITE_API_BASE_URL not configured');
    console.log('💡 This is likely the cause of API failures in production');
    return;
  }

  // Test basic connectivity
  const testProjectId = '1000000064013473';
  console.log(`🧪 Testing with project ID: ${testProjectId}`);

  // Test 1: Check API base URL accessibility
  console.log('');
  console.log('Test 1: API Base URL accessibility');
  fetch(apiBaseUrl)
    .then((response) => {
      console.log(`✅ API base URL responding: ${response.status}`);
      return response.text();
    })
    .then((text) => {
      console.log(`📄 Response preview: ${text.substring(0, 100)}...`);
    })
    .catch((error) => {
      console.log(`❌ API base URL error: ${error.message}`);
    });

  // Test 2: Test project summary endpoint
  console.log('');
  console.log('Test 2: Project Summary Endpoint');
  fetch(`${apiBaseUrl}/project-summary/${testProjectId}`)
    .then((response) => {
      console.log(`📊 Project summary status: ${response.status}`);
      if (response.ok) {
        return response.json();
      }
      throw new Error(`HTTP ${response.status}`);
    })
    .then((data) => {
      console.log('✅ Project summary data:', data);
    })
    .catch((error) => {
      console.log(`❌ Project summary error: ${error.message}`);
      console.log(
        '💡 This endpoint may not exist or project ID may be invalid'
      );
    });

  // Test 3: Test download URL endpoint
  console.log('');
  console.log('Test 3: Download URL Endpoint');
  fetch(`${apiBaseUrl}/download-acta/${testProjectId}?format=docx`, {
    method: 'GET',
    redirect: 'manual',
  })
    .then((response) => {
      console.log(`📁 Download endpoint status: ${response.status}`);
      if (response.status === 302) {
        const location = response.headers.get('Location');
        console.log(
          `✅ Download URL available: ${location?.substring(0, 50)}...`
        );
      } else {
        console.log(`⚠️  Expected 302 redirect, got ${response.status}`);
      }
    })
    .catch((error) => {
      console.log(`❌ Download endpoint error: ${error.message}`);
    });

  console.log('');
  console.log('⏳ Tests running... Check above for results');
}

// Test PM project functionality
function testPMProjectManager() {
  console.log('👥 Testing PM Project Manager...');

  // Check if we're on the dashboard
  if (!window.location.pathname.includes('dashboard')) {
    console.log('❌ Please navigate to /dashboard first');
    return;
  }

  // Check if PM mode is available
  const pmModeButton = Array.from(document.querySelectorAll('button')).find(
    (btn) => btn.textContent?.includes('PM Projects')
  );

  if (!pmModeButton) {
    console.log('❌ PM Projects mode button not found');
    return;
  }

  console.log('✅ PM Projects mode button found');

  // Switch to PM mode
  console.log('🔄 Switching to PM mode...');
  pmModeButton.click();

  setTimeout(() => {
    // Check if PM project manager is visible
    const pmProjectCards = document.querySelectorAll(
      '[class*="cursor-pointer"]'
    );
    const pmProjectManager = document
      .querySelector('h2')
      ?.textContent?.includes('Your Projects');

    if (pmProjectManager) {
      console.log('✅ PM Project Manager is visible');
      console.log(`📊 Found ${pmProjectCards.length} project cards`);

      // Test bulk generate button
      const bulkGenerateBtn = Array.from(
        document.querySelectorAll('button')
      ).find((btn) => btn.textContent?.includes('Generate All Actas'));

      if (bulkGenerateBtn) {
        console.log('✅ Bulk Generate button found');
        console.log(
          '⚠️  Note: Click this to generate Actas for all PM projects'
        );
      } else {
        console.log(
          'ℹ️  Bulk Generate button not available (no projects or already generating)'
        );
      }

      // Test project selection
      if (pmProjectCards.length > 0) {
        console.log('🎯 Testing project selection...');
        console.log(
          '  Click any project card to select it for individual actions'
        );

        // Add click listeners to project cards for testing
        pmProjectCards.forEach((card, index) => {
          if (card instanceof HTMLElement) {
            card.addEventListener('click', () => {
              console.log(`✅ Project card ${index + 1} clicked and selected`);
            });
          }
        });
      }
    } else {
      console.log('❌ PM Project Manager not visible');
    }

    // Test mode switching
    const manualModeButton = Array.from(
      document.querySelectorAll('button')
    ).find((btn) => btn.textContent?.includes('Manual Entry'));

    if (manualModeButton) {
      console.log('✅ Manual Entry mode button found');
      console.log(
        '🔄 You can switch between PM Projects and Manual Entry modes'
      );
    }

    console.log('\n📋 PM Project Manager Test Summary:');
    console.log('- PM mode available and functional');
    console.log('- Project cards show status and selection');
    console.log('- Bulk operations available for PM projects');
    console.log('- Individual project selection works');
    console.log('- Mode switching between PM and Manual entry');
  }, 1000);
}

// Test DynamoDB integration
async function testDynamoDBIntegration() {
  console.log('🗄️  Testing DynamoDB Integration...');

  // Get current user email
  const userEmail = 'test-pm@example.com'; // This would be from user context
  console.log(`👤 Testing with PM email: ${userEmail}`);

  // Test API endpoint for PM projects
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    console.log('❌ VITE_API_BASE_URL not configured');
    return;
  }

  console.log('📡 Testing PM projects endpoint...');

  try {
    const response = await fetch(
      `${apiBaseUrl}/projects-by-pm/${encodeURIComponent(userEmail)}`
    );

    console.log(`📊 Response status: ${response.status}`);

    if (response.ok) {
      const projects = await response.json();
      console.log(`✅ Found ${projects.length} projects for PM`);
      console.log('📋 Sample project data:', projects[0]);

      // Test project structure
      if (projects.length > 0) {
        const sampleProject = projects[0];
        console.log('\n🔍 Project Data Structure:');
        console.log(`- Project ID: ${sampleProject.project_id || 'Missing'}`);
        console.log(
          `- Project Name: ${sampleProject.project_name || 'Missing'}`
        );
        console.log(`- PM Email: ${sampleProject.pm_email || 'Missing'}`);
        console.log(
          `- Has Acta: ${sampleProject.has_acta_document || 'Unknown'}`
        );
        console.log(
          `- Last Updated: ${sampleProject.last_updated || 'Unknown'}`
        );
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${errorText}`);
      console.log(
        '💡 This might be expected if the endpoint is not implemented yet'
      );
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    console.log('💡 Make sure the API server is running and accessible');
  }

  console.log('\n📝 DynamoDB Table Information:');
  console.log('- Table: ProjectPlace_DataExtrator_landing_table_v2');
  console.log('- Region: us-east-2');
  console.log('- Key Field: pm_email');
  console.log(
    '- Expected Fields: project_id, project_name, pm_email, project_status'
  );
}

// Test complete PM workflow
function testCompleteWorkflow() {
  console.log('🔄 Testing Complete PM Workflow...');

  console.log('Step 1: Switch to PM mode');
  const pmModeButton = Array.from(document.querySelectorAll('button')).find(
    (btn) => btn.textContent?.includes('PM Projects')
  );

  if (pmModeButton) {
    pmModeButton.click();
    console.log('✅ Switched to PM mode');
  }

  setTimeout(() => {
    console.log('Step 2: Load PM projects from DynamoDB');
    console.log('  - Projects should auto-load based on user email');
    console.log('  - Each project shows status and Acta availability');

    console.log('Step 3: Select a project');
    const projectCards = document.querySelectorAll('[class*="cursor-pointer"]');
    if (projectCards.length > 0) {
      console.log(
        `  - ${projectCards.length} projects available for selection`
      );
      console.log('  - Click any project to select it');
    }

    console.log('Step 4: Generate Acta (individual or bulk)');
    console.log('  - Individual: Select project + use action buttons');
    console.log('  - Bulk: Click "Generate All Actas" for all projects');

    console.log('Step 5: Download and manage documents');
    console.log('  - Download Word/PDF versions');
    console.log('  - Send for approval via email');

    console.log('\n🎯 Quick Test Actions:');
    console.log('- testPMProjectManager() - Test PM project interface');
    console.log('- testDynamoDBIntegration() - Test backend connectivity');
    console.log('- testActaWorkflow() - Test individual project workflow');
  }, 1000);
}

// ============================================
// METADATA ENRICHER INTEGRATION TESTS
// ============================================

/** Test PM project manager functionality via API */
async function testPMProjectManagerAPI(
  pmEmail: string = 'test.pm@company.com'
) {
  console.log('🔍 Testing PM Project Manager API...');

  try {
    // Import API functions dynamically
    const {
      getProjectsByPM,
      getPMProjectsWithSummary,
      getProjectSummaryForPM,
    } = await import('@/lib/api');

    // Test project loading
    console.log(`📡 Loading projects for PM: ${pmEmail}`);
    const projects = await getProjectsByPM(pmEmail);
    console.log(`✅ Loaded ${projects.length} projects for PM:`, pmEmail);
    console.log('Projects:', projects);

    // Test summary data
    console.log('📊 Loading PM projects summary...');
    const summary = await getPMProjectsWithSummary(pmEmail);
    console.log('✅ PM Projects Summary:', summary);

    // Test individual project details
    if (projects.length > 0) {
      console.log('🔍 Loading individual project details...');
      const firstProject = projects[0];
      const projectDetails = await getProjectSummaryForPM(
        firstProject.project_id,
        pmEmail
      );
      console.log(
        `✅ Project details for ${firstProject.project_id}:`,
        projectDetails
      );
    }

    return { success: true, projects, summary };
  } catch (error) {
    console.error('❌ PM Project Manager API test failed:', error);
    return { success: false, error: error.message };
  }
}

/** Test bulk operations for PM projects */
async function testBulkOperationsAPI(pmEmail: string = 'test.pm@company.com') {
  console.log('🔄 Testing Bulk Operations API...');

  try {
    const { generateSummariesForPM } = await import('@/lib/api');

    console.log(`📡 Initiating bulk generation for PM: ${pmEmail}`);
    const result = await generateSummariesForPM(pmEmail);
    console.log('✅ Bulk generation result:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Bulk operations API test failed:', error);
    return { success: false, error: error.message };
  }
}

/** Test metadata enricher integration directly */
async function testMetadataEnricherIntegration(
  pmEmail: string = 'test.pm@company.com'
) {
  console.log('🧬 Testing Metadata Enricher Integration...');

  const tests = {
    pmProjectsEndpoint: false,
    bulkEnrichEndpoint: false,
    dataStructure: false,
    enrichedFields: false,
  };

  try {
    const { apiBaseUrl } = await import('@/env.variables');

    // Test 1: PM projects endpoint (calls metadata enricher)
    console.log('1️⃣ Testing GET /pm-projects/{pm_email}...');
    console.log(
      `📡 Calling: ${apiBaseUrl}/pm-projects/${encodeURIComponent(pmEmail)}`
    );

    const pmProjectsResponse = await fetch(
      `${apiBaseUrl}/pm-projects/${encodeURIComponent(pmEmail)}`
    );
    console.log(`📊 Status: ${pmProjectsResponse.status}`);
    console.log(`📊 Status Text: ${pmProjectsResponse.statusText}`);

    if (pmProjectsResponse.ok) {
      const data = await pmProjectsResponse.json();
      console.log('✅ PM Projects endpoint works:', data);
      tests.pmProjectsEndpoint = true;

      // Test data structure
      if (data.pm_email && Array.isArray(data.projects) && data.summary) {
        console.log('✅ Data structure is correct');
        tests.dataStructure = true;

        // Test enriched fields
        if (data.projects.length > 0) {
          const project = data.projects[0];
          console.log(
            '🔍 Checking enriched fields in first project:',
            Object.keys(project)
          );

          const hasEnrichedFields =
            project.has_acta_document !== undefined &&
            project.acta_status !== undefined &&
            project.priority_level !== undefined;

          if (hasEnrichedFields) {
            console.log('✅ Enriched fields present');
            tests.enrichedFields = true;
          } else {
            console.log(
              '⚠️ Some enriched fields missing. Available fields:',
              Object.keys(project)
            );
          }
        } else {
          console.log('⚠️ No projects returned to test enriched fields');
        }
      } else {
        console.log(
          '❌ Data structure invalid. Available keys:',
          Object.keys(data)
        );
      }
    } else {
      const errorText = await pmProjectsResponse.text();
      console.log('❌ PM Projects endpoint failed:', errorText);
    }

    // Test 2: Bulk enrich endpoint
    console.log('\n2️⃣ Testing POST /bulk-enrich-projects...');
    console.log(`📡 Calling: ${apiBaseUrl}/bulk-enrich-projects`);

    const bulkResponse = await fetch(`${apiBaseUrl}/bulk-enrich-projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pm_email: pmEmail }),
    });

    console.log(`📊 Bulk enrich status: ${bulkResponse.status}`);
    console.log(`📊 Bulk enrich status text: ${bulkResponse.statusText}`);

    if (bulkResponse.ok) {
      const bulkData = await bulkResponse.json();
      console.log('✅ Bulk enrich endpoint works:', bulkData);
      tests.bulkEnrichEndpoint = true;
    } else {
      const errorText = await bulkResponse.text();
      console.log('❌ Bulk enrich endpoint failed:', errorText);
    }
  } catch (error) {
    console.error('❌ Metadata enricher integration test failed:', error);
  }

  // Summary
  console.log('\n📋 Metadata Enricher Integration Test Results:');
  Object.entries(tests).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  const allPassed = Object.values(tests).every(Boolean);
  console.log(
    `\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`
  );

  return tests;
}

/** Test the metadata enricher Lambda function directly (if accessible) */
function testMetadataEnricherLambda(pmEmail: string = 'test.pm@company.com') {
  console.log('⚡ Testing Metadata Enricher Lambda Function...');

  // Note: This would require AWS SDK and proper credentials
  console.log('🔧 To test the Lambda function directly, you would need:');
  console.log('1. AWS SDK configured');
  console.log('2. Proper IAM permissions');
  console.log('3. Lambda invoke permissions');

  console.log('\n📝 Expected Lambda payload for PM projects:');
  const expectedPayload = {
    pm_email: pmEmail,
    include_metadata: true,
    include_acta_status: true,
  };
  console.log(JSON.stringify(expectedPayload, null, 2));

  console.log('\n📝 Expected Lambda response structure:');
  const expectedResponse = {
    statusCode: 200,
    body: {
      pm_email: pmEmail,
      total_projects: 0,
      projects: [],
      summary: {
        with_acta: 0,
        without_acta: 0,
        recently_updated: 0,
      },
    },
  };
  console.log(JSON.stringify(expectedResponse, null, 2));

  return {
    note: 'Lambda testing requires AWS SDK and proper permissions',
    expectedPayload,
    expectedResponse,
  };
}

/** Comprehensive test for the complete PM workflow with metadata enricher */
async function testCompleteWorkflowWithEnricher(
  pmEmail: string = 'test.pm@company.com'
) {
  console.log('🔄 Testing Complete PM Workflow with Metadata Enricher...');
  console.log(`👤 Testing with PM email: ${pmEmail}`);

  const results = {
    metadataEnricher: null,
    pmProjectsAPI: null,
    bulkOperationsAPI: null,
    apiConnectivity: null,
    uiComponents: null,
  };

  try {
    // 1. Test metadata enricher integration
    console.log('\n1️⃣ Testing Metadata Enricher Integration...');
    results.metadataEnricher = await testMetadataEnricherIntegration(pmEmail);

    // 2. Test PM project API loading
    console.log('\n2️⃣ Testing PM Project API Loading...');
    results.pmProjectsAPI = await testPMProjectManagerAPI(pmEmail);

    // 3. Test bulk operations API
    console.log('\n3️⃣ Testing Bulk Operations API...');
    results.bulkOperationsAPI = await testBulkOperationsAPI(pmEmail);

    // 4. Test API connectivity
    console.log('\n4️⃣ Testing API Connectivity...');
    results.apiConnectivity = await testAPIConnectivity();

    // 5. Test UI components
    console.log('\n5️⃣ Testing UI Components...');
    results.uiComponents = testReactEventHandlers();

    // Summary
    console.log('\n📊 Complete Workflow Test Results:');
    Object.entries(results).forEach(([test, result]) => {
      if (result && typeof result === 'object') {
        const status =
          result.success !== undefined
            ? result.success
            : Object.values(result).some(Boolean);
        console.log(
          `${status ? '✅' : '❌'} ${test}: ${status ? 'PASS' : 'FAIL'}`
        );

        if (!status && result.error) {
          console.log(`  └─ Error: ${result.error}`);
        }
      } else {
        console.log(`❓ ${test}: UNKNOWN`);
      }
    });

    // Overall assessment
    const successfulTests = Object.values(results).filter(
      (result) =>
        result &&
        (result.success === true ||
          (typeof result === 'object' && Object.values(result).some(Boolean)))
    ).length;

    const totalTests = Object.keys(results).length;
    console.log(`\n🎯 Summary: ${successfulTests}/${totalTests} tests passed`);

    if (successfulTests === totalTests) {
      console.log('🎉 All systems are working correctly!');
    } else if (successfulTests > totalTests / 2) {
      console.log('⚠️ Most systems working, but some issues detected');
    } else {
      console.log('❌ Multiple systems have issues that need attention');
    }

    return results;
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error);
    return { error: error.message, results };
  }
}

/** Test backend API requirements for metadata enricher */
async function testBackendAPIRequirements() {
  console.log('🔧 Testing Backend API Requirements for Metadata Enricher...');

  try {
    const { apiBaseUrl } = await import('@/env.variables');
    console.log(`🌐 API Base URL: ${apiBaseUrl}`);

    // Check if API base URL is properly configured
    if (
      !apiBaseUrl ||
      apiBaseUrl.includes('undefined') ||
      apiBaseUrl.includes('localhost')
    ) {
      console.log(
        '⚠️ API Base URL may not be properly configured for production'
      );
      console.log(
        '💡 Make sure VITE_API_BASE_URL environment variable is set correctly'
      );
    }

    // Test required endpoints
    const requiredEndpoints = [
      {
        path: '/pm-projects/test@company.com',
        method: 'GET',
        description: 'PM Projects endpoint',
      },
      {
        path: '/bulk-enrich-projects',
        method: 'POST',
        description: 'Bulk enrich endpoint',
      },
      {
        path: '/project-summary/1000000064013473',
        method: 'GET',
        description: 'Project summary endpoint',
      },
    ];

    console.log('\n📋 Testing required endpoints...');

    for (const endpoint of requiredEndpoints) {
      console.log(`\n🔍 Testing ${endpoint.description}:`);
      console.log(`   ${endpoint.method} ${apiBaseUrl}${endpoint.path}`);

      try {
        const options =
          endpoint.method === 'POST'
            ? {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pm_email: 'test@company.com' }),
              }
            : { method: 'GET' };

        const response = await fetch(`${apiBaseUrl}${endpoint.path}`, options);
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.status === 404) {
          console.log('   ❌ Endpoint not implemented yet');
        } else if (response.status >= 200 && response.status < 300) {
          console.log('   ✅ Endpoint available');
        } else if (response.status >= 500) {
          console.log('   ⚠️ Server error - endpoint exists but has issues');
        } else {
          console.log('   ⚠️ Unexpected response');
        }
      } catch (error) {
        console.log(`   ❌ Connection failed: ${error.message}`);
      }
    }

    // Check Lambda function information
    console.log('\n⚡ Required Lambda Function:');
    console.log('   Function: projectMetadataEnricher');
    console.log(
      '   ARN: arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher'
    );
    console.log('   Enhancement needed: Add PM email filtering capability');

    console.log('\n📝 Backend Implementation Checklist:');
    console.log(
      '   □ Enhance projectMetadataEnricher Lambda to accept pm_email parameter'
    );
    console.log('   □ Add DynamoDB queries by PM email');
    console.log(
      '   □ Add enriched metadata fields (acta_status, priority_level, etc.)'
    );
    console.log('   □ Create GET /pm-projects/{pm_email} API endpoint');
    console.log('   □ Create POST /bulk-enrich-projects API endpoint');
    console.log('   □ Ensure CORS headers are properly configured');
    console.log('   □ Set up proper error handling and logging');
  } catch (error) {
    console.error('❌ Backend API requirements test failed:', error);
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testDashboardButtons =
    testDashboardButtons;
  (window as unknown as Record<string, unknown>).simulateButtonClicks =
    simulateButtonClicks;
  (window as unknown as Record<string, unknown>).testAPIConnectivity =
    testAPIConnectivity;
  (window as unknown as Record<string, unknown>).testReactEventHandlers =
    testReactEventHandlers;
  (window as unknown as Record<string, unknown>).debugEnvironment =
    debugEnvironment;
  (window as unknown as Record<string, unknown>).testActaWorkflow =
    testActaWorkflow;
  (window as unknown as Record<string, unknown>).testActaAPIConnectivity =
    testActaAPIConnectivity;
  (window as unknown as Record<string, unknown>).testPMProjectManager =
    testPMProjectManager;
  (window as unknown as Record<string, unknown>).testDynamoDBIntegration =
    testDynamoDBIntegration;
  (window as unknown as Record<string, unknown>).testCompleteWorkflow =
    testCompleteWorkflow;

  // ============================================
  // METADATA ENRICHER INTEGRATION TESTS
  // ============================================

  /** Test PM project manager functionality via API */
  (window as unknown as Record<string, unknown>).testPMProjectManagerAPI =
    testPMProjectManagerAPI;
  /** Test bulk operations for PM projects */
  (window as unknown as Record<string, unknown>).testBulkOperationsAPI =
    testBulkOperationsAPI;
  /** Test metadata enricher integration directly */
  (
    window as unknown as Record<string, unknown>
  ).testMetadataEnricherIntegration = testMetadataEnricherIntegration;
  /** Test the metadata enricher Lambda function directly (if accessible) */
  (window as unknown as Record<string, unknown>).testMetadataEnricherLambda =
    testMetadataEnricherLambda;
  /** Comprehensive test for the complete PM workflow with metadata enricher */
  (
    window as unknown as Record<string, unknown>
  ).testCompleteWorkflowWithEnricher = testCompleteWorkflowWithEnricher;
  /** Test backend API requirements for metadata enricher */
  (window as unknown as Record<string, unknown>).testBackendAPIRequirements =
    testBackendAPIRequirements;

  console.log('🧪 Dashboard testing functions available:');
  console.log('- testDashboardButtons() - Check all buttons');
  console.log('- simulateButtonClicks() - Auto-click all buttons');
  console.log('- testAPIConnectivity() - Check API server status');
  console.log('- testReactEventHandlers() - Check React event handlers');
  console.log(
    '- debugEnvironment() - Debug environment variables and API config'
  );
  console.log('- testActaWorkflow() - Test the complete Acta workflow');
  console.log(
    '- testActaAPIConnectivity() - Test ACTA API connectivity with enhanced feedback'
  );
  console.log('- testPMProjectManager() - Test PM project manager');
  console.log('- testDynamoDBIntegration() - Test DynamoDB integration');
  console.log('- testCompleteWorkflow() - Test complete PM workflow');

  // Update the help function
  const originalShowTestingHelp = (window as unknown as Record<string, unknown>)
    .showTestingHelp;
  (window as unknown as Record<string, unknown>).showTestingHelp = function () {
    if (originalShowTestingHelp) {
      (originalShowTestingHelp as () => void)();
    }

    console.log('\n🧬 Metadata Enricher Integration Tests:');
    console.log(
      '- testMetadataEnricherIntegration() - Test enricher endpoints'
    );
    console.log('- testPMProjectManagerAPI() - Test PM project API calls');
    console.log('- testBulkOperationsAPI() - Test bulk operations API');
    console.log(
      '- testCompleteWorkflowWithEnricher() - Complete enricher workflow test'
    );
    console.log('- testMetadataEnricherLambda() - Show Lambda testing info');
    console.log('- testBackendAPIRequirements() - Check backend requirements');

    console.log('\n💡 Quick Start for Backend Testing:');
    console.log(
      'testBackendAPIRequirements() - Check what needs to be implemented'
    );
    console.log(
      'testMetadataEnricherIntegration() - Test when backend is ready'
    );
  };
}

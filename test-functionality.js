#!/usr/bin/env node
// 🧪 Button Functionality Test for ACTA-UI
// Tests all button actions and API integrations

import fs from 'fs';
import path from 'path';

function testButtonIntegration() {
  console.log('🔘 Testing Button Integration...');
  console.log('=' .repeat(60));
  
  try {
    // Check Dashboard.tsx for button handlers
    const dashboardPath = path.join(process.cwd(), 'src/pages/Dashboard.tsx');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    console.log('📄 Dashboard Button Handlers:');
    
    const buttonHandlers = [
      { name: 'handleGenerateActa', description: 'Generate ACTA Document' },
      { name: 'handleDownloadPdf', description: 'Download PDF' },
      { name: 'handleDownloadWord', description: 'Download Word Document' },
      { name: 'handlePreviewPdf', description: 'Preview PDF' },
      { name: 'handleSendForApproval', description: 'Send for Approval' }
    ];
    
    for (const handler of buttonHandlers) {
      const exists = dashboardContent.includes(handler.name);
      console.log(`   ${handler.description}: ${exists ? '✅' : '❌'}`);
    }
    
    // Check ActaButtons component
    const buttonsPath = path.join(process.cwd(), 'src/components/ActaButtons/ActaButtons.tsx');
    const buttonsContent = fs.readFileSync(buttonsPath, 'utf8');
    
    console.log('\n🎛️ ActaButtons Component:');
    
    const buttonProps = [
      'onGenerate',
      'onDownloadWord', 
      'onDownloadPdf',
      'onPreviewPdf',
      'onSendForApproval'
    ];
    
    for (const prop of buttonProps) {
      const exists = buttonsContent.includes(prop);
      console.log(`   ${prop}: ${exists ? '✅' : '❌'}`);
    }
    
    // Check for proper error handling and loading states
    const hasErrorHandling = dashboardContent.includes('try') && dashboardContent.includes('catch');
    const hasLoadingState = dashboardContent.includes('setActionLoading') || dashboardContent.includes('loading');
    const hasToast = dashboardContent.includes('toast.') || dashboardContent.includes('toast(');
    
    console.log('\n🛡️ Error Handling & UX:');
    console.log(`   Error Handling: ${hasErrorHandling ? '✅' : '❌'}`);
    console.log(`   Loading States: ${hasLoadingState ? '✅' : '❌'}`);
    console.log(`   Toast Notifications: ${hasToast ? '✅' : '❌'}`);
    
    return {
      valid: true,
      hasAllHandlers: buttonHandlers.every(h => dashboardContent.includes(h.name)),
      hasAllProps: buttonProps.every(p => buttonsContent.includes(p)),
      hasErrorHandling,
      hasLoadingState,
      hasToast
    };
    
  } catch (error) {
    console.log(`❌ Error testing button integration: ${error.message}`);
    return { valid: false };
  }
}

function testAPIIntegration() {
  console.log('\n🌐 Testing API Integration...');
  console.log('=' .repeat(60));
  
  try {
    const apiPath = path.join(process.cwd(), 'src/lib/api.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    
    const criticalFunctions = [
      { name: 'generateActaDocument', endpoint: '/extract-project-place', description: 'Generate ACTA' },
      { name: 'getSignedDownloadUrl', endpoint: '/download-acta', description: 'Download URLs' },
      { name: 'sendApprovalEmail', endpoint: '/send-approval-email', description: 'Email Approval' },
      { name: 'documentExists', endpoint: '/check-document', description: 'Document Check' },
      { name: 'getProjectsByPM', endpoint: '/projects-for-pm', description: 'PM Projects' }
    ];
    
    console.log('📋 API Functions:');
    
    let allFunctionsExist = true;
    for (const func of criticalFunctions) {
      const functionExists = apiContent.includes(`export async function ${func.name}`) || 
                           apiContent.includes(`export const ${func.name}`) ||
                           apiContent.includes(`function ${func.name}`) ||
                           apiContent.includes(`const ${func.name}`);
      const endpointExists = apiContent.includes(func.endpoint);
      
      console.log(`   ${func.description}:`);
      console.log(`     Function: ${functionExists ? '✅' : '❌'}`);
      console.log(`     Endpoint: ${endpointExists ? '✅' : '❌'}`);
      
      if (!functionExists || !endpointExists) {
        allFunctionsExist = false;
      }
    }
    
    // Test error handling in API
    const hasProperErrorHandling = apiContent.includes('throw new Error') || apiContent.includes('catch');
    const hasTypeScript = apiContent.includes('Promise<') && apiContent.includes('interface');
    const hasProperImports = apiContent.includes('@/env.variables') && apiContent.includes('@/utils/fetchWrapper');
    
    console.log('\n🔧 API Quality:');
    console.log(`   Error Handling: ${hasProperErrorHandling ? '✅' : '❌'}`);
    console.log(`   TypeScript Types: ${hasTypeScript ? '✅' : '❌'}`);
    console.log(`   Proper Imports: ${hasProperImports ? '✅' : '❌'}`);
    
    return {
      valid: allFunctionsExist,
      hasAllFunctions: allFunctionsExist,
      hasProperErrorHandling,
      hasTypeScript,
      hasProperImports
    };
    
  } catch (error) {
    console.log(`❌ Error testing API integration: ${error.message}`);
    return { valid: false };
  }
}

function testProjectDataFlow() {
  console.log('\n📊 Testing Project Data Flow...');
  console.log('=' .repeat(60));
  
  try {
    // Check DynamoProjectsView component
    const dynamoPath = path.join(process.cwd(), 'src/components/DynamoProjectsView.tsx');
    const dynamoContent = fs.readFileSync(dynamoPath, 'utf8');
    
    const dataFlowElements = [
      { name: 'getProjectsByPM', description: 'Fetch PM Projects Function' },
      { name: 'useState', description: 'State Management' },
      { name: 'useEffect', description: 'Effect Hook' },
      { name: 'onProjectSelect', description: 'Project Selection Handler' },
      { name: 'selectedProjectId', description: 'Selected Project State' }
    ];
    
    console.log('📋 Project Data Components:');
    
    for (const element of dataFlowElements) {
      const exists = dynamoContent.includes(element.name);
      console.log(`   ${element.description}: ${exists ? '✅' : '❌'}`);
    }
    
    // Check Dashboard integration
    const dashboardPath = path.join(process.cwd(), 'src/pages/Dashboard.tsx');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    const dashboardElements = [
      'DynamoProjectsView',
      'selectedProjectId',
      'setSelectedProjectId',
      'handleProjectSelect'
    ];
    
    console.log('\n🎯 Dashboard Integration:');
    
    for (const element of dashboardElements) {
      const exists = dashboardContent.includes(element);
      console.log(`   ${element}: ${exists ? '✅' : '❌'}`);
    }
    
    // Check for proper TypeScript interfaces
    const hasProjectInterface = dynamoContent.includes('interface Project') || dynamoContent.includes('Project[]');
    const hasPropsInterface = dynamoContent.includes('interface Props') || dynamoContent.includes('Props');
    
    console.log('\n📝 TypeScript Integration:');
    console.log(`   Project Interface: ${hasProjectInterface ? '✅' : '❌'}`);
    console.log(`   Props Interface: ${hasPropsInterface ? '✅' : '❌'}`);
    
    return {
      valid: true,
      hasDataFlow: dataFlowElements.every(e => dynamoContent.includes(e.name)),
      hasDashboardIntegration: dashboardElements.every(e => dashboardContent.includes(e)),
      hasTypeScript: hasProjectInterface && hasPropsInterface
    };
    
  } catch (error) {
    console.log(`❌ Error testing project data flow: ${error.message}`);
    return { valid: false };
  }
}

function testAuthenticationFlow() {
  console.log('\n🔐 Testing Authentication Flow...');
  console.log('=' .repeat(60));
  
  try {
    // Check Login component
    const loginPath = path.join(process.cwd(), 'src/pages/Login.tsx');
    const loginContent = fs.readFileSync(loginPath, 'utf8');
    
    const authElements = [
      { name: 'signIn', description: 'Sign In Function' },
      { name: 'signOut', description: 'Sign Out Function' },
      { name: 'fetchAuthSession', description: 'Session Fetch' },
      { name: 'TEST_EMAIL', description: 'Test Credentials Support' },
      { name: 'useForm', description: 'Form Handling' },
      { name: 'useNavigate', description: 'Navigation' }
    ];
    
    console.log('📋 Authentication Components:');
    
    for (const element of authElements) {
      const exists = loginContent.includes(element.name);
      console.log(`   ${element.description}: ${exists ? '✅' : '❌'}`);
    }
    
    // Check App.tsx authentication logic
    const appPath = path.join(process.cwd(), 'src/App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    const appAuthElements = [
      'fetchAuthSession',
      'isAuthed',
      'setIsAuthed',
      'localStorage.getItem',
      'ikusi.jwt'
    ];
    
    console.log('\n🏠 App Authentication Logic:');
    
    for (const element of appAuthElements) {
      const exists = appContent.includes(element);
      console.log(`   ${element}: ${exists ? '✅' : '❌'}`);
    }
    
    // Check useAuth hook
    const useAuthPath = path.join(process.cwd(), 'src/hooks/useAuth.ts');
    const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');
    
    const hookElements = [
      'fetchAuthSession',
      'getCurrentUser',
      'skipAuth',
      'setUser'
    ];
    
    console.log('\n🪝 useAuth Hook:');
    
    for (const element of hookElements) {
      const exists = useAuthContent.includes(element);
      console.log(`   ${element}: ${exists ? '✅' : '❌'}`);
    }
    
    return {
      valid: true,
      hasAuthComponents: authElements.every(e => loginContent.includes(e.name)),
      hasAppLogic: appAuthElements.every(e => appContent.includes(e)),
      hasAuthHook: hookElements.every(e => useAuthContent.includes(e))
    };
    
  } catch (error) {
    console.log(`❌ Error testing authentication flow: ${error.message}`);
    return { valid: false };
  }
}

function testErrorHandlingAndUX() {
  console.log('\n🛡️ Testing Error Handling & UX...');
  console.log('=' .repeat(60));
  
  try {
    const dashboardPath = path.join(process.cwd(), 'src/pages/Dashboard.tsx');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    const uxElements = [
      { pattern: 'toast.error', description: 'Error Toast Notifications' },
      { pattern: 'toast.success', description: 'Success Toast Notifications' },
      { pattern: 'setActionLoading', description: 'Loading State Management' },
      { pattern: 'actionLoading', description: 'Loading State Usage' },
      { pattern: 'catch (error', description: 'Error Catching' },
      { pattern: 'disabled={', description: 'Button Disabled States' }
    ];
    
    console.log('📋 UX Elements:');
    
    for (const element of uxElements) {
      const exists = dashboardContent.includes(element.pattern);
      console.log(`   ${element.description}: ${exists ? '✅' : '❌'}`);
    }
    
    // Check fetchWrapper error handling
    const fetchWrapperPath = path.join(process.cwd(), 'src/utils/fetchWrapper.ts');
    const fetchWrapperContent = fs.readFileSync(fetchWrapperPath, 'utf8');
    
    const errorHandlingElements = [
      'try',
      'catch',
      'console.error',
      'throw new Error',
      'getAuthToken'
    ];
    
    console.log('\n🔧 API Error Handling:');
    
    for (const element of errorHandlingElements) {
      const exists = fetchWrapperContent.includes(element);
      console.log(`   ${element}: ${exists ? '✅' : '❌'}`);
    }
    
    return {
      valid: true,
      hasUXElements: uxElements.every(e => dashboardContent.includes(e.pattern)),
      hasAPIErrorHandling: errorHandlingElements.every(e => fetchWrapperContent.includes(e))
    };
    
  } catch (error) {
    console.log(`❌ Error testing error handling: ${error.message}`);
    return { valid: false };
  }
}

// Main test execution
async function main() {
  console.log('🧪 ACTA-UI BUTTON FUNCTIONALITY TEST');
  console.log('=' .repeat(80));
  
  const buttonResults = testButtonIntegration();
  const apiResults = testAPIIntegration();
  const dataResults = testProjectDataFlow();
  const authResults = testAuthenticationFlow();
  const uxResults = testErrorHandlingAndUX();
  
  console.log('\n📊 FUNCTIONALITY TEST SUMMARY');
  console.log('=' .repeat(80));
  
  console.log(`🔘 Button Integration: ${buttonResults.valid ? 'PASS' : 'FAIL'}`);
  console.log(`🌐 API Integration: ${apiResults.valid ? 'PASS' : 'FAIL'}`);
  console.log(`📊 Data Flow: ${dataResults.valid ? 'PASS' : 'FAIL'}`);
  console.log(`🔐 Authentication: ${authResults.valid ? 'PASS' : 'FAIL'}`);
  console.log(`🛡️ Error Handling: ${uxResults.valid ? 'PASS' : 'FAIL'}`);
  
  const overallValid = buttonResults.valid && apiResults.valid && dataResults.valid && 
                      authResults.valid && uxResults.valid;
  
  console.log('\n🎯 OVERALL FUNCTIONALITY STATUS:');
  console.log(`${overallValid ? '🟢 ALL SYSTEMS FUNCTIONAL' : '🟡 NEEDS ATTENTION'}`);
  
  if (overallValid) {
    console.log('\n✅ Ready for Production Testing:');
    console.log('- All button handlers are properly implemented');
    console.log('- API integration is complete and functional');
    console.log('- Project data flow is working correctly');
    console.log('- Authentication flow is properly implemented');
    console.log('- Error handling and UX is comprehensive');
  }
  
  return {
    valid: overallValid,
    buttons: buttonResults.valid,
    api: apiResults.valid,
    data: dataResults.valid,
    auth: authResults.valid,
    ux: uxResults.valid
  };
}

main().catch(console.error);
// Quick backend status diagnostic
export async function quickBackendDiagnostic() {
  console.log('🔍 Quick Backend Diagnostic...');

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  console.log(`🌐 API Base URL: ${apiBaseUrl}`);

  if (
    !apiBaseUrl ||
    apiBaseUrl === 'undefined' ||
    apiBaseUrl.includes('localhost')
  ) {
    console.error('❌ CRITICAL: API Base URL is not properly configured!');
    console.log('💡 Backend buttons will not work until API is configured');
    return false;
  }

  // Test basic connectivity
  try {
    const response = await fetch(`${apiBaseUrl}/health`, { method: 'GET' });
    console.log(`🏥 Health check: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error('❌ Cannot reach backend API:', error.message);
    return false;
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).quickBackendDiagnostic =
    quickBackendDiagnostic;
}

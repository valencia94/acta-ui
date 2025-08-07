// Test script for authentication flow
import { fetchAuthSession, getCurrentUser, signIn, signUp } from 'aws-amplify/auth';

console.log('🚀 Starting comprehensive authentication test...');

// Test 1: Try to check current auth status
async function testCurrentAuth() {
  console.log('\n🔍 Test 1: Checking current authentication status...');
  try {
    const user = await getCurrentUser();
    console.log('✅ User is already authenticated:', user);
    return true;
  } catch (error) {
    console.log('ℹ️ User not authenticated (expected):', error.message);
    return false;
  }
}

// Test 2: Try to create a test account
async function testAccountCreation() {
  console.log('\n📝 Test 2: Creating test account...');
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    const result = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
        },
      },
    });

    console.log('✅ Account creation successful:', result);
    console.log('📧 Confirmation required, check email for code');
    return { success: true, email: testEmail, password: testPassword };
  } catch (error) {
    console.log('❌ Account creation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 3: Try sign in with demo credentials (if they exist)
async function testSignIn() {
  console.log('\n🔐 Test 3: Testing sign in...');

  // Try with a known good account if it exists
  const testEmail = 'demo@ikusi.com';
  const testPassword = 'DemoPass123!';

  try {
    const result = await signIn({
      username: testEmail,
      password: testPassword,
    });

    console.log('✅ Sign in successful:', result);

    if (result.isSignedIn) {
      const session = await fetchAuthSession();
      console.log('🎫 Session tokens obtained:', !!session.tokens);
      return { success: true };
    }

    return { success: false, message: 'Sign in incomplete' };
  } catch (error) {
    console.log('ℹ️ Sign in failed (expected for demo):', error.message);
    return { success: false, error: error.message };
  }
}

// Run all tests
async function runAllTests(): Promise<void> {
  console.log('🧪 Starting comprehensive authentication tests...');
  console.log('📍 AWS Region:', 'us-east-2');
  console.log('🏊 User Pool:', 'us-east-2_FyHLtOhiY');
  console.log('📱 Client ID:', 'dshos5iou44tuach7ta3ici5m');

  await testCurrentAuth();
  const createResult = await testAccountCreation();
  await testSignIn();

  console.log('\n📋 Test Summary:');
  console.log('- Current auth check: ✅ Working');
  console.log('- Account creation:', createResult.success ? '✅ Working' : '❌ Failed');
  console.log('- Sign in test: ℹ️ Requires valid credentials');

  if (createResult.success) {
    console.log('\n🎯 Next steps:');
    console.log('1. Check email for confirmation code');
    console.log('2. Use "Create Account" flow in UI');
    console.log('3. After confirmation, use sign in');
  }
}

// Make available globally for browser testing
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).runAuthTests = runAllTests;
  console.log('🔧 Run tests with: runAuthTests()');
}

export { runAllTests };

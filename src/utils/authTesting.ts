// Test Authentication Flow
// This is a test file to help debug authentication issues

import { confirmSignUp, resetPassword, signIn, signUp } from 'aws-amplify/auth';

// Test account creation
export async function testCreateAccount(): Promise<void> {
  try {
    console.log('🔧 Testing account creation...');

    const testEmail = 'test@example.com';
    const testPassword = 'TempPass123!';

    const result = await signUp({
      username: testEmail,
      password: testPassword,
      options: {
        userAttributes: {
          email: testEmail,
        },
      },
    });

    console.log('✅ Account creation result:', result);

    if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
      console.log('📧 Confirmation required. Check email for code.');
      console.log({ success: true, needsConfirmation: true, email: testEmail });
      return;
    }

    console.log({ success: true, needsConfirmation: false });
  } catch (error) {
    console.error('❌ Account creation failed:', error);
    console.error({ success: false, error: (error as Error).message });
  }
}

// Test account confirmation
export async function testConfirmAccount(email: string, code: string): Promise<void> {
  try {
    console.log('🔧 Testing account confirmation...');

    await confirmSignUp({
      username: email,
      confirmationCode: code,
    });

    console.log('✅ Account confirmed successfully');
    console.log({ success: true });
  } catch (error) {
    console.error('❌ Account confirmation failed:', error);
    console.error({ success: false, error: (error as Error).message });
  }
}

// Test sign in
export async function testSignIn(email: string, password: string): Promise<void> {
  try {
    console.log('🔧 Testing sign in...');

    const result = await signIn({ username: email, password });

    console.log('✅ Sign in result:', result);

    if (result.isSignedIn) {
      console.log('🎉 Successfully signed in!');
      console.log({ success: true });
      return;
    }

    console.error({ success: false, error: 'Sign in incomplete' });
  } catch (error) {
    console.error('❌ Sign in failed:', error);
    console.error({ success: false, error: (error as Error).message });
  }
}

// Test password reset
export async function testPasswordReset(email: string): Promise<void> {
  try {
    console.log('🔧 Testing password reset...');

    await resetPassword({ username: email });

    console.log('✅ Password reset code sent');
    console.log({ success: true });
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    console.error({ success: false, error: (error as Error).message });
  }
}

// Make these available in browser console for testing
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testAuth = {
    createAccount: testCreateAccount,
    confirmAccount: testConfirmAccount,
    signIn: testSignIn,
    passwordReset: testPasswordReset,
  };

  console.log('🧪 Auth testing functions available:');
  console.log('- testAuth.createAccount()');
  console.log('- testAuth.confirmAccount(email, code)');
  console.log('- testAuth.signIn(email, password)');
  console.log('- testAuth.passwordReset(email)');
}

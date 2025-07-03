// src/pages/Login.tsx
import {
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from '@aws-amplify/auth';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { skipAuth } from '@/env.variables';

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
  confirmationCode?: string;
  newPassword?: string;
}

type AuthMode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset';

const logoSrc = '/assets/ikusi-logo.png';

export default function Login() {
  const nav = useNavigate();
  const { register, handleSubmit, watch, reset } = useForm<FormData>();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Ensure document title is always correct
  useEffect(() => {
    document.title = 'Ikusi · Acta Platform';
  }, []);

  useEffect(() => {
    // Only sign out if we're not in skip auth mode
    if (!skipAuth) {
      signOut().catch(() => {});
    }
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    clearMessages();

    try {
      if (skipAuth) {
        // In skip auth mode, just simulate login
        localStorage.setItem('ikusi.jwt', 'dev-token');
        nav('/dashboard');
        return;
      }

      switch (authMode) {
        case 'signin':
          await handleSignIn(data);
          break;
        case 'signup':
          await handleSignUp(data);
          break;
        case 'confirm':
          await handleConfirmSignUp(data);
          break;
        case 'forgot':
          await handleForgotPassword(data);
          break;
        case 'reset':
          await handleResetPassword(data);
          break;
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An error occurred during authentication';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignIn({ email, password }: FormData) {
    console.log('🔐 Starting sign-in process...');
    const result = await signIn({ username: email, password });
    console.log('🔐 Sign-in result:', result);

    if (result.isSignedIn) {
      console.log('✅ User is signed in, fetching session...');
      const session = await fetchAuthSession();
      console.log('🎫 Session:', session);

      const token = session.tokens?.idToken?.toString() ?? '';
      console.log('🎫 Token length:', token.length);

      localStorage.setItem('ikusi.jwt', token);
      console.log('💾 Token saved to localStorage');

      // Dispatch a custom event to notify App component
      window.dispatchEvent(new Event('auth-success'));
      console.log('📢 Auth success event dispatched');

      console.log('🔄 Navigating to dashboard...');
      nav('/dashboard');
    } else {
      console.log('❌ Sign-in failed or incomplete');
    }
  }

  async function handleSignUp({ email, password }: FormData) {
    const result = await signUp({
      username: email,
      password: password!,
      options: {
        userAttributes: {
          email: email,
        },
      },
    });

    if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
      setUserEmail(email);
      setAuthMode('confirm');
      setSuccess(
        'Account created! Please check your email for a confirmation code.'
      );
      reset();
    }
  }

  async function handleConfirmSignUp({ confirmationCode }: FormData) {
    await confirmSignUp({
      username: userEmail,
      confirmationCode: confirmationCode!,
    });

    setSuccess('Account confirmed! You can now sign in.');
    setAuthMode('signin');
    reset();
  }

  async function handleForgotPassword({ email }: FormData) {
    await resetPassword({ username: email });
    setUserEmail(email);
    setAuthMode('reset');
    setSuccess('Password reset code sent to your email.');
    reset();
  }

  async function handleResetPassword({
    confirmationCode,
    newPassword,
  }: FormData) {
    await confirmResetPassword({
      username: userEmail,
      confirmationCode: confirmationCode!,
      newPassword: newPassword!,
    });

    setSuccess(
      'Password reset successfully! You can now sign in with your new password.'
    );
    setAuthMode('signin');
    reset();
  }

  const MotionButton = motion.button;

  const getTitle = () => {
    switch (authMode) {
      case 'signin':
        return 'Sign In';
      case 'signup':
        return 'Create Account';
      case 'confirm':
        return 'Confirm Account';
      case 'forgot':
        return 'Reset Password';
      case 'reset':
        return 'Set New Password';
      default:
        return 'Sign In';
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Please wait...';
    switch (authMode) {
      case 'signin':
        return 'Sign In';
      case 'signup':
        return 'Create Account';
      case 'confirm':
        return 'Confirm Account';
      case 'forgot':
        return 'Send Reset Code';
      case 'reset':
        return 'Reset Password';
      default:
        return 'Sign In';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-50 to-emerald-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-200">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src={logoSrc}
              alt="Ikusi logo"
              className="mx-auto h-20 w-auto mb-4 drop-shadow-sm"
              onError={(e) => {
                console.error('Logo failed to load:', logoSrc);
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Acta Platform
            </h1>
            <p className="text-sm text-teal-600 font-medium">
              {authMode === 'confirm'
                ? 'Enter the code sent to your email'
                : authMode === 'forgot'
                  ? 'Enter your email to reset password'
                  : authMode === 'reset'
                    ? 'Enter new password and confirmation code'
                    : 'invisible technology, visible transformation'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm"
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field - shown for signin, signup, forgot */}
            {(authMode === 'signin' ||
              authMode === 'signup' ||
              authMode === 'forgot') && (
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder=" "
                  required
                  {...register('email')}
                  className="
                    peer h-12 w-full px-4 pt-4 pb-2
                    border-2 border-gray-300 rounded-xl
                    bg-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200
                    transition-all duration-200
                    text-gray-900 placeholder-transparent
                  "
                />
                <label
                  htmlFor="email"
                  className="
                    absolute left-4 top-4 text-gray-600 text-sm font-medium
                    transition-all duration-200 pointer-events-none
                    peer-focus:top-2 peer-focus:text-xs peer-focus:text-green-600
                    peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs
                  "
                >
                  Email Address
                </label>
              </div>
            )}

            {/* Password Field - shown for signin, signup */}
            {(authMode === 'signin' || authMode === 'signup') && (
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  placeholder=" "
                  required
                  {...register('password')}
                  className="
                    peer h-12 w-full px-4 pt-4 pb-2
                    border-2 border-gray-300 rounded-xl
                    bg-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200
                    transition-all duration-200
                    text-gray-900 placeholder-transparent
                  "
                />
                <label
                  htmlFor="password"
                  className="
                    absolute left-4 top-4 text-gray-600 text-sm font-medium
                    transition-all duration-200 pointer-events-none
                    peer-focus:top-2 peer-focus:text-xs peer-focus:text-green-600
                    peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs
                  "
                >
                  Password
                </label>
              </div>
            )}

            {/* Confirm Password Field - shown for signup */}
            {authMode === 'signup' && (
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder=" "
                  required
                  {...register('confirmPassword', {
                    validate: (value) => {
                      const password = watch('password');
                      return value === password || 'Passwords do not match';
                    },
                  })}
                  className="
                    peer h-12 w-full px-4 pt-4 pb-2
                    border-2 border-gray-300 rounded-xl
                    bg-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200
                    transition-all duration-200
                    text-gray-900 placeholder-transparent
                  "
                />
                <label
                  htmlFor="confirmPassword"
                  className="
                    absolute left-4 top-4 text-gray-600 text-sm font-medium
                    transition-all duration-200 pointer-events-none
                    peer-focus:top-2 peer-focus:text-xs peer-focus:text-green-600
                    peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs
                  "
                >
                  Confirm Password
                </label>
              </div>
            )}

            {/* Confirmation Code Field - shown for confirm and reset */}
            {(authMode === 'confirm' || authMode === 'reset') && (
              <div className="relative">
                <input
                  id="confirmationCode"
                  type="text"
                  placeholder=" "
                  required
                  {...register('confirmationCode')}
                  className="
                    peer h-12 w-full px-4 pt-4 pb-2
                    border-2 border-gray-300 rounded-xl
                    bg-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200
                    transition-all duration-200
                    text-gray-900 placeholder-transparent
                  "
                />
                <label
                  htmlFor="confirmationCode"
                  className="
                    absolute left-4 top-4 text-gray-600 text-sm font-medium
                    transition-all duration-200 pointer-events-none
                    peer-focus:top-2 peer-focus:text-xs peer-focus:text-green-600
                    peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs
                  "
                >
                  Confirmation Code
                </label>
              </div>
            )}

            {/* New Password Field - shown for reset */}
            {authMode === 'reset' && (
              <div className="relative">
                <input
                  id="newPassword"
                  type="password"
                  placeholder=" "
                  required
                  {...register('newPassword')}
                  className="
                    peer h-12 w-full px-4 pt-4 pb-2
                    border-2 border-gray-300 rounded-xl
                    bg-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200
                    transition-all duration-200
                    text-gray-900 placeholder-transparent
                  "
                />
                <label
                  htmlFor="newPassword"
                  className="
                    absolute left-4 top-4 text-gray-600 text-sm font-medium
                    transition-all duration-200 pointer-events-none
                    peer-focus:top-2 peer-focus:text-xs peer-focus:text-green-600
                    peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs
                  "
                >
                  New Password
                </label>
              </div>
            )}

            {/* Submit Button */}
            <MotionButton
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="
                w-full h-12 
                bg-gradient-to-r from-green-500 to-teal-500
                hover:from-green-600 hover:to-teal-600
                disabled:from-gray-400 disabled:to-gray-500
                disabled:cursor-not-allowed
                text-white font-semibold rounded-xl
                focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2
                transition-all duration-200
                shadow-lg hover:shadow-xl
              "
            >
              {getButtonText()}
            </MotionButton>
          </form>

          {/* Navigation Links */}
          <div className="mt-6 space-y-4">
            {authMode === 'signin' && (
              <div className="flex flex-col space-y-2 text-sm text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('forgot');
                    clearMessages();
                    reset();
                  }}
                  className="text-teal-600 hover:text-teal-800 font-medium transition-colors"
                >
                  Forgot your password?
                </button>
                <div className="text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      clearMessages();
                      reset();
                    }}
                    className="text-teal-600 hover:text-teal-800 font-medium transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}

            {authMode === 'signup' && (
              <div className="text-sm text-center text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    clearMessages();
                    reset();
                  }}
                  className="text-teal-600 hover:text-teal-800 font-medium transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}

            {(authMode === 'confirm' ||
              authMode === 'forgot' ||
              authMode === 'reset') && (
              <div className="text-sm text-center text-gray-600">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    clearMessages();
                    reset();
                  }}
                  className="text-teal-600 hover:text-teal-800 font-medium transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {skipAuth
                ? '🚀 Demo mode - any credentials will work'
                : authMode === 'signin'
                  ? '🔐 Enter your credentials to continue'
                  : authMode === 'signup'
                    ? '✨ Create your account to get started'
                    : authMode === 'confirm'
                      ? '📧 Check your email for the confirmation code'
                      : authMode === 'forgot'
                        ? '🔑 We will send you a password reset code'
                        : '🛡️ Enter your new password'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

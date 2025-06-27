// src/pages/Login.tsx
import { fetchAuthSession, signIn, signOut } from '@aws-amplify/auth';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { skipAuth } from '@/env.variables';

interface FormData {
  email: string;
  password: string;
}

const logoSrc = '/assets/ikusi-logo.png';

export default function Login() {
  const nav = useNavigate();
  const { register, handleSubmit } = useForm<FormData>();

  useEffect(() => {
    // Only sign out if we're not in skip auth mode
    if (!skipAuth) {
      signOut().catch(() => {});
    }
  }, []);

  async function onSubmit({ email, password }: FormData) {
    try {
      if (skipAuth) {
        // In skip auth mode, just simulate login
        localStorage.setItem('ikusi.jwt', 'dev-token');
        nav('/dashboard');
        return;
      }

      // Real authentication
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString() ?? '';
        localStorage.setItem('ikusi.jwt', token);
        nav('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Sign-in failed');
    }
  }

  const MotionButton = motion.button;

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
              invisible technology, visible transformation
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
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

            {/* Password Field */}
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

            {/* Submit Button */}
            <MotionButton
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="
                w-full h-12 
                bg-gradient-to-r from-green-500 to-teal-500
                hover:from-green-600 hover:to-teal-600
                text-white font-semibold rounded-xl
                focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2
                transition-all duration-200
                shadow-lg hover:shadow-xl
              "
            >
              Sign In
            </MotionButton>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {skipAuth
                ? '🚀 Demo mode - any credentials will work'
                : '🔐 Enter your credentials to continue'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

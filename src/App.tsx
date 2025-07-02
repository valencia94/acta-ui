// src/App.tsx

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
// Conditional imports for development debugging components
import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Header from '@/components/Header';
import { skipAuth } from '@/env.variables';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { useThemedFavicon } from '@/hooks/useThemedFavicon';
import AdminDashboard from '@/pages/AdminDashboard';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

// Only load debug components in development
const AuthDebugger = import.meta.env.DEV
  ? lazy(() => import('@/components/AuthDebugger'))
  : null;

const DashboardTester = import.meta.env.DEV
  ? lazy(() => import('@/components/DashboardTester'))
  : null;

// Load test utilities only in development
if (import.meta.env.DEV) {
  import('@/utils/authTesting').catch(() => {}); // Import auth testing utilities
  import('@/utils/authFlowTest').catch(() => {}); // Import comprehensive auth flow tests
  import('@/utils/dashboardTesting').catch(() => {}); // Import dashboard button testing
}

import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

export default function App() {
  useThemedFavicon();
  useIdleLogout(30);

  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Ensure the document title stays correct
  useEffect(() => {
    document.title = 'Ikusi · Acta Platform';
  }, []);

  useEffect(() => {
    if (skipAuth) {
      setIsAuthed(true);
      setChecked(true);
      return;
    }

    const verify = async () => {
      console.log('🔍 App: Verifying auth status...');
      try {
        // First check if we have a token in localStorage
        const localToken = localStorage.getItem('ikusi.jwt');
        console.log('🔍 App: Local token exists:', !!localToken);

        if (!localToken) {
          console.log('🔍 App: No local token, setting auth to false');
          setIsAuthed(false);
          setChecked(true);
          return;
        }

        console.log('🔍 App: Fetching AWS session...');
        // If we have a local token, verify with AWS
        const { tokens } = await fetchAuthSession();
        const token = tokens?.idToken?.toString() ?? '';
        console.log('🔍 App: AWS token exists:', !!token);

        if (token) {
          localStorage.setItem('ikusi.jwt', token);
          console.log('✅ App: Setting auth to true');
          setIsAuthed(true);
        } else {
          console.log('❌ App: No AWS token, clearing auth');
          localStorage.removeItem('ikusi.jwt');
          setIsAuthed(false);
        }
      } catch (error) {
        console.log('❌ App: Auth verification failed:', error);
        localStorage.removeItem('ikusi.jwt');
        setIsAuthed(false);
      } finally {
        console.log('🔍 App: Auth check complete, setting checked to true');
        setChecked(true);
      }
    };

    verify();

    // Listen for localStorage changes (like when logout clears it)
    const handleStorageChange = () => {
      const token = localStorage.getItem('ikusi.jwt');
      if (!token) {
        setIsAuthed(false);
      }
    };

    // Listen for successful authentication
    const handleAuthSuccess = () => {
      console.log('📢 App: Received auth-success event, re-verifying...');
      verify(); // Re-check auth status
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-success', handleAuthSuccess);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-success', handleAuthSuccess);
    };
  }, []); // Only run on mount

  if (!checked) return null;

  const routes = (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={skipAuth || isAuthed ? '/dashboard' : '/login'} />
          }
        />
        <Route
          path="/login"
          element={
            skipAuth || isAuthed ? <Navigate to="/dashboard" /> : <Login />
          }
        />
        <Route
          path="/dashboard"
          element={
            skipAuth || isAuthed ? <Dashboard /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/admin"
          element={
            skipAuth || isAuthed ? <AdminDashboard /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/profile"
          element={
            skipAuth || isAuthed ? (
              <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-50 to-emerald-100">
                <Header />
                <div className="py-12 px-4">
                  <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                      Profile
                    </h1>
                    <p className="text-gray-600 mb-4">
                      User profile page (Coming soon)
                    </p>
                    <button
                      onClick={() => window.history.back()}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );

  return (
    <ChakraProvider value={defaultSystem}>
      {routes}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {import.meta.env.DEV && AuthDebugger && DashboardTester && (
        <Suspense fallback={null}>
          <AuthDebugger />
          <DashboardTester />
        </Suspense>
      )}
    </ChakraProvider>
  );
}

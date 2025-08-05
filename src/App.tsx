// src/App.tsx

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, Routes } from 'react-router-dom';

import Header from '@/components/Header';
import { skipAuth } from '@/env.variables';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { useThemedFavicon } from '@/hooks/useThemedFavicon';
import AdminDashboard from '@/pages/AdminDashboard';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

console.log('VITE ENV:', import.meta.env);

// 🌱 Load debug components only in dev mode
const AuthDebugger = import.meta.env.DEV
  ? lazy(() =>
      import('@/components/AuthDebugger').catch(() => ({
        default: () => null,
      }))
    )
  : null;

const DashboardTester = import.meta.env.DEV
  ? lazy(() =>
      import('@/components/DashboardTester').catch(() => ({
        default: () => null,
      }))
    )
  : null;

if (import.meta.env.DEV) {
  console.log('🗺️ Available routes in dev mode:', [
    '/',
    '/login',
    '/dashboard',
    '/admin',
    '/profile',
    '/projects-for-pm',
  ]);
}

export default function App() {
  useThemedFavicon();
  useIdleLogout(30);

  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    document.title = 'Ikusi · Acta Platform';
  }, []);

  useEffect(() => {
    fetchAuthSession().then((session) => {
      console.log('🟢 Auth session:', session);
    });
  }, []);

  useEffect(() => {
    const verify = async () => {
      console.log('🔍 App: Verifying auth status...');
      try {
        const localToken = localStorage.getItem('ikusi.jwt');
        console.log('🔍 App: Local token exists:', !!localToken);

        if (!localToken) {
          setIsAuthed(false);
          setChecked(true);
          return;
        }

        const { tokens } = await fetchAuthSession();
        const token = tokens?.idToken?.toString() ?? '';

        if (token) {
          localStorage.setItem('ikusi.jwt', token);
          setIsAuthed(true);
        } else {
          localStorage.removeItem('ikusi.jwt');
          setIsAuthed(false);
        }
      } catch (error) {
        console.error('❌ Auth verification failed:', error);
        localStorage.removeItem('ikusi.jwt');
        setIsAuthed(false);
      } finally {
        setChecked(true);
      }
    };

    if (skipAuth) {
      setIsAuthed(true);
      setChecked(true);
    } else {
      verify();
    }

    const handleStorageChange = () => {
      const token = localStorage.getItem('ikusi.jwt');
      if (!token) setIsAuthed(false);
    };

    const handleAuthSuccess = () => {
      console.log('📢 Re-verifying after auth success...');
      verify();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-success', handleAuthSuccess);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-success', handleAuthSuccess);
    };
  }, []);

  if (!checked) return null;

  return (
    <ChakraProvider value={defaultSystem}>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={skipAuth || isAuthed ? '/dashboard' : '/login'} />}
        />
        <Route
          path="/login"
          element={skipAuth || isAuthed ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={skipAuth || isAuthed ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={skipAuth || isAuthed ? <AdminDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={
            skipAuth || isAuthed ? (
              <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-50 to-emerald-100">
                <Header />
                <div className="py-12 px-4">
                  <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
                    <p className="text-gray-600 mb-4">User profile page (Coming soon)</p>
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
        <Route
          path="/projects-for-pm"
          element={
            skipAuth || isAuthed ? (
              <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-50 to-emerald-100">
                <Header />
                <div className="py-12 px-4">
                  <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">PM Projects</h1>
                    <p className="text-gray-600 mb-4">Project Manager view (Coming soon)</p>
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
        <Route
          path="*"
          element={<Navigate to={skipAuth || isAuthed ? '/dashboard' : '/login'} replace />}
        />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
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
        <Suspense fallback={<div>Loading debug tools...</div>}>
          <AuthDebugger />
          <DashboardTester />
        </Suspense>
      )}
    </ChakraProvider>
  );
}

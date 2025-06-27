// src/App.tsx
import '@/utils/authTesting'; // Import auth testing utilities
import '@/utils/authFlowTest'; // Import comprehensive auth flow tests
import '@/utils/dashboardTesting'; // Import dashboard button testing

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AuthDebugger from '@/components/AuthDebugger';
import DashboardTester from '@/components/DashboardTester';
import Header from '@/components/Header';
import { skipAuth } from '@/env.variables';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { useThemedFavicon } from '@/hooks/useThemedFavicon';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

export default function App() {
  useThemedFavicon();
  useIdleLogout(30);

  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (skipAuth) {
      setIsAuthed(true);
      setChecked(true);
      return;
    }

    const verify = async () => {
      try {
        // First check if we have a token in localStorage
        const localToken = localStorage.getItem('ikusi.jwt');
        if (!localToken) {
          setIsAuthed(false);
          setChecked(true);
          return;
        }

        // If we have a local token, verify with AWS
        const { tokens } = await fetchAuthSession();
        const token = tokens?.idToken?.toString() ?? '';
        if (token) {
          localStorage.setItem('ikusi.jwt', token);
          setIsAuthed(true);
        } else {
          localStorage.removeItem('ikusi.jwt');
          setIsAuthed(false);
        }
      } catch {
        localStorage.removeItem('ikusi.jwt');
        setIsAuthed(false);
      } finally {
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

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
      <AuthDebugger />
      <DashboardTester />
    </ChakraProvider>
  );
}

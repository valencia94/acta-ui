// src/App.tsx

import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, Routes } from 'react-router-dom';

import Header from '@/components/Header';
import { skipAuth } from '@/env.variables';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { useThemedFavicon } from '@/hooks/useThemedFavicon';
import AdminDashboard from '@/pages/AdminDashboard';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import { UX_TOKENS } from '@/utils/flags';

console.log('VITE ENV:', import.meta.env);

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

export default function App(): JSX.Element {
  useThemedFavicon();
  useIdleLogout(30);

  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    document.title = 'Ikusi · Acta Platform';
  }, []);

  useEffect(() => {
    void fetchAuthSession().then((session) => {
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
      void verify();
    }

    const handleStorageChange = () => {
      const token = localStorage.getItem('ikusi.jwt');
      if (!token) setIsAuthed(false);
    };

    const handleAuthSuccess = () => {
      console.log('📢 Re-verifying after auth success...');
      void verify();
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
    <div className={
      UX_TOKENS
        ? "font-sans min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]"
        : "font-sans"
    }>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={skipAuth || isAuthed ? '/dashboard' : '/login'} />}
        />
        <Route path="/login" element={<Login />} />
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
              <div className={
                UX_TOKENS
                  ? "min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]"
                  : "min-h-screen bg-gradient-to-br from-green-100 via-teal-50 to-emerald-100"
              }>
                <Header />
                <div className="py-12 px-4">
                  <div className={
                    UX_TOKENS
                      ? "max-w-md mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm p-6"
                      : "max-w-md mx-auto bg-white rounded-lg shadow-md p-6"
                  }>
                    <h1 className={
                      UX_TOKENS
                        ? "text-2xl font-bold text-[var(--color-text)] mb-4"
                        : "text-2xl font-bold text-gray-900 mb-4"
                    }>Profile</h1>
                    <p className={
                      UX_TOKENS
                        ? "text-[var(--color-text-muted)] mb-4"
                        : "text-gray-600 mb-4"
                    }>User profile page (Coming soon)</p>
                    <button
                      onClick={() => window.history.back()}
                      className={
                        UX_TOKENS
                          ? "inline-flex items-center rounded-xl px-4 py-2 font-medium bg-[var(--color-accent)] text-[var(--color-accent-contrast)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition-opacity"
                          : "px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      }
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
              <div className={
                UX_TOKENS
                  ? "min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]"
                  : "min-h-screen bg-gradient-to-br from-green-100 via-teal-50 to-emerald-100"
              }>
                <Header />
                <div className="py-12 px-4">
                  <div className={
                    UX_TOKENS
                      ? "max-w-md mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm p-6"
                      : "max-w-md mx-auto bg-white rounded-lg shadow-md p-6"
                  }>
                    <h1 className={
                      UX_TOKENS
                        ? "text-2xl font-bold text-[var(--color-text)] mb-4"
                        : "text-2xl font-bold text-gray-900 mb-4"
                    }>PM Projects</h1>
                    <p className={
                      UX_TOKENS
                        ? "text-[var(--color-text-muted)] mb-4"
                        : "text-gray-600 mb-4"
                    }>Project Manager view (Coming soon)</p>
                    <button
                      onClick={() => window.history.back()}
                      className={
                        UX_TOKENS
                          ? "inline-flex items-center rounded-xl px-4 py-2 font-medium bg-[var(--color-accent)] text-[var(--color-accent-contrast)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition-opacity"
                          : "px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      }
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

      {/* Debug components removed for cleaner UI */}
    </div>
  );
}

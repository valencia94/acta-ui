// src/components/Header.tsx
import { signOut } from 'aws-amplify/auth';
import clsx from 'clsx';
import { Grid, LogOut, Menu, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { skipAuth } from '@/env.variables';
import { useAuth } from '@/hooks/useAuth';

const logoSrc = '/assets/ikusi-logo.png';

export default function Header(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin =
    user?.email?.includes('admin') ||
    user?.email?.includes('valencia94') ||
    user?.email?.endsWith('@ikusi.com') ||
    user?.email?.endsWith('@company.com');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.clear();

      setOpen(false);

      if (!skipAuth) {
        await signOut({ global: true });
      }

      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      setOpen(false);
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-gradient-to-r from-green-500 to-teal-500 px-6 py-5 shadow-xl">
      <div className="flex items-center gap-5">
        <img src={logoSrc} alt="Ikusi logo" className="h-12 w-auto drop-shadow-sm" />
        <div className="leading-tight text-white">
          <h1 className="text-2xl font-bold tracking-tight">Acta Platform</h1>
          <p className="text-sm opacity-90 font-medium">
            invisible technology, visible transformation
          </p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-8 text-white">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
        >
          <Grid className="h-5 w-5" />
          Dashboard
        </button>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
          >
            <Shield className="h-5 w-5" />
            Admin
          </button>
        )}
      </nav>

      <div className="flex items-center gap-4">
        <span className="hidden md:inline text-xs text-white font-light">
          Signed in as: {user?.email}
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          className="text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300"
        >
          <Menu className="h-6 w-6" />
        </button>

        {open && (
          <div
            className={clsx(
              'absolute right-0 top-full mt-2 w-48 rounded-lg bg-white py-1 shadow-lg',
              'ring-1 ring-black ring-opacity-5 focus:outline-none z-50'
            )}
          >
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setOpen(false);
                navigate('/dashboard');
              }}
            >
              <Grid className="mr-3 h-4 w-4" />
              Dashboard
            </button>

            {isAdmin && (
              <button
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setOpen(false);
                  navigate('/admin');
                }}
              >
                <Shield className="mr-3 h-4 w-4" />
                Admin
              </button>
            )}

            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
            >
              <User className="mr-3 h-4 w-4" />
              Profile
            </button>

            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="mr-3 h-4 w-4" />
                  Log out
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

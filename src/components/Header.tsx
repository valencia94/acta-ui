// src/components/Header.tsx
import { signOut } from '@aws-amplify/auth';
import clsx from 'clsx';
import { Grid, LogOut, Menu, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { skipAuth } from '@/env.variables';

const logoSrc = '/assets/ikusi-logo.png';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear all local storage immediately
      localStorage.clear();

      // Set loading state
      setOpen(false);

      // Only call AWS signOut if not in skip auth mode
      if (!skipAuth) {
        await signOut({ global: true });
      }

      // Add a small delay to ensure signOut completes
      setTimeout(() => {
        // Force a complete page reload to login page specifically
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, force navigation
      localStorage.clear();
      setOpen(false);
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4 shadow-lg">
      {/* Left: logo + title */}
      <div className="flex items-center gap-4">
        <img src={logoSrc} alt="Ikusi logo" className="h-8 w-auto" />
        <div className="leading-tight text-white">
          <h1 className="text-lg font-semibold">Acta Platform</h1>
          <p className="text-xs opacity-75">
            invisible technology, visible transformation
          </p>
        </div>
      </div>

      {/* Center nav (hidden on mobile) */}
      <nav className="hidden md:flex items-center gap-6 text-white">
        <a href="/dashboard" className="hover:underline">
          Dashboard
        </a>
        <button aria-label="All Projects">
          <Grid className="h-5 w-5" />
        </button>
      </nav>

      {/* Right: mobile menu toggle */}
      <div className="relative">
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
            {/* Profile Option */}
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
            >
              <User className="mr-3 h-4 w-4" />
              Profile
            </button>

            {/* Logout Option */}
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:opacity-50"
              onClick={handleLogout}
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

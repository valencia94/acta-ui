// src/components/Header.tsx
import { signOut } from 'aws-amplify/auth';
import clsx from 'clsx';
import { Grid, LogOut, Menu, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logoSrc from '@/assets/ikusi-logo.png';
import { skipAuth } from '@/env.variables';
import { useAuth } from '@/hooks/useAuth';
import { UX_TOKENS } from '@/utils/flags';

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
    <header className={
      UX_TOKENS
        ? "sticky top-0 z-50 flex items-center justify-between bg-[var(--color-secondary)] px-6 py-5 shadow-sm border-b border-[var(--color-border)]"
        : "sticky top-0 z-50 flex items-center justify-between bg-gradient-to-r from-green-500 to-teal-500 px-6 py-5 shadow-xl"
    }>
      <div className="flex items-center gap-5">
        <img src={logoSrc} alt="Ikusi logo" className="h-12 w-auto drop-shadow-sm" />
        <div className={
          UX_TOKENS
            ? "leading-tight text-[var(--color-text)]"
            : "leading-tight text-white"
        }>
          <h1 className="text-2xl font-bold tracking-tight">Acta Platform</h1>
          <p className={
            UX_TOKENS
              ? "text-sm text-[var(--color-text-muted)] font-medium"
              : "text-sm opacity-90 font-medium"
          }>
            invisible technology, visible transformation
          </p>
        </div>
      </div>

      <nav className={
        UX_TOKENS
          ? "hidden md:flex items-center gap-8 text-[var(--color-text)]"
          : "hidden md:flex items-center gap-8 text-white"
      }>
        <button
          onClick={() => navigate('/dashboard')}
          className={
            UX_TOKENS
              ? "flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--color-border)] transition-colors font-medium"
              : "flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
          }
        >
          <Grid className="h-5 w-5" />
          Dashboard
        </button>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className={
              UX_TOKENS
                ? "flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--color-border)] transition-colors font-medium"
                : "flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
            }
          >
            <Shield className="h-5 w-5" />
            Admin
          </button>
        )}
      </nav>

      <div className="flex items-center gap-4">
        <span className={
          UX_TOKENS
            ? "hidden md:inline text-xs text-[var(--color-text-muted)] font-light"
            : "hidden md:inline text-xs text-white font-light"
        }>
          Signed in as: {user?.email}
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          className={
            UX_TOKENS
              ? "text-[var(--color-text)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)]/40"
              : "text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300"
          }
        >
          <Menu className="h-6 w-6" />
        </button>

        {open && (
          <div
            className={clsx(
              UX_TOKENS
                ? 'absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] py-1 shadow-lg focus:outline-none z-50'
                : 'absolute right-0 top-full mt-2 w-48 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50'
            )}
          >
            <button
              className={
                UX_TOKENS
                  ? "flex w-full items-center px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
                  : "flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              }
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
                className={
                  UX_TOKENS
                    ? "flex w-full items-center px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
                    : "flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                }
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
              className={
                UX_TOKENS
                  ? "flex w-full items-center px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
                  : "flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              }
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
            >
              <User className="mr-3 h-4 w-4" />
              Profile
            </button>

            <button
              className={
                UX_TOKENS
                  ? "flex w-full items-center px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
                  : "flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              }
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <div className={
                    UX_TOKENS
                      ? "mr-3 h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]"
                      : "mr-3 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
                  }></div>
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

// src/components/Header.tsx
import { Auth } from '@aws-amplify/auth';
import clsx from 'clsx';
import { Menu, Grid } from 'lucide-react';
import { useState } from 'react';

const logoSrc = '/assets/ikusi-logo.png';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="z-50 flex items-center justify-between bg-primary px-6 py-4 shadow-md">
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
          className="text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        >
          <Menu className="h-6 w-6" />
        </button>

        {open && (
          <div
            className={clsx(
              'absolute right-0 mt-2 w-44 rounded-lg bg-white py-2 shadow-lg',
              'ring-1 ring-black ring-opacity-5'
            )}
          >
            <button
              className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
              onClick={() => Auth.signOut()}
            >
              Log out
            </button>
            <a
              href="/profile"
              className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Profile
            </a>
          </div>
        )}
      </div>
    </header>
  );
}

// src/layout.tsx
import { motion } from 'framer-motion';
import { LayoutDashboard, Menu as MenuIcon } from 'lucide-react';
import { ReactNode } from 'react';
import logoSrc from '@assets/ikusi-logo.png';

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar */}
      <aside className="w-20 xl:w-56 bg-primary/90 backdrop-blur-sm text-white p-4 flex flex-col">
        {/* Menu toggle (mobile or secondary actions) */}
        <button
          aria-label="Toggle menu"
          className="mx-auto mb-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        {/* Primary nav */}
        <nav className="flex-1 flex flex-col items-center gap-6">
          <button
            aria-label="Dashboard"
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            <LayoutDashboard className="h-6 w-6" />
          </button>
          {/* Add more <button> or <a> nav items here */}
        </nav>
      </aside>

      {/* ── Main Content */}
      <main className="flex-1 bg-gradient-to-b from-primary via-accent to-secondary p-6 md:p-10 overflow-auto">
        {/* Animated header */}
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-start mb-8"
        >
          <img
            src={logoSrc}
            alt="Ikusi logo"
            className="h-10 drop-shadow-md"
          />
        </motion.header>

        {/* Page content */}
        <section>{children}</section>
      </main>
    </div>
  );
}

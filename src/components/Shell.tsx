// src/components/Shell.tsx
import { motion } from 'framer-motion';
import { LayoutDashboard, Menu as MenuIcon } from 'lucide-react';
import { ReactNode } from 'react';

import logoSrc from '@/assets/ikusi-logo.png';

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps): JSX.Element {
  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar */}
      <aside className="w-20 xl:w-56 bg-green-500/90 backdrop-blur-sm text-white p-4 flex flex-col">
        <button
          aria-label="Toggle menu"
          className="mx-auto mb-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        <nav className="flex-1 flex flex-col items-center gap-6">
          <button
            aria-label="Dashboard"
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300"
          >
            <LayoutDashboard className="h-6 w-6" />
          </button>
        </nav>
      </aside>

      {/* ── Main Content */}
      <main className="flex-1 bg-gradient-to-b from-green-500 via-emerald-500 to-teal-500 p-6 md:p-10 overflow-auto">
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-start mb-8"
        >
          <img src={logoSrc} alt="Ikusi logo" className="h-10 drop-shadow-md" />
        </motion.header>

        <section>{children}</section>
      </main>
    </div>
  );
}

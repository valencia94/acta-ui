import { motion } from 'framer-motion';
import { LayoutDashboard, Menu } from 'lucide-react';
import { ReactNode } from 'react';
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-b from-ikusi-700 via-ikusi-600 to-ikusi-500">
      {/* ── sidebar */}
      <aside className="w-20 xl:w-56 bg-white/10 backdrop-blur-sm text-white p-4 flex flex-col gap-6">
        <Menu className="h-6 w-6 mx-auto" />
        <div className="mt-8 flex flex-col gap-4">
          <LayoutDashboard className="mx-auto h-6 w-6" />
        </div>
      </aside>

      {/* ── main surface */}
      <main className="flex-1 p-6 md:p-10">
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <img
            src="/assets/ikusi-logo.png"
            alt="Ikusi logo"
            className="h-10 drop-shadow"
          />
        </motion.header>
        <section className="mt-8">{children}</section>
      </main>
    </div>
  );
}

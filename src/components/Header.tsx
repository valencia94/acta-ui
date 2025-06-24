import { signOut } from 'aws-amplify/auth';
import clsx from 'clsx';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="z-50 flex items-center justify-between bg-white px-6 py-4 shadow">
      <div className="flex items-center gap-3">
        <img src="/assets/ikusi-logo.png" alt="Ikusi logo" className="h-8" />
        <div className="leading-tight">
          <h1 className="font-semibold">Acta Platform</h1>
          <p className="text-xs text-gray-500">
            invisible technology, visible transformation
          </p>
        </div>
      </div>

      <button onClick={() => setOpen(!open)} aria-label="menu">
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="absolute right-6 top-14 w-40 rounded-md bg-white shadow">
          <button
            className={clsx(
              'block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'
            )}
            onClick={() => signOut()}
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}

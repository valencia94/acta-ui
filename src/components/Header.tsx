// src/components/Header.tsx
import { signOut } from "aws-amplify/auth";
import clsx from "clsx";
import { Grid, LogOut, Menu, Shield, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { skipAuth } from "@/env.variables";
import { useAuth } from "@/hooks/useAuth";

const logoSrc = "/assets/ikusi-logo.png";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has admin access
  const isAdmin =
    user?.email?.includes("admin") ||
    user?.email?.includes("valencia94") ||
    user?.email?.endsWith("@ikusi.com") ||
    user?.email?.endsWith("@company.com");

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
        window.location.href = "/login";
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if signOut fails, force navigation
      localStorage.clear();
      setOpen(false);
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 border-b border-white/10 shadow-2xl">
      {/* Subtle Header Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10"></div>
      
      <div className="relative flex items-center justify-between px-6 py-4">
        {/* Left: Enhanced logo + title */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm"></div>
            <img
              src={logoSrc}
              alt="Ikusi logo"
              className="relative h-12 w-auto rounded-xl shadow-lg"
            />
          </div>
          <div className="leading-tight text-white">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Acta Platform
            </h1>
            <p className="text-sm opacity-90 font-medium text-white/80">
              invisible technology, visible transformation
            </p>
          </div>
        </div>

        {/* Center nav (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-2 text-white">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Grid className="h-5 w-5" />
            Dashboard
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Shield className="h-5 w-5" />
              Admin
            </button>
          )}
        </nav>

        {/* Right: Enhanced mobile menu toggle */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Menu className="h-5 w-5" />
          </button>

          {open && (
            <div
              className={clsx(
                "absolute right-0 top-full mt-3 w-56 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl z-50",
                "ring-1 ring-white/10 focus:outline-none overflow-hidden",
              )}
            >
              {/* Dashboard Option */}
              <button
                className="flex w-full items-center px-4 py-3 text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none transition-all duration-200 border-b border-white/10"
                onClick={() => {
                  setOpen(false);
                  navigate("/dashboard");
                }}
              >
                <Grid className="mr-3 h-4 w-4" />
                Dashboard
              </button>

              {/* Admin Option (if admin) */}
              {isAdmin && (
                <button
                  className="flex w-full items-center px-4 py-3 text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none transition-all duration-200 border-b border-white/10"
                  onClick={() => {
                    setOpen(false);
                    navigate("/admin");
                  }}
                >
                  <Shield className="mr-3 h-4 w-4" />
                  Admin
                </button>
              )}

              {/* Profile Option */}
              <button
                className="flex w-full items-center px-4 py-3 text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none transition-all duration-200 border-b border-white/10"
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
              >
                <User className="mr-3 h-4 w-4" />
                Profile
              </button>

              {/* Logout Option */}
              <button
                className="flex w-full items-center px-4 py-3 text-sm text-white hover:bg-red-500/20 focus:bg-red-500/20 focus:outline-none disabled:opacity-50 transition-all duration-200"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
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
      </div>
    </header>
  );
}

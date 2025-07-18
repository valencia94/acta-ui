// src/hooks/useAuthContext.tsx
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { skipAuth } from "@/env.variables";

interface AuthContextType {
  isAuthed: boolean;
  isChecking: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkAuth = async () => {
    if (skipAuth) {
      setIsAuthed(true);
      setIsChecking(false);
      return;
    }

    try {
      const { tokens } = await fetchAuthSession();
      const token = tokens?.idToken?.toString() ?? "";
      if (token) {
        localStorage.setItem("ikusi.jwt", token);
        setIsAuthed(true);
      } else {
        localStorage.removeItem("ikusi.jwt");
        setIsAuthed(false);
      }
    } catch {
      localStorage.removeItem("ikusi.jwt");
      setIsAuthed(false);
    } finally {
      setIsChecking(false);
    }
  };

  const logout = async () => {
    try {
      // Clear local storage first
      localStorage.removeItem("ikusi.jwt");
      localStorage.clear();

      // Set auth state to false immediately
      setIsAuthed(false);

      // Only call AWS signOut if not in skip auth mode
      if (!skipAuth) {
        await signOut({ global: true });
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if signOut fails, we've already cleared local state
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthed, isChecking, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

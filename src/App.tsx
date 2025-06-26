// src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import Shell from '@/components/Shell';
import { skipAuth } from '@/env.variables';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

export default function App() {
  // If skipAuth=true (dev mode), skip the hosted UI
  if (skipAuth) {
    return (
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    );
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <Shell>
            <Routes>
              {/* Root → dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard only if signed in */}
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              {/* Fallback to Amplify's signin UI */}
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Shell>
        </BrowserRouter>
      )}
    </Authenticator>
  );
}

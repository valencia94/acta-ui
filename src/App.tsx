import {
  Amplify,
  fetchAuthSession,
  type ResourcesConfig,
} from '@aws-amplify/core';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import config from './awsConfig';

Amplify.configure(config as unknown as ResourcesConfig);

import Dashboard from '@/pages/Dashboard';

export default function App() {
  const { user } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    const storeToken = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (token) {
          localStorage.setItem('ikusi.jwt', token);
        }
      } catch {
        localStorage.removeItem('ikusi.jwt');
      }
    };
    if (user) storeToken();
  }, [user]);

  return (
    <BrowserRouter>
      <Authenticator loginMechanisms={['email']}>
        <>
          {/* tsx fragment required for signOut to exist */}
          {({ signOut: amplifySignOut }) => {
            const handleSignOut = () => {
              localStorage.removeItem('ikusi.jwt');
              amplifySignOut();
            };
            return (
              <>
                <nav className="text-right p-2">
                  <button onClick={handleSignOut}>Sign out</button>
                </nav>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </>
            );
          }}
        </>
      </Authenticator>
    </BrowserRouter>
  );
}

import {
  Amplify,
  fetchAuthSession,
  type ResourcesConfig,
} from '@aws-amplify/core';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from '@/pages/Dashboard';

import config from './awsConfig';

const configReady = Boolean(
  import.meta.env.VITE_COGNITO_REGION &&
    import.meta.env.VITE_COGNITO_POOL_ID &&
    import.meta.env.VITE_COGNITO_WEB_CLIENT
);
if (configReady) {
  Amplify.configure(config as unknown as ResourcesConfig);
}

function RoutesContent({ onSignOut }: { onSignOut?: () => void }) {
  return (
    <>
      <nav className="text-right p-2">
        {onSignOut && <button onClick={onSignOut}>Sign out</button>}
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default function App() {
  if (!configReady) {
    return (
      <BrowserRouter>
        <RoutesContent />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Authenticator loginMechanisms={['email']}>
        {({ signOut }) => {
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

          const handleSignOut = () => {
            localStorage.removeItem('ikusi.jwt');
            signOut();
          };

          return <RoutesContent onSignOut={handleSignOut} />;
        }}
      </Authenticator>
    </BrowserRouter>
  );
}

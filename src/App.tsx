// src/App.tsx
import { fetchAuthSession } from 'aws-amplify/auth';
import { Authenticator } from '@aws-amplify/ui-react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { useEffect, useState } from 'react';

import Header from '@/components/Header';
import { skipAuth } from '@/env.variables';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { useThemedFavicon } from '@/hooks/useThemedFavicon';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

export default function App() {
  useThemedFavicon();
  useIdleLogout(30);

  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (skipAuth) {
      setIsAuthed(true);
      setChecked(true);
      return;
    }

    const verify = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        const token = tokens?.idToken?.toString() ?? '';
        localStorage.setItem('ikusi.jwt', token);
        setIsAuthed(true);
      } catch {
        localStorage.removeItem('ikusi.jwt');
        setIsAuthed(false);
      } finally {
        setChecked(true);
      }
    };

    verify();
  }, []);

  if (!checked) return null;

  const routes = (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={skipAuth || isAuthed ? '/dashboard' : '/login'}
            />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            skipAuth || isAuthed ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );

  return (
    <ChakraProvider value={defaultSystem}>
      {skipAuth ? routes : <Authenticator>{routes}</Authenticator>}
    </ChakraProvider>
  );
}

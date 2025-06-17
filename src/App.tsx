import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useThemedFavicon } from '@/hooks/useThemedFavicon';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

export default function App() {
  useThemedFavicon();
  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString() ?? '';
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

  return (
    <Authenticator>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={isAuthed ? '/dashboard' : '/login'} />}
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={isAuthed ? <Dashboard /> : <Navigate to="/login" />}
          />
        </Routes>
      </BrowserRouter>
    </Authenticator>
  );
}

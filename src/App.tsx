import { Auth } from 'aws-amplify';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

export default function App() {
  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const session = await Auth.currentSession();
        const token = session.getIdToken().getJwtToken();
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
  );
}

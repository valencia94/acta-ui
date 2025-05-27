import './index.css';

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';

export default function App() {
  const isAuthed = !!localStorage.getItem('ikusi.jwt');
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

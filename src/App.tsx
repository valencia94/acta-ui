import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

export default function App() {
  const authed = !!localStorage.getItem('jwt');
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={authed ? <Dashboard /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

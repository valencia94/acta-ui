import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login      from '@/pages/Login';
import Dashboard  from '@/pages/Dashboard';
import './index.css';

export default function App() {
  const isAuthed = !!localStorage.getItem('ikusi.jwt');
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Navigate to={isAuthed ? '/dashboard' : '/login'} />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/dashboard"  element={isAuthed ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

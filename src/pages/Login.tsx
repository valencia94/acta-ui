import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ikusi from '~/assets/ikusi-logo.png';
import './Login.css';           // tailwind classes only

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // 🔐 TODO replace with Cognito
    localStorage.setItem('ikusi.jwt', 'mock-token');
    nav('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 p-8 bg-white shadow rounded-xl"
      >
        <img src={ikusi} alt="Ikusi" className="w-40 mx-auto" />
        <h1 className="text-2xl font-semibold text-center">Acta Platform</h1>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="input"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded bg-cvdex text-white font-semibold hover:bg-cvdex-dark transition"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

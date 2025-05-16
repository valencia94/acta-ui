// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    /* TODO: replace with real Cognito call */
    localStorage.setItem("mock_jwt", "eyJhbGciOi...");
    nav("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white p-8 rounded shadow"
      >
        <img
          src="/ikusi-logo.png"
          alt="Ikusi"
          className="w-40 mx-auto mb-6"
        />
        <h1 className="text-2xl font-semibold text-center mb-6">
          Sign in to Acta Platform
        </h1>

        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            required
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-cvdex text-white py-2 rounded hover:bg-cvdex/90"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}


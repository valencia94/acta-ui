// src/App.tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import "./index.css";

export default function App() {
  const [authed] = useState<boolean>(
    !!localStorage.getItem("mock_jwt")
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            authed ? (
              <div className="min-h-screen flex bg-gray-50 font-sans">
                <aside className="w-60 bg-cvdex text-white p-4">
                  <img
                    src="/ikusi-logo.png"
                    alt="Ikusi Logo"
                    className="w-32 mb-4"
                  />
                  <span className="text-lg font-semibold">
                    Acta Platform
                  </span>
                </aside>

                <main className="flex-1 p-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

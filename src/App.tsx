import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex bg-gray-50 font-sans">
        <aside className="w-60 bg-cvdex text-white p-4 text-lg font-semibold">
          <img src="/assets/ikusi-logo.png" alt="Ikusi Logo" className="w-32 mb-4" />
          Acta Platform
        </aside>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}:contentReference[oaicite:10]{index=10}

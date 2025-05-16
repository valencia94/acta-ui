
// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";

interface Project {
  id: string;
  name: string;
  pm: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    /* TODO: replace with real API call */
    setTimeout(() => {
      setProjects([]); // ← empty list for now
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) return <p className="p-6">Loading…</p>;

  if (projects.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center h-full text-center">
        <img
          src="/empty-state.svg"
          alt="Empty state"
          className="w-40 mb-6 opacity-80"
        />
        <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
        <p className="text-slate-600 mb-6">
          Try a different search or contact your PM to be added.
        </p>
        <button
          onClick={fetchProjects}
          className="px-4 py-2 bg-cvdex text-white rounded-md hover:bg-cvdex/90"
        >
          Refresh
        </button>
      </section>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Project Summary</h1>
      <ul className="space-y-4">
        {projects.map((p) => (
          <li key={p.id} className="border rounded p-4">
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-slate-600">PM: {p.pm}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

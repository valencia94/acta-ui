import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  status: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch(
          `https://${import.meta.env.VITE_ACTA_API_ID}.execute-api.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/prod/projects?pm_email=demo@ikusi.com`
        );
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects", err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-cvdex mb-4">Project Summary</h1>
      {loading ? (
        <p className="text-gray-500">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-400 italic">No projects found</p>
      ) : (
        <table className="w-full border text-sm bg-white shadow-sm rounded">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-4 py-2">ID</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.id}</td>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.status}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      className="bg-ikusi hover:bg-ikusi-dark text-white px-3 py-1 rounded"
                      onClick={() => alert(`Generate Acta for ${p.id}`)}
                    >
                      Generate Acta
                    </button>
                    <button
                      className="bg-cvdex hover:bg-cvdex-light text-white px-3 py-1 rounded"
                      onClick={() => alert(`Send approval for ${p.id}`)}
                    >
                      Start Approval
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

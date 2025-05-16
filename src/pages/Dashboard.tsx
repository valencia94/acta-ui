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
        @@
   if (projects.length === 0) {
-    return <p>No projects found</p>;
+    return (
+      <section className="flex flex-col items-center justify-center h-full text-center">
+        <img
+          src="/empty-state.svg"
+          alt="Empty state illustration"
+          className="w-40 mb-6 opacity-80"
+        />
+        <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
+        <p className="text-slate-600 mb-6">
+          Try a different search or contact your PM to be added to the
+          project workspace.
+        </p>
+        <button
+          onClick={refetch}
+          className="px-4 py-2 bg-cvdex text-white rounded-md hover:bg-cvdex/90"
+        >
+          Refresh
+        </button>
+      </section>
+    );
   }

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

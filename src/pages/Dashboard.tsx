import { useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
  pm: string;
  status: 'IN_PROGRESS' | 'READY' | 'APPROVED';
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🚧  dummy data until Lambda/APIGW wiring is done
    setTimeout(() => {
      setProjects([
        {
          id: '10001',
          name: 'BANCOLOMBIA – SD-WAN EXT',
          pm: 'C. Valencia',
          status: 'READY',
        },
        {
          id: '10002',
          name: 'SAP Migration',
          pm: 'J. Smith',
          status: 'IN_PROGRESS',
        },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  return (
    <main className="min-h-screen font-sans">
      <header className="flex items-center gap-2 px-6 py-4 shadow">
        <img src="/ikusi-logo.png" alt="Ikusi Logo" className="h-8" />
        <h1 className="text-2xl font-semibold">Acta Platform</h1>
      </header>

      <section className="p-8">
        <h2 className="text-3xl font-bold mb-6">Project Summary</h2>

        {loading && <p>Loading&nbsp;projects…</p>}

        {!loading && projects.length === 0 && (
          <p className="italic text-gray-600">No projects found</p>
        )}

        {!loading && projects.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-600 text-white text-left">
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">PM</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="odd:bg-gray-50">
                  <td className="p-3 font-mono">{p.id}</td>
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.pm}</td>
                  <td className="p-3">
                    <span
                      className={
                        p.status === 'READY'
                          ? 'text-emerald-600'
                          : p.status === 'APPROVED'
                            ? 'text-emerald-800'
                            : 'text-gray-500'
                      }
                    >
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

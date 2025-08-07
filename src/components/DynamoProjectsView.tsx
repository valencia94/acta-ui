import { useEffect, useState } from 'react';

import { getProjectsByPM } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  pm: string;
  status: string;
}

interface Props {
  /** Logged-in PM’s email – required to query DynamoDB */
  userEmail: string;
  onProjectSelect?: (projectId: string) => void;
  selectedProjectId: string; // if you highlight current row (optional)
}

export default function DynamoProjectsView({
  userEmail,
  onProjectSelect,
  selectedProjectId,
}: Props): JSX.Element {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProjectsByPM(userEmail, false); // includeArchived flag
        setProjects(data ?? []);
      } catch (err) {
        console.error(err);
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };
    if (userEmail) load();
  }, [userEmail]);

  if (loading) return <div className="text-gray-500">Loading projects…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">PM</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr
              key={p.id}
              onClick={() => onProjectSelect?.(p.id)}
              className={`cursor-pointer hover:bg-gray-50 ${
                selectedProjectId === p.id ? 'bg-indigo-50' : ''
              }`}
            >
              <td className="px-4 py-2 font-medium">{p.id}</td>
              <td className="px-4 py-2">{p.name}</td>
              <td className="px-4 py-2">{p.pm}</td>
              <td className="px-4 py-2">{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

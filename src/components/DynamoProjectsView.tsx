// src/components/DynamoProjectsView.tsx
import { useEffect, useState } from 'react';
import { getProjectsByPM } from '@/lib/api';
import { Auth } from 'aws-amplify';

interface Project {
  id: string;
  name: string;
  pm: string;
  status: string;
}

interface Props {
  onProjectSelect?: (projectId: string) => void;
}

export default function DynamoProjectsView({ onProjectSelect }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        const email = user.attributes.email;
        const data = await getProjectsByPM(email, false);
        setProjects(data || []);
      } catch (err: any) {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h3 className="text-lg font-semibold mb-4">Your Projects</h3>
      <table className="w-full table-auto text-left">
        <thead>
          <tr className="text-sm text-gray-600 border-b">
            <th className="py-2">Project ID</th>
            <th className="py-2">Project Name</th>
            <th className="py-2">PM</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((proj) => (
            <tr
              key={proj.id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onProjectSelect?.(proj.id)}
            >
              <td className="py-2 font-medium">{proj.id}</td>
              <td className="py-2">{proj.name}</td>
              <td className="py-2">{proj.pm}</td>
              <td className="py-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  proj.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  proj.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {proj.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

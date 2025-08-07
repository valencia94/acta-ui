import { useEffect, useState } from 'react';

import { getProjectsForCurrentUser } from '@/lib/awsDataService';

interface Project {
  id: string;
  name: string;
  pm: string;
  status: string;
  // Optional fields from DynamoDB
  originalData?: {
    project_id?: string;
    project_name?: string;
    pm_email?: string;
    last_updated?: string;
    has_acta_document?: boolean;
    [key: string]: any;
  };
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
        const data = await getProjectsForCurrentUser();
        setProjects(data ?? []);
      } catch (err) {
        console.error(err);
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };
    if (userEmail) void load();
  }, [userEmail]);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      <span className="ml-3 text-gray-600">Loading projects…</span>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <div className="text-red-400">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error loading projects</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No projects found</h3>
        <p className="text-gray-500">No projects are assigned to your account yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => onProjectSelect?.(project.id)}
          className={`
            bg-white rounded-xl border border-gray-200 p-6 cursor-pointer 
            transition-all duration-200 ease-out
            hover:shadow-lg hover:border-green-300 hover:-translate-y-0.5
            ${selectedProjectId === project.id 
              ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200' 
              : 'shadow-sm hover:shadow-md'
            }
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {project.name || `Project ${project.id}`}
                </h3>
                {selectedProjectId === project.id && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Selected
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-500 uppercase tracking-wide text-xs">Project ID</dt>
                  <dd className="mt-1 text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                    {project.id}
                  </dd>
                </div>
                
                <div>
                  <dt className="font-medium text-gray-500 uppercase tracking-wide text-xs">Project Manager</dt>
                  <dd className="mt-1 text-gray-900">{project.pm}</dd>
                </div>
                
                <div>
                  <dt className="font-medium text-gray-500 uppercase tracking-wide text-xs">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'Completed'
                        ? 'bg-blue-100 text-blue-800' 
                        : project.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status || 'Active'}
                    </span>
                  </dd>
                </div>
                
                {project.originalData?.has_acta_document !== undefined && (
                  <div>
                    <dt className="font-medium text-gray-500 uppercase tracking-wide text-xs">ACTA Document</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        project.originalData.has_acta_document 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.originalData.has_acta_document ? '✓ Available' : '✗ Missing'}
                      </span>
                    </dd>
                  </div>
                )}
              </div>
              
              {project.originalData?.last_updated && (
                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-medium">Last Updated:</span> {
                    new Date(project.originalData.last_updated).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short', 
                      day: 'numeric'
                    })
                  }
                </div>
              )}
            </div>
            
            <div className="ml-4 flex-shrink-0">
              <div className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

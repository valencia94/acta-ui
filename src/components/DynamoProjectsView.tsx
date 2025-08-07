import { CheckCircle, Clock, RefreshCw } from 'lucide-react';
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

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    if (userEmail) void loadProjects();
  }, [userEmail]);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      <span className="ml-3 text-gray-600">Loading projects…</span>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <div className="text-red-400 mr-3">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-red-800">Error loading projects</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
      <button
        onClick={loadProjects}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-2"></div>
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </>
        )}
      </button>
    </div>
  );

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-inner">
        <div className="text-gray-400 mb-6">
          <svg className="h-16 w-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-3">No projects available</h3>
        <p className="text-gray-500 mb-6">No projects are assigned to your account yet.</p>
        <button
          onClick={loadProjects}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Projects
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => onProjectSelect?.(project.id)}
          className={`
            bg-white rounded-2xl border border-gray-200 p-8 cursor-pointer 
            transition-all duration-300 ease-out
            hover:shadow-xl hover:border-green-300 hover:-translate-y-1
            ${selectedProjectId === project.id 
              ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-25 shadow-lg ring-2 ring-green-200 scale-[1.02]' 
              : 'shadow-lg hover:shadow-2xl'
            }
            backdrop-blur-sm border-opacity-60
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {project.name || `Project ${project.id}`}
                </h3>
                {selectedProjectId === project.id && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                    Selected
                  </span>
                )}
                {/* ACTA Status Indicator */}
                {project.originalData?.has_acta_document !== undefined && (
                  <div className="flex items-center">
                    {project.originalData.has_acta_document ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">ACTA Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600">
                        <Clock className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="font-semibold text-gray-500 uppercase tracking-wide text-xs mb-1">Project ID</dt>
                  <dd className="text-gray-900 font-mono bg-white px-3 py-2 rounded border text-sm">
                    {project.id}
                  </dd>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="font-semibold text-gray-500 uppercase tracking-wide text-xs mb-1">Project Manager</dt>
                  <dd className="text-gray-900 font-medium">{project.pm}</dd>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="font-semibold text-gray-500 uppercase tracking-wide text-xs mb-1">Status</dt>
                  <dd>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      project.status === 'Active' 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : project.status === 'Completed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : project.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {project.status || 'Active'}
                    </span>
                  </dd>
                </div>
              </div>
              
              {project.originalData?.last_updated && (
                <div className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  <span className="font-semibold">Last Updated:</span> {
                    new Date(project.originalData.last_updated).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }
                </div>
              )}
            </div>
            
            <div className="ml-6 flex-shrink-0">
              <div className="text-gray-400 hover:text-green-600 transition-colors duration-200">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

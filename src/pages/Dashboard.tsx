// src/pages/Dashboard.tsx - July 8th Production Dashboard
import { motion } from 'framer-motion';
import { Database, RefreshCw, Copy, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import Header from '@/components/Header';
import DynamoProjectsView from '@/components/DynamoProjectsView';
import { useAuth } from '@/hooks/useAuth';
import { getProjectsByPM, generateActaDocument, getS3DownloadUrl, sendApprovalEmail, checkDocumentInS3, ProjectSummary } from '@/lib/api';
import { getCurrentUser } from '@/lib/api-amplify';

const PDFPreview = lazy(() => import('@/components/PDFPreview'));

interface ProjectStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin =
    user?.email === 'admin@ikusi.com' ||
    user?.email === 'christian.valencia@ikusi.com' ||
    user?.email === 'valencia942003@gmail.com';
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState<string>('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailDialogData, setEmailDialogData] = useState<{
    projectId: string;
    projectName: string;
    documentUrl: string;
  } | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      if (user?.email) {
        try {
          const cognitoUser = await getCurrentUser();
          console.log('🔐 Cognito user initialized:', cognitoUser);
          await fetchProjects();
        } catch (error) {
          console.error('❌ Error initializing Cognito user:', error);
        }
      }
    };
    initializeUser();
  }, [user]);

  const fetchProjects = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Fetching projects from API using /projects endpoint...');
      console.log('🔐 User email:', user.email, 'Admin access:', isAdmin);
      
      const projectData = await getProjectsByPM(user.email, isAdmin);
      console.log('📊 Raw project data received:', projectData);
      
      if (!Array.isArray(projectData)) {
        console.warn('⚠️ Project data is not an array:', projectData);
        throw new Error('Invalid project data format received from API');
      }
      
      setProjects(projectData);
      
      const totalProjects = projectData.length;
      const pendingProjects = projectData.filter(p => String(p.project_status || '').toLowerCase().includes('pending')).length;
      const inProgressProjects = projectData.filter(p => String(p.project_status || '').toLowerCase().includes('progress')).length;
      const completedProjects = projectData.filter(p => String(p.project_status || '').toLowerCase().includes('completed')).length;
      
      setStats({ total: totalProjects, pending: pendingProjects, inProgress: inProgressProjects, completed: completedProjects });
      setLastUpdated(new Date().toLocaleTimeString());
      console.log('✅ Projects loaded successfully:', projectData.length, 'projects');
      
      if (projectData.length === 0) {
        console.log('ℹ️ No projects found for user. This might be expected for new users.');
      }
    } catch (error: any) {
      console.error('❌ Error fetching projects:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to load projects from API';
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to the API. Please check your connection and try again.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication error: Please log out and log back in.';
      } else if (error.message?.includes('403')) {
        errorMessage = 'Access denied: You don\'t have permission to view projects.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error: The API is experiencing issues. Please try again later.';
      } else if (error.message) {
        errorMessage = `API Error: ${error.message}`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocument = async (projectId: string) => {
    if (!user?.email) return;
    setActionLoading(prev => ({ ...prev, [`generate-${projectId}`]: true }));
    try {
      const result = await generateActaDocument(projectId, user.email, 'pm');
      if (result.success) {
        toast.success('Document generated successfully!');
      } else {
        toast.error(result.message || 'Failed to generate document');
      }
    } catch (error) {
      console.error('❌ Error generating document:', error);
      toast.error('Failed to generate document');
    } finally {
      setActionLoading(prev => ({ ...prev, [`generate-${projectId}`]: false }));
    }
  };

  const handleDownload = async (projectId: string, format: 'pdf' | 'docx') => {
    if (!user?.email) return;
    setActionLoading(prev => ({ ...prev, [`download-${projectId}-${format}`]: true }));
    try {
      const result = await getS3DownloadUrl(projectId, format);
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `acta-${projectId}.${format}`;
        link.click();
        toast.success(`${format.toUpperCase()} downloaded successfully!`);
      } else {
        toast.error(result.error || 'Failed to download document');
      }
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      toast.error('Failed to download document');
    } finally {
      setActionLoading(prev => ({ ...prev, [`download-${projectId}-${format}`]: false }));
    }
  };

  const handleSendEmail = async (projectId: string, projectName: string) => {
    if (!user?.email) return;
    try {
      const result = await getS3DownloadUrl(projectId, 'pdf');
      if (result.success && result.downloadUrl) {
        setEmailDialogData({ projectId, projectName, documentUrl: result.downloadUrl });
        setIsEmailDialogOpen(true);
      } else {
        toast.error('Document not found. Generate document first.');
      }
    } catch (error) {
      console.error('❌ Error preparing email:', error);
      toast.error('Failed to prepare email');
    }
  };

  const handleEmailSubmit = async (recipientEmail: string) => {
    if (!emailDialogData) return;
    try {
      await sendApprovalEmail(emailDialogData.projectId, recipientEmail);
      toast.success('Approval email sent successfully!');
      setIsEmailDialogOpen(false);
      setEmailDialogData(null);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      toast.error('Failed to send approval email');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
              <p className="text-gray-600">{user?.email} • Ready to manage your projects</p>
            </div>
            <button onClick={fetchProjects} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">All Projects (Direct from DynamoDB)</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
                <button onClick={fetchProjects} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Source
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects from DynamoDB...</p>
            </div>
          )}

          {error && (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-4">❌ {error}</div>
              <button onClick={fetchProjects} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="p-8 text-center text-gray-500">No projects found. Check your DynamoDB connection.</div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PM Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.project_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{project.project_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.project_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.pm || project.project_manager}
                        <br />
                        <span className="text-xs text-gray-500">{user?.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{String(project.planet || 'Test Planet')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{String(project.title || project.project_name)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyToClipboard(project.project_id)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Copy ID</button>
                          <button onClick={() => handleGenerateDocument(project.project_id)} disabled={actionLoading[`generate-${project.project_id}`]} className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50">
                            {actionLoading[`generate-${project.project_id}`] ? 'Generating...' : 'Generate'}
                          </button>
                          <button onClick={() => handleDownload(project.project_id, 'pdf')} disabled={actionLoading[`download-${project.project_id}-pdf`]} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50">PDF</button>
                          <button onClick={() => handleDownload(project.project_id, 'docx')} disabled={actionLoading[`download-${project.project_id}-docx`]} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50">DOCX</button>
                          <button onClick={() => handleSendEmail(project.project_id, project.project_name)} className="px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded hover:bg-orange-100">Send</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
        <div className="my-10">
          <DynamoProjectsView userEmail={user?.email || ''} isAdmin={isAdmin} />
        </div>
      </div>

      {pdfPreviewUrl && (
        <Suspense fallback={<div>Loading PDF preview...</div>}>
          <PDFPreview isOpen={!!pdfPreviewUrl} pdfUrl={pdfPreviewUrl} fileName={pdfPreviewFileName} onClose={() => { setPdfPreviewUrl(null); setPdfPreviewFileName(''); }} />
        </Suspense>
      )}

      {isEmailDialogOpen && emailDialogData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Send Approval Email</h3>
            <p className="text-gray-600 mb-4">Send approval email for project: {emailDialogData.projectName}</p>
            <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const email = formData.get('email') as string; handleEmailSubmit(email); }}>
              <input type="email" name="email" placeholder="Enter recipient email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsEmailDialogOpen(false); setEmailDialogData(null); }} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send Email</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// src/pages/Dashboard.tsx
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import ActaButtons from '@/components/ActaButtons/ActaButtons';
import Header from '@/components/Header';
import PMProjectManager from '@/components/PMProjectManager';
import ProjectTable, { Project } from '@/components/ProjectTable';
import { useAuth } from '@/hooks/useAuth';
import {
  extractProjectPlaceData,
  getDownloadUrl,
  sendApprovalEmail,
} from '@/lib/api';
import { quickBackendDiagnostic } from '@/utils/backendDiagnostic';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'manual' | 'pm'>('pm'); // Default to PM mode

  // Backend diagnostic check
  useEffect(() => {
    const runDiagnostic = async () => {
      const isBackendWorking = await quickBackendDiagnostic();
      if (!isBackendWorking) {
        toast.error(
          'Backend API is not properly configured. Some buttons may not work.',
          { duration: 8000 }
        );
      }
    };

    runDiagnostic();
  }, []);

  // Fetch projects for this PM (legacy table structure)
  useEffect(() => {
    if (user?.email && viewMode === 'manual') loadProjects();
  }, [user, viewMode]);

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/projects-by-pm?pm_email=${encodeURIComponent(
          user!.email
        )}`
      );
      if (!res.ok) throw new Error(await res.text());
      setProjects((await res.json()) as Project[]);
    } catch {
      toast.error('Could not load your projects');
    } finally {
      setLoadingProjects(false);
    }
  }

  // Generate Acta
  async function handleGenerate() {
    if (!projectId.trim()) {
      toast.error('Please enter a Project ID');
      return;
    }

    setActionLoading(true);

    // Show initial progress message
    toast(
      'Starting Acta generation... This may take a few minutes while we fetch the latest project data.',
      {
        duration: 4000,
        icon: '⏳',
      }
    );

    try {
      console.log(`Generating Acta for project: ${projectId}`);
      await extractProjectPlaceData(projectId);

      toast.success(
        'Acta generated successfully! The document is now ready for download.',
        {
          duration: 6000,
        }
      );

      // Refresh projects list to show the newly generated document
      loadProjects();
    } catch (error) {
      console.error('Generate Acta error:', error);

      // More specific error handling
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.error(
          `Project ID "${projectId}" not found. Please verify the Project ID is correct.`
        );
      } else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503')
      ) {
        toast.error(
          'The external data source is temporarily unavailable. Please try again in a few minutes.'
        );
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        toast.error(
          'Authentication failed. Please check your permissions or sign in again.'
        );
      } else {
        toast.error(
          `Failed to generate Acta: ${errorMessage}. Please check if the API server is running.`
        );
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Send approval email
  async function handleSendForApproval() {
    if (!projectId.trim()) {
      toast.error('Please enter a Project ID');
      return;
    }

    setActionLoading(true);
    try {
      await sendApprovalEmail(projectId, user!.email);
      toast.success('Approval email sent successfully!');
    } catch (error) {
      console.error('Send approval error:', error);
      toast.error(
        'Failed to send approval email. Please check if the API server is running.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  // Download .pdf or .docx
  async function handleDownload(fmt: 'pdf' | 'docx') {
    if (!projectId.trim()) {
      toast.error('Please enter a Project ID');
      return;
    }

    setActionLoading(true);

    // Show loading message
    const loadingToast = toast.loading(
      `Preparing ${fmt.toUpperCase()} download...`
    );

    try {
      console.log(`Downloading ${fmt} for project: ${projectId}`);
      const url = await getDownloadUrl(projectId, fmt);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      toast.success(
        `${fmt.toUpperCase()} download ready! Opening in new tab...`
      );

      // Open the download URL
      window.open(url, '_blank');
    } catch (error) {
      console.error(`Download ${fmt} error:`, error);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // More specific error handling
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.error(
          `No ${fmt.toUpperCase()} document found for Project ID "${projectId}". Please generate the Acta first.`
        );
      } else if (errorMessage.includes('403') || errorMessage.includes('401')) {
        toast.error(
          'Access denied. Please check your permissions or sign in again.'
        );
      } else {
        toast.error(`Failed to download ${fmt.toUpperCase()}: ${errorMessage}`);
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-50 to-emerald-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Development Mode Notice */}
        {import.meta.env.DEV && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg mr-3">
                  <span className="text-amber-600 text-sm">⚠️</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-800">
                    Development Mode
                  </h3>
                  <p className="text-xs text-amber-700">
                    API server must be running on{' '}
                    {import.meta.env.VITE_API_BASE_URL} for Acta actions to
                    work.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back! 👋
                </h1>
                <p className="text-teal-600 font-medium">
                  {user?.email} • Ready to manage your projects
                </p>
              </div>
              <button
                onClick={loadProjects}
                disabled={loadingProjects}
                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2"
              >
                <RefreshCw
                  className={`h-5 w-5 ${loadingProjects ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Projects
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-teal-100 rounded-xl">
                <Send className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Approval
                </p>
                <p className="text-2xl font-bold text-teal-600">
                  {projects.filter((p) => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Download className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {projects.filter((p) => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Acta Generation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-xl mr-4">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Generate Acta
              </h2>
              <p className="text-gray-600">
                Create and manage project documentation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2">
              <label
                htmlFor="projectId"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Project ID
              </label>
              <div className="relative">
                <input
                  id="projectId"
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Enter project ID (e.g. 1000000064013473)"
                  className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-gray-900"
                />
                <Search className="absolute right-3 top-3 h-6 w-6 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActaButtons
                onGenerate={handleGenerate}
                onSendForApproval={handleSendForApproval}
                onDownloadWord={() => handleDownload('docx')}
                onDownloadPdf={() => handleDownload('pdf')}
                disabled={!projectId || actionLoading}
              />
            </div>

            {/* Document Status Section - Uncomment when API supports check-document endpoint */}
            {/* 
            {projectId && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Document Status</h3>
                <div className="flex flex-wrap gap-4">
                  <DocumentStatus projectId={projectId} format="docx" />
                  <DocumentStatus projectId={projectId} format="pdf" />
                </div>
              </div>
            )}
            */}
          </div>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Dashboard Mode:
                </span>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('pm')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'pm'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  PM Projects
                </button>
                <button
                  onClick={() => setViewMode('manual')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'manual'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Manual Entry
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* PM Project Manager */}
        {viewMode === 'pm' && user?.email && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <PMProjectManager
              pmEmail={user.email}
              onProjectSelect={setProjectId}
              selectedProjectId={projectId}
              isAdminMode={false}
            />
          </motion.div>
        )}

        {/* Manual Acta Generation Section */}
        {viewMode === 'manual' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 mb-8"
          >
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 rounded-xl mr-4">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Manual Project Entry
                </h2>
                <p className="text-gray-600">
                  Enter a specific Project ID to generate or download Acta
                  documents
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="projectId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Project ID
                </label>
                <div className="relative">
                  <input
                    id="projectId"
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="Enter project ID (e.g. 1000000064013473)"
                    className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-gray-900"
                  />
                  <Search className="absolute right-3 top-3 h-6 w-6 text-gray-400" />
                </div>
              </div>

              {/* Backend Status Testing */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Backend Status
                    </h4>
                    <p className="text-sm text-gray-600">
                      If buttons aren't working, test backend connectivity
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      console.log('🧪 Running backend diagnostic...');
                      // Run diagnostic functions if available
                      const w = window as unknown as Record<string, unknown>;
                      if (w.quickBackendDiagnostic) {
                        (w.quickBackendDiagnostic as () => void)();
                      }
                      if (w.testMetadataEnricherIntegration) {
                        (w.testMetadataEnricherIntegration as () => void)();
                      }
                      if (w.checkBackendImplementationStatus) {
                        (w.checkBackendImplementationStatus as () => void)();
                      }
                    }}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    Test Backend
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <ActaButtons
                  onGenerate={handleGenerate}
                  onSendForApproval={handleSendForApproval}
                  onDownloadWord={() => handleDownload('docx')}
                  onDownloadPdf={() => handleDownload('pdf')}
                  disabled={!projectId || actionLoading}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Acta Generation Section for PM Mode */}
        {viewMode === 'pm' && projectId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 mb-8"
          >
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 rounded-xl mr-4">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Acta Generation for PM
                </h2>
                <p className="text-gray-600">
                  Generate Acta documents for your projects
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <ActaButtons
                  onGenerate={handleGenerate}
                  onSendForApproval={handleSendForApproval}
                  onDownloadWord={() => handleDownload('docx')}
                  onDownloadPdf={() => handleDownload('pdf')}
                  disabled={!projectId || actionLoading}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Projects Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-teal-100 rounded-xl mr-4">
                  <FileText className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Projects
                  </h2>
                  <p className="text-gray-600">
                    Manage and track all your projects
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {loadingProjects && (
                  <div className="flex items-center text-teal-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600 mr-2"></div>
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                )}
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Filter className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <ProjectTable data={projects} />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

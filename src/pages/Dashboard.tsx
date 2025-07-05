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
import DocumentStatus from '@/components/DocumentStatus';
import { EmailInputDialog } from '@/components/EmailInputDialog';
import Header from '@/components/Header';
import PDFPreview from '@/components/PDFPreview';
import PMProjectManager from '@/components/PMProjectManager';
import ProjectTable, { Project } from '@/components/ProjectTable';
import { useAuth } from '@/hooks/useAuth';
import {
  checkDocumentInS3,
  generateActaDocument,
  getProjectsByPM,
  getS3DownloadUrl,
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

  // PDF Preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState<string>('');

  // Email dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Check if user has admin access
  const isAdmin =
    user?.email?.includes('admin') ||
    user?.email?.includes('valencia94') ||
    user?.email?.endsWith('@ikusi.com') ||
    user?.email?.endsWith('@company.com');

  // Backend diagnostic check
  useEffect(() => {
    const runDiagnostic = async () => {
      const isBackendWorking = await quickBackendDiagnostic();
      if (!isBackendWorking) {
        toast(
          'Backend API is not available. Manual entry and individual Acta generation will still work.',
          {
            icon: '⚠️',
            duration: 6000,
            style: {
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #f59e0b',
            },
          }
        );
      } else {
        toast.success('Backend API is connected and ready!', {
          duration: 3000,
        });
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
      // Use corrected API endpoint that matches backend architecture
      const projectSummaries = await getProjectsByPM(user!.email, isAdmin);
      // Transform ProjectSummary to Project interface for the table
      const projects: Project[] = projectSummaries.map((summary, index) => ({
        id: index + 1, // Use index as ID since ProjectSummary doesn't have numeric id
        name: summary.project_name,
        pm: summary.pm || summary.project_manager || 'Unknown',
        status: 'Active' // Default status since ProjectSummary doesn't have status
      }));
      setProjects(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Could not load your projects');
    } finally {
      setLoadingProjects(false);
    }
  }

  // Generate Acta with enhanced S3 integration
  async function handleGenerate() {
    if (!projectId.trim()) {
      toast.error('Please enter a Project ID');
      return;
    }

    setActionLoading(true);

    // Show initial progress message with S3 details
    const loadingToast = toast.loading(
      'Starting Acta generation... This may take a few minutes while we fetch project data and store the document in S3.'
    );

    try {
      console.log(`🚀 Generating Acta for project: ${projectId}`);
      console.log('📦 Target S3 bucket: projectplace-dv-2025-x9a7b');

      // Use the enhanced generation function with proper payload
      const result = await generateActaDocument(
        projectId,
        user?.email || 'unknown@example.com',
        isAdmin ? 'admin' : 'pm'
      );
      console.log('✅ Acta generation result:', result);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        console.log('📄 Acta generation completed successfully');

        // Enhanced success message with S3 info
        let successMessage =
          'Acta generated successfully! The document is now stored in S3 and ready for download.';
        if (result.s3Location) {
          console.log(`📁 Document stored at: ${result.s3Location}`);
          successMessage += ` Document location: ${result.s3Location}`;
        }

        toast.success(successMessage, {
          duration: 8000,
          icon: '✅',
        });

        // Additional success feedback
        setTimeout(() => {
          toast(
            '💡 You can now download the Word or PDF version using the buttons below.',
            {
              duration: 5000,
              icon: '💡',
            }
          );
        }, 2000);
      } else {
        console.warn('⚠️ Generation completed with warnings:', result.message);
        toast.error(result.message || 'Document generation failed', {
          duration: 8000,
        });
      }

      // Refresh projects list to show the newly generated document
      loadProjects();
    } catch (error) {
      console.error('❌ Generate Acta error:', error);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Enhanced error handling with S3-specific messages
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.error(
          `Project ID "${projectId}" not found. Please verify the Project ID is correct.`,
          { duration: 8000 }
        );
      } else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503')
      ) {
        toast.error(
          'The external data source is temporarily unavailable. Please try again in a few minutes.',
          { duration: 8000 }
        );
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        toast.error(
          'Authentication failed. This could be due to insufficient S3 permissions or expired credentials.',
          { duration: 8000 }
        );
      } else if (
        errorMessage.includes('Lambda') ||
        errorMessage.includes('function')
      ) {
        toast.error(
          'Document generation service is temporarily unavailable. Please try again later.',
          { duration: 8000 }
        );
      } else if (
        errorMessage.includes('S3') ||
        errorMessage.includes('storage')
      ) {
        toast.error(
          'Document storage failed. Please contact support if this issue persists.',
          { duration: 10000 }
        );
      } else {
        toast.error(
          `Failed to generate Acta: ${errorMessage}. Please check the console for more details.`,
          { duration: 10000 }
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

    // Show email input dialog
    setShowEmailDialog(true);
  }

  // Handle email submission
  async function handleEmailSubmit(email: string) {
    setEmailLoading(true);
    try {
      await sendApprovalEmail(projectId, email);
      toast.success('Approval email sent successfully!');
      setShowEmailDialog(false);
    } catch (error) {
      console.error('Send approval error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.error(
          `Project ID "${projectId}" not found. Please generate the Acta first.`
        );
      } else if (
        errorMessage.includes('API') ||
        errorMessage.includes('backend')
      ) {
        toast.error(
          'Email service is currently unavailable. Please try again later or contact support.'
        );
      } else {
        toast.error(
          'Failed to send approval email. Please check your connection and try again.'
        );
      }
    } finally {
      setEmailLoading(false);
    }
  }

  // Download .pdf or .docx with enhanced S3 integration
  async function handleDownload(fmt: 'pdf' | 'docx') {
    if (!projectId.trim()) {
      toast.error('Please enter a Project ID');
      return;
    }

    setActionLoading(true);

    // Show loading message with S3 context
    const loadingToast = toast.loading(
      `Preparing ${fmt.toUpperCase()} download from S3 bucket...`
    );

    try {
      console.log(`🔽 Downloading ${fmt} for project: ${projectId}`);
      console.log(
        `📦 Expected S3 path: s3://projectplace-dv-2025-x9a7b/acta/${projectId}.${fmt}`
      );

      // Step 1: Check if document exists in S3
      console.log('🔍 Checking document availability in S3...');
      const availability = await checkDocumentInS3(projectId, fmt);

      if (!availability.available) {
        toast.dismiss(loadingToast);
        toast.error(
          `No ${fmt.toUpperCase()} document found in S3 for project "${projectId}". Please generate the Acta first.`,
          { duration: 8000 }
        );
        return;
      }

      console.log(`✅ Document found in S3 - Size: ${availability.size} bytes`);

      // Step 2: Get S3 signed URL
      console.log('📤 Getting S3 signed URL...');
      const downloadResult = await getS3DownloadUrl(projectId, fmt);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (!downloadResult.success || !downloadResult.downloadUrl) {
        console.error(
          '❌ Failed to get S3 download URL:',
          downloadResult.error
        );
        toast.error(
          downloadResult.error ||
            `Failed to get download URL for ${fmt.toUpperCase()}. Please try again.`,
          { duration: 8000 }
        );
        return;
      }

      const s3SignedUrl = downloadResult.downloadUrl;
      console.log(`🔗 Got S3 signed URL: ${s3SignedUrl.substring(0, 100)}...`);

      // Enhanced success message with S3 info
      toast.success(
        `${fmt.toUpperCase()} ready for download! Document retrieved from S3 bucket.`,
        { duration: 5000 }
      );

      // Step 3: Open the S3 signed URL
      console.log('🌐 Opening S3 signed URL...');
      const newWindow = window.open(
        s3SignedUrl,
        '_blank',
        'noopener,noreferrer'
      );

      if (!newWindow) {
        console.warn('⚠️ Popup blocked - trying alternative method');
        // Fallback: create a temporary link and click it
        const link = document.createElement('a');
        link.href = s3SignedUrl;
        link.download = `project-${projectId}-acta.${fmt}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast(
          // eslint-disable-next-line quotes
          "Download started! If it didn't work, please check your browser's popup blocker.",
          {
            icon: '💡',
            duration: 5000,
          }
        );
      } else {
        console.log('✅ S3 download window opened successfully');

        // Additional verification and user feedback
        setTimeout(() => {
          toast(
            `📄 ${fmt.toUpperCase()} download should have started from S3.`,
            {
              icon: '📄',
              duration: 3000,
            }
          );
        }, 1000);

        // Log S3 info for debugging
        if (downloadResult.s3Info) {
          console.log('📁 S3 Details:', {
            bucket: downloadResult.s3Info.bucket,
            key: downloadResult.s3Info.key,
            size: availability.size,
            lastModified: availability.lastModified,
          });
        }
      }
    } catch (error) {
      console.error(`Download ${fmt} error:`, error);
      console.error('Error details:', {
        projectId,
        format: fmt,
        bucket: 'projectplace-dv-2025-x9a7b',
        expectedKey: `acta/${projectId}.${fmt}`,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Enhanced error handling with S3-specific messages
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.error(
          `No ${fmt.toUpperCase()} document found in S3 bucket for project "${projectId}". Please generate the Acta first.`,
          { duration: 8000 }
        );
      } else if (errorMessage.includes('403') || errorMessage.includes('401')) {
        toast.error(
          'Access denied to S3 bucket. Please check your permissions or contact support.',
          { duration: 8000 }
        );
      } else if (
        errorMessage.includes('S3') ||
        errorMessage.includes('bucket')
      ) {
        toast.error(
          `S3 storage error: ${errorMessage}. Please contact support if this persists.`,
          { duration: 10000 }
        );
      } else if (
        errorMessage.includes('signed URL') ||
        errorMessage.includes('Location header')
      ) {
        toast.error(
          `Failed to generate S3 signed URL for ${fmt.toUpperCase()}. Please try again or contact support.`,
          { duration: 10000 }
        );
      } else {
        toast.error(
          `Failed to download ${fmt.toUpperCase()}: ${errorMessage}. Check console for S3 details.`,
          { duration: 10000 }
        );
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Preview PDF with enhanced UI
  async function handlePreviewPdf() {
    if (!projectId || actionLoading) return;

    const loadingToast = toast.loading(
      `Preparing PDF preview for project ${projectId}...`
    );
    setActionLoading(true);

    try {
      console.log(`🔍 Previewing PDF for project: ${projectId}`);

      // Check if document exists first
      const documentExists = await checkDocumentInS3(projectId, 'pdf');
      if (!documentExists.available) {
        toast.dismiss(loadingToast);
        toast.error(
          `No PDF document found for project ${projectId}. Please generate the document first.`,
          { duration: 6000 }
        );
        return;
      }

      // Get the PDF download URL
      const downloadResult = await getS3DownloadUrl(projectId, 'pdf');

      if (!downloadResult.success || !downloadResult.downloadUrl) {
        console.error(
          '❌ Failed to get S3 download URL for preview:',
          downloadResult.error
        );
        toast.error(
          downloadResult.error ||
            'Failed to get PDF URL for preview. Please try again.',
          { duration: 8000 }
        );
        return;
      }

      const pdfUrl = downloadResult.downloadUrl;
      const fileName = `project-${projectId}-acta.pdf`;

      console.log(`🔗 Got PDF URL for preview: ${pdfUrl.substring(0, 100)}...`);

      // Set preview state
      setPdfPreviewUrl(pdfUrl);
      setPdfPreviewFileName(fileName);

      toast.success(
        'PDF preview loaded! You can now view the document in full screen.',
        { duration: 3000 }
      );
    } catch (error) {
      console.error('❌ Preview PDF error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.error(
          `PDF not found for project "${projectId}". Please generate the document first.`,
          { duration: 8000 }
        );
      } else {
        toast.error(`Failed to load PDF preview: ${errorMessage}`, {
          duration: 8000,
        });
      }
    } finally {
      toast.dismiss(loadingToast);
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

            <div className="w-full">
              <ActaButtons
                onGenerate={handleGenerate}
                onSendForApproval={handleSendForApproval}
                onDownloadWord={() => handleDownload('docx')}
                onDownloadPdf={() => handleDownload('pdf')}
                onPreviewPdf={handlePreviewPdf}
                disabled={!projectId || actionLoading}
              />
            </div>

            {/* Document Status Section for S3 monitoring */}
            {projectId && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📁 Document Status in S3
                  <span className="text-xs font-normal text-gray-500">
                    (projectplace-dv-2025-x9a7b)
                  </span>
                </h3>
                <div className="flex flex-wrap gap-4">
                  <DocumentStatus projectId={projectId} format="docx" />
                  <DocumentStatus projectId={projectId} format="pdf" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  💡 Generate documents first if they're not available in S3
                </div>
              </div>
            )}
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
              isAdminMode={isAdmin}
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
                  onPreviewPdf={handlePreviewPdf}
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
                  onPreviewPdf={handlePreviewPdf}
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

        {/* PDF Preview Component */}
        {pdfPreviewUrl && (
          <PDFPreview
            isOpen={true}
            pdfUrl={pdfPreviewUrl}
            fileName={pdfPreviewFileName}
            onClose={() => setPdfPreviewUrl(null)}
          />
        )}

        {/* Email Input Dialog */}
        <EmailInputDialog
          isOpen={showEmailDialog}
          onClose={() => setShowEmailDialog(false)}
          onSubmit={handleEmailSubmit}
          isLoading={emailLoading}
          projectId={projectId}
        />
      </main>
    </div>
  );
}

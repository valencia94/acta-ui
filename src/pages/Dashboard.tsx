// src/pages/Dashboard.tsx — Regenerated PM Dashboard using Admin layout
import { motion } from 'framer-motion';
import { lazy, Suspense, useState } from 'react';
import { toast } from 'react-hot-toast';

import ActaButtons from '@/components/ActaButtons/ActaButtons';
import DynamoProjectsView from '@/components/DynamoProjectsView';
import { EmailInputDialog } from '@/components/EmailInputDialog';
import Header from '@/components/Header';
import ResponsiveIndicator from '@/components/ResponsiveIndicator';
import { useAuth } from '@/hooks/useAuth';
import {
  checkDocumentInS3,
  generateActaDocument,
  getDownloadUrl,
  sendApprovalEmail,
} from '@/lib/api';

const PDFPreview = lazy(() => import('@/components/PDFPreview'));

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState<string>('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>('');

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentProjectName(projectId);
    toast.success(`Selected project: ${projectId}`);
  };

  const handleGenerateActa = async () => {
    if (!selectedProjectId || !user?.email) {
      toast.error("Please select a project and ensure you're logged in.");
      return;
    }
    setActionLoading(true);
    try {
      await generateActaDocument(selectedProjectId, user.email, 'pm');
      toast.success("ACTA generation started. You'll receive an email when ready.");
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate ACTA');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    setActionLoading(true);
    try {
      const url = await getDownloadUrl(selectedProjectId, format);
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error(error?.message || `Failed to download ${format.toUpperCase()}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    setActionLoading(true);
    try {
      const check = await checkDocumentInS3(selectedProjectId, 'pdf');
      if (!check.available) {
        toast.error('Document not ready, try Generate first.');
        return;
      }
      const url = await getDownloadUrl(selectedProjectId, 'pdf');
      setPdfPreviewUrl(url);
      setPdfPreviewFileName(`acta-${selectedProjectId}.pdf`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to preview document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendApproval = async (email: string) => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    setActionLoading(true);
    try {
      const result = await sendApprovalEmail(selectedProjectId, email);
      if (result.message) {
        toast.success('Approval email sent successfully!');
        setIsEmailDialogOpen(false);
      } else {
        toast.error('Failed to send approval email');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send approval email');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-md rounded-lg p-6"
        >
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome, {user?.email}</h1>
          <p className="text-sm text-gray-500">
            View your projects and take action with ACTA tools.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white shadow-md rounded-lg p-6"
        >
          <h2 className="text-lg font-medium text-gray-700 mb-4">Your Projects</h2>
          <DynamoProjectsView
            userEmail={user?.email || ''}
            onProjectSelect={handleProjectSelect}
            selectedProjectId={selectedProjectId}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white shadow-md rounded-lg p-6"
        >
          <h2 className="text-lg font-medium text-gray-700 mb-4">ACTA Actions</h2>
          <ActaButtons
            onGenerate={handleGenerateActa}
            onDownloadPdf={() => handleDownload('pdf')}
            onDownloadWord={() => handleDownload('docx')}
            onPreviewPdf={handlePreview}
            onSendForApproval={() => setIsEmailDialogOpen(true)}
            disabled={!selectedProjectId || actionLoading}
          />
        </motion.div>
      </main>

      <Suspense fallback={<div>Loading preview...</div>}>
        {pdfPreviewUrl && (
          <PDFPreview
            isOpen={!!pdfPreviewUrl}
            pdfUrl={pdfPreviewUrl}
            fileName={pdfPreviewFileName}
            onClose={() => setPdfPreviewUrl(null)}
          />
        )}
      </Suspense>

      <EmailInputDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        onSubmit={handleSendApproval}
        loading={actionLoading}
        title="Send Approval Request"
        description={`Send approval for project: ${currentProjectName}`}
        placeholder="Enter client email address"
      />

      <ResponsiveIndicator />
    </div>
  );
}

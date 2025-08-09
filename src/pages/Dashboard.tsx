// src/pages/Dashboard.tsx — Regenerated PM Dashboard using Admin layout
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import ActaButtons from '@/components/ActaButtons/ActaButtons';
import DynamoProjectsView, { Project } from '@/components/DynamoProjectsView';
import { EmailInputDialog } from '@/components/EmailInputDialog';
import { CorsErrorBanner } from '@/components/ErrorHandling/CorsErrorBanner';
import Header from '@/components/Header';
import PDFPreview from '@/components/PDFPreview';
import { useAuth } from '@/hooks/useAuth';
import { useMetrics } from '@/hooks/useMetrics';
import {
  checkDocumentInS3,
  generateActaDocument,
  getDownloadLink,
  previewPdfBackend,
  sendApprovalEmail,
} from '@/lib/api';

export default function Dashboard(): JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const { trackAction } = useMetrics();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState({
    generating: false,
    downloadingWord: false,
    downloadingPdf: false,
    previewing: false,
    sendingApproval: false,
  });

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState<string>('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  const [corsError, setCorsError] = useState<Error | null>(null);

  // No auto-polling: generate is fire-and-forget only

  const handleProjectSelect = (project: Project) => {
    setSelectedProjectId(project.id);
    setCurrentProjectName(project.name);
    toast.success(`Selected project: ${project.name}`, {
      duration: 2000,
      icon: '✅',
    });
  };

  const handleGenerateActa = async () => {
    if (!selectedProjectId || !user?.email) {
      toast.error("Please select a project and ensure you're logged in.");
      return;
    }
    
    setActionLoading(prev => ({ ...prev, generating: true }));
    setCorsError(null);
    
    try {
      await trackAction('Generate ACTA', selectedProjectId, async () => {
        return await generateActaDocument(selectedProjectId, user.email, 'pm');
      });

  toast.success('Regenerating… You can preview/download when ready.', {
        duration: 5000,
        icon: '✅',
      });
    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        setCorsError(error);
      }
      toast.error(error?.message || 'Failed to generate ACTA', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, generating: false }));
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    
    const loadingKey = format === 'pdf' ? 'downloadingPdf' : 'downloadingWord';
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));
    setCorsError(null);
    
    try {
      // Quick pre-check; if not found, we still attempt backend which may redirect
      // to an existing artifact. This prevents false negatives when S3 listing lags.
      const check = await checkDocumentInS3(selectedProjectId, format).catch((err) => {
        console.error('Error checking document in S3:', err);
        return null;
      });
      if (check?.available === false || check?.status === "not_found") {
        toast("Generating or syncing… attempting direct download if available.", { icon: "⏳" });
      }

      const url = await trackAction(`Download ${format.toUpperCase()}`, selectedProjectId, async () => {
        return await getDownloadLink(selectedProjectId, format);
      });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `acta-${selectedProjectId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${format.toUpperCase()} download started successfully!`, {
        duration: 3000,
        icon: '📥',
      });
    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        setCorsError(error);
      }
      toast.error(error?.message || `Failed to download ${format.toUpperCase()}`, {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handlePreview = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    
    setActionLoading(prev => ({ ...prev, previewing: true }));
    setCorsError(null);
    
    try {
      // Pre-check; proceed anyway to allow backend to resolve redirects
      const check = await checkDocumentInS3(selectedProjectId, 'pdf').catch((err) => {
        console.error("Error checking document in S3 (preview):", err);
        return null;
      });
      if (check?.available === false || check?.status === "not_found") {
        toast("Generating or syncing… attempting live preview if available.", { icon: "⏳" });
      }

      await trackAction('Preview PDF', selectedProjectId, async () => {
        const url = await previewPdfBackend(selectedProjectId);
        setPdfPreviewUrl(url);
        setPdfPreviewFileName(`acta-${selectedProjectId}.pdf`);
        return url;
      });
      
      toast.success('Document preview loaded successfully!', {
        duration: 3000,
        icon: '👁️',
      });
    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        setCorsError(error);
      }
      toast.error(error?.message || 'Failed to preview document', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, previewing: false }));
    }
  };

  const handleSendApproval = async (email: string) => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    
    setActionLoading(prev => ({ ...prev, sendingApproval: true }));
    setCorsError(null);
    
    try {
      const result = await trackAction('Send Approval', selectedProjectId, async () => {
        return await sendApprovalEmail(selectedProjectId, email);
      });
      
      if (result.message) {
        toast.success('Approval email sent successfully!', {
          duration: 4000,
          icon: '📧',
        });
        setIsEmailDialogOpen(false);
      } else {
        toast.error('Failed to send approval email', {
          duration: 4000,
          icon: '❌',
        });
      }
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('network error')) {
        setCorsError(error);
        // Graceful fallback: open default mail client prefilled
        const subject = encodeURIComponent(`ACTA Approval Request • ${currentProjectName || 'Project'} (${selectedProjectId})`);
        const bodyLines = [
          `Hello,`,
          '',
          `Please review and approve the ACTA document for project: ${currentProjectName || 'N/A'} (${selectedProjectId}).`,
          '',
          'If the document is already generated, you can preview/download from the Acta Platform.',
          '',
          `Acta Platform: ${window.location.origin}`,
        ];
        const mailto = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
        window.location.href = mailto;
        toast('API connectivity issue detected (CORS). Opened your email client as a fallback.', { icon: '✉️' });
      }
      toast.error(error?.message || 'Failed to send approval email', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, sendingApproval: false }));
    }
  };

  if (authLoading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />

  <main className="max-w-7xl mx-auto p-8 space-y-8">
        {/* CORS Error Banner */}
        {corsError && (
          <CorsErrorBanner
            error={corsError}
            url={import.meta.env.VITE_API_BASE_URL}
            region={import.meta.env.VITE_AWS_REGION || import.meta.env.VITE_COGNITO_REGION}
            onRetry={() => setCorsError(null)}
            onDismiss={() => setCorsError(null)}
          />
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-surface/90 border border-borders/70 rounded-2xl p-8 shadow-sm backdrop-blur-md [box-shadow:0_10px_30px_-15px_rgba(var(--color-accent),.35)]"
        >
          <h1 className="text-lg font-semibold text-secondary mb-2">Welcome, {user?.email}</h1>
          <p className="text-sm text-body">
            View your projects and take action with ACTA tools.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-surface/90 border border-borders/70 rounded-2xl p-8 shadow-sm backdrop-blur-md"
        >
          <h2 className="text-lg font-semibold text-secondary mb-6">YOUR PROJECTS</h2>
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
          className="bg-surface/90 border border-borders/70 rounded-2xl p-8 shadow-sm backdrop-blur-md"
        >
          <h2 className="text-lg font-semibold text-secondary mb-6">ACTA ACTIONS</h2>
          <div className="md:sticky md:bottom-4">
            <ActaButtons
              onGenerate={handleGenerateActa}
              onDownloadPdf={() => handleDownload('pdf')}
              onDownloadWord={() => handleDownload('docx')}
              onPreviewPdf={handlePreview}
              onSendForApproval={() => setIsEmailDialogOpen(true)}
              disabled={!selectedProjectId || Object.values(actionLoading).some(Boolean)}
              isGenerating={actionLoading.generating}
              isDownloadingWord={actionLoading.downloadingWord}
              isDownloadingPdf={actionLoading.downloadingPdf}
              isPreviewingPdf={actionLoading.previewing}
              isSendingApproval={actionLoading.sendingApproval}
            />
          </div>
        </motion.div>
      </main>

      {pdfPreviewUrl && (
        <PDFPreview
          isOpen={!!pdfPreviewUrl}
          pdfUrl={pdfPreviewUrl}
          fileName={pdfPreviewFileName}
          onClose={() => setPdfPreviewUrl(null)}
        />
      )}

      <EmailInputDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        onSubmit={(email) => { void handleSendApproval(email); }}
        loading={actionLoading.sendingApproval}
        title="Send Approval Request"
        description={`Send approval for project: ${currentProjectName}`}
        placeholder="Enter client email address"
      />
    </div>
  );
}

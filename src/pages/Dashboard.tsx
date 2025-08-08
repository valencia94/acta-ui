// src/pages/Dashboard.tsx — Regenerated PM Dashboard using Admin layout
import { fetchAuthSession } from 'aws-amplify/auth';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import ActaButtons from '@/components/ActaButtons/ActaButtons';
import DynamoProjectsView from '@/components/DynamoProjectsView';
import { EmailInputDialog } from '@/components/EmailInputDialog';
import { CorsErrorBanner } from '@/components/ErrorHandling/CorsErrorBanner';
import Header from '@/components/Header';
import PDFPreview from '@/components/PDFPreview';
import ResponsiveIndicator from '@/components/ResponsiveIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useMetrics } from '@/hooks/useMetrics';
import {
  checkDocumentInS3,
  generateActaDocument,
  getDownloadUrl,
  sendApprovalEmail,
} from '@/lib/api';

export default function Dashboard() {
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

  // Local verification script for Cognito credentials
  useEffect(() => {
    fetchAuthSession().then((session) => {
      console.log('🧠 Identity ID:', (session?.credentials as any)?.identityId);
    }).catch((err) => {
      console.error('❌ Failed to get Cognito credentials:', err);
    });
  }, []);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentProjectName(projectId);
    toast.success(`Selected project: ${projectId}`, {
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
      
      toast.success("ACTA generation started successfully! You'll receive an email when ready.", {
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
      const url = await trackAction(`Download ${format.toUpperCase()}`, selectedProjectId, async () => {
        return await getDownloadUrl(selectedProjectId, format);
      });
      
      window.open(url, '_blank');
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
      await trackAction('Preview PDF', selectedProjectId, async () => {
        const check = await checkDocumentInS3(selectedProjectId, 'pdf');
        if (!check.available) {
          throw new Error('Document not ready, try Generate first.');
        }
        const url = await getDownloadUrl(selectedProjectId, 'pdf');
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
      if (error.message.includes('Document not ready')) {
        toast.error('Document not ready, try Generate first.', {
          duration: 4000,
          icon: '⏳',
        });
      } else {
        toast.error(error?.message || 'Failed to preview document', {
          duration: 4000,
          icon: '❌',
        });
      }
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
      if (error.message.includes('Failed to fetch')) {
        setCorsError(error);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto p-6 space-y-8">
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
          className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-white/50"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome, {user?.email}</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            View your projects and take action with ACTA tools.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-white/50"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Your Projects</h2>
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
          className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-white/50"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-8">ACTA Actions</h2>
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
        onSubmit={handleSendApproval}
        loading={actionLoading.sendingApproval}
        title="Send Approval Request"
        description={`Send approval for project: ${currentProjectName}`}
        placeholder="Enter client email address"
      />

      <ResponsiveIndicator />
    </div>
  );
}

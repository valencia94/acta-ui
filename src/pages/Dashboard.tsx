import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import ActaButtons from '@/components/ActaButtons';
import DynamoProjectsView, { Project } from '@/components/DynamoProjectsView';
import Header from '@/components/Header';
import PDFPreview from '@/components/PDFPreview';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard(): JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState<string>('');

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    toast.success(`Selected project: ${project.name}`, {
      duration: 2000,
      icon: '✅',
    });
  };

  if (authLoading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto p-6 space-y-8">
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
            selectedProjectId={selectedProject?.id || ''}
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
            project={{ id: selectedProject?.id || '' }}
            approvalEmail={selectedProject?.originalData?.pm_email}
            onPreviewOpen={(url) => {
              setPdfPreviewUrl(url);
              setPdfPreviewFileName(`acta-${selectedProject?.id}.pdf`);
            }}
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
    </div>
  );
}
